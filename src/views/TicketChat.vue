<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import AppIcon from "@/components/AppIcon.vue";

// ── Типы ─────────────────────────────────────────────────────────────────────

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

interface Message {
  id: string;
  text: string;
  sender: "client" | "support";
  timestamp: string;
  isRead: boolean;
}

// ── Моковые данные ────────────────────────────────────────────────────────────

const MOCK_TICKETS: Record<string, Ticket> = {
  "1": {
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
    createdAt: "2024-01-07T20:30:00",
    updatedAt: "2024-01-07T22:44:08",
    messagesCount: 3,
    isUnread: true,
  },
  "2": {
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
  "3": {
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
  "4": {
    id: "4",
    number: 23,
    clientName: "Алексей Козлов",
    clientPhone: "+7 (912) 345-67-89",
    maxId: "max_user_456",
    status: "closed",
    priority: "low",
    source: "max",
    subject: "Информация о товаре",
    lastMessage: "Вопрос решён, спасибо",
    assignedTo: "Пётр Николаев",
    createdAt: "2024-01-06T14:30:00",
    updatedAt: "2024-01-07T09:15:00",
    resolvedAt: "2024-01-07T09:15:00",
    messagesCount: 5,
    isUnread: false,
  },
  "5": {
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
};

const MOCK_MESSAGES: Record<string, Message[]> = {
  "1": [
    { id: "1", text: "Здравствуйте! У меня проблема с заказом #12345",            sender: "client",  timestamp: "2024-01-07T20:30:00", isRead: true  },
    { id: "2", text: "Добрый день! Опишите подробнее в чём проблема?",            sender: "support", timestamp: "2024-01-07T20:35:00", isRead: true  },
    { id: "3", text: "Заказ не пришёл в указанное время, уже прошло 2 дня",       sender: "client",  timestamp: "2024-01-07T20:40:00", isRead: true  },
    { id: "4", text: "Понял, сейчас проверю статус. Дайте мне несколько минут",   sender: "support", timestamp: "2024-01-07T20:42:00", isRead: true  },
    { id: "5", text: "Админ просыпаемся!",                                         sender: "client",  timestamp: "2024-01-07T22:44:08", isRead: false },
  ],
};

// ── Состояние ─────────────────────────────────────────────────────────────────

const route  = useRoute();
const router = useRouter();

const ticketId        = computed(() => route.params.id as string);
const ticket          = ref<Ticket | null>(null);
const messages        = ref<Message[]>([]);
const newMessage      = ref("");
const closeStatus     = ref("");
const isLoading       = ref(true);
const isSending       = ref(false);
const isClosing       = ref(false);
const showInfo        = ref(false);
const messagesEl      = ref<HTMLElement>();

// ── Справочники ───────────────────────────────────────────────────────────────

const getStatus = (s: string): { label: string; cls: string } => {
  switch (s) {
    case "active":     return { label: "Активен",  cls: "bg-yellow-100 text-yellow-700" };
    case "resolved":   return { label: "Решён",    cls: "bg-green-100 text-green-700"   };
    case "unresolved": return { label: "Не решён", cls: "bg-red-100 text-red-700"       };
    default:           return { label: "Закрыт",   cls: "bg-gray-100 text-gray-600"     };
  }
};

const getPriority = (p: string): { label: string; cls: string } => {
  switch (p) {
    case "urgent": return { label: "Срочный", cls: "bg-red-100 text-red-700"       };
    case "high":   return { label: "Высокий", cls: "bg-orange-100 text-orange-700" };
    case "medium": return { label: "Средний", cls: "bg-yellow-100 text-yellow-700" };
    default:       return { label: "Низкий",  cls: "bg-green-100 text-green-700"   };
  }
};

const getSourceLabel = (s: string) => (s === "telegram" ? "Telegram" : "МАКС");

// ── Методы ────────────────────────────────────────────────────────────────────

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
    }
  });
};

const load = async () => {
  isLoading.value = true;
  await new Promise((r) => setTimeout(r, 300));
  const data = MOCK_TICKETS[ticketId.value];
  if (!data) {
    router.push("/tickets");
    return;
  }
  ticket.value   = data;
  messages.value = MOCK_MESSAGES[ticketId.value] ?? [];
  isLoading.value = false;
  scrollToBottom();
};

const send = async () => {
  const text = newMessage.value.trim();
  if (!text || isSending.value) return;

  isSending.value  = true;
  newMessage.value = "";

  messages.value.push({
    id:        Date.now().toString(),
    text,
    sender:    "support",
    timestamp: new Date().toISOString(),
    isRead:    true,
  });
  scrollToBottom();

  await new Promise((r) => setTimeout(r, 400));
  isSending.value = false;
};

const closeTicket = async () => {
  if (!closeStatus.value || isClosing.value) return;
  isClosing.value = true;
  await new Promise((r) => setTimeout(r, 800));
  router.push("/tickets");
};

const goBack = () => router.push("/tickets");

// ── Touch-swipe для мобильной панели ──────────────────────────────────────────

const touchStartY = ref(0);

const onTouchStart = (e: TouchEvent) => {
  touchStartY.value = e.touches[0]?.clientY ?? 0;
};

const onTouchEnd = (e: TouchEvent) => {
  const diff = (e.changedTouches[0]?.clientY ?? 0) - touchStartY.value;
  if (diff > 80) showInfo.value = false;
};

onMounted(load);
</script>

<template>
  <div class="h-full overflow-hidden flex flex-col bg-gray-50">
    <!-- Loading -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="flex items-center gap-2 text-gray-400">
        <AppIcon name="refresh-cw" :size="18" class="animate-spin" />
        <span class="text-sm">Загрузка тикета...</span>
      </div>
    </div>

    <!-- Not found -->
    <div v-else-if="!ticket" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <AppIcon name="message-circle" :size="40" class="text-gray-300 mx-auto mb-3" />
        <p class="text-sm font-medium text-gray-600 mb-3">Тикет не найден</p>
        <button
          @click="goBack"
          class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          К списку
        </button>
      </div>
    </div>

    <!-- Main -->
    <template v-else>
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div class="flex items-center gap-3">
          <!-- Back -->
          <button
            @click="goBack"
            class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <AppIcon name="arrow-left" :size="18" />
          </button>

          <!-- Source icon -->
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            :class="ticket.source === 'telegram' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'"
          >
            <AppIcon :name="ticket.source === 'telegram' ? 'send' : 'message-circle'" :size="15" />
          </div>

          <!-- Title -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono text-gray-400">#{{ ticket.number }}</span>
              <span class="text-sm font-semibold text-gray-900 truncate">{{ ticket.clientName }}</span>
            </div>
            <p class="text-xs text-gray-500 truncate">{{ ticket.subject }}</p>
          </div>

          <!-- Badges (desktop) -->
          <div class="hidden sm:flex items-center gap-2 flex-shrink-0">
            <span
              class="px-2 py-0.5 rounded-full text-xs font-medium"
              :class="getPriority(ticket.priority).cls"
            >
              {{ getPriority(ticket.priority).label }}
            </span>
            <span
              class="px-2 py-0.5 rounded-full text-xs font-medium"
              :class="getStatus(ticket.status).cls"
            >
              {{ getStatus(ticket.status).label }}
            </span>
          </div>

          <!-- Info button (mobile) -->
          <button
            @click="showInfo = true"
            class="sm:hidden p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <AppIcon name="info" :size="18" />
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Desktop sidebar -->
        <aside class="hidden md:flex w-72 flex-col bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
          <!-- Client info -->
          <div class="p-4 border-b border-gray-100">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Клиент</h3>
            <div class="space-y-2">
              <div class="flex items-start gap-2">
                <AppIcon name="user" :size="14" class="text-gray-400 mt-0.5 flex-shrink-0" />
                <span class="text-sm text-gray-900 font-medium">{{ ticket.clientName }}</span>
              </div>
              <div v-if="ticket.clientPhone" class="flex items-start gap-2">
                <AppIcon name="phone" :size="14" class="text-gray-400 mt-0.5 flex-shrink-0" />
                <span class="text-sm text-gray-700">{{ ticket.clientPhone }}</span>
              </div>
              <div v-if="ticket.clientEmail" class="flex items-start gap-2">
                <AppIcon name="mail" :size="14" class="text-gray-400 mt-0.5 flex-shrink-0" />
                <a
                  :href="`mailto:${ticket.clientEmail}`"
                  class="text-sm text-blue-600 hover:underline break-all"
                >{{ ticket.clientEmail }}</a>
              </div>
              <div v-if="ticket.telegramId" class="flex items-start gap-2">
                <AppIcon name="send" :size="14" class="text-blue-500 mt-0.5 flex-shrink-0" />
                <span class="text-sm text-gray-700">{{ ticket.telegramId }}</span>
              </div>
              <div v-if="ticket.maxId" class="flex items-start gap-2">
                <AppIcon name="message-circle" :size="14" class="text-purple-500 mt-0.5 flex-shrink-0" />
                <span class="text-sm text-gray-700">{{ ticket.maxId }}</span>
              </div>
            </div>
          </div>

          <!-- Ticket info -->
          <div class="p-4 border-b border-gray-100">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Тикет</h3>
            <div class="space-y-2.5">
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500">Статус</span>
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatus(ticket.status).cls"
                >{{ getStatus(ticket.status).label }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500">Приоритет</span>
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="getPriority(ticket.priority).cls"
                >{{ getPriority(ticket.priority).label }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500">Источник</span>
                <span class="text-xs font-medium text-gray-700">{{ getSourceLabel(ticket.source) }}</span>
              </div>
              <div v-if="ticket.assignedTo" class="flex justify-between items-center">
                <span class="text-xs text-gray-500">Назначен</span>
                <span class="text-xs font-medium text-gray-700">{{ ticket.assignedTo }}</span>
              </div>
              <div class="flex justify-between items-start">
                <span class="text-xs text-gray-500">Создан</span>
                <span class="text-xs text-gray-700 text-right">
                  {{ format(new Date(ticket.createdAt), "dd.MM.yyyy HH:mm", { locale: ru }) }}
                </span>
              </div>
              <div class="flex justify-between items-start">
                <span class="text-xs text-gray-500">Обновлён</span>
                <span class="text-xs text-gray-700 text-right">
                  {{ format(new Date(ticket.updatedAt), "dd.MM.yyyy HH:mm", { locale: ru }) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="p-4 mt-auto">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Закрыть тикет</h3>
            <div class="space-y-2">
              <select
                v-model="closeStatus"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="">Выберите статус</option>
                <option value="resolved">Решён</option>
                <option value="unresolved">Не решён</option>
                <option value="closed">Закрыт</option>
              </select>
              <button
                @click="closeTicket"
                :disabled="!closeStatus || isClosing"
                class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <AppIcon v-if="isClosing" name="refresh-cw" :size="14" class="animate-spin" />
                {{ isClosing ? "Закрываю..." : "Закрыть тикет" }}
              </button>
            </div>
          </div>
        </aside>

        <!-- Chat -->
        <div class="flex-1 flex flex-col overflow-hidden bg-white">
          <!-- Messages -->
          <div
            ref="messagesEl"
            class="flex-1 overflow-y-auto px-4 py-4 space-y-3"
          >
            <div
              v-for="msg in messages"
              :key="msg.id"
              class="flex"
              :class="msg.sender === 'support' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[75%] sm:max-w-sm md:max-w-md px-3.5 py-2.5 rounded-2xl"
                :class="
                  msg.sender === 'support'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                "
              >
                <p class="text-sm leading-relaxed">{{ msg.text }}</p>
                <div
                  class="text-[11px] mt-1 flex items-center gap-1"
                  :class="msg.sender === 'support' ? 'text-blue-200 justify-end' : 'text-gray-400'"
                >
                  {{ format(new Date(msg.timestamp), "HH:mm", { locale: ru }) }}
                  <AppIcon
                    v-if="msg.sender === 'support'"
                    name="check"
                    :size="12"
                    class="text-blue-200"
                  />
                </div>
              </div>
            </div>

            <!-- Sending indicator -->
            <div v-if="isSending" class="flex justify-end">
              <div class="bg-blue-600 text-white px-3.5 py-2.5 rounded-2xl rounded-br-sm">
                <div class="flex items-center gap-2">
                  <AppIcon name="refresh-cw" :size="12" class="animate-spin text-blue-200" />
                  <span class="text-sm text-blue-100">Отправка...</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Input -->
          <div class="border-t border-gray-100 px-4 py-3 flex-shrink-0">
            <form @submit.prevent="send" class="flex items-center gap-2">
              <input
                v-model="newMessage"
                type="text"
                placeholder="Написать сообщение..."
                :disabled="isSending"
                class="flex-1 px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                @keydown.enter.exact.prevent="send"
              />
              <button
                type="submit"
                :disabled="!newMessage.trim() || isSending"
                class="flex-shrink-0 w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <AppIcon name="send" :size="15" />
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Mobile info sheet -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showInfo"
          class="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end"
          @click="showInfo = false"
        >
          <Transition
            enter-active-class="transition-transform duration-200 ease-out"
            enter-from-class="translate-y-full"
            enter-to-class="translate-y-0"
            leave-active-class="transition-transform duration-150 ease-in"
            leave-from-class="translate-y-0"
            leave-to-class="translate-y-full"
          >
            <div
              v-if="showInfo"
              class="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
              @click.stop
              @touchstart="onTouchStart"
              @touchend="onTouchEnd"
            >
              <!-- Handle -->
              <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div class="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              <!-- Sheet header -->
              <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <h3 class="text-base font-semibold text-gray-900">О тикете</h3>
                <button
                  @click="showInfo = false"
                  class="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <AppIcon name="x" :size="18" />
                </button>
              </div>

              <!-- Sheet body -->
              <div class="flex-1 overflow-y-auto p-4 space-y-5">
                <!-- Badges -->
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-2.5 py-1 rounded-full text-sm font-medium" :class="getStatus(ticket.status).cls">
                    {{ getStatus(ticket.status).label }}
                  </span>
                  <span class="px-2.5 py-1 rounded-full text-sm font-medium" :class="getPriority(ticket.priority).cls">
                    {{ getPriority(ticket.priority).label }}
                  </span>
                </div>

                <!-- Client -->
                <div>
                  <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Клиент</h4>
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <AppIcon name="user" :size="14" class="text-gray-400" />
                      <span class="text-sm font-medium text-gray-900">{{ ticket.clientName }}</span>
                    </div>
                    <div v-if="ticket.clientPhone" class="flex items-center gap-2">
                      <AppIcon name="phone" :size="14" class="text-gray-400" />
                      <a :href="`tel:${ticket.clientPhone}`" class="text-sm text-blue-600">{{ ticket.clientPhone }}</a>
                    </div>
                    <div v-if="ticket.telegramId" class="flex items-center gap-2">
                      <AppIcon name="send" :size="14" class="text-blue-500" />
                      <span class="text-sm text-gray-700">{{ ticket.telegramId }}</span>
                    </div>
                    <div v-if="ticket.maxId" class="flex items-center gap-2">
                      <AppIcon name="message-circle" :size="14" class="text-purple-500" />
                      <span class="text-sm text-gray-700">{{ ticket.maxId }}</span>
                    </div>
                  </div>
                </div>

                <!-- Details -->
                <div>
                  <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Детали</h4>
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span class="text-sm text-gray-500">Тема</span>
                      <span class="text-sm text-gray-900 text-right max-w-[60%]">{{ ticket.subject }}</span>
                    </div>
                    <div v-if="ticket.assignedTo" class="flex justify-between">
                      <span class="text-sm text-gray-500">Назначен</span>
                      <span class="text-sm text-gray-900">{{ ticket.assignedTo }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm text-gray-500">Создан</span>
                      <span class="text-sm text-gray-700">
                        {{ format(new Date(ticket.createdAt), "dd.MM.yyyy HH:mm", { locale: ru }) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Close action -->
                <div>
                  <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Закрыть тикет</h4>
                  <div class="space-y-2">
                    <select
                      v-model="closeStatus"
                      class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="">Выберите статус</option>
                      <option value="resolved">Решён</option>
                      <option value="unresolved">Не решён</option>
                      <option value="closed">Закрыт</option>
                    </select>
                    <button
                      @click="closeTicket"
                      :disabled="!closeStatus || isClosing"
                      class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <AppIcon v-if="isClosing" name="refresh-cw" :size="14" class="animate-spin" />
                      {{ isClosing ? "Закрываю..." : "Закрыть тикет" }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </template>
  </div>
</template>
