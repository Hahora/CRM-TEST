export interface Visit {
  id: string;
  client_id: string;
  employee_id: string;
  branch_id: string;
  visit_datetime: string;
  duration_minutes?: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";
  purpose: string;
  notes?: string;
  wishes?: string;
  fitting: boolean;
  source: string;
  purchase_amount?: number;
  purchased_items?: {
    product_name: string;
    quantity: number;
    price: number;
  };
  feedback_rating?: number;
  feedback_comment?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;

  // Связанные данные
  client: {
    id: string;
    full_name: string;
    phone: string;
    email?: string;
    total_spent?: number;
  };
  employee: {
    id: string;
    full_name: string;
    position: string;
  };
  branch: {
    id: string;
    name: string;
    address: string;
  };
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

export interface VisitsStats {
  total_visits: number;
  by_status: Record<string, number>;
  by_branch: Array<{
    branch_id: string;
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

export interface FilterOptions {
  branches: Array<{
    value: string;
    label: string;
  }>;
  employees: Array<{
    value: string;
    label: string;
    branch_id?: string;
  }>;
  clients: Array<{
    value: string;
    label: string;
    phone: string;
    email?: string;
  }>;
  statuses: Array<{
    value: string;
    label: string;
  }>;
}

export interface CreateVisitData {
  client_id: string;
  employee_id: string;
  branch_id: string;
  visit_datetime: string;
  duration_minutes?: number;
  purpose: string;
  notes?: string;
  wishes?: string;
  fitting: boolean;
  source: string;
  status?: string;
}

export interface UpdateVisitData extends Partial<CreateVisitData> {
  status?: Visit["status"];
  purchase_amount?: number;
  purchased_items?: Visit["purchased_items"];
  feedback_rating?: number;
  feedback_comment?: string;
}

export const VISIT_STATUSES = [
  {
    value: "scheduled",
    label: "Запланирован",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "in_progress",
    label: "В процессе",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "completed",
    label: "Завершен",
    color: "bg-green-100 text-green-800",
  },
  { value: "cancelled", label: "Отменен", color: "bg-red-100 text-red-800" },
  { value: "no_show", label: "Не явился", color: "bg-gray-100 text-gray-800" },
];

export const VISIT_SOURCES = [
  { value: "website", label: "Сайт" },
  { value: "phone", label: "Телефон" },
  { value: "telegram", label: "Telegram" },
  { value: "walk_in", label: "Пришел сам" },
  { value: "referral", label: "Рекомендация" },
  { value: "social_media", label: "Соц. сети" },
];

export interface VisitFeedback {
  id: string;
  visit_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface VisitsListResponse {
  visits: Visit[];
  total: number;
  page: number;
  limit: number;
}

export interface VisitsFiltersApi {
  search?: string;
  status?: string;
  branch_id?: number;
  employee_id?: number;
  client_id?: number;
  start_date?: string;
  end_date?: string;
  fitting?: boolean;
  has_purchase?: boolean;
  skip?: number;
  limit?: number;
}

export interface ExportFilters {
  start_date?: string;
  end_date?: string;
  branch_id?: number;
}
