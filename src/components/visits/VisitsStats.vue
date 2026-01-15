<script setup lang="ts">
import { computed } from "vue";
import AppIcon from "@/components/AppIcon.vue";
import type { VisitsStats } from "@/types/visits";
import { VISIT_STATUSES } from "@/types/visits";
import type { IconName } from "@/components/icons"; // Добавьте этот импорт

interface Props {
  stats: VisitsStats;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (value: number) => {
  return `${Math.round(value * 100)}%`;
};

// Определите интерфейс для метрик
interface Metric {
  icon: IconName; // Используйте IconName вместо string
  color: string;
  label: string;
  value: string | number;
}

// Основные метрики для главных карточек
const mainMetrics = computed<Metric[]>(() => [
  {
    icon: "map-pin", // Теперь это IconName
    color: "bg-blue-50 text-blue-600",
    label: "Всего посещений",
    value: props.stats.total_visits,
  },
  {
    icon: "trending-up", // IconName
    color: "bg-green-50 text-green-600",
    label: "Завершение сделки",
    value: formatPercent(props.stats.conversion_rate),
  },
  {
    icon: "shopping-cart", // IconName
    color: "bg-purple-50 text-purple-600",
    label: "Сумма покупок",
    value: formatCurrency(props.stats.total_purchase_amount),
  },
]);

// Статистика по статусам для детального блока
const statusStats = computed(() => {
  return VISIT_STATUSES.map((status) => ({
    ...status,
    count: props.stats.by_status[status.value] || 0,
  })).filter((status) => status.count > 0); // Показываем только статусы с данными
});
</script>

<template>
  <!-- Основные метрики -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
    <div
      v-for="metric in mainMetrics"
      :key="metric.label"
      class="bg-white rounded-lg border border-gray-200 p-3 md:p-4"
    >
      <div class="flex items-center gap-2 mb-2">
        <div
          :class="[
            'w-8 h-8 rounded-lg flex items-center justify-center',
            metric.color,
          ]"
        >
          <AppIcon :name="metric.icon" :size="16" />
        </div>
        <div class="text-xs md:text-sm text-gray-600">{{ metric.label }}</div>
      </div>
      <div v-if="loading" class="h-6 bg-gray-200 rounded animate-pulse"></div>
      <div v-else class="text-lg md:text-2xl font-bold text-gray-900">
        {{ metric.value }}
      </div>
    </div>
  </div>

  <!-- Детальная статистика по статусам -->
  <div class="mt-4 md:mt-6">
    <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div class="flex items-center gap-2 mb-4">
        <AppIcon name="bar-chart-3" :size="18" class="text-gray-600" />
        <h3 class="text-base md:text-lg font-semibold text-gray-900">
          Статистика по статусам
        </h3>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          v-for="status in statusStats"
          :key="status.value"
          class="text-center"
        >
          <div
            :class="[
              'w-3 h-3 rounded-full mx-auto mb-1',
              status.color.replace('text-', 'bg-').split(' ')[0],
            ]"
          ></div>
          <div class="text-xs text-gray-600 mb-1">{{ status.label }}</div>
          <div class="text-sm md:text-base font-semibold text-gray-900">
            {{ status.count }}
          </div>
        </div>
      </div>
      <div
        v-if="statusStats.length === 0"
        class="text-sm text-gray-500 text-center py-8"
      >
        Нет данных по статусам
      </div>
    </div>
  </div>
</template>
