<script setup lang="ts">
import { ref, onMounted } from "vue";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import AppIcon from "@/components/AppIcon.vue";
import { mailingsApi } from "@/services/mailingsApi";
import type { BlockedUser } from "@/services/mailingsApi";
import { useToast } from "@/composables/useToast";

const { showSuccess, showError } = useToast();

const users    = ref<BlockedUser[]>([]);
const isLoading = ref(true);
const unblocking = ref<Set<string>>(new Set());

const load = async () => {
  isLoading.value = true;
  try {
    users.value = await mailingsApi.getBlocked();
  } catch {
    /* ignore */
  } finally {
    isLoading.value = false;
  }
};

const unblock = async (u: BlockedUser) => {
  if (unblocking.value.has(u.telegram_user_id)) return;
  unblocking.value = new Set([...unblocking.value, u.telegram_user_id]);
  try {
    await mailingsApi.unblockByTelegramUserId(u.telegram_user_id);
    users.value = users.value.filter((x) => x.telegram_user_id !== u.telegram_user_id);
    showSuccess("Разблокировано", `Пользователь ${displayName(u)} разблокирован`);
  } catch (e) {
    showError("Ошибка", e instanceof Error ? e.message : "Не удалось разблокировать");
  } finally {
    const s = new Set(unblocking.value);
    s.delete(u.telegram_user_id);
    unblocking.value = s;
  }
};

const displayName = (u: BlockedUser): string => {
  const parts = [u.first_name, u.last_name].filter(Boolean);
  if (parts.length) return parts.join(" ");
  if (u.username) return `@${u.username}`;
  return `ID ${u.telegram_user_id}`;
};

onMounted(load);
</script>

<template>
  <div class="h-full overflow-hidden flex flex-col bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex-shrink-0">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
            <AppIcon name="ban" :size="16" class="text-orange-600" />
          </div>
          <div>
            <h1 class="text-lg font-semibold text-gray-900">Заблокированные</h1>
            <p class="text-xs text-gray-400">Пользователи, которые не могут писать боту</p>
          </div>
        </div>
        <button
          @click="load"
          :disabled="isLoading"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <AppIcon name="refresh-cw" :size="14" :class="{ 'animate-spin': isLoading }" />
          <span class="hidden sm:inline">Обновить</span>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4 md:p-6">
      <!-- Loading -->
      <div v-if="isLoading" class="bu-card">
        <div v-for="i in 4" :key="i" class="bu-skeleton-row">
          <div class="bu-skeleton bu-skeleton-avatar" />
          <div class="flex-1 space-y-2">
            <div class="bu-skeleton" style="width: 140px; height: 14px; border-radius: 6px;" />
            <div class="bu-skeleton" style="width: 90px; height: 12px; border-radius: 6px;" />
          </div>
          <div class="bu-skeleton" style="width: 100px; height: 32px; border-radius: 8px;" />
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="users.length === 0" class="bu-card py-16 flex flex-col items-center gap-3">
        <div class="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
          <AppIcon name="user-check" :size="24" class="text-green-500" />
        </div>
        <p class="text-sm font-medium text-gray-600">Нет заблокированных пользователей</p>
        <p class="text-xs text-gray-400">Все пользователи могут писать боту</p>
      </div>

      <!-- List -->
      <div v-else class="bu-card">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-900">Список заблокированных</h2>
          <span class="text-xs text-gray-400 font-medium">{{ users.length }} пользователей</span>
        </div>
        <ul class="divide-y divide-gray-50">
          <li
            v-for="u in users"
            :key="u.telegram_user_id"
            class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <!-- Avatar -->
            <div class="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <span class="text-sm font-semibold text-orange-600">
                {{ (u.first_name || u.username || '?')[0].toUpperCase() }}
              </span>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-medium text-gray-900">{{ displayName(u) }}</span>
                <span
                  v-if="u.username"
                  class="text-xs text-blue-500 hover:underline cursor-default"
                >@{{ u.username }}</span>
              </div>
              <div class="flex items-center gap-3 mt-0.5">
                <span class="text-xs text-gray-400 font-mono">ID: {{ u.telegram_user_id }}</span>
                <span v-if="u.last_active_at" class="text-xs text-gray-400">
                  Последняя активность: {{ format(new Date(u.last_active_at), "dd.MM.yyyy HH:mm", { locale: ru }) }}
                </span>
              </div>
            </div>

            <!-- Unblock button -->
            <button
              @click="unblock(u)"
              :disabled="unblocking.has(u.telegram_user_id)"
              class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <AppIcon
                :name="unblocking.has(u.telegram_user_id) ? 'refresh-cw' : 'user-check'"
                :size="13"
                :class="{ 'animate-spin': unblocking.has(u.telegram_user_id) }"
              />
              {{ unblocking.has(u.telegram_user_id) ? "..." : "Разблокировать" }}
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bu-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.bu-skeleton-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f9fafb;
}

.bu-skeleton {
  background: linear-gradient(90deg, #f3f4f6 25%, #e9ecef 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: bu-shimmer 1.5s infinite;
}

.bu-skeleton-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}

@keyframes bu-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
