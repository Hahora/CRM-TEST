import { authService } from "./auth";

// ── Типы ──

export type VisitStatus =
  | "zaplanirovano"
  | "zapisalsya"
  | "prishel"
  | "ne_prishel"
  | "otlozhil_bez_depozita"
  | "otlozhil_s_depozitom"
  | "otlozhil_do_vechera"
  | "kupil"
  | "sdelka_provalena";

export interface VisitClient {
  moysklad_id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface VisitEmployee {
  moysklad_id: string;
  full_name: string;
  short_fio?: string;
  phone?: string;
  email?: string;
  position?: string;
  archived?: boolean;
  retail_store_id?: string;
  local_id?: number;
  branch_id?: number;
  branch_name?: string;
}

export interface Visit {
  id: number;
  client_moysklad_id: string | null;
  employee_moysklad_id: string | null;
  time_slot: string;
  fitting_room: number;
  status: VisitStatus;
  fitting: boolean;
  size: string | null;
  color: string | null;
  source: string | null;
  notes: string | null;
  client: VisitClient | null;
  employee: VisitEmployee | null;
}

export interface ScheduleResponse {
  date: string;
  branch_id?: number;
  branch_moysklad_id?: string;
  branch_name: string;
  time_slots: string[];
  fitting_rooms: number[];
  visits: Visit[];
}

export interface CreateVisitData {
  client_moysklad_id?: string;
  employee_moysklad_id?: string;
  branch_moysklad_id: string;
  visit_datetime: string;
  fitting_room: number;
  size?: string;
  color?: string;
  source?: string;
  notes?: string;
  status?: VisitStatus;
  fitting?: boolean;
}

export interface UpdateVisitData {
  client_moysklad_id?: string;
  employee_moysklad_id?: string;
  status?: VisitStatus;
  fitting_room?: number;
  fitting?: boolean;
  size?: string;
  color?: string;
  source?: string;
  notes?: string;
}

// ── Branches ──

export interface Branch {
  moysklad_id: string;
  name: string;
  address?: string;
  city?: string;
  postal_code?: string;
  description?: string;
  is_active: boolean;
  // merged local fields
  local_id?: number;
  code?: string;
  region?: string;
  country?: string;
  phone?: string;
  email?: string;
  working_hours?: string;
  timezone?: string;
  is_main?: boolean;
}

// ── Statistics ──

export interface VisitStatsSummary {
  total_visits: number;
  by_status: Record<string, number>;
  scheduled_count: number;
  purchased_count: number;
  failed_count: number;
  postponed_deposit_count: number;
  postponed_no_deposit_count: number;
  no_show_count: number;
  conversion_rate: number;
  total_purchase_amount: number;
  by_branch: Record<string, number>;
}

// ── Статусы ──

export const VISIT_STATUSES: { value: VisitStatus; label: string }[] = [
  { value: "zaplanirovano", label: "Запланировано" },
  { value: "zapisalsya", label: "Записался" },
  { value: "prishel", label: "Пришёл" },
  { value: "ne_prishel", label: "Не пришёл" },
  { value: "otlozhil_bez_depozita", label: "Отложил без деп." },
  { value: "otlozhil_s_depozitom", label: "Отложил с деп." },
  { value: "otlozhil_do_vechera", label: "Отложил до вечера" },
  { value: "kupil", label: "Купил" },
  { value: "sdelka_provalena", label: "Сделка провалена" },
];

export const VISIT_SOURCES = [
  "Instagram",
  "WhatsApp",
  "Telegram",
  "Звонок",
  "Сайт",
  "Рекомендация",
  "Проходил мимо",
  "Повторный визит",
  "Другое",
];

// ── API ──

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

  // ── Schedule ──

  async getSchedule(
    date: string,
    branchMoyskladId: string
  ): Promise<ScheduleResponse> {
    const params = new URLSearchParams({
      schedule_date: date,
      branch_moysklad_id: branchMoyskladId,
    });
    return this.makeRequest<ScheduleResponse>(
      `/api/v1/visits/schedule?${params}`
    );
  }

  async createVisit(data: CreateVisitData): Promise<Visit> {
    return this.makeRequest<Visit>("/api/v1/visits/schedule", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateVisit(visitId: number, data: UpdateVisitData): Promise<Visit> {
    return this.makeRequest<Visit>(`/api/v1/visits/schedule/${visitId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ── Employees ──

  /** Сотрудники филиала по local branch_id */
  async getEmployeesByBranch(
    branchId: number,
    search?: string
  ): Promise<VisitEmployee[]> {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const qs = params.toString();
    return this.makeRequest<VisitEmployee[]>(
      `/api/v1/employees/branch/${branchId}${qs ? "?" + qs : ""}`
    );
  }

  /** Все сотрудники (merged) с фильтрацией */
  async searchEmployees(
    search?: string,
    branchId?: number
  ): Promise<VisitEmployee[]> {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (branchId) params.set("branch_id", String(branchId));
    const qs = params.toString();
    return this.makeRequest<VisitEmployee[]>(
      `/api/v1/employees${qs ? "?" + qs : ""}`
    );
  }

  // ── Statistics ──

  /** Сводная статистика визитов с фильтрацией по датам и филиалу */
  async getVisitStats(opts?: {
    startDate?: string;
    endDate?: string;
    branchId?: number;
  }): Promise<VisitStatsSummary> {
    const params = new URLSearchParams();
    if (opts?.startDate) params.set("start_date", opts.startDate);
    if (opts?.endDate) params.set("end_date", opts.endDate);
    if (opts?.branchId) params.set("branch_id", String(opts.branchId));
    const qs = params.toString();
    return this.makeRequest<VisitStatsSummary>(
      `/api/v1/visits/statistics/summary${qs ? "?" + qs : ""}`
    );
  }

  // ── Branches ──

  /** Live branches (MoySklad + local merged) */
  async getBranches(): Promise<Branch[]> {
    return this.makeRequest<Branch[]>("/api/v1/branches/live");
  }
}

export const visitsApi = new VisitsApiService();
