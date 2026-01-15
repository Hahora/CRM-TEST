<script setup lang="ts">
import { ref, watch, computed } from "vue";
import AppIcon from "@/components/AppIcon.vue";
import type { Visit } from "@/types/visits";
import { VISIT_STATUSES, VISIT_SOURCES } from "@/types/visits";
import { useToast } from "@/composables/useToast";

interface Props {
  isOpen: boolean;
  visit: Visit | null;
  isSubmitting?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  update: [visitData: any];
}>();

const { addToast } = useToast();

const form = ref({
  visit_datetime: "",
  status: "",
  fitting: false,
  source: "",
  notes: "",
  wishes: "",
  purchase_amount: null as number | null,
  purchased_items: "",
  feedback_rating: null as number | null,
  feedback_comment: "",
});

// Статусы посещений
const statusOptions = VISIT_STATUSES;

// Источники
const sourceOptions = VISIT_SOURCES;

// Валидация формы
const isFormValid = computed(() => {
  return form.value.visit_datetime && form.value.status && form.value.source;
});

// Инициализация формы данными посещения
const initializeForm = () => {
  if (props.visit) {
    const visitDate = new Date(props.visit.visit_datetime);
    const localDateTime = new Date(
      visitDate.getTime() - visitDate.getTimezoneOffset() * 60000
    );

    form.value = {
      visit_datetime: localDateTime.toISOString().slice(0, 16),
      status: props.visit.status,
      fitting: props.visit.fitting,
      source: props.visit.source,
      notes: props.visit.notes || "",
      wishes: props.visit.wishes || "",
      purchase_amount: props.visit.purchase_amount ?? null,
      purchased_items:
        typeof props.visit.purchased_items === "object"
          ? props.visit.purchased_items?.product_name || ""
          : props.visit.purchased_items || "",
      feedback_rating: props.visit.feedback_rating ?? null,
      feedback_comment: props.visit.feedback_comment || "",
    };
  }
};

// Обработка отправки формы
const handleSubmit = async () => {
  if (!isFormValid.value) {
    addToast({
      type: "error",
      title: "Ошибка валидации",
      message: "Заполните все обязательные поля",
    });
    return;
  }

  try {
    const visitData = {
      ...form.value,
      visit_datetime: new Date(form.value.visit_datetime).toISOString(),
      purchased_items: form.value.purchased_items
        ? { product_name: form.value.purchased_items }
        : null,
    };

    emit("update", visitData);

    addToast({
      type: "success",
      title: "Посещение обновлено",
      message: "Информация о посещении успешно сохранена",
    });

    closeModal();
  } catch (error) {
    console.error("Ошибка при обновлении посещения:", error);
    addToast({
      type: "error",
      title: "Ошибка сохранения",
      message: "Не удалось сохранить изменения",
    });
  }
};

const closeModal = () => {
  emit("close");
};

// Отслеживание изменений в пропсах
watch(
  () => props.visit,
  () => {
    if (props.visit) {
      initializeForm();
    }
  },
  { immediate: true }
);

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && props.visit) {
      initializeForm();
    }
  }
);
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
        v-if="isOpen && visit"
        class="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        @click.self="closeModal"
      >
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
        >
          <div
            v-if="isOpen && visit"
            class="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto my-8"
            @click.stop
          >
            <!-- Header -->
            <div
              class="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10"
            >
              <div class="flex items-center gap-3">
                <h2 class="text-xl font-semibold text-gray-900">
                  Редактирование посещения
                </h2>
                <span class="text-sm text-gray-500">ID: {{ visit.id }}</span>
              </div>
              <button
                @click="closeModal"
                class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <AppIcon name="x" :size="20" />
              </button>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
              <!-- Информация о клиенте (только для просмотра) -->
              <div class="bg-blue-50 rounded-lg p-4">
                <h3
                  class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"
                >
                  <AppIcon name="user" :size="18" class="text-blue-600" />
                  Клиент
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-500 mb-1">
                      Имя клиента
                    </label>
                    <div class="text-sm text-gray-900 font-medium">
                      {{ visit.client.full_name }}
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-500 mb-1">
                      Телефон
                    </label>
                    <div class="text-sm text-gray-900">
                      {{ visit.client.phone }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Основная информация о посещении -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h3
                  class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"
                >
                  <AppIcon name="calendar" :size="18" class="text-gray-600" />
                  Информация о посещении
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Дата и время -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Дата и время *
                    </label>
                    <input
                      v-model="form.visit_datetime"
                      type="datetime-local"
                      required
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>

                  <!-- Статус -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Статус *
                    </label>
                    <select
                      v-model="form.status"
                      required
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">Выберите статус</option>
                      <option
                        v-for="status in statusOptions"
                        :key="status.value"
                        :value="status.value"
                      >
                        {{ status.label }}
                      </option>
                    </select>
                  </div>

                  <!-- Источник -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Откуда записался *
                    </label>
                    <select
                      v-model="form.source"
                      required
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">Выберите источник</option>
                      <option
                        v-for="source in sourceOptions"
                        :key="source.value"
                        :value="source.value"
                      >
                        {{ source.label }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- Примерка -->
                <div class="mt-4">
                  <div class="flex items-center">
                    <input
                      v-model="form.fitting"
                      type="checkbox"
                      id="fitting"
                      class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      for="fitting"
                      class="ml-2 text-sm font-medium text-gray-700 flex items-center gap-2"
                    >
                      <AppIcon
                        name="scissors"
                        :size="16"
                        class="text-purple-500"
                      />
                      Примерка
                    </label>
                  </div>
                </div>
              </div>

              <!-- Комментарии -->
              <div class="bg-yellow-50 rounded-lg p-4">
                <h3
                  class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"
                >
                  <AppIcon
                    name="message-square"
                    :size="18"
                    class="text-yellow-600"
                  />
                  Комментарии
                </h3>
                <div class="space-y-4">
                  <!-- Комментарий -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Комментарий
                    </label>
                    <textarea
                      v-model="form.notes"
                      rows="3"
                      placeholder="Дополнител��ная информация о посещении..."
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                    ></textarea>
                  </div>

                  <!-- Пожелания клиента -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Пожелания клиента
                    </label>
                    <textarea
                      v-model="form.wishes"
                      rows="3"
                      placeholder="Особые пожелания или требования клиента..."
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>

              <!-- Информация о покупке -->
              <div class="bg-emerald-50 rounded-lg p-4">
                <h3
                  class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"
                >
                  <AppIcon
                    name="shopping-bag"
                    :size="18"
                    class="text-emerald-600"
                  />
                  Информация о покупке
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Сумма покупки -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Сумма покупки (₽)
                    </label>
                    <input
                      v-model.number="form.purchase_amount"
                      type="number"
                      min="0"
                      step="100"
                      placeholder="0"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>

                  <!-- Что купил -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Что купил
                    </label>
                    <input
                      v-model="form.purchased_items"
                      type="text"
                      placeholder="Название товара или услуги"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </form>

            <!-- Footer -->
            <div
              class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl"
            >
              <button
                type="button"
                @click="closeModal"
                :disabled="isSubmitting"
                class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                @click="handleSubmit"
                :disabled="!isFormValid || isSubmitting"
                class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <AppIcon
                  v-if="isSubmitting"
                  name="refresh-cw"
                  :size="16"
                  class="animate-spin"
                />
                <AppIcon v-else name="save" :size="16" />
                {{ isSubmitting ? "Сохранение..." : "Сохранить изменения" }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
