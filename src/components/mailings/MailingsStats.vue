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
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
    <div class="bg-white rounded-xl border border-gray-200 p-3">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <AppIcon name="send" :size="16" />
        </div>
        <div class="min-w-0">
          <div class="text-xl font-bold text-gray-900 leading-none">{{ stats.total }}</div>
          <div class="text-xs text-gray-500 mt-0.5">Всего</div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-3">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 bg-gray-50 text-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <AppIcon name="edit" :size="16" />
        </div>
        <div class="min-w-0">
          <div class="text-xl font-bold text-gray-900 leading-none">{{ stats.draft }}</div>
          <div class="text-xs text-gray-500 mt-0.5">Черновики</div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-3">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <AppIcon name="clock" :size="16" />
        </div>
        <div class="min-w-0">
          <div class="text-xl font-bold text-gray-900 leading-none">{{ stats.scheduled }}</div>
          <div class="text-xs text-gray-500 mt-0.5">Запланировано</div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-3">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 bg-green-50 text-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <AppIcon name="check-circle" :size="16" />
        </div>
        <div class="min-w-0">
          <div class="text-xl font-bold text-gray-900 leading-none">{{ stats.sent }}</div>
          <div class="text-xs text-gray-500 mt-0.5">Отправлено</div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-3">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <AppIcon name="trending-up" :size="16" />
        </div>
        <div class="min-w-0">
          <div class="text-xl font-bold text-gray-900 leading-none">{{ stats.deliveryRate }}%</div>
          <div class="text-xs text-gray-500 mt-0.5">Доставляемость</div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-3">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <AppIcon name="mail" :size="16" />
        </div>
        <div class="min-w-0">
          <div class="text-xl font-bold text-gray-900 leading-none">{{ stats.openRate }}%</div>
          <div class="text-xs text-gray-500 mt-0.5">Открываемость</div>
        </div>
      </div>
    </div>
  </div>
</template>
