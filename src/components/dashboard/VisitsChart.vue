<script setup lang="ts">
import { ref } from "vue";
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const chartData = ref({
  labels: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  datasets: [
    {
      label: "Посещения",
      data: [45, 67, 89, 123, 156, 134, 98],
      backgroundColor: "#F59E0B",
      borderRadius: 6,
      borderSkipped: false,
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
      beginAtZero: true,
    },
  },
});
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Посещения за неделю</h3>
        <p class="text-sm text-gray-600">Количество визитов клиентов</p>
      </div>
      <div class="text-right">
        <div class="text-2xl font-bold text-gray-900">712</div>
        <div class="text-sm text-red-600">-3% к прошлой неделе</div>
      </div>
    </div>

    <div class="h-64 md:h-80">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
