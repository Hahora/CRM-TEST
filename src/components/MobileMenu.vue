<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import AppIcon from "./AppIcon.vue";
import type { IconName } from "@/components/icons";
import { useAuth } from "@/composables/useAuth";
import { useTicketsBadge } from "@/composables/useTicketsBadge";

const router = useRouter();
const route = useRoute();
const { userRole } = useAuth();
const { newCount: ticketsNewCount } = useTicketsBadge();

interface Props {
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

interface MenuSection {
  title: string;
  roles?: string[];
  items: { id: string; title: string; icon: IconName; route: string }[];
}

const allSections: MenuSection[] = [
  {
    title: "Основное",
    items: [
      { id: "dashboard", title: "Дашборд", icon: "layout-dashboard", route: "/dashboard" },
      { id: "sales", title: "Продажи", icon: "trending-up", route: "/sales" },
      { id: "clients", title: "Клиенты", icon: "users", route: "/clients" },
      { id: "visits", title: "Посещения", icon: "map-pin", route: "/visits" },
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

const isVisible = ref(false);
const isAnimating = ref(false);

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      isVisible.value = true;
      requestAnimationFrame(() => {
        isAnimating.value = true;
      });
    } else {
      isAnimating.value = false;
      setTimeout(() => {
        isVisible.value = false;
      }, 350);
    }
  }
);

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

// Подсчёт общего индекса элемента для stagger-анимации
const getItemIndex = (sectionIdx: number, itemIdx: number): number => {
  let index = 0;
  for (let i = 0; i < sectionIdx; i++) {
    index += (menuSections.value[i]?.items.length ?? 0) + 1;
  }
  return index + itemIdx + 1;
};

const getSectionIndex = (sectionIdx: number): number => {
  let index = 0;
  for (let i = 0; i < sectionIdx; i++) {
    index += (menuSections.value[i]?.items.length ?? 0) + 1;
  }
  return index;
};
</script>

<template>
  <Teleport to="body">
    <div v-if="isVisible" class="fixed inset-0 z-50 md:hidden">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-350"
        :class="isAnimating ? 'opacity-100' : 'opacity-0'"
        @click="closeMenu"
      />

      <!-- Menu Panel -->
      <div
        class="absolute inset-y-0 left-0 w-[85%] max-w-[320px] bg-white shadow-2xl flex flex-col transition-transform duration-350 ease-[cubic-bezier(0.32,0.72,0,1)]"
        :class="isAnimating ? 'translate-x-0' : '-translate-x-full'"
      >
        <!-- Header -->
        <div
          class="border-b border-gray-200 px-4 py-3 flex justify-between items-center flex-shrink-0"
        >
          <div
            class="transition-all duration-500 delay-150"
            :class="
              isAnimating
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-4'
            "
          >
            <h2 class="font-semibold text-base text-gray-900">СРМ СИСТЕМА</h2>
            <p class="text-gray-500 text-xs">HUSBAND</p>
          </div>
          <button
            @click="closeMenu"
            class="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
          >
            <AppIcon name="chevron-right" :size="18" class="rotate-180" />
          </button>
        </div>

        <!-- Menu Items -->
        <div class="flex-1 overflow-y-auto py-2 px-2">
          <div
            v-for="(section, sIdx) in menuSections"
            :key="section.title"
            class="mb-3"
          >
            <!-- Section Title -->
            <div
              class="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider transition-all duration-400 ease-out"
              :style="{
                transitionDelay: isAnimating
                  ? `${150 + getSectionIndex(sIdx) * 40}ms`
                  : '0ms',
              }"
              :class="
                isAnimating
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 -translate-x-6'
              "
            >
              {{ section.title }}
            </div>

            <!-- Items -->
            <div class="space-y-0.5">
              <button
                v-for="(item, iIdx) in section.items"
                :key="item.id"
                @click="navigateTo(item.route!)"
                class="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-400 ease-out active:scale-[0.98]"
                :style="{
                  transitionDelay: isAnimating
                    ? `${150 + getItemIndex(sIdx, iIdx) * 40}ms`
                    : '0ms',
                }"
                :class="[
                  isAnimating ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6',
                  isActiveRoute(item.route!)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100',
                ]"
              >
                <AppIcon
                  :name="item.icon"
                  :size="18"
                  :class="isActiveRoute(item.route!) ? 'text-blue-600' : 'text-gray-500'"
                />
                <span class="flex-1">{{ item.title }}</span>
                <span
                  v-if="item.id === 'tickets' && ticketsNewCount > 0"
                  class="ml-auto min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none flex-shrink-0"
                >{{ ticketsNewCount > 99 ? '99+' : ticketsNewCount }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="border-t border-gray-200 px-4 py-2 bg-gray-50 flex-shrink-0"
        >
          <div class="text-xs text-gray-500 text-center">
            <p>© 2026 СРМ HUSBAND</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
