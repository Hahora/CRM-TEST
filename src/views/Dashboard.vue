<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { dashboardApi } from "@/services/dashboardApi";
import type { DashboardMain } from "@/services/dashboardApi";
import { visitsApi } from "@/services/visitsApi";
import type { Branch } from "@/services/visitsApi";
import { useAuth } from "@/composables/useAuth";
import SalesChart from "@/components/dashboard/SalesChart.vue";
import VisitsChart from "@/components/dashboard/VisitsChart.vue";
import RecentActivity from "@/components/dashboard/RecentActivity.vue";
import TopClients from "@/components/dashboard/TopClients.vue";
import TodaySchedule from "@/components/dashboard/TodaySchedule.vue";

const { isChiefAdmin, isAdmin } = useAuth();
const canSelectBranch = computed(() => isChiefAdmin.value || isAdmin.value);

const currentDate = ref(new Date());
const isLoading = ref(false);
const showStatsPanel = ref(true);
const data = ref<DashboardMain | null>(null);
const branches = ref<Branch[]>([]);
const selectedBranchId = ref<number | null>(null);
const error = ref("");

const fmt = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  minimumFractionDigits: 0,
});
const formatCurrency = (v: number) => fmt.format(v);

const loadDashboard = async () => {
  isLoading.value = true;
  error.value = "";
  try {
    data.value = await dashboardApi.getMain(
      canSelectBranch.value && selectedBranchId.value != null
        ? selectedBranchId.value
        : undefined
    );
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Ошибка загрузки";
  } finally {
    isLoading.value = false;
  }
};

const loadBranches = async () => {
  if (!canSelectBranch.value) return;
  try {
    branches.value = await visitsApi.getBranches();
  } catch {
    branches.value = [];
  }
};

watch(selectedBranchId, () => loadDashboard());

onMounted(async () => {
  await Promise.all([loadBranches(), loadDashboard()]);
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

      <!-- Branch selector: только для admin / chief_admin -->
      <div v-if="canSelectBranch" class="branch-selector">
        <select
          v-model="selectedBranchId"
          class="branch-select"
          :disabled="isLoading"
        >
          <option :value="null">Все филиалы</option>
          <option
            v-for="b in branches"
            :key="b.local_id"
            :value="b.local_id"
          >{{ b.name }}{{ !b.is_active ? " (неакт.)" : "" }}</option>
        </select>
      </div>

      <div class="header-btns">
        <button
          class="hbtn hbtn--ghost"
          @click="showStatsPanel = !showStatsPanel"
          :class="{ 'hbtn--active': showStatsPanel }"
          title="Статистика"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </button>
        <button
          class="hbtn hbtn--ghost"
          @click="loadDashboard"
          :disabled="isLoading"
          title="Обновить"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ spinning: isLoading }">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>
    </header>

    <!-- Error -->
    <div v-if="error" class="err-bar">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {{ error }}
      <button class="err-retry" @click="loadDashboard">Повторить</button>
    </div>

    <!-- STATS PANEL -->
    <Transition name="fold">
      <div v-if="showStatsPanel" class="stats-panel">
        <div class="stats-row">
          <!-- Skeleton while loading and no data yet -->
          <template v-if="isLoading && !data">
            <div v-for="i in 6" :key="i" class="scard scard--sk">
              <div class="scard-ico sk-box" />
              <div class="scard-body">
                <div class="sk-line sk-line--val" />
                <div class="sk-line sk-line--lbl" />
              </div>
            </div>
          </template>
          <template v-else-if="data">
            <div class="scard">
              <div class="scard-ico scard-ico--blue">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                </svg>
              </div>
              <div class="scard-body">
                <span class="scard-val">{{ data.kpis.total_clients.toLocaleString("ru-RU") }}</span>
                <span class="scard-lbl">Клиентов</span>
              </div>
            </div>
            <div class="scard">
              <div class="scard-ico scard-ico--amber">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div class="scard-body">
                <span class="scard-val">{{ data.kpis.today_visits }}</span>
                <span class="scard-lbl">Визитов сегодня</span>
              </div>
            </div>
            <div class="scard">
              <div class="scard-ico scard-ico--green">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div class="scard-body">
                <span class="scard-val">{{ data.kpis.active_visits_today }}</span>
                <span class="scard-lbl">Активных сейчас</span>
              </div>
            </div>
            <div class="scard">
              <div class="scard-ico scard-ico--purple">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div class="scard-body">
                <span class="scard-val">{{ formatCurrency(data.kpis.monthly_revenue) }}</span>
                <span class="scard-lbl">Выручка за месяц</span>
              </div>
            </div>
            <div class="scard">
              <div class="scard-ico scard-ico--green">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
              <div class="scard-body">
                <span class="scard-val">{{ formatCurrency(data.kpis.average_check) }}</span>
                <span class="scard-lbl">Средний чек</span>
              </div>
            </div>
            <div class="scard">
              <div class="scard-ico scard-ico--teal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <div class="scard-body">
                <span class="scard-val">{{ data.kpis.conversion_rate }}%</span>
                <span class="scard-lbl">Конверсия</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </Transition>

    <!-- CONTENT -->
    <div class="dashboard-content">
      <!-- Charts Row -->
      <div class="charts-row">
        <SalesChart :data="data?.weekly_sales ?? []" :loading="isLoading && !data" />
        <VisitsChart :data="data?.weekly_visits ?? []" :loading="isLoading && !data" />
      </div>

      <!-- Bottom Row -->
      <div class="bottom-row">
        <div class="bottom-left">
          <RecentActivity :data="data?.recent_activities ?? []" :loading="isLoading && !data" />
        </div>
        <div class="bottom-right">
          <TodaySchedule :data="data?.today_schedule ?? []" :loading="isLoading && !data" />
          <TopClients :data="data?.top_clients ?? []" :loading="isLoading && !data" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&display=swap");
:root {
  --bg: #f8fafc; --sf: #fff; --sfh: #f1f5f9; --bd: #e2e8f0; --bds: #cbd5e1;
  --tx: #0f172a; --tx2: #64748b; --txm: #94a3b8; --pr: #2563eb; --prh: #1d4ed8;
  --prl: #eff6ff; --ok: #059669; --okl: #ecfdf5; --er: #dc2626; --erl: #fef2f2;
  --pu: #7c3aed; --pul: #f5f3ff; --te: #0d9488; --tel: #f0fdfa;
  --am: #d97706; --aml: #fffbeb; --r: 8px; --rs: 6px;
  --fn: "Manrope", -apple-system, BlinkMacSystemFont, sans-serif;
  --fm: "JetBrains Mono", monospace; --tr: 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
.dashboard-page { display: flex; flex-direction: column; height: 100%; background: var(--bg); font-family: var(--fn); color: var(--tx); overflow: hidden; }
.page-header { display: flex; align-items: center; padding: 8px 12px; background: var(--sf); border-bottom: 1px solid var(--bd); flex-shrink: 0; gap: 8px; flex-wrap: wrap; }
.header-left { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.header-title { font-size: 16px; font-weight: 800; letter-spacing: -0.02em; margin: 0; }
.header-date { font-size: 11px; color: var(--tx2); font-weight: 500; }
.branch-selector { display: flex; flex-direction: column; gap: 2px; }
.branch-label { font-size: 10px; font-weight: 600; color: var(--tx2); text-transform: uppercase; letter-spacing: 0.04em; }
.branch-select { padding: 5px 8px; border: 1px solid var(--bd); border-radius: var(--rs); font: 500 11px var(--fn); background: var(--sf); color: var(--tx); outline: none; transition: all var(--tr); min-width: 160px; cursor: pointer; }
.branch-select:focus { border-color: var(--pr); box-shadow: 0 0 0 2px rgba(37,99,235,.1); }
.branch-select:disabled { opacity: .5; cursor: not-allowed; }
.header-btns { display: flex; gap: 4px; flex-shrink: 0; align-items: center; margin-left: auto; }
.hbtn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 8px; border-radius: var(--rs); font: 600 11px/1 var(--fn); border: none; cursor: pointer; transition: all var(--tr); white-space: nowrap; }
.hbtn:disabled { opacity: .45; cursor: not-allowed; }
.hbtn--ghost { background: none; color: var(--tx2); border: 1px solid var(--bd); }
.hbtn--ghost:hover:not(:disabled) { background: var(--sfh); color: var(--tx); border-color: var(--bds); }
.hbtn--active { background: var(--prl); color: var(--pr); border-color: var(--pr); }
.err-bar { display: flex; align-items: center; gap: 8px; padding: 8px 14px; background: var(--erl); border-bottom: 1px solid #fca5a5; font-size: 12px; color: var(--er); flex-shrink: 0; }
.err-retry { margin-left: auto; font: 600 11px var(--fn); color: var(--er); background: none; border: 1px solid currentColor; border-radius: 4px; padding: 2px 8px; cursor: pointer; }
.stats-panel { background: var(--sf); border-bottom: 1px solid var(--bd); flex-shrink: 0; }
.stats-row { display: flex; gap: 8px; padding: 10px 16px; overflow-x: auto; flex-shrink: 0; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
.stats-row::-webkit-scrollbar { display: none; }
.scard { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bg); border: 1px solid var(--bd); border-radius: var(--r); min-width: 140px; flex-shrink: 0; }
.scard--sk { min-width: 140px; }
.scard-ico { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: var(--rs); flex-shrink: 0; }
.scard-ico--blue { background: var(--prl); color: var(--pr); }
.scard-ico--green { background: var(--okl); color: var(--ok); }
.scard-ico--purple { background: var(--pul); color: var(--pu); }
.scard-ico--amber { background: var(--aml); color: var(--am); }
.scard-ico--teal { background: var(--tel); color: var(--te); }
.scard-body { display: flex; flex-direction: column; gap: 1px; }
.scard-val { font: 800 15px/1.1 var(--fm); letter-spacing: -0.02em; }
.scard-lbl { font-size: 10px; color: var(--txm); font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
/* Skeleton */
.sk-box { background: #e2e8f0; border-radius: var(--rs); animation: sk-pulse 1.5s ease-in-out infinite; }
.sk-line { height: 10px; border-radius: 4px; background: #e2e8f0; animation: sk-pulse 1.5s ease-in-out infinite; }
.sk-line--val { width: 72px; height: 14px; margin-bottom: 4px; }
.sk-line--lbl { width: 52px; }
@keyframes sk-pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
.dashboard-content { flex: 1; min-height: 0; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 12px; }
.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.bottom-row { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; }
.bottom-left { display: flex; flex-direction: column; gap: 12px; }
.bottom-right { display: flex; flex-direction: column; gap: 12px; }
@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 1s linear infinite; }
.fold-enter-active { transition: all 200ms ease-out; overflow: hidden; }
.fold-leave-active { transition: all 150ms ease-in; overflow: hidden; }
.fold-enter-from { opacity: 0; max-height: 0; }
.fold-enter-to { opacity: 1; max-height: 500px; }
.fold-leave-from { opacity: 1; max-height: 500px; }
.fold-leave-to { opacity: 0; max-height: 0; }
@media (max-width: 1024px) { .charts-row { grid-template-columns: 1fr; } .bottom-row { grid-template-columns: 1fr; } }
@media (max-width: 768px) { .page-header { padding: 8px 10px; gap: 6px; } .header-title { font-size: 15px; } .branch-select { min-width: 130px; font-size: 10px; } .stats-row { padding: 8px 12px; gap: 6px; } .scard { min-width: 120px; padding: 6px 8px; } .scard-val { font-size: 13px; } .dashboard-content { padding: 10px; } }
</style>
