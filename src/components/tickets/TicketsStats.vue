<script setup lang="ts">
import AppIcon from "@/components/AppIcon.vue";

interface Props {
  stats: {
    total: number;
    active: number;
    resolved: number;
    unresolved: number;
    closed: number;
    urgent: number;
    high: number;
    avgResponseTime: number;
  };
}

defineProps<Props>();
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 md:gap-6">
    <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div class="flex items-center justify-between mb-3">
        <div
          class="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="message-circle" :size="20" />
        </div>
      </div>
      <div class="text-2xl font-bold text-gray-900 mb-1">{{ stats.total }}</div>
      <div class="text-sm text-gray-600">Всего тикетов</div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div class="flex items-center justify-between mb-3">
        <div
          class="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="clock" :size="20" />
        </div>
      </div>
      <div class="text-2xl font-bold text-gray-900 mb-1">
        {{ stats.active }}
      </div>
      <div class="text-sm text-gray-600">Активные</div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div class="flex items-center justify-between mb-3">
        <div
          class="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="check-circle" :size="20" />
        </div>
      </div>
      <div class="text-2xl font-bold text-gray-900 mb-1">
        {{ stats.resolved }}
      </div>
      <div class="text-sm text-gray-600">Решены</div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div class="flex items-center justify-between mb-3">
        <div
          class="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="x-circle" :size="20" />
        </div>
      </div>
      <div class="text-2xl font-bold text-gray-900 mb-1">
        {{ stats.unresolved }}
      </div>
      <div class="text-sm text-gray-600">Не решены</div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div class="flex items-center justify-between mb-3">
        <div
          class="w-10 h-10 bg-gray-50 text-gray-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="archive" :size="20" />
        </div>
      </div>
      <div class="text-2xl font-bold text-gray-900 mb-1">
        {{ stats.closed }}
      </div>
      <div class="text-sm text-gray-600">Закрыты</div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div class="flex items-center justify-between mb-3">
        <div
          class="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="alert-triangle" :size="20" />
        </div>
      </div>
      <div class="text-2xl font-bold text-gray-900 mb-1">
        {{ stats.urgent }}
      </div>
      <div class="text-sm text-gray-600">Срочные</div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div class="flex items-center justify-between mb-3">
        <div
          class="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="trending-up" :size="20" />
        </div>
      </div>
      <div class="text-2xl font-bold text-gray-900 mb-1">{{ stats.high }}</div>
      <div class="text-sm text-gray-600">Высокий приоритет</div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div class="flex items-center justify-between mb-3">
        <div
          class="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="clock" :size="20" />
        </div>
      </div>
      <div class="text-2xl font-bold text-gray-900 mb-1">
        {{ stats.avgResponseTime }}
      </div>
      <div class="text-sm text-gray-600">Среднее время ответа (мин)</div>
    </div>
  </div>
</template>
