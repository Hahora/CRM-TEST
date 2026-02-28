<script setup lang="ts">
import { ref, watch, computed } from "vue";
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
  { value: "all",    label: "Все статусы" },
  { value: "active", label: "Активные" },
  { value: "closed", label: "Закрытые" },
];

const sources = [
  { value: "all",              label: "Все источники" },
  { value: "telegram",         label: "Telegram" },
  { value: "telegram_channel", label: "TG Канал" },
  { value: "max",              label: "МАКС" },
];

// Расширенная панель (мобайл)
const showMore = ref(false);

const hasActiveFilters = computed(() =>
  localFilters.value.search !== "" ||
  localFilters.value.status !== "all" ||
  localFilters.value.source !== "all" ||
  localFilters.value.dateFrom !== "" ||
  localFilters.value.dateTo !== ""
);

// Есть ли активные «дополнительные» фильтры (source / даты)
const hasExtraActive = computed(() =>
  localFilters.value.source !== "all" ||
  localFilters.value.dateFrom !== "" ||
  localFilters.value.dateTo !== ""
);

const update = () => {
  emit("update:filters", { ...localFilters.value });
};

const blurTarget = (e: Event) => (e.target as HTMLElement).blur();

const reset = () => {
  localFilters.value = {
    search: "",
    status: "all",
    source: "all",
    assignedTo: "all",
    dateFrom: "",
    dateTo: "",
  };
  showMore.value = false;
  emit("update:filters", { ...localFilters.value });
};
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">

    <!-- ── Основная строка (всегда видна) ── -->
    <div class="px-3 py-2.5 flex items-center gap-2">

      <!-- Поиск -->
      <div class="relative flex-1 min-w-0">
        <AppIcon
          name="search"
          :size="14"
          class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          v-model="localFilters.search"
          @input="update"
          @keydown.enter.prevent="blurTarget"
          type="text"
          enterkeyhint="done"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="none"
          spellcheck="false"
          placeholder="Имя, @username, TG ID, №..."
          class="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <!-- Статус (всегда) -->
      <select
        v-model="localFilters.status"
        @change="update"
        class="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white shrink-0"
      >
        <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>

      <!-- Кнопка «доп. фильтры» — только на мобайле -->
      <button
        class="md:hidden relative flex items-center justify-center w-8 h-8 rounded-lg border transition-colors shrink-0"
        :class="showMore || hasExtraActive
          ? 'border-blue-300 bg-blue-50 text-blue-600'
          : 'border-gray-200 text-gray-500 hover:bg-gray-50'"
        @click="showMore = !showMore"
        title="Дополнительные фильтры"
      >
        <AppIcon name="filter" :size="14" />
        <!-- Индикатор активных доп. фильтров -->
        <span
          v-if="hasExtraActive"
          class="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"
        />
      </button>

      <!-- Источник — только на десктопе -->
      <select
        v-model="localFilters.source"
        @change="update"
        class="hidden md:block px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
      >
        <option v-for="s in sources" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>

      <!-- Даты — только на десктопе -->
      <input
        v-model="localFilters.dateFrom"
        @change="update"
        type="date"
        class="hidden md:block px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      />
      <input
        v-model="localFilters.dateTo"
        @change="update"
        type="date"
        class="hidden md:block px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      />

      <!-- Сбросить — только на десктопе -->
      <button
        v-if="hasActiveFilters"
        @click="reset"
        class="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shrink-0"
      >
        <AppIcon name="x" :size="14" />
        Сбросить
      </button>
    </div>

    <!-- ── Доп. фильтры (мобайл, раскрывается) ── -->
    <Transition name="tf-expand">
      <div
        v-if="showMore"
        class="md:hidden border-t border-gray-100 px-3 pb-3 pt-2.5 space-y-2"
      >
        <!-- Источник -->
        <select
          v-model="localFilters.source"
          @change="update"
          class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        >
          <option v-for="s in sources" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>

        <!-- Даты -->
        <div class="flex gap-2">
          <div class="flex-1 flex flex-col gap-0.5">
            <span class="text-[11px] text-gray-400 font-medium px-0.5">С даты</span>
            <input
              v-model="localFilters.dateFrom"
              @change="update"
              type="date"
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div class="flex-1 flex flex-col gap-0.5">
            <span class="text-[11px] text-gray-400 font-medium px-0.5">По дату</span>
            <input
              v-model="localFilters.dateTo"
              @change="update"
              type="date"
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <!-- Сбросить (мобайл) -->
        <button
          v-if="hasActiveFilters"
          @click="reset"
          class="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <AppIcon name="x" :size="14" />
          Сбросить все фильтры
        </button>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.tf-expand-enter-active { transition: all 180ms ease-out; overflow: hidden; }
.tf-expand-leave-active { transition: all 140ms ease-in;  overflow: hidden; }
.tf-expand-enter-from,
.tf-expand-leave-to     { opacity: 0; max-height: 0; }
.tf-expand-enter-to,
.tf-expand-leave-from   { opacity: 1; max-height: 300px; }
</style>
