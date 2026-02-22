export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: number;
  login: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  is_active: boolean;
  role: {
    id: number;
    name: string;
    description: string;
    permissions: Record<string, any>;
  };
  created_at: string;
  updated_at: string;
}

class AuthService {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    this.timeout = parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000;
    this.baseUrl = this.baseUrl.replace(/\/$/, "");
  }

  private async makeRequest(
    url: string,
    options: RequestInit = {},
    retries = 1
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (response.status === 502 && retries > 0) {
        return this.makeRequest(url, options, retries - 1);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("Превышено время ожидания запроса");
        }
        if (error.message.includes("fetch")) {
          throw new Error(
            `Сервер недоступен. Проверьте подключение к ${this.baseUrl}`
          );
        }
      }

      throw error;
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log(`Попытка входа на ${this.baseUrl}/api/v1/auth/login`);

      const response = await this.makeRequest("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });

      const text = await response.text();
      if (!text) {
        throw new Error("Сервер вернул пустой ответ");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Ответ сервера не является JSON:", text);
        throw new Error("Сервер вернул некорректный ответ");
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Неверный логин или пароль");
        } else if (response.status === 403) {
          throw new Error("Доступ запрещен");
        } else if (response.status === 422) {
          throw new Error("Некорректные данные для входа");
        } else if (response.status >= 500) {
          throw new Error("Внутренняя ошибка сервера");
        } else {
          throw new Error(
            data.detail || data.message || `Ошибка сервера: ${response.status}`
          );
        }
      }

      return data;
    } catch (error) {
      console.error("Ошибка входа:", error);
      throw error;
    }
  }

  async refreshToken(): Promise<LoginResponse> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error("Токен обновления не найден");
      }

      const response = await this.makeRequest("/api/v1/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const text = await response.text();
      if (!text) {
        throw new Error("Сервер вернул пустой ответ");
      }

      const data = JSON.parse(text);

      if (!response.ok) {
        throw new Error(
          data.detail || data.message || "Ошибка обновления токена"
        );
      }

      return data;
    } catch (error) {
      console.error("Ошибка обновления токена:", error);
      this.clearTokens();
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const token = this.getAccessToken();
      if (!token) {
        throw new Error("Токен доступа не найден");
      }

      const response = await this.makeRequest("/api/v1/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        try {
          const newTokens = await this.refreshToken();
          this.setTokens(newTokens.access_token, newTokens.refresh_token);

          const retryResponse = await this.makeRequest("/api/v1/auth/me", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${newTokens.access_token}`,
            },
          });

          if (!retryResponse.ok) {
            throw new Error("Не удалось получить данные пользователя");
          }

          const text = await retryResponse.text();
          return JSON.parse(text);
        } catch (refreshError) {
          this.clearTokens();
          throw new Error("Сессия истекла");
        }
      }

      if (!response.ok) {
        throw new Error("Не удалось получить данные пользователя");
      }

      const text = await response.text();
      if (!text) {
        throw new Error("Сервер вернул пустой ответ");
      }

      return JSON.parse(text);
    } catch (error) {
      console.error("Ошибка получения пользователя:", error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const token = this.getAccessToken();
      if (token) {
        await this.makeRequest("/api/v1/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });
      }
    } catch (error) {
      console.error("Ошибка выхода:", error);
    } finally {
      this.clearTokens();
    }
  }

  setTokens(accessToken: string, refreshToken: string): void {
    // Не сохраняем undefined/null/пустые значения
    if (accessToken && accessToken !== "undefined" && accessToken !== "null") {
      localStorage.setItem("access_token", accessToken);
    }
    if (
      refreshToken &&
      refreshToken !== "undefined" &&
      refreshToken !== "null"
    ) {
      localStorage.setItem("refresh_token", refreshToken);
    }
  }

  getAccessToken(): string | null {
    const token = localStorage.getItem("access_token");
    // Защита от сохранённых "undefined" / "null"
    if (!token || token === "undefined" || token === "null") return null;
    return token;
  }

  getRefreshToken(): string | null {
    const token = localStorage.getItem("refresh_token");
    if (!token || token === "undefined" || token === "null") return null;
    return token;
  }

  clearTokens(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  async checkApiHealth(): Promise<boolean> {
    try {
      console.log(`Проверка доступности API: ${this.baseUrl}/api/v1/ping`);

      const response = await this.makeRequest("/api/v1/ping", {
        method: "GET",
      });

      console.log(`API ping response: ${response.status}`);
      return response.ok;
    } catch (error) {
      console.error("Ошибка соединения с API:", error);
      return false;
    }
  }
}

export const authService = new AuthService();
