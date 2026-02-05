// types/visits.ts

export interface Visit {
  id: number;
  client_id?: number;
  employee_id?: number;
  branch_id?: number;

  // Основные поля
  visit_datetime: string;
  client_name: string;
  client_phone: string;
  size: string;
  color: string;
  source: string;
  consultant: string;
  comment: string;

  // Примерка
  fitting: boolean;

  // Статусы
  status:
    | "scheduled" // Запланирован
    | "no_show" // Не пришёл
    | "fitting_done" // Примерка проведена
    | "hold_no_deposit" // Отложил без депозита
    | "hold_deposit" // Отложил с депозитом
    | "purchased" // Купил
    | "not_purchased" // Не купил
    | "redeemed" // Выкупил (после отложения)
    | "redeemed_deposit"; // Выкупил (депозит)

  // Поля для отложений
  hold_until?: string; // Дата до которой отложен
  deposit_amount?: number; // Сумма депозита

  // Покупка
  purchase_amount?: number;
  purchased_items?: string; // Что купил

  // Системные
  created_at: string;
  updated_at: string;

  // Связанные данные (приходят с бэкенда)
  client?: {
    id: number;
    full_name: string;
    phone: string;
    email?: string;
  };
  employee?: {
    id: number;
    full_name: string;
    position: string;
  };
  branch?: {
    id: number;
    name: string;
    address: string;
  };
}

export interface VisitsStats {
  total_visits: number;
  by_status: Record<string, number>;
  by_branch: Array<{
    branch_id: number;
    branch_name: string;
    count: number;
  }>;
  conversion_rate: number;
  total_purchase_amount: number;
  average_purchase_amount: number;
  purchased_items_summary: Array<{
    product_name: string;
    count: number;
    total_amount: number;
  }>;
}

export interface VisitsFilters {
  search: string;
  status: string;
  branch_id?: string;
  employee_id?: string;
  client_id?: string;
  start_date: string;
  end_date: string;
  fitting?: boolean;
  has_purchase?: boolean;
}

export interface CreateVisitData {
  client_name: string;
  client_phone: string;
  visit_datetime: string;
  size?: string;
  color?: string;
  source?: string;
  consultant?: string;
  comment?: string;
  fitting?: boolean;
  branch_id?: number;
  employee_id?: number;
}

export interface UpdateVisitData {
  client_name?: string;
  client_phone?: string;
  visit_datetime?: string;
  size?: string;
  color?: string;
  source?: string;
  consultant?: string;
  comment?: string;
  fitting?: boolean;
  status?: Visit["status"];
  hold_until?: string;
  deposit_amount?: number;
  purchase_amount?: number;
  purchased_items?: string;
}

export interface VisitsListResponse {
  visits: Visit[];
  total: number;
  page: number;
  limit: number;
}

export interface ExportFilters {
  start_date?: string;
  end_date?: string;
  branch_id?: number;
  status?: string;
}

// ── Константы ──

export const VISIT_STATUSES = [
  {
    value: "scheduled",
    label: "Запланирован",
    color: "#64748B",
    bg: "#F1F5F9",
  },
  { value: "no_show", label: "Не пришёл", color: "#DC2626", bg: "#FEF2F2" },
  { value: "fitting_done", label: "Примерка", color: "#7C3AED", bg: "#F5F3FF" },
  {
    value: "hold_no_deposit",
    label: "Отложил без депозита",
    color: "#D97706",
    bg: "#FFFBEB",
  },
  {
    value: "hold_deposit",
    label: "Отложил с депозитом",
    color: "#2563EB",
    bg: "#EFF6FF",
  },
  { value: "purchased", label: "Купил", color: "#059669", bg: "#ECFDF5" },
  {
    value: "not_purchased",
    label: "Не купил",
    color: "#DC2626",
    bg: "#FEF2F2",
  },
  { value: "redeemed", label: "Выкупил", color: "#059669", bg: "#ECFDF5" },
  {
    value: "redeemed_deposit",
    label: "Выкупил (депозит)",
    color: "#059669",
    bg: "#ECFDF5",
  },
] as const;

export const VISIT_SOURCES = [
  "Instagram",
  "Facebook",
  "TikTok",
  "YouTube",
  "Рекомендация",
  "Сайт",
  "Яндекс",
  "Google",
  "Вывеска",
  "Листовка",
  "Telegram",
  "Звонок",
  "Пришёл сам",
  "Другое",
] as const;
