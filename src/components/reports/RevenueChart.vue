<script setup lang="ts">
import { ref, onMounted } from "vue";
import AppIcon from "@/components/AppIcon.vue";

const chartData = ref([
  { month: "Янв", revenue: 1200000, target: 1500000 },
  { month: "Фев", revenue: 1350000, target: 1500000 },
  { month: "Мар", revenue: 1800000, target: 1500000 },
  { month: "Апр", revenue: 1650000, target: 1700000 },
  { month: "Май", revenue: 2100000, target: 1800000 },
  { month: "Июн", revenue: 1950000, target: 1800000 },
  { month: "Июл", revenue: 2250000, target: 2000000 },
  { month: "Авг", revenue: 2400000, target: 2000000 },
  { month: "Сен", revenue: 2150000, target: 2200000 },
  { month: "Окт", revenue: 2600000, target: 2200000 },
  { month: "Ноя", revenue: 2450000, target: 2500000 },
  { month: "Дек", revenue: 2800000, target: 2500000 },
]);

const totalRevenue = ref(0);
const avgMonthlyRevenue = ref(0);
const growthRate = ref(0);

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
  }).format(amount);
};

const getMaxValue = () => {
  const maxRevenue = Math.max(...chartData.value.map((d) => d.revenue));
  const maxTarget = Math.max(...chartData.value.map((d) => d.target));
  return Math.max(maxRevenue, maxTarget);
};

const getBarHeight = (value: number) => {
  const maxValue = getMaxValue();
  return (value / maxValue) * 100;
};

onMounted(() => {
  totalRevenue.value = chartData.value.reduce(
    (sum, item) => sum + item.revenue,
    0
  );
  avgMonthlyRevenue.value = totalRevenue.value / chartData.value.length;

  const firstMonth = chartData.value[0]?.revenue || 0;
  const lastMonth = chartData.value[chartData.value.length - 1]?.revenue || 0;
  growthRate.value = ((lastMonth - firstMonth) / firstMonth) * 100;
});
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
    <div class="flex items-center gap-3 mb-6">
      <div
        class="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"
      >
        <AppIcon name="package" :size="20" />
      </div>
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Анализ выручки</h3>
        <p class="text-sm text-gray-600">Динамика выручки по месяцам</p>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-emerald-50 rounded-lg p-4">
        <div class="text-sm font-medium text-emerald-800 mb-1">
          Общая выручка
        </div>
        <div class="text-xl font-bold text-emerald-900">
          {{ formatCurrency(totalRevenue) }}
        </div>
      </div>

      <div class="bg-blue-50 rounded-lg p-4">
        <div class="text-sm font-medium text-blue-800 mb-1">
          Средняя за месяц
        </div>
        <div class="text-xl font-bold text-blue-900">
          {{ formatCurrency(avgMonthlyRevenue) }}
        </div>
      </div>

      <div class="bg-purple-50 rounded-lg p-4">
        <div class="text-sm font-medium text-purple-800 mb-1">Рост за год</div>
        <div class="text-xl font-bold text-purple-900">
          +{{ growthRate.toFixed(1) }}%
        </div>
      </div>
    </div>

    <!-- Chart -->
    <div class="relative">
      <div class="flex items-end justify-between h-64 mb-4">
        <div
          v-for="item in chartData"
          :key="item.month"
          class="flex-1 flex flex-col items-center gap-2 px-1"
        >
          <div class="w-full flex flex-col items-center gap-1">
            <!-- Target line -->
            <div
              class="w-full bg-gray-200 rounded-t"
              :style="{ height: `${getBarHeight(item.target)}%` }"
            >
              <!-- Revenue bar -->
              <div
                class="w-full bg-emerald-500 rounded-t transition-all duration-500"
                :style="{ height: `${(item.revenue / item.target) * 100}%` }"
              ></div>
            </div>
          </div>
          <div class="text-xs font-medium text-gray-600">{{ item.month }}</div>
        </div>
      </div>

      <!-- Legend -->
      <div class="flex items-center justify-center gap-6 text-sm">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-emerald-500 rounded"></div>
          <span class="text-gray-600">Выручка</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-gray-200 rounded"></div>
          <span class="text-gray-600">План</span>
        </div>
      </div>
    </div>

    <!-- Detailed breakdown -->
    <div class="mt-8 pt-6 border-t border-gray-200">
      <h4 class="text-md font-semibold text-gray-900 mb-4">
        Детализация по месяцам
      </h4>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-2 font-medium text-gray-700">Месяц</th>
              <th class="text-right py-2 font-medium text-gray-700">Выручка</th>
              <th class="text-right py-2 font-medium text-gray-700">План</th>
              <th class="text-right py-2 font-medium text-gray-700">
                Выполнение
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in chartData"
              :key="item.month"
              class="border-b border-gray-100"
            >
              <td class="py-2 font-medium">{{ item.month }}</td>
              <td class="text-right py-2">
                {{ formatCurrency(item.revenue) }}
              </td>
              <td class="text-right py-2">{{ formatCurrency(item.target) }}</td>
              <td class="text-right py-2">
                <span
                  :class="[
                    'font-medium',
                    item.revenue >= item.target
                      ? 'text-green-600'
                      : 'text-red-600',
                  ]"
                >
                  {{ Math.round((item.revenue / item.target) * 100) }}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
