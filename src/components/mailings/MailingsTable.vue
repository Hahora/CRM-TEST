<script setup lang="ts">
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import AppIcon from "@/components/AppIcon.vue";

interface Mailing {
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

const getStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-800";
    case "scheduled":
      return "bg-orange-100 text-orange-800";
    case "sending":
      return "bg-blue-100 text-blue-800";
    case "sent":
      return "bg-green-100 text-green-800";
    case "failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "draft":
      return "Черновик";
    case "scheduled":
      return "Запланировано";
    case "sending":
      return "Отправляется";
    case "sent":
      return "Отправлено";
    case "failed":
      return "Ошибка";
    default:
      return "Неизвестно";
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "telegram":
      return "send";
    case "email":
      return "mail";
    case "max":
      return "message-circle";
    default:
      return "send";
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "telegram":
      return "text-blue-600 bg-blue-50";
    case "email":
      return "text-green-600 bg-green-50";
    case "max":
      return "text-purple-600 bg-purple-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

const getTypeText = (type: string) => {
  switch (type) {
    case "telegram":
      return "Telegram";
    case "email":
      return "Email";
    case "max":
      return "МАКС";
    default:
      return "Неизвестно";
  }
};

const getDeliveryRate = (mailing: Mailing) => {
  if (mailing.sent === 0) return 0;
  return Math.round((mailing.delivered / mailing.sent) * 100);
};

const getOpenRate = (mailing: Mailing) => {
  if (!mailing.opened || mailing.delivered === 0) return 0;
  return Math.round((mailing.opened / mailing.delivered) * 100);
};
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-900">Список рассылок</h3>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Рассылка
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Тип
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Статус
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Получатели
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Доставляемость
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Дата
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
            <td colspan="7" class="px-6 py-4 text-center text-gray-500">
              <div class="flex items-center justify-center gap-2">
                <AppIcon name="refresh-cw" :size="16" class="animate-spin" />
                Загрузка рассылок...
              </div>
            </td>
          </tr>

          <tr v-else-if="mailings.length === 0">
            <td colspan="7" class="px-6 py-8 text-center text-gray-500">
              <div class="flex flex-col items-center gap-2">
                <AppIcon name="send" :size="24" class="text-gray-400" />
                <span>Рассылки не найдены</span>
              </div>
            </td>
          </tr>

          <tr
            v-else
            v-for="mailing in mailings"
            :key="mailing.id"
            class="hover:bg-gray-50 cursor-pointer transition-colors"
            @click="emit('view-mailing', mailing)"
          >
            <td class="px-6 py-4">
              <div>
                <div class="text-sm font-medium text-gray-900">
                  {{ mailing.name }}
                </div>
                <div
                  v-if="mailing.subject"
                  class="text-xs text-gray-500 truncate max-w-[200px]"
                >
                  {{ mailing.subject }}
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  ID: {{ mailing.id }}
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  {{ mailing.createdBy }} • {{ mailing.branch }}
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <div
                  :class="[
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    getTypeColor(mailing.type),
                  ]"
                >
                  <AppIcon :name="getTypeIcon(mailing.type)" :size="16" />
                </div>
                <span class="text-sm font-medium text-gray-900">{{
                  getTypeText(mailing.type)
                }}</span>
              </div>
            </td>
            <td class="px-6 py-4">
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  getStatusColor(mailing.status),
                ]"
              >
                {{ getStatusText(mailing.status) }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm text-gray-900">
                <div class="font-medium">
                  {{ mailing.recipients.toLocaleString() }}
                </div>
                <div v-if="mailing.sent > 0" class="text-xs text-gray-500">
                  Отправлено: {{ mailing.sent.toLocaleString() }}
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <div v-if="mailing.sent > 0" class="text-sm">
                <div class="flex items-center gap-2 mb-1">
                  <div class="text-gray-900 font-medium">
                    {{ getDeliveryRate(mailing) }}%
                  </div>
                  <div class="text-xs text-gray-500">
                    ({{ mailing.delivered }}/{{ mailing.sent }})
                  </div>
                </div>
                <div v-if="mailing.opened" class="flex items-center gap-2">
                  <AppIcon name="mail-open" :size="12" class="text-gray-400" />
                  <span class="text-xs text-gray-500"
                    >{{ getOpenRate(mailing) }}% открыли</span
                  >
                </div>
              </div>
              <div v-else class="text-sm text-gray-400">—</div>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm text-gray-900">
                <div v-if="mailing.sentAt">
                  {{
                    format(new Date(mailing.sentAt), "dd.MM.yyyy HH:mm", {
                      locale: ru,
                    })
                  }}
                </div>
                <div v-else-if="mailing.scheduledAt">
                  <div class="text-orange-600 font-medium">
                    {{
                      format(
                        new Date(mailing.scheduledAt),
                        "dd.MM.yyyy HH:mm",
                        { locale: ru }
                      )
                    }}
                  </div>
                  <div class="text-xs text-gray-500">Запланировано</div>
                </div>
                <div v-else>
                  <div class="text-gray-500">
                    {{
                      format(new Date(mailing.createdAt), "dd.MM.yyyy HH:mm", {
                        locale: ru,
                      })
                    }}
                  </div>
                  <div class="text-xs text-gray-400">Создано</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 text-right">
              <button
                @click.stop="emit('view-mailing', mailing)"
                class="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Подробнее
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
