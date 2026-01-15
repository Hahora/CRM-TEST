<script setup lang="ts">
import { computed } from "vue";
import AppIcon from "@/components/AppIcon.vue";
import type { ClientsStats } from "@/types/clients";

interface Props {
  stats: ClientsStats;
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

// Безопасное отображение статистики с fallback значениями
const displayStats = computed(() => ({
  total_clients: props.stats.total_clients || 0,
  total_spent: props.stats.total_spent || 0,
  average_purchase: props.stats.average_purchase || 0,
  new_clients_this_month: props.stats.new_clients_this_month || 0,
  active_clients: props.stats.active_clients || 0,
}));
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
    <!-- Всего клиентов -->
    <div class="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
      <div class="flex items-center gap-2 mb-2">
        <div
          class="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="users" :size="16" />
        </div>
        <div class="text-xs text-gray-600">Всего клиентов</div>
      </div>
      <div v-if="loading" class="h-6 bg-gray-200 rounded animate-pulse"></div>
      <div v-else class="text-lg md:text-2xl font-bold text-gray-900">
        {{ displayStats.total_clients }}
      </div>
    </div>

    <!-- Общая сумма -->
    <div class="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
      <div class="flex items-center gap-2 mb-2">
        <div
          class="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="trending-up" :size="16" />
        </div>
        <div class="text-xs text-gray-600">Общая сумма</div>
      </div>
      <div v-if="loading" class="h-6 bg-gray-200 rounded animate-pulse"></div>
      <div v-else class="text-sm md:text-lg font-bold text-gray-900">
        {{ formatCurrency(displayStats.total_spent) }}
      </div>
    </div>

    <!-- Средняя покупка -->
    <div class="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
      <div class="flex items-center gap-2 mb-2">
        <div
          class="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="bar-chart-3" :size="16" />
        </div>
        <div class="text-xs text-gray-600">Средняя покупка</div>
      </div>
      <div v-if="loading" class="h-6 bg-gray-200 rounded animate-pulse"></div>
      <div v-else class="text-sm md:text-lg font-bold text-gray-900">
        {{ formatCurrency(displayStats.average_purchase) }}
      </div>
    </div>

    <!-- Новые клиенты (если есть данные) -->
    <div
      v-if="stats.new_clients_this_month !== undefined"
      class="bg-white rounded-lg border border-gray-200 p-3 md:p-4"
    >
      <div class="flex items-center gap-2 mb-2">
        <div
          class="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="user-plus" :size="16" />
        </div>
        <div class="text-xs text-gray-600">Новые за месяц</div>
      </div>
      <div v-if="loading" class="h-6 bg-gray-200 rounded animate-pulse"></div>
      <div v-else class="text-lg md:text-2xl font-bold text-gray-900">
        {{ displayStats.new_clients_this_month }}
      </div>
    </div>

    <!-- Активные клиенты (если есть данные) -->
    <div
      v-if="stats.active_clients !== undefined"
      class="bg-white rounded-lg border border-gray-200 p-3 md:p-4"
    >
      <div class="flex items-center gap-2 mb-2">
        <div
          class="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="activity" :size="16" />
        </div>
        <div class="text-xs text-gray-600">Активные</div>
      </div>
      <div v-if="loading" class="h-6 bg-gray-200 rounded animate-pulse"></div>
      <div v-else class="text-lg md:text-2xl font-bold text-gray-900">
        {{ displayStats.active_clients }}
      </div>
    </div>
  </div>
</template>
