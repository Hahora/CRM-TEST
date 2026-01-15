<script setup lang="ts">
import { computed } from "vue";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import AppIcon from "@/components/AppIcon.vue";
import type { Visit } from "@/types/visits";
import { VISIT_STATUSES } from "@/types/visits";

interface Props {
  visits: Visit[];
  loading?: boolean;
  currentPage?: number;
  perPage?: number;
  total?: number;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  currentPage: 1,
  perPage: 10,
  total: 0,
});

const emit = defineEmits<{
  "view-visit": [visit: Visit];
  "page-change": [page: number];
  "per-page-change": [perPage: number];
}>();

const getStatusInfo = (status: string) => {
  const statusInfo = VISIT_STATUSES.find((s) => s.value === status);
  return statusInfo || { label: status, color: "bg-gray-100 text-gray-800" };
};

const formatDate = (dateString: string) => {
  return format(new Date(dateString), "d MMM yyyy", { locale: ru });
};

const formatTime = (dateString: string) => {
  return format(new Date(dateString), "HH:mm", { locale: ru });
};

// Функция для форматирования валюты
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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

const totalPages = computed(() => Math.ceil(props.total / props.perPage));

const handlePageChange = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    emit("page-change", page);
  }
};

const handlePerPageChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit("per-page-change", parseInt(target.value));
};
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-900">Список посещений</h3>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Клиент
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Статус
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Дата и время
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Консультант
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Филиал
            </th>
            <th
              class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Потрачено
            </th>
            <th
              class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Действия
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="loading" class="animate-pulse">
            <td colspan="7" class="px-6 py-4 text-center text-gray-500">
              <div class="flex items-center justify-center gap-2">
                <AppIcon name="refresh-cw" :size="16" class="animate-spin" />
                Загрузка посещений...
              </div>
            </td>
          </tr>

          <tr v-else-if="visits.length === 0">
            <td colspan="7" class="px-6 py-8 text-center text-gray-500">
              <div class="flex flex-col items-center gap-2">
                <AppIcon name="map-pin" :size="24" class="text-gray-400" />
                <span>Посещения не найдены</span>
              </div>
            </td>
          </tr>

          <tr
            v-else
            v-for="visit in visits"
            :key="visit.id"
            class="hover:bg-gray-50 cursor-pointer transition-colors"
            @click="emit('view-visit', visit)"
          >
            <!-- Клиент -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"
                >
                  <AppIcon name="user" :size="14" />
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-900">
                    {{ visit.client.full_name }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ visit.client.phone }}
                  </div>
                </div>
              </div>
            </td>

            <!-- Статус -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <span
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    getStatusInfo(visit.status).color,
                  ]"
                >
                  {{ getStatusInfo(visit.status).label }}
                </span>
                <AppIcon
                  v-if="visit.fitting"
                  name="scissors"
                  :size="14"
                  class="text-purple-500"
                  title="Примерка"
                />
              </div>
            </td>

            <!-- Дата и время -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">
                {{ formatDate(visit.visit_datetime) }}
              </div>
              <div class="text-xs text-gray-500">
                {{ formatTime(visit.visit_datetime) }}
              </div>
            </td>

            <!-- Консультант -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">
                {{ getEmployeeFullName(visit.employee) }}
              </div>
            </td>

            <!-- Филиал -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">{{ visit.branch.name }}</div>
            </td>

            <!-- Потрачено -->
            <td class="px-6 py-4 whitespace-nowrap text-right">
              <div class="text-sm font-medium text-gray-900">
                {{ formatCurrency(visit.client.total_spent || 0) }}
              </div>
            </td>

            <!-- Действия -->
            <td class="px-6 py-4 whitespace-nowrap text-right">
              <button
                @click.stop="emit('view-visit', visit)"
                class="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Подробнее
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="visits.length > 0" class="px-6 py-4 border-t border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-700">Показать по:</span>
          <select
            :value="perPage"
            @change="handlePerPageChange"
            class="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-700">
            {{ (currentPage - 1) * perPage + 1 }}-{{
              Math.min(currentPage * perPage, total)
            }}
            из {{ total }}
          </span>

          <div class="flex items-center gap-1">
            <button
              @click="handlePageChange(currentPage - 1)"
              :disabled="currentPage <= 1"
              class="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AppIcon name="chevron-left" :size="16" />
            </button>

            <button
              @click="handlePageChange(currentPage + 1)"
              :disabled="currentPage >= totalPages"
              class="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AppIcon name="chevron-right" :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
