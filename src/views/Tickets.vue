<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import AppIcon from "@/components/AppIcon.vue";
import TicketsStats from "@/components/tickets/TicketsStats.vue";
import TicketsFilters from "@/components/tickets/TicketsFilters.vue";
import TicketsTable from "@/components/tickets/TicketsTable.vue";
import type { Ticket } from "@/components/tickets/TicketsTable.vue";
import type { TicketsFilters as TFilters } from "@/components/tickets/TicketsFilters.vue";
import { leadsApi } from "@/services/leadsApi";
import type { Lead, LeadStatus, LeadsParams } from "@/services/leadsApi";
import { useGlobalWs } from "@/composables/useGlobalWs";
import type { GwsEvent } from "@/composables/useGlobalWs";

const router = useRouter();
const { addListener } = useGlobalWs();

// ── Маппинг Lead → Ticket ────────────────────────────────────────────────────

function mapStatus(s: LeadStatus): Ticket["status"] {
  if (!s.is_final) return "active";
  const n = s.name.toLowerCase();
  if (n.includes("не реш") || n.includes("unresolved")) return "unresolved";
  if (n.includes("реш") || n.includes("resolved")) return "resolved";
  return "closed";
}

function leadToTicket(lead: Lead): Ticket {
  const client = lead.client;
  const clientName =
    client?.full_name || client?.name || lead.source_name || `Клиент #${lead.client_id ?? lead.id}`;
  const assignedName = lead.assigned_to
    ? [lead.assigned_to.first_name, lead.assigned_to.last_name]
        .filter(Boolean)
        .join(" ") || lead.assigned_to.login
    : undefined;

  return {
    id: String(lead.id),
    number: lead.id,
    clientName,
    clientPhone: client?.phone,
    clientLinked: lead.client_id != null,
    telegramId: client?.telegram_id
      ? String(client.telegram_id)
      : lead.source_type === "telegram" && lead.source_id
        ? lead.source_id
        : undefined,
    telegramUsername: lead.source_username ?? null,
    status: mapStatus(lead.status),
    priority: "medium",
    source: lead.source_type === "telegram" ? "telegram" : "max",
    subject: (lead.notes || "").split("\n").filter((l: string) => !l.startsWith("[Status changed")).join("\n").trim().slice(0, 60) || `Тикет #${lead.id}`,
    lastMessage: lead.notes || "—",
    assignedTo: assignedName,
    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
    resolvedAt: lead.status.is_final ? lead.updated_at : undefined,
    messagesCount: 0,
    isUnread: lead.is_new,
    isNew: lead.is_new,
  };
}

// ── WS — обработчик обновлений списка (бейдж и тосты — в useGlobalWs) ─────────

/** Предотвращает двойную обработку параллельных new_lead событий */
const pendingNewLeadIds = new Set<number>();

const handleWsEvent = async (data: GwsEvent) => {
  if (data.type === "new_lead") {
    if (tickets.value.some((t) => t.id === String(data.lead_id))) return;
    if (pendingNewLeadIds.has(data.lead_id)) return;
    pendingNewLeadIds.add(data.lead_id);
    try {
      const lead = await leadsApi.getById(data.lead_id);
      // Повторная проверка после await — мог успеть добавиться параллельным вызовом
      if (tickets.value.some((t) => t.id === String(data.lead_id))) return;
      if (page.value === 1) {
        tickets.value.unshift(leadToTicket(lead));
        if (!isClientFiltered.value && tickets.value.length > PAGE_SIZE)
          tickets.value.pop();
      }
      total.value += 1;
    } catch { /* не удалось загрузить лид */ }
    finally { pendingNewLeadIds.delete(data.lead_id); }

  } else if (data.type === "new_message") {
    const t = tickets.value.find((t) => t.id === String(data.lead_id));
    if (data.direction === "outgoing") {
      if (t) t.isNew = false;
    } else {
      if (t) {
        t.isNew = true;
        t.isUnread = true;
        t.lastMessage = data.content;
        t.updatedAt = data.timestamp ?? new Date().toISOString();
      }
    }

  } else if (data.type === "lead_updated") {
    const t = tickets.value.find((t) => t.id === String(data.lead_id));
    if (t && data.is_new === false) t.isNew = false;

  } else if (data.type === "lead_status_changed") {
    const t = tickets.value.find((t) => t.id === String(data.lead_id));
    if (t) {
      t.status = mapStatus(data.status);
      if (data.is_new === false) t.isNew = false;
    }
  }
};

// ── Данные ───────────────────────────────────────────────────────────────────

const tickets = ref<Ticket[]>([]);
const isLoading = ref(false);
const error = ref("");

// ── Фильтры ──────────────────────────────────────────────────────────────────

const filters = ref<TFilters>({
  search: "",
  status: "all",
  source: "all",
  assignedTo: "all",
  dateFrom: "",
  dateTo: "",
});

/** Клиентская фильтрация: только поиск и источник */
const filteredTickets = computed(() => {
  let result = tickets.value;

  if (filters.value.search) {
    const q = filters.value.search.toLowerCase();
    result = result.filter(
      (t) =>
        t.number.toString().includes(q) ||
        t.clientName.toLowerCase().includes(q) ||
        (t.telegramUsername ?? "").toLowerCase().includes(q.replace(/^@/, "")) ||
        (t.telegramId ?? "").toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q)
    );
  }

  if (filters.value.source !== "all")
    result = result.filter((t) => t.source === filters.value.source);

  return result;
});

// ── Статистика ───────────────────────────────────────────────────────────────

const apiStats = ref<{ active: number; closed: number } | null>(null);

const stats = computed(() => {
  const a = apiStats.value?.active ?? 0;
  const c = apiStats.value?.closed ?? 0;
  return { total: a + c, active: a, closed: c };
});

const loadStats = async () => {
  try {
    apiStats.value = await leadsApi.getStats();
  } catch { /* ignore */ }
};

// ── Пагинация ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
const page      = ref(1);
const total     = ref(0); // total от сервера

/** Поиск / фильтр источника активны → грузим 500 и режем на клиенте */
const isClientFiltered = computed(() =>
  filters.value.search !== "" || filters.value.source !== "all"
);

const displayTotal = computed(() =>
  isClientFiltered.value ? filteredTickets.value.length : total.value
);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(displayTotal.value / PAGE_SIZE))
);

const paginatedTickets = computed(() => {
  if (isClientFiltered.value) {
    const start = (page.value - 1) * PAGE_SIZE;
    return filteredTickets.value.slice(start, start + PAGE_SIZE);
  }
  return tickets.value; // сервер уже вернул нужную страницу
});

// Счётчик «новых» на текущей странице (для заголовка)
const unreadCount = computed(
  () => tickets.value.filter((t) => t.isNew).length
);

const showStatsPanel = ref(false);

// ── Загрузка ─────────────────────────────────────────────────────────────────

const loadTickets = async () => {
  isLoading.value = true;
  error.value = "";
  try {
    const params: LeadsParams = {};
    // Серверные фильтры
    if (filters.value.status === "active")  params.is_closed = false;
    else if (filters.value.status === "closed") params.is_closed = true;
    if (filters.value.dateFrom) params.date_from = filters.value.dateFrom + "T00:00:00";
    if (filters.value.dateTo)   params.date_to   = filters.value.dateTo   + "T23:59:59";

    if (isClientFiltered.value) {
      // Клиентский поиск: грузим все подходящие (до 500) для фильтрации
      params.limit = 500;
    } else {
      // Серверная пагинация
      params.skip  = (page.value - 1) * PAGE_SIZE;
      params.limit = PAGE_SIZE;
    }

    const res = await leadsApi.getList(params);
    tickets.value = res.leads.map(leadToTicket);
    total.value   = res.total;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Ошибка загрузки";
  } finally {
    isLoading.value = false;
  }
};

// Смена страницы в серверном режиме → перезагружаем
watch(page, () => {
  if (!isClientFiltered.value) loadTickets();
});

// Серверные фильтры (статус, даты) → сброс страницы + перезагрузка
watch(
  () => [filters.value.status, filters.value.dateFrom, filters.value.dateTo] as const,
  () => { page.value = 1; loadTickets(); },
);

// Клиентские фильтры (поиск, источник) → сброс страницы; при переключении в/из режима → перезагрузка
watch(isClientFiltered, () => { page.value = 1; loadTickets(); });
watch(() => filters.value.search,  () => { page.value = 1; });
watch(() => filters.value.source,  () => { page.value = 1; });

const refresh = () => loadTickets();

const openTicket = (ticket: Ticket) => {
  router.push(`/tickets/${ticket.id}`);
};

let removeWsListener: (() => void) | null = null;

onMounted(async () => {
  await Promise.all([loadTickets(), loadStats()]);
  removeWsListener = addListener(handleWsEvent);
});

onUnmounted(() => {
  removeWsListener?.();
});
</script>

<template>
  <div class="h-full overflow-hidden flex flex-col bg-gray-50">
    <!-- Header -->
    <div
      class="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex-shrink-0"
    >
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-lg font-semibold text-gray-900">Тикеты</h1>
              <span
                v-if="unreadCount > 0"
                class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white"
              >
                {{ unreadCount }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            @click="showStatsPanel = !showStatsPanel"
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors"
            :class="
              showStatsPanel
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'text-gray-700 border-gray-200 hover:bg-gray-50'
            "
            title="Статистика"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span class="hidden sm:inline">Статистика</span>
          </button>
          <button
            @click="refresh"
            :disabled="isLoading"
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <AppIcon
              name="refresh-cw"
              :size="14"
              :class="{ 'animate-spin': isLoading }"
            />
            <span class="hidden sm:inline">Обновить</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
      <Transition name="fold">
        <div v-if="showStatsPanel">
          <TicketsStats :stats="stats" />
        </div>
      </Transition>

      <TicketsFilters
        :filters="filters"
        @update:filters="(v) => (filters = v)"
      />

      <TicketsTable
        :tickets="paginatedTickets"
        :loading="isLoading"
        :page="page"
        :total-pages="totalPages"
        :total-count="displayTotal"
        @view-ticket="openTicket"
        @update:page="page = $event"
      />
    </div>
  </div>
</template>

<style scoped>
.fold-enter-active {
  transition: all 200ms ease-out;
  overflow: hidden;
}
.fold-leave-active {
  transition: all 150ms ease-in;
  overflow: hidden;
}
.fold-enter-from,
.fold-leave-to {
  opacity: 0;
  max-height: 0;
}
.fold-enter-to,
.fold-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
