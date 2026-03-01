import { authService } from "./auth";

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface BotTemplate {
  id: number;
  name: string;
  content: string;
  category: string;
  bot_type: string;
  language: string;
  is_active: boolean;
  media_url?: string;
  media_type?: string;
  created_at?: string;
}

export interface CreateTemplateData {
  name: string;
  content: string;
  category: string;
  bot_type: string;
  language: string;
  is_active: boolean;
  media_url?: string;
  media_type?: string;
}

export interface Campaign {
  id: number;
  name: string;
  bot_type: string;
  status?: string;
  scheduled_at: string | null;
  sent_at?: string | null;
  created_at?: string;
  template?: BotTemplate;
  template_id?: number;
  segment_filter?: Record<string, unknown>;
}

export interface CreateCampaignData {
  name: string;
  template_id: number;
  bot_type: string;
  segment_filter?: Record<string, unknown>;
  scheduled_at?: string | null;
}

export interface CampaignStats {
  campaign_id: number;
  campaign_name: string;
  total_messages: number;
  sent_messages: number;
  delivered_messages: number;
  read_messages: number;
  failed_messages: number;
  delivery_rate: number;
  read_rate: number;
}

export interface ScheduleResponse {
  campaign_id: number;
  total_recipients: number;
  messages_queued: number;
  scheduled_at: string;
  estimated_completion: string | null;
}

export interface UploadMediaResponse {
  media_url: string;
  media_type: string;
  filename: string;
}

export interface ScheduleCampaignData {
  campaign_id: number;
  send_immediately?: boolean;
  scheduled_at?: string | null;
}

export interface SendMessageData {
  client_id: number;
  bot_type: string;
  message_type: string;
  content: string;
  template_id?: number | null;
  campaign_id?: number | null;
}

export interface BroadcastData {
  bot_type: string;
  message_type: string;
  content: string;
  template_id?: number | null;
  campaign_id?: number | null;
  segment_filter?: Record<string, unknown>;
}

export interface MessageHistory {
  id: number;
  client_id: number;
  bot_type: string;
  message_type: string;
  content: string;
  status: string;
  created_at: string;
  client_name?: string;
}

export interface Analytics {
  period: string;
  total_sent: number;
  total_delivered: number;
  total_opened?: number;
  total_failed?: number;
  delivery_rate?: number;
  open_rate?: number;
}

export interface ClientPreferences {
  telegram_enabled: boolean;
  max_enabled: boolean;
  marketing_messages: boolean;
  utility_messages: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  preferred_language: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

class MailingsApiService {
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

  // ── Медиа ─────────────────────────────────────────────────────────────────

  async uploadMedia(
    file: File,
    mediaType: "photo" | "video" | "document" | "audio"
  ): Promise<UploadMediaResponse> {
    const doFetch = async (): Promise<Response> => {
      const token = authService.getAccessToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("media_type", mediaType);
      return fetch(`${this.baseUrl}/api/v1/bot-communications/upload-media`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
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
      let msg = `Ошибка загрузки медиа: ${response.status}`;
      try { const j = JSON.parse(text); if (j.detail) msg = j.detail; } catch { /* ignore */ }
      throw new Error(msg);
    }

    return response.json();
  }

  // ── Шаблоны ───────────────────────────────────────────────────────────────

  getTemplates(botType?: string): Promise<{ templates: BotTemplate[]; total: number }> {
    const qs = botType ? `?bot_type=${encodeURIComponent(botType)}` : "";
    return this.request<{ templates: BotTemplate[]; total: number }>(
      `/api/v1/bot-communications/templates${qs}`
    );
  }

  createTemplate(data: CreateTemplateData): Promise<BotTemplate> {
    return this.request<BotTemplate>("/api/v1/bot-communications/templates", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateTemplate(id: number, data: Partial<CreateTemplateData>): Promise<BotTemplate> {
    return this.request<BotTemplate>(`/api/v1/bot-communications/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ── Кампании ──────────────────────────────────────────────────────────────

  getCampaigns(skip = 0, limit = 100): Promise<{ campaigns: Campaign[]; total: number }> {
    return this.request<{ campaigns: Campaign[]; total: number }>(
      `/api/v1/bot-communications/campaigns?skip=${skip}&limit=${limit}`
    );
  }

  createCampaign(data: CreateCampaignData): Promise<Campaign> {
    return this.request<Campaign>("/api/v1/bot-communications/campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateCampaign(id: number, data: { name?: string; scheduled_at?: string | null }): Promise<Campaign> {
    return this.request<Campaign>(`/api/v1/bot-communications/campaigns/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  getCampaignStats(id: number): Promise<CampaignStats> {
    return this.request<CampaignStats>(`/api/v1/bot-communications/campaigns/${id}/stats`);
  }

  scheduleCampaign(id: number, data: ScheduleCampaignData): Promise<ScheduleResponse> {
    return this.request<ScheduleResponse>(`/api/v1/bot-communications/campaigns/${id}/schedule`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ── Отправка сообщений ────────────────────────────────────────────────────

  sendMessage(data: SendMessageData): Promise<void> {
    return this.request<void>("/api/v1/bot-communications/send", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  broadcast(data: BroadcastData): Promise<void> {
    return this.request<void>("/api/v1/bot-communications/broadcast", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ── История и аналитика ───────────────────────────────────────────────────

  getHistory(clientId?: number, botType?: string): Promise<MessageHistory[]> {
    const q = new URLSearchParams();
    if (clientId != null) q.set("client_id", String(clientId));
    if (botType)          q.set("bot_type", botType);
    const qs = q.toString();
    return this.request<MessageHistory[]>(
      `/api/v1/bot-communications/history${qs ? "?" + qs : ""}`
    );
  }

  getAnalytics(period = "month"): Promise<Analytics> {
    return this.request<Analytics>(
      `/api/v1/bot-communications/analytics?period=${encodeURIComponent(period)}`
    );
  }

  // ── Настройки клиента ─────────────────────────────────────────────────────

  getClientPreferences(clientId: number): Promise<ClientPreferences> {
    return this.request<ClientPreferences>(
      `/api/v1/bot-communications/client-preferences/${clientId}`
    );
  }

  updateClientPreferences(
    clientId: number,
    data: Partial<ClientPreferences>
  ): Promise<ClientPreferences> {
    return this.request<ClientPreferences>(
      `/api/v1/bot-communications/client-preferences/${clientId}`,
      { method: "PUT", body: JSON.stringify(data) }
    );
  }

  unsubscribeClient(clientId: number, botType: string): Promise<void> {
    return this.request<void>("/api/v1/bot-communications/unsubscribe", {
      method: "POST",
      body: JSON.stringify({ client_id: clientId, bot_type: botType }),
    });
  }
}

export const mailingsApi = new MailingsApiService();
