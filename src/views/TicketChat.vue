<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import AppIcon from "@/components/AppIcon.vue";
import DevelopmentBanner from "@/components/DevelopmentBanner.vue";

interface Props {
  id?: string;
}

const props = defineProps<Props>();
const route = useRoute();
const router = useRouter();

const ticketId = computed(() => props.id || (route.params.id as string));

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

// Mock данные
const mockTickets: Record<string, Ticket> = {
  "1": {
    id: "1",
    number: 1001,
    clientName: "Иван Петров",
    clientPhone: "+7 (999) 123-45-67",
    clientEmail: "ivan@example.com",
    telegramId: "@ivan_petrov",
    status: "active",
    priority: "high",
    source: "telegram",
    subject: "Проблема с заказом #12345",
    lastMessage: "Админ просыпаемся!",
    assignedTo: "Анна Смирнова",
    createdAt: "2024-01-07T20:30:00",
    updatedAt: "2024-01-07T22:44:08",
    messagesCount: 3,
    isUnread: true,
  },
};

const mockMessages: Record<string, Message[]> = {
  "1": [
    {
      id: "1",
      text: "Здравствуйте! У меня проблема с заказом #12345",
      sender: "client",
      timestamp: "2024-01-07T20:30:00",
      isRead: true,
    },
    {
      id: "2",
      text: "Добрый день! Опишите, пожалуйста, подробнее в чем проблема?",
      sender: "support",
      timestamp: "2024-01-07T20:35:00",
      isRead: true,
    },
    {
      id: "3",
      text: "Заказ не пришел в указанное время, уже прошло 2 дня",
      sender: "client",
      timestamp: "2024-01-07T20:40:00",
      isRead: true,
    },
    {
      id: "4",
      text: "Понял, сейчас проверю статус заказа. Дайте мне несколько минут",
      sender: "support",
      timestamp: "2024-01-07T20:42:00",
      isRead: true,
    },
    {
      id: "5",
      text: "Админ просыпаемся!",
      sender: "client",
      timestamp: "2024-01-07T22:44:08",
      isRead: false,
    },
  ],
};

const ticket = ref<Ticket | null>(null);
const messages = ref<Message[]>([]);
const newMessage = ref("");
const newStatus = ref("");
const isLoading = ref(true);
const isSending = ref(false);
const isClosing = ref(false);
const messagesContainer = ref<HTMLElement>();
const showClientInfo = ref(false);

// Touch handling for swipe to close modal
const touchStartY = ref(0);
const touchCurrentY = ref(0);

const handleTouchStart = (e: TouchEvent) => {
  touchStartY.value = e.touches[0]?.clientY || 0;
};

const handleTouchMove = (e: TouchEvent) => {
  touchCurrentY.value = e.touches[0]?.clientY || 0;
  const diff = touchCurrentY.value - touchStartY.value;

  // Only allow downward swipe
  if (diff > 0) {
    e.preventDefault();
  }
};

const handleTouchEnd = () => {
  const diff = touchCurrentY.value - touchStartY.value;

  // If swiped down more than 100px, close modal
  if (diff > 100) {
    showClientInfo.value = false;
  }

  touchStartY.value = 0;
  touchCurrentY.value = 0;
};

// Utility functions
const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "resolved":
      return "bg-blue-100 text-blue-800";
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
      return "bg-red-100 text-red-800";
    case "high":
      return "bg-orange-100 text-orange-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "low":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
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

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const sendMessage = async () => {
  if (!newMessage.value.trim() || isSending.value) return;

  isSending.value = true;
  const messageText = newMessage.value.trim();
  newMessage.value = "";

  const message: Message = {
    id: Date.now().toString(),
    text: messageText,
    sender: "support",
    timestamp: new Date().toISOString(),
    isRead: true,
  };

  messages.value.push(message);
  scrollToBottom();

  // Имитация отправки
  await new Promise((resolve) => setTimeout(resolve, 500));
  isSending.value = false;
};

const closeTicket = async () => {
  if (!newStatus.value || isClosing.value) return;

  isClosing.value = true;

  // Имитация закрытия тикета
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log("Тикет закрыт со статусом:", newStatus.value);
  router.push("/tickets");
};

const goBack = () => {
  router.push("/tickets");
};

const loadTicket = async () => {
  isLoading.value = true;

  await new Promise((resolve) => setTimeout(resolve, 300));

  const ticketData = mockTickets[ticketId.value];
  if (ticketData) {
    ticket.value = ticketData;
    messages.value = mockMessages[ticketId.value] || [];
  } else {
    router.push("/tickets");
    return;
  }

  isLoading.value = false;
  scrollToBottom();
};

onMounted(() => {
  loadTicket();
});
</script>

<template>
  <div class="h-screen bg-gray-50 flex flex-col overflow-hidden">
    <DevelopmentBanner />

    <!-- Loading -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="flex items-center gap-3 text-gray-600">
        <AppIcon name="refresh-cw" :size="20" class="animate-spin" />
        <span>Загрузка тикета...</span>
      </div>
    </div>

    <!-- Main Content -->
    <template v-else-if="ticket">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div class="flex items-center justify-between">
          <!-- Left side -->
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <button
              @click="goBack"
              class="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <AppIcon name="arrow-left" :size="18" />
            </button>

            <div
              :class="[
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                getSourceColor(ticket.source),
              ]"
            >
              <AppIcon :name="getSourceIcon(ticket.source)" :size="16" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <h1 class="text-sm font-semibold text-gray-900 truncate">
                  #{{ ticket.number }} - {{ ticket.clientName }}
                </h1>
              </div>
              <p class="text-xs text-gray-600 truncate">{{ ticket.subject }}</p>
            </div>
          </div>

          <!-- Right side -->
          <div class="flex items-center gap-2 flex-shrink-0 ml-2">
            <!-- Mobile info button -->
            <button
              @click="showClientInfo = true"
              class="md:hidden p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <AppIcon name="info" :size="18" />
            </button>

            <!-- Desktop badges -->
            <span
              class="hidden sm:inline-flex px-2 py-1 rounded-full text-xs font-medium"
              :class="getPriorityColor(ticket.priority)"
            >
              {{ getPriorityText(ticket.priority) }}
            </span>
            <span
              class="hidden sm:inline-flex px-2 py-1 rounded-full text-xs font-medium"
              :class="getStatusColor(ticket.status)"
            >
              {{ getStatusText(ticket.status) }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex flex-1 overflow-hidden">
        <!-- Desktop Sidebar -->
        <div
          class="hidden md:block w-80 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto"
        >
          <div class="h-full flex flex-col">
            <!-- Client Info -->
            <div class="p-4 border-b border-gray-200">
              <h3 class="text-sm font-semibold text-gray-900 mb-3">
                Информация о клиенте
              </h3>
              <div class="space-y-2 text-sm">
                <div>
                  <span class="text-gray-500">Имя:</span>
                  <span class="ml-2 text-gray-900">{{
                    ticket.clientName
                  }}</span>
                </div>
                <div v-if="ticket.clientPhone">
                  <span class="text-gray-500">Телефон:</span>
                  <span class="ml-2 text-gray-900">{{
                    ticket.clientPhone
                  }}</span>
                </div>
                <div v-if="ticket.clientEmail">
                  <span class="text-gray-500">Email:</span>
                  <span class="ml-2 text-gray-900">{{
                    ticket.clientEmail
                  }}</span>
                </div>
                <div v-if="ticket.telegramId">
                  <span class="text-gray-500">Telegram:</span>
                  <span class="ml-2 text-gray-900">{{
                    ticket.telegramId
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Ticket Details -->
            <div class="p-4 border-b border-gray-200">
              <h3 class="text-sm font-semibold text-gray-900 mb-3">
                Детали тикета
              </h3>
              <div class="space-y-2 text-sm">
                <div>
                  <span class="text-gray-500">Создан:</span>
                  <span class="ml-2 text-gray-900">
                    {{
                      format(new Date(ticket.createdAt), "dd.MM.yyyy HH:mm", {
                        locale: ru,
                      })
                    }}
                  </span>
                </div>
                <div>
                  <span class="text-gray-500">Обновлен:</span>
                  <span class="ml-2 text-gray-900">
                    {{
                      format(new Date(ticket.updatedAt), "dd.MM.yyyy HH:mm", {
                        locale: ru,
                      })
                    }}
                  </span>
                </div>
                <div v-if="ticket.assignedTo">
                  <span class="text-gray-500">Назначен:</span>
                  <span class="ml-2 text-gray-900">{{
                    ticket.assignedTo
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="p-4 flex-1 flex flex-col justify-end">
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Завершить с статусом:
                  </label>
                  <select
                    v-model="newStatus"
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Выберите статус</option>
                    <option value="resolved">Решен</option>
                    <option value="unresolved">Не решен</option>
                    <option value="closed">Закрыт</option>
                  </select>
                </div>

                <button
                  @click="closeTicket"
                  :disabled="!newStatus || isClosing"
                  class="w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <AppIcon
                    v-if="isClosing"
                    name="refresh-cw"
                    :size="16"
                    class="animate-spin"
                  />
                  {{ isClosing ? "Закрытие..." : "Закрыть тикет" }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Area -->
        <div class="flex-1 flex flex-col bg-white overflow-hidden">
          <!-- Messages -->
          <div
            ref="messagesContainer"
            class="flex-1 overflow-y-auto p-4 space-y-3"
          >
            <div
              v-for="message in messages"
              :key="message.id"
              :class="[
                'flex',
                message.sender === 'support' ? 'justify-end' : 'justify-start',
              ]"
            >
              <div
                :class="[
                  'max-w-xs sm:max-w-sm md:max-w-md px-3 py-2 rounded-lg',
                  message.sender === 'support'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900',
                ]"
              >
                <p class="text-sm">{{ message.text }}</p>
                <div
                  :class="[
                    'text-xs mt-1',
                    message.sender === 'support'
                      ? 'text-blue-100'
                      : 'text-gray-500',
                  ]"
                >
                  {{
                    format(new Date(message.timestamp), "HH:mm", { locale: ru })
                  }}
                </div>
              </div>
            </div>

            <!-- Typing indicator -->
            <div v-if="isSending" class="flex justify-end">
              <div class="bg-blue-600 text-white px-3 py-2 rounded-lg">
                <div class="flex items-center gap-2">
                  <AppIcon name="refresh-cw" :size="12" class="animate-spin" />
                  <span class="text-sm">Отправка...</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Message Input -->
          <div class="border-t border-gray-200 p-4 flex-shrink-0">
            <form @submit.prevent="sendMessage" class="flex gap-2">
              <input
                v-model="newMessage"
                type="text"
                placeholder="Введите сообщение..."
                class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                :disabled="isSending"
              />
              <button
                type="submit"
                :disabled="!newMessage.trim() || isSending"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <AppIcon name="send" :size="16" />
                <span class="hidden sm:inline">Отправить</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Mobile Client Info Modal -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showClientInfo"
          class="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end"
          @click="showClientInfo = false"
        >
          <Transition
            enter-active-class="transition-transform duration-300 ease-out"
            enter-from-class="translate-y-full"
            enter-to-class="translate-y-0"
            leave-active-class="transition-transform duration-200 ease-in"
            leave-from-class="translate-y-0"
            leave-to-class="translate-y-full"
          >
            <div
              v-if="showClientInfo"
              class="bg-white rounded-t-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
              @click.stop
            >
              <!-- Modal Header -->
              <div
                class="p-4 border-b border-gray-200 flex-shrink-0"
                @touchstart="handleTouchStart"
                @touchmove="handleTouchMove"
                @touchend="handleTouchEnd"
              >
                <!-- Swipe indicator -->
                <div class="flex justify-center mb-2">
                  <div class="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                </div>

                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-gray-900">
                    Информация о тикете
                  </h3>
                  <button
                    @click="showClientInfo = false"
                    class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <AppIcon name="x" :size="20" />
                  </button>
                </div>
              </div>

              <!-- Modal Content - Scrollable -->
              <div class="flex-1 overflow-y-auto">
                <!-- Status and Priority -->
                <div class="p-4 bg-gray-50 border-b border-gray-200">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      :class="[
                        'px-3 py-1.5 rounded-full text-sm font-medium',
                        getStatusColor(ticket.status),
                      ]"
                    >
                      {{ getStatusText(ticket.status) }}
                    </span>
                    <span
                      :class="[
                        'px-3 py-1.5 rounded-full text-sm font-medium',
                        getPriorityColor(ticket.priority),
                      ]"
                    >
                      {{ getPriorityText(ticket.priority) }}
                    </span>
                  </div>
                </div>

                <!-- Client Info -->
                <div class="p-4 border-b border-gray-200">
                  <h4
                    class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"
                  >
                    <AppIcon name="user" :size="16" />
                    Информация о клиенте
                  </h4>
                  <div class="space-y-3">
                    <div class="flex items-start">
                      <span class="text-sm text-gray-500 w-24 flex-shrink-0"
                        >Имя:</span
                      >
                      <span class="text-sm text-gray-900 font-medium">{{
                        ticket.clientName
                      }}</span>
                    </div>
                    <div v-if="ticket.clientPhone" class="flex items-start">
                      <span class="text-sm text-gray-500 w-24 flex-shrink-0"
                        >Телефон:</span
                      >
                      <a
                        :href="`tel:${ticket.clientPhone}`"
                        class="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {{ ticket.clientPhone }}
                      </a>
                    </div>
                    <div v-if="ticket.clientEmail" class="flex items-start">
                      <span class="text-sm text-gray-500 w-24 flex-shrink-0"
                        >Email:</span
                      >
                      <a
                        :href="`mailto:${ticket.clientEmail}`"
                        class="text-sm text-blue-600 hover:text-blue-700 font-medium break-all"
                      >
                        {{ ticket.clientEmail }}
                      </a>
                    </div>
                    <div v-if="ticket.telegramId" class="flex items-start">
                      <span class="text-sm text-gray-500 w-24 flex-shrink-0"
                        >Telegram:</span
                      >
                      <span class="text-sm text-gray-900 font-medium">{{
                        ticket.telegramId
                      }}</span>
                    </div>
                    <div v-if="ticket.maxId" class="flex items-start">
                      <span class="text-sm text-gray-500 w-24 flex-shrink-0"
                        >Max ID:</span
                      >
                      <span class="text-sm text-gray-900 font-medium">{{
                        ticket.maxId
                      }}</span>
                    </div>
                  </div>
                </div>

                <!-- Ticket Details -->
                <div class="p-4 border-b border-gray-200">
                  <h4
                    class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"
                  >
                    <AppIcon name="file-text" :size="16" />
                    Детали тикета
                  </h4>
                  <div class="space-y-3">
                    <div class="flex items-start">
                      <span class="text-sm text-gray-500 w-24 flex-shrink-0"
                        >Номер:</span
                      >
                      <span class="text-sm text-gray-900 font-medium"
                        >#{{ ticket.number }}</span
                      >
                    </div>
                    <div class="flex items-start">
                      <span class="text-sm text-gray-500 w-24 flex-shrink-0"
                        >Тема:</span
                      >
                      <span class="text-sm text-gray-900">{{
                        ticket.subject
                      }}</span>
                    </div>
                    <div class="flex items-start">
                      <span class="text-sm text-gray-500 w-24 flex-shrink-0"
                        >Создан:</span
                      >
                      <span class="text-sm text-gray-900">
                        {{
                          format(
                            new Date(ticket.createdAt),
                            "dd.MM.yyyy HH:mm",
                            {
                              locale: ru,
                            }
                          )
                        }}
                      </span>
                    </div>
                    <div class="flex items-start">
                      <span class="text-sm text-gray-500 w-24 flex-shrink-0"
                        >Обновлен:</span
                      >
                      <span class="text-sm text-gray-900">
                        {{
                          format(
                            new Date(ticket.updatedAt),
                            "dd.MM.yyyy HH:mm",
                            {
                              locale: ru,
                            }
                          )
                        }}
                      </span>
                    </div>
                    <div v-if="ticket.assignedTo" class="flex items-start">
                      <span class="text-sm text-gray-500 w-24 flex-shrink-0"
                        >Назначен:</span
                      >
                      <span class="text-sm text-gray-900 font-medium">{{
                        ticket.assignedTo
                      }}</span>
                    </div>
                    <div class="flex items-start">
                      <span class="text-sm text-gray-500 w-24 flex-shrink-0"
                        >Источник:</span
                      >
                      <div class="flex items-center gap-2">
                        <div
                          :class="[
                            'w-6 h-6 rounded flex items-center justify-center',
                            getSourceColor(ticket.source),
                          ]"
                        >
                          <AppIcon
                            :name="getSourceIcon(ticket.source)"
                            :size="12"
                          />
                        </div>
                        <span class="text-sm text-gray-900 capitalize">{{
                          ticket.source
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Actions -->
                <div class="p-4">
                  <h4
                    class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"
                  >
                    <AppIcon name="settings" :size="16" />
                    Управление тикетом
                  </h4>
                  <div class="space-y-3">
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Завершить с статусом:
                      </label>
                      <select
                        v-model="newStatus"
                        class="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="">Выберите статус</option>
                        <option value="resolved">Решен</option>
                        <option value="unresolved">Не решен</option>
                        <option value="closed">Закрыт</option>
                      </select>
                    </div>

                    <button
                      @click="closeTicket"
                      :disabled="!newStatus || isClosing"
                      class="w-full px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      <AppIcon
                        v-if="isClosing"
                        name="refresh-cw"
                        :size="16"
                        class="animate-spin"
                      />
                      {{ isClosing ? "Закрытие..." : "Закрыть тикет" }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </template>

    <!-- Not Found -->
    <div v-else class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <AppIcon
          name="message-circle"
          :size="48"
          class="text-gray-400 mx-auto mb-4"
        />
        <h2 class="text-xl font-semibold text-gray-900 mb-2">
          Тикет не найден
        </h2>
        <button
          @click="goBack"
          class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Вернуться к списку
        </button>
      </div>
    </div>
  </div>
</template>
