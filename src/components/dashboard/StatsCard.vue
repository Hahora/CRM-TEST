<script setup lang="ts">
import AppIcon from "@/components/AppIcon.vue";
import type { IconName } from "@/components/icons";

interface Props {
  title: string;
  value: number;
  format?: "number" | "currency" | "percent";
  icon: IconName;
  color: "blue" | "green" | "purple" | "orange" | "indigo" | "emerald";
  change?: number;
  changePeriod?: string;
}

const props = withDefaults(defineProps<Props>(), {
  format: "number",
});

const formatValue = (value: number, format: string) => {
  switch (format) {
    case "currency":
      return new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    case "percent":
      return `${value}%`;
    default:
      return value.toLocaleString("ru-RU");
  }
};

const colorClasses = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  purple: "bg-purple-50 text-purple-600",
  orange: "bg-orange-50 text-orange-600",
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
};
</script>

<template>
  <div
    class="bg-white rounded-xl border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-shadow"
  >
    <div class="flex items-center justify-between mb-4">
      <div
        :class="[
          'w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center',
          colorClasses[color],
        ]"
      >
        <AppIcon :name="icon" :size="20" class="md:w-6 md:h-6" />
      </div>
      <div v-if="change !== undefined" class="text-right">
        <div
          :class="[
            'text-xs md:text-sm font-medium',
            change >= 0 ? 'text-green-600' : 'text-red-600',
          ]"
        >
          {{ change >= 0 ? "+" : "" }}{{ change }}%
        </div>
        <div class="text-xs text-gray-500">{{ changePeriod }}</div>
      </div>
    </div>

    <div>
      <div class="text-xl md:text-2xl font-bold text-gray-900 mb-1">
        {{ formatValue(value, format) }}
      </div>
      <div class="text-xs md:text-sm text-gray-600">{{ title }}</div>
    </div>
  </div>
</template>
