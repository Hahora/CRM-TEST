import { authService } from "./auth";
import type {
  Client,
  ClientsStats,
  CreateClientData,
  ClientsListResponse,
} from "@/types/clients";

// Фильтры для GET /api/v1/clients
export interface ClientsFiltersApi {
  search?: string;
  branch_id?: number;
  is_wedding?: boolean;
  source?: string;
  has_local_data?: boolean;
  telegram_id?: string;
  offset?: number;
  limit?: number;
}

// PUT /api/v1/clients/{id} — только локальные поля
export interface UpdateClientData {
  notes?: string;
  telegram_id?: string;
  max_id?: string;
  is_wedding?: boolean;
  wedding_date?: string | null;
  bride_name?: string | null;
  source?: string;
  social_media?: Record<string, string>;
  tags?: Record<string, unknown>;
  referred_by_id?: number | null;
  branch_id?: number;
}

class ClientsApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    this.baseUrl = this.baseUrl.replace(/\/$/, "");
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = authService.getAccessToken();

    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        try {
          const newTokens = await authService.refreshToken();
          authService.setTokens(
            newTokens.access_token,
            newTokens.refresh_token
          );

          return this.makeRequest(url, options);
        } catch (refreshError) {
          authService.clearTokens();
          throw new Error("Сессия истекла");
        }
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || errorData.message || `HTTP ${response.status}`
      );
    }

    return response.json();
  }

  // Получить объединённый список клиентов (MoySklad + локальные)
  async getClients(
    filters: ClientsFiltersApi = {}
  ): Promise<ClientsListResponse> {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.branch_id !== undefined)
      params.append("branch_id", filters.branch_id.toString());
    if (filters.is_wedding !== undefined)
      params.append("is_wedding", filters.is_wedding.toString());
    if (filters.source) params.append("source", filters.source);
    if (filters.has_local_data !== undefined)
      params.append("has_local_data", filters.has_local_data.toString());
    if (filters.telegram_id) params.append("telegram_id", filters.telegram_id);
    if (filters.offset !== undefined)
      params.append("offset", filters.offset.toString());
    if (filters.limit !== undefined)
      params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    const url = `/api/v1/clients${queryString ? `?${queryString}` : ""}`;

    return this.makeRequest<ClientsListResponse>(url);
  }

  // Получить клиента по локальному ID (с статистикой)
  async getClient(clientId: number): Promise<Client> {
    return this.makeRequest<Client>(`/api/v1/clients/${clientId}`);
  }

  // Получить клиента по MoySklad UUID
  async getClientByMoyskladId(moyskladId: string): Promise<Client> {
    return this.makeRequest<Client>(`/api/v1/clients/moysklad/${moyskladId}`);
  }

  // Поиск контрагента по телефону в MoySklad
  async searchByPhone(
    phone: string
  ): Promise<{ found: boolean; counterparty: Record<string, unknown> | null }> {
    const params = new URLSearchParams({ phone });
    return this.makeRequest(
      `/api/v1/clients/moysklad/search/phone?${params.toString()}`
    );
  }

  // Создать локальные данные клиента (контрагент должен существовать в MoySklad)
  async createClient(clientData: CreateClientData): Promise<Client> {
    return this.makeRequest<Client>("/api/v1/clients", {
      method: "POST",
      body: JSON.stringify(clientData),
    });
  }

  // Обновить локальные данные клиента
  async updateClient(
    clientId: number,
    clientData: UpdateClientData
  ): Promise<Client> {
    return this.makeRequest<Client>(`/api/v1/clients/${clientId}`, {
      method: "PUT",
      body: JSON.stringify(clientData),
    });
  }

  // Получить статистику клиентов
  async getClientsStats(
    filters: {
      created_after?: string;
      created_before?: string;
      branch_id?: number;
    } = {}
  ): Promise<ClientsStats> {
    const params = new URLSearchParams();

    if (filters.created_after)
      params.append("created_after", filters.created_after);
    if (filters.created_before)
      params.append("created_before", filters.created_before);
    if (filters.branch_id)
      params.append("branch_id", filters.branch_id.toString());

    const queryString = params.toString();
    const url = `/api/v1/clients/statistics/summary${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest<ClientsStats>(url);
  }

  // Экспорт клиентов
  async exportClients(
    filters: { created_after?: string; created_before?: string } = {}
  ): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters.created_after)
      params.append("created_after", filters.created_after);
    if (filters.created_before)
      params.append("created_before", filters.created_before);

    const queryString = params.toString();
    const url = `/api/v1/clients/export/data${
      queryString ? `?${queryString}` : ""
    }`;

    const token = authService.getAccessToken();
    const response = await fetch(`${this.baseUrl}${url}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error("Ошибка экспорта данных");
    }

    return response.blob();
  }
}

export const clientsApi = new ClientsApiService();
