<script setup lang="ts">
import AppIcon from "@/components/AppIcon.vue";

interface Props {
  stats: {
    total: number;
    draft: number;
    scheduled: number;
    sent: number;
    failed: number;
    totalRecipients: number;
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    deliveryRate: number;
    openRate: number;
  };
}

defineProps<Props>();
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
    <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div class="flex items-center justify-between mb-3">
        <div
          class="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="send" :size="20" />
        </div>
      </div>
      <div class="text-2xl font-bold text-gray-900 mb-1">{{ stats.total }}</div>
      <div class="text-sm text-gray-600">Всего рассылок</div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div class="flex items-center justify-between mb-3">
        <div
          class="w-10 h-10 bg-gray-50 text-gray-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="edit" :size="20" />
        </div>
      </div>
      <div class="text-2xl font-bold text-gray-900 mb-1">{{ stats.draft }}</div>
      <div class="text-sm text-gray-600">Черновики</div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div class="flex items-center justify-between mb-3">
        <div
          class="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="clock" :size="20" />
        </div>
      </div>
      <div class="text-2xl font-bold text-gray-900 mb-1">
        {{ stats.scheduled }}
      </div>
      <div class="text-sm text-gray-600">Запланировано</div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div class="flex items-center justify-between mb-3">
        <div
          class="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="check-circle" :size="20" />
        </div>
      </div>
      <div class="text-2xl font-bold text-gray-900 mb-1">{{ stats.sent }}</div>
      <div class="text-sm text-gray-600">Отправлено</div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div class="flex items-center justify-between mb-3">
        <div
          class="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="trending-up" :size="20" />
        </div>
      </div>
      <div class="text-2xl font-bold text-gray-900 mb-1">
        {{ stats.deliveryRate }}%
      </div>
      <div class="text-sm text-gray-600">Доставляемость</div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div class="flex items-center justify-between mb-3">
        <div
          class="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center"
        >
          <AppIcon name="mail" :size="20" />
        </div>
      </div>
      <div class="text-2xl font-bold text-gray-900 mb-1">
        {{ stats.openRate }}%
      </div>
      <div class="text-sm text-gray-600">Открываемость</div>
    </div>
  </div>
</template>
