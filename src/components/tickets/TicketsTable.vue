<script setup lang="ts">
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import AppIcon from "@/components/AppIcon.vue";

export interface Ticket {
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

interface Props {
  tickets: Ticket[];
  loading?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  "view-ticket": [ticket: Ticket];
}>();

const getStatus = (s: string): { label: string; cls: string } => {
  switch (s) {
    case "active":     return { label: "Активен",  cls: "bg-yellow-100 text-yellow-700" };
    case "resolved":   return { label: "Решён",    cls: "bg-green-100 text-green-700"   };
    case "unresolved": return { label: "Не решён", cls: "bg-red-100 text-red-700"       };
    default:           return { label: "Закрыт",   cls: "bg-gray-100 text-gray-600"     };
  }
};

const getPriority = (p: string): { label: string; dot: string } => {
  switch (p) {
    case "urgent": return { label: "Срочный", dot: "bg-red-500"    };
    case "high":   return { label: "Высокий", dot: "bg-orange-500" };
    case "medium": return { label: "Средний", dot: "bg-yellow-500" };
    default:       return { label: "Низкий",  dot: "bg-green-500"  };
  }
};

const getSource = (s: string): { label: string; cls: string } => {
  switch (s) {
    case "telegram": return { label: "Telegram", cls: "text-blue-600 bg-blue-50"    };
    default:         return { label: "МАКС",     cls: "text-purple-600 bg-purple-50" };
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSourceIcon = (s: string): any => (s === "telegram" ? "send" : "message-circle");
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <!-- Table header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
      <h3 class="text-sm font-semibold text-gray-900">Список тикетов</h3>
      <span class="text-xs text-gray-400 font-medium">{{ tickets.length }} тикетов</span>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-100">
            <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Тикет</th>
            <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Клиент</th>
            <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Источник</th>
            <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Статус</th>
            <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Приоритет</th>
            <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide hidden md:table-cell">Назначен</th>
            <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide hidden lg:table-cell">Обновлён</th>
            <th class="px-4 py-2.5 w-10"></th>
          </tr>
        </thead>

        <tbody class="divide-y divide-gray-50">
          <!-- Loading -->
          <tr v-if="loading">
            <td colspan="8" class="px-4 py-10 text-center">
              <div class="flex items-center justify-center gap-2 text-gray-400">
                <AppIcon name="refresh-cw" :size="16" class="animate-spin" />
                <span class="text-sm">Загрузка...</span>
              </div>
            </td>
          </tr>

          <!-- Empty -->
          <tr v-else-if="tickets.length === 0">
            <td colspan="8" class="px-4 py-12 text-center">
              <div class="flex flex-col items-center gap-2">
                <AppIcon name="message-circle" :size="28" class="text-gray-300" />
                <span class="text-sm text-gray-400">Тикеты не найдены</span>
              </div>
            </td>
          </tr>

          <!-- Rows -->
          <tr
            v-else
            v-for="ticket in tickets"
            :key="ticket.id"
            class="hover:bg-gray-50 cursor-pointer transition-colors group"
            :class="{ 'bg-blue-50/50': ticket.isUnread }"
            @click="emit('view-ticket', ticket)"
          >
            <!-- Тикет -->
            <td class="px-4 py-3">
              <div class="flex items-center gap-2.5">
                <!-- Unread dot -->
                <div
                  class="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-opacity"
                  :class="ticket.isUnread ? 'bg-blue-500' : 'bg-transparent'"
                />
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-mono text-gray-400">#{{ ticket.number }}</span>
                    <span
                      v-if="ticket.messagesCount > 0"
                      class="inline-flex items-center gap-1 text-xs text-gray-400"
                    >
                      <AppIcon name="message-square" :size="11" />
                      {{ ticket.messagesCount }}
                    </span>
                  </div>
                  <div class="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                    {{ ticket.subject }}
                  </div>
                  <div class="text-xs text-gray-400 truncate max-w-[180px]">
                    {{ ticket.lastMessage }}
                  </div>
                </div>
              </div>
            </td>

            <!-- Клиент -->
            <td class="px-4 py-3">
              <div class="text-sm font-medium text-gray-900">{{ ticket.clientName }}</div>
              <div v-if="ticket.clientPhone" class="text-xs text-gray-400">{{ ticket.clientPhone }}</div>
            </td>

            <!-- Источник -->
            <td class="px-4 py-3">
              <div
                class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium"
                :class="getSource(ticket.source).cls"
              >
                <AppIcon :name="getSourceIcon(ticket.source)" :size="12" />
                {{ getSource(ticket.source).label }}
              </div>
            </td>

            <!-- Статус -->
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                :class="getStatus(ticket.status).cls"
              >
                {{ getStatus(ticket.status).label }}
              </span>
            </td>

            <!-- Приоритет -->
            <td class="px-4 py-3">
              <div class="flex items-center gap-1.5">
                <div
                  class="w-2 h-2 rounded-full flex-shrink-0"
                  :class="getPriority(ticket.priority).dot"
                />
                <span class="text-xs text-gray-700">{{ getPriority(ticket.priority).label }}</span>
              </div>
            </td>

            <!-- Назначен -->
            <td class="px-4 py-3 hidden md:table-cell">
              <span class="text-sm text-gray-600">
                {{ ticket.assignedTo || "—" }}
              </span>
            </td>

            <!-- Обновлён -->
            <td class="px-4 py-3 hidden lg:table-cell">
              <div class="text-xs text-gray-600">
                {{ format(new Date(ticket.updatedAt), "dd.MM.yyyy", { locale: ru }) }}
              </div>
              <div class="text-xs text-gray-400">
                {{ format(new Date(ticket.updatedAt), "HH:mm", { locale: ru }) }}
              </div>
            </td>

            <!-- Действие -->
            <td class="px-4 py-3 text-right">
              <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                <AppIcon name="chevron-right" :size="16" class="text-gray-400" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
