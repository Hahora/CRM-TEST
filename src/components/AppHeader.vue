<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import AppIcon from "./AppIcon.vue";
import { useAuth } from "@/composables/useAuth";

const { user, logout, userRole, fullName } = useAuth();

const isProfileOpen = ref(false);
const isScrolled = ref(false);

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

const getInitials = () => {
  if (!user.value) return "?";
  if (user.value.first_name) {
    return user.value.first_name.charAt(0).toUpperCase();
  }
  return user.value.login.charAt(0).toUpperCase();
};

const onScroll = () => {
  isScrolled.value = window.scrollY > 4;
};

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
});
</script>

<template>
  <header
    class="md:hidden fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-50 transition-all duration-300"
    :class="[
      isScrolled
        ? 'bg-white/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.04)] border-b border-gray-200/60'
        : 'bg-white border-b border-gray-200/40',
    ]"
  >
    <div class="flex items-center gap-3">
      <!-- Mobile menu button -->
      <button
        @click="handleToggleSidebar"
        class="md:hidden p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100/80 rounded-xl transition-all duration-200 active:scale-95"
        aria-label="Открыть меню"
      >
        <AppIcon name="menu" :size="20" />
      </button>

      <!-- Logo & Title -->
      <div class="hidden md:flex items-center gap-2.5">
        <div class="flex flex-col">
          <h1
            class="text-[15px] font-semibold text-gray-900 leading-tight tracking-[-0.01em]"
          >
            CRM СИСТЕМА
          </h1>
          <span
            class="text-[10px] font-medium text-gray-400 uppercase tracking-widest leading-none"
          >
            HUSBAND
          </span>
        </div>
      </div>
    </div>

    <!-- Authorized user controls -->
    <div v-if="user" class="flex items-center gap-1.5 md:gap-2 relative">

      <!-- Profile -->
      <div class="relative" @click.stop>
        <button
          @click="toggleProfile"
          :aria-expanded="isProfileOpen"
          class="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 md:gap-2.5 md:pl-2 md:pr-3 rounded-xl transition-all duration-200 active:scale-[0.98]"
          :class="[
            isProfileOpen
              ? 'bg-gray-100 ring-1 ring-gray-200/60'
              : 'hover:bg-gray-100/60',
          ]"
          aria-label="Профиль пользователя"
        >
          <!-- Avatar -->
          <div
            class="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-sm shadow-blue-500/20 transition-shadow duration-200 hover:shadow-md hover:shadow-blue-500/25"
          >
            <span
              class="text-[10px] md:text-xs font-semibold text-white leading-none"
            >
              {{ getInitials() }}
            </span>
          </div>

          <!-- Profile info (mobile + desktop) -->
          <div class="flex flex-col items-start">
            <div class="flex items-center gap-1.5">
              <span
                class="text-[12px] md:text-[13px] font-medium text-gray-800 leading-tight max-w-[100px] md:max-w-[130px] truncate"
              >
                {{ fullName }}
              </span>
              <span
                class="text-[9px] md:text-[10px] font-mono text-gray-400 bg-gray-100/80 px-1 md:px-1.5 py-0.5 rounded leading-none"
              >
                ID:{{ user.id }}
              </span>
            </div>
            <span
              class="text-[10px] md:text-[11px] text-gray-400 leading-tight capitalize"
            >
              {{ userRole }}
            </span>
          </div>

          <AppIcon
            name="chevron-down"
            :size="14"
            class="text-gray-400 transition-transform duration-200"
            :class="{ 'rotate-180': isProfileOpen }"
          />
        </button>

        <!-- Profile dropdown -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-1 scale-[0.98]"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 translate-y-1 scale-[0.98]"
        >
          <div
            v-if="isProfileOpen"
            class="absolute top-full right-0 mt-2 w-[280px] bg-white/95 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] py-1.5 z-50 overflow-hidden"
            @click.stop
          >
            <!-- Profile header -->
            <div
              class="px-4 pt-3 pb-4 bg-gradient-to-br from-gray-50/80 to-blue-50/40"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-md shadow-blue-500/20"
                >
                  <span class="text-sm font-semibold text-white">
                    {{ getInitials() }}
                  </span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold text-gray-900 truncate">
                    {{ fullName }}
                  </div>
                  <div class="text-xs text-gray-500 truncate">
                    {{ user.login }}
                  </div>
                  <div class="flex items-center gap-1.5 mt-1">
                    <span
                      class="text-[10px] font-medium text-gray-500 uppercase tracking-wide capitalize"
                    >
                      {{ userRole }}
                    </span>
                    <span class="text-gray-300">·</span>
                    <span
                      :class="[
                        'inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide',
                        user.is_active ? 'text-emerald-600' : 'text-red-500',
                      ]"
                    >
                      <span
                        :class="[
                          'w-1.5 h-1.5 rounded-full',
                          user.is_active ? 'bg-emerald-500' : 'bg-red-400',
                        ]"
                      />
                      {{ user.is_active ? "Активен" : "Неактивен" }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Menu Actions -->
            <div class="py-1.5">
              <button
                @click="handleLogout"
                class="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/60 transition-colors flex items-center gap-2.5 group"
              >
                <div
                  class="w-8 h-8 rounded-lg bg-red-50 group-hover:bg-red-100/80 flex items-center justify-center transition-colors"
                >
                  <AppIcon name="log-out" :size="15" class="text-red-500" />
                </div>
                <div class="flex flex-col">
                  <span class="text-[13px] font-medium">Выйти</span>
                  <span class="text-[11px] text-red-400">Завершить сессию</span>
                </div>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Loading state -->
    <div v-else class="flex items-center">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
        <div class="hidden md:flex flex-col gap-1">
          <div class="w-20 h-3 rounded bg-gray-100 animate-pulse" />
          <div class="w-14 h-2.5 rounded bg-gray-100 animate-pulse" />
        </div>
      </div>
    </div>

    <!-- Overlay -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isProfileOpen"
        class="fixed inset-0 z-40"
        @click="closeProfile"
        aria-hidden="true"
      />
    </Transition>
  </header>
</template>
