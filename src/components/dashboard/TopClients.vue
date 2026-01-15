<script setup lang="ts">
import { ref } from "vue";

interface Client {
  id: string;
  name: string;
  totalPurchases: number;
  lastVisit: string;
  status: "active" | "inactive" | "vip";
}

const clients = ref<Client[]>([
  {
    id: "1",
    name: 'ООО "Рога и копыта"',
    totalPurchases: 1250000,
    lastVisit: "Сегодня",
    status: "vip",
  },
  {
    id: "2",
    name: "ИП Морозов А.В.",
    totalPurchases: 890000,
    lastVisit: "2 дня назад",
    status: "active",
  },
  {
    id: "3",
    name: 'ООО "Стройка+"',
    totalPurchases: 675000,
    lastVisit: "1 неделю назад",
    status: "active",
  },
  {
    id: "4",
    name: "ИП Козлов А.В.",
    totalPurchases: 450000,
    lastVisit: "3 дня назад",
    status: "inactive",
  },
]);

const getStatusColor = (status: string) => {
  switch (status) {
    case "vip":
      return "bg-purple-100 text-purple-800";
    case "active":
      return "bg-green-100 text-green-800";
    case "inactive":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "vip":
      return "VIP";
    case "active":
      return "Активный";
    case "inactive":
      return "Неактивный";
    default:
      return "Неизвестно";
  }
};
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">Топ клиенты</h3>
      <button class="text-sm text-blue-600 hover:text-blue-700 font-medium">
        Все клиенты
      </button>
    </div>

    <div class="space-y-4">
      <div
        v-for="(client, index) in clients"
        :key="client.id"
        class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div
          class="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold"
        >
          {{ index + 1 }}
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <h4 class="text-sm font-medium text-gray-900 truncate">
              {{ client.name }}
            </h4>
            <span
              :class="[
                'px-2 py-1 text-xs font-medium rounded-full',
                getStatusColor(client.status),
              ]"
            >
              {{ getStatusText(client.status) }}
            </span>
          </div>
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span>{{ client.totalPurchases.toLocaleString("ru-RU") }} ₽</span>
            <span>{{ client.lastVisit }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
