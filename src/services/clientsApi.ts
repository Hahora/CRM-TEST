import { authService } from "./auth";
import type {
  Client,
  ClientsStats,
  CreateClientData,
  ClientsListResponse,
} from "@/types/clients";

export interface ClientsFiltersApi {
  search?: string;
  full_name?: string;
  phone?: string;
  email?: string;
  telegram_id?: string;
  created_after?: string;
  created_before?: string;
  skip?: number;
  limit?: number;
}

export interface UpdateClientData {
  full_name: string;
  phone: string;
  email?: string;
  gender?: "male" | "female";
  birth_date?: string;
  telegram_id?: string;
  max_id?: string;
  referred_by_id?: number;
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

  // Получить список клиентов
  async getClients(
    filters: ClientsFiltersApi = {}
  ): Promise<ClientsListResponse> {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.full_name) params.append("full_name", filters.full_name);
    if (filters.phone) params.append("phone", filters.phone);
    if (filters.email) params.append("email", filters.email);
    if (filters.telegram_id) params.append("telegram_id", filters.telegram_id);
    if (filters.created_after)
      params.append("created_after", filters.created_after);
    if (filters.created_before)
      params.append("created_before", filters.created_before);
    if (filters.skip !== undefined)
      params.append("skip", filters.skip.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    const url = `/api/v1/clients${queryString ? `?${queryString}` : ""}`;

    return this.makeRequest<ClientsListResponse>(url);
  }

  // Получить детали клиента
  async getClient(clientId: number): Promise<Client> {
    return this.makeRequest<Client>(`/api/v1/clients/${clientId}`);
  }

  // Создать клиента
  async createClient(clientData: CreateClientData): Promise<Client> {
    return this.makeRequest<Client>("/api/v1/clients", {
      method: "POST",
      body: JSON.stringify(clientData),
    });
  }

  // Обновить клиента
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
