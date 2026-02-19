<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { ru } from "date-fns/locale";
import SalesChart from "@/components/dashboard/SalesChart.vue";
import VisitsChart from "@/components/dashboard/VisitsChart.vue";
import RecentActivity from "@/components/dashboard/RecentActivity.vue";
import TopClients from "@/components/dashboard/TopClients.vue";
import QuickActions from "@/components/dashboard/QuickActions.vue";

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
const showStatsPanel = ref(true);

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
  <div class="dashboard-page">
    <!-- HEADER -->
    <header class="page-header">
      <div class="header-left">
        <h1 class="header-title">Дашборд</h1>
        <span class="header-date">{{
          format(currentDate, "d MMMM yyyy", { locale: ru })
        }}</span>
      </div>
      <div class="header-controls">
        <!-- Branch Selector -->
        <div class="branch-selector">
          <label class="branch-label">Филиал</label>
          <select v-model="selectedBranch" class="branch-select" :disabled="isLoading">
            <option v-for="branch in branches" :key="branch.id" :value="branch.id">
              {{ branch.name }}
            </option>
          </select>
        </div>
        <div class="week-info">
          {{ format(weekStart, "d MMM", { locale: ru }) }} -
          {{ format(weekEnd, "d MMM", { locale: ru }) }}
        </div>
      </div>
      <div class="header-btns">
        <button
          class="hbtn hbtn--ghost"
          @click="showStatsPanel = !showStatsPanel"
          title="Статистика"
          :class="{ 'hbtn--active': showStatsPanel }"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </button>
        <button
          class="hbtn hbtn--ghost"
          @click="refreshData"
          :disabled="isLoading"
          title="Обновить"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            :class="{ spinning: isLoading }"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path
              d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
            />
          </svg>
        </button>
      </div>
    </header>

    <!-- Selected Branch Info -->
    <Transition name="fold">
      <div v-if="selectedBranch !== 'all'" class="branch-info">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span class="branch-info-name">{{ getSelectedBranchName() }}</span>
        <span class="branch-info-address">
          {{ branches.find((b) => b.id === selectedBranch)?.address }}
        </span>
      </div>
    </Transition>

    <!-- STATS PANEL -->
    <Transition name="fold">
      <div v-if="showStatsPanel" class="stats-panel">
        <div class="stats-row">
          <div class="scard">
            <div class="scard-ico scard-ico--blue">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <div class="scard-body">
              <span class="scard-val">{{
                stats.totalClients.toLocaleString("ru-RU")
              }}</span
              ><span class="scard-lbl">Клиентов</span>
            </div>
          </div>
          <div class="scard">
            <div class="scard-ico scard-ico--green">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div class="scard-body">
              <span class="scard-val">{{
                stats.activeDeals.toLocaleString("ru-RU")
              }}</span
              ><span class="scard-lbl">Активные сделки</span>
            </div>
          </div>
          <div class="scard">
            <div class="scard-ico scard-ico--purple">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M6 3v18" />
                <path d="M6 12h8a4 4 0 0 0 0-8H6" />
                <path d="M4 16h10" />
              </svg>
            </div>
            <div class="scard-body">
              <span class="scard-val">{{
                new Intl.NumberFormat("ru-RU", {
                  style: "currency",
                  currency: "RUB",
                  minimumFractionDigits: 0,
                }).format(stats.monthlyRevenue)
              }}</span
              ><span class="scard-lbl">Выручка за месяц</span>
            </div>
          </div>
          <div class="scard">
            <div class="scard-ico scard-ico--amber">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div class="scard-body">
              <span class="scard-val">{{
                stats.todayVisits.toLocaleString("ru-RU")
              }}</span
              ><span class="scard-lbl">Посещений сегодня</span>
            </div>
          </div>
          <div class="scard">
            <div class="scard-ico scard-ico--teal">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div class="scard-body">
              <span class="scard-val">{{ stats.conversionRate }}%</span
              ><span class="scard-lbl">Конверсия</span>
            </div>
          </div>
          <div class="scard">
            <div class="scard-ico scard-ico--green">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <div class="scard-body">
              <span class="scard-val">{{
                new Intl.NumberFormat("ru-RU", {
                  style: "currency",
                  currency: "RUB",
                  minimumFractionDigits: 0,
                }).format(stats.avgDealValue)
              }}</span
              ><span class="scard-lbl">Средний чек</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- CONTENT -->
    <div class="dashboard-content">
      <!-- Loading Overlay -->
      <Transition name="fade">
        <div v-if="isLoading" class="loading-overlay">
          <div class="loading-box">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="spinning"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path
                d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
              />
            </svg>
            <span>Загрузка данных филиала...</span>
          </div>
        </div>
      </Transition>

      <!-- Charts Row -->
      <div class="charts-row">
        <SalesChart :branch-id="selectedBranch" />
        <VisitsChart :branch-id="selectedBranch" />
      </div>

      <!-- Bottom Row -->
      <div class="bottom-row">
        <div class="bottom-left">
          <RecentActivity :branch-id="selectedBranch" />
        </div>
        <div class="bottom-right">
          <TopClients :branch-id="selectedBranch" />
          <QuickActions />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&display=swap");
:root {
  --bg: #f8fafc;
  --sf: #fff;
  --sfh: #f1f5f9;
  --bd: #e2e8f0;
  --bds: #cbd5e1;
  --tx: #0f172a;
  --tx2: #64748b;
  --txm: #94a3b8;
  --pr: #2563eb;
  --prh: #1d4ed8;
  --prl: #eff6ff;
  --ok: #059669;
  --okl: #ecfdf5;
  --er: #dc2626;
  --erl: #fef2f2;
  --pu: #7c3aed;
  --pul: #f5f3ff;
  --te: #0d9488;
  --tel: #f0fdfa;
  --am: #d97706;
  --aml: #fffbeb;
  --r: 8px;
  --rs: 6px;
  --fn: "Manrope", -apple-system, BlinkMacSystemFont, sans-serif;
  --fm: "JetBrains Mono", monospace;
  --tr: 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
.dashboard-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg);
  font-family: var(--fn);
  color: var(--tx);
  overflow: hidden;
}
.page-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--sf);
  border-bottom: 1px solid var(--bd);
  flex-shrink: 0;
  gap: 8px;
  flex-wrap: wrap;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.header-title {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
}
.header-date {
  font-size: 11px;
  color: var(--tx2);
  font-weight: 500;
}
.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}
.branch-selector {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.branch-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--tx2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.branch-select {
  padding: 5px 8px;
  border: 1px solid var(--bd);
  border-radius: var(--rs);
  font: 500 11px var(--fn);
  background: var(--sf);
  color: var(--tx);
  outline: none;
  transition: all var(--tr);
  min-width: 180px;
  cursor: pointer;
}
.branch-select:focus {
  border-color: var(--pr);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}
.branch-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.week-info {
  font-size: 11px;
  color: var(--tx2);
  font-weight: 500;
  padding: 4px 8px;
  background: var(--sfh);
  border-radius: var(--rs);
}
.header-btns {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  align-items: center;
  margin-left: auto;
}
.hbtn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-radius: var(--rs);
  font: 600 11px/1 var(--fn);
  border: none;
  cursor: pointer;
  transition: all var(--tr);
  white-space: nowrap;
}
.hbtn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.hbtn--ghost {
  background: none;
  color: var(--tx2);
  border: 1px solid var(--bd);
}
.hbtn--ghost:hover:not(:disabled) {
  background: var(--sfh);
  color: var(--tx);
  border-color: var(--bds);
}
.hbtn--active {
  background: var(--prl);
  color: var(--pr);
  border-color: var(--pr);
}
.branch-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--prl);
  border-bottom: 1px solid var(--bd);
  flex-shrink: 0;
}
.branch-info svg {
  color: var(--pr);
  flex-shrink: 0;
}
.branch-info-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--pr);
}
.branch-info-address {
  font-size: 11px;
  color: var(--tx2);
}
.stats-panel {
  background: var(--sf);
  border-bottom: 1px solid var(--bd);
  flex-shrink: 0;
}
.stats-row {
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  overflow-x: auto;
  flex-shrink: 0;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.stats-row::-webkit-scrollbar {
  display: none;
}
.scard {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg);
  border: 1px solid var(--bd);
  border-radius: var(--r);
  min-width: 140px;
  flex-shrink: 0;
}
.scard-ico {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--rs);
  flex-shrink: 0;
}
.scard-ico--blue {
  background: var(--prl);
  color: var(--pr);
}
.scard-ico--green {
  background: var(--okl);
  color: var(--ok);
}
.scard-ico--purple {
  background: var(--pul);
  color: var(--pu);
}
.scard-ico--amber {
  background: var(--aml);
  color: var(--am);
}
.scard-ico--teal {
  background: var(--tel);
  color: var(--te);
}
.scard-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.scard-val {
  font: 800 15px/1.1 var(--fm);
  letter-spacing: -0.02em;
}
.scard-lbl {
  font-size: 10px;
  color: var(--txm);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.dashboard-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}
.loading-box {
  background: var(--sf);
  border-radius: var(--r);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.loading-box svg {
  color: var(--pr);
}
.loading-box span {
  color: var(--tx);
  font-weight: 600;
  font-size: 13px;
}
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.bottom-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}
.bottom-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.bottom-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.spinning {
  animation: spin 1s linear infinite;
}
.fold-enter-active {
  transition: all 200ms ease-out;
  overflow: hidden;
}
.fold-leave-active {
  transition: all 150ms ease-in;
  overflow: hidden;
}
.fold-enter-from {
  opacity: 0;
  max-height: 0;
}
.fold-enter-to {
  opacity: 1;
  max-height: 500px;
}
.fold-leave-from {
  opacity: 1;
  max-height: 500px;
}
.fold-leave-to {
  opacity: 0;
  max-height: 0;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@media (max-width: 1024px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
  .bottom-row {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .page-header {
    padding: 8px 10px;
    gap: 6px;
  }
  .header-title {
    font-size: 15px;
  }
  .branch-select {
    min-width: 140px;
    font-size: 10px;
  }
  .week-info {
    font-size: 10px;
  }
  .stats-row {
    padding: 8px 12px;
    gap: 6px;
  }
  .scard {
    min-width: 120px;
    padding: 6px 8px;
  }
  .scard-val {
    font-size: 13px;
  }
  .dashboard-content {
    padding: 10px;
  }
}
</style>
