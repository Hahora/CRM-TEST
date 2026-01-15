<script setup lang="ts">
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import AppIcon from "@/components/AppIcon.vue";

interface Sale {
  id: string;
  clientName: string;
  clientType: "individual" | "company";
  amount: number;
  status: "pending" | "completed" | "cancelled";
  products: string[];
  manager: string;
  branch: string;
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

interface Props {
  sales: Sale[];
  loading?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  "view-sale": [sale: Sale];
}>();

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-orange-100 text-orange-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "completed":
      return "Завершено";
    case "pending":
      return "В процессе";
    case "cancelled":
      return "Отменено";
    default:
      return "Неизвестно";
  }
};

const getClientTypeIcon = (type: string) => {
  return type === "company" ? "package" : "users";
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
  }).format(amount);
};
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-900">Список продаж</h3>
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
              Сумма
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Статус
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Менеджер
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Филиал
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Дата
            </th>
            <th
              class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Действия
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="loading" v-for="n in 5" :key="n" class="animate-pulse">
            <td class="px-6 py-4">
              <div class="h-4 bg-gray-200 rounded w-32"></div>
            </td>
            <td class="px-6 py-4">
              <div class="h-4 bg-gray-200 rounded w-20"></div>
            </td>
            <td class="px-6 py-4">
              <div class="h-6 bg-gray-200 rounded w-16"></div>
            </td>
            <td class="px-6 py-4">
              <div class="h-4 bg-gray-200 rounded w-24"></div>
            </td>
            <td class="px-6 py-4">
              <div class="h-4 bg-gray-200 rounded w-20"></div>
            </td>
            <td class="px-6 py-4">
              <div class="h-4 bg-gray-200 rounded w-16"></div>
            </td>
            <td class="px-6 py-4">
              <div class="h-8 bg-gray-200 rounded w-16 ml-auto"></div>
            </td>
          </tr>

          <tr
            v-else
            v-for="sale in sales"
            :key="sale.id"
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <AppIcon
                    :name="getClientTypeIcon(sale.clientType)"
                    :size="16"
                    class="text-gray-600"
                  />
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-900">
                    {{ sale.clientName }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ sale.products.join(", ") }}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm font-semibold text-gray-900">
                {{ formatCurrency(sale.amount) }}
              </div>
            </td>
            <td class="px-6 py-4">
              <span
                :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  getStatusColor(sale.status),
                ]"
              >
                {{ getStatusText(sale.status) }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm text-gray-900">{{ sale.manager }}</div>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm text-gray-900">{{ sale.branch }}</div>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm text-gray-900">
                {{ format(new Date(sale.createdAt), "d MMM", { locale: ru }) }}
              </div>
              <div class="text-xs text-gray-500">
                {{ format(new Date(sale.createdAt), "HH:mm") }}
              </div>
            </td>
            <td class="px-6 py-4 text-right">
              <button
                @click="emit('view-sale', sale)"
                class="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Подробнее
              </button>
            </td>
          </tr>

          <tr v-if="!loading && sales.length === 0">
            <td colspan="7" class="px-6 py-12 text-center">
              <div class="text-gray-500">
                <AppIcon
                  name="trending-up"
                  :size="48"
                  class="mx-auto mb-4 text-gray-300"
                />
                <p class="text-lg font-medium">Продажи не найдены</p>
                <p class="text-sm">Попробуйте изменить фильтры поиска</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
