<script setup lang="ts">
import { ref, watch } from "vue";
import AppIcon from "@/components/AppIcon.vue";

export interface TicketsFilters {
  search: string;
  status: string;
  source: string;
  assignedTo: string;
  dateFrom: string;
  dateTo: string;
}

interface Props {
  filters: TicketsFilters;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:filters": [filters: TicketsFilters];
}>();

const localFilters = ref<TicketsFilters>({ ...props.filters });

watch(
  () => props.filters,
  (val) => { localFilters.value = { ...val }; },
  { deep: true }
);

const statuses = [
  { value: "all", label: "Все статусы" },
  { value: "active", label: "Активные" },
  { value: "resolved", label: "Решены" },
  { value: "unresolved", label: "Не решены" },
  { value: "closed", label: "Закрыты" },
];

const sources = [
  { value: "all", label: "Все источники" },
  { value: "telegram", label: "Telegram" },
  { value: "max", label: "МАКС" },
];

const hasActiveFilters = ref(false);

const update = () => {
  hasActiveFilters.value =
    localFilters.value.search !== "" ||
    localFilters.value.status !== "all" ||
    localFilters.value.source !== "all" ||
    localFilters.value.assignedTo !== "all" ||
    localFilters.value.dateFrom !== "" ||
    localFilters.value.dateTo !== "";
  emit("update:filters", { ...localFilters.value });
};

const reset = () => {
  localFilters.value = {
    search: "",
    status: "all",
    source: "all",
    assignedTo: "all",
    dateFrom: "",
    dateTo: "",
  };
  hasActiveFilters.value = false;
  emit("update:filters", { ...localFilters.value });
};
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 px-4 py-3">
    <div class="flex flex-wrap items-center gap-2">
      <!-- Search -->
      <div class="relative flex-1 min-w-[180px]">
        <AppIcon
          name="search"
          :size="15"
          class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          v-model="localFilters.search"
          @input="update"
          type="text"
          placeholder="Поиск по тикетам..."
          class="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <!-- Status -->
      <select
        v-model="localFilters.status"
        @change="update"
        class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
      >
        <option v-for="s in statuses" :key="s.value" :value="s.value">
          {{ s.label }}
        </option>
      </select>

      <!-- Source -->
      <select
        v-model="localFilters.source"
        @change="update"
        class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
      >
        <option v-for="s in sources" :key="s.value" :value="s.value">
          {{ s.label }}
        </option>
      </select>

      <!-- Date from -->
      <input
        v-model="localFilters.dateFrom"
        @change="update"
        type="date"
        class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      />

      <!-- Date to -->
      <input
        v-model="localFilters.dateTo"
        @change="update"
        type="date"
        class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      />

      <!-- Reset -->
      <button
        v-if="hasActiveFilters"
        @click="reset"
        class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <AppIcon name="x" :size="14" />
        Сбросить
      </button>
    </div>
  </div>
</template>
