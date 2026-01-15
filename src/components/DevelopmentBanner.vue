<script setup lang="ts">
import AppIcon from "./AppIcon.vue";
</script>

<template>
  <div class="bg-orange-50 border-b border-orange-200 px-4 py-3">
    <div class="flex items-center justify-center gap-3 max-w-7xl mx-auto">
      <AppIcon name="alert-triangle" :size="20" class="text-orange-500" />
      <div class="text-center">
        <span class="text-sm font-medium text-orange-800">
          Страница находится в разработке
        </span>
        <span class="text-sm text-orange-700 ml-2">
          — все элементы доступны только для просмотра
        </span>
      </div>
    </div>
  </div>
</template>
