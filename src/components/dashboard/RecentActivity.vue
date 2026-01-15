<script setup lang="ts">
import { ref } from "vue";
import AppIcon from "@/components/AppIcon.vue";

interface Activity {
  id: string;
  type: "sale" | "visit" | "client" | "call";
  title: string;
  description: string;
  time: string;
  user: string;
  amount?: number;
}

const activities = ref<Activity[]>([
  {
    id: "1",
    type: "sale",
    title: "Новая продажа",
    description: 'Клиент "ООО Рога и копыта" - покупка оборудования',
    time: "2 минуты назад",
    user: "Иван Петров",
    amount: 125000,
  },
  {
    id: "2",
    type: "visit",
    title: "Посещение офиса",
    description: "Василий Сидоров посетил главный офис",
    time: "15 минут назад",
    user: "Анна Смирнова",
  },
  {
    id: "3",
    type: "client",
    title: "Новый клиент",
    description: 'Зарегистрирован клиент "ИП Козлов А.В."',
    time: "1 час назад",
    user: "Мария Иванова",
  },
  {
    id: "4",
    type: "call",
    title: "Звонок клиенту",
    description: 'Исходящий звонок клиенту "ООО Стройка+"',
    time: "2 часа назад",
    user: "Петр Николаев",
  },
  {
    id: "5",
    type: "sale",
    title: "Завершена сделка",
    description: 'Сделка с "ИП Морозов" успешно закрыта',
    time: "3 часа назад",
    user: "Елена Волкова",
    amount: 67500,
  },
]);

const getActivityIcon = (type: string) => {
  switch (type) {
    case "sale":
      return "trending-up";
    case "visit":
      return "map-pin";
    case "client":
      return "users";
    case "call":
      return "phone";
    default:
      return "bell";
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case "sale":
      return "text-green-600 bg-green-50";
    case "visit":
      return "text-orange-600 bg-orange-50";
    case "client":
      return "text-blue-600 bg-blue-50";
    case "call":
      return "text-purple-600 bg-purple-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">Последние активности</h3>
      <button class="text-sm text-blue-600 hover:text-blue-700 font-medium">
        Показать все
      </button>
    </div>

    <div class="space-y-4">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div
          :class="[
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            getActivityColor(activity.type),
          ]"
        >
          <AppIcon :name="getActivityIcon(activity.type)" :size="16" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <h4 class="text-sm font-medium text-gray-900">
              {{ activity.title }}
            </h4>
            <div
              v-if="activity.amount"
              class="text-sm font-semibold text-green-600"
            >
              +{{ activity.amount.toLocaleString("ru-RU") }} ₽
            </div>
          </div>
          <p class="text-sm text-gray-600 mb-1">{{ activity.description }}</p>
          <div class="flex items-center gap-2 text-xs text-gray-500">
            <span>{{ activity.user }}</span>
            <span>•</span>
            <span>{{ activity.time }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
