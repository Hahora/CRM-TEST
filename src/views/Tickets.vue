<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import AppIcon from "@/components/AppIcon.vue";
import TicketsStats from "@/components/tickets/TicketsStats.vue";
import TicketsFilters from "@/components/tickets/TicketsFilters.vue";
import TicketsTable from "@/components/tickets/TicketsTable.vue";
import type { Ticket } from "@/components/tickets/TicketsTable.vue";
import type { TicketsFilters as TFilters } from "@/components/tickets/TicketsFilters.vue";
import { leadsApi } from "@/services/leadsApi";
import type { Lead, LeadStatus } from "@/services/leadsApi";

const router = useRouter();

// ── Маппинг Lead → Ticket ────────────────────────────────────────────────────

function mapStatus(s: LeadStatus): Ticket["status"] {
  if (!s.is_final) return "active";
  const n = s.name.toLowerCase();
  if (n.includes("не реш") || n.includes("unresolved")) return "unresolved";
  if (n.includes("реш")    || n.includes("resolved"))   return "resolved";
  return "closed";
}

function leadToTicket(lead: Lead): Ticket {
  const clientName =
    lead.client.full_name || lead.client.name || `Клиент #${lead.client_id}`;
  const assignedName = lead.assigned_to
    ? [lead.assigned_to.first_name, lead.assigned_to.last_name]
        .filter(Boolean).join(" ") || lead.assigned_to.login
    : undefined;

  return {
    id:           String(lead.id),
    number:       lead.id,
    clientName,
    clientPhone:  lead.client.phone,
    telegramId:   lead.client.telegram_id ? String(lead.client.telegram_id) : undefined,
    status:       mapStatus(lead.status),
    priority:     "medium",
    source:       lead.source_type === "telegram" ? "telegram" : "max",
    subject:      lead.notes?.slice(0, 60) || `Лид #${lead.id}`,
    lastMessage:  lead.notes || "—",
    assignedTo:   assignedName,
    createdAt:    lead.created_at,
    updatedAt:    lead.updated_at,
    resolvedAt:   lead.status.is_final ? lead.updated_at : undefined,
    messagesCount: 0,
    isUnread:     !lead.status.is_final,
  };
}

// ── Данные ───────────────────────────────────────────────────────────────────

const tickets  = ref<Ticket[]>([]);
const isLoading = ref(false);
const error    = ref("");

// ── Фильтры ──────────────────────────────────────────────────────────────────

const filters = ref<TFilters>({
  search:     "",
  status:     "all",
  source:     "all",
  priority:   "all",
  assignedTo: "all",
  dateFrom:   "",
  dateTo:     "",
});

const filteredTickets = computed(() => {
  let result = tickets.value;

  if (filters.value.search) {
    const q = filters.value.search.toLowerCase();
    result = result.filter(
      (t) =>
        t.number.toString().includes(q) ||
        t.clientName.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.lastMessage.toLowerCase().includes(q)
    );
  }

  if (filters.value.status !== "all")
    result = result.filter((t) => t.status === filters.value.status);

  if (filters.value.source !== "all")
    result = result.filter((t) => t.source === filters.value.source);

  if (filters.value.priority !== "all")
    result = result.filter((t) => t.priority === filters.value.priority);

  if (filters.value.dateFrom) {
    const from = new Date(filters.value.dateFrom).getTime();
    result = result.filter((t) => new Date(t.createdAt).getTime() >= from);
  }

  if (filters.value.dateTo) {
    const to = new Date(filters.value.dateTo).getTime() + 86400000;
    result = result.filter((t) => new Date(t.createdAt).getTime() <= to);
  }

  return result;
});

// ── Статистика ───────────────────────────────────────────────────────────────

const stats = computed(() => {
  const all = tickets.value;
  const resolved = all.filter((t) => t.status === "resolved");
  const avgResponseTime =
    resolved.length > 0
      ? Math.round(
          resolved.reduce((sum, t) => {
            if (!t.resolvedAt) return sum;
            return (
              sum +
              (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) /
                60000
            );
          }, 0) / resolved.length
        )
      : 0;

  return {
    total:           all.length,
    active:          all.filter((t) => t.status === "active").length,
    resolved:        resolved.length,
    unresolved:      all.filter((t) => t.status === "unresolved").length,
    closed:          all.filter((t) => t.status === "closed").length,
    urgent:          all.filter((t) => t.priority === "urgent").length,
    high:            all.filter((t) => t.priority === "high").length,
    avgResponseTime,
  };
});

const unreadCount = computed(() => tickets.value.filter((t) => t.isUnread).length);

// ── Загрузка ─────────────────────────────────────────────────────────────────

const loadTickets = async () => {
  isLoading.value = true;
  error.value = "";
  try {
    const res = await leadsApi.getList({ limit: 200 });
    tickets.value = res.leads.map(leadToTicket);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Ошибка загрузки";
  } finally {
    isLoading.value = false;
  }
};

const refresh = () => loadTickets();

const openTicket = (ticket: Ticket) => {
  router.push(`/tickets/${ticket.id}`);
};

onMounted(loadTickets);
</script>

<template>
  <div class="h-full overflow-hidden flex flex-col bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex-shrink-0">
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
            <p class="text-xs text-gray-500 mt-0.5">
              Поддержка клиентов через Telegram и МАКС
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
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
      <TicketsStats :stats="stats" />

      <TicketsFilters
        :filters="filters"
        @update:filters="(v) => (filters = v)"
      />

      <TicketsTable
        :tickets="filteredTickets"
        :loading="isLoading"
        @view-ticket="openTicket"
      />
    </div>
  </div>
</template>
