<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import AppIcon from "./AppIcon.vue";
import { useAuth } from "@/composables/useAuth";
import { useTicketsBadge } from "@/composables/useTicketsBadge";

const router = useRouter();
const route = useRoute();
const { user, userRole, roleLabel, fullName, logout } = useAuth();
const { newCount: ticketsNewCount } = useTicketsBadge();

const emit = defineEmits<{ (e: "toggle-collapse", collapsed: boolean): void }>();

const isProfileOpen = ref(false);
const isCollapsed = ref(localStorage.getItem("sidebar-collapsed") === "true");

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  localStorage.setItem("sidebar-collapsed", String(isCollapsed.value));
  emit("toggle-collapse", isCollapsed.value);
};

onMounted(() => {
  emit("toggle-collapse", isCollapsed.value);
});

const getInitials = () => {
  if (!user.value) return "?";
  if (user.value.first_name) return user.value.first_name.charAt(0).toUpperCase();
  return user.value.login.charAt(0).toUpperCase();
};

const handleLogout = async () => {
  isProfileOpen.value = false;
  await logout();
};

interface MenuSection {
  title: string;
  roles?: string[];
  items: { id: string; title: string; icon: string; route: string }[];
}

const allSections: MenuSection[] = [
  {
    title: "Основное",
    items: [
      { id: "dashboard", title: "Дашборд",   icon: "layout-dashboard", route: "/dashboard" },
      { id: "sales",     title: "Продажи",   icon: "trending-up",      route: "/sales"     },
      { id: "clients",   title: "Клиенты",   icon: "users",            route: "/clients"   },
      { id: "visits",    title: "Посещения", icon: "map-pin",          route: "/visits"    },
    ],
  },
  {
    title: "Аналитика",
    roles: ["chief_admin", "admin"],
    items: [
      { id: "reports", title: "Отчеты", icon: "file-text", route: "/reports" },
    ],
  },
  {
    title: "Коммуникация",
    items: [
      { id: "mailings", title: "Рассылки",        icon: "send",           route: "/mailings" },
      { id: "tickets",  title: "Тикеты",          icon: "message-circle", route: "/tickets"  },
      { id: "blocked",  title: "Заблокированные", icon: "ban",            route: "/blocked"  },
    ],
  },
  {
    title: "Администрирование",
    roles: ["chief_admin", "admin"],
    items: [
      { id: "users", title: "Пользователи", icon: "user-cog", route: "/users" },
    ],
  },
];

const menuSections = computed(() =>
  allSections.filter((s) => !s.roles || s.roles.includes(userRole.value))
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asIcon = (s: string): any => s;

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
    class="hidden md:flex fixed top-0 left-0 bottom-0 bg-white border-r border-gray-200 z-40 flex-col transition-all duration-200"
    :class="isCollapsed ? 'w-16' : 'w-64'"
  >
    <!-- Brand + Toggle -->
    <div
      class="border-b border-gray-200 flex-shrink-0 flex items-center min-h-[57px]"
      :class="isCollapsed ? 'justify-center px-2' : 'justify-between px-4'"
    >
      <div v-if="!isCollapsed" class="py-4">
        <h1 class="text-[15px] font-semibold text-gray-900 leading-tight tracking-[-0.01em]">СРМ СИСТЕМА</h1>
        <span class="text-[10px] font-medium text-gray-400 uppercase tracking-widest leading-none">HUSBAND</span>
      </div>
      <button
        @click="toggleCollapse"
        class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
        :title="isCollapsed ? 'Развернуть меню' : 'Свернуть меню'"
      >
        <AppIcon :name="isCollapsed ? 'chevron-right' : 'chevron-left'" :size="16" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto overflow-x-hidden py-4 min-w-0">
      <div v-for="section in menuSections" :key="section.title" class="mb-4">
        <!-- Section Title -->
        <div
          v-if="!isCollapsed"
          class="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider"
        >
          {{ section.title }}
        </div>
        <div v-else class="px-3 mb-2">
          <div class="border-t border-gray-100" />
        </div>

        <!-- Menu Items -->
        <ul class="space-y-1 px-2">
          <li v-for="item in section.items" :key="item.id" class="relative">
            <!-- Dot-бейдж при свёрнутом сайдбаре -->
            <span
              v-if="isCollapsed && item.id === 'tickets' && ticketsNewCount > 0"
              class="absolute top-0.5 right-0.5 z-10 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none pointer-events-none"
            >{{ ticketsNewCount > 99 ? '99+' : ticketsNewCount }}</span>

            <button
              @click="navigateTo(item.route)"
              class="w-full flex items-center py-2 text-sm font-medium rounded-lg transition-colors"
              :class="[
                isCollapsed ? 'justify-center px-2' : 'justify-start gap-3 px-3',
                isActiveRoute(item.route)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100',
              ]"
              :title="isCollapsed ? item.title : undefined"
            >
              <AppIcon
                :name="asIcon(item.icon)"
                :size="20"
                :class="isActiveRoute(item.route) ? 'text-blue-600' : 'text-gray-500'"
              />
              <span v-if="!isCollapsed" class="truncate">{{ item.title }}</span>
              <!-- Бейдж-счётчик при развёрнутом сайдбаре -->
              <span
                v-if="!isCollapsed && item.id === 'tickets' && ticketsNewCount > 0"
                class="ml-auto min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none flex-shrink-0"
              >{{ ticketsNewCount > 99 ? '99+' : ticketsNewCount }}</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Profile -->
    <div class="border-t border-gray-200 p-2 flex-shrink-0 relative">
      <!-- Dropdown -->
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
          class="absolute bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50"
          :class="isCollapsed
            ? 'bottom-0 left-full ml-2 w-56'
            : 'bottom-full left-2 right-2 mb-1'"
        >
          <!-- User info -->
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
                  <span class="text-[10px] text-gray-400">{{ roleLabel }}</span>
                  <span v-if="user" class="flex items-center gap-1 text-[10px]" :class="user.is_active ? 'text-emerald-600' : 'text-red-500'">
                    <span class="w-1.5 h-1.5 rounded-full" :class="user.is_active ? 'bg-emerald-500' : 'bg-red-400'" />
                    {{ user.is_active ? "Активен" : "Неактивен" }}
                  </span>
                </div>
              </div>
            </div>
          </div>
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
        class="w-full flex items-center gap-2.5 rounded-lg transition-colors"
        :class="[
          isCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2 text-left',
          isProfileOpen ? 'bg-blue-50' : 'hover:bg-gray-100',
        ]"
      >
        <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span class="text-xs font-semibold text-white">{{ getInitials() }}</span>
        </div>
        <template v-if="!isCollapsed">
          <div class="flex-1 min-w-0">
            <div class="text-[13px] font-semibold text-gray-800 truncate">{{ fullName }}</div>
            <div class="text-[11px] text-gray-400 leading-tight">{{ roleLabel }}</div>
          </div>
          <AppIcon
            name="chevron-down"
            :size="14"
            class="text-gray-400 transition-transform flex-shrink-0"
            :class="isProfileOpen ? 'rotate-180' : ''"
          />
        </template>
      </button>
    </div>

    <!-- Overlay to close profile dropdown -->
    <div
      v-if="isProfileOpen"
      class="fixed inset-0 z-40"
      @click="isProfileOpen = false"
    />
  </aside>
</template>
