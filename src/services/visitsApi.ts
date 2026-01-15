import { authService } from "./auth";
import type {
  Visit,
  VisitsStats,
  VisitsListResponse,
  CreateVisitData,
  UpdateVisitData,
  VisitFeedback,
} from "@/types/visits";

export interface VisitsFiltersApi {
  search?: string;
  client_id?: number;
  employee_id?: number;
  branch_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}

class VisitsApiService {
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

  // Получить список посещений
  async getVisits(filters: VisitsFiltersApi = {}): Promise<VisitsListResponse> {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.client_id)
      params.append("client_id", filters.client_id.toString());
    if (filters.employee_id)
      params.append("employee_id", filters.employee_id.toString());
    if (filters.branch_id)
      params.append("branch_id", filters.branch_id.toString());
    if (filters.status) params.append("status", filters.status);
    if (filters.start_date) params.append("start_date", filters.start_date);
    if (filters.end_date) params.append("end_date", filters.end_date);
    if (filters.skip !== undefined)
      params.append("skip", filters.skip.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    const url = `/api/v1/visits${queryString ? `?${queryString}` : ""}`;

    return this.makeRequest<VisitsListResponse>(url);
  }

  // Получить детали посещения
  async getVisit(visitId: number): Promise<Visit> {
    return this.makeRequest<Visit>(`/api/v1/visits/${visitId}`);
  }

  // Создать посещение
  async createVisit(visitData: CreateVisitData): Promise<Visit> {
    return this.makeRequest<Visit>("/api/v1/visits", {
      method: "POST",
      body: JSON.stringify(visitData),
    });
  }

  // Обновить посещение
  async updateVisit(
    visitId: number,
    visitData: UpdateVisitData
  ): Promise<Visit> {
    return this.makeRequest<Visit>(`/api/v1/visits/${visitId}`, {
      method: "PUT",
      body: JSON.stringify(visitData),
    });
  }

  // Добавить отзыв к посещению
  async addVisitFeedback(
    visitId: number,
    feedback: VisitFeedback
  ): Promise<Visit> {
    return this.makeRequest<Visit>(`/api/v1/visits/${visitId}/feedback`, {
      method: "POST",
      body: JSON.stringify(feedback),
    });
  }

  // Получить статистику посещений
  async getVisitsStats(
    filters: {
      start_date?: string;
      end_date?: string;
      branch_id?: number;
    } = {}
  ): Promise<VisitsStats> {
    const params = new URLSearchParams();

    if (filters.start_date) params.append("start_date", filters.start_date);
    if (filters.end_date) params.append("end_date", filters.end_date);
    if (filters.branch_id)
      params.append("branch_id", filters.branch_id.toString());

    const queryString = params.toString();
    const url = `/api/v1/visits/statistics/summary${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest<VisitsStats>(url);
  }

  // Экспорт посещений
  async exportVisits(
    filters: {
      start_date?: string;
      end_date?: string;
      branch_id?: number;
    } = {}
  ): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters.start_date) params.append("start_date", filters.start_date);
    if (filters.end_date) params.append("end_date", filters.end_date);
    if (filters.branch_id)
      params.append("branch_id", filters.branch_id.toString());

    const queryString = params.toString();
    const url = `/api/v1/visits/export/data${
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

export const visitsApi = new VisitsApiService();
