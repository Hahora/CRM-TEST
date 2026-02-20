<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import AppIcon from "./AppIcon.vue";
import { useAuth } from "@/composables/useAuth";

const router = useRouter();
const route = useRoute();
const { user, userRole, fullName, logout } = useAuth();

const isChiefAdmin = computed(() => userRole.value === "chief_admin");

const isProfileOpen = ref(false);

const getInitials = () => {
  if (!user.value) return "?";
  if (user.value.first_name) return user.value.first_name.charAt(0).toUpperCase();
  return user.value.login.charAt(0).toUpperCase();
};

const handleLogout = async () => {
  isProfileOpen.value = false;
  await logout();
};

const handleSettings = () => {
  isProfileOpen.value = false;
  router.push('/settings');
};

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  route?: string;
}

const menuSections = [
  {
    title: "Основное",
    items: [
      {
        id: "dashboard",
        title: "Дашборд",
        icon: "layout-dashboard",
        route: "/dashboard",
      },
      {
        id: "sales",
        title: "Продажи",
        icon: "trending-up",
        route: "/sales",
      },
      {
        id: "clients",
        title: "Клиенты",
        icon: "users",
        route: "/clients",
      },
      {
        id: "visits",
        title: "Посещения",
        icon: "map-pin",
        route: "/visits",
      },
    ],
  },
  {
    title: "Аналитика",
    items: [
      {
        id: "reports",
        title: "Отчеты",
        icon: "file-text",
        route: "/reports",
      },
    ],
  },
  {
    title: "Коммуникация",
    items: [
      {
        id: "mailings",
        title: "Рассылки",
        icon: "send",
        route: "/mailings",
      },
      {
        id: "tickets",
        title: "Тикеты",
        icon: "message-circle",
        route: "/tickets",
      },
    ],
  },
  {
    title: "Администрирование",
    items: [
      {
        id: "users",
        title: "Пользователи",
        icon: "user-cog",
        route: "/users",
      },
    ],
  },
];

const navigateTo = (routePath: string) => {
  router.push(routePath);
};

const isActiveRoute = (routePath: string) => {
  return route.path === routePath;
};
</script>

<template>
  <!-- Desktop Sidebar Only -->
  <aside
    class="hidden md:flex fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40 flex-col"
  >
    <!-- CRM Brand -->
    <div class="px-4 py-4 border-b border-gray-200 flex-shrink-0">
      <h1 class="text-[15px] font-semibold text-gray-900 leading-tight tracking-[-0.01em]">CRM СИСТЕМА</h1>
      <span class="text-[10px] font-medium text-gray-400 uppercase tracking-widest leading-none">HUSBAND</span>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4">
      <div
        v-for="section in menuSections"
        :key="section.title"
        v-show="section.title !== 'Администрирование' || isChiefAdmin"
        class="mb-6"
      >
        <!-- Section Title -->
        <div
          class="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider"
        >
          {{ section.title }}
        </div>

        <!-- Menu Items -->
        <ul class="space-y-1 px-2">
          <li v-for="item in section.items" :key="item.id">
            <button
              @click="navigateTo(item.route!)"
              class="w-full flex items-center justify-start gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
              :class="
                isActiveRoute(item.route!)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              "
            >
              <AppIcon
                :name="item.icon as any"
                :size="20"
                :class="
                  isActiveRoute(item.route!) ? 'text-blue-600' : 'text-gray-500'
                "
              />
              <span class="truncate">{{ item.title }}</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Profile -->
    <div class="border-t border-gray-200 p-2 flex-shrink-0 relative">
      <!-- Dropdown (opens upward) -->
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div
          v-if="isProfileOpen"
          class="absolute bottom-full left-2 right-2 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50"
        >
          <!-- User info header -->
          <div class="px-4 py-3 bg-gradient-to-br from-gray-50 to-blue-50/40 border-b border-gray-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-md flex-shrink-0">
                <span class="text-sm font-semibold text-white">{{ getInitials() }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-gray-900 truncate">{{ fullName }}</div>
                <div v-if="user" class="text-xs text-gray-500 truncate">{{ user.login }}</div>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-[10px] font-mono text-gray-400 bg-gray-100 px-1 py-0.5 rounded">ID:{{ user?.id }}</span>
                  <span class="text-[10px] text-gray-400 capitalize">{{ userRole }}</span>
                  <span v-if="user" class="flex items-center gap-1 text-[10px]" :class="user.is_active ? 'text-emerald-600' : 'text-red-500'">
                    <span class="w-1.5 h-1.5 rounded-full" :class="user.is_active ? 'bg-emerald-500' : 'bg-red-400'" />
                    {{ user.is_active ? 'Активен' : 'Неактивен' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <!-- Settings -->
          <button
            @click="handleSettings"
            class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <AppIcon name="settings" :size="15" class="text-gray-500" />
            <span class="font-medium">Настройки</span>
          </button>
          <!-- Logout -->
          <button
            @click="handleLogout"
            class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <AppIcon name="log-out" :size="15" class="text-red-500" />
            <span class="font-medium">Выйти</span>
          </button>
        </div>
      </Transition>

      <!-- Trigger button -->
      <button
        @click="isProfileOpen = !isProfileOpen"
        class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left"
        :class="isProfileOpen ? 'bg-blue-50' : 'hover:bg-gray-100'"
      >
        <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span class="text-xs font-semibold text-white">{{ getInitials() }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-[13px] font-semibold text-gray-800 truncate">{{ fullName }}</div>
          <div class="text-[11px] text-gray-400 capitalize leading-tight">{{ userRole }}</div>
        </div>
        <AppIcon
          name="chevron-down"
          :size="14"
          class="text-gray-400 transition-transform flex-shrink-0"
          :class="isProfileOpen ? 'rotate-180' : ''"
        />
      </button>
    </div>

    <!-- Overlay to close dropdown -->
    <div
      v-if="isProfileOpen"
      class="fixed inset-0 z-40"
      @click="isProfileOpen = false"
    />
  </aside>
</template>
