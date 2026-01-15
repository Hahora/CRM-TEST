<script setup lang="ts">
import AppIcon from "@/components/AppIcon.vue";

interface Props {
  data: {
    total: number;
    new: number;
    active: number;
    inactive: number;
    vip: number;
  };
  detailed?: boolean;
}

defineProps<Props>();
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
    <div class="flex items-center gap-3 mb-4 md:mb-6">
      <div
        class="w-8 h-8 md:w-10 md:h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"
      >
        <AppIcon name="users" :size="18" />
      </div>
      <div>
        <h3 class="text-base md:text-lg font-semibold text-gray-900">
          Отчет по клиентам
        </h3>
        <p class="text-xs md:text-sm text-gray-600">
          Статистика клиентской базы
        </p>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
      <div class="text-center bg-gray-50 rounded-lg p-3">
        <div class="text-lg md:text-xl font-bold text-gray-900 mb-1">
          {{ data.total }}
        </div>
        <div class="text-xs text-gray-600">Всего клиентов</div>
      </div>

      <div class="text-center bg-green-50 rounded-lg p-3">
        <div class="text-lg md:text-xl font-bold text-green-600 mb-1">
          {{ data.new }}
        </div>
        <div class="text-xs text-gray-600">Новые</div>
      </div>

      <div class="text-center bg-blue-50 rounded-lg p-3">
        <div class="text-lg md:text-xl font-bold text-blue-600 mb-1">
          {{ data.active }}
        </div>
        <div class="text-xs text-gray-600">Активные</div>
      </div>

      <div class="text-center bg-gray-100 rounded-lg p-3">
        <div class="text-lg md:text-xl font-bold text-gray-600 mb-1">
          {{ data.inactive }}
        </div>
        <div class="text-xs text-gray-600">Неактивные</div>
      </div>

      <div
        class="text-center bg-purple-50 rounded-lg p-3 col-span-2 md:col-span-1"
      >
        <div class="text-lg md:text-xl font-bold text-purple-600 mb-1">
          {{ data.vip }}
        </div>
        <div class="text-xs text-gray-600">VIP</div>
      </div>
    </div>

    <div
      v-if="detailed"
      class="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200"
    >
      <h4 class="text-sm md:text-base font-semibold text-gray-900 mb-3 md:mb-4">
        Детальная аналитика
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div class="bg-green-50 rounded-lg p-3 md:p-4">
          <h5 class="text-xs md:text-sm font-medium text-gray-700 mb-2">
            Процент активных
          </h5>
          <div class="text-lg md:text-xl font-bold text-green-600">
            {{ Math.round((data.active / data.total) * 100) }}%
          </div>
        </div>
        <div class="bg-purple-50 rounded-lg p-3 md:p-4">
          <h5 class="text-xs md:text-sm font-medium text-gray-700 mb-2">
            Процент VIP
          </h5>
          <div class="text-lg md:text-xl font-bold text-purple-600">
            {{ Math.round((data.vip / data.total) * 100) }}%
          </div>
        </div>
        <div class="bg-blue-50 rounded-lg p-3 md:p-4">
          <h5 class="text-xs md:text-sm font-medium text-gray-700 mb-2">
            Рост клиентской базы
          </h5>
          <div class="text-lg md:text-xl font-bold text-blue-600">
            +{{ data.new }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
