<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import AppIcon from "@/components/AppIcon.vue";
import type { VisitsFilters } from "@/types/visits";
import { VISIT_STATUSES } from "@/types/visits";
import { branchesApi } from "@/services/branchesApi";
import type { Branch } from "@/services/branchesApi";
import { useToast } from "@/composables/useToast";

interface Props {
  filters: VisitsFilters;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:filters": [filters: VisitsFilters];
}>();

const { addToast } = useToast();

const localFilters = ref<VisitsFilters>({ ...props.filters });
const isFiltersOpen = ref(false);

// Реактивное состояние для филиалов
const branches = ref<{ value: string; label: string }[]>([
  { value: "", label: "Все филиалы" },
]);
const isLoadingBranches = ref(false);

// Статусы посещений
const statusOptions = [
  { value: "", label: "Все статусы" },
  { value: "scheduled", label: "Запланировано" },
  { value: "completed", label: "Завершено" },
  { value: "cancelled", label: "Отменено" },
  { value: "no_show", label: "Не явился" },
];

// Функция для загрузки филиалов
const loadBranches = async (): Promise<void> => {
  try {
    isLoadingBranches.value = true;

    const response = await branchesApi.getBranches();

    const branchOptions = response.branches.map((branch: Branch) => ({
      value: branch.id,
      label: branch.name,
    }));

    branches.value = [{ value: "", label: "Все филиалы" }, ...branchOptions];
  } catch (err) {
    console.error("Ошибка при загрузке филиалов:", err);

    // Показываем ошибку через Toast
    addToast({
      type: "error",
      title: "Ошибка загрузки филиалов",
      message:
        err instanceof Error
          ? err.message
          : "Не удалось загрузить список филиалов",
      duration: 5000,
    });

    // Автоматически устанавливаем "Все филиалы" при ошибке
    branches.value = [{ value: "", label: "Все филиалы" }];

    // Если был выбран конкретный филиал, сбрасываем на "Все филиалы"
    if (localFilters.value.branch_id) {
      localFilters.value.branch_id = "";
      updateFilters();
    }
  } finally {
    isLoadingBranches.value = false;
  }
};

// Вычисляемое свойство для подсчета активных фильтров
const activeFiltersCount = computed(() => {
  let count = 0;
  if (localFilters.value.status) count++;
  if (localFilters.value.branch_id) count++;
  if (localFilters.value.start_date) count++;
  if (localFilters.value.end_date) count++;
  if (localFilters.value.search) count++;
  return count;
});

// Функция для обновления фильтров
const updateFilters = () => {
  emit("update:filters", { ...localFilters.value });
};

// Функция для сброса фильтров - ИСПРАВЛЕНО
const resetFilters = () => {
  Object.assign(localFilters.value, {
    status: "",
    branch_id: undefined, // ← правильно для типа number | undefined
    start_date: "",
    end_date: "",
    search: "",
  });
};

// Функция для переключения видимости фильтров на мобильных
const toggleFilters = () => {
  isFiltersOpen.value = !isFiltersOpen.value;
};

// Отслеживание изменений в локальных фильтрах
watch(
  localFilters,
  () => {
    updateFilters();
  },
  { deep: true }
);

// Отслеживание изменений в пропсах
watch(
  () => props.filters,
  (newFilters) => {
    Object.assign(localFilters.value, newFilters);
  },
  { deep: true }
);

// Загрузка данных при монтировании
onMounted(() => {
  loadBranches();
});
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <!-- Mobile Header -->
    <div class="md:hidden">
      <button
        @click="toggleFilters"
        class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div class="flex items-center gap-2">
          <AppIcon name="filter" :size="18" class="text-gray-500" />
          <span class="text-base font-medium text-gray-900">Фильтры</span>
          <span
            v-if="activeFiltersCount > 0"
            class="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full"
          >
            {{ activeFiltersCount }}
          </span>
        </div>
        <AppIcon
          name="chevron-down"
          :size="16"
          :class="{
            'text-gray-500': true,
            'transition-transform': true,
            'rotate-180': isFiltersOpen,
          }"
        />
      </button>
    </div>

    <!-- Filters Content -->
    <div
      :class="[
        'transition-all duration-300 ease-in-out',
        isFiltersOpen || 'md:block'
          ? 'max-h-screen opacity-100'
          : 'max-h-0 opacity-0 md:max-h-screen md:opacity-100',
        'md:block overflow-hidden',
      ]"
    >
      <div class="p-4 md:p-6">
        <!-- Desktop Header -->
        <div class="hidden md:flex items-center justify-between mb-6">
          <div class="flex items-center gap-2">
            <AppIcon name="filter" :size="20" class="text-gray-500" />
            <h3 class="text-lg font-semibold text-gray-900">Фильтры</h3>
            <span
              v-if="activeFiltersCount > 0"
              class="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full"
            >
              {{ activeFiltersCount }}
            </span>
          </div>
          <button
            @click="resetFilters"
            class="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
          >
            <AppIcon name="x" :size="14" />
            Сбросить
          </button>
        </div>

        <!-- Search -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Поиск
          </label>
          <div class="relative">
            <div
              class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            >
              <AppIcon name="search" :size="16" class="text-gray-400" />
            </div>
            <input
              v-model="localFilters.search"
              type="text"
              placeholder="Поиск по клиенту, телефону..."
              class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        <!-- Filters Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Статус
            </label>
            <select
              v-model="localFilters.status"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option
                v-for="option in statusOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- Branch -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Филиал
            </label>
            <select
              v-model="localFilters.branch_id"
              :disabled="isLoadingBranches"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option
                v-for="option in branches"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- Date From -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Дата с
            </label>
            <input
              v-model="localFilters.start_date"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <!-- Филиал -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Филиал
            </label>
            <select
              v-model.number="localFilters.branch_id"
              :disabled="isLoadingBranches"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option
                v-for="option in branches"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Mobile Reset Button -->
        <div class="md:hidden pt-4 border-t border-gray-200">
          <button
            @click="resetFilters"
            class="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <AppIcon name="x" :size="16" />
            Сбросить фильтры
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
