<script setup lang="ts">
import { ref } from "vue";
import AppIcon from "./AppIcon.vue";
import { useAuth } from "@/composables/useAuth";

const { user, logout, userRole, fullName } = useAuth();

const isProfileOpen = ref(false);
const notificationCount = ref(3);

const emit = defineEmits<{
  toggleSidebar: [];
}>();

const toggleProfile = () => {
  isProfileOpen.value = !isProfileOpen.value;
};

const closeProfile = () => {
  isProfileOpen.value = false;
};

const handleToggleSidebar = () => {
  emit("toggleSidebar");
};

const handleLogout = async () => {
  await logout();
  closeProfile();
};

const handleProfileSettings = () => {
  console.log("Переход к настройкам профиля");
  closeProfile();
};

// Получаем первую букву для аватара
const getInitials = () => {
  if (!user.value) return "?";

  if (user.value.first_name) {
    return user.value.first_name.charAt(0).toUpperCase();
  }

  return user.value.login.charAt(0).toUpperCase();
};
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 h-14 md:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 z-50 shadow-sm"
  >
    <div class="flex items-center gap-3">
      <!-- Mobile menu button -->
      <button
        @click="handleToggleSidebar"
        class="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Открыть меню"
      >
        <AppIcon name="menu" :size="20" />
      </button>

      <!-- Desktop title only -->
      <h1 class="hidden md:block text-xl font-semibold text-gray-900">
        CRM НАЗВАНИЕ КОМПАНИИ
      </h1>
    </div>

    <!-- Показываем только если пользователь авторизован -->
    <div v-if="user" class="flex items-center gap-2 md:gap-4 relative">
      <!-- Уведомления -->
      <button
        class="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Уведомления"
      >
        <AppIcon name="bell" :size="18" class="md:w-5 md:h-5" />
        <span
          v-if="notificationCount > 0"
          class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[16px] text-center leading-none"
        >
          {{ notificationCount }}
        </span>
      </button>

      <!-- Профиль -->
      <div class="relative" @click.stop>
        <button
          @click="toggleProfile"
          :aria-expanded="isProfileOpen"
          class="flex items-center gap-2 md:gap-3 p-1.5 md:p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Профиль пользователя"
        >
          <!-- Desktop profile info -->
          <div class="hidden md:block text-right">
            <div class="text-sm font-medium">
              {{ fullName }}
            </div>
            <div class="text-xs text-gray-500 truncate max-w-[120px]">
              {{ user.login }}
            </div>
            <div class="text-xs text-gray-400 capitalize">{{ userRole }}</div>
          </div>

          <!-- Mobile profile avatar -->
          <div
            class="w-7 h-7 md:hidden bg-blue-100 rounded-full flex items-center justify-center"
          >
            <span class="text-xs font-medium text-blue-700">
              {{ getInitials() }}
            </span>
          </div>

          <AppIcon
            name="chevron-down"
            :size="14"
            :class="{
              'transition-transform md:w-4 md:h-4': true,
              'rotate-180': isProfileOpen,
            }"
          />
        </button>

        <!-- Выпадающее меню профиля -->
        <div
          v-if="isProfileOpen"
          class="absolute top-full right-0 mt-2 w-56 md:w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
          @click.stop
        >
          <!-- Mobile profile info -->
          <div class="md:hidden px-4 py-3 border-b border-gray-100">
            <div class="text-sm font-medium text-gray-900">
              {{ fullName }}
            </div>
            <div class="text-xs text-gray-500">{{ user.login }}</div>
            <div class="text-xs text-gray-400 capitalize">{{ userRole }}</div>
          </div>

          <!-- User Info Section -->
          <div class="px-4 py-2 border-b border-gray-100">
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm text-gray-500">ID:</span>
              <span class="text-xs md:text-sm font-mono text-gray-700">
                {{ user.id }}
              </span>
            </div>
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm text-gray-500">Логин:</span>
              <span class="text-xs md:text-sm font-mono text-gray-700">
                {{ user.login }}
              </span>
            </div>
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm text-gray-500">Роль:</span>
              <span class="text-xs md:text-sm text-gray-700 capitalize">
                {{ userRole }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-500">Статус:</span>
              <span
                :class="[
                  'text-xs px-2 py-1 rounded-full',
                  user.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800',
                ]"
              >
                {{ user.is_active ? "Активен" : "Неактивен" }}
              </span>
            </div>
          </div>

          <!-- Menu Actions -->
          <button
            @click="handleProfileSettings"
            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <AppIcon name="settings" :size="16" class="text-gray-500" />
            Настройки профиля
          </button>

          <button
            @click="handleLogout"
            class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <AppIcon name="log-out" :size="16" class="text-red-500" />
            Выйти
          </button>
        </div>
      </div>
    </div>

    <!-- Если пользователь не авторизован -->
    <div v-else class="flex items-center">
      <div class="text-sm text-gray-500">Загрузка...</div>
    </div>

    <!-- Overlay -->
    <div
      v-if="isProfileOpen"
      class="fixed inset-0 z-40"
      @click="closeProfile"
      aria-hidden="true"
    ></div>
  </header>
</template>
