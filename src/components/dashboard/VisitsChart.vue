<script setup lang="ts">
import { computed } from "vue";
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
import type { WeeklyVisitsItem } from "@/services/dashboardApi";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const props = defineProps<{
  data: WeeklyVisitsItem[];
  loading?: boolean;
}>();

const weeklyTotal = computed(() => props.data.reduce((s, d) => s + d.total, 0));

const chartData = computed(() => ({
  labels: props.data.map((d) => d.day),
  datasets: [
    {
      label: "Записались",
      data: props.data.map((d) => d.total - d.arrived),
      backgroundColor: "#CBD5E1",
      borderRadius: 4,
      borderSkipped: false,
      stack: "visits",
    },
    {
      label: "Пришли",
      data: props.data.map((d) => d.arrived - d.bought),
      backgroundColor: "#60A5FA",
      borderRadius: 4,
      borderSkipped: false,
      stack: "visits",
    },
    {
      label: "Купили",
      data: props.data.map((d) => d.bought),
      backgroundColor: "#34D399",
      borderRadius: 4,
      borderSkipped: false,
      stack: "visits",
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: "bottom" as const,
      labels: { boxWidth: 10, boxHeight: 10, font: { size: 10 }, padding: 12 },
    },
    tooltip: {
      backgroundColor: "#1F2937",
      titleColor: "#F9FAFB",
      bodyColor: "#F9FAFB",
      borderColor: "#374151",
      borderWidth: 1,
      cornerRadius: 8,
    },
  },
  scales: {
    x: { grid: { display: false }, border: { display: false }, stacked: true },
    y: {
      grid: { color: "#F3F4F6" },
      border: { display: false },
      stacked: true,
      beginAtZero: true,
      ticks: { precision: 0 },
    },
  },
};
</script>

<template>
  <div class="chart-card">
    <div class="chart-header">
      <div>
        <h3 class="chart-title">Посещения за неделю</h3>
        <p class="chart-sub">Записались / пришли / купили</p>
      </div>
      <div v-if="!loading && data.length" class="chart-total">
        {{ weeklyTotal }}
        <span class="chart-total-lbl">визитов</span>
      </div>
    </div>

    <div v-if="loading" class="chart-sk">
      <div class="sk-chart-line" />
    </div>
    <div v-else-if="!data.length" class="chart-empty">Нет данных</div>
    <div v-else class="chart-wrap">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.chart-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; }
.chart-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; gap: 8px; }
.chart-title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 2px; }
.chart-sub { font-size: 11px; color: #64748b; margin: 0; }
.chart-total { font-size: 18px; font-weight: 800; color: #0f172a; font-family: "JetBrains Mono", monospace; text-align: right; }
.chart-total-lbl { font-size: 10px; font-weight: 500; color: #64748b; display: block; font-family: "Manrope", sans-serif; }
.chart-wrap { height: 220px; }
.chart-sk { height: 220px; display: flex; align-items: flex-end; gap: 6px; padding: 16px 0 0; }
.sk-chart-line { width: 100%; height: 100%; background: linear-gradient(180deg,#e2e8f0 0%,#f1f5f9 100%); border-radius: 6px; animation: sk-pulse 1.5s ease-in-out infinite; }
.chart-empty { height: 220px; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #94a3b8; }
@keyframes sk-pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
</style>
