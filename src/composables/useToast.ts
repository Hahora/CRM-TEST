import { ref } from "vue";

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: { label: string; onClick: () => void };
}

const toasts = ref<Toast[]>([]);

export const useToast = () => {
  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      ...toast,
    };

    toasts.value.push(newToast);
    return id;
  };

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex((toast) => toast.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  const clearAllToasts = () => {
    toasts.value = [];
  };

  // Удобные методы для разных типов
  const showSuccess = (title: string, message?: string, duration?: number) => {
    return addToast({
      type: "success",
      title,
      message,
      duration,
    });
  };

  const showError = (title: string, message?: string, persistent = true) => {
    return addToast({
      type: "error",
      title,
      message,
      persistent,
    });
  };

  const showWarning = (title: string, message?: string, duration?: number) => {
    return addToast({
      type: "warning",
      title,
      message,
      duration,
    });
  };

  const showInfo = (title: string, message?: string, duration?: number) => {
    return addToast({
      type: "info",
      title,
      message,
      duration,
    });
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
