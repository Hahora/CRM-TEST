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
  isOpen: boolean;
  mailing: Mailing | null;
}

defineProps<Props>();

const emit = defineEmits<{
  close: [];
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

const getAudienceText = (audience: string[]) => {
  const audienceMap: Record<string, string> = {
    all: "Все клиенты",
    active: "Активные клиенты",
    vip: "VIP клиенты",
    new: "Новые клиенты",
    inactive: "Неактивные клиенты",
    newsletter_subscribers: "Подписчики рассылки",
    recent_clients: "Недавние клиенты",
    scheduled_visits: "Запланированные визиты",
  };

  return audience.map((a) => audienceMap[a] || a).join(", ");
};

const getDeliveryRate = (mailing: Mailing) => {
  if (mailing.sent === 0) return 0;
  return Math.round((mailing.delivered / mailing.sent) * 100);
};

const getOpenRate = (mailing: Mailing) => {
  if (!mailing.opened || mailing.delivered === 0) return 0;
  return Math.round((mailing.opened / mailing.delivered) * 100);
};

const getClickRate = (mailing: Mailing) => {
  if (!mailing.clicked || !mailing.opened) return 0;
  return Math.round((mailing.clicked / mailing.opened) * 100);
};

const closeModal = () => {
  emit("close");
};
</script>

<template>
  <div
    v-if="isOpen && mailing"
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
  >
    <div
      class="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
    >
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-4">
            <div
              :class="[
                'w-12 h-12 rounded-lg flex items-center justify-center',
                getTypeColor(mailing.type),
              ]"
            >
              <AppIcon :name="getTypeIcon(mailing.type)" :size="24" />
            </div>
            <div>
              <h2 class="text-xl font-semibold text-gray-900">
                {{ mailing.name }}
              </h2>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-sm text-gray-600">{{
                  getTypeText(mailing.type)
                }}</span>
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    getStatusColor(mailing.status),
                  ]"
                >
                  {{ getStatusText(mailing.status) }}
                </span>
              </div>
            </div>
          </div>
          <button
            @click="closeModal"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <AppIcon name="x" :size="24" />
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main Content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Message Content -->
            <div class="bg-gray-50 rounded-lg p-4">
              <h3 class="text-sm font-medium text-gray-700 mb-3">
                Содержание сообщения
              </h3>

              <div v-if="mailing.subject" class="mb-3">
                <div class="text-xs text-gray-500 mb-1">
                  {{ mailing.type === "email" ? "Тема письма:" : "Заголовок:" }}
                </div>
                <div class="font-medium text-gray-900">
                  {{ mailing.subject }}
                </div>
              </div>

              <div>
                <div class="text-xs text-gray-500 mb-1">Текст сообщения:</div>
                <div class="text-gray-900 whitespace-pre-wrap">
                  {{ mailing.message }}
                </div>
              </div>
            </div>

            <!-- Statistics (if sent) -->
            <div
              v-if="mailing.status === 'sent' && mailing.sent > 0"
              class="bg-white border border-gray-200 rounded-lg p-4"
            >
              <h3 class="text-sm font-medium text-gray-700 mb-4">
                Статистика доставки
              </h3>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-blue-600">
                    {{ mailing.sent.toLocaleString() }}
                  </div>
                  <div class="text-xs text-gray-500">Отправлено</div>
                </div>

                <div class="text-center">
                  <div class="text-2xl font-bold text-green-600">
                    {{ getDeliveryRate(mailing) }}%
                  </div>
                  <div class="text-xs text-gray-500">Доставлено</div>
                  <div class="text-xs text-gray-400">
                    ({{ mailing.delivered }})
                  </div>
                </div>

                <div v-if="mailing.opened" class="text-center">
                  <div class="text-2xl font-bold text-purple-600">
                    {{ getOpenRate(mailing) }}%
                  </div>
                  <div class="text-xs text-gray-500">Открыли</div>
                  <div class="text-xs text-gray-400">
                    ({{ mailing.opened }})
                  </div>
                </div>

                <div v-if="mailing.clicked" class="text-center">
                  <div class="text-2xl font-bold text-orange-600">
                    {{ getClickRate(mailing) }}%
                  </div>
                  <div class="text-xs text-gray-500">Кликнули</div>
                  <div class="text-xs text-gray-400">
                    ({{ mailing.clicked }})
                  </div>
                </div>
              </div>

              <div
                v-if="mailing.failed > 0"
                class="mt-4 p-3 bg-red-50 rounded-lg"
              >
                <div class="flex items-center gap-2 text-red-800">
                  <AppIcon name="alert-circle" :size="16" />
                  <span class="text-sm font-medium"
                    >Ошибки доставки: {{ mailing.failed }}</span
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar Info -->
          <div class="space-y-4">
            <!-- Basic Info -->
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <h3 class="text-sm font-medium text-gray-700 mb-3">Информация</h3>

              <div class="space-y-3 text-sm">
                <div>
                  <div class="text-gray-500">Создано:</div>
                  <div class="font-medium">
                    {{
                      format(new Date(mailing.createdAt), "dd.MM.yyyy HH:mm", {
                        locale: ru,
                      })
                    }}
                  </div>
                </div>

                <div>
                  <div class="text-gray-500">Автор:</div>
                  <div class="font-medium">{{ mailing.createdBy }}</div>
                </div>

                <div>
                  <div class="text-gray-500">Филиал:</div>
                  <div class="font-medium">{{ mailing.branch }}</div>
                </div>

                <div v-if="mailing.scheduledAt">
                  <div class="text-gray-500">Запланировано на:</div>
                  <div class="font-medium text-orange-600">
                    {{
                      format(
                        new Date(mailing.scheduledAt),
                        "dd.MM.yyyy HH:mm",
                        { locale: ru }
                      )
                    }}
                  </div>
                </div>

                <div v-if="mailing.sentAt">
                  <div class="text-gray-500">Отправлено:</div>
                  <div class="font-medium text-green-600">
                    {{
                      format(new Date(mailing.sentAt), "dd.MM.yyyy HH:mm", {
                        locale: ru,
                      })
                    }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Target Audience -->
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <h3 class="text-sm font-medium text-gray-700 mb-3">
                Целевая аудитория
              </h3>

              <div class="space-y-2 text-sm">
                <div>
                  <div class="text-gray-500">Получатели:</div>
                  <div class="font-medium">
                    {{ mailing.recipients.toLocaleString() }}
                  </div>
                </div>

                <div>
                  <div class="text-gray-500">Сегменты:</div>
                  <div class="font-medium">
                    {{ getAudienceText(mailing.targetAudience) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <h3 class="text-sm font-medium text-gray-700 mb-3">Действия</h3>

              <div class="space-y-2">
                <button
                  v-if="mailing.status === 'draft'"
                  class="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Редактировать
                </button>

                <button
                  v-if="mailing.status === 'draft'"
                  class="w-full px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Отправить
                </button>

                <button
                  v-if="mailing.status === 'scheduled'"
                  class="w-full px-3 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Изменить время
                </button>

                <button
                  v-if="mailing.status === 'sent'"
                  class="w-full px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Дублировать
                </button>

                <button
                  class="w-full px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Экспорт отчета
                </button>

                <button
                  v-if="mailing.status !== 'sending'"
                  class="w-full px-3 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
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
