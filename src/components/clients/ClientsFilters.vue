<script setup lang="ts">
import { ref, computed, watch } from "vue";
import AppIcon from "@/components/AppIcon.vue";
import type { ClientsFilters } from "@/types/clients";

interface Props {
  filters: ClientsFilters;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:filters": [filters: ClientsFilters];
}>();

const localFilters = ref<ClientsFilters>({ ...props.filters });
const isFiltersOpen = ref(false);

const activeFiltersCount = computed(() => {
  let count = 0;
  if (localFilters.value.search) count++;
  if (localFilters.value.dateFrom) count++;
  if (localFilters.value.dateTo) count++;
  return count;
});

const updateFilters = () => {
  emit("update:filters", { ...localFilters.value });
};

watch(
  () => props.filters,
  (newFilters) => {
    localFilters.value = { ...newFilters };
  },
  { deep: true }
);

const clearFilters = () => {
  localFilters.value = {
    search: "",
    dateFrom: "",
    dateTo: "",
  };
  updateFilters();
};

const toggleFilters = () => {
  isFiltersOpen.value = !isFiltersOpen.value;
};
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200">
    <!-- Mobile Filter Toggle -->
    <div class="md:hidden px-3 py-2 border-b border-gray-200">
      <button
        @click="toggleFilters"
        class="w-full flex items-center justify-between text-left"
      >
        <div class="flex items-center gap-2">
          <AppIcon name="filter" :size="16" class="text-gray-500" />
          <span class="text-sm font-medium text-gray-900">Фильтры</span>
          <span
            v-if="activeFiltersCount > 0"
            class="bg-blue-100 text-blue-800 text-xs font-medium px-1.5 py-0.5 rounded-full"
          >
            {{ activeFiltersCount }}
          </span>
        </div>
        <AppIcon
          name="chevron-down"
          :size="16"
          class="[ 'text-gray-500 transition-transform', { 'rotate-180': isFiltersOpen }, ]"
        />
      </button>
    </div>

    <!-- Desktop Header -->
    <div
      class="hidden md:flex items-center justify-between px-6 py-4 border-b border-gray-200"
    >
      <div class="flex items-center gap-2">
        <AppIcon name="filter" :size="18" class="text-gray-500" />
        <h3 class="text-lg font-semibold text-gray-900">Фильтры</h3>
        <span
          v-if="activeFiltersCount > 0"
          class="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full"
        >
          {{ activeFiltersCount }}
        </span>
      </div>
      <button
        @click="clearFilters"
        class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        <AppIcon name="x" :size="14" />
        Очистить
      </button>
    </div>

    <!-- Mobile Filters Content - ТОЛЬКО когда открыты -->
    <div v-if="isFiltersOpen" class="md:hidden px-3 py-3 space-y-3">
      <!-- Mobile Clear Button -->
      <div class="flex justify-end">
        <button
          @click="clearFilters"
          class="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <AppIcon name="x" :size="12" />
          Очистить
        </button>
      </div>

      <!-- Search -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">
          Поиск
        </label>
        <div class="relative">
          <div
            class="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none"
          >
            <AppIcon name="search" :size="14" class="text-gray-400" />
          </div>
          <input
            v-model="localFilters.search"
            @input="updateFilters"
            type="text"
            placeholder="ФИО, телефон, email"
            class="w-full pl-7 pr-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <!-- Date Range -->
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            От
          </label>
          <input
            v-model="localFilters.dateFrom"
            @change="updateFilters"
            type="date"
            class="w-full px-2 py-2 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            До
          </label>
          <input
            v-model="localFilters.dateTo"
            @change="updateFilters"
            type="date"
            class="w-full px-2 py-2 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <!-- Apply Button -->
      <div class="pt-1">
        <button
          @click="toggleFilters"
          class="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Применить
        </button>
      </div>
    </div>

    <!-- Desktop Content - ВСЕГДА показан -->
    <div class="hidden md:block p-6 space-y-4">
      <!-- Search - Full width -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Поиск по ФИО, телефону, почте
        </label>
        <div class="relative">
          <div
            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
          >
            <AppIcon name="search" :size="16" class="text-gray-400" />
          </div>
          <input
            v-model="localFilters.search"
            @input="updateFilters"
            type="text"
            placeholder="Введите ФИО, телефон или email"
            class="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <!-- Date Filters -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Дата от
          </label>
          <input
            v-model="localFilters.dateFrom"
            @change="updateFilters"
            type="date"
            class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Дата до
          </label>
          <input
            v-model="localFilters.dateTo"
            @change="updateFilters"
            type="date"
            class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  </div>
</template>
