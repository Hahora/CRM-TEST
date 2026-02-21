<script setup lang="ts">
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import AppIcon from "@/components/AppIcon.vue";
import type { Mailing } from "@/components/mailings/MailingsTable.vue";

interface Props {
  isOpen: boolean;
  mailing: Mailing | null;
}

defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

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
  switch (t) {
    case "telegram": return { label: "Telegram", cls: "text-blue-600 bg-blue-50"    };
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

const audienceLabels: Record<string, string> = {
  all:                   "Все клиенты",
  active:                "Активные клиенты",
  vip:                   "VIP клиенты",
  new:                   "Новые клиенты",
  inactive:              "Неактивные клиенты",
  newsletter_subscribers:"Подписчики рассылки",
  recent_clients:        "Недавние клиенты",
  scheduled_visits:      "Запланированные визиты",
};

const getAudienceText = (audience: string[]) =>
  audience.map((a) => audienceLabels[a] || a).join(", ");

const getDeliveryRate = (m: Mailing) => {
  if (m.sent === 0) return 0;
  return Math.round((m.delivered / m.sent) * 100);
};

const getOpenRate = (m: Mailing) => {
  if (!m.opened || m.delivered === 0) return 0;
  return Math.round((m.opened / m.delivered) * 100);
};

const getClickRate = (m: Mailing) => {
  if (!m.clicked || !m.opened) return 0;
  return Math.round((m.clicked / m.opened) * 100);
};
</script>

<template>
  <div
    v-if="isOpen && mailing"
    class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
  >
    <div class="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div class="p-5">
        <!-- Header -->
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="getType(mailing.type).cls"
            >
              <AppIcon :name="getTypeIcon(mailing.type)" :size="20" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900">{{ mailing.name }}</h2>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-sm text-gray-500">{{ getType(mailing.type).label }}</span>
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatus(mailing.status).cls"
                >
                  {{ getStatus(mailing.status).label }}
                </span>
              </div>
            </div>
          </div>
          <button @click="emit('close')" class="text-gray-400 hover:text-gray-600 transition-colors">
            <AppIcon name="x" :size="20" />
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <!-- Main Content -->
          <div class="lg:col-span-2 space-y-4">
            <!-- Message -->
            <div class="bg-gray-50 rounded-lg p-4">
              <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Содержание</h3>
              <div v-if="mailing.subject" class="mb-3">
                <div class="text-xs text-gray-500 mb-1">
                  {{ mailing.type === "email" ? "Тема письма" : "Заголовок" }}
                </div>
                <div class="text-sm font-medium text-gray-900">{{ mailing.subject }}</div>
              </div>
              <div>
                <div class="text-xs text-gray-500 mb-1">Текст сообщения</div>
                <div class="text-sm text-gray-900 whitespace-pre-wrap">{{ mailing.message }}</div>
              </div>
            </div>

            <!-- Delivery Stats -->
            <div
              v-if="mailing.status === 'sent' && mailing.sent > 0"
              class="border border-gray-200 rounded-lg p-4"
            >
              <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Статистика доставки</h3>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-blue-600">{{ mailing.sent.toLocaleString() }}</div>
                  <div class="text-xs text-gray-500 mt-0.5">Отправлено</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-green-600">{{ getDeliveryRate(mailing) }}%</div>
                  <div class="text-xs text-gray-500 mt-0.5">Доставлено</div>
                  <div class="text-xs text-gray-400">({{ mailing.delivered }})</div>
                </div>
                <div v-if="mailing.opened" class="text-center">
                  <div class="text-2xl font-bold text-purple-600">{{ getOpenRate(mailing) }}%</div>
                  <div class="text-xs text-gray-500 mt-0.5">Открыли</div>
                  <div class="text-xs text-gray-400">({{ mailing.opened }})</div>
                </div>
                <div v-if="mailing.clicked" class="text-center">
                  <div class="text-2xl font-bold text-orange-600">{{ getClickRate(mailing) }}%</div>
                  <div class="text-xs text-gray-500 mt-0.5">Кликнули</div>
                  <div class="text-xs text-gray-400">({{ mailing.clicked }})</div>
                </div>
              </div>
              <div v-if="mailing.failed > 0" class="mt-4 p-3 bg-red-50 rounded-lg flex items-center gap-2 text-red-700">
                <AppIcon name="alert-circle" :size="14" />
                <span class="text-sm">Ошибки доставки: {{ mailing.failed }}</span>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-4">
            <!-- Info -->
            <div class="border border-gray-200 rounded-lg p-4">
              <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Информация</h3>
              <div class="space-y-2.5 text-sm">
                <div>
                  <div class="text-xs text-gray-400">Создано</div>
                  <div class="font-medium text-gray-900">
                    {{ format(new Date(mailing.createdAt), "dd.MM.yyyy HH:mm", { locale: ru }) }}
                  </div>
                </div>
                <div>
                  <div class="text-xs text-gray-400">Автор</div>
                  <div class="font-medium text-gray-900">{{ mailing.createdBy }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-400">Филиал</div>
                  <div class="font-medium text-gray-900">{{ mailing.branch }}</div>
                </div>
                <div v-if="mailing.scheduledAt">
                  <div class="text-xs text-gray-400">Запланировано на</div>
                  <div class="font-medium text-orange-600">
                    {{ format(new Date(mailing.scheduledAt), "dd.MM.yyyy HH:mm", { locale: ru }) }}
                  </div>
                </div>
                <div v-if="mailing.sentAt">
                  <div class="text-xs text-gray-400">Отправлено</div>
                  <div class="font-medium text-green-600">
                    {{ format(new Date(mailing.sentAt), "dd.MM.yyyy HH:mm", { locale: ru }) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Audience -->
            <div class="border border-gray-200 rounded-lg p-4">
              <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Аудитория</h3>
              <div class="space-y-2 text-sm">
                <div>
                  <div class="text-xs text-gray-400">Получателей</div>
                  <div class="font-medium text-gray-900">{{ mailing.recipients.toLocaleString() }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-400">Сегменты</div>
                  <div class="font-medium text-gray-900">{{ getAudienceText(mailing.targetAudience) }}</div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="border border-gray-200 rounded-lg p-4">
              <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Действия</h3>
              <div class="space-y-2">
                <button
                  v-if="mailing.status === 'draft'"
                  class="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Редактировать
                </button>
                <button
                  v-if="mailing.status === 'draft'"
                  class="w-full px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Отправить
                </button>
                <button
                  v-if="mailing.status === 'scheduled'"
                  class="w-full px-3 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Изменить время
                </button>
                <button
                  v-if="mailing.status === 'sent'"
                  class="w-full px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Дублировать
                </button>
                <button
                  class="w-full px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Экспорт отчёта
                </button>
                <button
                  v-if="mailing.status !== 'sending'"
                  class="w-full px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
