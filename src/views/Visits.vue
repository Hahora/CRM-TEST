<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useVisits } from "@/composables/useVisits";
import { clientsApi } from "@/services/clientsApi";
import { VISIT_SOURCES } from "@/types/visits";
import type { Client } from "@/types/clients";

// ── Константы ──
const FITTING_ROOMS = 6;
const TIME_SLOTS = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

// Сотрудники для автокомплита консультантов
type Employee = { id: number; full_name: string; position?: string };
const allEmployees = ref<Employee[]>([]);
const loadEmployees = async () => {
  try {
    // TODO: подключить ваш employeesApi
    // const resp = await employeesApi.getEmployees({ limit: 100 });
    // allEmployees.value = resp.employees || [];
    allEmployees.value = []; // Пока пустой
  } catch {
    /* ignore */
  }
};

const {
  visits,
  totalVisits,
  stats,
  isLoadingVisits,
  isExporting,
  loadVisits,
  loadStats,
  createVisit,
  updateVisit,
  exportVisits,
} = useVisits();

// ═══ Дата ═══
const selectedDate = ref(new Date());
const dateStr = computed(() => selectedDate.value.toISOString().split("T")[0]);
const dateDisplay = computed(() => ({
  day: selectedDate.value.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  }),
  weekday: selectedDate.value.toLocaleDateString("ru-RU", { weekday: "short" }),
}));
const weekDates = computed(() => {
  const cur = new Date(selectedDate.value);
  const dow = cur.getDay();
  const mon = new Date(cur);
  mon.setDate(cur.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
});
const isToday = (d: Date) => {
  const t = new Date();
  return d.toDateString() === t.toDateString();
};
const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const selectDay = (d: Date) => {
  selectedDate.value = new Date(d);
};
const prevDay = () => {
  const d = new Date(selectedDate.value);
  d.setDate(d.getDate() - 1);
  selectedDate.value = d;
};
const nextDay = () => {
  const d = new Date(selectedDate.value);
  d.setDate(d.getDate() + 1);
  selectedDate.value = d;
};
const goToday = () => {
  selectedDate.value = new Date();
};

// ═══ Данные сетки ═══
type CellData = {
  id?: number;
  client_id?: number;
  client_name: string;
  client_phone: string;
  size: string;
  color: string;
  source: string;
  consultant: string;
  comment: string;
  // Статусы
  no_show: boolean; // Не пришёл
  fitting: boolean; // Примерка (галочка, информационная)
  result: string; // "" | "purchased" | "not_purchased" | "hold_no_deposit" | "hold_deposit"
  // Доп. поля
  hold_until: string;
  deposit_amount: number | null;
  purchase_amount: number | null;
  purchased_items: string;
  dirty: boolean;
};

const emptyCell = (): CellData => ({
  client_name: "",
  client_phone: "",
  size: "",
  color: "",
  source: "",
  consultant: "",
  comment: "",
  no_show: false,
  fitting: false,
  result: "",
  hold_until: "",
  deposit_amount: null,
  purchase_amount: null,
  purchased_items: "",
  dirty: false,
});

const grid = ref<Record<string, CellData[]>>({});
const initGrid = () => {
  const g: Record<string, CellData[]> = {};
  for (const slot of TIME_SLOTS)
    g[slot] = Array.from({ length: FITTING_ROOMS }, () => emptyCell());
  grid.value = g;
};
initGrid();

const loadDayVisits = async () => {
  await loadVisits({
    search: "",
    status: "",
    start_date: dateStr.value,
    end_date: dateStr.value,
  });
  await loadStats({ start_date: dateStr.value, end_date: dateStr.value });
  initGrid();
  for (const v of visits.value) {
    if (!v.visit_datetime) continue;
    const dt = new Date(v.visit_datetime);
    const hour = dt.getHours().toString().padStart(2, "0") + ":00";
    const slotCells = grid.value[hour];
    if (!slotCells) continue;
    const assignedRoom = (v as any).fitting_room ?? (v as any).room;
    let idx =
      assignedRoom != null && assignedRoom >= 0 && assignedRoom < FITTING_ROOMS
        ? assignedRoom
        : slotCells.findIndex((c) => !c.id && !c.client_name);
    if (idx < 0 || idx >= FITTING_ROOMS) continue;
    const cell = slotCells[idx];
    cell.id = Number(v.id);
    cell.client_id = (v as any).client_id
      ? Number((v as any).client_id)
      : undefined;
    cell.client_name = v.client_name || (v.client as any)?.full_name || "";
    cell.client_phone = v.client_phone || (v.client as any)?.phone || "";
    cell.size = v.size || "";
    cell.color = v.color || "";
    cell.source = v.source || "";
    cell.consultant = v.consultant || "";
    cell.comment = v.comment || "";
    const s = v.status;
    cell.no_show = s === "no_show";
    cell.fitting = v.fitting ?? false;
    cell.result = ["purchased", "redeemed", "redeemed_deposit"].includes(s)
      ? "purchased"
      : s === "not_purchased"
      ? "not_purchased"
      : s === "hold_no_deposit"
      ? "hold_no_deposit"
      : s === "hold_deposit"
      ? "hold_deposit"
      : "";
    cell.hold_until = v.hold_until || "";
    cell.deposit_amount = v.deposit_amount ?? null;
    cell.purchase_amount = v.purchase_amount ?? null;
    cell.purchased_items = v.purchased_items || "";
    cell.dirty = false;
  }
};

onMounted(async () => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
  await loadEmployees();
  await loadDayVisits();
});
onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
});
watch(selectedDate, () => loadDayVisits());

// ═══ Автокомплит клиентов (по телефону, тг, максу) ═══
const acResults = ref<Record<string, Client[]>>({});
const acLoading = ref<Record<string, boolean>>({});
const acOpen = ref<string | null>(null);
let acTimer: ReturnType<typeof setTimeout> | null = null;
const acKey = (slot: string, room: number) => `${slot}-${room}`;

const searchClients = (slot: string, room: number, query: string) => {
  const key = acKey(slot, room);
  if (query.length < 2) {
    acResults.value[key] = [];
    acLoading.value[key] = false;
    acOpen.value = null;
    return;
  }
  acLoading.value[key] = true;
  acOpen.value = key; // Открываем сразу, покажем "Поиск..."
  if (acTimer) clearTimeout(acTimer);
  acTimer = setTimeout(async () => {
    try {
      const resp = await clientsApi.getClients({ search: query, limit: 8 });
      const clients = resp.clients || resp.data || resp.results || [];
      acResults.value[key] = clients;
      acLoading.value[key] = false;
      // Если есть результаты или шёл поиск — держим открытым
      acOpen.value = key;
    } catch (e) {
      console.error("Ошибка поиска клиентов:", e);
      acResults.value[key] = [];
      acLoading.value[key] = false;
      acOpen.value = key; // Покажем "Не найдено"
    }
  }, 250);
};

const onClientInput = (slot: string, room: number) => {
  markDirty(slot, room);
  const query = grid.value[slot][room].client_name.trim();
  searchClients(slot, room, query);
};

const onClientFocus = (slot: string, room: number) => {
  const query = grid.value[slot][room].client_name.trim();
  if (query.length >= 2) {
    searchClients(slot, room, query);
  }
};

const selectClient = (slot: string, room: number, client: Client) => {
  const cell = grid.value[slot]?.[room];
  if (!cell) return;
  cell.client_id = Number(client.id);
  cell.client_name =
    (client as any).full_name ||
    (client as any).name ||
    `${(client as any).first_name || ""} ${
      (client as any).last_name || ""
    }`.trim() ||
    "";
  cell.client_phone =
    (client as any).phone || (client as any).phone_number || "";
  cell.dirty = true;
  acOpen.value = null;
  acResults.value[acKey(slot, room)] = [];
  saveCell(slot, room);
};

const closeAc = () => {
  acOpen.value = null;
};

// Получить отображаемое имя клиента
const getClientDisplayName = (cl: any): string => {
  return (
    cl.full_name ||
    cl.name ||
    `${cl.first_name || ""} ${cl.last_name || ""}`.trim() ||
    "Без имени"
  );
};

const getClientPhone = (cl: any): string => {
  return cl.phone || cl.phone_number || "";
};

// ═══ Автокомплит консультантов ═══
const consultantResults = ref<Record<string, Employee[]>>({});
const consultantOpen = ref<string | null>(null);
const consultantKey = (slot: string, room: number) => `cons-${slot}-${room}`;

const onConsultantInput = (slot: string, room: number) => {
  markDirty(slot, room);
  const query = grid.value[slot][room].consultant.trim().toLowerCase();
  const key = consultantKey(slot, room);

  if (query.length < 1) {
    consultantResults.value[key] = [];
    consultantOpen.value = null;
    return;
  }

  // Фильтруем локально по списку сотрудников
  const filtered = allEmployees.value
    .filter((e) => e.full_name.toLowerCase().includes(query))
    .slice(0, 6);

  consultantResults.value[key] = filtered;
  consultantOpen.value = filtered.length ? key : null;
};

const selectConsultant = (slot: string, room: number, emp: Employee) => {
  const cell = grid.value[slot]?.[room];
  if (!cell) return;
  cell.consultant = emp.full_name;
  cell.dirty = true;
  consultantOpen.value = null;
  consultantResults.value[consultantKey(slot, room)] = [];
  saveCell(slot, room);
};

const closeConsultantAc = () => {
  consultantOpen.value = null;
};

// ═══ Сохранение ═══
const saveCell = async (slot: string, room: number) => {
  const cell = grid.value[slot]?.[room];
  if (!cell) return;

  let status = "scheduled";
  if (cell.no_show) status = "no_show";
  else if (cell.result === "purchased") status = "purchased";
  else if (cell.result === "not_purchased") status = "not_purchased";
  else if (cell.result === "hold_no_deposit") status = "hold_no_deposit";
  else if (cell.result === "hold_deposit") status = "hold_deposit";
  else if (cell.fitting) status = "fitting_done";

  const data: any = {
    client_name: cell.client_name,
    client_phone: cell.client_phone,
    client_id: cell.client_id || undefined,
    visit_datetime: `${dateStr.value}T${slot}:00`,
    size: cell.size,
    color: cell.color,
    source: cell.source,
    consultant: cell.consultant,
    comment: cell.comment,
    fitting: cell.fitting,
    status,
    hold_until: cell.hold_until || undefined,
    deposit_amount: cell.deposit_amount ?? undefined,
    purchase_amount: cell.purchase_amount ?? undefined,
    purchased_items: cell.purchased_items || undefined,
    fitting_room: room,
  };
  try {
    if (cell.id) {
      await updateVisit(cell.id, data);
    } else if (cell.client_name.trim()) {
      const created = await createVisit(data);
      cell.id = Number(created.id);
    }
    cell.dirty = false;
  } catch (e) {
    console.error("Ошибка сохранения:", e);
  }
};

const markDirty = (slot: string, room: number) => {
  const c = grid.value[slot]?.[room];
  if (c) c.dirty = true;
};
const onFieldBlur = (slot: string, room: number) => {
  const c = grid.value[slot]?.[room];
  if (c?.dirty) saveCell(slot, room);
  // Закрываем автокомплиты с задержкой (чтобы mousedown успел сработать)
  setTimeout(() => {
    closeAc();
    closeConsultantAc();
  }, 250);
};

// Статусы
const toggleNoShow = (slot: string, room: number) => {
  const cell = grid.value[slot]?.[room];
  if (!cell) return;
  cell.no_show = !cell.no_show;
  if (cell.no_show) {
    cell.result = "";
  }
  cell.dirty = true;
  saveCell(slot, room);
};
const toggleFitting = (slot: string, room: number) => {
  const cell = grid.value[slot]?.[room];
  if (!cell) return;
  cell.fitting = !cell.fitting;
  cell.dirty = true;
  saveCell(slot, room);
};
const setResult = (slot: string, room: number, result: string) => {
  const cell = grid.value[slot]?.[room];
  if (!cell || cell.no_show) return;
  cell.result = cell.result === result ? "" : result;
  cell.dirty = true;
  saveCell(slot, room);
};

// ═══ UI ═══
const isMobile = ref(false);
const isFullscreen = ref(false);
const showStatsPanel = ref(true);
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

const displayStats = computed(() => ({
  total: stats.value?.total_visits || totalVisits.value || 0,
  revenue: stats.value?.total_purchase_amount || 0,
  conversion: stats.value?.conversion_rate || 0,
}));
const formatCurrency = (v: number | null | undefined): string => {
  if (v == null) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
  }).format(v);
};
const getCellBg = (cell: CellData): string => {
  if (cell.no_show) return "var(--cell-er)";
  if (cell.result === "purchased") return "var(--cell-ok)";
  if (cell.result === "hold_deposit") return "var(--cell-bl)";
  if (cell.result === "hold_no_deposit") return "var(--cell-am)";
  if (cell.result === "not_purchased") return "var(--cell-er)";
  if (cell.client_name) return "var(--cell-fill)";
  return "transparent";
};
const handleRefresh = () => loadDayVisits();
const handleExport = () =>
  exportVisits({ start_date: dateStr.value, end_date: dateStr.value });

const resultOptions = [
  {
    value: "hold_no_deposit",
    label: "Отложил без деп.",
    icon: "◷",
    cls: "res-am",
  },
  { value: "hold_deposit", label: "Отложил с деп.", icon: "◈", cls: "res-bl" },
  { value: "purchased", label: "Купил", icon: "✓", cls: "res-ok" },
  { value: "not_purchased", label: "Не купил", icon: "✗", cls: "res-er" },
];
</script>

<template>
  <div class="visits-page" :class="{ 'visits-page--fs': isFullscreen }">
    <!-- HEADER -->
    <header class="v-header">
      <div class="v-header-left">
        <div class="v-header-title-row">
          <h1 class="v-header-title">Посещения</h1>
          <span class="v-badge">{{ displayStats.total }}</span>
        </div>
        <p class="v-header-sub">
          Примерочные · {{ dateDisplay.day }} {{ dateDisplay.weekday }}
        </p>
      </div>
      <div class="v-header-btns">
        <button class="vb vb--ghost" @click="showStatsPanel = !showStatsPanel">
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
            <line x1="6" y1="20" x2="6" y2="14" /></svg
          ><span class="vb-t">Стат</span>
        </button>
        <button
          class="vb vb--ghost"
          @click="handleExport"
          :disabled="isExporting"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" /></svg
          ><span class="vb-t">Экспорт</span>
        </button>
        <button
          class="vb vb--ghost"
          @click="handleRefresh"
          :disabled="isLoadingVisits"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            :class="{ spinning: isLoadingVisits }"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path
              d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
            /></svg
          ><span class="vb-t">Обновить</span>
        </button>
      </div>
    </header>

    <!-- STATS -->
    <Transition name="fold">
      <div v-if="showStatsPanel" class="v-stats">
        <div class="vs">
          <div class="vs-i vs-i--am">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <div class="vs-b">
            <b>{{ displayStats.total }}</b
            ><span>Визитов</span>
          </div>
        </div>
        <div class="vs">
          <div class="vs-i vs-i--ok">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div class="vs-b">
            <b>{{ formatCurrency(displayStats.revenue) }}</b
            ><span>Выручка</span>
          </div>
        </div>
        <div class="vs">
          <div class="vs-i vs-i--te">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div class="vs-b">
            <b>{{ displayStats.conversion }}%</b><span>Конверсия</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- DATE BAR -->
    <div class="v-date">
      <button class="v-date-arr" @click="prevDay">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <div class="v-date-week">
        <button
          v-for="d in weekDates"
          :key="d.toISOString()"
          class="v-dc"
          :class="{
            'v-dc--act': isSameDay(d, selectedDate),
            'v-dc--today': isToday(d),
          }"
          @click="selectDay(d)"
        >
          <span class="v-dc-d"
            >{{ d.getDate().toString().padStart(2, "0") }}.{{
              (d.getMonth() + 1).toString().padStart(2, "0")
            }}</span
          >
          <span class="v-dc-w">{{
            d.toLocaleDateString("ru-RU", { weekday: "short" })
          }}</span>
        </button>
      </div>
      <button class="v-date-arr" @click="nextDay">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      <button
        class="vb vb--ghost vb--xs"
        @click="goToday"
        style="margin-left: 4px"
      >
        Сегодня
      </button>
    </div>

    <!-- MOBILE FS -->
    <div class="v-mob" v-if="isMobile && !isFullscreen">
      <span class="v-mob-h">Свайп ← → · Тап = редактировать</span>
      <button class="v-mob-fs" @click="isFullscreen = true">
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
    <div class="v-fsx" v-if="isFullscreen">
      <span>{{ dateDisplay.day }} · {{ displayStats.total }} визитов</span>
      <button class="v-fsx-btn" @click="isFullscreen = false">
        <svg
          width="14"
          height="14"
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
        Свернуть
      </button>
    </div>

    <!-- LOADING -->
    <div class="v-load" v-if="isLoadingVisits"></div>

    <!-- ═══ SPREADSHEET ═══ -->
    <div class="v-grid">
      <table class="sheet">
        <colgroup>
          <col class="col-time" />
          <col class="col-lbl" />
          <col v-for="r in FITTING_ROOMS" :key="'col' + r" class="col-room" />
        </colgroup>
        <thead>
          <tr>
            <th class="sh-time">Время</th>
            <th class="sh-lbl">Поле</th>
            <th v-for="r in FITTING_ROOMS" :key="r" class="sh-room">
              Примерочная&nbsp;{{ r }}
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-for="slot in TIME_SLOTS" :key="slot">
            <!-- ROW: Статус (Не пришёл / Примерка / Результат) -->
            <tr class="tr-time">
              <td class="td-time" :rowspan="8">
                <span class="time-pill">{{ slot }}</span>
              </td>
              <td class="td-lbl td-lbl--h">Статус</td>
              <td
                v-for="r in FITTING_ROOMS"
                :key="'st' + r"
                class="td-status"
                :style="{ background: getCellBg(grid[slot][r - 1]) }"
              >
                <div class="st-row">
                  <!-- Не пришёл -->
                  <label
                    class="ck"
                    :class="{ 'ck--er': grid[slot][r - 1].no_show }"
                    @click="toggleNoShow(slot, r - 1)"
                  >
                    <span class="ck-b ck-b--er">{{
                      grid[slot][r - 1].no_show ? "✗" : ""
                    }}</span>
                    <span>Не пришёл</span>
                  </label>
                  <!-- Примерка (информационная галочка) -->
                  <label
                    class="ck"
                    :class="{ 'ck--on': grid[slot][r - 1].fitting }"
                    @click="toggleFitting(slot, r - 1)"
                  >
                    <span class="ck-b">{{
                      grid[slot][r - 1].fitting ? "✓" : ""
                    }}</span>
                    <span>Примерка</span>
                  </label>
                  <!-- Результат (всегда показывается если НЕ "Не пришёл") -->
                  <div class="rg" v-if="!grid[slot][r - 1].no_show">
                    <button
                      v-for="o in resultOptions"
                      :key="o.value"
                      class="rb"
                      :class="[
                        o.cls,
                        { 'rb--a': grid[slot][r - 1].result === o.value },
                      ]"
                      @click="setResult(slot, r - 1, o.value)"
                      :title="o.label"
                    >
                      {{ o.icon }}
                    </button>
                  </div>
                </div>
              </td>
            </tr>

            <!-- Клиент (автокомплит по телефону, тг, максу) -->
            <tr class="tr-field">
              <td class="td-lbl">Клиент</td>
              <td
                v-for="r in FITTING_ROOMS"
                :key="'cn' + r"
                class="td-inp td-inp--ac"
                :style="{ background: getCellBg(grid[slot][r - 1]) }"
              >
                <input
                  type="text"
                  v-model="grid[slot][r - 1].client_name"
                  class="cinp"
                  placeholder="Поиск: имя, телефон, тг..."
                  @input="onClientInput(slot, r - 1)"
                  @blur="onFieldBlur(slot, r - 1)"
                  @focus="onClientFocus(slot, r - 1)"
                />
                <!-- Dropdown автокомплита клиентов -->
                <div class="ac-drop" v-if="acOpen === acKey(slot, r - 1)">
                  <!-- Загрузка -->
                  <div v-if="acLoading[acKey(slot, r - 1)]" class="ac-empty">
                    <span class="ac-spinner"></span> Поиск клиентов...
                  </div>
                  <!-- Результаты -->
                  <template
                    v-else-if="(acResults[acKey(slot, r - 1)] || []).length > 0"
                  >
                    <div
                      class="ac-item"
                      v-for="cl in acResults[acKey(slot, r - 1)]"
                      :key="cl.id"
                      @mousedown.prevent="selectClient(slot, r - 1, cl)"
                    >
                      <span class="ac-name">{{
                        getClientDisplayName(cl)
                      }}</span>
                      <span class="ac-phone" v-if="getClientPhone(cl)">{{
                        getClientPhone(cl)
                      }}</span>
                      <span class="ac-extra" v-if="(cl as any).telegram_id"
                        >тг: {{ (cl as any).telegram_id }}</span
                      >
                      <span class="ac-extra" v-if="(cl as any).max_id"
                        >макс: {{ (cl as any).max_id }}</span
                      >
                    </div>
                  </template>
                  <!-- Не найдено -->
                  <div v-else class="ac-empty">Клиенты не найдены</div>
                </div>
              </td>
            </tr>

            <!-- Телефон (автозаполняется при выборе клиента) -->
            <tr class="tr-field">
              <td class="td-lbl">Телефон</td>
              <td
                v-for="r in FITTING_ROOMS"
                :key="'cp' + r"
                class="td-inp"
                :style="{ background: getCellBg(grid[slot][r - 1]) }"
              >
                <input
                  type="text"
                  v-model="grid[slot][r - 1].client_phone"
                  class="cinp cinp--mono"
                  placeholder="+7..."
                  readonly
                  :class="{ 'cinp--readonly': grid[slot][r - 1].client_id }"
                />
              </td>
            </tr>

            <!-- Размер -->
            <tr class="tr-field">
              <td class="td-lbl">Размер</td>
              <td
                v-for="r in FITTING_ROOMS"
                :key="'sz' + r"
                class="td-inp"
                :style="{ background: getCellBg(grid[slot][r - 1]) }"
              >
                <input
                  type="text"
                  v-model="grid[slot][r - 1].size"
                  class="cinp"
                  placeholder="Размер"
                  @input="markDirty(slot, r - 1)"
                  @blur="onFieldBlur(slot, r - 1)"
                />
              </td>
            </tr>

            <!-- Цвет -->
            <tr class="tr-field">
              <td class="td-lbl">Цвет</td>
              <td
                v-for="r in FITTING_ROOMS"
                :key="'cl' + r"
                class="td-inp"
                :style="{ background: getCellBg(grid[slot][r - 1]) }"
              >
                <input
                  type="text"
                  v-model="grid[slot][r - 1].color"
                  class="cinp"
                  placeholder="Цвет"
                  @input="markDirty(slot, r - 1)"
                  @blur="onFieldBlur(slot, r - 1)"
                />
              </td>
            </tr>

            <!-- Откуда узнал -->
            <tr class="tr-field">
              <td class="td-lbl">Откуда узнал</td>
              <td
                v-for="r in FITTING_ROOMS"
                :key="'sr' + r"
                class="td-inp"
                :style="{ background: getCellBg(grid[slot][r - 1]) }"
              >
                <select
                  v-model="grid[slot][r - 1].source"
                  class="cinp cinp-sel"
                  @change="
                    markDirty(slot, r - 1);
                    saveCell(slot, r - 1);
                  "
                >
                  <option value="">—</option>
                  <option v-for="s in VISIT_SOURCES" :key="s" :value="s">
                    {{ s }}
                  </option>
                </select>
              </td>
            </tr>

            <!-- Консультант (автокомплит) -->
            <tr class="tr-field">
              <td class="td-lbl">Консультант</td>
              <td
                v-for="r in FITTING_ROOMS"
                :key="'co' + r"
                class="td-inp td-inp--ac"
                :style="{ background: getCellBg(grid[slot][r - 1]) }"
              >
                <input
                  type="text"
                  v-model="grid[slot][r - 1].consultant"
                  class="cinp"
                  placeholder="Поиск консультанта..."
                  @input="onConsultantInput(slot, r - 1)"
                  @blur="onFieldBlur(slot, r - 1)"
                  @focus="onConsultantInput(slot, r - 1)"
                />
                <div
                  class="ac-drop"
                  v-if="
                    consultantOpen === consultantKey(slot, r - 1) &&
                    (consultantResults[consultantKey(slot, r - 1)] || []).length
                  "
                >
                  <div
                    class="ac-item"
                    v-for="emp in consultantResults[consultantKey(slot, r - 1)]"
                    :key="emp.id"
                    @mousedown.prevent="selectConsultant(slot, r - 1, emp)"
                  >
                    <span class="ac-name">{{ emp.full_name }}</span>
                    <span class="ac-extra" v-if="emp.position">{{
                      emp.position
                    }}</span>
                  </div>
                </div>
              </td>
            </tr>

            <!-- Комментарий -->
            <tr class="tr-field">
              <td class="td-lbl">Комментарий</td>
              <td
                v-for="r in FITTING_ROOMS"
                :key="'cm' + r"
                class="td-inp"
                :style="{ background: getCellBg(grid[slot][r - 1]) }"
              >
                <textarea
                  v-model="grid[slot][r - 1].comment"
                  class="cinp cinp--comment"
                  placeholder="Комментарий..."
                  rows="2"
                  @input="markDirty(slot, r - 1)"
                  @blur="onFieldBlur(slot, r - 1)"
                ></textarea>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- FOOTER -->
    <footer class="v-footer">
      <div class="v-fl">
        <span
          >Визитов: <b>{{ displayStats.total }}</b></span
        ><span v-if="isLoadingVisits" class="v-fl-load">загрузка...</span>
      </div>
      <div class="v-fr">
        <span class="lg lg--am">Отлож. без деп.</span>
        <span class="lg lg--bl">Отлож. с деп.</span>
        <span class="lg lg--ok">Купил</span>
        <span class="lg lg--er">Не купил / Не пришёл</span>
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
  --am: #d97706;
  --amh: #b45309;
  --aml: #fffbeb;
  --ok: #059669;
  --okl: #ecfdf5;
  --er: #dc2626;
  --erl: #fef2f2;
  --pu: #7c3aed;
  --pul: #f5f3ff;
  --bl: #2563eb;
  --bll: #eff6ff;
  --te: #0d9488;
  --tel: #f0fdfa;
  --r: 8px;
  --rs: 6px;
  --fn: "Manrope", -apple-system, BlinkMacSystemFont, sans-serif;
  --fm: "JetBrains Mono", monospace;
  --tr: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --cell-fill: #f8fafc;
  --cell-ok: #dcfce7;
  --cell-er: #fee2e2;
  --cell-am: #fef3c7;
  --cell-bl: #dbeafe;
  --cell-pu: #ede9fe;
}

.visits-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: var(--bg);
  font-family: var(--fn);
  color: var(--tx);
  overflow: hidden;
}

/* Header */
.v-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--sf);
  border-bottom: 1px solid var(--bd);
  flex-shrink: 0;
  gap: 10px;
}
.v-header-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.v-header-title {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
}
.v-badge {
  font: 700 12px/1 var(--fm);
  padding: 3px 8px;
  border-radius: 20px;
  background: var(--aml);
  color: var(--am);
}
.v-header-sub {
  font-size: 12px;
  color: var(--tx2);
  margin: 2px 0 0;
}
.v-header-btns {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

/* Buttons */
.vb {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  border-radius: var(--rs);
  font: 600 12px/1 var(--fn);
  border: none;
  cursor: pointer;
  transition: all var(--tr);
  white-space: nowrap;
}
.vb:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.vb--ghost {
  background: none;
  color: var(--tx2);
  border: 1px solid var(--bd);
}
.vb--ghost:hover:not(:disabled) {
  background: var(--sfh);
  color: var(--tx);
  border-color: var(--bds);
}
.vb--xs {
  padding: 5px 9px;
  font-size: 11px;
}

/* Stats */
.v-stats {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  background: var(--sf);
  border-bottom: 1px solid var(--bd);
  overflow-x: auto;
  flex-shrink: 0;
  scrollbar-width: none;
}
.v-stats::-webkit-scrollbar {
  display: none;
}
.vs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  background: var(--bg);
  border: 1px solid var(--bd);
  border-radius: var(--r);
  min-width: 105px;
  flex-shrink: 0;
}
.vs-i {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--rs);
  flex-shrink: 0;
}
.vs-i--am {
  background: var(--aml);
  color: var(--am);
}
.vs-i--ok {
  background: var(--okl);
  color: var(--ok);
}
.vs-i--te {
  background: var(--tel);
  color: var(--te);
}
.vs-b {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.vs-b b {
  font: 800 14px/1.1 var(--fm);
  letter-spacing: -0.02em;
}
.vs-b span {
  font-size: 9px;
  color: var(--txm);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Date bar */
.v-date {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 6px 16px;
  background: var(--sf);
  border-bottom: 1px solid var(--bd);
  flex-shrink: 0;
}
.v-date-arr {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--rs);
  border: 1px solid var(--bd);
  background: var(--sf);
  color: var(--tx2);
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--tr);
}
.v-date-arr:hover {
  background: var(--sfh);
  color: var(--tx);
}
.v-date-week {
  display: flex;
  gap: 2px;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
}
.v-date-week::-webkit-scrollbar {
  display: none;
}
.v-dc {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 8px;
  border-radius: var(--rs);
  border: 1px solid transparent;
  background: none;
  cursor: pointer;
  transition: all var(--tr);
  flex-shrink: 0;
  min-width: 48px;
}
.v-dc-d {
  font: 700 12px/1 var(--fm);
  color: var(--tx);
}
.v-dc-w {
  font: 500 8px/1 var(--fn);
  color: var(--txm);
  text-transform: uppercase;
  margin-top: 2px;
}
.v-dc:hover {
  background: var(--sfh);
}
.v-dc--act {
  background: var(--am) !important;
  border-color: var(--am);
}
.v-dc--act .v-dc-d {
  color: #fff;
}
.v-dc--act .v-dc-w {
  color: rgba(255, 255, 255, 0.8);
}
.v-dc--today:not(.v-dc--act) {
  border-color: var(--am);
}
.v-dc--today:not(.v-dc--act) .v-dc-d {
  color: var(--am);
}

/* Mobile */
.v-mob {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  background: var(--aml);
  border-bottom: 1px solid var(--bd);
  flex-shrink: 0;
}
.v-mob-h {
  font-size: 10px;
  color: var(--am);
  font-weight: 500;
}
.v-mob-fs {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--rs);
  border: 1px solid var(--am);
  background: var(--sf);
  color: var(--am);
  cursor: pointer;
}
.v-mob-fs:active {
  background: var(--am);
  color: #fff;
}
.v-fsx {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 12px;
  background: var(--sf);
  border-bottom: 1px solid var(--bd);
  flex-shrink: 0;
  font-size: 11px;
  color: var(--tx2);
}
.v-fsx-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 8px;
  border-radius: var(--rs);
  border: 1px solid var(--bd);
  background: var(--sf);
  color: var(--tx2);
  font: 600 10px var(--fn);
  cursor: pointer;
}
.visits-page--fs .v-header,
.visits-page--fs .v-stats,
.visits-page--fs .v-date,
.visits-page--fs .v-footer {
  display: none !important;
}

/* Loading */
.v-load {
  height: 3px;
  background: linear-gradient(90deg, var(--am), var(--pu), var(--am));
  background-size: 200% 100%;
  animation: ld 1.5s ease infinite;
  flex-shrink: 0;
}
@keyframes ld {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ═══ SPREADSHEET ═══ */
.v-grid {
  flex: 1;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  min-height: 0;
}
.sheet {
  border-collapse: collapse;
  width: 100%;
  min-width: 1100px;
  table-layout: fixed;
}
.col-time {
  width: 54px;
}
.col-lbl {
  width: 95px;
}
.col-room {
  /* Равномерно занимают оставшееся пространство */
}
.sheet thead th {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--sfh);
  font: 700 10px/1 var(--fn);
  color: var(--tx2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 8px 6px;
  border: 1px solid var(--bd);
  text-align: center;
  white-space: nowrap;
}
.sh-time {
  width: 54px;
  min-width: 54px;
}
.sh-lbl {
  width: 95px;
  min-width: 85px;
}
.sh-room {
  min-width: 160px;
}

/* Time cell */
.td-time {
  width: 54px;
  min-width: 54px;
  text-align: center;
  vertical-align: top;
  padding: 4px 2px;
  border: 1px solid var(--bd);
  background: var(--sfh);
}
.time-pill {
  display: inline-block;
  font: 700 12px/1 var(--fm);
  color: var(--am);
  background: var(--aml);
  padding: 3px 7px;
  border-radius: 4px;
}

/* Label cells */
.td-lbl {
  width: 95px;
  min-width: 85px;
  padding: 2px 6px;
  border: 1px solid var(--bd);
  background: var(--sfh);
  font: 600 9px/1.3 var(--fn);
  color: var(--tx2);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}
.td-lbl--h {
  font-weight: 700;
  color: var(--tx);
  text-transform: none;
  font-size: 10px;
}

/* Status cell */
.td-status {
  padding: 2px 3px;
  border: 1px solid var(--bd);
  vertical-align: middle;
  transition: background 0.15s;
}
.st-row {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: wrap;
}
.ck {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font: 600 8px/1 var(--fn);
  color: var(--txm);
  cursor: pointer;
  user-select: none;
  padding: 1px 3px;
  border-radius: 3px;
  transition: all var(--tr);
  white-space: nowrap;
}
.ck:hover {
  background: rgba(0, 0, 0, 0.04);
}
.ck--on {
  color: var(--ok);
}
.ck--er {
  color: var(--er);
}
.ck-b {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 13px;
  height: 13px;
  border: 1.5px solid var(--bds);
  border-radius: 3px;
  font-size: 9px;
  flex-shrink: 0;
  transition: all var(--tr);
}
.ck--on .ck-b {
  background: var(--ok);
  border-color: var(--ok);
  color: #fff;
}
.ck--er .ck-b {
  background: var(--er);
  border-color: var(--er);
  color: #fff;
}
.ck-b--er {
  border-color: var(--er);
}

/* Result buttons */
.rg {
  display: flex;
  gap: 2px;
  margin-left: auto;
}
.rb {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--bd);
  border-radius: 3px;
  background: var(--sf);
  font-size: 10px;
  cursor: pointer;
  transition: all var(--tr);
  opacity: 0.4;
}
.rb:hover {
  opacity: 1;
  transform: scale(1.1);
}
.rb--a {
  opacity: 1;
  border-width: 2px;
}
.res-ok {
  color: var(--ok);
}
.res-ok.rb--a {
  background: var(--okl);
  border-color: var(--ok);
}
.res-er {
  color: var(--er);
}
.res-er.rb--a {
  background: var(--erl);
  border-color: var(--er);
}
.res-am {
  color: var(--am);
}
.res-am.rb--a {
  background: var(--aml);
  border-color: var(--am);
}
.res-bl {
  color: var(--bl);
}
.res-bl.rb--a {
  background: var(--bll);
  border-color: var(--bl);
}

/* Input cells */
.td-inp {
  padding: 0;
  border: 1px solid var(--bd);
  vertical-align: middle;
  transition: background 0.15s;
  position: relative;
  overflow: visible;
}
.td-inp--ac {
  position: relative;
  overflow: visible;
}
.cinp {
  width: 100%;
  border: none;
  background: transparent;
  font: 400 11px var(--fn);
  color: var(--tx);
  padding: 3px 5px;
  outline: none;
  transition: all var(--tr);
  box-sizing: border-box;
}
.cinp:focus {
  background: rgba(217, 119, 6, 0.06);
  box-shadow: inset 0 0 0 2px var(--am);
}
.cinp::placeholder {
  color: var(--bds);
  font-size: 9px;
}
.cinp--mono {
  font-family: var(--fm);
  font-size: 10px;
}
.cinp--readonly {
  background: var(--sfh);
  color: var(--tx2);
  cursor: default;
}
.cinp-sel {
  font-size: 10px;
  cursor: pointer;
}

/* Комментарий — textarea вместо input */
.cinp--comment {
  width: 100%;
  border: none;
  background: transparent;
  font: 400 11px var(--fn);
  color: var(--tx);
  padding: 4px 5px;
  outline: none;
  transition: all var(--tr);
  box-sizing: border-box;
  resize: vertical;
  min-height: 36px;
  max-height: 120px;
  line-height: 1.4;
  display: block;
}
.cinp--comment:focus {
  background: rgba(217, 119, 6, 0.06);
  box-shadow: inset 0 0 0 2px var(--am);
}
.cinp--comment::placeholder {
  color: var(--bds);
  font-size: 9px;
}

/* Autocomplete dropdown */
.ac-drop {
  position: absolute;
  top: 100%;
  left: -1px;
  right: -1px;
  background: var(--sf);
  border: 1px solid var(--bds);
  border-top: 2px solid var(--am);
  border-radius: 0 0 var(--rs) var(--rs);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 100;
  max-height: 220px;
  overflow-y: auto;
  min-width: 200px;
}
.ac-item {
  padding: 8px 10px;
  cursor: pointer;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  border-bottom: 1px solid var(--bd);
  transition: background var(--tr);
}
.ac-item:last-child {
  border-bottom: none;
}
.ac-item:hover {
  background: var(--aml);
}
.ac-name {
  font-weight: 600;
  font-size: 11px;
  color: var(--tx);
}
.ac-phone {
  font: 500 10px var(--fm);
  color: var(--tx2);
}
.ac-extra {
  font-size: 9px;
  color: var(--txm);
  background: var(--sfh);
  padding: 1px 4px;
  border-radius: 3px;
}

/* Пустое состояние автокомплита */
.ac-empty {
  padding: 10px 12px;
  font-size: 11px;
  color: var(--tx2);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* Спиннер в автокомплите */
.ac-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid var(--bd);
  border-top-color: var(--am);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* Row separators */
.tr-time td {
  border-top: 2px solid var(--bds);
}

/* Footer */
.v-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  background: var(--sf);
  border-top: 1px solid var(--bd);
  font-size: 11px;
  color: var(--tx2);
  flex-shrink: 0;
}
.v-fl {
  display: flex;
  gap: 12px;
}
.v-fl b {
  color: var(--tx);
  font-family: var(--fm);
}
.v-fl-load {
  color: var(--am);
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
.v-fr {
  display: flex;
  gap: 5px;
}
.lg {
  font-size: 8px;
  font-weight: 600;
  padding: 2px 5px;
  border-radius: 3px;
  white-space: nowrap;
}
.lg--am {
  background: var(--cell-am);
  color: var(--am);
}
.lg--bl {
  background: var(--cell-bl);
  color: var(--bl);
}
.lg--ok {
  background: var(--cell-ok);
  color: var(--ok);
}
.lg--er {
  background: var(--cell-er);
  color: var(--er);
}

/* Transitions */
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
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.spinning {
  animation: spin 1s linear infinite;
}

/* Responsive */
@media (max-width: 768px) {
  .v-header {
    flex-direction: column;
    align-items: stretch;
    padding: 10px 12px;
    gap: 6px;
  }
  .v-header-btns {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }
  .v-header-btns .vb {
    justify-content: center;
    padding: 8px 4px;
  }
  .vb-t {
    display: none;
  }
  .v-header-title {
    font-size: 17px;
  }
  .v-stats {
    padding: 6px 12px;
    gap: 5px;
  }
  .vs {
    min-width: 95px;
    padding: 5px 8px;
  }
  .vs-b b {
    font-size: 12px;
  }
  .v-date {
    padding: 5px 8px;
  }
  .v-dc {
    padding: 3px 5px;
    min-width: 38px;
  }
  .v-dc-d {
    font-size: 10px;
  }
  .v-footer {
    flex-direction: column;
    gap: 3px;
    padding: 4px 12px;
    text-align: center;
  }
  .v-fr {
    flex-wrap: wrap;
    justify-content: center;
  }
  .sheet {
    min-width: 900px;
  }
}
@media (min-width: 400px) and (max-width: 768px) {
  .vb-t {
    display: inline;
  }
}
</style>
