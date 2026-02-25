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
  full_name?: string;
  name?: string;
  phone?: string;
  email?: string | null;
  telegram_id?: string | number | null;
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
  appointment_datetime: string | null;
  notes: string | null;
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
  content: string;
  direction: "incoming" | "outgoing";
  sender: "client" | "manager";
  client_name?: string;
  source_type?: string;
  timestamp: string;
  message_id?: number;
  senderName?: string;
}

export interface WsNewLead {
  type: "new_lead";
  lead_id: number;
  client_name?: string;
  status?: string;
  source_type?: string;
  created_at?: string;
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

  getMessages(id: number, skip = 0, limit = 200): Promise<LeadMessagesResponse> {
    const q = new URLSearchParams({ skip: String(skip), limit: String(limit) });
    return this.request<LeadMessagesResponse>(`/api/v1/leads/${id}/messages?${q}`);
  }

  // ── WebSocket ─────────────────────────────────────────────────────────────

  /** Возвращает URL для WebSocket соединения */
  getWsUrl(userId: number): string {
    const wsBase = this.baseUrl.replace(/^http/, "ws");
    return `${wsBase}/api/v1/leads/ws/${userId}`;
  }
}

export const leadsApi = new LeadsApiService();
