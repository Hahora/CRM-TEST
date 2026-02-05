// composables/useVisitsGrid.ts

import { ref } from "vue";
import type { Visit, VisitsStats } from "@/types/visits";
import { VISIT_STATUSES, VISIT_SOURCES } from "@/types/visits";
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  ValueFormatterParams,
  ValueSetterParams,
} from "ag-grid-community";

export function useVisitsGrid() {
  const gridApi = ref<GridApi | null>(null);

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

  const formatTime = (value: string | undefined | null): string => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  // Конвертирует ввод ДД.ММ.ГГГГ → YYYY-MM-DD
  const parseDateInput = (value: string | null | undefined): string | null => {
    if (!value || !value.trim()) return null;
    const v = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const match = v.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
    if (match) {
      const day = match[1].padStart(2, "0");
      const month = match[2].padStart(2, "0");
      const year = match[3];
      return `${year}-${month}-${day}`;
    }
    return null;
  };

  // ── Цвета статусов для ячеек ──
  const getStatusStyle = (status: string) => {
    const s = VISIT_STATUSES.find((st) => st.value === status);
    if (!s) return { color: "#64748B", textAlign: "center" as const };
    return {
      backgroundColor: s.bg,
      color: s.color,
      fontWeight: "700" as const,
      textAlign: "center" as const,
    };
  };

  // ── Цвета строк по статусу ──
  const getRowStyle = (params: any) => {
    const status = params.data?.status;
    switch (status) {
      case "hold_no_deposit":
        return { backgroundColor: "#FFFBEB" }; // оранжевое
      case "hold_deposit":
        return { backgroundColor: "#EFF6FF" }; // синее
      case "purchased":
      case "redeemed":
      case "redeemed_deposit":
        return { backgroundColor: "#F0FDF4" }; // зелёное
      case "not_purchased":
      case "no_show":
        return { backgroundColor: "#FEF2F2" }; // красное
      default:
        return undefined;
    }
  };

  // ══════════════════════════════════════════
  // Определения колонок
  // ══════════════════════════════════════════

  const statusValues = VISIT_STATUSES.map((s) => s.value);
  const statusLabels = VISIT_STATUSES.map((s) => s.label);

  const columnDefs: ColDef[] = [
    // ── № ──
    {
      headerName: "№",
      valueGetter: "node.rowIndex + 1",
      width: 60,
      minWidth: 50,
      maxWidth: 80,
      sortable: false,
      filter: false,
      editable: false,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      suppressHeaderMenuButton: true,
      cellStyle: {
        color: "#94A3B8",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "11px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      },
    },
    // ── Дата/время ──
    {
      headerName: "Дата и время",
      field: "visit_datetime",
      width: 155,
      minWidth: 130,
      editable: true,
      cellEditor: "agTextCellEditor",
      cellEditorParams: { useFormatter: true },
      valueFormatter: (p: ValueFormatterParams) => formatDateTime(p.value),
      valueSetter: (p: ValueSetterParams) => {
        // Принимает ДД.ММ.ГГГГ ЧЧ:ММ или ISO
        const raw = p.newValue?.trim();
        if (!raw) return false;
        // Если уже ISO
        if (raw.includes("T")) {
          p.data.visit_datetime = raw;
          return true;
        }
        // ДД.ММ.ГГГГ ЧЧ:ММ
        const m = raw.match(
          /^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})\s+(\d{1,2}):(\d{2})$/
        );
        if (m) {
          p.data.visit_datetime = `${m[3]}-${m[2].padStart(
            2,
            "0"
          )}-${m[1].padStart(2, "0")}T${m[4].padStart(2, "0")}:${m[5]}:00`;
          return true;
        }
        return false;
      },
      tooltipValueGetter: (p: any) =>
        p.value
          ? `${formatDateTime(p.value)} (формат: ДД.ММ.ГГГГ ЧЧ:ММ)`
          : "Кликните для ввода",
      filter: "agDateColumnFilter",
      sort: "desc",
      cellStyle: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
      },
    },
    // ── Имя клиента ──
    {
      headerName: "Клиент",
      field: "client_name",
      minWidth: 160,
      width: 200,
      editable: true,
      filter: "agTextColumnFilter",
      cellStyle: { fontWeight: "600" },
    },
    // ── Телефон ──
    {
      headerName: "Телефон",
      field: "client_phone",
      minWidth: 140,
      width: 165,
      editable: true,
      filter: "agTextColumnFilter",
      cellStyle: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
      },
    },
    // ── Размер ──
    {
      headerName: "Размер",
      field: "size",
      width: 100,
      minWidth: 80,
      editable: true,
      filter: "agTextColumnFilter",
    },
    // ── Цвет ──
    {
      headerName: "Цвет",
      field: "color",
      width: 110,
      minWidth: 85,
      editable: true,
      filter: "agTextColumnFilter",
    },
    // ── Примерка (чекбокс) ──
    {
      headerName: "Примерка",
      field: "fitting",
      width: 110,
      minWidth: 95,
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: [true, false] },
      valueFormatter: (p: ValueFormatterParams) => {
        if (p.value === true) return "ДА";
        if (p.value === false) return "НЕТ";
        return "—";
      },
      valueSetter: (p: ValueSetterParams) => {
        p.data.fitting = p.newValue === true;
        return true;
      },
      cellStyle: (p: any) => {
        if (p.value === true) {
          return {
            backgroundColor: "#F5F3FF",
            color: "#7C3AED",
            fontWeight: "700",
            textAlign: "center",
          };
        }
        return { color: "#94A3B8", textAlign: "center" };
      },
      filter: "agTextColumnFilter",
    },
    // ── Статус ──
    {
      headerName: "Статус",
      field: "status",
      width: 190,
      minWidth: 150,
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: statusLabels },
      valueFormatter: (p: ValueFormatterParams) => {
        const s = VISIT_STATUSES.find((st) => st.value === p.value);
        return s ? s.label : p.value || "—";
      },
      valueSetter: (p: ValueSetterParams) => {
        // Конвертируем label → value
        const s = VISIT_STATUSES.find((st) => st.label === p.newValue);
        if (s) {
          p.data.status = s.value;
        } else {
          // Если пришёл уже value
          p.data.status = p.newValue;
        }
        return true;
      },
      cellStyle: (p: any) => getStatusStyle(p.value),
      filter: "agTextColumnFilter",
    },
    // ── Отложено до ──
    {
      headerName: "Отложено до",
      field: "hold_until",
      width: 140,
      minWidth: 120,
      editable: (p: any) => {
        const s = p.data?.status;
        return s === "hold_no_deposit" || s === "hold_deposit";
      },
      cellEditor: "agTextCellEditor",
      cellEditorParams: { useFormatter: true },
      valueFormatter: (p: ValueFormatterParams) => formatDate(p.value),
      valueSetter: (p: ValueSetterParams) => {
        p.data.hold_until = parseDateInput(p.newValue);
        return true;
      },
      tooltipValueGetter: (p: any) => {
        const s = p.data?.status;
        if (s !== "hold_no_deposit" && s !== "hold_deposit")
          return "Доступно только для отложенных";
        return p.value
          ? formatDate(p.value)
          : "Кликните для ввода (ДД.ММ.ГГГГ)";
      },
      cellStyle: (p: any) => {
        const s = p.data?.status;
        if (s !== "hold_no_deposit" && s !== "hold_deposit") {
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
    // ── Сумма депозита ──
    {
      headerName: "Депозит",
      field: "deposit_amount",
      width: 125,
      minWidth: 100,
      editable: (p: any) =>
        p.data?.status === "hold_deposit" ||
        p.data?.status === "redeemed_deposit",
      filter: "agNumberColumnFilter",
      valueFormatter: (p: ValueFormatterParams) =>
        p.value != null && p.value > 0 ? formatCurrency(p.value) : "—",
      cellStyle: (p: any) => {
        if (
          p.data?.status !== "hold_deposit" &&
          p.data?.status !== "redeemed_deposit"
        ) {
          return {
            backgroundColor: "#F1F5F9",
            color: "#CBD5E1",
            fontStyle: "italic",
            cursor: "not-allowed",
            textAlign: "right",
          };
        }
        return {
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "12px",
          textAlign: "right",
        };
      },
    },
    // ── Сумма покупки ──
    {
      headerName: "Сумма покупки",
      field: "purchase_amount",
      width: 140,
      minWidth: 115,
      editable: (p: any) => {
        const s = p.data?.status;
        return (
          s === "purchased" || s === "redeemed" || s === "redeemed_deposit"
        );
      },
      filter: "agNumberColumnFilter",
      valueFormatter: (p: ValueFormatterParams) =>
        p.value != null && p.value > 0 ? formatCurrency(p.value) : "—",
      cellStyle: (p: any) => {
        const s = p.data?.status;
        if (s !== "purchased" && s !== "redeemed" && s !== "redeemed_deposit") {
          return {
            backgroundColor: "#F1F5F9",
            color: "#CBD5E1",
            fontStyle: "italic",
            cursor: "not-allowed",
            textAlign: "right",
          };
        }
        return {
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "12px",
          textAlign: "right",
          color: "#059669",
          fontWeight: "600",
        };
      },
    },
    // ── Что купил ──
    {
      headerName: "Что купил",
      field: "purchased_items",
      width: 170,
      minWidth: 130,
      editable: (p: any) => {
        const s = p.data?.status;
        return (
          s === "purchased" || s === "redeemed" || s === "redeemed_deposit"
        );
      },
      filter: "agTextColumnFilter",
      cellStyle: (p: any) => {
        const s = p.data?.status;
        if (s !== "purchased" && s !== "redeemed" && s !== "redeemed_deposit") {
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
    // ── Откуда узнал ──
    {
      headerName: "Откуда узнал",
      field: "source",
      width: 155,
      minWidth: 125,
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: ["", ...VISIT_SOURCES] },
      valueFormatter: (p: ValueFormatterParams) => p.value || "—",
      filter: "agTextColumnFilter",
    },
    // ── Консультант ──
    {
      headerName: "Консультант",
      field: "consultant",
      width: 155,
      minWidth: 125,
      editable: true,
      filter: "agTextColumnFilter",
    },
    // ── Комментарий ──
    {
      headerName: "Комментарий",
      field: "comment",
      width: 200,
      minWidth: 150,
      editable: true,
      filter: "agTextColumnFilter",
      cellStyle: { color: "#64748B", fontSize: "12px" },
    },
    // ── Создан ──
    {
      headerName: "Создан",
      field: "created_at",
      width: 145,
      minWidth: 120,
      editable: false,
      valueFormatter: (p: ValueFormatterParams) => formatDateTime(p.value),
      filter: "agDateColumnFilter",
    },
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
      fileName: `посещения_экспорт_${today}.csv`,
      columnSeparator: ";",
      processCellCallback: (params) => {
        const colId = params.column.getColId();
        if (colId === "fitting") return params.value === true ? "Да" : "Нет";
        if (colId === "status") {
          const s = VISIT_STATUSES.find((st) => st.value === params.value);
          return s ? s.label : params.value || "";
        }
        return params.value;
      },
    });
  };

  const setQuickFilter = (text: string) => {
    if (!gridApi.value) return;
    gridApi.value.setGridOption("quickFilterText", text);
  };

  const getSelectedRows = (): Visit[] => {
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
    columnDefs,
    defaultColDef,
    getRowStyle,
    onGridReady,
    exportToCsv,
    setQuickFilter,
    getSelectedRows,
    clearAllFilters,
    sizeColumnsToFit,
    formatCurrency,
    formatDate,
    formatDateTime,
    formatTime,
    parseDateInput,
  };
}
