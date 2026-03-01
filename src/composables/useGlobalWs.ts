import { leadsApi } from "@/services/leadsApi";
import { authService } from "@/services/auth";
import type {
  WsNewLead,
  WsNewMessage,
  WsLeadStatusChanged,
  WsLeadUpdated,
} from "@/services/leadsApi";
import { useTicketsBadge } from "./useTicketsBadge";
import { useToast } from "./useToast";
import type { Router } from "vue-router";

export type GwsEvent =
  | WsNewLead
  | WsNewMessage
  | WsLeadStatusChanged
  | WsLeadUpdated;

type EventListener = (data: GwsEvent) => void;

// ── Singleton state ────────────────────────────────────────────────────────────

let ws: WebSocket | null = null;
let wsAttempt = 0;
let wsTimer: ReturnType<typeof setTimeout> | null = null;
let wsStabilityTimer: ReturnType<typeof setTimeout> | null = null;
let wsRouter: Router | null = null;
let wsUserId: number | null = null;

/** Lead IDs currently marked as is_new=true (source of truth for badge). */
const newLeadIdSet = new Set<number>();

/** Lead IDs for which a toast was already shown in this session. */
const toastedLeadIds = new Set<number>();

/** Page-level subscribers (Tickets.vue etc.) */
const listeners = new Set<EventListener>();

/** Callbacks fired every time WS (re)connects — used by TicketChat to re-subscribe. */
const connectedCallbacks = new Set<() => void>();

const { newCount: badgeCount } = useTicketsBadge();

// ── Internal message handler ───────────────────────────────────────────────────

function handleMsg(event: MessageEvent) {
  try {
    const data: GwsEvent = JSON.parse(event.data);
    const { addToast } = useToast();

    if (data.type === "new_lead") {
      // Показываем тост только если тикет реально новый для нас (не известен с инициализации
      // и не из прошлого события). При переподключении бэкенд может прислать new_lead для
      // уже известных тикетов — их игнорируем.
      if (!newLeadIdSet.has(data.lead_id)) {
        newLeadIdSet.add(data.lead_id);
        badgeCount.value += 1;
      }
      if (!toastedLeadIds.has(data.lead_id)) {
        toastedLeadIds.add(data.lead_id);
        addToast({
          type: "info",
          title: "Новый тикет",
          action: {
            label: "Перейти",
            onClick: () => wsRouter?.push(`/tickets/${data.lead_id}`),
          },
        });
      }
    } else if (data.type === "new_message") {
      if (data.direction === "incoming") {
        // Incoming message → ticket becomes "new" if it wasn't already
        if (!newLeadIdSet.has(data.lead_id)) {
          newLeadIdSet.add(data.lead_id);
          badgeCount.value += 1;
        }
      } else {
        // Outgoing (manager replied) → ticket no longer "new"
        if (newLeadIdSet.has(data.lead_id)) {
          newLeadIdSet.delete(data.lead_id);
          badgeCount.value = Math.max(0, badgeCount.value - 1);
        }
      }
    } else if (
      (data.type === "lead_updated" || data.type === "lead_status_changed") &&
      data.is_new === false
    ) {
      if (newLeadIdSet.has(data.lead_id)) {
        newLeadIdSet.delete(data.lead_id);
        badgeCount.value = Math.max(0, badgeCount.value - 1);
      }
      // Сбрасываем флаг «тост показан» — если тикет снова станет новым, покажем тост заново
      toastedLeadIds.delete(data.lead_id);
    }

    // Broadcast to page-level subscribers
    for (const fn of listeners) {
      try { fn(data); } catch { /* ignore subscriber errors */ }
    }
  } catch { /* ignore parse/unknown errors */ }
}

// ── Internal connect ───────────────────────────────────────────────────────────

function doConnect(userId: number) {
  // CONNECTING(0) или OPEN(1) — уже подключены
  if (ws && ws.readyState < WebSocket.CLOSING) return;
  ws = null; // сбросить stale CLOSED-ссылку если вдруг осталась
  if (wsTimer) { clearTimeout(wsTimer); wsTimer = null; }
  try {
    ws = new WebSocket(leadsApi.getWsUrl(userId));
    ws.onopen = () => {
      // Сбрасываем backoff только если соединение продержалось 30+ секунд.
      // Это предотвращает flood тоннельных подключений при нестабильном канале.
      if (wsStabilityTimer) clearTimeout(wsStabilityTimer);
      wsStabilityTimer = setTimeout(() => { wsAttempt = 0; wsStabilityTimer = null; }, 30_000);
      for (const fn of connectedCallbacks) { try { fn(); } catch { /* ignore */ } }
    };
    ws.onmessage = handleMsg;
    ws.onerror = () => { /* no-op — onclose всегда срабатывает после error */ };
    ws.onclose = (e) => {
      ws = null;
      // Отменяем таймер стабильности — соединение не было стабильным
      if (wsStabilityTimer) { clearTimeout(wsStabilityTimer); wsStabilityTimer = null; }
      if (e.code === 4001) return; // Unauthorized — no reconnect
      // Если токены уже сброшены (logout / refresh failed) — не переподключаемся
      if (!authService.getAccessToken()) return;
      // Базовая задержка 3 с (было 1 с), макс 60 с (было 30 с) — меньше давления на тоннель
      const delay = Math.min(3000 * Math.pow(2, wsAttempt), 60_000);
      wsAttempt++;
      wsTimer = setTimeout(() => doConnect(userId), delay);
    };
  } catch { /* WS unavailable */ }
}

// ── Public composable ──────────────────────────────────────────────────────────

export function useGlobalWs() {
  /**
   * Load initial badge count from API and start the global WS.
   * Should be called once when the user is authenticated.
   */
  const init = async (userId: number, router: Router) => {
    if (wsUserId === userId) return; // already initialised for this user
    wsRouter = router;
    wsUserId = userId;

    // Load initial badge count (up to 500 active leads)
    try {
      const res = await leadsApi.getList({ limit: 500, is_closed: false });
      const newLeads = res.leads.filter((l) => l.is_new);
      newLeadIdSet.clear();
      newLeads.forEach((l) => newLeadIdSet.add(l.id));
      badgeCount.value = newLeads.length;
    } catch { /* ignore — badge stays 0 */ }

    doConnect(userId);
  };

  /** Disconnect WS and reset badge state (on logout). */
  const disconnect = () => {
    if (wsTimer) { clearTimeout(wsTimer); wsTimer = null; }
    if (wsStabilityTimer) { clearTimeout(wsStabilityTimer); wsStabilityTimer = null; }
    wsAttempt = 0;
    newLeadIdSet.clear();
    toastedLeadIds.clear();
    ws?.close();
    ws = null;
    wsUserId = null;
    badgeCount.value = 0;
  };

  /**
   * Subscribe to WS events from any page component.
   * Returns a cleanup function — call it in onUnmounted.
   */
  const addListener = (fn: EventListener): (() => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  };

  /**
   * Send an action over the global WS (e.g. subscribe/unsubscribe).
   * Does nothing if the WS is not currently open.
   */
  const sendAction = (data: Record<string, unknown>): void => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  };

  /**
   * Register a callback that fires every time the WS (re)connects.
   * Use this in TicketChat to re-subscribe after a reconnect.
   * Returns a cleanup function.
   */
  const addConnectedListener = (fn: () => void): (() => void) => {
    connectedCallbacks.add(fn);
    return () => connectedCallbacks.delete(fn);
  };

  return { init, disconnect, addListener, sendAction, addConnectedListener };
}

// ── Vite HMR cleanup ──────────────────────────────────────────────────────────
// При горячей замене модуля (сохранение файла в dev-режиме) закрываем старый WS,
// иначе ghost-соединение остаётся живым и дублирует handleMsg → дублируются тосты.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (wsTimer) { clearTimeout(wsTimer); wsTimer = null; }
    if (wsStabilityTimer) { clearTimeout(wsStabilityTimer); wsStabilityTimer = null; }
    if (ws) { ws.onclose = null; ws.onerror = null; ws.onmessage = null; ws.close(); ws = null; }
    wsUserId = null;
    wsAttempt = 0;
    newLeadIdSet.clear();
    toastedLeadIds.clear();
    listeners.clear();
    connectedCallbacks.clear();
  });
}
