<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import AppIcon from "@/components/AppIcon.vue";
import { useAuth } from "@/composables/useAuth";
import { useToast } from "@/composables/useToast";

const router = useRouter();
const { login, isLoading, isAuthenticated } = useAuth();
const { showError, showSuccess } = useToast();

const form = ref({
  login: "",
  password: "",
});

const showPassword = ref(false);

// Если уже авторизован, перенаправляем на главную
onMounted(() => {
  if (isAuthenticated.value) {
    router.push("/");
  }
});

const handleSubmit = async () => {
  if (!form.value.login || !form.value.password) {
    showError(
      "Заполните все поля",
      "Введите логин и пароль для входа в систему"
    );
    return;
  }

  const success = await login(form.value);

  if (success) {
    showSuccess("Вход выполнен", "Добро пожаловать в систему!");
  }
  // Ошибки уже обрабатываются в useAuth через Toast
};

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};
</script>

<template>
  <div
    class="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div
          class="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-6"
        >
          <AppIcon name="user" :size="24" class="text-white" />
        </div>
        <h2 class="text-3xl font-bold text-gray-900 mb-2">Вход в систему</h2>
        <p class="text-sm text-gray-600">
          Введите свои учетные данные для доступа
        </p>
      </div>

      <!-- Login Form -->
      <div
        class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8"
      >
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Login Field -->
          <div>
            <label
              for="login"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Логин
            </label>
            <div class="relative">
              <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              >
                <AppIcon name="user" :size="16" class="text-gray-400" />
              </div>
              <input
                id="login"
                v-model="form.login"
                type="text"
                required
                autocomplete="username"
                placeholder="Введите логин"
                class="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                :disabled="isLoading"
              />
            </div>
          </div>

          <!-- Password Field -->
          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Пароль
            </label>
            <div class="relative">
              <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              >
                <AppIcon name="lock" :size="16" class="text-gray-400" />
              </div>
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                placeholder="Введите пароль"
                class="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                :disabled="isLoading"
              />
              <button
                type="button"
                @click="togglePasswordVisibility"
                class="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
                :disabled="isLoading"
              >
                <AppIcon
                  :name="showPassword ? 'eye-off' : 'eye'"
                  :size="16"
                  class="text-gray-400 hover:text-gray-600"
                />
              </button>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isLoading || !form.login || !form.password"
            class="w-full px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <AppIcon
              v-if="isLoading"
              name="refresh-cw"
              :size="16"
              class="animate-spin"
            />
            {{ isLoading ? "Вход..." : "Войти" }}
          </button>
        </form>
      </div>

      <!-- Footer -->
      <div class="text-center">
        <p class="text-xs text-gray-500">© 2026 Все права защищены</p>
      </div>
    </div>
  </div>
</template>
