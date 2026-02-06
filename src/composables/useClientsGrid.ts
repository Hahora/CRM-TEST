// composables/useClientsGrid.ts

import { ref } from "vue";
import type { Client, ClientsStats } from "@/types/clients";
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  ValueFormatterParams,
  ValueSetterParams,
} from "ag-grid-community";

export const CLIENT_SOURCES = [
  "Instagram",
  "Facebook",
  "TikTok",
  "YouTube",
  "Рекомендация друга",
  "Сайт",
  "Яндекс",
  "Google",
  "Вывеска",
  "Листовка",
  "Другое",
] as const;

export function useClientsGrid() {
  const gridApi = ref<GridApi | null>(null);
  const isLoading = ref(false);
  const totalRows = ref(0);
  const stats = ref<ClientsStats>({
    total_clients: 0,
    total_spent: 0,
    average_purchase: 0,
    new_clients_this_month: 0,
    active_clients: 0,
  });

  const formatCurrency = (value: number | undefined | null): string => {
    if (value == null) return "—";
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (value: string | undefined | null): string => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const formatDateTime = (value: string | undefined | null): string => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const parseDateInput = (value: string | null | undefined): string | null => {
    if (!value || !value.trim()) return null;
    const v = value.trim();

    // Уже в формате YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

    // ДД.ММ.ГГГГ или ДД/ММ/ГГГГ или ДД-ММ-ГГГГ
    const match = v.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
    if (match) {
      const day = match[1].padStart(2, "0");
      const month = match[2].padStart(2, "0");
      const year = match[3];
      return `${year}-${month}-${day}`;
    }

    return null;
  };

  // ══════════════════════════════════════════
  // Определения колонок — AG Grid v35
  //
  // Маппинг полей бэкенда:
  //   name          — имя клиента (не full_name)
  //   phone         — телефон
  //   email         — почта
  //   sex           — пол (MALE / FEMALE)
  //   birth_date    — дата рождения
  //   sales_amount  — сумма продаж
  //   total_spent   — потрачено
  //   moysklad_id   — ID в МойСклад
  //   telegram_id   — Telegram (локальное)
  //   max_id        — МАКС ID (локальное)
  //   is_wedding    — свадьба (локальное)
  //   wedding_date  — дата свадьбы (локальное)
  //   bride_name    — имя невесты (локальное)
  //   source        — откуда узнал (локальное)
  //   notes         — заметки (локальное)
  //   description   — описание
  //   created_at    — создан
  //   updated_at    — обновлён
  //
  // НЕ используем checkboxSelection / headerCheckboxSelection
  // (deprecated в v32.2+), чекбоксы через rowSelection в GridOptions
  // ══════════════════════════════════════════
  const columnDefs: ColDef[] = [
    {
      headerName: "№",
      valueGetter: "node.rowIndex + 1",
      width: 70,
      minWidth: 60,
      maxWidth: 90,
      sortable: false,
      filter: false,
      editable: false,
      suppressHeaderMenuButton: true,
      cellStyle: {
        color: "#94A3B8",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "11px",
        textAlign: "center",
      },
    },
    {
      headerName: "Имя",
      field: "name",
      minWidth: 160,
      width: 210,
      editable: true,
      filter: "agTextColumnFilter",
      filterParams: {
        filterOptions: ["contains", "startsWith"],
        debounceMs: 300,
      },
      cellStyle: { fontWeight: "600" },
    },
    {
      headerName: "Телефон",
      field: "phone",
      minWidth: 140,
      width: 160,
      editable: true,
      filter: "agTextColumnFilter",
      cellStyle: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
      },
    },
    {
      headerName: "Почта",
      field: "email",
      minWidth: 160,
      width: 200,
      editable: true,
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Пол",
      field: "sex",
      width: 90,
      minWidth: 75,
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: ["MALE", "FEMALE", ""],
      },
      valueFormatter: (params: ValueFormatterParams) => {
        switch (params.value) {
          case "MALE":
          case "male":
            return "М";
          case "FEMALE":
          case "female":
            return "Ж";
          default:
            return "—";
        }
      },
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Дата рождения",
      field: "birth_date",
      width: 145,
      minWidth: 125,
      editable: true,
      cellEditor: "agTextCellEditor",
      valueFormatter: (params: ValueFormatterParams) =>
        formatDate(params.value),
      valueGetter: (params: any) => params.data?.birth_date || null,
      valueSetter: (params: ValueSetterParams) => {
        const raw = params.newValue;
        if (!raw || !raw.trim()) {
          params.data.birth_date = null;
          return true;
        }
        const parsed = parseDateInput(raw);
        if (parsed) {
          params.data.birth_date = parsed;
          return true;
        }
        // Не удалось распарсить — не сохраняем
        return false;
      },
      tooltipValueGetter: (params: any) =>
        params.value
          ? `${formatDate(params.value)} · Введите: ДД.ММ.ГГГГ`
          : "Кликните и введите: ДД.ММ.ГГГГ",
      filter: "agDateColumnFilter",
    },
    {
      headerName: "Telegram",
      field: "telegram_id",
      width: 130,
      minWidth: 100,
      editable: true,
      filter: "agTextColumnFilter",
    },
    {
      headerName: "МАКС ID",
      field: "max_id",
      width: 110,
      minWidth: 90,
      editable: true,
      filter: "agTextColumnFilter",
    },
    // ── Статистика продаж ──
    {
      headerName: "Продажи",
      field: "sales_amount",
      width: 135,
      minWidth: 110,
      editable: false,
      filter: "agNumberColumnFilter",
      valueFormatter: (params: ValueFormatterParams) =>
        formatCurrency(params.value),
      cellStyle: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
        textAlign: "right",
      },
    },

    // ── Свадьба (локальные поля) ──
    {
      headerName: "Свадьба",
      field: "is_wedding",
      width: 100,
      minWidth: 85,
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: [true, false],
      },
      valueFormatter: (params: ValueFormatterParams) => {
        if (params.value === true) return "ДА";
        if (params.value === false) return "НЕТ";
        return "—";
      },
      valueParser: (params: any) => {
        if (params.newValue === true || params.newValue === "true") return true;
        return false;
      },
      valueSetter: (params: ValueSetterParams) => {
        const isWedding = params.newValue === true;
        params.data.is_wedding = isWedding;
        if (!isWedding) {
          params.data.wedding_date = null;
          params.data.bride_name = null;
        }
        return true;
      },
      cellStyle: (params: any) => {
        if (params.value === true) {
          return {
            backgroundColor: "#ECFDF5",
            color: "#059669",
            fontWeight: "700",
            textAlign: "center",
          };
        }
        return { color: "#94A3B8", textAlign: "center" };
      },
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Дата свадьбы",
      field: "wedding_date",
      width: 145,
      minWidth: 125,
      editable: (params: any) => params.data?.is_wedding === true,
      cellEditor: "agTextCellEditor",
      valueFormatter: (params: ValueFormatterParams) =>
        formatDate(params.value),
      valueGetter: (params: any) => params.data?.wedding_date || null,
      valueSetter: (params: ValueSetterParams) => {
        const raw = params.newValue;
        if (!raw || !raw.trim()) {
          params.data.wedding_date = null;
          return true;
        }
        const parsed = parseDateInput(raw);
        if (parsed) {
          params.data.wedding_date = parsed;
          return true;
        }
        return false;
      },
      tooltipValueGetter: (params: any) => {
        if (params.data?.is_wedding !== true)
          return "Сначала включите флаг Свадьба";
        return params.value
          ? `${formatDate(params.value)} · Введите: ДД.ММ.ГГГГ`
          : "Кликните и введите: ДД.ММ.ГГГГ";
      },
      cellStyle: (params: any) => {
        if (params.data?.is_wedding !== true) {
          return {
            backgroundColor: "#F1F5F9",
            color: "#CBD5E1",
            fontStyle: "italic",
            cursor: "not-allowed",
          };
        }
        return null;
      },
      filter: "agDateColumnFilter",
    },
    {
      headerName: "Имя невесты",
      field: "bride_name",
      width: 145,
      minWidth: 115,
      editable: (params: any) => params.data?.is_wedding === true,
      filter: "agTextColumnFilter",
      tooltipValueGetter: (params: any) => {
        if (params.data?.is_wedding !== true)
          return "Сначала включите флаг Свадьба";
        return params.value || "Пусто — кликните для ввода";
      },
      cellStyle: (params: any) => {
        if (params.data?.is_wedding !== true) {
          return {
            backgroundColor: "#F1F5F9",
            color: "#CBD5E1",
            fontStyle: "italic",
            cursor: "not-allowed",
          };
        }
        return null;
      },
    },
    // ── Откуда узнал (локальное) ──
    {
      headerName: "Откуда узнал",
      field: "source",
      width: 145,
      minWidth: 115,
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: ["", ...CLIENT_SOURCES],
      },
      valueFormatter: (params: ValueFormatterParams) => params.value || "—",
      filter: "agTextColumnFilter",
    },

    // ── МойСклад ID ──
    {
      headerName: "МС ID",
      field: "moysklad_id",
      width: 120,
      minWidth: 100,
      editable: false,
      filter: "agTextColumnFilter",
      cellStyle: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10px",
        color: "#94A3B8",
      },
    },
    // ── МойСклад ID ──
  ];

  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    suppressMovable: false,
    wrapHeaderText: true,
    autoHeaderHeight: true,
  };

  const onGridReady = (params: GridReadyEvent) => {
    gridApi.value = params.api;
  };

  const exportToCsv = () => {
    if (!gridApi.value) return;
    const today = new Date()
      .toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\./g, "-");
    gridApi.value.exportDataAsCsv({
      fileName: `клиенты_экспорт_${today}.csv`,
      columnSeparator: ";",
      processCellCallback: (params) => {
        const colId = params.column.getColId();
        if (colId === "sex") {
          return params.value === "MALE"
            ? "Мужской"
            : params.value === "FEMALE"
            ? "Женский"
            : "";
        }
        if (colId === "is_wedding") {
          return params.value === true ? "Да" : "Нет";
        }
        if (colId === "total_spent" || colId === "sales_amount") {
          return params.value != null ? String(params.value) : "0";
        }
        return params.value;
      },
    });
  };

  const setQuickFilter = (text: string) => {
    if (!gridApi.value) return;
    gridApi.value.setGridOption("quickFilterText", text);
  };

  const getSelectedRows = (): Client[] => {
    if (!gridApi.value) return [];
    return gridApi.value.getSelectedRows();
  };

  const clearAllFilters = () => {
    if (!gridApi.value) return;
    gridApi.value.setFilterModel(null);
    gridApi.value.setGridOption("quickFilterText", "");
  };

  const sizeColumnsToFit = () => {
    if (!gridApi.value) return;
    gridApi.value.sizeColumnsToFit();
  };

  return {
    gridApi,
    isLoading,
    totalRows,
    stats,
    columnDefs,
    defaultColDef,
    onGridReady,
    exportToCsv,
    setQuickFilter,
    getSelectedRows,
    clearAllFilters,
    sizeColumnsToFit,
    formatCurrency,
    formatDate,
    formatDateTime,
  };
}
