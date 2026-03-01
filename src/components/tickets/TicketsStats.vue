<script setup lang="ts">
import AppIcon from "@/components/AppIcon.vue";

interface Props {
  stats: {
    total: number;
    active: number;
    closed: number;
  };
}

defineProps<Props>();
</script>

<template>
  <div class="grid grid-cols-3 gap-2 sm:gap-3">
    <!-- Всего -->
    <div class="bg-white rounded-xl border border-gray-200 px-2.5 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-3">
      <div class="hidden sm:flex w-9 h-9 bg-blue-50 rounded-lg items-center justify-center flex-shrink-0">
        <AppIcon name="message-circle" :size="18" class="text-blue-600" />
      </div>
      <div class="min-w-0">
        <div class="text-lg sm:text-xl font-bold text-gray-900 leading-none">{{ stats.total }}</div>
        <div class="text-[11px] sm:text-xs text-gray-500 mt-0.5 truncate">Всего</div>
      </div>
    </div>

    <!-- Активные -->
    <div class="bg-white rounded-xl border border-gray-200 px-2.5 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-3">
      <div class="hidden sm:flex w-9 h-9 bg-yellow-50 rounded-lg items-center justify-center flex-shrink-0">
        <AppIcon name="clock" :size="18" class="text-yellow-600" />
      </div>
      <div class="min-w-0">
        <div class="text-lg sm:text-xl font-bold text-gray-900 leading-none">{{ stats.active }}</div>
        <div class="text-[11px] sm:text-xs text-gray-500 mt-0.5 truncate">Активные</div>
      </div>
    </div>

    <!-- Закрытые -->
    <div class="bg-white rounded-xl border border-gray-200 px-2.5 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-3">
      <div class="hidden sm:flex w-9 h-9 bg-gray-100 rounded-lg items-center justify-center flex-shrink-0">
        <AppIcon name="check-circle" :size="18" class="text-gray-500" />
      </div>
      <div class="min-w-0">
        <div class="text-lg sm:text-xl font-bold text-gray-900 leading-none">{{ stats.closed }}</div>
        <div class="text-[11px] sm:text-xs text-gray-500 mt-0.5 truncate">Закрытые</div>
      </div>
    </div>
  </div>
</template>
