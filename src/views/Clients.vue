<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from "vue";
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
  RowSelectionModule,
  ColumnAutoSizeModule,
  ColumnApiModule,
  QuickFilterModule,
  UndoRedoEditModule,
  CellStyleModule,
  TooltipModule,
  RenderApiModule,
  themeQuartz,
} from "ag-grid-community";
import { useClientsGrid, CLIENT_SOURCES } from "@/composables/useClientsGrid";
import { useClients } from "@/composables/useClients";
import ClientDetailModal from "@/components/clients/ClientDetailModal.vue";
import ClientCreateModal from "@/components/clients/ClientCreateModal.vue";
import type { NewClientData } from "@/components/clients/ClientCreateModal.vue";
import { clientsApi } from "@/services/clientsApi";
import type {
  GridReadyEvent,
  CellValueChangedEvent,
  FirstDataRenderedEvent,
  GridSizeChangedEvent,
} from "ag-grid-community";

// Регистрация модулей (без ScrollApiModule — его нет в v35 community)
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  CsvExportModule,
  ValidationModule,
  TextEditorModule,
  SelectEditorModule,
  RowSelectionModule,
  ColumnAutoSizeModule,
  ColumnApiModule,
  QuickFilterModule,
  UndoRedoEditModule,
  CellStyleModule,
  TooltipModule,
  RenderApiModule,
]);

// Тема
const clientsTheme = themeQuartz.withParams({
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
  gridSize: 4,
  iconSize: 14,
  accentColor: "#2563EB",
  inputFocusBorder: { color: "#2563EB", width: 2, style: "solid" },
  checkboxCheckedBackgroundColor: "#2563EB",
  checkboxCheckedBorderColor: "#2563EB",
  checkboxCheckedShapeColor: "#FFFFFF",
  headerColumnBorder: { color: "#CBD5E1", width: 1, style: "solid" },
});

const {
  clients,
  totalClients,
  stats,
  hasMore,
  isLoadingStats,
  isLoadingClients,
  isLoadingMore,
  isExporting,
  loadClients,
  loadMore,
  loadStats,
  createClient,
  updateClient,
  deleteClients,
  refreshData,
} = useClients();

const {
  gridApi,
  columnDefs,
  defaultColDef,
  onGridReady: baseOnGridReady,
  exportToCsv,
  setQuickFilter,
  getSelectedRows,
  formatCurrency,
} = useClientsGrid();

const searchText = ref("");
const showAddForm = ref(false);
const showStatsPanel = ref(false);
const showFilters = ref(false);

// ── Серверные фильтры ──
const filterCompanyType = ref("");
const filterSex = ref("");
const filterIsWedding = ref<boolean | undefined>(undefined);
const filterSalesMin = ref("");
const filterSalesMax = ref("");
const filterReceiptsMin = ref("");
const filterReceiptsMax = ref("");
const filterAvgMin = ref("");
const filterAvgMax = ref("");
const filterMaxMin = ref("");
const filterMaxMax = ref("");
const filterSortBy = ref("");
const filterSortOrder = ref("asc");

const hasActiveFilters = computed(
  () =>
    !!filterCompanyType.value ||
    !!filterSex.value ||
    filterIsWedding.value !== undefined ||
    !!filterSalesMin.value ||
    !!filterSalesMax.value ||
    !!filterReceiptsMin.value ||
    !!filterReceiptsMax.value ||
    !!filterAvgMin.value ||
    !!filterAvgMax.value ||
    !!filterMaxMin.value ||
    !!filterMaxMax.value ||
    !!filterSortBy.value
);

const activeFilterCount = computed(() => {
  let n = 0;
  if (filterCompanyType.value) n++;
  if (filterSex.value) n++;
  if (filterIsWedding.value !== undefined) n++;
  if (filterSalesMin.value || filterSalesMax.value) n++;
  if (filterReceiptsMin.value || filterReceiptsMax.value) n++;
  if (filterAvgMin.value || filterAvgMax.value) n++;
  if (filterMaxMin.value || filterMaxMax.value) n++;
  if (filterSortBy.value) n++;
  return n;
});

const buildServerFilters = () => ({
  search: searchText.value.trim() || "",
  company_type: filterCompanyType.value || undefined,
  sex: filterSex.value || undefined,
  is_wedding: filterIsWedding.value,
  sales_amount_min: filterSalesMin.value || undefined,
  sales_amount_max: filterSalesMax.value || undefined,
  receipts_count_min: filterReceiptsMin.value || undefined,
  receipts_count_max: filterReceiptsMax.value || undefined,
  avg_receipt_min: filterAvgMin.value || undefined,
  avg_receipt_max: filterAvgMax.value || undefined,
  max_receipt_min: filterMaxMin.value || undefined,
  max_receipt_max: filterMaxMax.value || undefined,
  sort_by: filterSortBy.value || undefined,
  sort_order: filterSortBy.value ? filterSortOrder.value : undefined,
});

const applyFilters = () => loadClients(buildServerFilters());

const clearServerFilters = () => {
  filterCompanyType.value = "";
  filterSex.value = "";
  filterIsWedding.value = undefined;
  filterSalesMin.value = "";
  filterSalesMax.value = "";
  filterReceiptsMin.value = "";
  filterReceiptsMax.value = "";
  filterAvgMin.value = "";
  filterAvgMax.value = "";
  filterMaxMin.value = "";
  filterMaxMax.value = "";
  filterSortBy.value = "";
  filterSortOrder.value = "asc";
  loadClients({ search: searchText.value.trim() || "" });
};

// Числовые инпуты — дебаунс 600мс
let filterDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const onNumberFilterInput = () => {
  if (filterDebounceTimer) clearTimeout(filterDebounceTimer);
  filterDebounceTimer = setTimeout(applyFilters, 600);
};
const selectedCount = ref(0);
const isMobile = ref(false);
const isFullscreen = ref(false);
const detailMoyskladId = ref<string | null>(null);
const PAGE_SIZE = 50;

// ═══ Период статистики (дефолт: начало года → сегодня) ═══
const today = new Date().toISOString().slice(0, 10);
const yearStart = `${new Date().getFullYear()}-01-01`;
const statFrom = ref(yearStart);
const statTo = ref(today);

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

onMounted(async () => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
  try {
    await Promise.all([
      loadClients({ search: "", dateFrom: "", dateTo: "" }),
      loadStats(),
    ]);
  } catch (e) {
    console.error("Ошибка начальной загрузки:", e);
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
  // Убираем слушатель скролла
  if (scrollViewport) {
    scrollViewport.removeEventListener("scroll", handleViewportScroll);
    scrollViewport = null;
  }
});

// ═══ Поиск: серверный (с дебаунсом) + локальный quickFilter ═══
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(searchText, (val) => {
  setQuickFilter(val);
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    loadClients({ ...buildServerFilters(), search: val.trim() || "" });
  }, 400);
});

// ═══ Бесконечная подгрузка по 50 — через DOM scroll ═══
// НЕ используем getVerticalPixelRange (его нет в ag-grid-community v35 без ScrollApiModule)
let scrollViewport: HTMLElement | null = null;

const setupScrollListener = () => {
  const gridEl = document.querySelector(".grid-wrap");
  if (!gridEl) return;
  const viewport = gridEl.querySelector(".ag-body-viewport") as HTMLElement;
  if (!viewport) return;

  if (scrollViewport) {
    scrollViewport.removeEventListener("scroll", handleViewportScroll);
  }

  scrollViewport = viewport;
  viewport.addEventListener("scroll", handleViewportScroll, { passive: true });
};

const handleViewportScroll = () => {
  if (!hasMore.value || isLoadingMore.value) return;
  if (!scrollViewport) return;

  const { scrollTop, scrollHeight, clientHeight } = scrollViewport;
  if (scrollTop + clientHeight >= scrollHeight - 400) {
    loadMore();
  }
};

const onGridReadyHandler = (params: GridReadyEvent) => {
  baseOnGridReady(params);

  if (!isMobile.value) {
    params.api.sizeColumnsToFit();
  }

  setTimeout(setupScrollListener, 300);
};

const onFirstDataRendered = (params: FirstDataRenderedEvent) => {
  if (!isMobile.value) {
    params.api.sizeColumnsToFit();
  }
  if (!scrollViewport) {
    setTimeout(setupScrollListener, 100);
  }
};

const onGridSizeChanged = (params: GridSizeChangedEvent) => {
  if (!isMobile.value && params.api) {
    params.api.sizeColumnsToFit();
  }
};

const onCellValueChanged = async (event: CellValueChangedEvent) => {
  if (!event.data?.id) return;
  try {
    const field = event.colDef.field;
    if (!field) return;

    const newVal = event.data[field];
    const oldVal = event.oldValue;

    if (newVal === oldVal) return;
    if ((newVal == null || newVal === "") && (oldVal == null || oldVal === ""))
      return;

    const updateData: Record<string, any> = {};
    updateData[field] = newVal;

    if (field === "is_wedding" && !newVal) {
      updateData.wedding_date = null;
      updateData.bride_name = null;
      event.data.wedding_date = null;
      event.data.bride_name = null;
    }

    if (field === "is_wedding") {
      // Принудительно обновить всю строку — стили свадьбы, даты, невесты
      setTimeout(() => {
        event.api.refreshCells({ rowNodes: [event.node!], force: true });
      }, 0);
    }

    await updateClient(event.data.id, updateData);
  } catch (error) {
    console.error("Ошибка обновления:", error);
    event.data[event.colDef.field!] = event.oldValue;
    event.api.refreshCells({ rowNodes: [event.node!] });
  }
};

const onSelectionChanged = () => {
  selectedCount.value = getSelectedRows().length;
};

const handleAddClient = async (c: NewClientData) => {
  // Для физ. лиц — собираем name из ФИО
  if (c.company_type === "individual") {
    const parts = [
      c.legal_last_name?.trim(),
      c.legal_first_name?.trim(),
      c.legal_middle_name?.trim(),
    ].filter(Boolean);
    c.name = parts.join(" ");
  }

  if (!c.name?.trim() || !c.phone?.trim()) return;

  try {
    const base: any = {
      name: c.name.trim(),
      company_type: c.company_type,
      phone: c.phone.trim(),
      email: c.email?.trim() || undefined,
      telegram_id: c.telegram_id?.trim() || undefined,
      max_id: c.max_id?.trim() || undefined,
      source: c.source || undefined,
    };

    if (c.company_type === "individual") {
      Object.assign(base, {
        sex: c.sex || undefined,
        birth_date: c.birth_date || undefined,
        legal_last_name: c.legal_last_name?.trim() || undefined,
        legal_first_name: c.legal_first_name?.trim() || undefined,
        legal_middle_name: c.legal_middle_name?.trim() || undefined,
        is_wedding: c.is_wedding || false,
        wedding_date: c.wedding_date || undefined,
        bride_name: c.bride_name?.trim() || undefined,
      });
    } else if (c.company_type === "legal") {
      Object.assign(base, {
        inn: c.inn?.trim() || undefined,
        kpp: c.kpp?.trim() || undefined,
        ogrn: c.ogrn?.trim() || undefined,
        legal_address: c.legal_address?.trim() || undefined,
      });
    } else if (c.company_type === "entrepreneur") {
      Object.assign(base, {
        inn: c.inn?.trim() || undefined,
        ogrnip: c.ogrnip?.trim() || undefined,
        legal_last_name: c.legal_last_name?.trim() || undefined,
        legal_first_name: c.legal_first_name?.trim() || undefined,
        legal_middle_name: c.legal_middle_name?.trim() || undefined,
      });
    }

    await createClient(base);
    await refreshData({ search: "", dateFrom: "", dateTo: "" });
    showAddForm.value = false;
  } catch (error) {
    console.error("Ошибка создания клиента:", error);
  }
};

const handleRefresh = async () => {
  await loadClients(buildServerFilters());
  await loadStats();
};

const handleExport = () => {
  exportToCsv();
};

const openDetail = () => {
  const selected = getSelectedRows();
  if (selected.length !== 1) return;
  const msId = selected[0]?.moysklad_id;
  if (msId) detailMoyskladId.value = msId;
};

const handleDetailDelete = async (moyskladId: string) => {
  try {
    await deleteClients([moyskladId]);
    detailMoyskladId.value = null;
  } catch (e) {
    console.error("Ошибка удаления:", e);
  }
  selectedCount.value = 0;
};

const handleDeleteSelected = async () => {
  const selected = getSelectedRows();
  if (selected.length === 0) return;
  if (!confirm(`Удалить ${selected.length} клиент(ов)?`)) return;

  const ids = selected.map((c: any) => c.moysklad_id).filter(Boolean);
  if (ids.length > 0) {
    try {
      await deleteClients(ids);
    } catch (e) {
      console.error("Ошибка при deleteClients:", e);
    }
  }
  selectedCount.value = 0;
};

const displayStats = computed(() => ({
  totalClients: totalClients.value || 0,
  salesAmount: stats.value?.total_sales_amount || 0,
  salesCount: stats.value?.total_sales_count || 0,
  avgReceipt: stats.value?.average_receipt || 0,
}));

// ═══ Управление периодом статистики ═══
const handleStatsDateChange = () => {
  if (statFrom.value && statTo.value) {
    loadStats(statFrom.value, statTo.value);
  }
};

const setStatPreset = (preset: string) => {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  let from = "";

  switch (preset) {
    case "today": {
      from = todayStr;
      break;
    }
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      from = d.toISOString().slice(0, 10);
      break;
    }
    case "month": {
      from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        "0"
      )}-01`;
      break;
    }
    case "quarter": {
      const qMonth = Math.floor(now.getMonth() / 3) * 3 + 1;
      from = `${now.getFullYear()}-${String(qMonth).padStart(2, "0")}-01`;
      break;
    }
    case "year": {
      from = `${now.getFullYear()}-01-01`;
      break;
    }
    case "all": {
      from = "2020-01-01";
      break;
    }
  }

  statFrom.value = from;
  statTo.value = todayStr;
  loadStats(from, todayStr);
};

const activePreset = computed(() => {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  if (statTo.value !== todayStr) return "";

  const yearStart = `${now.getFullYear()}-01-01`;
  const monthStart = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-01`;
  const qMonth = Math.floor(now.getMonth() / 3) * 3 + 1;
  const quarterStart = `${now.getFullYear()}-${String(qMonth).padStart(
    2,
    "0"
  )}-01`;
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString().slice(0, 10);

  if (statFrom.value === todayStr) return "today";
  if (statFrom.value === weekStr) return "week";
  if (statFrom.value === monthStart) return "month";
  if (statFrom.value === quarterStart) return "quarter";
  if (statFrom.value === yearStart) return "year";
  if (statFrom.value === "2020-01-01") return "all";
  return "";
});

// v35 rowSelection — через GridOptions, НЕ через colDef checkboxSelection
const rowSelection = ref<any>({
  mode: "multiRow",
  enableClickSelection: false,
});

// Отдельная колонка чекбоксов — всегда первая, перед №
const selectionColumnDef = ref({
  width: 42,
  minWidth: 42,
  maxWidth: 42,
  suppressHeaderMenuButton: true,
  sortable: false,
  pinned: "left" as const,
});

// Фикс duplicate null id — если у строки нет id, генерируем уникальный
let fallbackIdCounter = 0;
const getRowId = (params: any) => {
  if (params.data?.id != null && params.data.id !== "") {
    return String(params.data.id);
  }
  fallbackIdCounter++;
  return `__tmp_${fallbackIdCounter}_${Date.now()}`;
};
</script>

<template>
  <div class="clients-page" :class="{ 'clients-page--fs': isFullscreen }">
    <!-- HEADER + TOOLBAR (объединены) -->
    <header class="page-header">
      <div class="header-left">
        <h1 class="header-title">Клиенты</h1>
        <span class="badge-count">{{ displayStats.totalClients }}</span>
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
          placeholder="Поиск по имени, телефону, email..."
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
          <span v-if="activeFilterCount > 0" class="hbtn-badge">{{ activeFilterCount }}</span>
        </button>
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
        <button
          class="hbtn hbtn--ghost"
          @click="handleRefresh"
          :disabled="isLoadingClients"
          title="Обновить"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            :class="{ spinning: isLoadingClients }"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path
              d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
            />
          </svg>
        </button>
        <button
          class="hbtn hbtn--primary"
          @click="showAddForm = !showAddForm"
          title="Новый клиент"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span class="hbtn-text">Новый</span>
        </button>
        <Transition name="fade">
          <button
            v-if="selectedCount === 1"
            class="hbtn hbtn--ghost"
            @click="openDetail"
            title="Подробнее о клиенте"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span class="hbtn-text">Подробнее</span>
          </button>
        </Transition>
        <Transition name="fade">
          <button
            v-if="selectedCount > 1"
            class="hbtn hbtn--danger"
            @click="handleDeleteSelected"
            title="Удалить выбранных"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="3 6 5 6 21 6" />
              <path
                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              />
            </svg>
            <span class="hbtn-text">Удалить {{ selectedCount }}</span>
          </button>
        </Transition>
      </div>
    </header>

    <!-- STATS -->
    <Transition name="fold">
      <div v-if="showStatsPanel" class="stats-panel">
        <!-- Период -->
        <div class="stats-period">
          <div class="stats-period-dates">
            <div class="stats-date-field">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <input
                type="date"
                v-model="statFrom"
                @change="handleStatsDateChange"
                class="stats-date-input"
              />
            </div>
            <span class="stats-date-sep">—</span>
            <div class="stats-date-field">
              <input
                type="date"
                v-model="statTo"
                @change="handleStatsDateChange"
                class="stats-date-input"
              />
            </div>
            <div v-if="isLoadingStats" class="stats-loading-dot"></div>
          </div>
          <div class="stats-presets">
            <button
              class="stats-preset"
              :class="{ 'stats-preset--on': activePreset === 'today' }"
              @click="setStatPreset('today')"
            >
              Сегодня
            </button>
            <button
              class="stats-preset"
              :class="{ 'stats-preset--on': activePreset === 'week' }"
              @click="setStatPreset('week')"
            >
              7 дней
            </button>
            <button
              class="stats-preset"
              :class="{ 'stats-preset--on': activePreset === 'month' }"
              @click="setStatPreset('month')"
            >
              Месяц
            </button>
            <button
              class="stats-preset"
              :class="{ 'stats-preset--on': activePreset === 'quarter' }"
              @click="setStatPreset('quarter')"
            >
              Квартал
            </button>
            <button
              class="stats-preset"
              :class="{ 'stats-preset--on': activePreset === 'year' }"
              @click="setStatPreset('year')"
            >
              Год
            </button>
            <button
              class="stats-preset"
              :class="{ 'stats-preset--on': activePreset === 'all' }"
              @click="setStatPreset('all')"
            >
              Всё время
            </button>
          </div>
        </div>
        <!-- Карточки -->
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
              <span class="scard-val">{{ displayStats.totalClients }}</span
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
                <path d="M6 3v18" />
                <path d="M6 12h8a4 4 0 0 0 0-8H6" />
                <path d="M4 16h10" />
              </svg>
            </div>
            <div class="scard-body">
              <span class="scard-val">{{
                formatCurrency(displayStats.salesAmount)
              }}</span
              ><span class="scard-lbl">Оборот</span>
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
                <path
                  d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l4.58-4.58c.94-.94.94-2.48 0-3.42L9 5z"
                />
                <circle cx="6" cy="9" r="1" />
              </svg>
            </div>
            <div class="scard-body">
              <span class="scard-val">{{
                displayStats.salesCount.toLocaleString("ru-RU")
              }}</span
              ><span class="scard-lbl">Продаж</span>
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
                formatCurrency(displayStats.avgReceipt)
              }}</span
              ><span class="scard-lbl">Ср. чек</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- FILTER PANEL -->
    <Transition name="fold">
      <div v-if="showFilters" class="cf-panel">
        <button v-if="hasActiveFilters" class="cf-reset-btn" @click="clearServerFilters()" title="Сбросить все фильтры">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Сбросить
        </button>
        <div class="cf-inner">
          <!-- Тип клиента -->
          <div class="cf-group">
            <div class="cf-group-label">Тип</div>
            <div class="cf-chips">
              <button class="cf-chip" :class="{ 'cf-chip--on': !filterCompanyType }" @click="filterCompanyType = ''; applyFilters()">Все</button>
              <button class="cf-chip" :class="{ 'cf-chip--on': filterCompanyType === 'individual' }" @click="filterCompanyType = 'individual'; applyFilters()">Физ. лицо</button>
              <button class="cf-chip" :class="{ 'cf-chip--on': filterCompanyType === 'legal' }" @click="filterCompanyType = 'legal'; applyFilters()">Юр. лицо</button>
              <button class="cf-chip" :class="{ 'cf-chip--on': filterCompanyType === 'entrepreneur' }" @click="filterCompanyType = 'entrepreneur'; applyFilters()">ИП</button>
            </div>
          </div>
          <!-- Пол -->
          <div class="cf-group">
            <div class="cf-group-label">Пол</div>
            <div class="cf-chips">
              <button class="cf-chip" :class="{ 'cf-chip--on': !filterSex }" @click="filterSex = ''; applyFilters()">Все</button>
              <button class="cf-chip" :class="{ 'cf-chip--on': filterSex === 'MALE' }" @click="filterSex = 'MALE'; applyFilters()">М</button>
              <button class="cf-chip" :class="{ 'cf-chip--on': filterSex === 'FEMALE' }" @click="filterSex = 'FEMALE'; applyFilters()">Ж</button>
            </div>
          </div>
          <!-- Свадьба -->
          <div class="cf-group">
            <div class="cf-group-label">Свадьба</div>
            <div class="cf-chips">
              <button class="cf-chip" :class="{ 'cf-chip--on': filterIsWedding === undefined }" @click="filterIsWedding = undefined; applyFilters()">Все</button>
              <button class="cf-chip" :class="{ 'cf-chip--on': filterIsWedding === true }" @click="filterIsWedding = true; applyFilters()">Да</button>
              <button class="cf-chip" :class="{ 'cf-chip--on': filterIsWedding === false }" @click="filterIsWedding = false; applyFilters()">Нет</button>
            </div>
          </div>
          <!-- Продажи -->
          <div class="cf-group">
            <div class="cf-group-label">Продажи, ₽</div>
            <div class="cf-range">
              <input type="number" v-model="filterSalesMin" placeholder="от" class="cf-input" @input="onNumberFilterInput" min="0" />
              <span class="cf-range-sep">—</span>
              <input type="number" v-model="filterSalesMax" placeholder="до" class="cf-input" @input="onNumberFilterInput" min="0" />
            </div>
          </div>
          <!-- Количество чеков -->
          <div class="cf-group">
            <div class="cf-group-label">Чеков</div>
            <div class="cf-range">
              <input type="number" v-model="filterReceiptsMin" placeholder="от" class="cf-input" @input="onNumberFilterInput" min="0" />
              <span class="cf-range-sep">—</span>
              <input type="number" v-model="filterReceiptsMax" placeholder="до" class="cf-input" @input="onNumberFilterInput" min="0" />
            </div>
          </div>
          <!-- Средний чек -->
          <div class="cf-group">
            <div class="cf-group-label">Ср. чек, ₽</div>
            <div class="cf-range">
              <input type="number" v-model="filterAvgMin" placeholder="от" class="cf-input" @input="onNumberFilterInput" min="0" />
              <span class="cf-range-sep">—</span>
              <input type="number" v-model="filterAvgMax" placeholder="до" class="cf-input" @input="onNumberFilterInput" min="0" />
            </div>
          </div>
          <!-- Макс. чек -->
          <div class="cf-group">
            <div class="cf-group-label">Макс. чек, ₽</div>
            <div class="cf-range">
              <input type="number" v-model="filterMaxMin" placeholder="от" class="cf-input" @input="onNumberFilterInput" min="0" />
              <span class="cf-range-sep">—</span>
              <input type="number" v-model="filterMaxMax" placeholder="до" class="cf-input" @input="onNumberFilterInput" min="0" />
            </div>
          </div>
          <!-- Сортировка -->
          <div class="cf-group">
            <div class="cf-group-label">Сортировка</div>
            <div class="cf-sort">
              <select v-model="filterSortBy" class="cf-select" @change="applyFilters()">
                <option value="">— без сортировки —</option>
                <option value="name">Имя</option>
                <option value="sales_amount">Продажи</option>
                <option value="receipts_count">Чеки</option>
                <option value="avg_receipt">Ср. чек</option>
                <option value="max_receipt">Макс. чек</option>
                <option value="created_at">Дата создания</option>
              </select>
              <div v-if="filterSortBy" class="cf-chips">
                <button class="cf-chip" :class="{ 'cf-chip--on': filterSortOrder === 'asc' }" @click="filterSortOrder = 'asc'; applyFilters()">↑ По возр.</button>
                <button class="cf-chip" :class="{ 'cf-chip--on': filterSortOrder === 'desc' }" @click="filterSortOrder = 'desc'; applyFilters()">↓ По убыв.</button>
              </div>
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
        Свайп ← → · Тап = редактировать
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
        >Загружено: <b>{{ clients.length }}</b> /
        <b>{{ totalClients }}</b></span
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

    <!-- AG GRID -->
    <div class="grid-wrap" :class="{ 'grid-wrap--loading': isLoadingClients }">
      <!-- Skeleton-загрузка поверх таблицы при первой загрузке / поиске -->
      <Transition name="fade">
        <div
          v-if="isLoadingClients && clients.length === 0"
          class="grid-skeleton"
        >
          <div class="skeleton-header">
            <div class="skeleton-hcell" v-for="n in 7" :key="n"></div>
          </div>
          <div class="skeleton-row" v-for="r in 12" :key="r">
            <div class="skeleton-cell" v-for="c in 7" :key="c">
              <div
                class="skeleton-bar"
                :style="{ width: 40 + Math.random() * 50 + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Полоска сверху при обновлении когда данные уже есть -->
      <Transition name="fade">
        <div
          v-if="isLoadingClients && clients.length > 0"
          class="grid-refresh-bar"
        >
          <div class="grid-refresh-progress"></div>
        </div>
      </Transition>

      <AgGridVue
        :style="{ width: '100%', height: '100%' }"
        :theme="clientsTheme"
        :columnDefs="columnDefs"
        :defaultColDef="defaultColDef"
        :rowData="clients"
        :rowSelection="rowSelection"
        :selectionColumnDef="selectionColumnDef"
        :getRowId="getRowId"
        :animateRows="true"
        :enableCellTextSelection="true"
        :undoRedoCellEditing="true"
        :undoRedoCellEditingLimit="20"
        :tooltipShowDelay="300"
        :tooltipMouseTrack="true"
        :stopEditingWhenCellsLoseFocus="true"
        :singleClickEdit="true"
        :suppressDragLeaveHidesColumns="true"
        overlayNoRowsTemplate='<div class="ov-empty"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span>Клиенты не найдены</span></div>'
        @grid-ready="onGridReadyHandler"
        @cell-value-changed="onCellValueChanged"
        @selection-changed="onSelectionChanged"
        @first-data-rendered="onFirstDataRendered"
        @grid-size-changed="onGridSizeChanged"
      />

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
    </div>

    <!-- FOOTER -->
    <footer class="page-footer">
      <div class="footer-l">
        <span v-if="selectedCount > 0"
          >Выбрано: <b>{{ selectedCount }}</b></span
        >
        <span
          >Загружено: <b>{{ clients.length }}</b> из
          <b>{{ totalClients }}</b></span
        >
        <span v-if="isLoadingMore" class="footer-loading">подгрузка...</span>
      </div>
      <div class="footer-r">
        <span class="footer-tip"
          >Клик по ячейке → редактирование · Даты: ДД.ММ.ГГГГ</span
        >
      </div>
    </footer>
  </div>

  <!-- Detail modal -->
  <ClientDetailModal
    :moysklad-id="detailMoyskladId"
    @close="detailMoyskladId = null"
    @delete="handleDetailDelete"
  />

  <!-- Create modal -->
  <ClientCreateModal
    :open="showAddForm"
    :sources="CLIENT_SOURCES"
    @close="showAddForm = false"
    @create="handleAddClient"
  />
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
.clients-page {
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
  max-width: 400px;
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
.hbtn--danger {
  background: var(--er);
  color: #fff;
}
.hbtn--danger:hover:not(:disabled) {
  background: #b91c1c;
}
.hbtn--xs {
  padding: 5px 9px;
  font-size: 11px;
}
.hbtn--active {
  background: var(--prl);
  color: var(--pr);
  border-color: var(--pr);
}
.icon-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--rs);
  border: none;
  background: none;
  color: var(--txm);
  cursor: pointer;
  transition: all var(--tr);
}
.icon-close:hover {
  background: var(--sfh);
  color: var(--tx);
}
/* ── Stats panel ── */
.stats-panel {
  background: var(--sf);
  border-bottom: 1px solid var(--bd);
  flex-shrink: 0;
}
.stats-period {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--bd);
  flex-wrap: wrap;
}
.stats-period-dates {
  display: flex;
  align-items: center;
  gap: 6px;
}
.stats-date-field {
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
  color: var(--tx2);
}
.stats-date-input {
  padding: 5px 8px;
  border: 1px solid var(--bd);
  border-radius: var(--rs);
  font: 500 11px var(--fn);
  background: var(--bg);
  color: var(--tx);
  outline: none;
  transition: all var(--tr);
  width: 130px;
}
.stats-date-input:focus {
  border-color: var(--pr);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
  background: var(--sf);
}
.stats-date-sep {
  color: var(--txm);
  font-size: 12px;
  user-select: none;
}
.stats-loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--pr);
  animation: pulse 1s ease-in-out infinite;
  margin-left: 4px;
}
.stats-presets {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.stats-preset {
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid var(--bd);
  background: var(--sf);
  color: var(--tx2);
  font: 600 10px/1 var(--fn);
  cursor: pointer;
  transition: all var(--tr);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.stats-preset:hover {
  background: var(--sfh);
  color: var(--tx);
  border-color: var(--bds);
}
.stats-preset--on {
  background: var(--pr);
  color: #fff;
  border-color: var(--pr);
}
.stats-preset--on:hover {
  background: var(--prh);
  border-color: var(--prh);
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
  min-width: 120px;
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
.add-panel {
  background: var(--sf);
  border-bottom: 1px solid var(--bd);
  padding: 14px 16px 0;
  flex-shrink: 0;
  max-height: 55vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.add-panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-shrink: 0;
}
.add-panel-top h3 {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
}
.add-form {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}
.type-switcher {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
  flex-shrink: 0;
}
.type-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: var(--rs);
  border: 1px solid var(--bd);
  background: var(--sf);
  color: var(--tx2);
  font: 600 11px/1 var(--fn);
  cursor: pointer;
  transition: all var(--tr);
  flex: 1;
  justify-content: center;
}
.type-btn:hover {
  background: var(--sfh);
  color: var(--tx);
  border-color: var(--bds);
}
.type-btn--on {
  background: var(--pr);
  color: #fff;
  border-color: var(--pr);
}
.type-btn--on:hover {
  background: var(--prh);
  border-color: var(--prh);
}
.add-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  align-items: end;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}
.fg--full {
  grid-column: 1/-1;
}
.fg {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.fg label {
  font: 600 10px/1 var(--fn);
  color: var(--tx2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.fg--req label::after {
  content: " *";
  color: var(--er);
}
.fg input,
.fg select {
  padding: 7px 9px;
  border: 1px solid var(--bd);
  border-radius: var(--rs);
  font: 400 12px var(--fn);
  background: var(--sf);
  color: var(--tx);
  transition: border-color var(--tr);
  outline: none;
}
.fg input:focus,
.fg select:focus {
  border-color: var(--pr);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
.fg input::placeholder {
  color: var(--txm);
}
.fg--chk {
  justify-content: flex-end;
}
.chk-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font: 500 12px var(--fn) !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
  color: var(--tx) !important;
}
.chk-label input[type="checkbox"] {
  width: 15px;
  height: 15px;
  accent-color: var(--pr);
  cursor: pointer;
}
.add-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  padding: 10px 0;
  border-top: 1px solid var(--bd);
  flex-shrink: 0;
  background: var(--sf);
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
  color: var(--tx);
}
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
.clients-page--fs .page-header,
.clients-page--fs .stats-panel,
.clients-page--fs .cf-panel,
.clients-page--fs .add-panel,
.clients-page--fs .page-footer {
  display: none !important;
}
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

/* ── Skeleton загрузка (первая загрузка) ── */
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
.skeleton-row:nth-child(2) .skeleton-bar {
  animation-delay: 0.1s;
}
.skeleton-row:nth-child(3) .skeleton-bar {
  animation-delay: 0.2s;
}
.skeleton-row:nth-child(4) .skeleton-bar {
  animation-delay: 0.3s;
}
.skeleton-row:nth-child(5) .skeleton-bar {
  animation-delay: 0.4s;
}
.skeleton-row:nth-child(6) .skeleton-bar {
  animation-delay: 0.15s;
}
.skeleton-row:nth-child(7) .skeleton-bar {
  animation-delay: 0.25s;
}
.skeleton-row:nth-child(8) .skeleton-bar {
  animation-delay: 0.35s;
}
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

/* ── Полоска обновления (данные уже есть) ── */
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

/* ── Индикатор подгрузки снизу ── */
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
.loading-dots span:nth-child(2) {
  animation-delay: 0.15s;
}
.loading-dots span:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes dot-bounce {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* ── Empty overlay ── */
.ov-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--txm);
  font: 400 14px var(--fn);
  padding: 40px 20px;
}
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
  gap: 14px;
}
.footer-l b {
  color: var(--tx);
  font-family: var(--fm);
}
.footer-tip {
  font-style: italic;
  color: var(--txm);
  font-size: 11px;
}
.footer-loading {
  color: var(--pr);
  font-weight: 500;
  animation: pulse 1s ease-in-out infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
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
  max-height: 700px;
}
.fold-leave-from {
  opacity: 1;
  max-height: 700px;
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
.slide-up-enter-active {
  transition: all 200ms ease-out;
}
.slide-up-leave-active {
  transition: all 150ms ease-in;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.slide-up-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.slide-up-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
/* ── hbtn badge ── */
.hbtn-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--pr);
  color: #fff;
  font: 700 9px/1 var(--fm);
}
.hbtn--active .hbtn-badge {
  background: var(--prh);
}

/* ── Filter panel ── */
.cf-panel {
  position: relative;
  background: var(--sf);
  border-bottom: 1px solid var(--bd);
  flex-shrink: 0;
}
.cf-reset-btn {
  position: absolute;
  top: 8px;
  right: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  border-radius: var(--rs);
  border: 1px solid var(--bd);
  background: none;
  color: var(--tx2);
  font: 600 10px/1 var(--fn);
  cursor: pointer;
  transition: all var(--tr);
  white-space: nowrap;
}
.cf-reset-btn:hover {
  background: var(--erl);
  color: var(--er);
  border-color: var(--er);
}
.cf-inner {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 10px 16px;
  flex-wrap: wrap;
}
.cf-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.cf-group-label {
  font: 600 10px/1 var(--fn);
  color: var(--tx2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.cf-chips {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.cf-chip {
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid var(--bd);
  background: var(--sf);
  color: var(--tx2);
  font: 600 10px/1 var(--fn);
  cursor: pointer;
  transition: all var(--tr);
  white-space: nowrap;
}
.cf-chip:hover {
  background: var(--sfh);
  color: var(--tx);
  border-color: var(--bds);
}
.cf-chip--on {
  background: var(--pr);
  color: #fff;
  border-color: var(--pr);
}
.cf-chip--on:hover {
  background: var(--prh);
  border-color: var(--prh);
}
.cf-range {
  display: flex;
  align-items: center;
  gap: 5px;
}
.cf-range-sep {
  color: var(--txm);
  font-size: 11px;
}
.cf-input {
  width: 80px;
  padding: 5px 7px;
  border: 1px solid var(--bd);
  border-radius: var(--rs);
  font: 400 11px var(--fn);
  background: var(--bg);
  color: var(--tx);
  transition: border-color var(--tr);
  outline: none;
}
.cf-input:focus {
  border-color: var(--pr);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.08);
  background: var(--sf);
}
.cf-input::placeholder {
  color: var(--txm);
}
.cf-input::-webkit-inner-spin-button,
.cf-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  appearance: none;
}
.cf-input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}
.cf-sort {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.cf-select {
  padding: 5px 8px;
  border: 1px solid var(--bd);
  border-radius: var(--rs);
  font: 500 11px var(--fn);
  background: var(--bg);
  color: var(--tx);
  transition: border-color var(--tr);
  outline: none;
  cursor: pointer;
}
.cf-select:focus {
  border-color: var(--pr);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.08);
  background: var(--sf);
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
  .stats-period {
    flex-direction: column;
    padding: 6px 12px;
    gap: 6px;
    align-items: stretch;
  }
  .stats-period-dates {
    justify-content: center;
  }
  .stats-date-input {
    width: 115px;
    font-size: 10px;
  }
  .stats-presets {
    justify-content: center;
  }
  .stats-row {
    padding: 8px 12px;
    gap: 6px;
  }
  .scard {
    min-width: 105px;
    padding: 6px 8px;
  }
  .scard-val {
    font-size: 13px;
  }
  .add-panel {
    padding: 10px 12px 0;
    max-height: 60vh;
  }
  .add-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .page-footer {
    flex-direction: column;
    gap: 2px;
    padding: 5px 12px;
    text-align: center;
  }
  .footer-tip {
    display: none;
  }
  .grid-wrap {
    touch-action: auto;
  }
}
@media (min-width: 400px) and (max-width: 768px) {
  .hbtn-text {
    display: inline;
  }
}
@media (max-width: 480px) {
  .add-grid {
    grid-template-columns: 1fr;
  }
  .scard {
    min-width: 95px;
  }
  .scard-ico {
    width: 28px;
    height: 28px;
  }
  .scard-ico svg {
    width: 13px;
    height: 13px;
  }
}
</style>
