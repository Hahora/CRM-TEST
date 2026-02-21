<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import AppIcon from "@/components/AppIcon.vue";
import TicketsStats from "@/components/tickets/TicketsStats.vue";
import TicketsFilters from "@/components/tickets/TicketsFilters.vue";
import TicketsTable from "@/components/tickets/TicketsTable.vue";
import type { Ticket } from "@/components/tickets/TicketsTable.vue";
import type { TicketsFilters as TFilters } from "@/components/tickets/TicketsFilters.vue";

const router = useRouter();

// ── Данные ──────────────────────────────────────────────────────────────────

const tickets = ref<Ticket[]>([
  {
    id: "1",
    number: 26,
    clientName: "Nomadd Proger",
    clientPhone: "tg_529349234S",
    telegramId: "529349234S",
    status: "active",
    priority: "high",
    source: "telegram",
    subject: "Проблема с заказом",
    lastMessage: "Админ просыпаемся!",
    assignedTo: "Admin User",
    createdAt: "2024-01-07T22:44:08",
    updatedAt: "2024-01-07T22:44:08",
    messagesCount: 3,
    isUnread: true,
  },
  {
    id: "2",
    number: 25,
    clientName: "Иван Сидоров",
    clientPhone: "+7 (903) 456-78-90",
    maxId: "max_user_123",
    status: "resolved",
    priority: "medium",
    source: "max",
    subject: "Вопрос по доставке",
    lastMessage: "Спасибо за помощь!",
    assignedTo: "Анна Смирнова",
    createdAt: "2024-01-07T15:20:00",
    updatedAt: "2024-01-07T16:45:00",
    resolvedAt: "2024-01-07T16:45:00",
    messagesCount: 8,
    isUnread: false,
  },
  {
    id: "3",
    number: 24,
    clientName: "Мария Петрова",
    clientPhone: "tg_987654321",
    telegramId: "987654321",
    status: "unresolved",
    priority: "urgent",
    source: "telegram",
    subject: "Срочная проблема с оплатой",
    lastMessage: "Когда будет решение?",
    assignedTo: "Иван Петров",
    createdAt: "2024-01-07T10:15:00",
    updatedAt: "2024-01-07T18:30:00",
    messagesCount: 12,
    isUnread: true,
  },
  {
    id: "4",
    number: 23,
    clientName: "Алексей Козлов",
    clientPhone: "+7 (912) 345-67-89",
    maxId: "max_user_456",
    status: "closed",
    priority: "low",
    source: "max",
    subject: "Информация о товаре",
    lastMessage: "Вопрос решён, спасибо",
    assignedTo: "Пётр Николаев",
    createdAt: "2024-01-06T14:30:00",
    updatedAt: "2024-01-07T09:15:00",
    resolvedAt: "2024-01-07T09:15:00",
    messagesCount: 5,
    isUnread: false,
  },
  {
    id: "5",
    number: 22,
    clientName: "Елена Волкова",
    clientPhone: "tg_555666777",
    telegramId: "555666777",
    status: "active",
    priority: "medium",
    source: "telegram",
    subject: "Консультация по услугам",
    lastMessage: "Жду ответа",
    createdAt: "2024-01-07T08:45:00",
    updatedAt: "2024-01-07T12:20:00",
    messagesCount: 6,
    isUnread: true,
  },
]);

const isLoading = ref(false);

// ── Фильтры ──────────────────────────────────────────────────────────────────

const filters = ref<TFilters>({
  search: "",
  status: "all",
  source: "all",
  priority: "all",
  assignedTo: "all",
  dateFrom: "",
  dateTo: "",
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

  if (filters.value.status !== "all") {
    result = result.filter((t) => t.status === filters.value.status);
  }

  if (filters.value.source !== "all") {
    result = result.filter((t) => t.source === filters.value.source);
  }

  if (filters.value.priority !== "all") {
    result = result.filter((t) => t.priority === filters.value.priority);
  }

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
            return sum + (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) / 60000;
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

// ── Действия ─────────────────────────────────────────────────────────────────

const refresh = async () => {
  isLoading.value = true;
  await new Promise((r) => setTimeout(r, 800));
  isLoading.value = false;
};

const openTicket = (ticket: Ticket) => {
  router.push(`/tickets/${ticket.id}`);
};

onMounted(() => {
  // загрузка данных
});
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
