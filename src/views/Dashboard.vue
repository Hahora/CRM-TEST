<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { ru } from "date-fns/locale";
import AppIcon from "@/components/AppIcon.vue";
import StatsCard from "@/components/dashboard/StatsCard.vue";
import SalesChart from "@/components/dashboard/SalesChart.vue";
import VisitsChart from "@/components/dashboard/VisitsChart.vue";
import RecentActivity from "@/components/dashboard/RecentActivity.vue";
import TopClients from "@/components/dashboard/TopClients.vue";
import QuickActions from "@/components/dashboard/QuickActions.vue";
import DevelopmentBanner from "@/components/DevelopmentBanner.vue";

interface Branch {
  id: string;
  name: string;
  address: string;
}

interface DashboardStats {
  totalClients: number;
  activeDeals: number;
  monthlyRevenue: number;
  todayVisits: number;
  conversionRate: number;
  avgDealValue: number;
}

const branches = ref<Branch[]>([
  { id: "all", name: "Все филиалы", address: "" },
  { id: "main", name: "Главный офис", address: "ул. Ленина, 1" },
  { id: "branch1", name: "Филиал №1", address: "ул. Пушкина, 15" },
  { id: "branch2", name: "Филиал №2", address: "пр. Мира, 45" },
  { id: "branch3", name: "Филиал №3", address: "ул. Гагарина, 23" },
]);

const selectedBranch = ref("all");
const isLoading = ref(false);

const stats = ref<DashboardStats>({
  totalClients: 1247,
  activeDeals: 89,
  monthlyRevenue: 2450000,
  todayVisits: 156,
  conversionRate: 23.5,
  avgDealValue: 27500,
});

// Данные для разных филиалов
const branchData: Record<string, DashboardStats> = {
  all: {
    totalClients: 1247,
    activeDeals: 89,
    monthlyRevenue: 2450000,
    todayVisits: 156,
    conversionRate: 23.5,
    avgDealValue: 27500,
  },
  main: {
    totalClients: 456,
    activeDeals: 34,
    monthlyRevenue: 980000,
    todayVisits: 67,
    conversionRate: 28.2,
    avgDealValue: 32000,
  },
  branch1: {
    totalClients: 298,
    activeDeals: 21,
    monthlyRevenue: 567000,
    todayVisits: 34,
    conversionRate: 19.8,
    avgDealValue: 24500,
  },
  branch2: {
    totalClients: 312,
    activeDeals: 23,
    monthlyRevenue: 623000,
    todayVisits: 38,
    conversionRate: 21.4,
    avgDealValue: 26800,
  },
  branch3: {
    totalClients: 181,
    activeDeals: 11,
    monthlyRevenue: 280000,
    todayVisits: 17,
    conversionRate: 17.3,
    avgDealValue: 22100,
  },
};

const currentDate = ref(new Date());
const weekStart = startOfWeek(currentDate.value, { locale: ru });
const weekEnd = endOfWeek(currentDate.value, { locale: ru });

const loadBranchData = async (branchId: string) => {
  isLoading.value = true;

  // Имитация загрузки данных
  await new Promise((resolve) => setTimeout(resolve, 500));

  stats.value = branchData[branchId] ||
    branchData.all || {
      totalClients: 0,
      activeDeals: 0,
      monthlyRevenue: 0,
      todayVisits: 0,
      conversionRate: 0,
      avgDealValue: 0,
    };
  isLoading.value = false;
};

const refreshData = async () => {
  await loadBranchData(selectedBranch.value);
};

const getSelectedBranchName = () => {
  const branch = branches.value.find((b) => b.id === selectedBranch.value);
  return branch?.name || "Все филиалы";
};

watch(selectedBranch, (newBranch) => {
  loadBranchData(newBranch);
});

onMounted(() => {
  loadBranchData(selectedBranch.value);
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
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Дашборд</h1>
          <p class="text-sm md:text-base text-gray-600 mt-1">
            {{ format(currentDate, "EEEE, d MMMM yyyy", { locale: ru }) }}
          </p>
        </div>

        <div
          class="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4"
        >
          <!-- Branch Selector -->
          <div class="relative">
            <label class="block text-xs font-medium text-gray-500 mb-1"
              >Филиал</label
            >
            <select
              v-model="selectedBranch"
              class="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
              :disabled="isLoading"
            >
              <option
                v-for="branch in branches"
                :key="branch.id"
                :value="branch.id"
              >
                {{ branch.name }}
              </option>
            </select>
            <AppIcon
              name="chevron-down"
              :size="16"
              class="absolute right-2 top-8 text-gray-400 pointer-events-none"
            />
          </div>

          <div class="flex items-center gap-3">
            <div class="text-sm text-gray-500">
              Неделя: {{ format(weekStart, "d MMM", { locale: ru }) }} -
              {{ format(weekEnd, "d MMM", { locale: ru }) }}
            </div>
            <button
              @click="refreshData"
              :disabled="isLoading"
              class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <AppIcon
                name="refresh-cw"
                :size="16"
                :class="{
                  'transition-transform': true,
                  'animate-spin': isLoading,
                }"
              />
              {{ isLoading ? "Загрузка..." : "Обновить" }}
            </button>
          </div>
        </div>
      </div>

      <!-- Selected Branch Info -->
      <div
        v-if="selectedBranch !== 'all'"
        class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
      >
        <div class="flex items-center gap-2">
          <AppIcon name="map-pin" :size="16" class="text-blue-600" />
          <span class="text-sm font-medium text-blue-900">{{
            getSelectedBranchName()
          }}</span>
          <span class="text-sm text-blue-700">
            {{ branches.find((b) => b.id === selectedBranch)?.address }}
          </span>
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
          <span class="text-gray-700 font-medium"
            >Загрузка данных филиала...</span
          >
        </div>
      </div>

      <!-- Stats Grid -->
      <div
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6"
      >
        <StatsCard
          title="Всего клиентов"
          :value="stats.totalClients"
          icon="users"
          color="blue"
          :change="12"
          change-period="за месяц"
        />
        <StatsCard
          title="Активные сделки"
          :value="stats.activeDeals"
          icon="trending-up"
          color="green"
          :change="5"
          change-period="за неделю"
        />
        <StatsCard
          title="Выручка за месяц"
          :value="stats.monthlyRevenue"
          format="currency"
          icon="package"
          color="purple"
          :change="18"
          change-period="к прошлому месяцу"
        />
        <StatsCard
          title="Посещения сегодня"
          :value="stats.todayVisits"
          icon="map-pin"
          color="orange"
          :change="-3"
          change-period="к вчера"
        />
        <StatsCard
          title="Конверсия"
          :value="stats.conversionRate"
          format="percent"
          icon="bar-chart-3"
          color="indigo"
          :change="2.1"
          change-period="за месяц"
        />
        <StatsCard
          title="Средний чек"
          :value="stats.avgDealValue"
          format="currency"
          icon="trending-up"
          color="emerald"
          :change="8"
          change-period="за месяц"
        />
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart :branch-id="selectedBranch" />
        <VisitsChart :branch-id="selectedBranch" />
      </div>

      <!-- Bottom Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <RecentActivity :branch-id="selectedBranch" />
        </div>
        <div class="space-y-6">
          <TopClients :branch-id="selectedBranch" />
          <QuickActions />
        </div>
      </div>
    </div>
  </div>
</template>
