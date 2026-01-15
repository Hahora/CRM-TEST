<script setup lang="ts">
import { useRouter } from "vue-router";
import AppIcon from "@/components/AppIcon.vue";

const router = useRouter();

const actions = [
  {
    id: "add-client",
    title: "Добавить клиента",
    icon: "users",
    color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    route: "/clients",
  },
  {
    id: "new-sale",
    title: "Новая продажа",
    icon: "trending-up",
    color: "bg-green-50 text-green-600 hover:bg-green-100",
    route: "/sales",
  },
  {
    id: "record-visit",
    title: "Записать визит",
    icon: "map-pin",
    color: "bg-orange-50 text-orange-600 hover:bg-orange-100",
    route: "/visits",
  },
  {
    id: "send-message",
    title: "Отправить сообщение",
    icon: "send",
    color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    route: "/telegram",
  },
] as const;

const handleAction = (route: string) => {
  router.push(route);
};
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-6">Быстрые действия</h3>

    <div class="grid grid-cols-2 gap-3">
      <button
        v-for="action in actions"
        :key="action.id"
        @click="handleAction(action.route)"
        :class="['p-4 rounded-lg transition-colors text-left', action.color]"
      >
        <div class="flex flex-col items-center text-center gap-2">
          <AppIcon :name="action.icon" :size="20" />
          <span class="text-xs font-medium">{{ action.title }}</span>
        </div>
      </button>
    </div>
  </div>
</template>
