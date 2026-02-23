<script setup lang="ts">
import { computed } from "vue";
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
import type { WeeklySalesItem } from "@/services/dashboardApi";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const props = defineProps<{
  data: WeeklySalesItem[];
  loading?: boolean;
}>();

const fmt = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", minimumFractionDigits: 0 });

const weeklyTotal = computed(() => props.data.reduce((s, d) => s + d.amount, 0));

const chartData = computed(() => ({
  labels: props.data.map((d) => d.day),
  datasets: [
    {
      label: "Продажи",
      data: props.data.map((d) => d.amount),
      borderColor: "#3B82F6",
      backgroundColor: "rgba(59,130,246,0.08)",
      fill: true,
      tension: 0.4,
      pointBackgroundColor: "#3B82F6",
      pointBorderColor: "#ffffff",
      pointBorderWidth: 2,
      pointRadius: 5,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#1F2937",
      titleColor: "#F9FAFB",
      bodyColor: "#F9FAFB",
      borderColor: "#374151",
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: false,
      callbacks: {
        label: (ctx: any) => fmt.format(ctx.parsed.y),
      },
    },
  },
  scales: {
    x: { grid: { display: false }, border: { display: false } },
    y: {
      grid: { color: "#F3F4F6" },
      border: { display: false },
      ticks: {
        callback: (v: any) =>
          new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 0 }).format(v) + " ₽",
      },
    },
  },
};
</script>

<template>
  <div class="chart-card">
    <div class="chart-header">
      <div>
        <h3 class="chart-title">Продажи за неделю</h3>
        <p class="chart-sub">Динамика выручки по дням</p>
      </div>
      <div v-if="!loading && data.length" class="chart-total">
        {{ fmt.format(weeklyTotal) }}
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="chart-sk">
      <div class="sk-chart-line" />
    </div>

    <!-- Empty -->
    <div v-else-if="!data.length" class="chart-empty">Нет данных</div>

    <!-- Chart -->
    <div v-else class="chart-wrap">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.chart-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; }
.chart-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; gap: 8px; }
.chart-title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 2px; }
.chart-sub { font-size: 11px; color: #64748b; margin: 0; }
.chart-total { font-size: 18px; font-weight: 800; color: #0f172a; font-family: "JetBrains Mono", monospace; white-space: nowrap; }
.chart-wrap { height: 220px; }
.chart-sk { height: 220px; display: flex; align-items: flex-end; gap: 6px; padding: 16px 0 0; }
.sk-chart-line { width: 100%; height: 100%; background: linear-gradient(180deg,#e2e8f0 0%,#f1f5f9 100%); border-radius: 6px; animation: sk-pulse 1.5s ease-in-out infinite; }
.chart-empty { height: 220px; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #94a3b8; }
@keyframes sk-pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
</style>
