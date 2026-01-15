<script setup lang="ts">
import { ref, watch } from "vue";
import AppIcon from "@/components/AppIcon.vue";

interface Props {
  isOpen: boolean;
  isExporting?: boolean;
}

interface ExportFilters {
  created_after?: string;
  created_before?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isExporting: false,
});

const emit = defineEmits<{
  close: [];
  export: [filters: ExportFilters];
}>();

const form = ref<ExportFilters>({
  created_after: "",
  created_before: "",
});

// Блокировка скролла
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }
);

const handleExport = () => {
  const filters: ExportFilters = {};

  if (form.value.created_after) {
    filters.created_after = form.value.created_after;
  }

  if (form.value.created_before) {
    filters.created_before = form.value.created_before;
  }

  emit("export", filters);
};

const closeModal = () => {
  emit("close");
};

const resetForm = () => {
  form.value = {
    created_after: "",
    created_before: "",
  };
};

// Сброс формы при закрытии
watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) {
      resetForm();
    }
  }
);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      @click="closeModal"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full" @click.stop>
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <AppIcon name="file-text" :size="20" class="text-gray-600" />
              <h2 class="text-xl font-semibold text-gray-900">
                Экспорт клиентов
              </h2>
            </div>
            <button
              @click="closeModal"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <AppIcon name="x" :size="24" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-4">
          <p class="text-sm text-gray-600 mb-4">
            Выберите период для экспорта данных клиентов в Excel файл.
          </p>

          <!-- Date Range -->
          <div>
            <h3 class="text-sm font-medium text-gray-900 mb-3">
              Период создания
            </h3>
            <div class="grid grid-cols-1 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Дата с
                </label>
                <input
                  v-model="form.created_after"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Дата по
                </label>
                <input
                  v-model="form.created_before"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-2">
              Оставьте пустым для экспорта всех клиентов
            </p>
          </div>

          <!-- Export Info -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div class="flex items-start gap-2">
              <AppIcon name="info" :size="16" class="text-blue-600 mt-0.5" />
              <div class="text-sm text-blue-800">
                <p class="font-medium mb-1">Что будет экспортировано:</p>
                <ul class="text-xs space-y-1">
                  <li>• ФИО, телефон, email</li>
                  <li>• Пол и дата рождения</li>
                  <li>• Telegram ID и МАКС ID</li>
                  <li>• Дата создания и обновления</li>
                  <li>• Статистика покупок (если доступна)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            @click="closeModal"
            :disabled="isExporting"
            class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            @click="handleExport"
            :disabled="isExporting"
            class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <AppIcon
              v-if="isExporting"
              name="refresh-cw"
              :size="16"
              class="animate-spin"
            />
            <AppIcon v-else name="file-text" :size="16" />
            {{ isExporting ? "Экспортируется..." : "Экспортировать" }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
