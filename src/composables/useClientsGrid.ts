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
  // ═══ Helpers ═══
  const isType = (params: any, ...types: string[]) =>
    types.includes(params.data?.company_type);

  const disabledStyle = {
    backgroundColor: "#F8FAFC",
    color: "#CBD5E1",
    fontStyle: "italic",
    cursor: "not-allowed",
  };

  const typeEditable = (types: string[]) => (params: any) =>
    types.includes(params.data?.company_type);

  const typeCellStyle = (types: string[], baseStyle?: any) => (params: any) => {
    if (!types.includes(params.data?.company_type)) return disabledStyle;
    return baseStyle || null;
  };

  // ══════════════════════════════════════════
  const columnDefs: ColDef[] = [
    {
      headerName: "№",
      valueGetter: "node.rowIndex + 1",
      width: 70,
      minWidth: 60,
      maxWidth: 90,
      sortable: false,
      editable: false,
      suppressHeaderMenuButton: true,
      cellStyle: {
        color: "#94A3B8",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "11px",
        textAlign: "center",
      },
    },
    // ── Название (юр.лицо + ИП) ──
    {
      headerName: "Название",
      field: "name",
      minWidth: 160,
      width: 210,
      editable: typeEditable(["legal", "entrepreneur"]),
      cellStyle: (params: any) => {
        if (!isType(params, "legal", "entrepreneur")) return disabledStyle;
        return { fontWeight: "600" };
      },
      tooltipValueGetter: (params: any) => {
        if (!isType(params, "legal", "entrepreneur"))
          return "Только для ИП и юр. лиц";
        return params.value || "";
      },
    },
    // ── Имя ──
    {
      headerName: "Имя",
      field: "legal_first_name",
      minWidth: 120,
      width: 140,
      editable: typeEditable(["individual", "entrepreneur"]),
      cellStyle: (params: any) => {
        if (!isType(params, "individual", "entrepreneur")) return disabledStyle;
        return { fontWeight: "600" };
      },
    },
    // ── Фамилия ──
    {
      headerName: "Фамилия",
      field: "legal_last_name",
      minWidth: 120,
      width: 140,
      editable: typeEditable(["individual", "entrepreneur"]),
      cellStyle: typeCellStyle(["individual", "entrepreneur"]),
    },
    // ── Отчество ──
    {
      headerName: "Отчество",
      field: "legal_middle_name",
      width: 140,
      minWidth: 110,
      editable: typeEditable(["individual", "entrepreneur"]),
      cellStyle: typeCellStyle(["individual", "entrepreneur"]),
    },
    {
      headerName: "Тип",
      field: "company_type",
      width: 110,
      minWidth: 90,
      editable: false,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: ["individual", "legal", "entrepreneur"],
      },
      valueFormatter: (params: ValueFormatterParams) => {
        switch (params.value) {
          case "legal": return "Юр. лицо";
          case "entrepreneur": return "ИП";
          case "individual": return "Физ. лицо";
          default: return "—";
        }
      },
      cellStyle: (params: any) => {
        const base: any = {
          textAlign: "center",
          fontSize: "10px",
          fontWeight: "600",
          letterSpacing: ".03em",
        };
        switch (params.value) {
          case "legal": return { ...base, backgroundColor: "#EFF6FF", color: "#2563EB" };
          case "entrepreneur": return { ...base, backgroundColor: "#FFFBEB", color: "#D97706" };
          case "individual": return { ...base, backgroundColor: "#F0FDF4", color: "#16A34A" };
          default: return { ...base, color: "#94A3B8" };
        }
      },
    },
    {
      headerName: "Телефон",
      field: "phone",
      minWidth: 140,
      width: 160,
      editable: true,
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
    },

    // ── Физ. лицо ──
    {
      headerName: "Пол",
      field: "sex",
      width: 90,
      minWidth: 75,
      editable: typeEditable(["individual"]),
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
      cellStyle: typeCellStyle(["individual"]),
    },
    {
      headerName: "Дата рождения",
      field: "birth_date",
      width: 145,
      minWidth: 125,
      editable: typeEditable(["individual"]),
      cellEditor: "agTextCellEditor",
      cellEditorParams: { useFormatter: true },
      valueFormatter: (params: ValueFormatterParams) =>
        formatDate(params.value),
      valueSetter: (params: ValueSetterParams) => {
        const raw = params.newValue;
        if (!raw || !raw.trim() || raw.trim() === "—") {
          params.data.birth_date = null;
          return true;
        }
        const parsed = parseDateInput(raw);
        if (parsed) {
          params.data.birth_date = parsed;
          return true;
        }
        return false;
      },
      tooltipValueGetter: (params: any) => {
        if (!isType(params, "individual")) return "Только для физ. лиц";
        return params.value
          ? `${formatDate(params.value)} · Введите: ДД.ММ.ГГГГ`
          : "Кликните и введите: ДД.ММ.ГГГГ";
      },
      cellStyle: typeCellStyle(["individual"]),
    },

    // ── Общие поля ──
    {
      headerName: "Telegram",
      field: "telegram_id",
      width: 130,
      minWidth: 100,
      editable: true,
    },
    {
      headerName: "МАКС ID",
      field: "max_id",
      width: 110,
      minWidth: 90,
      editable: true,
    },

    // ── Статистика продаж ──
    {
      headerName: "Продажи",
      field: "sales_amount",
      width: 135,
      minWidth: 110,
      sortable: false,
      editable: false,
      valueFormatter: (params: ValueFormatterParams) =>
        formatCurrency(params.value),
      cellStyle: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
        textAlign: "right",
      },
    },
    {
      headerName: "Кол-во чеков",
      field: "receipts_count",
      width: 130,
      minWidth: 100,
      sortable: false,
      editable: false,
      valueFormatter: (params: ValueFormatterParams) =>
        params.value != null ? String(params.value) : "—",
      cellStyle: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
        textAlign: "right",
      },
    },
    {
      headerName: "Средний чек",
      field: "avg_receipt",
      width: 135,
      minWidth: 110,
      sortable: false,
      editable: false,
      valueFormatter: (params: ValueFormatterParams) =>
        formatCurrency(params.value),
      cellStyle: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
        textAlign: "right",
      },
    },
    {
      headerName: "Макс. чек",
      field: "max_receipt",
      width: 130,
      minWidth: 110,
      sortable: false,
      editable: false,
      valueFormatter: (params: ValueFormatterParams) =>
        formatCurrency(params.value),
      cellStyle: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
        textAlign: "right",
      },
    },

    // ── Свадьба (только физ. лицо) ──
    {
      headerName: "Свадьба",
      field: "is_wedding",
      width: 100,
      minWidth: 85,
      sortable: false,
      editable: typeEditable(["individual"]),
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
        if (!isType(params, "individual")) return disabledStyle;
        if (params.value === true) {
          return {
            backgroundColor: "#ECFDF5",
            color: "#059669",
            fontWeight: "700",
            textAlign: "center",
          };
        }
        return { color: "#94A3B8", textAlign: "center", backgroundColor: "", fontWeight: "" };
      },
    },
    {
      headerName: "Дата свадьбы",
      field: "wedding_date",
      width: 145,
      minWidth: 125,
      editable: (params: any) =>
        isType(params, "individual") && params.data?.is_wedding === true,
      cellEditor: "agTextCellEditor",
      cellEditorParams: { useFormatter: true },
      valueFormatter: (params: ValueFormatterParams) =>
        formatDate(params.value),
      valueSetter: (params: ValueSetterParams) => {
        const raw = params.newValue;
        if (!raw || !raw.trim() || raw.trim() === "—") {
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
        if (!isType(params, "individual")) return "Только для физ. лиц";
        if (params.data?.is_wedding !== true)
          return "Сначала включите флаг Свадьба";
        return params.value
          ? `${formatDate(params.value)} · Введите: ДД.ММ.ГГГГ`
          : "Кликните и введите: ДД.ММ.ГГГГ";
      },
      cellStyle: (params: any) => {
        if (!isType(params, "individual") || params.data?.is_wedding !== true) {
          return disabledStyle;
        }
        return {
          backgroundColor: "transparent",
          color: "var(--tx)",
          fontStyle: "normal",
          cursor: "pointer",
        };
      },
    },
    {
      headerName: "Имя невесты",
      field: "bride_name",
      width: 145,
      minWidth: 115,
      editable: (params: any) =>
        isType(params, "individual") && params.data?.is_wedding === true,
      tooltipValueGetter: (params: any) => {
        if (!isType(params, "individual")) return "Только для физ. лиц";
        if (params.data?.is_wedding !== true)
          return "Сначала включите флаг Свадьба";
        return params.value || "Пусто — кликните для ввода";
      },
      cellStyle: (params: any) => {
        if (!isType(params, "individual") || params.data?.is_wedding !== true) {
          return disabledStyle;
        }
        return {
          backgroundColor: "transparent",
          color: "var(--tx)",
          fontStyle: "normal",
          cursor: "pointer",
        };
      },
    },

    // ── Откуда узнал ──
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
    },

    // ── ИНН (юр. лицо + ИП) ──
    {
      headerName: "ИНН",
      field: "inn",
      width: 125,
      minWidth: 100,
      editable: typeEditable(["legal", "entrepreneur"]),
      cellStyle: typeCellStyle(["legal", "entrepreneur"], {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "11px",
      }),
    },

    // ── Только юр. лицо ──
    {
      headerName: "КПП",
      field: "kpp",
      width: 110,
      minWidth: 90,
      editable: typeEditable(["legal"]),
      cellStyle: typeCellStyle(["legal"], {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "11px",
      }),
    },
    {
      headerName: "ОГРН",
      field: "ogrn",
      width: 140,
      minWidth: 110,
      editable: typeEditable(["legal"]),
      cellStyle: typeCellStyle(["legal"], {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "11px",
      }),
    },
    {
      headerName: "Юр. адрес",
      field: "legal_address",
      width: 200,
      minWidth: 140,
      editable: typeEditable(["legal"]),
      cellStyle: typeCellStyle(["legal"]),
    },

    // ── Только ИП ──
    {
      headerName: "ОГРНИП",
      field: "ogrnip",
      width: 150,
      minWidth: 120,
      editable: typeEditable(["entrepreneur"]),
      cellStyle: typeCellStyle(["entrepreneur"], {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "11px",
      }),
    },

    // ── МойСклад ID ──
    {
      headerName: "МС ID",
      field: "moysklad_id",
      width: 120,
      minWidth: 100,
      editable: false,
      cellStyle: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10px",
        color: "#94A3B8",
      },
    },
  ];

  const defaultColDef: ColDef = {
    resizable: true,
    sortable: false,
    filter: false,
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
