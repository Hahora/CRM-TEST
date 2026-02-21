import { authService } from "./auth";

export interface SaleItem {
  name: string;
  article: string;
  code: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  name: string;
  moment: string | null;
  sum: number;
  store: string;
  store_moysklad_id: string | null;
  agent_moysklad_id: string | null;
  agent_name: string;
  items: SaleItem[];
}

export interface SalesResponse {
  sales: Sale[];
  total: number;
}

export interface SalesParams {
  branch_id?: number;
  client_moysklad_id?: string;
  amount_min?: number;
  amount_max?: number;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  skip?: number;
  limit?: number;
}

class SalesApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    this.baseUrl = this.baseUrl.replace(/\/$/, "");
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    retries = 1
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
      if (response.status === 502 && retries > 0) {
        return this.makeRequest(url, options, retries - 1);
      }
      if (response.status === 401) {
        try {
          const newTokens = await authService.refreshToken();
          authService.setTokens(newTokens.access_token, newTokens.refresh_token);
          return this.makeRequest(url, options);
        } catch {
          authService.clearTokens();
          throw new Error("Сессия истекла");
        }
      }
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `HTTP ${response.status}`);
    }

    if (
      response.status === 204 ||
      response.headers.get("content-length") === "0"
    ) {
      return undefined as T;
    }
    return response.json();
  }

  async getSales(params?: SalesParams): Promise<SalesResponse> {
    const qs = new URLSearchParams();
    if (params?.branch_id != null) qs.set("branch_id", String(params.branch_id));
    if (params?.client_moysklad_id) qs.set("client_moysklad_id", params.client_moysklad_id);
    if (params?.amount_min != null) qs.set("amount_min", String(params.amount_min));
    if (params?.amount_max != null) qs.set("amount_max", String(params.amount_max));
    if (params?.start_date) qs.set("start_date", params.start_date);
    if (params?.end_date) qs.set("end_date", params.end_date);
    if (params?.sort_by) qs.set("sort_by", params.sort_by);
    if (params?.sort_order) qs.set("sort_order", params.sort_order);
    if (params?.skip != null) qs.set("skip", String(params.skip));
    if (params?.limit != null) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return this.makeRequest<SalesResponse>(
      `/api/v1/sales/moysklad${q ? "?" + q : ""}`
    );
  }
}

export const salesApi = new SalesApiService();
