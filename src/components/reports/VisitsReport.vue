<script setup lang="ts">
import AppIcon from "@/components/AppIcon.vue";

interface Props {
  data: {
    total: number;
    completed: number;
    scheduled: number;
    noShow: number;
    avgDuration: number;
  };
  detailed?: boolean;
}

defineProps<Props>();
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
    <div class="flex items-center gap-3 mb-6">
      <div
        class="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center"
      >
        <AppIcon name="map-pin" :size="20" />
      </div>
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Отчет по посещениям</h3>
        <p class="text-sm text-gray-600">Статистика визитов клиентов</p>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
      <div class="text-center">
        <div class="text-2xl font-bold text-gray-900 mb-1">
          {{ data.total }}
        </div>
        <div class="text-sm text-gray-600">Всего посещений</div>
      </div>

      <div class="text-center">
        <div class="text-2xl font-bold text-green-600 mb-1">
          {{ data.completed }}
        </div>
        <div class="text-sm text-gray-600">Завершено</div>
      </div>

      <div class="text-center">
        <div class="text-2xl font-bold text-orange-600 mb-1">
          {{ data.scheduled }}
        </div>
        <div class="text-sm text-gray-600">Запланировано</div>
      </div>

      <div class="text-center">
        <div class="text-2xl font-bold text-red-600 mb-1">
          {{ data.noShow }}
        </div>
        <div class="text-sm text-gray-600">Не пришли</div>
      </div>

      <div class="text-center">
        <div class="text-2xl font-bold text-blue-600 mb-1">
          {{ data.avgDuration }}
        </div>
        <div class="text-sm text-gray-600">Средняя длительность (мин)</div>
      </div>
    </div>

    <div v-if="detailed" class="mt-6 pt-6 border-t border-gray-200">
      <h4 class="text-md font-semibold text-gray-900 mb-4">
        Детальная аналитика
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h5 class="text-sm font-medium text-gray-700 mb-2">
            Процент завершения
          </h5>
          <div class="text-2xl font-bold text-green-600">
            {{ Math.round((data.completed / data.total) * 100) }}%
          </div>
        </div>
        <div>
          <h5 class="text-sm font-medium text-gray-700 mb-2">Процент неявки</h5>
          <div class="text-2xl font-bold text-red-600">
            {{ Math.round((data.noShow / data.total) * 100) }}%
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
