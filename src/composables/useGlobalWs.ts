import { leadsApi } from "@/services/leadsApi";
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
let wsRouter: Router | null = null;
let wsUserId: number | null = null;

/** Lead IDs currently marked as is_new=true (source of truth for badge). */
const newLeadIdSet = new Set<number>();

/** Page-level subscribers (Tickets.vue etc.) */
const listeners = new Set<EventListener>();

const { newCount: badgeCount } = useTicketsBadge();

// ── Internal message handler ───────────────────────────────────────────────────

function handleMsg(event: MessageEvent) {
  try {
    const data: GwsEvent = JSON.parse(event.data);
    const { addToast } = useToast();

    if (data.type === "new_lead") {
      if (!newLeadIdSet.has(data.lead_id)) {
        newLeadIdSet.add(data.lead_id);
        badgeCount.value += 1;
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
    }

    // Broadcast to page-level subscribers
    for (const fn of listeners) {
      try { fn(data); } catch { /* ignore subscriber errors */ }
    }
  } catch { /* ignore parse/unknown errors */ }
}

// ── Internal connect ───────────────────────────────────────────────────────────

function doConnect(userId: number) {
  if (ws) return; // already connected
  if (wsTimer) { clearTimeout(wsTimer); wsTimer = null; }
  try {
    ws = new WebSocket(leadsApi.getWsUrl(userId));
    ws.onopen = () => { wsAttempt = 0; };
    ws.onmessage = handleMsg;
    ws.onerror = () => { ws = null; };
    ws.onclose = (e) => {
      ws = null;
      if (e.code === 4001) return; // Unauthorized — no reconnect
      const delay = Math.min(1000 * Math.pow(2, wsAttempt), 30000);
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
    if (wsUserId === userId && ws) return; // already initialised for this user
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
    wsAttempt = 0;
    newLeadIdSet.clear();
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

  return { init, disconnect, addListener };
}
