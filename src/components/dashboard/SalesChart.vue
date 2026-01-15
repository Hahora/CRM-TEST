<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const chartData = ref({
  labels: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  datasets: [
    {
      label: "Продажи",
      data: [120000, 190000, 300000, 500000, 200000, 300000, 450000],
      borderColor: "#3B82F6",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      fill: true,
      tension: 0.4,
      pointBackgroundColor: "#3B82F6",
      pointBorderColor: "#ffffff",
      pointBorderWidth: 2,
      pointRadius: 6,
    },
  ],
});

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: "#1F2937",
      titleColor: "#F9FAFB",
      bodyColor: "#F9FAFB",
      borderColor: "#374151",
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: false,
      callbacks: {
        label: (context: any) => {
          return `${new Intl.NumberFormat("ru-RU", {
            style: "currency",
            currency: "RUB",
            minimumFractionDigits: 0,
          }).format(context.parsed.y)}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      border: {
        display: false,
      },
    },
    y: {
      grid: {
        color: "#F3F4F6",
      },
      border: {
        display: false,
      },
      ticks: {
        callback: (value: any) => {
          return new Intl.NumberFormat("ru-RU", {
            style: "currency",
            currency: "RUB",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value);
        },
      },
    },
  },
});
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Продажи за неделю</h3>
        <p class="text-sm text-gray-600">Динамика выручки по дням</p>
      </div>
      <div class="text-right">
        <div class="text-2xl font-bold text-gray-900">2.06М ₽</div>
        <div class="text-sm text-green-600">+12% к прошлой неделе</div>
      </div>
    </div>

    <div class="h-64 md:h-80">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
