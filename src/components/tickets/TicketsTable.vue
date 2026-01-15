<script setup lang="ts">
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import AppIcon from "@/components/AppIcon.vue";

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

interface Props {
  tickets: Ticket[];
  loading?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  "view-ticket": [ticket: Ticket];
}>();

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-yellow-100 text-yellow-800";
    case "resolved":
      return "bg-green-100 text-green-800";
    case "unresolved":
      return "bg-red-100 text-red-800";
    case "closed":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "active":
      return "Активен";
    case "resolved":
      return "Решен";
    case "unresolved":
      return "Не решен";
    case "closed":
      return "Закрыт";
    default:
      return "Неизвестно";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "text-red-600";
    case "high":
      return "text-orange-600";
    case "medium":
      return "text-yellow-600";
    case "low":
      return "text-green-600";
    default:
      return "text-gray-600";
  }
};

const getPriorityText = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "Срочный";
    case "high":
      return "Высокий";
    case "medium":
      return "Средний";
    case "low":
      return "Низкий";
    default:
      return "Неизвестно";
  }
};

const getSourceIcon = (source: string) => {
  switch (source) {
    case "telegram":
      return "send";
    case "max":
      return "message-circle";
    default:
      return "message-circle";
  }
};

const getSourceColor = (source: string) => {
  switch (source) {
    case "telegram":
      return "text-blue-600 bg-blue-50";
    case "max":
      return "text-purple-600 bg-purple-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

const getSourceText = (source: string) => {
  switch (source) {
    case "telegram":
      return "Telegram";
    case "max":
      return "МАКС";
    default:
      return "Неизвестно";
  }
};
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-900">Список тикетов</h3>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Тикет
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Клиент
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Источник
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Статус
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Приоритет
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Назначен
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Обновлен
            </th>
            <th
              class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Действия
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="loading" class="animate-pulse">
            <td colspan="8" class="px-6 py-4 text-center text-gray-500">
              <div class="flex items-center justify-center gap-2">
                <AppIcon name="refresh-cw" :size="16" class="animate-spin" />
                Загрузка тикетов...
              </div>
            </td>
          </tr>

          <tr v-else-if="tickets.length === 0">
            <td colspan="8" class="px-6 py-8 text-center text-gray-500">
              <div class="flex flex-col items-center gap-2">
                <AppIcon
                  name="message-circle"
                  :size="24"
                  class="text-gray-400"
                />
                <span>Тикеты не найдены</span>
              </div>
            </td>
          </tr>

          <tr
            v-else
            v-for="ticket in tickets"
            :key="ticket.id"
            class="hover:bg-gray-50 cursor-pointer transition-colors"
            :class="{ 'bg-blue-50': ticket.isUnread }"
            @click="emit('view-ticket', ticket)"
          >
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-900"
                    >#{{ ticket.number }}</span
                  >
                  <div
                    v-if="ticket.isUnread"
                    class="w-2 h-2 bg-blue-500 rounded-full"
                  ></div>
                </div>
                <div>
                  <div
                    class="text-sm font-medium text-gray-900 truncate max-w-[200px]"
                  >
                    {{ ticket.subject }}
                  </div>
                  <div class="text-xs text-gray-500 truncate max-w-[200px]">
                    {{ ticket.lastMessage }}
                  </div>
                </div>
              </div>
            </td>

            <td class="px-6 py-4">
              <div>
                <div class="text-sm font-medium text-gray-900">
                  {{ ticket.clientName }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ ticket.clientPhone }}
                </div>
              </div>
            </td>

            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <div
                  :class="[
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    getSourceColor(ticket.source),
                  ]"
                >
                  <AppIcon :name="getSourceIcon(ticket.source)" :size="16" />
                </div>
                <span class="text-sm text-gray-900">{{
                  getSourceText(ticket.source)
                }}</span>
              </div>
            </td>

            <td class="px-6 py-4">
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  getStatusColor(ticket.status),
                ]"
              >
                {{ getStatusText(ticket.status) }}
              </span>
            </td>

            <td class="px-6 py-4">
              <span
                :class="[
                  'text-sm font-medium',
                  getPriorityColor(ticket.priority),
                ]"
              >
                {{ getPriorityText(ticket.priority) }}
              </span>
            </td>

            <td class="px-6 py-4">
              <div class="text-sm text-gray-900">
                {{ ticket.assignedTo || "Не назначен" }}
              </div>
            </td>

            <td class="px-6 py-4">
              <div class="text-sm text-gray-900">
                {{
                  format(new Date(ticket.updatedAt), "dd.MM.yyyy", {
                    locale: ru,
                  })
                }}
              </div>
              <div class="text-xs text-gray-500">
                {{
                  format(new Date(ticket.updatedAt), "HH:mm", { locale: ru })
                }}
              </div>
            </td>

            <td class="px-6 py-4 text-right">
              <button
                @click.stop="emit('view-ticket', ticket)"
                class="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Открыть
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
