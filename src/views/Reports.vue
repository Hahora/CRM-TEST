<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { ru } from "date-fns/locale";
import AppIcon from "@/components/AppIcon.vue";
import ReportsFilters from "@/components/reports/ReportsFilters.vue";
import SalesReport from "@/components/reports/SalesReport.vue";
import ClientsReport from "@/components/reports/ClientsReport.vue";
import VisitsReport from "@/components/reports/VisitsReport.vue";
import ManagersReport from "@/components/reports/ManagersReport.vue";
import RevenueChart from "@/components/reports/RevenueChart.vue";
import ConversionChart from "@/components/reports/ConversionChart.vue";
import DevelopmentBanner from "@/components/DevelopmentBanner.vue";
import type { IconName } from "@/components/icons";

interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  branch: string;
  manager: string;
  reportType: string;
}

interface ReportData {
  sales: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    totalAmount: number;
    avgDeal: number;
  };
  clients: {
    total: number;
    new: number;
    active: number;
    inactive: number;
    vip: number;
  };
  visits: {
    total: number;
    completed: number;
    scheduled: number;
    noShow: number;
    avgDuration: number;
  };
  managers: Array<{
    name: string;
    sales: number;
    revenue: number;
    clients: number;
    visits: number;
    conversion: number;
  }>;
}

const filters = ref<ReportFilters>({
  dateFrom: format(startOfMonth(new Date()), "yyyy-MM-dd"),
  dateTo: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  branch: "all",
  manager: "all",
  reportType: "summary",
});

const reportData = ref<ReportData>({
  sales: {
    total: 156,
    completed: 89,
    pending: 45,
    cancelled: 22,
    totalAmount: 2450000,
    avgDeal: 27528,
  },
  clients: {
    total: 1247,
    new: 34,
    active: 892,
    inactive: 321,
    vip: 34,
  },
  visits: {
    total: 234,
    completed: 189,
    scheduled: 32,
    noShow: 13,
    avgDuration: 42,
  },
  managers: [
    {
      name: "Иван Петров",
      sales: 34,
      revenue: 890000,
      clients: 156,
      visits: 67,
      conversion: 28.5,
    },
    {
      name: "Анна Смирнова",
      sales: 28,
      revenue: 675000,
      clients: 134,
      visits: 54,
      conversion: 24.1,
    },
    {
      name: "Петр Николаев",
      sales: 19,
      revenue: 523000,
      clients: 98,
      visits: 43,
      conversion: 19.4,
    },
    {
      name: "Мария Иванова",
      sales: 8,
      revenue: 362000,
      clients: 67,
      visits: 28,
      conversion: 11.9,
    },
  ],
});

const isLoading = ref(false);
const selectedReportType = ref("summary");

const reportTypes = [
  { value: "summary", label: "Общий отчет", icon: "bar-chart-3" },
  { value: "sales", label: "Отчет по продажам", icon: "trending-up" },
  { value: "clients", label: "Отчет по клиентам", icon: "users" },
  { value: "visits", label: "Отчет по посещениям", icon: "map-pin" },
  { value: "managers", label: "Отчет по менеджерам", icon: "user-cog" },
  { value: "revenue", label: "Анализ выручки", icon: "package" },
  { value: "conversion", label: "Анализ конверсии", icon: "trending-up" },
];

const currentPeriodText = computed(() => {
  const from = new Date(filters.value.dateFrom);
  const to = new Date(filters.value.dateTo);
  return `${format(from, "d MMM yyyy", { locale: ru })} - ${format(
    to,
    "d MMM yyyy",
    { locale: ru }
  )}`;
});

const handleUpdateFilters = (newFilters: ReportFilters) => {
  filters.value = { ...newFilters };
  loadReportData();
};

const loadReportData = async () => {
  isLoading.value = true;

  // Имитация загрузки данных
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Здесь будет логика загрузки данных с API
  console.log("Загрузка отчетов с фильтрами:", filters.value);

  isLoading.value = false;
};

const exportReport = () => {
  console.log("Экспорт отчета:", selectedReportType.value);
};

const refreshData = async () => {
  await loadReportData();
};

const setQuickPeriod = (period: string) => {
  const now = new Date();

  switch (period) {
    case "today":
      filters.value.dateFrom = format(now, "yyyy-MM-dd");
      filters.value.dateTo = format(now, "yyyy-MM-dd");
      break;
    case "week":
      filters.value.dateFrom = format(subDays(now, 7), "yyyy-MM-dd");
      filters.value.dateTo = format(now, "yyyy-MM-dd");
      break;
    case "month":
      filters.value.dateFrom = format(startOfMonth(now), "yyyy-MM-dd");
      filters.value.dateTo = format(endOfMonth(now), "yyyy-MM-dd");
      break;
    case "year":
      filters.value.dateFrom = format(startOfYear(now), "yyyy-MM-dd");
      filters.value.dateTo = format(endOfYear(now), "yyyy-MM-dd");
      break;
  }

  loadReportData();
};

onMounted(() => {
  loadReportData();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <DevelopmentBanner />
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-4 md:py-6">
      <div
        class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Отчеты</h1>
          <p class="text-sm md:text-base text-gray-600 mt-1">
            Аналитика и отчетность по всем направлениям
          </p>
          <div class="text-sm text-gray-500 mt-1">
            Период: {{ currentPeriodText }}
          </div>
        </div>

        <div class="flex items-center gap-2 md:gap-3">
          <button
            @click="exportReport"
            class="px-3 py-2 md:px-4 md:py-2 border border-gray-300 text-gray-700 text-xs md:text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1 md:gap-2"
          >
            <AppIcon name="file-text" :size="14" class="md:w-4 md:h-4" />
            <span class="hidden sm:inline">Экспорт</span>
          </button>
          <button
            @click="refreshData"
            :disabled="isLoading"
            class="px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white text-xs md:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2"
          >
            <AppIcon
              name="refresh-cw"
              :size="14"
              class="transition-transform md:w-4 md:h-4"
              :class="{ 'animate-spin': isLoading }"
            />
            <span class="hidden sm:inline">{{
              isLoading ? "Обновление..." : "Обновить"
            }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="p-4 md:p-6 space-y-6">
      <!-- Loading Overlay -->
      <div
        v-if="isLoading"
        class="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center"
      >
        <div class="bg-white rounded-lg p-6 flex items-center gap-3 shadow-lg">
          <AppIcon
            name="refresh-cw"
            :size="20"
            class="animate-spin text-blue-600"
          />
          <span class="text-gray-700 font-medium">Загрузка отчетов...</span>
        </div>
      </div>

      <!-- Quick Period Buttons -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          Быстрый выбор периода
        </h3>
        <div class="flex flex-wrap gap-2">
          <button
            @click="setQuickPeriod('today')"
            class="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Сегодня
          </button>
          <button
            @click="setQuickPeriod('week')"
            class="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Неделя
          </button>
          <button
            @click="setQuickPeriod('month')"
            class="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Месяц
          </button>
          <button
            @click="setQuickPeriod('year')"
            class="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Год
          </button>
        </div>
      </div>

      <!-- Filters -->
      <ReportsFilters
        :filters="filters"
        @update:filters="handleUpdateFilters"
      />

      <!-- Report Type Selector -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Тип отчета</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <button
            v-for="type in reportTypes"
            :key="type.value"
            @click="selectedReportType = type.value"
            :class="[
              'p-4 rounded-lg border-2 transition-all text-left',
              selectedReportType === type.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
            ]"
          >
            <div class="flex items-center gap-3 mb-2">
              <AppIcon
                :name="type.icon as IconName"
                :size="20"
                :class="
                  selectedReportType === type.value
                    ? 'text-blue-600'
                    : 'text-gray-500'
                "
              />
            </div>
            <div class="text-sm font-medium">{{ type.label }}</div>
          </button>
        </div>
      </div>

      <!-- Report Content -->
      <div class="space-y-6">
        <!-- Summary Report -->
        <div v-if="selectedReportType === 'summary'" class="space-y-6">
          <SalesReport :data="reportData.sales" />
          <ClientsReport :data="reportData.clients" />
          <VisitsReport :data="reportData.visits" />
          <ManagersReport :data="reportData.managers" />
        </div>

        <!-- Sales Report -->
        <SalesReport
          v-else-if="selectedReportType === 'sales'"
          :data="reportData.sales"
          :detailed="true"
        />

        <!-- Clients Report -->
        <ClientsReport
          v-else-if="selectedReportType === 'clients'"
          :data="reportData.clients"
          :detailed="true"
        />

        <!-- Visits Report -->
        <VisitsReport
          v-else-if="selectedReportType === 'visits'"
          :data="reportData.visits"
          :detailed="true"
        />

        <!-- Managers Report -->
        <ManagersReport
          v-else-if="selectedReportType === 'managers'"
          :data="reportData.managers"
          :detailed="true"
        />

        <!-- Revenue Chart -->
        <RevenueChart v-else-if="selectedReportType === 'revenue'" />

        <!-- Conversion Chart -->
        <ConversionChart v-else-if="selectedReportType === 'conversion'" />
      </div>
    </div>
  </div>
</template>
