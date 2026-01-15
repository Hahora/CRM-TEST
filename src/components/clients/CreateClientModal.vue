<script setup lang="ts">
import { reactive, computed, onMounted, onUnmounted, watch, ref } from "vue";
import AppIcon from "@/components/AppIcon.vue";
import type { CreateClientData as CreateClientRequest } from "@/types/clients";
interface Props {
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  create: [client: CreateClientRequest];
}>();

interface FormData {
  full_name: string;
  phone: string;
  email: string;
  gender: string;
  birth_date: string;
  telegram_id: string;
  max_id: string;
}

const form = reactive<FormData>({
  full_name: "",
  phone: "",
  email: "",
  gender: "",
  birth_date: "",
  telegram_id: "",
  max_id: "",
});

const isSubmitting = ref(false);

// Валидация формы
const isFormValid = computed(() => {
  return form.full_name.trim() && form.phone.trim();
});

// Блокировка скролла при открытии модального окна
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

onUnmounted(() => {
  document.body.style.overflow = "";
});

const closeModal = () => {
  document.body.style.overflow = "";
  emit("close");
};

const resetForm = () => {
  form.full_name = "";
  form.phone = "";
  form.email = "";
  form.gender = "";
  form.birth_date = "";
  form.telegram_id = "";
  form.max_id = "";
};

const handleSubmit = async () => {
  if (!isFormValid.value || isSubmitting.value) return;

  isSubmitting.value = true;

  try {
    const clientData: CreateClientRequest = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      gender:
        form.gender === "male" || form.gender === "female"
          ? form.gender
          : undefined,
      birth_date: form.birth_date || undefined,
      telegram_id: form.telegram_id.trim() || undefined,
      max_id: form.max_id.trim() || undefined,
    };

    emit("create", clientData);
    resetForm();
  } finally {
    isSubmitting.value = false;
  }
};

// Форматирование телефона
const formatPhoneInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  let value = input.value.replace(/\D/g, "");

  if (value.startsWith("7")) {
    value = value.substring(1);
  }

  if (value.length > 0) {
    if (value.length <= 3) {
      value = `+7 (${value}`;
    } else if (value.length <= 6) {
      value = `+7 (${value.slice(0, 3)}) ${value.slice(3)}`;
    } else if (value.length <= 8) {
      value = `+7 (${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(
        6
      )}`;
    } else {
      value = `+7 (${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(
        6,
        8
      )}-${value.slice(8, 10)}`;
    }
  }

  form.phone = value;
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
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
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
            v-if="isOpen"
            class="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <!-- Header -->
            <div
              class="px-6 py-4 border-b border-gray-200 flex items-center justify-between"
            >
              <h2 class="text-xl font-semibold text-gray-900">
                Добавить клиента
              </h2>
              <button
                @click="closeModal"
                class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <AppIcon name="x" :size="20" />
              </button>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="p-6">
              <div class="space-y-6">
                <!-- Основная информация -->
                <div class="space-y-4">
                  <h3 class="text-lg font-medium text-gray-900">
                    Основная информация
                  </h3>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      ФИО *
                    </label>
                    <input
                      v-model="form.full_name"
                      type="text"
                      required
                      placeholder="Введите полное имя"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Телефон *
                      </label>
                      <input
                        :value="form.phone"
                        @input="formatPhoneInput"
                        type="tel"
                        required
                        placeholder="+7 (___) ___-__-__"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email
                      </label>
                      <input
                        v-model="form.email"
                        type="email"
                        placeholder="example@email.com"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <!-- Пол и Дата рождения -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Пол
                      </label>
                      <select
                        v-model="form.gender"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Не указан</option>
                        <option value="male">Мужской</option>
                        <option value="female">Женский</option>
                      </select>
                    </div>
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Дата рождения
                      </label>
                      <input
                        v-model="form.birth_date"
                        type="date"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <!-- Мессенджеры -->
                <div class="space-y-4">
                  <h3 class="text-lg font-medium text-gray-900">Мессенджеры</h3>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Telegram ID
                    </label>
                    <div class="relative">
                      <div
                        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                      >
                        <AppIcon name="send" :size="16" class="text-blue-500" />
                      </div>
                      <input
                        v-model="form.telegram_id"
                        type="text"
                        placeholder="Введите Telegram ID"
                        class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      МАКС ID
                    </label>
                    <div class="relative">
                      <div
                        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                      >
                        <AppIcon
                          name="message-circle"
                          :size="16"
                          class="text-purple-500"
                        />
                      </div>
                      <input
                        v-model="form.max_id"
                        type="text"
                        placeholder="Введите МАКС ID"
                        class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div
                class="flex flex-col-reverse sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200"
              >
                <button
                  type="button"
                  @click="closeModal"
                  class="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  :disabled="!isFormValid || isSubmitting"
                  class="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <AppIcon
                    v-if="isSubmitting"
                    name="refresh-cw"
                    :size="16"
                    class="animate-spin"
                  />
                  {{ isSubmitting ? "Создание..." : "Создать клиента" }}
                </button>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
