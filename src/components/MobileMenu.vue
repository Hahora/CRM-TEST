<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import AppIcon from "./AppIcon.vue";
import type { IconName } from "@/components/icons"; // Добавьте этот импорт

const router = useRouter();
const route = useRoute();

interface Props {
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

// Определите интерфейс для элементов меню
interface MenuItem {
  id: string;
  title: string;
  icon: IconName; // Используйте IconName вместо string
  route: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "Основное",
    items: [
      {
        id: "dashboard",
        title: "Дашборд",
        icon: "layout-dashboard", // Теперь это IconName, а не string
        route: "/dashboard",
      },
      {
        id: "sales",
        title: "Продажи",
        icon: "trending-up", // IconName
        route: "/sales",
      },
      {
        id: "clients",
        title: "Клиенты",
        icon: "users", // IconName
        route: "/clients",
      },
      {
        id: "visits",
        title: "Посещения",
        icon: "map-pin", // IconName
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
        icon: "file-text", // IconName
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
        icon: "send", // IconName
        route: "/mailings",
      },
      {
        id: "tickets",
        title: "Тикеты",
        icon: "message-circle", // IconName
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
        icon: "package", // IconName
        route: "/products",
      },
      {
        id: "users",
        title: "Пользователи",
        icon: "user-cog", // IconName
        route: "/users",
      },
    ],
  },
];

const navigateTo = (routePath: string) => {
  router.push(routePath);
  emit("close");
};

const isActiveRoute = (routePath: string) => {
  return route.path === routePath;
};

const closeMenu = () => {
  emit("close");
};
</script>

<template>
  <!-- Full Screen Mobile Menu -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-white z-50 flex flex-col md:hidden"
  >
    <!-- Header - компактный -->
    <div
      class="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center flex-shrink-0"
    >
      <div>
        <h2 class="font-semibold text-base text-gray-900">CRM СИСТЕМА</h2>
        <p class="text-gray-500 text-xs">НАЗВАНИЕ КОМПАНИИ</p>
      </div>
      <button
        @click="closeMenu"
        class="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
      >
        <AppIcon name="chevron-right" :size="18" class="rotate-180" />
      </button>
    </div>

    <!-- Menu Items - без скролла -->
    <div class="flex-1 py-2 px-2">
      <div v-for="section in menuSections" :key="section.title" class="mb-3">
        <!-- Section Title - компактный -->
        <div
          class="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider"
        >
          {{ section.title }}
        </div>

        <!-- Items - компактные -->
        <div class="space-y-0.5">
          <button
            v-for="item in section.items"
            :key="item.id"
            @click="navigateTo(item.route!)"
            class="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
            :class="
                  isActiveRoute(item.route!) 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                "
          >
            <AppIcon
              :name="item.icon"
              :size="18"
              :class="isActiveRoute(item.route!) ? 'text-blue-600' : 'text-gray-500'"
            />
            <span>{{ item.title }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Settings - компактные -->
    <div class="border-t border-gray-200 px-2 py-2 flex-shrink-0">
      <button
        @click="navigateTo('/settings')"
        class="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        :class="isActiveRoute('/settings') ? 'bg-blue-50 text-blue-700' : ''"
      >
        <AppIcon
          name="settings"
          :size="18"
          :class="
            isActiveRoute('/settings') ? 'text-blue-600' : 'text-gray-500'
          "
        />
        <span>Настройки</span>
      </button>
    </div>

    <!-- Footer - минимальный -->
    <div class="border-t border-gray-200 px-4 py-2 bg-gray-50 flex-shrink-0">
      <div class="text-xs text-gray-500 text-center">
        <p>© 2026 CRM v1.0.0</p>
      </div>
    </div>
  </div>
</template>
