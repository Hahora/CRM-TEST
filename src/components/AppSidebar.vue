<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";
import AppIcon from "./AppIcon.vue";
import { useAuth } from "@/composables/useAuth";

const router = useRouter();
const route = useRoute();
const { user, userRole, fullName, logout } = useAuth();

const getInitials = () => {
  if (!user.value) return "?";
  if (user.value.first_name) return user.value.first_name.charAt(0).toUpperCase();
  return user.value.login.charAt(0).toUpperCase();
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
    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4">
      <div v-for="section in menuSections" :key="section.title" class="mb-6">
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

    <!-- Settings -->
    <div class="border-t border-gray-200 p-2">
      <button
        @click="navigateTo('/settings')"
        class="w-full flex items-center justify-start gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        :class="isActiveRoute('/settings') ? 'bg-blue-50 text-blue-700' : ''"
      >
        <AppIcon
          name="settings"
          :size="20"
          :class="
            isActiveRoute('/settings') ? 'text-blue-600' : 'text-gray-500'
          "
        />
        <span>Настройки</span>
      </button>
    </div>

    <!-- Profile -->
    <div class="border-t border-gray-200 p-3 flex-shrink-0">
      <div class="flex items-center gap-2.5 px-1">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span class="text-xs font-semibold text-white">{{ getInitials() }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="text-[13px] font-semibold text-gray-800 truncate">{{ fullName }}</span>
            <span v-if="user" class="text-[9px] font-mono text-gray-400 bg-gray-100 px-1 py-0.5 rounded leading-none flex-shrink-0">ID:{{ user.id }}</span>
          </div>
          <div class="text-[11px] text-gray-400 capitalize leading-tight">{{ userRole }}</div>
        </div>
        <button
          @click="logout()"
          class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
          title="Выйти"
        >
          <AppIcon name="log-out" :size="15" />
        </button>
      </div>
    </div>
  </aside>
</template>
