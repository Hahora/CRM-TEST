<script setup lang="ts">
import { ref } from "vue";
import AppIcon from "@/components/AppIcon.vue";
import type { ExportFilters } from "@/types/visits";

interface Props {
  isOpen: boolean;
  isExporting?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  export: [filters: ExportFilters];
}>();

const form = ref<ExportFilters>({
  start_date: "",
  end_date: "",
  branch_id: undefined,
});

const branches = [
  { value: undefined, label: "Все филиалы" },
  { value: 1, label: "Главный офис" },
  { value: 2, label: "Филиал №1" },
  { value: 3, label: "Филиал №2" },
];

const handleExport = async () => {
  try {
    emit("export", { ...form.value });
    // Закрываем модальное окно после успешного экспорта
    setTimeout(() => {
      closeModal();
    }, 1000);
  } catch (error) {
    console.error("Error exporting:", error);
  }
};

const closeModal = () => {
  emit("close");
};
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        @click="closeModal"
      >
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            class="bg-white rounded-xl shadow-2xl max-w-md w-full"
            @click.stop
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <AppIcon name="file-text" :size="20" class="text-gray-600" />
                  <h2 class="text-xl font-semibold text-gray-900">
                    Экспорт посещений
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

            <!-- Form -->
            <div class="p-6 space-y-4">
              <!-- Date Range -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Дата от
                  </label>
                  <input
                    v-model="form.start_date"
                    type="date"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Дата до
                  </label>
                  <input
                    v-model="form.end_date"
                    type="date"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <!-- Branch -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Филиал
                </label>
                <select
                  v-model="form.branch_id"
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

              <!-- Info -->
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div class="flex items-start gap-2">
                  <AppIcon
                    name="info"
                    :size="16"
                    class="text-blue-600 mt-0.5"
                  />
                  <div class="text-sm text-blue-800">
                    <p class="font-medium mb-1">Что будет экспортировано:</p>
                    <ul class="text-xs space-y-1">
                      <li>• Информация о клиенте и посещении</li>
                      <li>• Статус, дата, консультант, филиал</li>
                      <li>• Примерка, источник, комментарии</li>
                      <li>• Информация о покупках (если есть)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div
              class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3"
            >
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
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
