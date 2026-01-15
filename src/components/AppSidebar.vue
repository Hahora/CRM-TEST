<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import AppIcon from "./AppIcon.vue";

const router = useRouter();
const route = useRoute();
const isCollapsed = ref(false);

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
        id: "products",
        title: "Товары",
        icon: "package",
        route: "/products",
      },
      {
        id: "users",
        title: "Пользователи",
        icon: "user-cog",
        route: "/users",
      },
    ],
  },
];

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};

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
    class="hidden md:flex fixed top-16 left-0 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 z-40 flex-col"
    :class="isCollapsed ? 'w-16' : 'w-64'"
  >
    <!-- Toggle Button -->
    <div class="p-3 border-b border-gray-200">
      <button
        @click="toggleSidebar"
        class="w-full flex justify-center p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <AppIcon name="menu" :size="18" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4">
      <div v-for="section in menuSections" :key="section.title" class="mb-6">
        <!-- Section Title -->
        <div
          v-if="!isCollapsed"
          class="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider"
        >
          {{ section.title }}
        </div>

        <!-- Menu Items -->
        <ul class="space-y-1 px-2">
          <li v-for="item in section.items" :key="item.id">
            <button
              @click="navigateTo(item.route!)"
              :title="isCollapsed ? item.title : ''"
              class="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
              :class="[
                  isActiveRoute(item.route!)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100',
                  isCollapsed ? 'justify-center' : 'justify-start',
                ]"
            >
              <AppIcon
                :name="item.icon as any"
                :size="20"
                :class="
                    isActiveRoute(item.route!) ? 'text-blue-600' : 'text-gray-500'
                  "
              />
              <span v-if="!isCollapsed" class="truncate">{{ item.title }}</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Settings -->
    <div class="border-t border-gray-200 p-2">
      <button
        @click="navigateTo('/settings')"
        :title="isCollapsed ? 'Настройки' : ''"
        class="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        :class="[
          isActiveRoute('/settings') ? 'bg-blue-50 text-blue-700' : '',
          isCollapsed ? 'justify-center' : 'justify-start',
        ]"
      >
        <AppIcon
          name="settings"
          :size="20"
          :class="
            isActiveRoute('/settings') ? 'text-blue-600' : 'text-gray-500'
          "
        />
        <span v-if="!isCollapsed">Настройки</span>
      </button>
    </div>
  </aside>
</template>
