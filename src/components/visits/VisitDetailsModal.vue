<script setup lang="ts">
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import AppIcon from "@/components/AppIcon.vue";
import type { Visit } from "@/types/visits";
import { VISIT_STATUSES, VISIT_SOURCES } from "@/types/visits";

interface Props {
  isOpen: boolean;
  visit: Visit | null;
  loading?: boolean; // Добавить проп loading
}

const props = defineProps<Props>(); // Убедитесь, что props определены

const emit = defineEmits<{
  close: [];
  edit: [visit: Visit];
}>();

const getStatusInfo = (status: string) => {
  const statusInfo = VISIT_STATUSES.find((s) => s.value === status);
  return statusInfo || { label: status, color: "bg-gray-100 text-gray-800" };
};

const getSourceLabel = (source: string) => {
  const sourceInfo = VISIT_SOURCES.find((s) => s.value === source);
  return sourceInfo?.label || source;
};

const formatCurrency = (amount: string | number) => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
};

// Функция для получения полного имени сотрудника
const getEmployeeFullName = (employee: any) => {
  const parts = [
    employee.first_name,
    employee.middle_name,
    employee.last_name,
  ].filter(Boolean);
  return parts.join(" ") || "Не указан";
};

const closeModal = () => {
  emit("close");
};

const handleEdit = () => {
  if (props.visit) {
    emit("edit", props.visit); // Используем props для передачи visit
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
                  Детали посещения
                </h2>
                <span
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    getStatusInfo(visit.status).color,
                  ]"
                >
                  {{ getStatusInfo(visit.status).label }}
                </span>
                <span
                  v-if="visit.fitting"
                  class="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800"
                >
                  Примерка
                </span>
              </div>
              <button
                @click="closeModal"
                class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <AppIcon name="x" :size="20" />
              </button>
            </div>

            <!-- Content -->
            <div class="p-6 space-y-6">
              <!-- Информация о клиенте -->
              <div class="bg-blue-50 rounded-lg p-4">
                <h3
                  class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"
                >
                  <AppIcon name="user" :size="18" class="text-blue-600" />
                  Информация о клиенте
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
                    <a
                      :href="`tel:${visit.client.phone}`"
                      class="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      {{ visit.client.phone }}
                    </a>
                  </div>
                  <div v-if="visit.client.email">
                    <label class="block text-sm font-medium text-gray-500 mb-1">
                      Email
                    </label>
                    <a
                      :href="`mailto:${visit.client.email}`"
                      class="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {{ visit.client.email }}
                    </a>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-500 mb-1">
                      Всего потрачено
                    </label>
                    <div class="text-sm text-gray-900 font-semibold">
                      {{ formatCurrency(visit.client.total_spent ?? 0) }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Информация о посещении -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h3
                  class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"
                >
                  <AppIcon name="calendar" :size="18" class="text-gray-600" />
                  Информация о посещении
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-500 mb-1">
                      Дата и время
                    </label>
                    <div class="text-sm text-gray-900 font-medium">
                      {{
                        format(
                          new Date(visit.visit_datetime),
                          "d MMMM yyyy, HH:mm",
                          {
                            locale: ru,
                          }
                        )
                      }}
                    </div>
                  </div>
                  <div v-if="visit.duration_minutes">
                    <label class="block text-sm font-medium text-gray-500 mb-1">
                      Длительность
                    </label>
                    <div class="text-sm text-gray-900">
                      {{ visit.duration_minutes }} минут
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-500 mb-1">
                      Откуда записался
                    </label>
                    <div class="text-sm text-gray-900">
                      {{ getSourceLabel(visit.source) }}
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-500 mb-1">
                      Примерка
                    </label>
                    <div class="text-sm text-gray-900">
                      {{ visit.fitting ? "Да" : "Нет" }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Назначение -->
              <div class="bg-green-50 rounded-lg p-4">
                <h3
                  class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"
                >
                  <AppIcon name="users" :size="18" class="text-green-600" />
                  Назначение
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-500 mb-1">
                      Консультант
                    </label>
                    <div class="text-sm text-gray-900 font-medium">
                      {{ getEmployeeFullName(visit.employee) }}
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-500 mb-1">
                      Филиал
                    </label>
                    <div class="text-sm text-gray-900">
                      {{ visit.branch.name }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Комментарии и пожелания -->
              <div v-if="visit.notes || visit.wishes" class="space-y-4">
                <div v-if="visit.notes" class="bg-yellow-50 rounded-lg p-4">
                  <h3
                    class="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2"
                  >
                    <AppIcon
                      name="message-square"
                      :size="18"
                      class="text-yellow-600"
                    />
                    Комментарий
                  </h3>
                  <div class="text-sm text-gray-900">{{ visit.notes }}</div>
                </div>

                <div v-if="visit.wishes" class="bg-pink-50 rounded-lg p-4">
                  <h3
                    class="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2"
                  >
                    <AppIcon name="heart" :size="18" class="text-pink-600" />
                    Пожелания
                  </h3>
                  <div class="text-sm text-gray-900">{{ visit.wishes }}</div>
                </div>
              </div>

              <!-- Информация о покупке -->
              <div
                v-if="visit.purchase_amount || visit.purchased_items"
                class="bg-emerald-50 rounded-lg p-4"
              >
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
                  <div v-if="visit.purchase_amount">
                    <label class="block text-sm font-medium text-gray-500 mb-1">
                      Сумма покупки
                    </label>
                    <div class="text-lg font-semibold text-emerald-600">
                      {{ formatCurrency(visit.purchase_amount) }}
                    </div>
                  </div>
                  <div v-if="visit.purchased_items">
                    <label class="block text-sm font-medium text-gray-500 mb-1">
                      Что купил
                    </label>
                    <div class="text-sm text-gray-900">
                      {{
                        typeof visit.purchased_items === "object"
                          ? visit.purchased_items.product_name
                          : visit.purchased_items
                      }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Обратная связь -->
              <div
                v-if="visit.feedback_rating || visit.feedback_comment"
                class="bg-indigo-50 rounded-lg p-4"
              >
                <h3
                  class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"
                >
                  <AppIcon name="star" :size="18" class="text-indigo-600" />
                  Обратная связь
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div v-if="visit.feedback_rating">
                    <label class="block text-sm font-medium text-gray-500 mb-1">
                      Оценка
                    </label>
                    <div class="flex items-center gap-1">
                      <AppIcon
                        v-for="i in 5"
                        :key="i"
                        name="star"
                        :size="16"
                        :class="[
                          i <= visit.feedback_rating
                            ? 'text-yellow-400'
                            : 'text-gray-300',
                        ]"
                      />
                      <span class="text-sm text-gray-600 ml-2 font-medium">
                        {{ visit.feedback_rating }}/5
                      </span>
                    </div>
                  </div>
                  <div v-if="visit.feedback_comment" class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-500 mb-1">
                      Комментарий
                    </label>
                    <div class="text-sm text-gray-900">
                      {{ visit.feedback_comment }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Метаданные -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h3
                  class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"
                >
                  <AppIcon name="info" :size="18" class="text-gray-600" />
                  Дополнительная информация
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-500 mb-1">
                      ID посещения
                    </label>
                    <div
                      class="text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded border"
                    >
                      {{ visit.id }}
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-500 mb-1">
                      Дата создания
                    </label>
                    <div class="text-sm text-gray-900">
                      {{
                        format(
                          new Date(visit.created_at),
                          "d MMMM yyyy, HH:mm",
                          {
                            locale: ru,
                          }
                        )
                      }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div
              class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl"
            >
              <button
                @click="closeModal"
                class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Закрыть
              </button>
              <button
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
