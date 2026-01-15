<script setup lang="ts">
import AppIcon from "@/components/AppIcon.vue";

interface Manager {
  name: string;
  sales: number;
  revenue: number;
  clients: number;
  visits: number;
  conversion: number;
}

interface Props {
  data: Manager[];
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

const getPerformanceColor = (conversion: number) => {
  if (conversion >= 25) return "text-green-600";
  if (conversion >= 15) return "text-orange-600";
  return "text-red-600";
};
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
    <div class="flex items-center gap-3 mb-6">
      <div
        class="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center"
      >
        <AppIcon name="user-cog" :size="20" />
      </div>
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Отчет по менеджерам</h3>
        <p class="text-sm text-gray-600">Эффективность работы менеджеров</p>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-200">
            <th class="text-left py-3 px-4 font-medium text-gray-700">
              Менеджер
            </th>
            <th class="text-center py-3 px-4 font-medium text-gray-700">
              Продажи
            </th>
            <th class="text-center py-3 px-4 font-medium text-gray-700">
              Выручка
            </th>
            <th class="text-center py-3 px-4 font-medium text-gray-700">
              Клиенты
            </th>
            <th class="text-center py-3 px-4 font-medium text-gray-700">
              Посещения
            </th>
            <th class="text-center py-3 px-4 font-medium text-gray-700">
              Конверсия
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="manager in data"
            :key="manager.name"
            class="border-b border-gray-100 hover:bg-gray-50"
          >
            <td class="py-4 px-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"
                >
                  <AppIcon name="user" :size="16" class="text-gray-600" />
                </div>
                <span class="font-medium text-gray-900">{{
                  manager.name
                }}</span>
              </div>
            </td>
            <td class="text-center py-4 px-4">
              <span class="text-lg font-semibold text-gray-900">{{
                manager.sales
              }}</span>
            </td>
            <td class="text-center py-4 px-4">
              <span class="text-sm font-medium text-gray-900">{{
                formatCurrency(manager.revenue)
              }}</span>
            </td>
            <td class="text-center py-4 px-4">
              <span class="text-lg font-semibold text-gray-900">{{
                manager.clients
              }}</span>
            </td>
            <td class="text-center py-4 px-4">
              <span class="text-lg font-semibold text-gray-900">{{
                manager.visits
              }}</span>
            </td>
            <td class="text-center py-4 px-4">
              <span
                :class="[
                  'text-lg font-semibold',
                  getPerformanceColor(manager.conversion),
                ]"
              >
                {{ manager.conversion }}%
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="detailed" class="mt-6 pt-6 border-t border-gray-200">
      <h4 class="text-md font-semibold text-gray-900 mb-4">
        Рейтинг менеджеров
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-green-50 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <AppIcon name="trophy" :size="16" class="text-green-600" />
            <span class="text-sm font-medium text-green-800"
              >Лучший по продажам</span
            >
          </div>
          <div class="text-lg font-bold text-green-900">
            {{ data[0]?.name }}
          </div>
          <div class="text-sm text-green-700">{{ data[0]?.sales }} сделок</div>
        </div>

        <div class="bg-blue-50 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <AppIcon name="package" :size="16" class="text-blue-600" />
            <span class="text-sm font-medium text-blue-800"
              >Лучший по выручке</span
            >
          </div>
          <div class="text-lg font-bold text-blue-900">{{ data[0]?.name }}</div>
          <div class="text-sm text-blue-700">
            {{ formatCurrency(data[0]?.revenue || 0) }}
          </div>
        </div>

        <div class="bg-purple-50 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <AppIcon name="trending-up" :size="16" class="text-purple-600" />
            <span class="text-sm font-medium text-purple-800"
              >Лучшая конверсия</span
            >
          </div>
          <div class="text-lg font-bold text-purple-900">
            {{ data[0]?.name }}
          </div>
          <div class="text-sm text-purple-700">{{ data[0]?.conversion }}%</div>
        </div>
      </div>
    </div>
  </div>
</template>
