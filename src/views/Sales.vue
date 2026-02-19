<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from "vue";
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
import type {
  GridApi,
  GridReadyEvent,
  ColDef,
  FirstDataRenderedEvent,
  GridSizeChangedEvent,
} from "ag-grid-community";

// Регистрация модулей AG Grid
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

// Тема для AG Grid (стиль как у клиентов)
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

interface Sale {
  id: string;
  saleDate: string;
  clientName: string;
  seller: string;
  amount: number;
  status?: "completed" | "pending" | "cancelled";
  products?: string[];
  notes?: string;
}

const gridApi = ref<GridApi | null>(null);
const searchText = ref("");
const showStatsPanel = ref(false);
const selectedCount = ref(0);
const isMobile = ref(false);
const isFullscreen = ref(false);
const isLoading = ref(false);
const isExporting = ref(false);

// Тестовые данные продаж
const sales = ref<Sale[]>([
  {
    id: "1",
    saleDate: "2024-01-15T10:30:00",
    clientName: 'ООО "Рога и копыта"',
    seller: "Иван Петров",
    amount: 125000,
    status: "completed",
    products: ["Оборудование А", "Услуга Б"],
    notes: "Постоянный клиент, скидка 5%",
  },
  {
    id: "2",
    saleDate: "2024-01-15T11:45:00",
    clientName: "Василий Сидоров",
    seller: "Анна Смирнова",
    amount: 67500,
    status: "pending",
    products: ["Товар В"],
    notes: "Ожидает подтверждения",
  },
  {
    id: "3",
    saleDate: "2024-01-14T16:20:00",
    clientName: "ИП Морозов А.В.",
    seller: "Петр Николаев",
    amount: 89000,
    status: "completed",
    products: ["Услуга Г", "Товар Д"],
  },
  {
    id: "4",
    saleDate: "2024-01-14T14:10:00",
    clientName: 'ООО "Стройка+"',
    seller: "Мария Иванова",
    amount: 156000,
    status: "cancelled",
    products: ["Оборудование Е"],
    notes: "Клиент отказался от покупки",
  },
  {
    id: "5",
    saleDate: "2024-01-15T13:30:00",
    clientName: "Елена Волкова",
    seller: "Иван Петров",
    amount: 34500,
    status: "pending",
    products: ["Товар Ж"],
  },
  {
    id: "6",
    saleDate: "2024-01-13T09:15:00",
    clientName: "Дмитрий Козлов",
    seller: "Анна Смирнова",
    amount: 98700,
    status: "completed",
  },
  {
    id: "7",
    saleDate: "2024-01-12T15:40:00",
    clientName: 'ЗАО "Техносервис"',
    seller: "Петр Николаев",
    amount: 245000,
    status: "completed",
  },
  {
    id: "8",
    saleDate: "2024-01-12T11:20:00",
    clientName: "Ольга Семенова",
    seller: "Иван Петров",
    amount: 52300,
    status: "completed",
  },
]);

// Функция форматирования валюты
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
  }).format(value);
};

// Функция форматирования даты
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

// Определение колонок таблицы
const columnDefs = ref<ColDef[]>([
  {
    field: "id",
    headerName: "№",
    width: 70,
    pinned: "left",
    sortable: true,
    filter: "agTextColumnFilter",
  },
  {
    field: "saleDate",
    headerName: "Дата продажи",
    width: 160,
    sortable: true,
    filter: "agDateColumnFilter",
    valueFormatter: (params) => {
      return params.value ? formatDate(params.value) : "";
    },
  },
  {
    field: "clientName",
    headerName: "Покупатель",
    flex: 1,
    minWidth: 200,
    sortable: true,
    filter: "agTextColumnFilter",
    editable: false,
  },
  {
    field: "seller",
    headerName: "Продавец",
    width: 150,
    sortable: true,
    filter: "agTextColumnFilter",
  },
  {
    field: "amount",
    headerName: "Сумма",
    width: 140,
    sortable: true,
    filter: "agNumberColumnFilter",
    valueFormatter: (params) => {
      return formatCurrency(params.value);
    },
    cellStyle: {
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 600,
    },
  },
]);

const defaultColDef = ref<ColDef>({
  sortable: true,
  filter: true,
  resizable: true,
  suppressMovable: false,
});

// Настройки выбора строк (чекбоксы)
const rowSelection = ref<any>({
  mode: "multiRow",
  enableClickSelection: false,
});

const selectionColumnDef = ref({
  width: 42,
  minWidth: 42,
  maxWidth: 42,
  suppressHeaderMenuButton: true,
  sortable: false,
  pinned: "left" as const,
});

// Статистика
const displayStats = computed(() => {
  const total = sales.value.length;
  const completed = sales.value.filter((s) => s.status === "completed").length;
  const totalAmount = sales.value
    .filter((s) => s.status === "completed")
    .reduce((sum, sale) => sum + sale.amount, 0);
  const avgReceipt = completed > 0 ? totalAmount / completed : 0;

  return {
    total,
    completed,
    totalAmount,
    avgReceipt,
  };
});

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

const onGridReady = (params: GridReadyEvent) => {
  gridApi.value = params.api;
  if (!isMobile.value) {
    params.api.sizeColumnsToFit();
  }
};

const onFirstDataRendered = (params: FirstDataRenderedEvent) => {
  if (!isMobile.value) {
    params.api.sizeColumnsToFit();
  }
};

const onGridSizeChanged = (params: GridSizeChangedEvent) => {
  if (!isMobile.value && params.api) {
    params.api.sizeColumnsToFit();
  }
};

const onSelectionChanged = () => {
  if (gridApi.value) {
    selectedCount.value = gridApi.value.getSelectedRows().length;
  }
};

const setQuickFilter = (text: string) => {
  if (gridApi.value) {
    gridApi.value.setGridOption("quickFilterText", text);
  }
};

watch(searchText, (val) => {
  setQuickFilter(val);
});

const handleRefresh = async () => {
  isLoading.value = true;
  await new Promise((resolve) => setTimeout(resolve, 800));
  isLoading.value = false;
};

const handleExport = () => {
  if (gridApi.value) {
    isExporting.value = true;
    gridApi.value.exportDataAsCsv({
      fileName: `sales_${new Date().toISOString().slice(0, 10)}.csv`,
    });
    setTimeout(() => {
      isExporting.value = false;
    }, 500);
  }
};

const clearAllFilters = () => {
  if (gridApi.value) {
    gridApi.value.setFilterModel(null);
    searchText.value = "";
  }
};

const openDetail = () => {
  if (gridApi.value) {
    const selected = gridApi.value.getSelectedRows();
    if (selected.length === 1) {
      console.log("Открыть детали продажи:", selected[0]);
      // TODO: открыть модальное окно с деталями
    }
  }
};

const handleDeleteSelected = async () => {
  if (gridApi.value) {
    const selected = gridApi.value.getSelectedRows();
    if (selected.length === 0) return;
    if (!confirm(`Удалить ${selected.length} продаж(и)?`)) return;

    // TODO: реализовать удаление через API
    const selectedIds = selected.map((s: Sale) => s.id);
    sales.value = sales.value.filter((s) => !selectedIds.includes(s.id));
    selectedCount.value = 0;
  }
};

const getRowId = (params: any) => {
  return params.data?.id || `__tmp_${Date.now()}`;
};

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
});
</script>

<template>
  <div class="sales-page" :class="{ 'sales-page--fs': isFullscreen }">
    <!-- HEADER + TOOLBAR -->
    <header class="page-header">
      <div class="header-left">
        <h1 class="header-title">Продажи</h1>
        <span class="badge-count">{{ displayStats.total }}</span>
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
          placeholder="Поиск по клиенту, продавцу..."
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
          @click="clearAllFilters"
          title="Сброс фильтров"
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
        <Transition name="fade">
          <button
            v-if="selectedCount === 1"
            class="hbtn hbtn--ghost"
            @click="openDetail"
            title="Подробнее о продаже"
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
            title="Удалить выбранные"
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
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div class="scard-body">
              <span class="scard-val">{{ displayStats.total }}</span
              ><span class="scard-lbl">Всего продаж</span>
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
              <span class="scard-val">{{ displayStats.completed }}</span
              ><span class="scard-lbl">Завершено</span>
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
                <path d="M6 3v18" />
                <path d="M6 12h8a4 4 0 0 0 0-8H6" />
                <path d="M4 16h10" />
              </svg>
            </div>
            <div class="scard-body">
              <span class="scard-val">{{
                formatCurrency(displayStats.totalAmount)
              }}</span
              ><span class="scard-lbl">Оборот</span>
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
        >Продаж: <b>{{ sales.length }}</b></span
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
    <div class="grid-wrap" :class="{ 'grid-wrap--loading': isLoading }">
      <!-- Skeleton загрузка -->
      <Transition name="fade">
        <div
          v-if="isLoading && sales.length === 0"
          class="grid-skeleton"
        >
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

      <!-- Полоска обновления -->
      <Transition name="fade">
        <div
          v-if="isLoading && sales.length > 0"
          class="grid-refresh-bar"
        >
          <div class="grid-refresh-progress"></div>
        </div>
      </Transition>

      <AgGridVue
        :style="{ width: '100%', height: '100%' }"
        :theme="salesTheme"
        :columnDefs="columnDefs"
        :defaultColDef="defaultColDef"
        :rowData="sales"
        :rowSelection="rowSelection"
        :selectionColumnDef="selectionColumnDef"
        :getRowId="getRowId"
        :animateRows="true"
        :enableCellTextSelection="true"
        :tooltipShowDelay="300"
        :tooltipMouseTrack="true"
        :suppressDragLeaveHidesColumns="true"
        overlayNoRowsTemplate='<div class="ov-empty"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>Продажи не найдены</span></div>'
        @grid-ready="onGridReady"
        @selection-changed="onSelectionChanged"
        @first-data-rendered="onFirstDataRendered"
        @grid-size-changed="onGridSizeChanged"
      />
    </div>

    <!-- FOOTER -->
    <footer class="page-footer">
      <div class="footer-l">
        <span v-if="selectedCount > 0"
          >Выбрано: <b>{{ selectedCount }}</b></span
        >
        <span
          >Продаж: <b>{{ sales.length }}</b></span
        >
      </div>
      <div class="footer-r">
        <span class="footer-tip"
          >Выберите строки чекбоксами для действий</span
        >
      </div>
    </footer>
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
.hbtn--active {
  background: var(--prl);
  color: var(--pr);
  border-color: var(--pr);
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
.sales-page--fs .page-footer {
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
.skeleton-bar {
  height: 10px;
  background: linear-gradient(90deg, var(--bd) 25%, #e8edf3 50%, var(--bd) 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: skeleton-shimmer 1.8s ease-in-out infinite;
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
</style>
