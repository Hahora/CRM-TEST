<script setup lang="ts">
import { ref, watch } from "vue";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import AppIcon from "@/components/AppIcon.vue";
import type { Mailing } from "@/components/mailings/MailingsTable.vue";
import { mailingsApi } from "@/services/mailingsApi";
import type { CampaignStats } from "@/services/mailingsApi";

interface Props {
  isOpen: boolean;
  mailing: Mailing | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  sent: [id: string];
}>();

// ── Статистика ───────────────────────────────────────────────────────────────

const stats     = ref<CampaignStats | null>(null);
const statsLoad = ref(false);

watch(
  () => [props.isOpen, props.mailing?.campaignId] as const,
  async ([open, id]) => {
    if (!open || !id) { stats.value = null; return; }
    statsLoad.value = true;
    try {
      stats.value = await mailingsApi.getCampaignStats(id);
    } catch {
      stats.value = null;
    } finally {
      statsLoad.value = false;
    }
  },
  { immediate: true }
);

// ── Действия ─────────────────────────────────────────────────────────────────

const isSending = ref(false);
const sendError = ref("");

const sendNow = async () => {
  if (!props.mailing || isSending.value) return;
  isSending.value = true;
  sendError.value = "";
  try {
    await mailingsApi.scheduleCampaign(props.mailing.campaignId, {
      campaign_id:      props.mailing.campaignId,
      send_immediately: true,
    });
    emit("sent", props.mailing.id);
    emit("close");
  } catch (err) {
    sendError.value = (err as Error).message || "Ошибка при отправке";
  } finally {
    isSending.value = false;
  }
};

// ── Вспомогательные ──────────────────────────────────────────────────────────

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
const getTypeIcon = (t: string): any =>
  t === "telegram" ? "send" : "message-circle";

const fmt = (iso: string) =>
  format(new Date(iso), "dd.MM.yyyy HH:mm", { locale: ru });
</script>

<template>
  <div
    v-if="isOpen && mailing"
    class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
      <div class="p-5">

        <!-- Header -->
        <div class="flex items-start justify-between mb-5 gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="getType(mailing.type).cls"
            >
              <AppIcon :name="getTypeIcon(mailing.type)" :size="18" />
            </div>
            <div class="min-w-0">
              <h2 class="text-base font-semibold text-gray-900 truncate">{{ mailing.name }}</h2>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-xs text-gray-500">{{ getType(mailing.type).label }}</span>
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatus(mailing.status).cls"
                >{{ getStatus(mailing.status).label }}</span>
              </div>
            </div>
          </div>
          <button @click="emit('close')" class="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
            <AppIcon name="x" :size="20" />
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

          <!-- ── Основная часть ── -->
          <div class="lg:col-span-2 space-y-4">

            <!-- Текст сообщения -->
            <div class="bg-gray-50 rounded-lg p-4">
              <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Содержание</h3>
              <div class="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{{ mailing.message || "—" }}</div>
              <!-- Медиа -->
              <div v-if="mailing.mediaType" class="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-white rounded-md px-3 py-2 border border-gray-200">
                <AppIcon
                  :name="mailing.mediaType === 'photo' ? 'package' : mailing.mediaType === 'video' ? 'play-circle' : 'file-text'"
                  :size="14"
                />
                <span>
                  {{ mailing.mediaType === 'photo' ? 'Фото' : mailing.mediaType === 'video' ? 'Видео' : 'Документ' }}
                  (Telegram file_id)
                </span>
              </div>
            </div>

            <!-- Статистика -->
            <div class="border border-gray-200 rounded-lg p-4">
              <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Статистика</h3>

              <!-- Загрузка -->
              <div v-if="statsLoad" class="flex items-center gap-2 text-gray-400 text-sm">
                <AppIcon name="refresh-cw" :size="14" class="animate-spin" />
                Загрузка...
              </div>

              <!-- Нет данных -->
              <div v-else-if="!stats" class="text-sm text-gray-400">
                Статистика недоступна
              </div>

              <!-- Данные -->
              <div v-else class="space-y-3">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div class="text-center bg-blue-50 rounded-lg p-3">
                    <div class="text-xl font-bold text-blue-600">{{ stats.total_messages.toLocaleString() }}</div>
                    <div class="text-xs text-gray-500 mt-0.5">Всего</div>
                  </div>
                  <div class="text-center bg-green-50 rounded-lg p-3">
                    <div class="text-xl font-bold text-green-600">{{ stats.sent_messages.toLocaleString() }}</div>
                    <div class="text-xs text-gray-500 mt-0.5">Отправлено</div>
                  </div>
                  <div class="text-center bg-purple-50 rounded-lg p-3">
                    <div class="text-xl font-bold text-purple-600">{{ stats.delivery_rate.toFixed(1) }}%</div>
                    <div class="text-xs text-gray-500 mt-0.5">Доставлено</div>
                    <div class="text-xs text-gray-400">({{ stats.delivered_messages }})</div>
                  </div>
                  <div class="text-center bg-amber-50 rounded-lg p-3">
                    <div class="text-xl font-bold text-amber-600">{{ stats.read_rate.toFixed(1) }}%</div>
                    <div class="text-xs text-gray-500 mt-0.5">Прочитано</div>
                    <div class="text-xs text-gray-400">({{ stats.read_messages }})</div>
                  </div>
                </div>
                <div v-if="stats.failed_messages > 0" class="flex items-center gap-2 p-2.5 bg-red-50 rounded-lg text-sm text-red-700">
                  <AppIcon name="alert-circle" :size="14" />
                  Ошибок доставки: {{ stats.failed_messages }}
                </div>
              </div>
            </div>
          </div>

          <!-- ── Сайдбар ── -->
          <div class="space-y-4">

            <!-- Информация -->
            <div class="border border-gray-200 rounded-lg p-4">
              <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Информация</h3>
              <div class="space-y-2.5 text-sm">
                <div>
                  <div class="text-xs text-gray-400">Создано</div>
                  <div class="font-medium text-gray-900">{{ fmt(mailing.createdAt) }}</div>
                </div>
                <div v-if="mailing.scheduledAt">
                  <div class="text-xs text-gray-400">Запланировано</div>
                  <div class="font-medium text-orange-600">{{ fmt(mailing.scheduledAt) }}</div>
                </div>
                <div v-if="mailing.sentAt">
                  <div class="text-xs text-gray-400">Отправлено</div>
                  <div class="font-medium text-green-600">{{ fmt(mailing.sentAt) }}</div>
                </div>
                <div v-if="mailing.recipients > 0">
                  <div class="text-xs text-gray-400">Получателей</div>
                  <div class="font-medium text-gray-900">{{ mailing.recipients.toLocaleString() }}</div>
                </div>
              </div>
            </div>

            <!-- Действия -->
            <div class="border border-gray-200 rounded-lg p-4">
              <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Действия</h3>
              <div class="space-y-2">

                <!-- Отправить (только черновик) -->
                <button
                  v-if="mailing.status === 'draft'"
                  :disabled="isSending"
                  class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  @click="sendNow"
                >
                  <AppIcon v-if="isSending" name="refresh-cw" :size="13" class="animate-spin" />
                  <AppIcon v-else name="send" :size="13" />
                  {{ isSending ? "Отправка..." : "Отправить сейчас" }}
                </button>

                <div v-if="sendError" class="text-xs text-red-600 flex items-center gap-1">
                  <AppIcon name="alert-circle" :size="11" />
                  {{ sendError }}
                </div>

                <button
                  class="w-full px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  @click="emit('close')"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
