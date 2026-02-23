<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { AgGridVue } from "ag-grid-vue3";
import {
  ModuleRegistry,
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  CsvExportModule,
  ValidationModule,
  TextEditorModule,
  SelectEditorModule,
  ColumnAutoSizeModule,
  ColumnApiModule,
  QuickFilterModule,
  UndoRedoEditModule,
  CellStyleModule,
  TooltipModule,
  RenderApiModule,
  themeQuartz,
} from "ag-grid-community";
import type {
  GridApi,
  GridReadyEvent,
  ColDef,
  FirstDataRenderedEvent,
  GridSizeChangedEvent,
} from "ag-grid-community";
import { salesApi } from "@/services/salesApi";
import type { Sale, SaleItem } from "@/services/salesApi";
import { visitsApi } from "@/services/visitsApi";
import type { Branch } from "@/services/visitsApi";
import { useAuth } from "@/composables/useAuth";
import ClientDetailModal from "@/components/clients/ClientDetailModal.vue";
import SaleReceiptModal from "@/components/sales/SaleReceiptModal.vue";

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  CsvExportModule,
  ValidationModule,
  TextEditorModule,
  SelectEditorModule,
  ColumnAutoSizeModule,
  ColumnApiModule,
  QuickFilterModule,
  UndoRedoEditModule,
  CellStyleModule,
  TooltipModule,
  RenderApiModule,
]);

const salesTheme = themeQuartz.withParams({
  fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif",
  fontSize: 13,
  backgroundColor: "#FFFFFF",
  foregroundColor: "#0F172A",
  headerBackgroundColor: "#F1F5F9",
  headerFontWeight: 700,
  headerFontSize: 11,
  headerTextColor: "#64748B",
  borderColor: "#E2E8F0",
  columnBorder: { color: "#E2E8F0", width: 1, style: "solid" },
  rowBorder: { color: "#E2E8F0", width: 1, style: "solid" },
  oddRowBackgroundColor: "#FAFBFC",
  rowHoverColor: "#EFF6FF",
  selectedRowBackgroundColor: "#DBEAFE",
  cellHorizontalPadding: 12,
  headerHeight: 44,
  rowHeight: 42,
  iconSize: 14,
  accentColor: "#2563EB",
  inputFocusBorder: { color: "#2563EB", width: 2, style: "solid" },
  checkboxCheckedBackgroundColor: "#2563EB",
  checkboxCheckedBorderColor: "#2563EB",
  checkboxCheckedShapeColor: "#FFFFFF",
  headerColumnBorder: { color: "#CBD5E1", width: 1, style: "solid" },
});

const { isBranch, user } = useAuth();

// ── State ──
const gridApi = ref<GridApi | null>(null);
const sales = ref<Sale[]>([]);
const totalSales = ref(0);
const branches = ref<Branch[]>([]);
const isLoading = ref(false);
const isLoadingMore = ref(false);
const isExporting = ref(false);
const isMobile = ref(false);
const isFullscreen = ref(false);
const searchText = ref("");
const showFilters = ref(false);
const showStatsPanel = ref(false);
const selectedSale = ref<Sale | null>(null);
const detailClientId = ref<string | null>(null);

const PAGE_SIZE = 50;
const hasMore = computed(() => sales.value.length < totalSales.value);

// ── Filters ──
const filterBranch = ref<number | "">("");
const filterStartDate = ref("");
const filterEndDate = ref("");
const filterAmountMin = ref("");
const filterAmountMax = ref("");
const filterSortBy = ref("moment");
const filterSortOrder = ref<"asc" | "desc">("desc");

const activeFilterCount = computed(() => {
  let n = 0;
  if (filterBranch.value !== "") n++;
  if (filterStartDate.value || filterEndDate.value) n++;
  if (filterAmountMin.value || filterAmountMax.value) n++;
  if (filterSortBy.value !== "moment" || filterSortOrder.value !== "desc") n++;
  return n;
});

const hasActiveFilters = computed(() => activeFilterCount.value > 0);

const buildParams = (skip = 0) => ({
  branch_id: filterBranch.value !== "" ? Number(filterBranch.value) : undefined,
  start_date: filterStartDate.value || undefined,
  end_date: filterEndDate.value || undefined,
  amount_min: filterAmountMin.value ? Number(filterAmountMin.value) : undefined,
  amount_max: filterAmountMax.value ? Number(filterAmountMax.value) : undefined,
  sort_by: filterSortBy.value || undefined,
  sort_order: filterSortOrder.value,
  skip,
  limit: PAGE_SIZE,
});

// ── Stats (computed from loaded data) ──
const displayStats = computed(() => {
  const loaded = sales.value.length;
  const totalAmount = sales.value.reduce((s, r) => s + r.sum, 0);
  const avg = loaded > 0 ? totalAmount / loaded : 0;
  return { total: totalSales.value, loaded, totalAmount, avg };
});

// ── Format helpers ──
const formatCurrency = (v: number): string =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
  }).format(v);

const formatMoment = (v: string | null): string => {
  if (!v) return "—";
  const d = new Date(v.replace(" ", "T"));
  if (isNaN(d.getTime())) return v;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yy} ${hh}:${min}`;
};

// ── Column definitions ──
const columnDefs = computed<ColDef[]>(() => [
  {
    headerName: "Номер",
    field: "name",
    width: 140,
    sortable: false,
    pinned: isMobile.value ? undefined : ("left" as const),
    cellStyle: {
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 600,
      color: "#2563eb",
    },
  },
  {
    headerName: "Дата",
    field: "moment",
    width: 145,
    sortable: false,
    valueFormatter: (p) => formatMoment(p.value),
  },
  {
    headerName: "Покупатель",
    field: "agent_name",
    flex: 1,
    minWidth: 180,
    sortable: false,
    valueFormatter: (p) => p.value || "Анонимная продажа",
    cellStyle: ((p: any) => ({
      color: p.value ? "#2563eb" : "#94a3b8",
      textDecoration: p.value ? "underline" : "none",
      cursor: p.value ? "pointer" : "default",
      fontStyle: p.value ? "normal" : "italic",
    })) as any,
  },
  {
    headerName: "Консультант",
    field: "employee_name",
    width: 160,
    sortable: false,
    valueFormatter: (p) => p.value || "—",
  },
  {
    headerName: "Магазин",
    field: "store",
    width: 170,
    sortable: false,
  },
  {
    headerName: "Сумма",
    field: "sum",
    width: 135,
    sortable: false,
    valueFormatter: (p) => formatCurrency(p.value),
    cellStyle: {
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 700,
      color: "#059669",
    },
  },
  {
    headerName: "Товары",
    field: "items",
    flex: 1,
    minWidth: 180,
    sortable: false,
    valueFormatter: (p) => {
      const items = p.value as SaleItem[] | null;
      if (!items?.length) return "—";
      const first = items[0]?.name ?? "—";
      return items.length > 1 ? `${first}  +${items.length - 1}` : first;
    },
  },
]);

const defaultColDef = ref<ColDef>({
  resizable: true,
  suppressMovable: false,
  sortable: false,
});

// ── API ──
const loadSales = async () => {
  isLoading.value = true;
  try {
    const resp = await salesApi.getSales(buildParams(0));
    sales.value = resp.sales;
    totalSales.value = resp.total;
    gridApi.value?.setGridOption("rowData", sales.value);
  } catch (e) {
    console.error("Ошибка загрузки продаж:", e);
  } finally {
    isLoading.value = false;
  }
};

const loadMore = async () => {
  if (!hasMore.value || isLoadingMore.value) return;
  isLoadingMore.value = true;
  try {
    const resp = await salesApi.getSales(buildParams(sales.value.length));
    sales.value.push(...resp.sales);
    totalSales.value = resp.total;
    gridApi.value?.setGridOption("rowData", [...sales.value]);
  } catch (e) {
    console.error("Ошибка подгрузки:", e);
  } finally {
    isLoadingMore.value = false;
  }
};

const loadBranches = async () => {
  try {
    branches.value = await visitsApi.getBranches();
  } catch {
    branches.value = [];
  }
  if (isBranch.value && user.value?.branch_id != null) {
    branches.value = branches.value.filter((b) => b.local_id === user.value!.branch_id);
    filterBranch.value = user.value.branch_id;
  }
};

// ── Filters ──
const applyFilters = () => loadSales();

const clearFilters = () => {
  filterBranch.value = "";
  filterStartDate.value = "";
  filterEndDate.value = "";
  filterAmountMin.value = "";
  filterAmountMax.value = "";
  filterSortBy.value = "moment";
  filterSortOrder.value = "desc";
  loadSales();
};

// ── Grid events ──
const onGridReady = (params: GridReadyEvent) => {
  gridApi.value = params.api;
  if (!isMobile.value) params.api.sizeColumnsToFit();
  setTimeout(setupScrollListener, 300);
};

const onFirstDataRendered = (params: FirstDataRenderedEvent) => {
  if (!isMobile.value) params.api.sizeColumnsToFit();
  if (!scrollViewport) setTimeout(setupScrollListener, 100);
};

const onGridSizeChanged = (params: GridSizeChangedEvent) => {
  if (!isMobile.value && params.api) params.api.sizeColumnsToFit();
};

// Click: agent_name → client detail; else → receipt modal
const onCellClicked = (event: any) => {
  if (!event.data || !event.colDef?.field) return;
  const sale = event.data as Sale;
  if (event.colDef.field === "agent_name" && sale.agent_moysklad_id) {
    detailClientId.value = sale.agent_moysklad_id;
  } else {
    selectedSale.value = sale;
  }
};

// ── Infinite scroll via DOM ──
let scrollViewport: HTMLElement | null = null;

const setupScrollListener = () => {
  const gridEl = document.querySelector(".grid-wrap");
  if (!gridEl) return;
  const viewport = gridEl.querySelector(".ag-body-viewport") as HTMLElement;
  if (!viewport) return;
  if (scrollViewport)
    scrollViewport.removeEventListener("scroll", handleViewportScroll);
  scrollViewport = viewport;
  viewport.addEventListener("scroll", handleViewportScroll, { passive: true });
};

const handleViewportScroll = () => {
  if (!hasMore.value || isLoadingMore.value || !scrollViewport) return;
  const { scrollTop, scrollHeight, clientHeight } = scrollViewport;
  if (scrollTop + clientHeight >= scrollHeight - 400) loadMore();
};

// ── Other handlers ──
const handleRefresh = () => loadSales();

const handleExport = () => {
  if (!gridApi.value) return;
  isExporting.value = true;
  gridApi.value.exportDataAsCsv({
    fileName: `sales_${new Date().toISOString().slice(0, 10)}.csv`,
  });
  setTimeout(() => {
    isExporting.value = false;
  }, 500);
};

watch(searchText, (val) => {
  gridApi.value?.setGridOption("quickFilterText", val);
});

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

const getRowId = (params: any) => params.data?.id ?? String(Math.random());

onMounted(async () => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
  await Promise.all([loadSales(), loadBranches()]);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
  if (scrollViewport) {
    scrollViewport.removeEventListener("scroll", handleViewportScroll);
    scrollViewport = null;
  }
});
</script>

<template>
  <div class="sales-page" :class="{ 'sales-page--fs': isFullscreen }">
    <!-- HEADER -->
    <header class="page-header">
      <div class="header-left">
        <h1 class="header-title">Продажи</h1>
        <span class="badge-count">{{ totalSales }}</span>
      </div>

      <div class="header-search">
        <svg
          class="toolbar-search-ico"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          v-model="searchText"
          type="text"
          placeholder="Поиск по номеру, покупателю..."
          class="toolbar-search-input"
        />
        <button
          v-if="searchText"
          class="toolbar-search-clear"
          @click="searchText = ''"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div class="header-btns">
        <!-- Filters toggle -->
        <button
          class="hbtn hbtn--ghost"
          :class="{ 'hbtn--active': showFilters }"
          @click="showFilters = !showFilters"
          title="Фильтры"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span class="hbtn-text">Фильтры</span>
          <span v-if="activeFilterCount > 0" class="filter-badge">{{
            activeFilterCount
          }}</span>
        </button>

        <!-- Stats -->
        <button
          class="hbtn hbtn--ghost"
          :class="{ 'hbtn--active': showStatsPanel }"
          @click="showStatsPanel = !showStatsPanel"
          title="Статистика"
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

        <!-- Export -->
        <button
          class="hbtn hbtn--ghost"
          @click="handleExport"
          :disabled="isExporting"
          title="Экспорт CSV"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>

        <!-- Refresh -->
        <button
          class="hbtn hbtn--ghost"
          @click="handleRefresh"
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

    <!-- FILTER PANEL -->
    <Transition name="fold">
      <div v-if="showFilters" class="filter-panel">
        <div class="fp-row">
          <div class="fp-field">
            <label class="fp-label">Филиал</label>
            <select v-model="filterBranch" class="fp-select">
              <option value="">Все филиалы</option>
              <option
                v-for="b in branches"
                :key="b.moysklad_id"
                :value="b.local_id"
              >
                {{ b.name }}{{ !b.is_active ? " (неактивен)" : "" }}
              </option>
            </select>
          </div>
          <div class="fp-field">
            <label class="fp-label">Дата с</label>
            <input v-model="filterStartDate" type="date" class="fp-input" />
          </div>
          <div class="fp-field">
            <label class="fp-label">Дата по</label>
            <input v-model="filterEndDate" type="date" class="fp-input" />
          </div>
          <div class="fp-field">
            <label class="fp-label">Сумма от</label>
            <input
              v-model="filterAmountMin"
              type="number"
              min="0"
              placeholder="0"
              class="fp-input fp-input--num"
            />
          </div>
          <div class="fp-field">
            <label class="fp-label">Сумма до</label>
            <input
              v-model="filterAmountMax"
              type="number"
              min="0"
              placeholder="∞"
              class="fp-input fp-input--num"
            />
          </div>
          <div class="fp-field">
            <label class="fp-label">Сортировка</label>
            <select v-model="filterSortBy" class="fp-select">
              <option value="moment">По дате</option>
              <option value="sum">По сумме</option>
            </select>
          </div>
          <div class="fp-field">
            <label class="fp-label">Порядок</label>
            <select v-model="filterSortOrder" class="fp-select">
              <option value="desc">↓ По убыванию</option>
              <option value="asc">↑ По возрастанию</option>
            </select>
          </div>
        </div>
        <div class="fp-actions">
          <button class="hbtn hbtn--primary" @click="applyFilters">
            Применить
          </button>
          <button
            v-if="hasActiveFilters"
            class="hbtn hbtn--ghost"
            @click="clearFilters"
          >
            Сбросить
          </button>
        </div>
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
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <line x1="9" y1="7" x2="15" y2="7" />
                <line x1="9" y1="11" x2="15" y2="11" />
                <line x1="9" y1="15" x2="13" y2="15" />
              </svg>
            </div>
            <div class="scard-body">
              <span class="scard-val">{{ displayStats.total }}</span>
              <span class="scard-lbl">Всего продаж</span>
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
                <path d="M6 3v18" />
                <path d="M6 12h8a4 4 0 0 0 0-8H6" />
                <path d="M4 16h10" />
              </svg>
            </div>
            <div class="scard-body">
              <span class="scard-val">{{
                formatCurrency(displayStats.totalAmount)
              }}</span>
              <span class="scard-lbl">Сумма (загружено)</span>
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
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div class="scard-body">
              <span class="scard-val">{{
                formatCurrency(displayStats.avg)
              }}</span>
              <span class="scard-lbl">Ср. чек</span>
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
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div class="scard-body">
              <span class="scard-val"
                >{{ displayStats.loaded }} / {{ displayStats.total }}</span
              >
              <span class="scard-lbl">Загружено</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- MOBILE BAR -->
    <div class="mobile-bar" v-if="isMobile && !isFullscreen">
      <div class="mobile-bar-hint">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        Свайп ← → для прокрутки
      </div>
      <button
        class="mobile-bar-fs"
        @click="isFullscreen = true"
        title="Во весь экран"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      </button>
    </div>

    <!-- FULLSCREEN EXIT -->
    <div class="fs-exit-bar" v-if="isFullscreen">
      <span class="fs-exit-info"
        >Продаж: <b>{{ totalSales }}</b></span
      >
      <button class="fs-exit-btn" @click="isFullscreen = false">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="4 14 4 20 10 20" />
          <polyline points="20 10 20 4 14 4" />
          <line x1="14" y1="10" x2="21" y2="3" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
        <span>Свернуть</span>
      </button>
    </div>

    <!-- GRID -->
    <div class="grid-wrap" :class="{ 'grid-wrap--loading': isLoading }">
      <!-- Skeleton -->
      <Transition name="fade">
        <div v-if="isLoading && sales.length === 0" class="grid-skeleton">
          <div class="skeleton-header">
            <div class="skeleton-hcell" v-for="n in 6" :key="n"></div>
          </div>
          <div class="skeleton-row" v-for="r in 12" :key="r">
            <div class="skeleton-cell" v-for="c in 6" :key="c">
              <div
                class="skeleton-bar"
                :style="{ width: 40 + Math.random() * 50 + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Refresh bar -->
      <Transition name="fade">
        <div v-if="isLoading && sales.length > 0" class="grid-refresh-bar">
          <div class="grid-refresh-progress"></div>
        </div>
      </Transition>

      <!-- Индикатор подгрузки внизу таблицы -->
      <Transition name="slide-up">
        <div v-if="isLoadingMore" class="grid-loading-more">
          <div class="loading-more-inner">
            <div class="loading-dots">
              <span></span><span></span><span></span>
            </div>
            <span>Загрузка ещё {{ PAGE_SIZE }}...</span>
          </div>
        </div>
      </Transition>

      <AgGridVue
        :style="{ width: '100%', height: '100%' }"
        :theme="salesTheme"
        :columnDefs="columnDefs"
        :defaultColDef="defaultColDef"
        :rowData="sales"
        :getRowId="getRowId"
        :animateRows="true"
        :enableCellTextSelection="true"
        :tooltipShowDelay="400"
        :suppressDragLeaveHidesColumns="true"
        overlayNoRowsTemplate='<div class="ov-empty"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/></svg><span>Продажи не найдены</span></div>'
        @grid-ready="onGridReady"
        @first-data-rendered="onFirstDataRendered"
        @grid-size-changed="onGridSizeChanged"
        @cell-clicked="onCellClicked"
      />
    </div>

    <!-- FOOTER -->
    <footer class="page-footer">
      <div class="footer-l">
        <span
          >Загружено: <b>{{ sales.length }}</b> из <b>{{ totalSales }}</b></span
        >
        <span v-if="isLoadingMore" class="footer-loading">подгрузка...</span>
      </div>
      <div class="footer-r">
        <span class="footer-tip"
          >Клик по строке — чек · Клик по имени — клиент</span
        >
      </div>
    </footer>

    <!-- RECEIPT MODAL -->
    <SaleReceiptModal
      :open="!!selectedSale"
      :sale="selectedSale"
      @close="selectedSale = null"
      @open-client="
        (id) => {
          detailClientId = id;
        }
      "
    />

    <!-- CLIENT DETAIL MODAL -->
    <ClientDetailModal
      v-if="detailClientId"
      :moyskladId="detailClientId"
      @close="detailClientId = null"
    />
  </div>
</template>

<style>
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
.sales-page {
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
.badge-count {
  background: var(--prl);
  color: var(--pr);
  font: 700 11px/1 var(--fm);
  padding: 2px 7px;
  border-radius: 20px;
}
.header-search {
  position: relative;
  flex: 1;
  min-width: 0;
  max-width: 380px;
}
.header-btns {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  align-items: center;
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
  position: relative;
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
.hbtn--primary {
  background: var(--pr);
  color: #fff;
}
.hbtn--primary:hover:not(:disabled) {
  background: var(--prh);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}
.hbtn--active {
  background: var(--prl);
  color: var(--pr);
  border-color: var(--pr);
}
.filter-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--pr);
  color: #fff;
  font: 700 9px/1 var(--fm);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.toolbar-search-ico {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--txm);
  pointer-events: none;
}
.toolbar-search-input {
  width: 100%;
  padding: 6px 26px 6px 28px;
  border: 1px solid var(--bd);
  border-radius: var(--rs);
  font: 400 12px var(--fn);
  background: var(--bg);
  color: var(--tx);
  transition: all var(--tr);
  outline: none;
}
.toolbar-search-input:focus {
  background: var(--sf);
  border-color: var(--pr);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.08);
}
.toolbar-search-input::placeholder {
  color: var(--txm);
}
.toolbar-search-clear {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: none;
  background: var(--bd);
  color: var(--tx2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--tr);
}
.toolbar-search-clear:hover {
  background: var(--bds);
}

/* Filter panel */
.filter-panel {
  background: var(--sf);
  border-bottom: 1px solid var(--bd);
  padding: 12px 16px;
  flex-shrink: 0;
}
.fp-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}
.fp-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.fp-label {
  font: 600 10px/1 var(--fn);
  color: var(--txm);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.fp-input,
.fp-select {
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--bd);
  border-radius: var(--rs);
  font: 400 12px var(--fn);
  background: var(--bg);
  color: var(--tx);
  outline: none;
  transition: all var(--tr);
  min-width: 120px;
}
.fp-input--num {
  min-width: 90px;
}
.fp-input:focus,
.fp-select:focus {
  border-color: var(--pr);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.08);
  background: var(--sf);
}
.fp-actions {
  display: flex;
  gap: 8px;
}

/* Stats panel */
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
  min-width: 130px;
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
.scard-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.scard-val {
  font: 800 14px/1.1 var(--fm);
  letter-spacing: -0.02em;
}
.scard-lbl {
  font-size: 10px;
  color: var(--txm);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Mobile */
.mobile-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 12px;
  background: var(--prl);
  border-bottom: 1px solid var(--bd);
  flex-shrink: 0;
}
.mobile-bar-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--pr);
  font-size: 11px;
  font-weight: 500;
}
.mobile-bar-fs {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--rs);
  border: 1px solid var(--pr);
  background: var(--sf);
  color: var(--pr);
  cursor: pointer;
  transition: all var(--tr);
  flex-shrink: 0;
}
.mobile-bar-fs:active {
  background: var(--pr);
  color: #fff;
}
.fs-exit-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--sf);
  border-bottom: 1px solid var(--bd);
  flex-shrink: 0;
}
.fs-exit-info {
  font-size: 11px;
  color: var(--tx2);
}
.fs-exit-info b {
  color: var(--tx);
  font-family: var(--fm);
}
.fs-exit-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: var(--rs);
  border: 1px solid var(--bd);
  background: var(--sf);
  color: var(--tx2);
  font: 600 11px var(--fn);
  cursor: pointer;
  transition: all var(--tr);
}
.fs-exit-btn:active {
  background: var(--sfh);
  color: var(--tx);
}
.sales-page--fs .page-header,
.sales-page--fs .stats-panel,
.sales-page--fs .filter-panel,
.sales-page--fs .page-footer {
  display: none !important;
}

/* Grid */
.grid-wrap {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x pan-y;
}
.grid-wrap--loading .ag-root-wrapper {
  opacity: 0.45;
  transition: opacity 0.2s;
}
.grid-skeleton {
  position: absolute;
  inset: 0;
  z-index: 5;
  background: var(--sf);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.skeleton-header {
  display: flex;
  gap: 1px;
  padding: 0;
  background: var(--sfh);
  border-bottom: 1px solid var(--bd);
  height: 44px;
  align-items: center;
}
.skeleton-hcell {
  flex: 1;
  height: 12px;
  margin: 0 16px;
  background: var(--bd);
  border-radius: 4px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
.skeleton-hcell:nth-child(1) {
  flex: 0 0 60px;
}
.skeleton-hcell:nth-child(2) {
  flex: 0 0 180px;
}
.skeleton-row {
  display: flex;
  gap: 1px;
  border-bottom: 1px solid var(--bd);
  height: 42px;
  align-items: center;
}
.skeleton-row:nth-child(odd) {
  background: var(--bg);
}
.skeleton-cell {
  flex: 1;
  padding: 0 12px;
}
.skeleton-cell:nth-child(1) {
  flex: 0 0 60px;
}
.skeleton-cell:nth-child(2) {
  flex: 0 0 180px;
}
.skeleton-bar {
  height: 10px;
  background: linear-gradient(90deg, var(--bd) 25%, #e8edf3 50%, var(--bd) 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: skeleton-shimmer 1.8s ease-in-out infinite;
}
.skeleton-row:nth-child(2) .skeleton-bar { animation-delay: 0.1s; }
.skeleton-row:nth-child(3) .skeleton-bar { animation-delay: 0.2s; }
.skeleton-row:nth-child(4) .skeleton-bar { animation-delay: 0.3s; }
.skeleton-row:nth-child(5) .skeleton-bar { animation-delay: 0.4s; }
.skeleton-row:nth-child(6) .skeleton-bar { animation-delay: 0.15s; }
.skeleton-row:nth-child(7) .skeleton-bar { animation-delay: 0.25s; }
.skeleton-row:nth-child(8) .skeleton-bar { animation-delay: 0.35s; }
@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}
.grid-refresh-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 10;
  overflow: hidden;
  background: rgba(37, 99, 235, 0.1);
}
.grid-refresh-progress {
  height: 100%;
  width: 40%;
  background: linear-gradient(90deg, var(--pr), var(--pu), var(--pr));
  border-radius: 2px;
  animation: refresh-slide 1.2s ease-in-out infinite;
}
@keyframes refresh-slide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(350%);
  }
}
.grid-loading-more {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 8;
  pointer-events: none;
}
.loading-more-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 16px;
  background: linear-gradient(0deg, var(--sf) 60%, transparent);
  font: 500 12px var(--fn);
  color: var(--tx2);
}
.loading-dots {
  display: flex;
  gap: 4px;
}
.loading-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--pr);
  animation: dot-bounce 0.6s ease-in-out infinite;
}
.loading-dots span:nth-child(2) { animation-delay: 0.15s; }
.loading-dots span:nth-child(3) { animation-delay: 0.3s; }
@keyframes dot-bounce {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}
.footer-loading {
  color: var(--pr);
  font-weight: 500;
  animation: pulse 1s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.slide-up-enter-active { transition: all 200ms ease-out; }
.slide-up-leave-active { transition: all 150ms ease-in; }
.slide-up-enter-from { opacity: 0; transform: translateY(20px); }
.slide-up-enter-to { opacity: 1; transform: translateY(0); }
.slide-up-leave-from { opacity: 1; transform: translateY(0); }
.slide-up-leave-to { opacity: 0; transform: translateY(20px); }
.ov-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--txm);
  font: 400 14px var(--fn);
  padding: 40px 20px;
}

/* Footer */
.page-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 12px;
  background: var(--sf);
  border-top: 1px solid var(--bd);
  font-size: 10px;
  color: var(--tx2);
  flex-shrink: 0;
}
.footer-l {
  display: flex;
  gap: 12px;
}
.footer-l b {
  color: var(--tx);
  font-family: var(--fm);
}
.footer-more {
  color: var(--txm);
  font-style: italic;
}
.footer-tip {
  font-style: italic;
  color: var(--txm);
  font-size: 11px;
}

/* Transitions */
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

@media (max-width: 768px) {
  .page-header {
    flex-wrap: wrap;
    padding: 8px 10px;
    gap: 6px;
  }
  .header-left {
    order: 1;
  }
  .header-search {
    order: 3;
    flex: 1 1 100%;
    max-width: 100%;
  }
  .header-btns {
    order: 2;
    margin-left: auto;
  }
  .hbtn-text {
    display: none;
  }
  .header-title {
    font-size: 15px;
  }
  .fp-row {
    gap: 8px;
  }
  .fp-input,
  .fp-select {
    min-width: 100px;
  }
  .page-footer {
    flex-direction: column;
    gap: 2px;
    text-align: center;
  }
  .footer-tip {
    display: none;
  }
  .grid-wrap {
    touch-action: auto;
  }
}
</style>
