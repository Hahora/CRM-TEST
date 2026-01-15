<script setup lang="ts">
import { ref } from "vue";
import AppIcon from "@/components/AppIcon.vue";

interface SalesFilters {
  search: string;
  status: string;
  branch: string;
  manager: string;
  dateFrom: string;
  dateTo: string;
}

interface Props {
  filters: SalesFilters;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:filters": [filters: SalesFilters];
}>();

const localFilters = ref<SalesFilters>({ ...props.filters });

const branches = [
  { value: "all", label: "Все филиалы" },
  { value: "Главный офис", label: "Главный офис" },
  { value: "Филиал №1", label: "Филиал №1" },
  { value: "Филиал №2", label: "Филиал №2" },
  { value: "Филиал №3", label: "Филиал №3" },
];

const managers = [
  { value: "all", label: "Все менеджеры" },
  { value: "Иван Петров", label: "Иван Петров" },
  { value: "Анна Смирнова", label: "Анна Смирнова" },
  { value: "Петр Николаев", label: "Петр Николаев" },
  { value: "Мария Иванова", label: "Мария Иванова" },
];

const statuses = [
  { value: "all", label: "Все статусы" },
  { value: "pending", label: "В процессе" },
  { value: "completed", label: "Завершено" },
  { value: "cancelled", label: "Отменено" },
];

const updateFilters = () => {
  emit("update:filters", { ...localFilters.value });
};

const resetFilters = () => {
  localFilters.value = {
    search: "",
    status: "all",
    branch: "all",
    manager: "all",
    dateFrom: "",
    dateTo: "",
  };
  updateFilters();
};
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">Фильтры</h3>
      <button
        @click="resetFilters"
        class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        <AppIcon name="refresh-cw" :size="14" />
        Сбросить
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      <!-- Search -->
      <div class="lg:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >Поиск</label
        >
        <div class="relative">
          <AppIcon
            name="users"
            :size="16"
            class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="localFilters.search"
            @input="updateFilters"
            type="text"
            placeholder="Клиент или товар..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <!-- Status -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >Статус</label
        >
        <select
          v-model="localFilters.status"
          @change="updateFilters"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option
            v-for="status in statuses"
            :key="status.value"
            :value="status.value"
          >
            {{ status.label }}
          </option>
        </select>
      </div>

      <!-- Branch -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >Филиал</label
        >
        <select
          v-model="localFilters.branch"
          @change="updateFilters"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option
            v-for="branch in branches"
            :key="branch.value"
            :value="branch.value"
          >
            {{ branch.label }}
          </option>
        </select>
      </div>

      <!-- Manager -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >Менеджер</label
        >
        <select
          v-model="localFilters.manager"
          @change="updateFilters"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option
            v-for="manager in managers"
            :key="manager.value"
            :value="manager.value"
          >
            {{ manager.label }}
          </option>
        </select>
      </div>

      <!-- Date From -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >Дата от</label
        >
        <input
          v-model="localFilters.dateFrom"
          @change="updateFilters"
          type="date"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  </div>
</template>
