import { authService } from "./auth";

// ── Типы ──

export type VisitStatus =
  | "zapisalsya"
  | "prishel"
  | "ne_prishel"
  | "otlozhil_bez_depozita"
  | "otlozhil_s_depozitom"
  | "kupil"
  | "sdelka_provalena"
  | "vykupil_depozit";

/** Клиент внутри визита (nested) */
export interface VisitClient {
  moysklad_id: string | null;
  name?: string;
  full_name?: string;
  phone?: string;
  email?: string;
  is_phantom?: boolean;
}

/** Сотрудник внутри визита (nested) */
export interface VisitEmployee {
  moysklad_id: string;
  full_name: string;
  short_fio?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  position?: string;
  archived?: boolean;
  retail_store_id?: string;
}

/** Филиал внутри визита (nested, из GET /api/v1/visits) */
export interface VisitBranch {
  moysklad_id: string;
  name: string;
}

/** Визит (schedule + visits list) */
export interface Visit {
  id: number;
  client_moysklad_id: string | null;
  employee_moysklad_id: string | null;
  branch_moysklad_id?: string | null;
  time_slot: string;
  fitting_room: number;
  status: VisitStatus;
  fitting: boolean;
  size: string | null;
  color: string | null;
  source: string | null;
  notes: string | null;
  is_phantom_client?: boolean;
  deposit_amount?: number | null;
  postponed_until?: string | null;
  visit_datetime?: string;
  client: VisitClient | null;
  employee: VisitEmployee | null;
  branch?: VisitBranch | null;
}

/** Ответ расписания GET /api/v1/visits/schedule */
export interface ScheduleResponse {
  date: string;
  branch_moysklad_id: string;
  time_slots: string[];
  fitting_rooms: number[];
  visits: Visit[];
}

/** Создание визита POST /api/v1/visits/schedule */
export interface CreateVisitData {
  branch_moysklad_id: string;
  client_moysklad_id?: string;
  employee_moysklad_id?: string;
  visit_datetime: string;
  fitting_room: number;
  fitting?: boolean;
  size?: string;
  color?: string;
  source?: string;
  notes?: string;
  status?: VisitStatus;
  is_phantom_client?: boolean;
  phantom_client_name?: string;
  phantom_client_phone?: string;
  phantom_client_email?: string;
  deposit_amount?: number;
  postponed_until?: string;
}

/** Обновление визита PUT /api/v1/visits/schedule/{id} */
export interface UpdateVisitData {
  client_moysklad_id?: string;
  employee_moysklad_id?: string;
  status?: VisitStatus;
  time_slot?: string;
  fitting_room?: number;
  fitting?: boolean;
  size?: string;
  color?: string;
  source?: string;
  notes?: string;
  is_phantom_client?: boolean;
  phantom_client_name?: string;
  phantom_client_phone?: string;
  phantom_client_email?: string;
  deposit_amount?: number;
  postponed_until?: string;
}

// ── Branch Schedule ──

export interface BranchScheduleBase {
  branch_id: number;
  branch_name: string;
  base_schedule: string[];
  total_slots: number;
}

export interface BranchScheduleDate {
  branch_id: number;
  branch_name: string;
  date: string;
  base_schedule: string[];
  additional_slots: string[];
  merged_schedule: string[];
  total_slots: number;
}

// ── Branches (types) ──

export interface Branch {
  moysklad_id: string;
  name: string;
  address?: string;
  city?: string;
  postal_code?: string;
  street?: string;
  house?: string;
  description?: string;
  is_active: boolean;
  // merged local fields
  local_id?: number;
  code?: string;
  region?: string;
  country?: string;
  phone?: string | null;
  email?: string | null;
  working_hours?: string | null;
  timezone?: string;
  is_main?: boolean;
}

// ── Statistics ──

export interface VisitStatsSummary {
  total_visits: number;
  by_status: Record<string, number>;
  purchased_count: number;
  failed_count: number;
  postponed_deposit_count: number;
  postponed_no_deposit_count: number;
  no_show_count: number;
  conversion_rate: number;
}

// ── Статусы ──

export const VISIT_STATUSES: { value: VisitStatus; label: string }[] = [
  { value: "zapisalsya", label: "Записался" },
  { value: "prishel", label: "Пришёл" },
  { value: "ne_prishel", label: "Не пришёл" },
  { value: "otlozhil_bez_depozita", label: "Отложил без деп." },
  { value: "otlozhil_s_depozitom", label: "Отложил с деп." },
  { value: "vykupil_depozit", label: "Выкупил депозит" },
  { value: "kupil", label: "Купил" },
  { value: "sdelka_provalena", label: "Сделка провалена" },
];

export const VISIT_SOURCES = [
  "Instagram",
  "WhatsApp",
  "Telegram",
  "Звонок",
  "Сайт",
  "Порекомендовали",
  "Проходил мимо",
  "Повторный визит",
  "Другое",
];

// ── Visits List ──

export interface VisitsListParams {
  limit?: number;
  offset?: number;
  search?: string;
  client_moysklad_id?: string;
  employee_moysklad_id?: string;
  branch_moysklad_id?: string;
  status?: VisitStatus;
  start_date?: string;
  end_date?: string;
}

export interface VisitsListResponse {
  visits: Visit[];
  total: number;
}

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

  /** GET /api/v1/visits/schedule?schedule_date=...&branch_moysklad_id=... */
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

  /** POST /api/v1/visits/schedule */
  async createVisit(data: CreateVisitData): Promise<Visit> {
    return this.makeRequest<Visit>("/api/v1/visits/schedule", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /** PUT /api/v1/visits/schedule/{visit_id} */
  async updateVisit(visitId: number, data: UpdateVisitData): Promise<Visit> {
    return this.makeRequest<Visit>(`/api/v1/visits/schedule/${visitId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ── Visits List ──

  /** GET /api/v1/visits */
  async getVisits(params?: VisitsListParams): Promise<VisitsListResponse> {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    if (params?.search) qs.set("search", params.search);
    if (params?.client_moysklad_id)
      qs.set("client_moysklad_id", params.client_moysklad_id);
    if (params?.employee_moysklad_id)
      qs.set("employee_moysklad_id", params.employee_moysklad_id);
    if (params?.branch_moysklad_id)
      qs.set("branch_moysklad_id", params.branch_moysklad_id);
    if (params?.status) qs.set("status", params.status);
    if (params?.start_date) qs.set("start_date", params.start_date);
    if (params?.end_date) qs.set("end_date", params.end_date);
    const q = qs.toString();
    return this.makeRequest<VisitsListResponse>(
      `/api/v1/visits${q ? "?" + q : ""}`
    );
  }

  // ── Employees ──

  /** GET /api/v1/employees/branch/{branch_moysklad_id}?search=...&archived=false */
  async getEmployeesByBranch(
    branchMoyskladId: string,
    search?: string
  ): Promise<VisitEmployee[]> {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("archived", "false");
    const qs = params.toString();
    return this.makeRequest<VisitEmployee[]>(
      `/api/v1/employees/branch/${branchMoyskladId}${qs ? "?" + qs : ""}`
    );
  }

  /** GET /api/v1/employees/moysklad/{moysklad_id} */
  async getEmployeeByUuid(moyskladId: string): Promise<VisitEmployee> {
    return this.makeRequest<VisitEmployee>(
      `/api/v1/employees/moysklad/${moyskladId}`
    );
  }

  // ── Statistics ──

  /**
   * GET /api/v1/visits/statistics/summary
   * Supports start_date/end_date OR momentAT/momentTO (higher priority)
   */
  async getVisitStats(opts?: {
    startDate?: string;
    endDate?: string;
    branchMoyskladId?: string;
  }): Promise<VisitStatsSummary> {
    const params = new URLSearchParams();
    if (opts?.startDate) params.set("start_date", opts.startDate);
    if (opts?.endDate) params.set("end_date", opts.endDate);
    if (opts?.branchMoyskladId)
      params.set("branch_moysklad_id", opts.branchMoyskladId);
    const qs = params.toString();
    return this.makeRequest<VisitStatsSummary>(
      `/api/v1/visits/statistics/summary${qs ? "?" + qs : ""}`
    );
  }

  // ── Branches ──

  /** GET /api/v1/branches/live */
  async getBranches(): Promise<Branch[]> {
    return this.makeRequest<Branch[]>("/api/v1/branches/live");
  }

  // ── Branch Schedule ──

  /** GET /api/v1/branches/{branch_id}/schedule — базовое расписание */
  async getBranchSchedule(branchId: number): Promise<BranchScheduleBase> {
    return this.makeRequest<BranchScheduleBase>(
      `/api/v1/branches/${branchId}/schedule`
    );
  }

  /** PUT /api/v1/branches/{branch_id}/schedule — обновить базовое расписание */
  async updateBranchSchedule(
    branchId: number,
    baseSchedule: string[]
  ): Promise<BranchScheduleBase> {
    return this.makeRequest<BranchScheduleBase>(
      `/api/v1/branches/${branchId}/schedule`,
      {
        method: "PUT",
        body: JSON.stringify({ base_schedule: baseSchedule }),
      }
    );
  }

  /** POST /api/v1/branches/{branch_id}/schedule/reset — сбросить к стандартному */
  async resetBranchSchedule(branchId: number): Promise<BranchScheduleBase> {
    return this.makeRequest<BranchScheduleBase>(
      `/api/v1/branches/${branchId}/schedule/reset`,
      {
        method: "POST",
      }
    );
  }

  /** GET /api/v1/branches/{branch_id}/schedule/{date} — расписание на дату */
  async getBranchScheduleForDate(
    branchId: number,
    date: string
  ): Promise<BranchScheduleDate> {
    return this.makeRequest<BranchScheduleDate>(
      `/api/v1/branches/${branchId}/schedule/${date}`
    );
  }

  /** PUT /api/v1/branches/{branch_id}/schedule/{date} — доп. слоты на дату */
  async updateBranchDateSlots(
    branchId: number,
    date: string,
    additionalSlots: string[]
  ): Promise<{ date: string; additional_slots: string[] }> {
    return this.makeRequest<{ date: string; additional_slots: string[] }>(
      `/api/v1/branches/${branchId}/schedule/${date}`,
      {
        method: "PUT",
        body: JSON.stringify({ date, additional_slots: additionalSlots }),
      }
    );
  }

  /** DELETE /api/v1/branches/{branch_id}/schedule/{date} — удалить доп. слоты */
  async deleteBranchDateSlots(
    branchId: number,
    date: string
  ): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(
      `/api/v1/branches/${branchId}/schedule/${date}`,
      {
        method: "DELETE",
      }
    );
  }
}

export const visitsApi = new VisitsApiService();
