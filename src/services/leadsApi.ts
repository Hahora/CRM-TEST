import { authService } from "./auth";

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface LeadStatus {
  id: number;
  name: string;
  color_code: string;
  order: number;
  is_final: boolean;
}

export interface LeadClient {
  id?: number;
  moysklad_id?: string | null;
  full_name?: string | null;
  name?: string | null;
  // Поля физ.лица / ИП (могут прийти от API)
  legal_first_name?: string | null;
  legal_last_name?: string | null;
  legal_middle_name?: string | null;
  phone?: string | null;
  email?: string | null;
  telegram_id?: string | number | null;
  telegram_user_id?: string | null;
  max_id?: string | null;
  is_wedding?: boolean;
  source?: string | null;
  branch_moysklad_id?: string | null;
}

/** Собрать отображаемое имя клиента: full_name → name → ФИО → source_name → fallback */
export function resolveClientName(
  client: LeadClient | null,
  sourceName: string | null,
  fallbackId: number,
): string {
  if (!client) return sourceName || `Клиент #${fallbackId}`;
  if (client.full_name) return client.full_name;
  if (client.name)      return client.name;
  const parts = [client.legal_last_name, client.legal_first_name, client.legal_middle_name].filter(Boolean);
  if (parts.length)     return parts.join(" ");
  return sourceName || `Клиент #${fallbackId}`;
}

export interface LeadUser {
  id: number;
  login: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
}

export interface Lead {
  id: number;
  client_id: number | null;
  status_id: number;
  assigned_to_id: number | null;
  source_type: string;
  source_id: string | null;
  source_name: string | null;
  source_username?: string | null; // Telegram @username без @
  appointment_datetime: string | null;
  notes: string | null;
  is_new: boolean;               // true — менеджер ещё не ответил
  is_blocked: boolean;           // true — пользователь заблокирован в боте
  created_at: string;
  updated_at: string;
  status: LeadStatus;
  client: LeadClient | null;
  assigned_to: LeadUser | null;
}

export interface LeadsResponse {
  leads: Lead[];
  total: number;
}

export interface LeadsParams {
  skip?: number;
  limit?: number;
  status_id?: number;
  assigned_to_id?: number;
  client_id?: number;
  source_type?: string;
  source_id?: string;
  is_closed?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface LeadsStats {
  active: number;
  closed: number;
}

export interface MessageAttachment {
  type: string;           // "sticker" | "photo" | "voice" | "video_note" | ...
  file_id: string;
  file_unique_id?: string;
  file_size?: number;
  // sticker
  is_animated?: boolean;
  is_video?: boolean;
  emoji?: string;
  set_name?: string;
  // photo
  width?: number;
  height?: number;
  // voice / video_note
  duration?: number;
  mime_type?: string;
  // video_note
  length?: number;        // размер стороны квадрата в пикселях
}

export interface LeadMessage {
  id: number;
  lead_id: number;
  client_id: number | null;
  direction: "incoming" | "outgoing";
  platform: string;
  content: string;
  read_at: string | null;
  created_at: string;
  attachments?: MessageAttachment[];
}

export interface LeadMessagesResponse {
  messages: LeadMessage[];
  total: number;
}

export interface CreateLeadData {
  client_id: number;
  source_type: string;
  status_id?: number | null;
  assigned_to_id?: number | null;
  source_id?: string | null;
  appointment_datetime?: string | null;
  notes?: string | null;
}

export interface UpdateLeadData {
  source_type?: string;
  source_id?: string | null;
  appointment_datetime?: string | null;
  notes?: string | null;
  status_id?: number;
  assigned_to_id?: number | null;
  client_id?: number | null;
}

// ── WebSocket message types ───────────────────────────────────────────────────

export interface WsNewMessage {
  type: "new_message";
  lead_id: number;
  message_id?: number;
  content: string;
  direction: "incoming" | "outgoing";
  sender: "client" | "manager";
  sender_name?: string | null;
  client_name?: string;
  source_name?: string | null;
  source_type?: string;
  attachments?: MessageAttachment[];
  timestamp: string;
}

export interface WsNewLead {
  type: "new_lead";
  lead_id: number;
  is_new?: boolean;
  client_name?: string;
  source_name?: string;
  source_username?: string;
  status?: LeadStatus;
  source_type?: string;
  created_at?: string;
}

export interface WsLeadStatusChanged {
  type: "lead_status_changed";
  lead_id: number;
  status: LeadStatus;
  is_new: boolean;
  changed_by: string;
}

export interface WsLeadUpdated {
  type: "lead_updated";
  lead_id: number;
  is_new: boolean;
}

export interface WsTyping {
  type: "typing";
  lead_id: number;
  user_id: string;
  user_name: string;
}

export interface WsSubscriptionConfirmed {
  type: "subscription_confirmed";
  lead_id: number;
  status: "subscribed" | "unsubscribed";
}

// ── Service ───────────────────────────────────────────────────────────────────

class LeadsApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const doFetch = async (): Promise<Response> => {
      const token = authService.getAccessToken();
      return fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(options.headers as Record<string, string>),
        },
      });
    };

    let response = await doFetch();

    if (response.status === 401) {
      try {
        const newTokens = await authService.refreshToken();
        authService.setTokens(newTokens.access_token, newTokens.refresh_token);
        response = await doFetch();
      } catch {
        authService.clearTokens();
        // Refresh провалился — сессия недействительна, редиректим на логин
        window.location.replace("/login");
        throw new Error("Сессия истекла");
      }
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let msg = `Ошибка сервера: ${response.status}`;
      try {
        const json = JSON.parse(text);
        if (json.detail) msg = json.detail;
      } catch { /* ignore */ }
      const err = new Error(msg);
      (err as any).status = response.status;
      throw err;
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  }

  // ── Статусы ────────────────────────────────────────────────────────────────

  getStats(): Promise<LeadsStats> {
    return this.request<LeadsStats>("/api/v1/leads/stats");
  }

  getStatuses(): Promise<LeadStatus[]> {
    return this.request<LeadStatus[]>("/api/v1/leads/statuses");
  }

  // ── CRUD лидов ─────────────────────────────────────────────────────────────

  getList(params: LeadsParams = {}): Promise<LeadsResponse> {
    const q = new URLSearchParams();
    if (params.skip != null)           q.set("skip",            String(params.skip));
    if (params.limit != null)          q.set("limit",           String(params.limit));
    if (params.status_id != null)      q.set("status_id",       String(params.status_id));
    if (params.assigned_to_id != null) q.set("assigned_to_id",  String(params.assigned_to_id));
    if (params.client_id != null)      q.set("client_id",       String(params.client_id));
    if (params.source_type != null)    q.set("source_type",     params.source_type);
    if (params.source_id != null)      q.set("source_id",       params.source_id);
    if (params.is_closed != null)      q.set("is_closed",       String(params.is_closed));
    if (params.date_from != null)      q.set("date_from",       params.date_from);
    if (params.date_to != null)        q.set("date_to",         params.date_to);
    const qs = q.toString();
    return this.request<LeadsResponse>(`/api/v1/leads/${qs ? "?" + qs : ""}`);
  }

  create(data: CreateLeadData): Promise<Lead> {
    return this.request<Lead>("/api/v1/leads/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getById(id: number): Promise<Lead> {
    return this.request<Lead>(`/api/v1/leads/${id}`);
  }

  update(id: number, data: UpdateLeadData): Promise<Lead> {
    return this.request<Lead>(`/api/v1/leads/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ── Действия с лидом ──────────────────────────────────────────────────────

  changeStatus(id: number, statusId: number, comment = ""): Promise<Lead> {
    return this.request<Lead>(`/api/v1/leads/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status_id: statusId, comment }),
    });
  }

  endDialogue(id: number): Promise<void> {
    return this.request<void>(`/api/v1/leads/${id}/end-dialogue`, { method: "POST" });
  }

  sendMessage(id: number, message: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/api/v1/leads/${id}/send-message`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  getMessages(
    id: number,
    options: { limit?: number; before_id?: number } = {},
  ): Promise<LeadMessagesResponse> {
    const params = new URLSearchParams({ limit: String(options.limit ?? 50) });
    if (options.before_id != null) params.set("before_id", String(options.before_id));
    return this.request<LeadMessagesResponse>(`/api/v1/leads/${id}/messages?${params}`);
  }

  // ── WebSocket ─────────────────────────────────────────────────────────────

  /** Возвращает URL для WebSocket соединения (с токеном в query) */
  getWsUrl(userId: number): string {
    const wsBase  = this.baseUrl.replace(/^http/, "ws");
    const token   = authService.getAccessToken();
    const tokenQs = token ? `?token=${encodeURIComponent(token)}` : "";
    return `${wsBase}/api/v1/leads/ws/${userId}${tokenQs}`;
  }

  blockClient(id: number): Promise<void> {
    return this.request<void>(`/api/v1/leads/${id}/block-client`, { method: "POST" });
  }

  unblockClient(id: number): Promise<void> {
    return this.request<void>(`/api/v1/leads/${id}/block-client`, { method: "DELETE" });
  }

  /** Прокси-URL для получения файла из Telegram по file_id (с токеном).
   *  file_id кодируется т.к. может содержать +, / и другие спецсимволы. */
  telegramFileUrl(fileId: string): string {
    const token = authService.getAccessToken();
    const base  = `${this.baseUrl}/api/v1/telegram-files/${encodeURIComponent(fileId)}`;
    return token ? `${base}?token=${encodeURIComponent(token)}` : base;
  }
}

export const leadsApi = new LeadsApiService();
