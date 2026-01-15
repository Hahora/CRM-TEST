export interface Client {
  id: number;
  full_name: string;
  phone: string;
  email?: string;
  gender?: "male" | "female";
  birth_date?: string;
  telegram_id?: string;
  max_id?: string;
  referred_by_id?: number;
  created_by_id?: number;
  created_at: string;
  updated_at: string;
  // Дополнительные поля для детального просмотра
  total_purchases?: number;
  total_spent?: number;
  last_purchase_date?: string;
  last_visit_date?: string;
  visit_count?: number;
  leads_count?: number;
}

export interface ClientsStats {
  total_clients: number;
  total_spent: number;
  average_purchase: number;
  // Опциональные поля, которые могут прийти или не прийти
  new_clients_this_month?: number;
  active_clients?: number;
  top_clients?: Array<{
    client_id: number;
    full_name: string;
    total_spent: number;
    purchase_count: number;
  }>;
}

export interface ClientsFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateClientData {
  full_name: string;
  phone: string;
  email?: string;
  gender?: "male" | "female";
  birth_date?: string;
  telegram_id?: string;
  max_id?: string;
  referred_by_id?: number;
}

export interface ClientsListResponse {
  clients: Client[];
  total: number;
}
