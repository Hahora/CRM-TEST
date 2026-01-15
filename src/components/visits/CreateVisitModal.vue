<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from "vue";
import AppIcon from "@/components/AppIcon.vue";
import { clientsApi } from "@/services/clientsApi";
import type { CreateVisitData } from "@/types/visits";
import type { Client } from "@/types/clients";
import { VISIT_STATUSES, VISIT_SOURCES } from "@/types/visits";

interface Props {
  isOpen: boolean;
  isSubmitting?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSubmitting: false,
});

const emit = defineEmits<{
  close: [];
  create: [visitData: CreateVisitData];
}>();

// Блокировка скролла при открытом модальном окне
const lockScroll = () => {
  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.top = `-${window.scrollY}px`;
  document.body.style.width = "100%";
};

const unlockScroll = () => {
  const scrollY = document.body.style.top;
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  if (scrollY) {
    window.scrollTo(0, parseInt(scrollY || "0") * -1);
  }
};

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      lockScroll();
    } else {
      unlockScroll();
    }
  }
);

onUnmounted(() => {
  unlockScroll();
});

const form = ref<CreateVisitData>({
  client_id: "0", // Измените с 0 на "0"
  employee_id: "0", // Измените с 0 на "0"
  branch_id: "0",
  visit_datetime: "",
  purpose: "",
  status: "zapla nirovano",
  source: "telegram",
  fitting: false,
  notes: "",
  wishes: "",
});

// Поиск клиентов через API
const clientSearch = ref("");
const isSearchingClients = ref(false);
const showClientDropdown = ref(false);
const selectedClient = ref<Client | null>(null);
const searchResults = ref<Client[]>([]);
const searchTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

// Поиск клиентов с дебаунсом
const searchClients = async (query: string) => {
  if (!query.trim()) {
    searchResults.value = [];
    showClientDropdown.value = false;
    return;
  }

  try {
    isSearchingClients.value = true;

    // Поиск через API
    const response = await clientsApi.getClients({
      search: query,
      limit: 10, // Ограничиваем количество результатов
    });

    searchResults.value = response.clients || [];
    showClientDropdown.value = true;
  } catch (error) {
    console.error("Error searching clients:", error);
    searchResults.value = [];
    showClientDropdown.value = false;
  } finally {
    isSearchingClients.value = false;
  }
};

const isFormValid = computed(() => {
  return (
    form.value.client_id &&
    form.value.visit_datetime &&
    form.value.status &&
    form.value.source
  );
});

// Обработчики клиентов
const selectClient = (client: Client) => {
  selectedClient.value = client;
  form.value.client_id = client.id.toString();
  clientSearch.value = client.full_name;
  showClientDropdown.value = false;
  searchResults.value = [];
};

const clearClientSelection = () => {
  selectedClient.value = null;
  form.value.client_id = "0";
  clientSearch.value = "";
  showClientDropdown.value = false;
  searchResults.value = [];
};

const handleClientSearch = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const query = target.value;

  clientSearch.value = query;

  if (!query.trim()) {
    clearClientSelection();
    return;
  }

  // Очищаем предыдущий таймаут
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  // Устанавливаем новый таймаут для дебаунса
  searchTimeout.value = setTimeout(() => {
    searchClients(query);
  }, 300); // 300ms задержка
};

const handleSubmit = () => {
  if (!isFormValid.value) return;

  const submitData = {
    ...form.value,
    purpose: "Консультация",
  };

  emit("create", submitData);
};

const closeModal = () => {
  // Очищаем таймаут при закрытии
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  // Сброс формы при закрытии
  form.value = {
    client_id: "0",
    employee_id: "0",
    branch_id: "0",
    visit_datetime: "",
    purpose: "",
    status: "zapla nirovano",
    source: "telegram",
    fitting: false,
    notes: "",
    wishes: "",
  };
  clearClientSelection();
  emit("close");
};

// Закрытие dropdown при клике вне его
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target.closest(".client-search-container")) {
    showClientDropdown.value = false;
  }
};

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }
  }
);

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
});

// Предотвращение скролла при touch событиях на мобильных
const preventScroll = (e: TouchEvent) => {
  e.preventDefault();
};

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      document.addEventListener("touchmove", preventScroll, { passive: false });
    } else {
      document.removeEventListener("touchmove", preventScroll);
    }
  }
);

onUnmounted(() => {
  document.removeEventListener("touchmove", preventScroll);
});

// Форматирование телефона для отображения
const formatPhone = (phone: string) => {
  if (phone.startsWith("tg_")) {
    return phone.replace("tg_", "+");
  }
  return phone;
};

// Получение инициалов клиента
const getClientInitials = (fullName: string) => {
  return fullName
    .split(" ")
    .map((name) => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
        class="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center p-2 z-50 overflow-y-auto"
        @click="closeModal"
        @wheel.prevent
        @touchmove.prevent
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
            class="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4 flex flex-col"
            style="max-height: calc(100vh - 2rem); min-height: 50vh"
            @click.stop
            @wheel.stop
            @touchmove.stop
          >
            <!-- Header - фиксированный -->
            <div class="px-4 py-4 border-b border-gray-200 flex-shrink-0">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <AppIcon name="map-pin" :size="20" class="text-gray-600" />
                  <h2 class="text-lg font-semibold text-gray-900">
                    Новое посещение
                  </h2>
                </div>
                <button
                  @click="closeModal"
                  class="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <AppIcon name="x" :size="20" />
                </button>
              </div>
            </div>

            <!-- Form - скроллируемый контент -->
            <div class="flex-1 overflow-y-auto">
              <form @submit.prevent="handleSubmit">
                <div class="p-4 space-y-6">
                  <!-- Поиск клиента -->
                  <div class="client-search-container">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Клиент *
                    </label>

                    <!-- Выбранный клиент -->
                    <div v-if="selectedClient" class="mb-3">
                      <div
                        class="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div
                          class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"
                        >
                          <span class="text-sm font-medium">{{
                            getClientInitials(selectedClient.full_name)
                          }}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="text-sm font-medium text-gray-900">
                            {{ selectedClient.full_name }}
                          </div>
                          <div class="text-xs text-gray-600">
                            {{ formatPhone(selectedClient.phone) }}
                          </div>
                          <div
                            v-if="selectedClient.telegram_id"
                            class="text-xs text-blue-600"
                          >
                            {{ selectedClient.telegram_id }}
                          </div>
                        </div>
                        <button
                          type="button"
                          @click="clearClientSelection"
                          class="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <AppIcon name="x" :size="16" />
                        </button>
                      </div>
                    </div>

                    <!-- Поиск -->
                    <div v-if="!selectedClient" class="relative">
                      <div class="relative">
                        <AppIcon
                          name="search"
                          :size="16"
                          class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        />
                        <input
                          :value="clientSearch"
                          @input="handleClientSearch"
                          type="text"
                          placeholder="Поиск по ФИО, телефону, email, Telegram, МАКС ID..."
                          class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          required
                        />
                        <!-- Индикатор загрузки -->
                        <div
                          v-if="isSearchingClients"
                          class="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          <AppIcon
                            name="refresh-cw"
                            :size="16"
                            class="animate-spin text-gray-400"
                          />
                        </div>
                      </div>

                      <!-- Dropdown с результатами -->
                      <div
                        v-if="showClientDropdown && searchResults.length > 0"
                        class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      >
                        <div
                          v-for="client in searchResults"
                          :key="client.id"
                          @click="selectClient(client)"
                          class="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div
                            class="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"
                          >
                            <span class="text-xs font-medium">{{
                              getClientInitials(client.full_name)
                            }}</span>
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="text-sm font-medium text-gray-900">
                              {{ client.full_name }}
                            </div>
                            <div class="text-xs text-gray-600">
                              {{ formatPhone(client.phone) }}
                            </div>
                            <div class="flex items-center gap-2 mt-1">
                              <span
                                v-if="client.telegram_id"
                                class="text-xs text-blue-600"
                              >
                                {{ client.telegram_id }}
                              </span>
                              <span
                                v-if="client.max_id"
                                class="text-xs text-purple-600"
                              >
                                {{ client.max_id }}
                              </span>
                              <span
                                v-if="client.email"
                                class="text-xs text-gray-500"
                              >
                                {{ client.email }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Нет результатов -->
                      <div
                        v-if="
                          showClientDropdown &&
                          clientSearch &&
                          searchResults.length === 0 &&
                          !isSearchingClients
                        "
                        class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center"
                      >
                        <div class="text-sm text-gray-500 mb-2">
                          Клиент не найден
                        </div>
                        <button
                          type="button"
                          class="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          + Создать нового клиента
                        </button>
                      </div>

                      <!-- Состояние поиска -->
                      <div
                        v-if="showClientDropdown && isSearchingClients"
                        class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center"
                      >
                        <div
                          class="flex items-center justify-center gap-2 text-sm text-gray-500"
                        >
                          <AppIcon
                            name="refresh-cw"
                            :size="16"
                            class="animate-spin"
                          />
                          Поиск клиентов...
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Дата и время -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Дата и время *
                    </label>
                    <input
                      v-model="form.visit_datetime"
                      type="datetime-local"
                      required
                      class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>

                  <!-- Статус и источник -->
                  <div class="space-y-4">
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Статус
                      </label>
                      <select
                        v-model="form.status"
                        class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option
                          v-for="status in VISIT_STATUSES"
                          :key="status.value"
                          :value="status.value"
                        >
                          {{ status.label }}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Откуда записался
                      </label>
                      <select
                        v-model="form.source"
                        class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option
                          v-for="source in VISIT_SOURCES"
                          :key="source.value"
                          :value="source.value"
                        >
                          {{ source.label }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <!-- Примерка -->
                  <div>
                    <div
                      class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <input
                        v-model="form.fitting"
                        type="checkbox"
                        id="fitting"
                        class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label
                        for="fitting"
                        class="text-sm font-medium text-gray-700 flex items-center gap-2"
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

                  <!-- Комментарий -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Комментарий
                    </label>
                    <textarea
                      v-model="form.notes"
                      rows="3"
                      placeholder="Дополнительная информация о посещении..."
                      class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
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
                      class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                    ></textarea>
                  </div>

                  <!-- Отступ для кнопок на мобильных -->
                  <div class="h-20 md:h-0"></div>
                </div>
              </form>
            </div>

            <!-- Footer - фиксированный внизу -->
            <div
              class="px-4 py-4 border-t border-gray-200 bg-white flex-shrink-0"
            >
              <div class="flex flex-col gap-3">
                <button
                  @click="handleSubmit"
                  :disabled="!isFormValid || isSubmitting"
                  class="w-full px-4 py-3 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <AppIcon
                    v-if="isSubmitting"
                    name="refresh-cw"
                    :size="16"
                    class="animate-spin"
                  />
                  {{ isSubmitting ? "Создание..." : "Создать посещение" }}
                </button>
                <button
                  type="button"
                  @click="closeModal"
                  class="w-full px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Кастомные стили для dropdown */
.client-search-container {
  position: relative;
}

/* Анимации для transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Скрытие скроллбара для webkit браузеров в dropdown */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Обеспечиваем что модальное окно не выходит за границы экрана */
@media (max-height: 600px) {
  .max-h-\[95vh\] {
    max-height: 100vh;
  }
}
</style>
