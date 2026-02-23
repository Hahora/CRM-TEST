import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { authService, type User, type LoginRequest } from "@/services/auth";
import { useToast } from "@/composables/useToast";

const user = ref<User | null>(null);
const isLoading = ref(false);

export const useAuth = () => {
  const router = useRouter();
  const { showError, showSuccess, showWarning } = useToast();

  const isAuthenticated = computed(() => !!user.value);

  const login = async (credentials: LoginRequest) => {
    isLoading.value = true;

    try {
      const isApiHealthy = await authService.checkApiHealth();
      if (!isApiHealthy) {
        showError(
          "Сервер недоступен",
          "Не удается подключиться к серверу. Проверьте настройки подключения."
        );
        return false;
      }

      const response = await authService.login(credentials);

      authService.setTokens(response.access_token, response.refresh_token);

      const userData = await authService.getCurrentUser();
      user.value = userData;

      await router.push("/dashboard");
      return true;
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.message.includes("401") ||
          err.message.includes("Unauthorized")
        ) {
          showError(
            "Неверные данные",
            "Проверьте правильность логина и пароля"
          );
        } else if (
          err.message.includes("403") ||
          err.message.includes("Forbidden")
        ) {
          showError("Доступ запрещен", "У вас нет прав для входа в систему");
        } else if (err.message.includes("500")) {
          showError(
            "Ошибка сервера",
            "Внутренняя ошибка сервера. Попробуйте позже"
          );
        } else if (err.message.includes("недоступен")) {
          showError("Сервер недоступен", err.message);
        } else {
          showError("Ошибка входа", err.message);
        }
      } else {
        showError(
          "Неизвестная ошибка",
          "Произошла неизвестная ошибка при входе"
        );
      }
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    isLoading.value = true;

    try {
      await authService.logout();
      user.value = null;
      showSuccess("Выход выполнен", "Вы успешно вышли из системы");
      await router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      showWarning(
        "Предупреждение",
        "Произошла ошибка при выходе, но сессия завершена"
      );
    } finally {
      isLoading.value = false;
    }
  };

  const checkAuth = async () => {
    if (!authService.isAuthenticated()) {
      return false;
    }

    isLoading.value = true;

    try {
      const userData = await authService.getCurrentUser();
      user.value = userData;
      return true;
    } catch (err) {
      console.error("Auth check error:", err);
      user.value = null;
      authService.clearTokens();

      if (err instanceof Error && !err.message.includes("недоступен")) {
        showWarning("Сессия истекла", "Необходимо войти в систему заново");
      }

      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Геттеры для удобства с правильными полями
  const userRole = computed(() => user.value?.role?.name || "");
  const userPermissions = computed(() => user.value?.role?.permissions || {});
  const isActive = computed(() => user.value?.is_active || false);
  const isChiefAdmin = computed(() => userRole.value === "chief_admin");
  const isAdmin = computed(() => userRole.value === "admin");
  const isBranch = computed(() => userRole.value === "branch");

  // Создаем полное имя из частей
  const fullName = computed(() => {
    if (!user.value) return "";

    const parts = [
      user.value.last_name,
      user.value.first_name,
      user.value.middle_name,
    ].filter(Boolean);

    return parts.join(" ") || user.value.login;
  });

  return {
    user: computed(() => user.value),
    userRole,
    userPermissions,
    isActive,
    isChiefAdmin,
    isAdmin,
    isBranch,
    fullName,
    isAuthenticated,
    isLoading: computed(() => isLoading.value),
    login,
    logout,
    checkAuth,
  };
};
