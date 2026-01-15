<script setup lang="ts">
import { watch, onUnmounted } from "vue";
import AppIcon from "@/components/AppIcon.vue";
import type { Client } from "@/types/clients";

interface Props {
  isOpen: boolean;
  client: Client | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  close: [];
  edit: [client: Client];
}>();

// Блокировка скролла при открытом модальном окне
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
  emit("close");
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const handleEdit = () => {
  if (props.client) {
    emit("edit", props.client);
  }
};

const getGenderText = (gender: string) => {
  switch (gender) {
    case "male":
      return "Мужской";
    case "female":
      return "Женский";
    default:
      return "Не указан";
  }
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
            class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <AppIcon name="user" :size="20" class="text-gray-600" />
                  <h2 class="text-xl font-semibold text-gray-900">
                    Информация о клиенте
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
            <div class="overflow-y-auto max-h-[calc(90vh-140px)]">
              <!-- Loading State -->
              <div v-if="loading" class="p-6 text-center">
                <AppIcon
                  name="refresh-cw"
                  :size="24"
                  class="animate-spin text-blue-600 mx-auto mb-2"
                />
                <p class="text-gray-600">Загрузка данных...</p>
              </div>

              <!-- Client Data -->
              <div v-else-if="client" class="p-6 space-y-6">
                <!-- Контактная информация -->
                <div>
                  <div class="flex items-center gap-2 mb-4">
                    <AppIcon name="phone" :size="18" class="text-gray-600" />
                    <h3 class="text-lg font-medium text-gray-900">
                      Контактная информация
                    </h3>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex items-center gap-3">
                      <AppIcon name="user" :size="16" class="text-gray-400" />
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                        >
                          ФИО
                        </label>
                        <div class="text-sm text-gray-900">
                          {{ client.full_name }}
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-3">
                      <AppIcon name="phone" :size="16" class="text-gray-400" />
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Телефон
                        </label>
                        <a
                          :href="`tel:${client.phone}`"
                          class="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          {{ client.phone }}
                        </a>
                      </div>
                    </div>

                    <div class="flex items-center gap-3">
                      <AppIcon name="mail" :size="16" class="text-gray-400" />
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Email
                        </label>
                        <div class="text-sm">
                          <a
                            v-if="client.email"
                            :href="`mailto:${client.email}`"
                            class="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            {{ client.email }}
                          </a>
                          <span v-else class="text-gray-900">Не указан</span>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-3">
                      <AppIcon name="send" :size="16" class="text-gray-400" />
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Telegram ID
                        </label>
                        <div class="text-sm text-gray-900">
                          {{ client.telegram_id || "Не указан" }}
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-3">
                      <AppIcon
                        name="message-circle"
                        :size="16"
                        class="text-gray-400"
                      />
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                        >
                          МАКС ID
                        </label>
                        <div class="text-sm text-gray-900">
                          {{ client.max_id || "Не указан" }}
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-3">
                      <AppIcon name="info" :size="16" class="text-gray-400" />
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                        >
                          ID клиента
                        </label>
                        <div class="text-sm text-gray-900">{{ client.id }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Личная информация -->
                <div class="border-t border-gray-200 pt-6">
                  <div class="flex items-center gap-2 mb-4">
                    <AppIcon name="user" :size="18" class="text-gray-600" />
                    <h3 class="text-lg font-medium text-gray-900">
                      Личная информация
                    </h3>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex items-center gap-3">
                      <AppIcon name="user" :size="16" class="text-gray-400" />
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Пол
                        </label>
                        <div class="text-sm text-gray-900">
                          {{ getGenderText(client.gender || "") }}
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-3">
                      <AppIcon
                        name="calendar"
                        :size="16"
                        class="text-gray-400"
                      />
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Дата рождения
                        </label>
                        <div class="text-sm text-gray-900">
                          {{
                            client.birth_date
                              ? formatDate(client.birth_date)
                              : "Не указана"
                          }}
                        </div>
                      </div>
                    </div>

                    <div
                      v-if="client.referred_by_id"
                      class="flex items-center gap-3"
                    >
                      <AppIcon
                        name="user-plus"
                        :size="16"
                        class="text-gray-400"
                      />
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Рекомендован клиентом
                        </label>
                        <div class="text-sm text-gray-900">
                          ID: {{ client.referred_by_id }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Статистика покупок -->
                <div
                  v-if="client.total_purchases !== undefined"
                  class="border-t border-gray-200 pt-6"
                >
                  <div class="flex items-center gap-2 mb-4">
                    <AppIcon
                      name="trending-up"
                      :size="18"
                      class="text-gray-600"
                    />
                    <h3 class="text-lg font-medium text-gray-900">
                      Статистика покупок
                    </h3>
                  </div>

                  <!-- Основные показатели -->
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div class="flex items-center gap-3">
                      <AppIcon
                        name="shopping-cart"
                        :size="16"
                        class="text-gray-400"
                      />
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Покупок
                        </label>
                        <div class="text-2xl font-bold text-gray-900">
                          {{ client.total_purchases || 0 }}
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-3">
                      <AppIcon
                        name="trending-up"
                        :size="16"
                        class="text-gray-400"
                      />
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Потрачено
                        </label>
                        <div
                          class="text-xl md:text-2xl font-bold text-gray-900"
                        >
                          {{ formatCurrency(client.total_spent || 0) }}
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-3">
                      <AppIcon
                        name="map-pin"
                        :size="16"
                        class="text-gray-400"
                      />
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Визитов
                        </label>
                        <div class="text-2xl font-bold text-gray-900">
                          {{ client.visit_count || 0 }}
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-3">
                      <AppIcon
                        name="user-plus"
                        :size="16"
                        class="text-gray-400"
                      />
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Лидов
                        </label>
                        <div class="text-2xl font-bold text-gray-900">
                          {{ client.leads_count || 0 }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Последняя активность -->
                  <div
                    v-if="client.last_purchase_date || client.last_visit_date"
                  >
                    <div class="flex items-center gap-2 mb-3">
                      <AppIcon name="clock" :size="16" class="text-gray-600" />
                      <h4 class="text-base font-medium text-gray-900">
                        Последняя активность
                      </h4>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        v-if="client.last_purchase_date"
                        class="flex items-center gap-3"
                      >
                        <AppIcon
                          name="shopping-cart"
                          :size="16"
                          class="text-gray-400"
                        />
                        <div>
                          <label
                            class="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Последняя покупка
                          </label>
                          <div class="text-sm text-gray-900">
                            {{ formatDateTime(client.last_purchase_date) }}
                          </div>
                        </div>
                      </div>

                      <div
                        v-if="client.last_visit_date"
                        class="flex items-center gap-3"
                      >
                        <AppIcon
                          name="clock"
                          :size="16"
                          class="text-gray-400"
                        />
                        <div>
                          <label
                            class="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Последний визит
                          </label>
                          <div class="text-sm text-gray-900">
                            {{ formatDateTime(client.last_visit_date) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Системная информация -->
                <div class="border-t border-gray-200 pt-6">
                  <div class="flex items-center gap-2 mb-4">
                    <AppIcon name="settings" :size="18" class="text-gray-600" />
                    <h3 class="text-lg font-medium text-gray-900">
                      Системная информация
                    </h3>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex items-center gap-3">
                      <AppIcon
                        name="calendar"
                        :size="16"
                        class="text-gray-400"
                      />
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Дата создания
                        </label>
                        <div class="text-sm text-gray-900">
                          {{ formatDateTime(client.created_at) }}
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-3">
                      <AppIcon name="edit" :size="16" class="text-gray-400" />
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Последнее обновление
                        </label>
                        <div class="text-sm text-gray-900">
                          {{ formatDateTime(client.updated_at) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-else class="p-6 text-center">
                <AppIcon
                  name="user"
                  :size="48"
                  class="text-gray-300 mx-auto mb-4"
                />
                <p class="text-gray-500">Данные клиента не найдены</p>
              </div>
            </div>

            <!-- Footer -->
            <div
              class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3"
            >
              <button
                @click="closeModal"
                class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Закрыть
              </button>
              <button
                v-if="client"
                @click="handleEdit"
                class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <AppIcon name="edit" :size="16" />
                Редактировать
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
