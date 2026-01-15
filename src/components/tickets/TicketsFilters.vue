<script setup lang="ts">
import { ref } from "vue";
import AppIcon from "@/components/AppIcon.vue";

interface TicketsFilters {
  search: string;
  status: string;
  source: string;
  priority: string;
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

const priorities = [
  { value: "all", label: "Все приоритеты" },
  { value: "urgent", label: "Срочный" },
  { value: "high", label: "Высокий" },
  { value: "medium", label: "Средний" },
  { value: "low", label: "Низкий" },
];

const assignees = [
  { value: "all", label: "Все сотрудники" },
  { value: "Admin User", label: "Admin User" },
  { value: "Иван Петров", label: "Иван Петров" },
  { value: "Анна Смирнова", label: "Анна Смирнова" },
  { value: "Петр Николаев", label: "Петр Николаев" },
  { value: "Мария Иванова", label: "Мария Иванова" },
];

const updateFilters = () => {
  emit("update:filters", { ...localFilters.value });
};

const resetFilters = () => {
  localFilters.value = {
    search: "",
    status: "all",
    source: "all",
    priority: "all",
    assignedTo: "all",
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

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
      <!-- Search -->
      <div class="lg:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >Поиск</label
        >
        <div class="relative">
          <AppIcon
            name="message-circle"
            :size="16"
            class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="localFilters.search"
            @input="updateFilters"
            type="text"
            placeholder="Номер тикета, клиент или сообщение..."
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

      <!-- Source -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >Источник</label
        >
        <select
          v-model="localFilters.source"
          @change="updateFilters"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option
            v-for="source in sources"
            :key="source.value"
            :value="source.value"
          >
            {{ source.label }}
          </option>
        </select>
      </div>

      <!-- Priority -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >Приоритет</label
        >
        <select
          v-model="localFilters.priority"
          @change="updateFilters"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option
            v-for="priority in priorities"
            :key="priority.value"
            :value="priority.value"
          >
            {{ priority.label }}
          </option>
        </select>
      </div>

      <!-- Assigned To -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >Назначен</label
        >
        <select
          v-model="localFilters.assignedTo"
          @change="updateFilters"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option
            v-for="assignee in assignees"
            :key="assignee.value"
            :value="assignee.value"
          >
            {{ assignee.label }}
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

      <!-- Date To -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >Дата до</label
        >
        <input
          v-model="localFilters.dateTo"
          @change="updateFilters"
          type="date"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  </div>
</template>
