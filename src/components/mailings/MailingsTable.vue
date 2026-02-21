<script setup lang="ts">
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import AppIcon from "@/components/AppIcon.vue";

export interface Mailing {
  id: string;
  name: string;
  type: "telegram" | "email" | "max";
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  subject?: string;
  message: string;
  recipients: number;
  sent: number;
  delivered: number;
  opened?: number;
  clicked?: number;
  failed: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  createdBy: string;
  branch: string;
  targetAudience: string[];
}

interface Props {
  mailings: Mailing[];
  loading?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  "view-mailing": [mailing: Mailing];
}>();

const getStatus = (s: string): { label: string; cls: string } => {
  switch (s) {
    case "draft":     return { label: "Черновик",      cls: "bg-gray-100 text-gray-700"   };
    case "scheduled": return { label: "Запланировано", cls: "bg-orange-100 text-orange-700" };
    case "sending":   return { label: "Отправляется",  cls: "bg-blue-100 text-blue-700"    };
    case "sent":      return { label: "Отправлено",    cls: "bg-green-100 text-green-700"  };
    case "failed":    return { label: "Ошибка",        cls: "bg-red-100 text-red-700"      };
    default:          return { label: "Неизвестно",    cls: "bg-gray-100 text-gray-600"    };
  }
};

const getType = (t: string): { label: string; cls: string } => {
  switch (t) {
    case "telegram": return { label: "Telegram", cls: "text-blue-600 bg-blue-50"   };
    case "email":    return { label: "Email",    cls: "text-green-600 bg-green-50"  };
    default:         return { label: "МАКС",     cls: "text-purple-600 bg-purple-50" };
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getTypeIcon = (t: string): any => {
  switch (t) {
    case "telegram": return "send";
    case "email":    return "mail";
    default:         return "message-circle";
  }
};

const getDeliveryRate = (m: Mailing) => {
  if (m.sent === 0) return 0;
  return Math.round((m.delivered / m.sent) * 100);
};
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <!-- Table header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
      <h3 class="text-sm font-semibold text-gray-900">Список рассылок</h3>
      <span class="text-xs text-gray-400 font-medium">{{ mailings.length }} рассылок</span>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-100">
            <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Рассылка</th>
            <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Тип</th>
            <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Статус</th>
            <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Получатели</th>
            <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide hidden md:table-cell">Доставляемость</th>
            <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide hidden lg:table-cell">Дата</th>
            <th class="px-4 py-2.5 w-10"></th>
          </tr>
        </thead>

        <tbody class="divide-y divide-gray-50">
          <!-- Loading -->
          <tr v-if="loading">
            <td colspan="7" class="px-4 py-10 text-center">
              <div class="flex items-center justify-center gap-2 text-gray-400">
                <AppIcon name="refresh-cw" :size="16" class="animate-spin" />
                <span class="text-sm">Загрузка...</span>
              </div>
            </td>
          </tr>

          <!-- Empty -->
          <tr v-else-if="mailings.length === 0">
            <td colspan="7" class="px-4 py-12 text-center">
              <div class="flex flex-col items-center gap-2">
                <AppIcon name="send" :size="28" class="text-gray-300" />
                <span class="text-sm text-gray-400">Рассылки не найдены</span>
              </div>
            </td>
          </tr>

          <!-- Rows -->
          <tr
            v-else
            v-for="mailing in mailings"
            :key="mailing.id"
            class="hover:bg-gray-50 cursor-pointer transition-colors group"
            @click="emit('view-mailing', mailing)"
          >
            <!-- Рассылка -->
            <td class="px-4 py-3">
              <div class="min-w-0">
                <div class="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                  {{ mailing.name }}
                </div>
                <div v-if="mailing.subject" class="text-xs text-gray-500 truncate max-w-[200px]">
                  {{ mailing.subject }}
                </div>
                <div class="text-xs text-gray-400">{{ mailing.createdBy }} · {{ mailing.branch }}</div>
              </div>
            </td>

            <!-- Тип -->
            <td class="px-4 py-3">
              <div
                class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium"
                :class="getType(mailing.type).cls"
              >
                <AppIcon :name="getTypeIcon(mailing.type)" :size="12" />
                {{ getType(mailing.type).label }}
              </div>
            </td>

            <!-- Статус -->
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                :class="getStatus(mailing.status).cls"
              >
                {{ getStatus(mailing.status).label }}
              </span>
            </td>

            <!-- Получатели -->
            <td class="px-4 py-3">
              <div class="text-sm font-medium text-gray-900">{{ mailing.recipients.toLocaleString() }}</div>
              <div v-if="mailing.sent > 0" class="text-xs text-gray-400">
                отправлено: {{ mailing.sent.toLocaleString() }}
              </div>
            </td>

            <!-- Доставляемость -->
            <td class="px-4 py-3 hidden md:table-cell">
              <div v-if="mailing.sent > 0" class="text-sm">
                <div class="font-medium text-gray-900">{{ getDeliveryRate(mailing) }}%</div>
                <div v-if="mailing.opened" class="flex items-center gap-1 text-xs text-gray-400">
                  <AppIcon name="mail-open" :size="11" />
                  {{ mailing.opened }} открыли
                </div>
              </div>
              <div v-else class="text-sm text-gray-400">—</div>
            </td>

            <!-- Дата -->
            <td class="px-4 py-3 hidden lg:table-cell">
              <div v-if="mailing.sentAt">
                <div class="text-xs text-gray-600">
                  {{ format(new Date(mailing.sentAt), "dd.MM.yyyy", { locale: ru }) }}
                </div>
                <div class="text-xs text-gray-400">
                  {{ format(new Date(mailing.sentAt), "HH:mm", { locale: ru }) }}
                </div>
              </div>
              <div v-else-if="mailing.scheduledAt">
                <div class="text-xs text-orange-600 font-medium">
                  {{ format(new Date(mailing.scheduledAt), "dd.MM.yyyy", { locale: ru }) }}
                </div>
                <div class="text-xs text-gray-400">запланировано</div>
              </div>
              <div v-else>
                <div class="text-xs text-gray-600">
                  {{ format(new Date(mailing.createdAt), "dd.MM.yyyy", { locale: ru }) }}
                </div>
                <div class="text-xs text-gray-400">создано</div>
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
