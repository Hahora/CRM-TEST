import axios from "axios";
import type { AxiosInstance } from "axios";

export interface User {
  id: number;
  login: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  is_active: boolean;
  role: {
    id: number;
    name: string;
    description: string;
  };
  created_at: string;
  updated_at: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
}

class UserService {
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

  // Получить текущего пользователя
  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.api.get<User>("/api/v1/auth/me");
      return response.data;
    } catch (error) {
      console.error("Error fetching current user:", error);
      throw error;
    }
  }

  // Получить список пользователей
  async getUsers(
    params: { skip?: number; limit?: number } = {}
  ): Promise<UsersResponse> {
    try {
      const response = await this.api.get<UsersResponse>("/api/v1/users", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  // Получить пользователя по ID
  async getUser(userId: number): Promise<User> {
    try {
      const response = await this.api.get<User>(`/api/v1/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  }
}

export const userService = new UserService();
