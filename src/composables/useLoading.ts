import { ref } from "vue";

interface LoadingState {
  isVisible: boolean;
  title: string;
  message: string;
}

const loadingState = ref<LoadingState>({
  isVisible: false,
  title: "Загрузка...",
  message: "",
});

export const useLoading = () => {
  const showLoading = (title = "Загрузка...", message = "") => {
    loadingState.value = {
      isVisible: true,
      title,
      message,
    };
  };

  const hideLoading = () => {
    loadingState.value.isVisible = false;
  };

  const updateLoading = (title?: string, message?: string) => {
    if (title !== undefined) loadingState.value.title = title;
    if (message !== undefined) loadingState.value.message = message;
  };

  return {
    loadingState,
    showLoading,
    hideLoading,
    updateLoading,
  };
};
