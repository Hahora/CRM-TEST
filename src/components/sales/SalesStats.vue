<script setup lang="ts">
import AppIcon from "@/components/AppIcon.vue";

interface Props {
  stats: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    totalAmount: number;
    conversionRate: number;
  };
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
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
    <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div class="flex items-center justify-between mb-3">
        <div
          class="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="trending-up" :size="20" />
        </div>
      </div>
      <div class="text-2xl font-bold text-gray-900 mb-1">{{ stats.total }}</div>
      <div class="text-sm text-gray-600">Всего продаж</div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div class="flex items-center justify-between mb-3">
        <div
          class="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="trending-up" :size="20" />
        </div>
      </div>
      <div class="text-2xl font-bold text-gray-900 mb-1">
        {{ stats.completed }}
      </div>
      <div class="text-sm text-gray-600">Завершено</div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div class="flex items-center justify-between mb-3">
        <div
          class="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="trending-up" :size="20" />
        </div>
      </div>
      <div class="text-2xl font-bold text-gray-900 mb-1">
        {{ stats.pending }}
      </div>
      <div class="text-sm text-gray-600">В процессе</div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div class="flex items-center justify-between mb-3">
        <div
          class="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="trending-up" :size="20" />
        </div>
      </div>
      <div class="text-2xl font-bold text-gray-900 mb-1">
        {{ stats.cancelled }}
      </div>
      <div class="text-sm text-gray-600">Отменено</div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div class="flex items-center justify-between mb-3">
        <div
          class="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="package" :size="20" />
        </div>
      </div>
      <div class="text-lg md:text-xl font-bold text-gray-900 mb-1">
        {{ formatCurrency(stats.totalAmount) }}
      </div>
      <div class="text-sm text-gray-600">Общая сумма</div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div class="flex items-center justify-between mb-3">
        <div
          class="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="bar-chart-3" :size="20" />
        </div>
      </div>
      <div class="text-2xl font-bold text-gray-900 mb-1">
        {{ stats.conversionRate }}%
      </div>
      <div class="text-sm text-gray-600">Конверсия</div>
    </div>
  </div>
</template>
