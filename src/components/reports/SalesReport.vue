<script setup lang="ts">
import AppIcon from "@/components/AppIcon.vue";

interface Props {
  data: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    totalAmount: number;
    avgDeal: number;
  };
  detailed?: boolean;
}

defineProps<Props>();

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
  }).format(amount);
};
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
    <div class="flex items-center gap-3 mb-6">
      <div
        class="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center"
      >
        <AppIcon name="trending-up" :size="20" />
      </div>
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Отчет по продажам</h3>
        <p class="text-sm text-gray-600">
          Статистика продаж за выбранный период
        </p>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
      <div class="text-center">
        <div class="text-2xl font-bold text-gray-900 mb-1">
          {{ data.total }}
        </div>
        <div class="text-sm text-gray-600">Всего сделок</div>
      </div>

      <div class="text-center">
        <div class="text-2xl font-bold text-green-600 mb-1">
          {{ data.completed }}
        </div>
        <div class="text-sm text-gray-600">Завершено</div>
      </div>

      <div class="text-center">
        <div class="text-2xl font-bold text-orange-600 mb-1">
          {{ data.pending }}
        </div>
        <div class="text-sm text-gray-600">В процессе</div>
      </div>

      <div class="text-center">
        <div class="text-2xl font-bold text-red-600 mb-1">
          {{ data.cancelled }}
        </div>
        <div class="text-sm text-gray-600">Отменено</div>
      </div>

      <div class="text-center">
        <div class="text-lg md:text-xl font-bold text-gray-900 mb-1">
          {{ formatCurrency(data.totalAmount) }}
        </div>
        <div class="text-sm text-gray-600">Общая сумма</div>
      </div>

      <div class="text-center">
        <div class="text-lg md:text-xl font-bold text-gray-900 mb-1">
          {{ formatCurrency(data.avgDeal) }}
        </div>
        <div class="text-sm text-gray-600">Средняя сделка</div>
      </div>
    </div>

    <div v-if="detailed" class="mt-6 pt-6 border-t border-gray-200">
      <h4 class="text-md font-semibold text-gray-900 mb-4">
        Детальная аналитика
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h5 class="text-sm font-medium text-gray-700 mb-2">Конверсия</h5>
          <div class="text-2xl font-bold text-blue-600">
            {{ Math.round((data.completed / data.total) * 100) }}%
          </div>
        </div>
        <div>
          <h5 class="text-sm font-medium text-gray-700 mb-2">Процент отмен</h5>
          <div class="text-2xl font-bold text-red-600">
            {{ Math.round((data.cancelled / data.total) * 100) }}%
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
