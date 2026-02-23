import { authService } from "./auth";

export interface DashboardKPIs {
  total_clients: number;
  today_visits: number;
  active_visits_today: number;
  monthly_revenue: number;
  average_check: number;
  conversion_rate: number;
}

export interface WeeklySalesItem {
  day: string;
  date: string;
  amount: number;
}

export interface WeeklyVisitsItem {
  day: string;
  date: string;
  total: number;
  arrived: number;
  bought: number;
}

export interface RecentActivityItem {
  type: string;
  label: string;
  client_name: string;
  employee_name: string;
  amount: number | null;
  status: string;
  visit_datetime: string;
  updated_at: string;
}

export interface TopClientItem {
  client_moysklad_id: string;
  client_name: string;
  total_amount: number;
  last_visit: string;
}

export interface ScheduleItem {
  id: number;
  time: string;
  client_name: string;
  client_phone: string;
  employee_name: string;
  status: string;
  fitting_room: number;
}

export interface DashboardMain {
  kpis: DashboardKPIs;
  weekly_sales: WeeklySalesItem[];
  weekly_visits: WeeklyVisitsItem[];
  recent_activities: RecentActivityItem[];
  top_clients: TopClientItem[];
  today_schedule: ScheduleItem[];
}

class DashboardApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    this.baseUrl = this.baseUrl.replace(/\/$/, "");
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
    const text = await response.text();
    return JSON.parse(text);
  }

  getMain(branchId?: number): Promise<DashboardMain> {
    const path = branchId != null
      ? `/api/v1/dashboard/main?branch_id=${branchId}`
      : "/api/v1/dashboard/main";
    return this.request<DashboardMain>(path);
  }
}

export const dashboardApi = new DashboardApiService();
