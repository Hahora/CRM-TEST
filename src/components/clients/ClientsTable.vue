<script setup lang="ts">
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import AppIcon from "@/components/AppIcon.vue";
import Pagination from "@/components/Pagination.vue";
import type { Client } from "@/types/clients";
import { computed } from "vue";

interface Props {
  clients: Client[];
  loading?: boolean;
  currentPage?: number;
  perPage?: number;
  total?: number;
}

const props = withDefaults(defineProps<Props>(), {
  currentPage: 1,
  perPage: 10,
  total: 0,
});

const emit = defineEmits<{
  "view-client": [client: Client];
  "page-change": [page: number];
  "per-page-change": [perPage: number];
}>();

// Убираем paginatedClients - пагинация должна происходить на сервере
// const paginatedClients = computed(() => {
//   const start = (props.currentPage - 1) * props.perPage;
//   const end = start + props.perPage;
//   return props.clients.slice(start, end);
// });

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Парсим full_name на части
const parseFullName = (fullName: string) => {
  const parts = fullName.trim().split(" ");
  return {
    lastName: parts[0] || "",
    firstName: parts[1] || "",
    middleName: parts[2] || "",
  };
};

const getInitials = (client: Client) => {
  const { firstName, lastName } = parseFullName(client.full_name);
  return `${firstName.charAt(0)}${lastName.charAt(0)}`;
};

// Форматируем телефон
const formatPhone = (phone: string) => {
  if (phone.startsWith("tg_")) {
    return phone.replace("tg_", "+");
  }
  return phone;
};
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div class="px-4 md:px-6 py-4 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-900">Список клиентов</h3>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="p-6 text-center">
      <div class="flex items-center justify-center gap-2 text-gray-500">
        <AppIcon name="refresh-cw" :size="20" class="animate-spin" />
        <span>Загрузка клиентов...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="clients.length === 0" class="p-8 text-center text-gray-500">
      <AppIcon name="users" :size="48" class="mx-auto mb-4 text-gray-300" />
      <p class="text-lg font-medium mb-2">Клиенты не найдены</p>
      <p class="text-sm">Попробуйте изменить фильтры поиска</p>
    </div>

    <template v-else>
      <!-- Desktop Table -->
      <div class="hidden md:block overflow-x-auto">
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
                Контакты
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Потрачено
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Регистрация
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Действия
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="client in clients"
              :key="client.id"
              class="hover:bg-gray-50 cursor-pointer transition-colors"
              @click="emit('view-client', client)"
            >
              <!-- Клиент -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"
                  >
                    <span class="text-sm font-medium">{{
                      getInitials(client)
                    }}</span>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      {{ client.full_name }}
                    </div>
                    <div class="text-xs text-gray-500">ID: {{ client.id }}</div>
                  </div>
                </div>
              </td>

              <!-- Контакты -->
              <td class="px-6 py-4">
                <div class="space-y-1">
                  <div class="text-sm text-gray-900 flex items-center gap-1">
                    <AppIcon name="phone" :size="12" class="text-gray-400" />
                    {{ formatPhone(client.phone) }}
                  </div>
                  <div
                    v-if="client.email"
                    class="text-xs text-gray-600 flex items-center gap-1"
                  >
                    <AppIcon name="mail" :size="12" class="text-gray-400" />
                    {{ client.email }}
                  </div>
                  <div
                    v-if="client.telegram_id"
                    class="text-xs text-blue-600 flex items-center gap-1"
                  >
                    <AppIcon name="send" :size="12" class="text-blue-500" />
                    Telegram: {{ client.telegram_id }}
                  </div>
                  <div
                    v-if="client.max_id"
                    class="text-xs text-purple-600 flex items-center gap-1"
                  >
                    <AppIcon
                      name="message-circle"
                      :size="12"
                      class="text-purple-500"
                    />
                    МАКС: {{ client.max_id }}
                  </div>
                </div>
              </td>

              <!-- Потрачено -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {{ formatCurrency(client.total_spent ?? 0) }}
                </div>
              </td>

              <!-- Регистрация -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{
                    format(new Date(client.created_at), "d MMM yyyy", {
                      locale: ru,
                    })
                  }}
                </div>
                <div class="text-xs text-gray-500">
                  {{
                    format(new Date(client.created_at), "HH:mm", { locale: ru })
                  }}
                </div>
              </td>

              <!-- Действия -->
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <button
                  @click.stop="emit('view-client', client)"
                  class="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Подробнее
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="md:hidden divide-y divide-gray-200">
        <div
          v-for="client in clients"
          :key="client.id"
          class="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
          @click="emit('view-client', client)"
        >
          <!-- Header -->
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"
              >
                <span class="text-sm font-medium">{{
                  getInitials(client)
                }}</span>
              </div>
              <div>
                <div class="text-base font-medium text-gray-900">
                  {{ client.full_name }}
                </div>
                <div class="text-xs text-gray-500">ID: {{ client.id }}</div>
              </div>
            </div>
            <AppIcon name="chevron-right" :size="16" class="text-gray-400" />
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div class="bg-green-50 rounded-lg p-3">
              <div class="text-xs text-green-600 font-medium mb-1">
                Потрачено
              </div>
              <div class="text-sm font-bold text-green-700">
                {{ formatCurrency(client.total_spent ?? 0) }}
              </div>
            </div>
            <div class="bg-blue-50 rounded-lg p-3">
              <div class="text-xs text-blue-600 font-medium mb-1">
                Регистрация
              </div>
              <div class="text-sm font-bold text-blue-700">
                {{
                  format(new Date(client.created_at), "d MMM yyyy", {
                    locale: ru,
                  })
                }}
              </div>
              <div class="text-xs text-blue-600">
                {{
                  format(new Date(client.created_at), "HH:mm", { locale: ru })
                }}
              </div>
            </div>
          </div>

          <!-- Contacts -->
          <div class="space-y-2">
            <div class="text-xs font-medium text-gray-700 mb-2">Контакты:</div>
            <div class="space-y-1">
              <div class="flex items-center gap-1 text-sm text-gray-700">
                <AppIcon name="phone" :size="12" class="text-gray-500" />
                {{ formatPhone(client.phone) }}
              </div>
              <div
                v-if="client.email"
                class="flex items-center gap-1 text-sm text-gray-700"
              >
                <AppIcon name="mail" :size="12" class="text-gray-500" />
                {{ client.email }}
              </div>
              <div
                v-if="client.telegram_id"
                class="flex items-center gap-1 text-sm text-blue-600"
              >
                <AppIcon name="send" :size="12" class="text-blue-500" />
                Telegram: {{ client.telegram_id }}
              </div>
              <div
                v-if="client.max_id"
                class="flex items-center gap-1 text-sm text-purple-600"
              >
                <AppIcon
                  name="message-circle"
                  :size="12"
                  class="text-purple-500"
                />
                МАКС: {{ client.max_id }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <Pagination
        :total="total"
        :current-page="currentPage"
        :per-page="perPage"
        @page-change="emit('page-change', $event)"
        @per-page-change="emit('per-page-change', $event)"
      />
    </template>
  </div>
</template>
