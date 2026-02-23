import { authService } from "./auth";

export interface ApiUser {
  id: number;
  login: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  is_active: boolean;
  branch_id: number | null;
  employee_id: number | null;
  role: {
    id: number;
    name: string;
    description: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateUserPayload {
  login: string;
  password: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  role_id: number;
  branch_id?: number | null;
  is_active?: boolean;
}

export interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  middle_name?: string | null;
  is_active?: boolean;
  branch_id?: number | null;
  password?: string;
}

class UsersApiService {
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

  async getUsers(): Promise<ApiUser[]> {
    const res = await this.request<{ users: ApiUser[] } | ApiUser[]>("/api/v1/users");
    return Array.isArray(res) ? res : (res as { users: ApiUser[] }).users ?? [];
  }

  createUser(data: CreateUserPayload): Promise<ApiUser> {
    return this.request<ApiUser>("/api/v1/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateUser(id: number, data: UpdateUserPayload): Promise<ApiUser> {
    return this.request<ApiUser>(`/api/v1/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  deleteUser(id: number): Promise<void> {
    return this.request<void>(`/api/v1/users/${id}`, {
      method: "DELETE",
    });
  }
}

export const usersApi = new UsersApiService();
