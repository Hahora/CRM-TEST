<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import AppIcon from "@/components/AppIcon.vue";
import { leadsApi } from "@/services/leadsApi";
import type { LeadStatus, LeadMessage } from "@/services/leadsApi";
import { clientsApi } from "@/services/clientsApi";
import ClientCreateModal from "@/components/clients/ClientCreateModal.vue";
import type { NewClientData } from "@/components/clients/ClientCreateModal.vue";
import { useAuth } from "@/composables/useAuth";

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

// ── Состояние ─────────────────────────────────────────────────────────────────

const route  = useRoute();
const router = useRouter();
const { user } = useAuth();

const ticketId      = computed(() => route.params.id as string);
const ticket        = ref<Ticket | null>(null);
const messages      = ref<Message[]>([]);
const statuses      = ref<LeadStatus[]>([]);
const newMessage    = ref("");
const closeStatusId = ref<number | null>(null);
const isLoading     = ref(true);
const isSending     = ref(false);
const isClosing     = ref(false);
const showInfo      = ref(false);
const sendError     = ref("");
const messagesEl    = ref<HTMLElement>();
const textareaEl    = ref<HTMLTextAreaElement>();

// ── Привязка клиента ──────────────────────────────────────────────────────────
const clientLinked    = ref(true);
const showCreateModal = ref(false);

let ws: WebSocket | null = null;

// ── Справочники ───────────────────────────────────────────────────────────────

const getStatus = (s: string): { label: string; cls: string } => {
  switch (s) {
    case "active":     return { label: "Активен",  cls: "bg-yellow-100 text-yellow-700" };
    case "resolved":   return { label: "Решён",    cls: "bg-green-100 text-green-700"   };
    case "unresolved": return { label: "Не решён", cls: "bg-red-100 text-red-700"       };
    default:           return { label: "Закрыт",   cls: "bg-gray-100 text-gray-600"     };
  }
};

const getSourceLabel = (s: string) => (s === "telegram" ? "Telegram" : "МАКС");

// Только финальные статусы — для закрытия тикета
const finalStatuses = computed(() => statuses.value.filter((s) => s.is_final));

// ── WebSocket ─────────────────────────────────────────────────────────────────

const connectWs = () => {
  if (!user.value?.id) return;
  try {
    ws = new WebSocket(leadsApi.getWsUrl(user.value.id));
    ws.onopen = () => {
      ws?.send(JSON.stringify({ action: "subscribe", lead_id: Number(ticketId.value) }));
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_message" && String(data.lead_id) === ticketId.value) {
          const sender: "client" | "support" = data.direction === "outgoing" ? "support" : "client";
          // Не дублируем — если уже есть по message_id
          if (data.message_id && messages.value.some((m) => m.id === String(data.message_id))) return;
          // Снимаем pending-флаг для этого текста (если это наш исходящий)
          if (data.direction === "outgoing" && data.content) {
            pendingTexts.delete(data.content);
          }
          messages.value.push({
            id:        data.message_id ? String(data.message_id) : Date.now().toString(),
            text:      data.content,
            sender,
            timestamp: data.timestamp || new Date().toISOString(),
            isRead:    false,
          });
          scrollToBottom();
        }
      } catch { /* ignore */ }
    };
    ws.onerror = () => { ws = null; };
    ws.onclose = () => { ws = null; };
  } catch { /* WS недоступен */ }
};

const disconnectWs = () => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ action: "unsubscribe", lead_id: Number(ticketId.value) }));
  }
  ws?.close();
  ws = null;
};

// ── Методы ────────────────────────────────────────────────────────────────────

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
  });
};

// Auto-resize textarea (как в Telegram)
const autoResize = () => {
  const el = textareaEl.value;
  if (!el) return;
  el.style.height = "auto";
  const maxH = 120; // ~4 строки
  const newH = Math.min(el.scrollHeight, maxH);
  el.style.height = newH + "px";
  el.style.overflowY = el.scrollHeight > maxH ? "auto" : "hidden";
};

const resetTextarea = () => {
  const el = textareaEl.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.overflowY = "hidden";
};

// iOS visual viewport — прокручиваем вниз когда открывается клавиатура
const onVpResize = () => scrollToBottom();

const mapMessage = (m: LeadMessage): Message => ({
  id:        String(m.id),
  text:      m.content,
  sender:    m.direction === "outgoing" ? "support" : "client",
  timestamp: m.created_at,
  isRead:    m.read_at != null,
});

const load = async () => {
  disconnectWs(); // Закрываем предыдущий WS перед переподключением
  isLoading.value = true;
  try {
    const [lead, leadStatuses, msgResponse] = await Promise.all([
      leadsApi.getById(Number(ticketId.value)),
      leadsApi.getStatuses(),
      leadsApi.getMessages(Number(ticketId.value)),
    ]);
    statuses.value = leadStatuses;

    const sn = lead.status.name.toLowerCase();
    let status: Ticket["status"];
    if (!lead.status.is_final)                                    status = "active";
    else if (sn.includes("не реш") || sn.includes("unresolved")) status = "unresolved";
    else if (sn.includes("реш")    || sn.includes("resolved"))   status = "resolved";
    else                                                           status = "closed";

    const client = lead.client;
    const clientName =
      client?.full_name || client?.name || lead.source_name || `Клиент #${lead.client_id ?? lead.id}`;
    const assignedName = lead.assigned_to
      ? [lead.assigned_to.first_name, lead.assigned_to.last_name]
          .filter(Boolean).join(" ") || lead.assigned_to.login
      : undefined;

    // Убираем строки смены статуса из notes перед использованием как subject
    const cleanNotes = (lead.notes || "")
      .split("\n")
      .filter((l: string) => !l.startsWith("[Status changed"))
      .join("\n")
      .trim();

    const lastMsg = msgResponse.messages[msgResponse.messages.length - 1];
    ticket.value = {
      id: String(lead.id), number: lead.id, clientName,
      clientPhone:  client?.phone,
      telegramId:   client?.telegram_id ? String(client.telegram_id) : undefined,
      status, priority: "medium",
      source:       lead.source_type === "telegram" ? "telegram" : "max",
      subject:      cleanNotes.slice(0, 60) || `Тикет #${lead.id}`,
      lastMessage:  lastMsg?.content || lead.notes || "—",
      assignedTo:   assignedName,
      createdAt:    lead.created_at,
      updatedAt:    lead.updated_at,
      resolvedAt:   lead.status.is_final ? lead.updated_at : undefined,
      messagesCount: msgResponse.total,
      isUnread: !lead.status.is_final,
    };

    messages.value = msgResponse.messages.map(mapMessage);
    clientLinked.value = lead.client_id != null;

    connectWs();
    scrollToBottom();
  } catch {
    router.push("/tickets");
  } finally {
    isLoading.value = false;
  }
};

// Временный ключ для отслеживания сообщений, ожидающих подтверждения от WS
const pendingTexts = new Set<string>();

const send = async () => {
  const text = newMessage.value.trim();
  if (!text || isSending.value) return;
  isSending.value = true;
  sendError.value = "";
  const backup = newMessage.value;
  newMessage.value = "";
  resetTextarea();
  // Добавляем ДО await — WS-событие может прийти раньше HTTP-ответа
  pendingTexts.add(text);
  try {
    await leadsApi.sendMessage(Number(ticketId.value), text);
    // Ждём WS-подтверждения; если оно не придёт за 3 с — добавляем сами
    setTimeout(() => {
      if (pendingTexts.has(text)) {
        pendingTexts.delete(text);
        messages.value.push({
          id: Date.now().toString(), text, sender: "support",
          timestamp: new Date().toISOString(), isRead: true,
        });
        scrollToBottom();
      }
    }, 3000);
  } catch (e) {
    sendError.value  = e instanceof Error ? e.message : "Не удалось отправить";
    newMessage.value = backup;
    pendingTexts.delete(text); // Очищаем при ошибке
  } finally {
    isSending.value = false;
  }
};

const closeTicket = async () => {
  if (closeStatusId.value == null || isClosing.value) return;
  isClosing.value = true;
  try {
    await leadsApi.changeStatus(Number(ticketId.value), closeStatusId.value);
    router.push("/tickets");
  } catch {
    isClosing.value = false;
  }
};

const goBack = () => router.push("/tickets");

// ── Создание и привязка клиента ──────────────────────────────────────────────

const createAndLinkClient = async (data: NewClientData) => {
  try {
    const newClient = await clientsApi.createClient(data);
    if (newClient?.id) {
      await leadsApi.update(Number(ticketId.value), { client_id: newClient.id });
      await load();
    }
    showCreateModal.value = false;
  } catch { /* ignore */ }
};

// ── Экспорт чата ─────────────────────────────────────────────────────────────

const exportChat = () => {
  if (!ticket.value || messages.value.length === 0) return;

  const t = ticket.value;
  const header = [
    `Чат тикета #${t.number}`,
    `Клиент: ${t.clientName}${t.clientPhone ? ` · ${t.clientPhone}` : ""}${t.telegramId ? ` · TG ${t.telegramId}` : ""}`,
    `Статус: ${t.status}  Источник: ${t.source === "telegram" ? "Telegram" : "МАКС"}`,
    `Дата выгрузки: ${new Date().toLocaleString("ru-RU")}`,
    "─".repeat(50),
    "",
  ].join("\n");

  const body = messages.value
    .map((m) => {
      const who = m.sender === "support" ? "Поддержка" : "Клиент    ";
      const ts  = new Date(m.timestamp).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
      return `[${ts}] ${who}: ${m.text}`;
    })
    .join("\n");

  const content = header + body + `\n\n${"─".repeat(50)}\nВсего сообщений: ${messages.value.length}`;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `ticket-${t.number}-chat.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Touch-swipe ───────────────────────────────────────────────────────────────

const touchStartY = ref(0);
const onTouchStart = (e: TouchEvent) => { touchStartY.value = e.touches[0]?.clientY ?? 0; };
const onTouchEnd   = (e: TouchEvent) => {
  if ((e.changedTouches[0]?.clientY ?? 0) - touchStartY.value > 80) showInfo.value = false;
};

onMounted(() => {
  load();
  window.visualViewport?.addEventListener("resize", onVpResize);
});

onUnmounted(() => {
  disconnectWs();
  window.visualViewport?.removeEventListener("resize", onVpResize);
});
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
      <div class="bg-white border-b border-gray-200 px-3 py-2 flex-shrink-0 tc-header">
        <div class="flex items-center gap-2">
          <!-- Back -->
          <button
            @click="goBack"
            class="tc-touch-btn text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
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
          </div>

          <!-- Badges + actions (desktop) -->
          <div class="hidden sm:flex items-center gap-2 flex-shrink-0">
            <span
              class="px-2 py-0.5 rounded-full text-xs font-medium"
              :class="getStatus(ticket.status).cls"
            >
              {{ getStatus(ticket.status).label }}
            </span>
            <!-- Экспорт чата -->
            <button
              @click="exportChat"
              :disabled="messages.length === 0"
              class="tc-touch-btn text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-40"
              title="Выгрузить чат"
            >
              <AppIcon name="download" :size="16" />
            </button>
          </div>

          <!-- Mobile actions -->
          <div class="sm:hidden flex items-center flex-shrink-0">
            <!-- Экспорт -->
            <button
              @click="exportChat"
              :disabled="messages.length === 0"
              class="tc-touch-btn text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-40"
              title="Выгрузить чат"
            >
              <AppIcon name="download" :size="18" />
            </button>
            <!-- Инфо -->
            <button
              @click="showInfo = true"
              class="tc-touch-btn text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <AppIcon name="info" :size="18" />
            </button>
          </div>
        </div>
      </div>

      <!-- Body -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Desktop sidebar -->
        <aside class="hidden md:flex w-72 flex-col bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
          <!-- Client info -->
          <div class="p-4 border-b border-gray-100">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Клиент</h3>
              <button
                v-if="!clientLinked"
                @click="showCreateModal = true"
                class="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <AppIcon name="user-plus" :size="11" />
                Привязать
              </button>
            </div>
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
                v-model="closeStatusId"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option :value="null">Выберите статус</option>
                <option v-for="s in finalStatuses" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
              <button
                @click="closeTicket"
                :disabled="closeStatusId == null || isClosing"
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
            class="tc-messages flex-1 overflow-y-auto px-4 py-4 space-y-3"
          >
            <div
              v-for="msg in messages"
              :key="msg.id"
              class="flex"
              :class="msg.sender === 'support' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[80%] sm:max-w-sm md:max-w-md px-3.5 py-2.5 rounded-2xl"
                :class="
                  msg.sender === 'support'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                "
              >
                <p class="text-sm leading-relaxed whitespace-pre-wrap break-words">{{ msg.text }}</p>
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
          <div class="tc-input-bar border-t border-gray-100 px-3 pt-2 flex-shrink-0">
            <form @submit.prevent="send" class="flex items-end gap-2">
              <textarea
                ref="textareaEl"
                v-model="newMessage"
                rows="1"
                placeholder="Написать сообщение..."
                :disabled="isSending"
                enterkeyhint="send"
                class="tc-textarea flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                @input="autoResize"
                @keydown.enter.exact.prevent="send"
              />
              <button
                type="submit"
                :disabled="!newMessage.trim() || isSending"
                class="flex-shrink-0 tc-send-btn bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <AppIcon name="send" :size="16" />
              </button>
            </form>
            <!-- Error -->
            <p v-if="sendError" class="text-xs text-red-500 mt-1 px-1">{{ sendError }}</p>
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
              class="tc-sheet bg-white rounded-t-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
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
                  class="tc-touch-btn text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
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
                </div>

                <!-- Client -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Клиент</h4>
                    <button
                      v-if="!clientLinked"
                      @click="showInfo = false; showCreateModal = true"
                      class="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors"
                    >
                      <AppIcon name="user-plus" :size="11" />
                      Привязать
                    </button>
                  </div>
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
                      v-model="closeStatusId"
                      class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option :value="null">Выберите статус</option>
                      <option v-for="s in finalStatuses" :key="s.id" :value="s.id">{{ s.name }}</option>
                    </select>
                    <button
                      @click="closeTicket"
                      :disabled="closeStatusId == null || isClosing"
                      class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

    <!-- ── Модальное окно создания клиента ── -->
    <ClientCreateModal
      :open="showCreateModal"
      @close="showCreateModal = false"
      @create="createAndLinkClient"
    />
  </div>
</template>

<style scoped>
/* ── Textarea auto-resize (как в Telegram) ─── */
.tc-textarea {
  resize: none;
  overflow-y: hidden;
  line-height: 1.5;
  min-height: 38px;
  max-height: 120px;
  display: block;
  /* Убираем стандартный скроллбар — выглядит некрасиво */
  scrollbar-width: none;
}
.tc-textarea::-webkit-scrollbar {
  display: none;
}

/* ── Сенд-кнопка: минимум 44×44px (Apple HIG) ── */
.tc-send-btn {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
}

/* ── Touch-кнопки: минимум 44×44px ── */
.tc-touch-btn {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* ── Messages: momentum scroll + overscroll lock ── */
.tc-messages {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}

/* ── Input bar: safe area для home indicator iPhone ── */
.tc-input-bar {
  padding-bottom: max(10px, env(safe-area-inset-bottom));
}

/* ── Bottom sheet: safe area ── */
.tc-sheet {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
