<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import AppIcon from "@/components/AppIcon.vue";
import TicketsFilters from "@/components/tickets/TicketsFilters.vue";
import TicketsTable from "@/components/tickets/TicketsTable.vue";
import TicketsStats from "@/components/tickets/TicketsStats.vue";
import DevelopmentBanner from "@/components/DevelopmentBanner.vue";

import { useRouter } from "vue-router";

interface Ticket {
  id: string;
  number: number;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  telegramId?: string;
  maxId?: string;
  status: "active" | "resolved" | "unresolved" | "closed";
  priority: "urgent" | "high" | "medium" | "low";
  source: "telegram" | "max";
  subject: string;
  lastMessage: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  messagesCount: number;
  isUnread: boolean;
}

interface TicketsFilters {
  search: string;
  status: string;
  source: string;
  priority: string;
  assignedTo: string;
  dateFrom: string;
  dateTo: string;
}

const router = useRouter();

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
    lastMessage: "Вопрос решен, спасибо",
    assignedTo: "Петр Николаев",
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

const filters = ref<TicketsFilters>({
  search: "",
  status: "all",
  source: "all",
  priority: "all",
  assignedTo: "all",
  dateFrom: "",
  dateTo: "",
});

const isLoading = ref(false);

const filteredTickets = computed(() => {
  let result = tickets.value;

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase();
    result = result.filter(
      (ticket) =>
        ticket.number.toString().includes(search) ||
        ticket.clientName.toLowerCase().includes(search) ||
        ticket.subject.toLowerCase().includes(search) ||
        ticket.lastMessage.toLowerCase().includes(search)
    );
  }

  if (filters.value.status !== "all") {
    result = result.filter((ticket) => ticket.status === filters.value.status);
  }

  if (filters.value.source !== "all") {
    result = result.filter((ticket) => ticket.source === filters.value.source);
  }

  if (filters.value.priority !== "all") {
    result = result.filter(
      (ticket) => ticket.priority === filters.value.priority
    );
  }

  if (filters.value.assignedTo !== "all") {
    result = result.filter(
      (ticket) => ticket.assignedTo === filters.value.assignedTo
    );
  }

  return result;
});

const ticketsStats = computed(() => {
  const total = filteredTickets.value.length;
  const active = filteredTickets.value.filter(
    (t) => t.status === "active"
  ).length;
  const resolved = filteredTickets.value.filter(
    (t) => t.status === "resolved"
  ).length;
  const unresolved = filteredTickets.value.filter(
    (t) => t.status === "unresolved"
  ).length;
  const closed = filteredTickets.value.filter(
    (t) => t.status === "closed"
  ).length;
  const urgent = filteredTickets.value.filter(
    (t) => t.priority === "urgent"
  ).length;
  const high = filteredTickets.value.filter(
    (t) => t.priority === "high"
  ).length;

  // Рассчитаем среднее время ответа (примерная логика)
  const avgResponseTime = calculateAvgResponseTime();

  return {
    total,
    active,
    resolved,
    unresolved,
    closed,
    urgent,
    high,
    avgResponseTime,
  };
});

// Добавьте вспомогательную функцию
const calculateAvgResponseTime = (): number => {
  // Примерная логика расчета среднего времени ответа
  // В реальном приложении нужно считать разницу между сообщениями
  const resolvedTickets = filteredTickets.value.filter(
    (t) => t.status === "resolved" && t.resolvedAt && t.createdAt
  );

  if (resolvedTickets.length === 0) return 0;

  let totalMinutes = 0;
  resolvedTickets.forEach((ticket) => {
    if (ticket.resolvedAt && ticket.createdAt) {
      const created = new Date(ticket.createdAt).getTime();
      const resolved = new Date(ticket.resolvedAt).getTime();
      totalMinutes += (resolved - created) / (1000 * 60); // минуты
    }
  });

  return Math.round(totalMinutes / resolvedTickets.length);
};

const handleUpdateFilters = (newFilters: TicketsFilters) => {
  filters.value = { ...newFilters };
};

const refreshData = async () => {
  isLoading.value = true;
  await new Promise((resolve) => setTimeout(resolve, 1000));
  isLoading.value = false;
};

const exportTickets = () => {
  console.log("Экспорт тикетов");
};

const openTicketChat = (ticket: Ticket) => {
  router.push(`/tickets/${ticket.id}`);
};

onMounted(() => {
  // ...
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <DevelopmentBanner />

    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-4 md:py-6">
      <div
        class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Тикеты</h1>
          <p class="text-sm md:text-base text-gray-600 mt-1">
            Система поддержки клиентов через Telegram и МАКС
          </p>
        </div>
        <div class="flex items-center gap-2 md:gap-3">
          <button
            @click="exportTickets"
            class="px-3 py-2 md:px-4 md:py-2 border border-gray-300 text-gray-700 text-xs md:text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1 md:gap-2"
          >
            <AppIcon name="file-text" :size="14" class="md:w-4 md:h-4" />
            <span class="hidden sm:inline">Экспорт</span>
          </button>
          <button
            @click="refreshData"
            :disabled="isLoading"
            class="px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white text-xs md:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2"
          >
            <AppIcon
              name="refresh-cw"
              :size="14"
              class="[ 'transition-transform md:w-4 md:h-4', { 'animate-spin': isLoading }, ]"
            />
            <span class="hidden sm:inline">{{
              isLoading ? "Обновление..." : "Обновить"
            }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="p-4 md:p-6 space-y-6">
      <div
        v-if="isLoading"
        class="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center"
      >
        <div class="bg-white rounded-lg p-6 flex items-center gap-3 shadow-lg">
          <AppIcon
            name="refresh-cw"
            :size="20"
            class="animate-spin text-blue-600"
          />
          <span class="text-gray-700 font-medium"
            >Обновление данных тикетов...</span
          >
        </div>
      </div>

      <TicketsStats :stats="ticketsStats" />
      <TicketsFilters
        :filters="filters"
        @update:filters="handleUpdateFilters"
      />

      <TicketsTable
        :tickets="filteredTickets"
        :loading="isLoading"
        @view-ticket="openTicketChat"
      />
    </div>
  </div>
</template>
