<script setup lang="ts">
import { ref, computed, watch } from "vue";
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

const props = defineProps<Props>();

const emit = defineEmits<{
  "view-ticket": [ticket: Ticket];
}>();

const PAGE_SIZE = 20;
const currentPage = ref(1);

watch(() => props.tickets.length, () => { currentPage.value = 1; });

const totalPages = computed(() => Math.max(1, Math.ceil(props.tickets.length / PAGE_SIZE)));

const paginated = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return props.tickets.slice(start, start + PAGE_SIZE);
});

const getSource = (s: string): { label: string; cls: string } => {
  if (s === "telegram") return { label: "Telegram", cls: "text-blue-600 bg-blue-50"    };
  return                        { label: "МАКС",     cls: "text-purple-600 bg-purple-50" };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSourceIcon = (s: string): any => (s === "telegram" ? "send" : "message-circle");
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
      <h3 class="text-sm font-semibold text-gray-900">Список тикетов</h3>
      <span class="text-xs text-gray-400 font-medium">{{ tickets.length }} тикетов</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-10 flex items-center justify-center gap-2 text-gray-400">
      <AppIcon name="refresh-cw" :size="16" class="animate-spin" />
      <span class="text-sm">Загрузка...</span>
    </div>

    <!-- Empty -->
    <div v-else-if="tickets.length === 0" class="py-12 flex flex-col items-center gap-2">
      <AppIcon name="message-circle" :size="28" class="text-gray-300" />
      <span class="text-sm text-gray-400">Тикеты не найдены</span>
    </div>

    <template v-else>
      <!-- ── Мобильные карточки (< md) ── -->
      <div class="md:hidden divide-y divide-gray-100">
        <div
          v-for="ticket in paginated"
          :key="ticket.id"
          class="px-4 py-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
          :class="{ 'bg-blue-50/40': ticket.isUnread }"
          @click="emit('view-ticket', ticket)"
        >
          <div class="flex items-start gap-2">
            <!-- Unread dot -->
            <div
              class="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
              :class="ticket.isUnread ? 'bg-blue-500' : 'bg-transparent'"
            />
            <div class="min-w-0 flex-1">
              <!-- Badges -->
              <div class="flex items-center gap-1.5 flex-wrap mb-1">
                <span class="text-xs font-mono text-gray-400">#{{ ticket.number }}</span>
                <span
                  class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium"
                  :class="getSource(ticket.source).cls"
                >
                  <AppIcon :name="getSourceIcon(ticket.source)" :size="10" />
                  {{ getSource(ticket.source).label }}
                </span>
              </div>
              <!-- Subject -->
              <div class="text-sm font-medium text-gray-900 truncate">{{ ticket.subject }}</div>
              <!-- Client -->
              <div class="text-xs text-gray-600 truncate mt-0.5">{{ ticket.clientName }}</div>
              <!-- Meta -->
              <div class="text-xs text-gray-400 mt-0.5">
                {{ format(new Date(ticket.updatedAt), "dd.MM.yy · HH:mm", { locale: ru }) }}
                <span v-if="ticket.assignedTo"> · {{ ticket.assignedTo }}</span>
              </div>
            </div>
            <AppIcon name="chevron-right" :size="16" class="text-gray-300 flex-shrink-0 mt-1" />
          </div>
        </div>
      </div>

      <!-- ── Десктопная таблица (≥ md) ── -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Тикет</th>
              <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Клиент</th>
              <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Источник</th>
              <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Назначен</th>
              <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Обновлён</th>
              <th class="px-4 py-2.5 w-10"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr
              v-for="ticket in paginated"
              :key="ticket.id"
              class="hover:bg-gray-50 cursor-pointer transition-colors group"
              :class="{ 'bg-blue-50/50': ticket.isUnread }"
              @click="emit('view-ticket', ticket)"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-2.5">
                  <div
                    class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    :class="ticket.isUnread ? 'bg-blue-500' : 'bg-transparent'"
                  />
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-mono text-gray-400">#{{ ticket.number }}</span>
                      <span v-if="ticket.messagesCount > 0" class="inline-flex items-center gap-1 text-xs text-gray-400">
                        <AppIcon name="message-square" :size="11" />
                        {{ ticket.messagesCount }}
                      </span>
                    </div>
                    <div class="text-sm font-medium text-gray-900 truncate max-w-[180px]">{{ ticket.subject }}</div>
                    <div class="text-xs text-gray-400 truncate max-w-[180px]">{{ ticket.lastMessage }}</div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="text-sm font-medium text-gray-900">{{ ticket.clientName }}</div>
                <div v-if="ticket.clientPhone" class="text-xs text-gray-400">{{ ticket.clientPhone }}</div>
                <div v-else-if="ticket.telegramId" class="flex items-center gap-1 text-xs text-blue-500">
                  <AppIcon name="send" :size="10" />
                  {{ ticket.telegramId }}
                </div>
              </td>
              <td class="px-4 py-3">
                <div
                  class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium"
                  :class="getSource(ticket.source).cls"
                >
                  <AppIcon :name="getSourceIcon(ticket.source)" :size="12" />
                  {{ getSource(ticket.source).label }}
                </div>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm text-gray-600">{{ ticket.assignedTo || "—" }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="text-xs text-gray-600">{{ format(new Date(ticket.updatedAt), "dd.MM.yyyy", { locale: ru }) }}</div>
                <div class="text-xs text-gray-400">{{ format(new Date(ticket.updatedAt), "HH:mm", { locale: ru }) }}</div>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                  <AppIcon name="chevron-right" :size="16" class="text-gray-400" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Пагинация -->
      <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <AppIcon name="chevron-left" :size="14" />
          Назад
        </button>
        <span class="text-xs text-gray-500">Страница {{ currentPage }} из {{ totalPages }}</span>
        <button
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          class="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Вперёд
          <AppIcon name="chevron-right" :size="14" />
        </button>
      </div>
    </template>
  </div>
</template>
