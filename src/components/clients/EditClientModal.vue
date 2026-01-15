<script setup lang="ts">
import { ref, watch, computed } from "vue";
import AppIcon from "@/components/AppIcon.vue";
import type { Client } from "@/types/clients";
import type { UpdateClientData } from "@/services/clientsApi";

interface Props {
  isOpen: boolean;
  client: Client | null;
  isSubmitting?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSubmitting: false,
});

const emit = defineEmits<{
  close: [];
  update: [clientData: UpdateClientData];
}>();

const form = ref<UpdateClientData>({
  full_name: "",
  phone: "",
  email: "",
  gender: undefined,
  birth_date: "",
  telegram_id: "",
  max_id: "",
  referred_by_id: undefined,
});

// Заполняем форму данными клиента при открытии
watch(
  () => props.client,
  (client) => {
    if (client) {
      form.value = {
        full_name: client.full_name || "",
        phone: client.phone || "",
        email: client.email || "",
        gender: client.gender || undefined,
        birth_date: client.birth_date || "",
        telegram_id: client.telegram_id || "",
        max_id: client.max_id || "",
        referred_by_id: client.referred_by_id || undefined,
      };
    }
  },
  { immediate: true }
);

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

const isFormValid = computed(() => {
  return form.value.full_name.trim() && form.value.phone.trim();
});

const handleSubmit = () => {
  if (!isFormValid.value) return;

  // Очищаем пустые строки
  const cleanedData = { ...form.value };
  if (!cleanedData.email?.trim()) cleanedData.email = undefined;
  if (!cleanedData.birth_date?.trim()) cleanedData.birth_date = undefined;
  if (!cleanedData.telegram_id?.trim()) cleanedData.telegram_id = undefined;
  if (!cleanedData.max_id?.trim()) cleanedData.max_id = undefined;

  emit("update", cleanedData);
};

const closeModal = () => {
  emit("close");
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      @click="closeModal"
    >
      <div
        class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <AppIcon name="edit" :size="20" class="text-gray-600" />
              <h2 class="text-xl font-semibold text-gray-900">
                Редактировать клиента
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
        <form
          @submit.prevent="handleSubmit"
          class="overflow-y-auto max-h-[calc(90vh-140px)]"
        >
          <div class="p-6 space-y-6">
            <!-- Основная информация -->
            <div>
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                Основная информация
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    ФИО *
                  </label>
                  <input
                    v-model="form.full_name"
                    type="text"
                    required
                    placeholder="Введите ФИО"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Телефон *
                  </label>
                  <input
                    v-model="form.phone"
                    type="tel"
                    required
                    placeholder="+7 (999) 123-45-67"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    v-model="form.email"
                    type="email"
                    placeholder="example@email.com"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
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
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Дата рождения
                  </label>
                  <input
                    v-model="form.birth_date"
                    type="date"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Telegram ID
                  </label>
                  <input
                    v-model="form.telegram_id"
                    type="text"
                    placeholder="@username"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    МАКС ID
                  </label>
                  <input
                    v-model="form.max_id"
                    type="text"
                    placeholder="Введите МАКС ID"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            @click="closeModal"
            class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
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
            {{ isSubmitting ? "Сохранение..." : "Сохранить" }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
