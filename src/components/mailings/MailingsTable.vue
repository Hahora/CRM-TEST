<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import AppIcon from "@/components/AppIcon.vue";

export interface Mailing {
  id: string;
  campaignId: number;
  name: string;
  type: "telegram" | "max";
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  message: string;
  templateName?: string;
  mediaUrl?: string;
  mediaType?: string;
  recipients: number;
  sent: number;
  delivered: number;
  failed: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}

interface Props {
  mailings: Mailing[];
  loading?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "view-mailing": [mailing: Mailing];
}>();

const PAGE_SIZE = 10;
const currentPage = ref(1);

watch(() => props.mailings.length, () => { currentPage.value = 1; });

const totalPages = computed(() => Math.max(1, Math.ceil(props.mailings.length / PAGE_SIZE)));

const paginated = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return props.mailings.slice(start, start + PAGE_SIZE);
});

const getStatus = (s: string): { label: string; cls: string } => {
  switch (s) {
    case "draft":     return { label: "Черновик",      cls: "bg-gray-100 text-gray-700"    };
    case "scheduled": return { label: "Запланировано", cls: "bg-orange-100 text-orange-700" };
    case "sending":   return { label: "Отправляется",  cls: "bg-blue-100 text-blue-700"    };
    case "sent":      return { label: "Отправлено",    cls: "bg-green-100 text-green-700"  };
    case "failed":    return { label: "Ошибка",        cls: "bg-red-100 text-red-700"      };
    default:          return { label: "Неизвестно",    cls: "bg-gray-100 text-gray-600"    };
  }
};

const getType = (t: string): { label: string; cls: string } => {
  if (t === "telegram") return { label: "Telegram", cls: "text-blue-600 bg-blue-50"    };
  return                        { label: "МАКС",     cls: "text-purple-600 bg-purple-50" };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getTypeIcon = (t: string): any => (t === "telegram" ? "send" : "message-circle");


const displayDate = (m: Mailing): { label: string; sub: string; orange: boolean } => {
  if (m.sentAt)
    return { label: format(new Date(m.sentAt), "dd.MM.yy HH:mm", { locale: ru }), sub: "отправлено", orange: false };
  if (m.scheduledAt)
    return { label: format(new Date(m.scheduledAt), "dd.MM.yy HH:mm", { locale: ru }), sub: "запланировано", orange: true };
  return   { label: format(new Date(m.createdAt),   "dd.MM.yy HH:mm", { locale: ru }), sub: "создано",      orange: false };
};
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
      <h3 class="text-sm font-semibold text-gray-900">Список рассылок</h3>
      <span class="text-xs text-gray-400 font-medium">{{ mailings.length }} рассылок</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-10 flex items-center justify-center gap-2 text-gray-400">
      <AppIcon name="refresh-cw" :size="16" class="animate-spin" />
      <span class="text-sm">Загрузка...</span>
    </div>

    <!-- Empty -->
    <div v-else-if="mailings.length === 0" class="py-12 flex flex-col items-center gap-2">
      <AppIcon name="send" :size="28" class="text-gray-300" />
      <span class="text-sm text-gray-400">Рассылки не найдены</span>
    </div>

    <template v-else>
      <!-- ── Мобильные карточки (< md) ── -->
      <div class="md:hidden divide-y divide-gray-100">
        <div
          v-for="mailing in paginated"
          :key="mailing.id"
          class="px-4 py-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
          @click="emit('view-mailing', mailing)"
        >
          <div class="flex items-start gap-3">
            <div class="min-w-0 flex-1">
              <!-- Name -->
              <div class="text-sm font-medium text-gray-900 truncate">{{ mailing.name }}</div>
              <!-- Badges -->
              <div class="flex items-center gap-1.5 flex-wrap mt-1">
                <span
                  class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium"
                  :class="getType(mailing.type).cls"
                >
                  <AppIcon :name="getTypeIcon(mailing.type)" :size="10" />
                  {{ getType(mailing.type).label }}
                </span>
                <span
                  class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatus(mailing.status).cls"
                >
                  {{ getStatus(mailing.status).label }}
                </span>
              </div>
              <!-- Meta -->
              <div class="text-xs text-gray-400 mt-1">
                {{ displayDate(mailing).sub }}: {{ displayDate(mailing).label }}
                <template v-if="mailing.recipients > 0"> · {{ mailing.recipients.toLocaleString() }} чел.</template>
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
              <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Рассылка</th>
              <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Тип</th>
              <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Статус</th>
              <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Дата</th>
              <th class="px-4 py-2.5 w-10"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr
              v-for="mailing in paginated"
              :key="mailing.id"
              class="hover:bg-gray-50 cursor-pointer transition-colors group"
              @click="emit('view-mailing', mailing)"
            >
              <td class="px-4 py-3">
                <div class="text-sm font-medium text-gray-900 truncate max-w-[200px]">{{ mailing.name }}</div>
              </td>
              <td class="px-4 py-3">
                <div
                  class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium"
                  :class="getType(mailing.type).cls"
                >
                  <AppIcon :name="getTypeIcon(mailing.type)" :size="12" />
                  {{ getType(mailing.type).label }}
                </div>
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatus(mailing.status).cls"
                >
                  {{ getStatus(mailing.status).label }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div
                  class="text-xs"
                  :class="displayDate(mailing).orange ? 'text-orange-600 font-medium' : 'text-gray-600'"
                >
                  {{ displayDate(mailing).label }}
                </div>
                <div class="text-xs text-gray-400">{{ displayDate(mailing).sub }}</div>
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
