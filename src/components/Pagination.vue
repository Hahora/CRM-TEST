<script setup lang="ts">
import { computed } from "vue";
import AppIcon from "./AppIcon.vue";

interface Props {
  total: number;
  currentPage: number;
  perPage: number;
  perPageOptions?: number[];
  showPerPageSelector?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  perPageOptions: () => [5, 10, 20, 50],
  showPerPageSelector: true,
});

const emit = defineEmits<{
  "page-change": [page: number];
  "per-page-change": [perPage: number];
}>();

// Вычисляемые свойства
const totalPages = computed(() => Math.ceil(props.total / props.perPage));

const startItem = computed(() => {
  if (props.total === 0) return 0;
  return (props.currentPage - 1) * props.perPage + 1;
});

const endItem = computed(() => {
  const end = props.currentPage * props.perPage;
  return end > props.total ? props.total : end;
});

// Генерация номеров страниц для отображения
const visiblePages = computed(() => {
  const pages: (number | string)[] = [];
  const current = props.currentPage;
  const total = totalPages.value;

  if (total <= 7) {
    // Если страниц мало, показываем все
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    // Сложная логика для большого количества страниц
    if (current <= 4) {
      // Начало: 1 2 3 4 5 ... last
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
      pages.push("...");
      pages.push(total);
    } else if (current >= total - 3) {
      // Конец: 1 ... last-4 last-3 last-2 last-1 last
      pages.push(1);
      pages.push("...");
      for (let i = total - 4; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Середина: 1 ... current-1 current current+1 ... last
      pages.push(1);
      pages.push("...");
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i);
      }
      pages.push("...");
      pages.push(total);
    }
  }

  return pages;
});

// Методы
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value && page !== props.currentPage) {
    emit("page-change", page);
  }
};

const changePerPage = (newPerPage: number) => {
  emit("per-page-change", newPerPage);
};

const goToPrevious = () => {
  if (props.currentPage > 1) {
    goToPage(props.currentPage - 1);
  }
};

const goToNext = () => {
  if (props.currentPage < totalPages.value) {
    goToPage(props.currentPage + 1);
  }
};
</script>

<template>
  <div
    v-if="total > 0"
    class="bg-white border-t border-gray-200 px-4 py-3 sm:px-6"
  >
    <!-- Mobile -->
    <div class="flex items-center justify-between sm:hidden">
      <div class="text-sm text-gray-700">
        {{ startItem }}-{{ endItem }} из {{ total }}
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="goToPrevious"
          :disabled="currentPage === 1"
          class="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <AppIcon name="chevron-left" :size="16" />
        </button>
        <span class="text-sm text-gray-700 px-2">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <button
          @click="goToNext"
          :disabled="currentPage === totalPages"
          class="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <AppIcon name="chevron-right" :size="16" />
        </button>
      </div>
    </div>

    <!-- Desktop -->
    <div class="hidden sm:flex sm:items-center sm:justify-between">
      <!-- Info and Per Page Selector -->
      <div class="flex items-center gap-6">
        <div class="text-sm text-gray-700">
          Показано <span class="font-medium">{{ startItem }}</span> -
          <span class="font-medium">{{ endItem }}</span> из
          <span class="font-medium">{{ total }}</span> результатов
        </div>

        <div v-if="showPerPageSelector" class="flex items-center gap-2">
          <label class="text-sm text-gray-700">Показывать:</label>
          <select
            :value="perPage"
            @change="
              changePerPage(Number(($event.target as HTMLSelectElement).value))
            "
            class="px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option
              v-for="option in perPageOptions"
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </select>
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex items-center gap-1">
        <!-- Previous Button -->
        <button
          @click="goToPrevious"
          :disabled="currentPage === 1"
          class="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <AppIcon name="chevron-left" :size="16" />
        </button>

        <!-- Page Numbers -->
        <template v-for="(page, index) in visiblePages" :key="index">
          <button
            v-if="typeof page === 'number'"
            @click="goToPage(page)"
            :class="[
              'relative inline-flex items-center px-4 py-2 text-sm font-medium border',
              page === currentPage
                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50',
            ]"
          >
            {{ page }}
          </button>
          <span
            v-else
            class="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300"
          >
            {{ page }}
          </span>
        </template>

        <!-- Next Button -->
        <button
          @click="goToNext"
          :disabled="currentPage === totalPages"
          class="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <AppIcon name="chevron-right" :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>
