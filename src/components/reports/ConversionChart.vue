<script setup lang="ts">
import { ref, computed } from "vue";
import AppIcon from "@/components/AppIcon.vue";

const conversionData = ref([
  { stage: "Лиды", count: 1000, percentage: 100 },
  { stage: "Квалифицированные", count: 650, percentage: 65 },
  { stage: "Презентация", count: 420, percentage: 42 },
  { stage: "Предложение", count: 280, percentage: 28 },
  { stage: "Переговоры", count: 180, percentage: 18 },
  { stage: "Закрытие", count: 120, percentage: 12 },
]);

const funnelMetrics = ref({
  totalLeads: 1000,
  totalDeals: 120,
  overallConversion: 12,
  avgDealTime: 28,
  dropOffRate: 88,
});

// Вычисляем пары конверсии безопасно
const conversionPairs = computed(() => {
  const pairs = [];
  for (let i = 0; i < conversionData.value.length - 1; i++) {
    const current = conversionData.value[i];
    const next = conversionData.value[i + 1];

    // TypeScript теперь знает что current и next не undefined
    if (current && next) {
      pairs.push({
        from: current.stage,
        to: next.stage,
        percentage: Math.round((next.count / current.count) * 100),
        countText: `${next.count} из ${current.count}`,
      });
    }
  }
  return pairs;
});
const getStageColor = (index: number) => {
  const colors = [
    "bg-blue-500",
    "bg-indigo-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-orange-500",
    "bg-green-500",
  ];
  return colors[index] || "bg-gray-500";
};

const getStageWidth = (percentage: number) => {
  return `${percentage}%`;
};
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
    <div class="flex items-center gap-3 mb-6">
      <div
        class="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center"
      >
        <AppIcon name="trending-up" :size="20" />
      </div>
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Анализ конверсии</h3>
        <p class="text-sm text-gray-600">
          Воронка продаж и конверсия по этапам
        </p>
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="text-center">
        <div class="text-2xl font-bold text-gray-900 mb-1">
          {{ funnelMetrics.totalLeads }}
        </div>
        <div class="text-sm text-gray-600">Всего лидов</div>
      </div>

      <div class="text-center">
        <div class="text-2xl font-bold text-green-600 mb-1">
          {{ funnelMetrics.totalDeals }}
        </div>
        <div class="text-sm text-gray-600">Закрыто сделок</div>
      </div>

      <div class="text-center">
        <div class="text-2xl font-bold text-blue-600 mb-1">
          {{ funnelMetrics.overallConversion }}%
        </div>
        <div class="text-sm text-gray-600">Общая конверсия</div>
      </div>

      <div class="text-center">
        <div class="text-2xl font-bold text-purple-600 mb-1">
          {{ funnelMetrics.avgDealTime }}
        </div>
        <div class="text-sm text-gray-600">Дней до сделки</div>
      </div>
    </div>

    <!-- Conversion Funnel -->
    <div class="mb-8">
      <h4 class="text-md font-semibold text-gray-900 mb-4">
        Воронка конверсии
      </h4>
      <div class="space-y-3">
        <div
          v-for="(stage, index) in conversionData"
          :key="stage.stage"
          class="relative"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">{{
              stage.stage
            }}</span>
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-gray-900">{{
                stage.count
              }}</span>
              <span class="text-xs text-gray-500"
                >({{ stage.percentage }}%)</span
              >
            </div>
          </div>

          <div class="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
            <div
              :class="[
                'h-full transition-all duration-500 rounded-lg',
                getStageColor(index),
              ]"
              :style="{ width: getStageWidth(stage.percentage) }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stage Conversion Rates -->
    <div class="pt-6 border-t border-gray-200">
      <h4 class="text-md font-semibold text-gray-900 mb-4">
        Конверсия между этапами
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="(pair, index) in conversionPairs"
          :key="index"
          class="bg-gray-50 rounded-lg p-4"
        >
          <div class="text-sm text-gray-600 mb-1">
            {{ pair.from }} → {{ pair.to }}
          </div>
          <div class="text-lg font-bold text-gray-900">
            {{ pair.percentage }}%
          </div>
          <div class="text-xs text-gray-500">
            {{ pair.countText }}
          </div>
        </div>
      </div>
    </div>

    <!-- Recommendations -->
    <div class="mt-6 pt-6 border-t border-gray-200">
      <h4 class="text-md font-semibold text-gray-900 mb-4">
        Рекомендации по улучшению
      </h4>
      <div class="space-y-3">
        <div class="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
          <AppIcon
            name="alert-triangle"
            :size="16"
            class="text-yellow-600 mt-0.5"
          />
          <div>
            <div class="text-sm font-medium text-yellow-800">
              Низкая конверсия на этапе "Презентация"
            </div>
            <div class="text-xs text-yellow-700">
              Рекомендуется улучшить качество презентаций и обучить менеджеров
            </div>
          </div>
        </div>

        <div class="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
          <AppIcon name="trending-up" :size="16" class="text-blue-600 mt-0.5" />
          <div>
            <div class="text-sm font-medium text-blue-800">
              Хорошая конверсия на этапе "Переговоры"
            </div>
            <div class="text-xs text-blue-700">
              Менеджеры эффективно работают с возражениями
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
