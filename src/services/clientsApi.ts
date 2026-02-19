import { authService } from "./auth";
import type {
  Client,
  ClientsStats,
  CreateClientData,
  ClientsListResponse,
} from "@/types/clients";

export type CompanyType = "individual" | "legal" | "entrepreneur";

export interface ClientsFiltersApi {
  search?: string;
  telegram_id?: string;
  source?: string;
  is_wedding?: boolean;
  has_local_data?: boolean;
  archived?: boolean;
  created_after?: string;
  created_before?: string;
  offset?: number;
  limit?: number;
  // МойСклад-фильтры
  company_types?: string | string[];
  sex?: string;
  sales_amount_min?: number;
  sales_amount_max?: number;
  // Пост-фильтры
  receipts_count_min?: number;
  receipts_count_max?: number;
  avg_receipt_min?: number;
  avg_receipt_max?: number;
  max_receipt_min?: number;
  max_receipt_max?: number;
  // Сортировка
  sort_by?: string;
  sort_order?: string;
}

export interface UpdateClientData {
  name?: string;
  company_type?: CompanyType;
  phone?: string;
  email?: string;
  sex?: "MALE" | "FEMALE" | "";
  birth_date?: string;
  telegram_id?: string;
  max_id?: string;
  is_wedding?: boolean;
  wedding_date?: string | null;
  bride_name?: string | null;
  source?: string;
  referred_by_id?: number;
  // Юр. лицо
  inn?: string;
  kpp?: string;
  ogrn?: string;
  legal_address?: string;
  // ИП + Физ. лицо
  ogrnip?: string;
  legal_last_name?: string;
  legal_first_name?: string;
  legal_middle_name?: string;
}

export interface SearchResult {
  id?: number;
  moysklad_id?: string;
  name?: string;
  phone?: string;
  email?: string;
  [key: string]: any;
}

export interface SalesStats {
  total_sales_amount: number;
  total_sales_count: number;
  average_receipt: number;
  period_from: string;
  period_to: string;
}

export interface PurchaseItem {
  name: string;
  article?: string;
  code?: string;
  quantity: number;
  price: number;
  discount?: number;
  total: number;
}

export interface Purchase {
  id: string;
  name: string;
  moment: string;
  sum: number;
  store: string;
  items: PurchaseItem[];
}

export interface ClientDetail {
  id: number | null;
  moysklad_id: string;
  name: string;
  phone: string;
  email?: string;
  company_type?: string;
  sex?: string;
  birth_date?: string;
  telegram_id?: string;
  max_id?: string;
  is_wedding?: boolean;
  wedding_date?: string;
  bride_name?: string;
  source?: string;
  legal_first_name?: string;
  legal_last_name?: string;
  legal_middle_name?: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
  ogrnip?: string;
  legal_address?: string;
  sales_amount: number;
  receipts_count?: number;
  avg_receipt?: number;
  max_receipt?: number;
  total_spent?: number;
  total_purchases: number;
  last_purchase_date: string | null;
  visit_count: number;
  created_at?: string;
  updated_at?: string;
  purchases: {
    purchases: Purchase[];
    total: number;
    limit: number;
    offset: number;
  };
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

    // 204 No Content — нет тела (DELETE и т.д.)
    if (
      response.status === 204 ||
      response.headers.get("content-length") === "0"
    ) {
      return undefined as T;
    }

    return response.json();
  }

  // ── Получить список клиентов (offset/limit, search по имени/телефону/email) ──
  async getClients(
    filters: ClientsFiltersApi = {}
  ): Promise<ClientsListResponse> {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.telegram_id) params.append("telegram_id", filters.telegram_id);
    if (filters.source) params.append("source", filters.source);
    if (filters.is_wedding !== undefined)
      params.append("is_wedding", String(filters.is_wedding));
    if (filters.has_local_data !== undefined)
      params.append("has_local_data", String(filters.has_local_data));
    if (filters.created_after)
      params.append("created_after", filters.created_after);
    if (filters.created_before)
      params.append("created_before", filters.created_before);
    if (filters.company_types) {
      const types = Array.isArray(filters.company_types) ? filters.company_types : [filters.company_types];
      types.forEach((t) => params.append("company_types", t));
    }
    if (filters.sex) params.append("sex", filters.sex);
    if (filters.sales_amount_min != null) params.append("sales_amount_min", String(filters.sales_amount_min));
    if (filters.sales_amount_max != null) params.append("sales_amount_max", String(filters.sales_amount_max));
    if (filters.receipts_count_min != null) params.append("receipts_count_min", String(filters.receipts_count_min));
    if (filters.receipts_count_max != null) params.append("receipts_count_max", String(filters.receipts_count_max));
    if (filters.avg_receipt_min != null) params.append("avg_receipt_min", String(filters.avg_receipt_min));
    if (filters.avg_receipt_max != null) params.append("avg_receipt_max", String(filters.avg_receipt_max));
    if (filters.max_receipt_min != null) params.append("max_receipt_min", String(filters.max_receipt_min));
    if (filters.max_receipt_max != null) params.append("max_receipt_max", String(filters.max_receipt_max));
    if (filters.sort_by) params.append("sort_by", filters.sort_by);
    if (filters.sort_order) params.append("sort_order", filters.sort_order);

    // Пагинация: offset + limit
    if (filters.offset !== undefined && filters.offset > 0)
      params.append("offset", filters.offset.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    const url = `/api/v1/clients${queryString ? `?${queryString}` : ""}`;

    return this.makeRequest<ClientsListResponse>(url);
  }

  // ── Поиск по телефону ──
  async searchByPhone(phone: string): Promise<SearchResult[]> {
    const cleanPhone = phone.replace(/[^\d+]/g, "");
    if (!cleanPhone) return [];
    const params = new URLSearchParams({ phone: cleanPhone });
    return this.makeRequest<SearchResult[]>(
      `/api/v1/clients/moysklad/search/phone?${params}`
    );
  }

  // ── Поиск по имени ──
  async searchByName(name: string): Promise<SearchResult[]> {
    const trimmed = name.trim();
    if (!trimmed) return [];
    const params = new URLSearchParams({ name: trimmed });
    return this.makeRequest<SearchResult[]>(
      `/api/v1/clients/moysklad/search/name?${params}`
    );
  }

  // ── Поиск по email ──
  async searchByEmail(email: string): Promise<SearchResult[]> {
    const trimmed = email.trim();
    if (!trimmed) return [];
    const params = new URLSearchParams({ email: trimmed });
    return this.makeRequest<SearchResult[]>(
      `/api/v1/clients/moysklad/search/email?${params}`
    );
  }

  // ── Получить детали клиента ──
  async getClient(clientId: number): Promise<Client> {
    return this.makeRequest<Client>(`/api/v1/clients/${clientId}`);
  }

  // ── Создать клиента (MoySklad + локальные extras) ──
  // POST /clients/full
  async createClient(clientData: CreateClientData): Promise<Client> {
    return this.makeRequest<Client>("/api/v1/clients/full", {
      method: "POST",
      body: JSON.stringify(clientData),
    });
  }

  // ── Обновить клиента (MoySklad + локальные extras) ──
  // PUT /clients/{id}/full
  async updateClient(
    clientId: number,
    clientData: UpdateClientData
  ): Promise<Client> {
    return this.makeRequest<Client>(`/api/v1/clients/${clientId}/full`, {
      method: "PUT",
      body: JSON.stringify(clientData),
    });
  }

  // ── Удалить клиента ──
  // DELETE /clients/{id}
  async deleteClient(moyskladId: string): Promise<void> {
    try {
      await this.makeRequest<void>(`/api/v1/clients/${moyskladId}`, {
        method: "DELETE",
      });
    } catch (e: any) {
      if (e instanceof TypeError && e.message === "Failed to fetch") {
        console.warn(
          `DELETE ${moyskladId}: network error (CORS?), считаем удалённым`
        );
        return;
      }
      throw e;
    }
  }

  // ── Статистика продаж ──
  // GET /api/v1/clients/statistics/sales?moment_from=...&moment_to=...
  async getSalesStats(
    momentFrom: string,
    momentTo: string
  ): Promise<SalesStats> {
    const params = new URLSearchParams({
      moment_from: momentFrom,
      moment_to: momentTo,
    });
    return this.makeRequest<SalesStats>(
      `/api/v1/clients/statistics/sales?${params}`
    );
  }

  // ── Детали клиента с покупками ──
  // GET /api/v1/clients/{moysklad_id}/detail
  async getClientDetail(
    moyskladId: string,
    purchasesLimit = 10,
    purchasesOffset = 0
  ): Promise<ClientDetail> {
    const params = new URLSearchParams({
      purchases_limit: String(purchasesLimit),
      purchases_offset: String(purchasesOffset),
    });
    return this.makeRequest<ClientDetail>(
      `/api/v1/clients/${moyskladId}/detail?${params}`
    );
  }

  // ── Экспорт ──
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
