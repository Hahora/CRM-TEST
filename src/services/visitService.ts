import axios from "axios";
import type { AxiosInstance } from "axios";

export interface Visit {
  id: number;
  visit_datetime: string;
  duration_minutes: number;
  purpose: string;
  notes: string;
  status: string;
  fitting: boolean;
  source: string;
  wishes: string;
  client_id: number;
  employee_id: number;
  branch_id: number;
  sale_id?: number;
  feedback_rating?: number;
  feedback_comment?: string;
  purchase_amount?: string;
  purchased_items?: any;
  created_at: string;
  updated_at: string;
  client?: {
    id: number;
    full_name: string;
    phone: string;
  };
  employee?: {
    id: number;
    full_name: string;
  };
  branch?: {
    id: number;
    name: string;
  };
  sale?: {
    id: number;
    total_amount: string;
  };
}

export interface VisitsResponse {
  visits: Visit[];
  total: number;
}

export interface CreateVisitData {
  visit_datetime: string;
  duration_minutes: number;
  purpose: string;
  notes: string;
  status: string;
  fitting: boolean;
  source: string;
  wishes: string;
  client_id: number;
  employee_id: number;
  branch_id: number;
}

export interface VisitFilters {
  skip?: number;
  limit?: number;
  search?: string;
  client_id?: number;
  employee_id?: number;
  branch_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
}

class VisitService {
  private api: AxiosInstance;

  constructor() {
    const baseURL = import.meta.env?.VITE_API_URL || "http://localhost:8000";

    this.api = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Получить список визитов
  async getVisits(filters: VisitFilters = {}): Promise<VisitsResponse> {
    try {
      const response = await this.api.get<VisitsResponse>("/api/v1/visits", {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching visits:", error);
      throw error;
    }
  }

  // Создать новый визит
  async createVisit(visitData: CreateVisitData): Promise<Visit> {
    try {
      const response = await this.api.post<Visit>("/api/v1/visits", visitData);
      return response.data;
    } catch (error) {
      console.error("Error creating visit:", error);
      throw error;
    }
  }

  // Получить визит по ID
  async getVisit(visitId: number): Promise<Visit> {
    try {
      const response = await this.api.get<Visit>(`/api/v1/visits/${visitId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching visit:", error);
      throw error;
    }
  }

  // Обновить визит
  async updateVisit(
    visitId: number,
    visitData: Partial<CreateVisitData>
  ): Promise<Visit> {
    try {
      const response = await this.api.put<Visit>(
        `/api/v1/visits/${visitId}`,
        visitData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating visit:", error);
      throw error;
    }
  }

  // Удалить визит
  async deleteVisit(visitId: number): Promise<void> {
    try {
      await this.api.delete(`/api/v1/visits/${visitId}`);
    } catch (error) {
      console.error("Error deleting visit:", error);
      throw error;
    }
  }

  // Получить статистику визитов
  async getVisitStatistics(
    filters: { start_date?: string; end_date?: string; branch_id?: number } = {}
  ) {
    try {
      const response = await this.api.get("/api/v1/visits/statistics/summary", {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching visit statistics:", error);
      throw error;
    }
  }

  // Экспорт данных визитов
  async exportVisits(filters: VisitFilters = {}) {
    try {
      const response = await this.api.get("/api/v1/visits/export/data", {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error("Error exporting visits:", error);
      throw error;
    }
  }
}

export const visitService = new VisitService();
