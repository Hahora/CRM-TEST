<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { visitsApi, VISIT_STATUSES, VISIT_SOURCES } from "@/services/visitsApi";
import type {
  Visit,
  VisitStatus,
  VisitEmployee,
  ScheduleResponse,
  Branch,
  VisitStatsSummary,
} from "@/services/visitsApi";
import VisitEditModal from "@/components/visits/VisitEditModal.vue";
import type { VisitEditPayload } from "@/components/visits/VisitEditModal.vue";
import TimeSettingsModal from "@/components/visits/TimeSettingsModal.vue";
import type { TimeSettings } from "@/components/visits/TimeSettingsModal.vue";
import ClientCreateModal from "@/components/clients/ClientCreateModal.vue";
import ClientDetailModal from "@/components/clients/ClientDetailModal.vue";
import { clientsApi } from "@/services/clientsApi";
import {
  Phone,
  Mail,
  Shirt,
  Ruler,
  Palette,
  UserCheck,
  CheckCircle,
  XCircle,
  CircleDot,
  Ban,
  Hourglass,
  Banknote,
  ThumbsDown,
  Sunset,
  ShoppingBag,
  Clock,
} from "lucide-vue-next";

// ── State ──
const schedule = ref<ScheduleResponse | null>(null);
const isLoading = ref(true);
const selectedDate = ref(new Date());
const isMobile = ref(false);
const isFullscreen = ref(false);
const showStats = ref(false);
const showTimeSettings = ref(false);

// Branches
const branches = ref<Branch[]>([]);
const branchMoyskladId = ref<string>("");
const branchesLoaded = ref(false);

// Current branch helper
const currentBranch = computed(() =>
  branches.value.find((b) => b.moysklad_id === branchMoyskladId.value)
);

const dateStr = computed(() => selectedDate.value.toISOString().split("T")[0]);

// ── Time slots: loaded from branch schedule API ──
const branchScheduleSlots = ref<string[] | null>(null);
const branchAdditionalSlots = ref<string[]>([]);

const loadBranchTimeSlots = async () => {
  const branch = currentBranch.value;
  if (!branch?.local_id) return;
  try {
    const res = await visitsApi.getBranchScheduleForDate(
      branch.local_id,
      dateStr.value
    );
    branchScheduleSlots.value =
      res.merged_schedule || res.base_schedule || null;
    branchAdditionalSlots.value = res.additional_slots || [];
  } catch {
    branchScheduleSlots.value = null;
    branchAdditionalSlots.value = [];
  }
};

const timeSlots = computed(() => {
  const serverSlots = schedule.value?.time_slots || [];
  const scheduleSlots = branchScheduleSlots.value;
  const base =
    scheduleSlots ||
    (serverSlots.length
      ? serverSlots
      : [
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
        ]);
  // Also include time_slots from actual visits so they always appear in the grid
  const visitSlots = (schedule.value?.visits || []).map((v) => v.time_slot);
  const merged = [...new Set([...base, ...visitSlots])];
  return merged.sort((a, b) => a.localeCompare(b));
});
const fittingRooms = computed(
  () => schedule.value?.fitting_rooms || [1, 2, 3, 4, 5, 6]
);

// Grid
const grid = computed(() => {
  const g: Record<string, Record<number, Visit | null>> = {};
  for (const slot of timeSlots.value) {
    g[slot] = {};
    for (const room of fittingRooms.value) g[slot][room] = null;
  }
  if (schedule.value) {
    for (const v of schedule.value.visits) {
      if (g[v.time_slot]?.[v.fitting_room] !== undefined) {
        g[v.time_slot][v.fitting_room] = v;
      }
    }
  }
  return g;
});

// Date nav
const weekDates = computed(() => {
  const cur = new Date(selectedDate.value);
  const dow = cur.getDay();
  const mon = new Date(cur);
  mon.setDate(cur.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
});
const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
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
const dateDisplay = computed(() => ({
  day: selectedDate.value.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  }),
  weekday: selectedDate.value.toLocaleDateString("ru-RU", { weekday: "short" }),
}));

// Load
const loadBranches = async () => {
  try {
    const resp = await visitsApi.getBranches();
    branches.value = (Array.isArray(resp) ? resp : []).filter(
      (b) => b.is_active
    );
    if (
      branches.value.length &&
      !branches.value.find((b) => b.moysklad_id === branchMoyskladId.value)
    ) {
      branchMoyskladId.value = branches.value[0].moysklad_id;
    }
    branchesLoaded.value = true;
  } catch (e) {
    console.error("Ошибка загрузки филиалов:", e);
    branchesLoaded.value = true;
  }
};

const loadSchedule = async () => {
  if (!branchMoyskladId.value) return;
  isLoading.value = true;
  try {
    schedule.value = await visitsApi.getSchedule(
      dateStr.value,
      branchMoyskladId.value
    );
  } catch (e) {
    console.error("Ошибка загрузки расписания:", e);
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
  await loadBranches();
  await loadBranchTimeSlots();
  await loadSchedule();
});
onUnmounted(() => window.removeEventListener("resize", checkMobile));
watch(selectedDate, () => {
  loadBranchTimeSlots();
  loadSchedule();
});
watch(branchMoyskladId, () => {
  loadBranchTimeSlots();
  loadSchedule();
  if (showStats.value) loadVisitStats();
  filterEmployeesLoaded.value = false;
  if (showFilters.value) loadFilterEmployees();
});
watch(showStats, (v) => {
  if (v && !visitStats.value) loadVisitStats();
});

// ── Stats (server-side) ──
const totalVisits = computed(() => schedule.value?.visits.length || 0);
const visitStats = ref<VisitStatsSummary | null>(null);
const isLoadingStats = ref(false);

// Период статистики (дефолт: начало года → сегодня)
const today = new Date().toISOString().slice(0, 10);
const yearStart = `${new Date().getFullYear()}-01-01`;
const statFrom = ref(yearStart);
const statTo = ref(today);

const loadVisitStats = async (from?: string, to?: string) => {
  isLoadingStats.value = true;
  try {
    visitStats.value = await visitsApi.getVisitStats({
      startDate: from || statFrom.value,
      endDate: to || statTo.value,
      branchMoyskladId: branchMoyskladId.value || undefined,
    });
  } catch (e) {
    console.error("Ошибка загрузки статистики визитов:", e);
  } finally {
    isLoadingStats.value = false;
  }
};

const handleStatsDateChange = () => {
  if (statFrom.value && statTo.value) {
    loadVisitStats(statFrom.value, statTo.value);
  }
};

const setStatPreset = (preset: string) => {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  let from = "";
  switch (preset) {
    case "today":
      from = todayStr;
      break;
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      from = d.toISOString().slice(0, 10);
      break;
    }
    case "month":
      from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        "0"
      )}-01`;
      break;
    case "quarter": {
      const qm = Math.floor(now.getMonth() / 3) * 3 + 1;
      from = `${now.getFullYear()}-${String(qm).padStart(2, "0")}-01`;
      break;
    }
    case "year":
      from = `${now.getFullYear()}-01-01`;
      break;
    case "all":
      from = "2020-01-01";
      break;
  }
  statFrom.value = from;
  statTo.value = todayStr;
  loadVisitStats(from, todayStr);
};

const activePreset = computed(() => {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  if (statTo.value !== todayStr) return "";
  const y = now.getFullYear();
  const m = now.getMonth();
  const ys = `${y}-01-01`;
  const ms = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const qm = Math.floor(m / 3) * 3 + 1;
  const qs = `${y}-${String(qm).padStart(2, "0")}-01`;
  const w = new Date(now);
  w.setDate(w.getDate() - 7);
  const ws = w.toISOString().slice(0, 10);
  if (statFrom.value === todayStr) return "today";
  if (statFrom.value === ws) return "week";
  if (statFrom.value === ms) return "month";
  if (statFrom.value === qs) return "quarter";
  if (statFrom.value === ys) return "year";
  if (statFrom.value === "2020-01-01") return "all";
  return "";
});

// ── Edit modal ──
const editOpen = ref(false);
const editPayload = ref<VisitEditPayload | null>(null);
const visitEditRef = ref<InstanceType<typeof VisitEditModal> | null>(null);
const showNewClientModal = ref(false);

// ── Client detail modal ──
const clientDetailId = ref<string | null>(null);
const openClientDetail = (
  moyskladId: string | null | undefined,
  event: Event
) => {
  event.stopPropagation();
  if (moyskladId) clientDetailId.value = moyskladId;
};

const openCell = (slot: string, room: number) => {
  editPayload.value = {
    slot,
    room,
    visit: grid.value[slot]?.[room] || null,
    dateStr: dateStr.value,
    branchMoyskladId: branchMoyskladId.value,
  };
  editOpen.value = true;
};
const onEditSaved = () => loadSchedule();
const onEditClose = () => {
  editOpen.value = false;
};
const onTimeSettingsSave = (_settings: TimeSettings) => {
  loadBranchTimeSlots();
  loadSchedule();
  showTimeSettings.value = false;
};
const onOpenNewClient = () => {
  showNewClientModal.value = true;
};
const onNewClientCreated = async (data: any) => {
  showNewClientModal.value = false;
  if (!data || !visitEditRef.value) return;
  try {
    // Build `name` для individual — оно пустое, имя в legal_first_name
    const fullName =
      data.name?.trim() ||
      `${data.legal_first_name || ""} ${data.legal_last_name || ""} ${data.legal_middle_name || ""}`.trim();

    // Убираем пустые строки для полей с форматной валидацией
    const payload: Record<string, any> = { ...data, name: fullName };
    const stripIfEmpty = ["wedding_date", "birth_date", "email", "inn", "kpp", "ogrn", "ogrnip", "source", "bride_name"];
    for (const f of stripIfEmpty) {
      if (!payload[f]) delete payload[f];
    }

    const created = await clientsApi.createClient(payload as any);
    const client = {
      moysklad_id: (created as any).moysklad_id || "",
      name:
        (created as any).full_name ||
        (created as any).name ||
        data.name ||
        `${data.legal_last_name || ""} ${data.legal_first_name || ""} ${
          data.legal_middle_name || ""
        }`.trim(),
      phone: (created as any).phone || data.phone || "",
      email: (created as any).email || data.email || "",
    };
    visitEditRef.value.onNewClientCreated(client);
  } catch (e) {
    console.error("Ошибка создания клиента:", e);
    // Fallback: use form data without moysklad_id
    const client = {
      moysklad_id: "",
      name:
        data.name ||
        `${data.legal_last_name || ""} ${data.legal_first_name || ""} ${
          data.legal_middle_name || ""
        }`.trim(),
      phone: data.phone || "",
      email: data.email || "",
    };
    visitEditRef.value.onNewClientCreated(client);
  }
};

// ── CSV export ──
const exportCsv = () => {
  const visits = schedule.value?.visits || [];
  if (!visits.length) return;
  const headers = [
    "Время",
    "Примерочная",
    "Клиент",
    "Телефон",
    "Email",
    "Размер",
    "Цвет",
    "Откуда",
    "Консультант",
    "Должность",
    "Статус",
    "Примерка",
    "Комментарий",
  ];
  const rows = visits.map((v) =>
    [
      v.time_slot,
      v.fitting_room,
      v.client?.name || v.client?.full_name || "",
      v.client?.phone || "",
      v.client?.email || "",
      v.size || "",
      v.color || "",
      v.source || "",
      v.employee?.full_name || "",
      v.employee?.position || "",
      VISIT_STATUSES.find((s) => s.value === v.status)?.label || v.status,
      v.fitting ? "Да" : "Нет",
      v.notes || "",
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const branchName = currentBranch.value?.name || "branch";
  a.download = `visits_${branchName}_${dateStr.value}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// Helpers
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

const russianStatusMap: Record<string, VisitStatus> = {
  записался: "zapisalsya",
  пришел: "prishel",
  пришёл: "prishel",
  "не пришел": "ne_prishel",
  "не пришёл": "ne_prishel",
  "отложил без депозита": "otlozhil_bez_depozita",
  "отложил с депозитом": "otlozhil_s_depozitom",
  купил: "kupil",
  "сделка провалена": "sdelka_provalena",
  "выкупил депозит": "vykupil_depozit",
};
const norm = (s: string): VisitStatus =>
  (VISIT_STATUSES.some((x: { value: VisitStatus }) => x.value === s)
    ? s
    : russianStatusMap[s.toLowerCase()] || "zapisalsya") as VisitStatus;

const statusLabel = (s: string) => {
  const n = norm(s);
  return VISIT_STATUSES.find((x) => x.value === n)?.label || s;
};
const statusColor = (s: string): string => {
  switch (norm(s)) {
    case "kupil":
    case "vykupil_depozit":
      return "var(--ok)";
    case "ne_prishel":
    case "sdelka_provalena":
      return "var(--er)";
    case "otlozhil_bez_depozita":
    case "otlozhil_do_vechera":
      return "var(--am)";
    case "otlozhil_s_depozitom":
      return "#2563eb";
    case "prishel":
      return "var(--te)";
    case "zapisalsya":
      return "var(--pu)";
    default:
      return "var(--txm)";
  }
};
const statusBg = (s: string): string => {
  switch (norm(s)) {
    case "kupil":
    case "vykupil_depozit":
      return "#dcfce7";
    case "ne_prishel":
    case "sdelka_provalena":
      return "#fee2e2";
    case "otlozhil_bez_depozita":
    case "otlozhil_do_vechera":
      return "#fef3c7";
    case "otlozhil_s_depozitom":
      return "#dbeafe";
    case "prishel":
      return "#ccfbf1";
    case "zapisalsya":
      return "#ede9fe";
    default:
      return "var(--sfh)";
  }
};

// ── Card helpers ──
const isPhantomVisit = (v: Visit) =>
  v.is_phantom_client || v.client?.is_phantom || false;

const getRecommender = (source: string | null) => {
  if (!source?.startsWith("Порекомендовали: ")) return null;
  return source.replace("Порекомендовали: ", "");
};

// ── Filters ──
const showFilters = ref(false);
const filterStatuses = ref<VisitStatus[]>([]);
const filterEmployeeId = ref("");
const filterEmployees = ref<VisitEmployee[]>([]);
const isLoadingFilterEmployees = ref(false);
const filterEmployeesLoaded = ref(false);

const hasActiveFilters = computed(
  () => filterStatuses.value.length > 0 || filterEmployeeId.value !== ""
);
const activeFilterCount = computed(
  () => filterStatuses.value.length + (filterEmployeeId.value ? 1 : 0)
);

const loadFilterEmployees = async () => {
  if (!branchMoyskladId.value || filterEmployeesLoaded.value) return;
  isLoadingFilterEmployees.value = true;
  try {
    filterEmployees.value = await visitsApi.getEmployeesByBranch(
      branchMoyskladId.value
    );
    filterEmployeesLoaded.value = true;
  } catch {
    filterEmployees.value = [];
  }
  isLoadingFilterEmployees.value = false;
};

const toggleShowFilters = () => {
  showFilters.value = !showFilters.value;
  if (showFilters.value) loadFilterEmployees();
};
const clearFilters = () => {
  filterStatuses.value = [];
  filterEmployeeId.value = "";
};
const toggleStatusFilter = (status: VisitStatus) => {
  const idx = filterStatuses.value.indexOf(status);
  if (idx === -1) filterStatuses.value.push(status);
  else filterStatuses.value.splice(idx, 1);
};
const matchesFilter = (v: Visit | null | undefined): boolean => {
  if (!v) return false;
  if (!hasActiveFilters.value) return true;
  if (
    filterStatuses.value.length > 0 &&
    !filterStatuses.value.includes(v.status)
  )
    return false;
  if (filterEmployeeId.value && v.employee_moysklad_id !== filterEmployeeId.value)
    return false;
  return true;
};

// ── Disabled room: предыдущая примерочная должна быть занята ──
const isRoomDisabled = (slot: string, room: number): boolean => {
  const rooms = fittingRooms.value;
  const idx = rooms.indexOf(room);
  if (idx <= 0) return false;
  const prev = rooms[idx - 1] as number | undefined;
  if (prev === undefined) return false;
  return !grid.value[slot]?.[prev];
};

// ── Fitting toggle inline ──
const toggleFitting = async (visit: Visit | null, e: Event) => {
  if (!visit) return;
  const checked = (e.target as HTMLInputElement).checked;
  try {
    await visitsApi.updateVisit(visit.id, { fitting: checked });
    visit.fitting = checked;
  } catch (err) {
    console.error("Ошибка обновления примерки:", err);
    (e.target as HTMLInputElement).checked = !checked;
  }
};
</script>

<template>
  <div class="vp" :class="{ 'vp--fs': isFullscreen }">
    <!-- HEADER -->
    <header class="vp-header">
      <div class="vp-hl">
        <h1 class="vp-title">Посещения</h1>
        <span class="vp-badge">{{ totalVisits }}</span>
      </div>
      <div class="vp-hbtns">
        <select v-model="branchMoyskladId" class="vp-branch">
          <option
            v-for="b in branches"
            :key="b.moysklad_id"
            :value="b.moysklad_id"
          >
            {{ b.name }}
          </option>
        </select>
        <button
          class="hbtn hbtn--ghost"
          @click="showTimeSettings = true"
          title="Настройки времени"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
            />
          </svg>
        </button>
        <button
          class="hbtn hbtn--ghost"
          @click="toggleShowFilters"
          :class="{ 'hbtn--active': showFilters || hasActiveFilters }"
          title="Фильтры"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <span v-if="activeFilterCount > 0" class="hbtn-badge">{{ activeFilterCount }}</span>
        </button>
        <button
          class="hbtn hbtn--ghost"
          @click="showStats = !showStats"
          :class="{ 'hbtn--active': showStats }"
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
        <button class="hbtn hbtn--ghost" @click="exportCsv" title="CSV">
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
          @click="loadSchedule"
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

    <!-- STATS -->
    <Transition name="fold">
      <div v-if="showStats" class="vp-stats-panel">
        <!-- Период -->
        <div class="vp-stats-period">
          <div class="vp-stats-dates">
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
              class="vp-stats-dinput"
            />
            <span class="vp-stats-sep">—</span>
            <input
              type="date"
              v-model="statTo"
              @change="handleStatsDateChange"
              class="vp-stats-dinput"
            />
            <div v-if="isLoadingStats" class="vp-stats-dot"></div>
          </div>
          <div class="vp-stats-presets">
            <button
              class="vp-sp"
              :class="{ 'vp-sp--on': activePreset === 'today' }"
              @click="setStatPreset('today')"
            >
              Сегодня
            </button>
            <button
              class="vp-sp"
              :class="{ 'vp-sp--on': activePreset === 'week' }"
              @click="setStatPreset('week')"
            >
              7 дней
            </button>
            <button
              class="vp-sp"
              :class="{ 'vp-sp--on': activePreset === 'month' }"
              @click="setStatPreset('month')"
            >
              Месяц
            </button>
            <button
              class="vp-sp"
              :class="{ 'vp-sp--on': activePreset === 'quarter' }"
              @click="setStatPreset('quarter')"
            >
              Квартал
            </button>
            <button
              class="vp-sp"
              :class="{ 'vp-sp--on': activePreset === 'year' }"
              @click="setStatPreset('year')"
            >
              Год
            </button>
            <button
              class="vp-sp"
              :class="{ 'vp-sp--on': activePreset === 'all' }"
              @click="setStatPreset('all')"
            >
              Всё время
            </button>
          </div>
        </div>
        <!-- Карточки -->
        <div class="vp-stats-row">
          <div class="vs">
            <div class="vs-i vs-i--pr">
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
              <b>{{ visitStats?.total_visits ?? "—" }}</b
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
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div class="vs-b">
              <b>{{ visitStats?.purchased_count ?? "—" }}</b
              ><span>Купили</span>
            </div>
          </div>
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
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div class="vs-b">
              <b>{{
                (visitStats?.postponed_deposit_count ?? 0) +
                (visitStats?.postponed_no_deposit_count ?? 0)
              }}</b
              ><span>Отложили</span>
            </div>
          </div>
          <div class="vs">
            <div class="vs-i vs-i--er">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div class="vs-b">
              <b>{{ visitStats?.no_show_count ?? "—" }}</b
              ><span>Не пришли</span>
            </div>
          </div>
          <div class="vs">
            <div class="vs-i vs-i--pu">
              <svg
                width="15"
                height="15"
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
            <div class="vs-b">
              <b>{{ visitStats?.failed_count ?? "—" }}</b
              ><span>Провалено</span>
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
              <b>{{
                visitStats?.conversion_rate != null
                  ? visitStats.conversion_rate.toFixed(1) + "%"
                  : "—"
              }}</b
              ><span>Конверсия</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- FILTER PANEL -->
    <Transition name="fold">
      <div v-if="showFilters" class="vp-filter-panel">
        <div class="vp-fp-group">
          <span class="vp-fp-label">Консультант</span>
          <select v-model="filterEmployeeId" class="vp-fp-select">
            <option value="">{{ isLoadingFilterEmployees ? 'Загрузка...' : 'Все' }}</option>
            <option
              v-for="emp in filterEmployees"
              :key="emp.moysklad_id"
              :value="emp.moysklad_id"
            >{{ emp.full_name }}</option>
          </select>
        </div>
        <div class="vp-fp-group vp-fp-group--grow">
          <span class="vp-fp-label">Статус</span>
          <div class="vp-fp-statuses">
            <button
              v-for="s in VISIT_STATUSES"
              :key="s.value"
              class="vp-fp-st"
              :class="{ 'vp-fp-st--on': filterStatuses.includes(s.value) }"
              :style="filterStatuses.includes(s.value)
                ? { background: statusBg(s.value), color: statusColor(s.value), borderColor: statusColor(s.value) }
                : {}"
              @click="toggleStatusFilter(s.value)"
            >{{ s.label }}</button>
          </div>
        </div>
        <button v-if="hasActiveFilters" class="vp-fp-clear" @click="clearFilters">
          Сбросить
        </button>
      </div>
    </Transition>

    <!-- DATE BAR -->
    <div class="vp-date">
      <button class="vp-date-arr" @click="prevDay">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <div class="vp-week">
        <button
          v-for="d in weekDates"
          :key="d.toISOString()"
          class="vp-dc"
          :class="{
            'vp-dc--act': isSameDay(d, selectedDate),
            'vp-dc--today': isToday(d),
          }"
          @click="selectDay(d)"
        >
          <span class="vp-dc-d"
            >{{ d.getDate().toString().padStart(2, "0") }}.{{
              (d.getMonth() + 1).toString().padStart(2, "0")
            }}</span
          >
          <span class="vp-dc-w">{{
            d.toLocaleDateString("ru-RU", { weekday: "short" })
          }}</span>
        </button>
      </div>
      <button class="vp-date-arr" @click="nextDay">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      <button
        class="hbtn hbtn--ghost hbtn--xs"
        @click="goToday"
        style="margin-left: 6px"
      >
        Сегодня
      </button>
    </div>

    <!-- MOBILE BAR -->
    <div class="vp-mob" v-if="isMobile && !isFullscreen">
      <span class="vp-mob-hint">
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
      </span>
      <button
        class="vp-mob-fs"
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
    <div class="vp-fsx" v-if="isFullscreen">
      <span class="vp-fsx-info"
        >{{ dateDisplay.day }} · <b>{{ totalVisits }}</b> визитов ·
        {{ currentBranch?.name || "" }}</span
      >
      <button class="vp-fsx-btn" @click="isFullscreen = false">
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

    <!-- GRID -->
    <div class="vp-grid">
      <table class="vp-table">
        <thead>
          <tr>
            <th class="vp-th-time">Время</th>
            <th v-for="r in fittingRooms" :key="r" class="vp-th-room">
              Прим.&nbsp;{{ r }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="slot in timeSlots" :key="slot">
            <td class="vp-td-time">
              <span class="vp-time-pill">{{ slot }}</span>
            </td>
            <td
              v-for="r in fittingRooms"
              :key="r"
              class="vp-td-cell"
              :class="{ 'vp-td-cell--off': isRoomDisabled(slot, r) }"
              @click="!isLoading && !isRoomDisabled(slot, r) && openCell(slot, r)"
            >
              <!-- Loading shimmer skeleton -->
              <div v-if="isLoading" class="vp-skel">
                <div class="vp-skel-line vp-skel-w70"></div>
                <div class="vp-skel-line vp-skel-w50"></div>
                <div class="vp-skel-line vp-skel-w90"></div>
                <div class="vp-skel-line vp-skel-w40"></div>
              </div>
              <!-- Visit card -->
              <template v-else-if="grid[slot]?.[r]">
                <!-- Визит есть но отфильтрован — заглушка -->
                <div v-if="!matchesFilter(grid[slot]?.[r])" class="vp-card-hidden"></div>
                <div
                  v-else
                  class="vp-card"
                  :style="{ borderLeftColor: statusColor(grid[slot][r]?.status) }"
                >
                  <div class="vp-card-top">
                    <span
                      class="vp-card-name"
                      :class="{ 'vp-card-name--link': !isPhantomVisit(grid[slot][r]) }"
                      @click.stop="
                        !isPhantomVisit(grid[slot][r]) &&
                          openClientDetail(grid[slot][r]?.client_moysklad_id, $event)
                      "
                    >
                      <span v-if="isPhantomVisit(grid[slot][r])" class="vp-card-phantom-ico" title="Анонимный гость">👤</span>
                      {{ grid[slot][r]?.client?.name || grid[slot][r]?.client?.full_name || (isPhantomVisit(grid[slot][r]) ? "Гость" : "—") }}
                    </span>
                    <span
                      class="vp-card-badge"
                      :style="{ background: statusBg(grid[slot][r]?.status), color: statusColor(grid[slot][r]?.status) }"
                      >{{ statusLabel(grid[slot][r]?.status) }}</span
                    >
                  </div>
                  <div class="vp-card-contacts">
                    <a
                      v-if="grid[slot][r]?.client?.phone"
                      class="vp-card-phone"
                      :href="'tel:' + grid[slot][r]?.client?.phone"
                      @click.stop
                    >
                      <Phone :size="11" /> {{ grid[slot][r]?.client?.phone }}
                    </a>
                  </div>
                  <!-- Postponed info -->
                  <div v-if="grid[slot][r]?.postponed_until" class="vp-card-postponed">
                    <Clock :size="10" /> до {{ grid[slot][r]?.postponed_until }}
                    <template v-if="grid[slot][r]?.deposit_amount">
                      · {{ grid[slot][r]?.deposit_amount?.toLocaleString('ru-RU') }} ₽
                    </template>
                  </div>
                  <div class="vp-card-meta">
                    <span v-if="grid[slot][r]?.size"
                      ><Ruler :size="10" /> {{ grid[slot][r]?.size }}</span
                    >
                    <span v-if="grid[slot][r]?.color"
                      ><Palette :size="10" /> {{ grid[slot][r]?.color }}</span
                    >
                    <label class="vp-card-fitting-cb" @click.stop>
                      <input
                        type="checkbox"
                        :checked="grid[slot][r]?.fitting"
                        @change="toggleFitting(grid[slot][r], $event)"
                      />
                      <Shirt :size="10" /> Примерка
                    </label>
                    <span
                      v-if="grid[slot][r]?.source && !getRecommender(grid[slot][r]?.source)"
                      class="vp-card-src"
                    >{{ grid[slot][r]?.source }}</span>
                    <span
                      v-if="getRecommender(grid[slot][r]?.source)"
                      class="vp-card-rec"
                    >Рек: {{ getRecommender(grid[slot][r]?.source) }}</span>
                  </div>
                  <div v-if="grid[slot][r]?.employee" class="vp-card-emp-row">
                    <span class="vp-card-emp"
                      ><UserCheck :size="10" />
                      {{ grid[slot][r]?.employee?.full_name }}</span
                    >
                  </div>
                  <div v-if="grid[slot][r]?.notes" class="vp-card-notes">{{ grid[slot][r]?.notes }}</div>
                </div>
              </template>
              <!-- Empty -->
              <div v-else class="vp-empty">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  opacity=".25"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- FOOTER -->
    <footer class="vp-footer">
      <span
        >{{ dateDisplay.day }} {{ dateDisplay.weekday }} ·
        <b>{{ totalVisits }}</b> визитов · {{ currentBranch?.name || "" }}</span
      >
      <div class="vp-legend">
        <span class="vp-lg" style="background: #dcfce7; color: #059669"
          >Купил</span
        >
        <span class="vp-lg" style="background: #fef3c7; color: #d97706"
          >Отложил</span
        >
        <span class="vp-lg" style="background: #dbeafe; color: #2563eb"
          >С деп.</span
        >
        <span class="vp-lg" style="background: #fee2e2; color: #dc2626"
          >Не пришёл</span
        >
        <span class="vp-lg" style="background: #ede9fe; color: #7c3aed"
          >Записался</span
        >
      </div>
    </footer>
  </div>

  <VisitEditModal
    ref="visitEditRef"
    :open="editOpen"
    :payload="editPayload"
    @close="onEditClose"
    @saved="onEditSaved"
    @open-new-client="onOpenNewClient"
  />

  <ClientCreateModal
    :open="showNewClientModal"
    :sources="VISIT_SOURCES"
    @close="showNewClientModal = false"
    @create="onNewClientCreated"
  />

  <TimeSettingsModal
    :open="showTimeSettings"
    :branch-id="currentBranch?.local_id || null"
    :branch-name="currentBranch?.name || ''"
    :current-date="dateStr"
    @close="showTimeSettings = false"
    @save="onTimeSettingsSave"
  />

  <ClientDetailModal
    :moysklad-id="clientDetailId"
    @close="clientDetailId = null"
    @delete="clientDetailId = null"
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

.vp {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg);
  font-family: var(--fn);
  color: var(--tx);
  overflow: hidden;
}

.vp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: var(--sf);
  border-bottom: 1px solid var(--bd);
  flex-shrink: 0;
  gap: 8px;
}
.vp-hl {
  display: flex;
  align-items: center;
  gap: 8px;
}
.vp-title {
  font: 800 17px/1 var(--fn);
  letter-spacing: -0.02em;
  margin: 0;
}
.vp-badge {
  background: var(--prl);
  color: var(--pr);
  font: 700 11px/1 var(--fm);
  padding: 2px 7px;
  border-radius: 20px;
}
.vp-hbtns {
  display: flex;
  gap: 4px;
  align-items: center;
}
.vp-branch {
  padding: 6px 10px;
  border: 1px solid var(--bd);
  border-radius: var(--rs);
  font: 600 11px/1 var(--fn);
  background: var(--sf);
  color: var(--tx);
  cursor: pointer;
  outline: none;
  transition: all var(--tr);
  max-width: 160px;
}
.vp-branch:focus {
  border-color: var(--pr);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.08);
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
.hbtn--xs {
  padding: 5px 9px;
  font-size: 10px;
}

.vp-stats-panel {
  background: var(--sf);
  border-bottom: 1px solid var(--bd);
  flex-shrink: 0;
}
.vp-stats-period {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--bd);
  flex-wrap: wrap;
}
.vp-stats-dates {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--tx2);
}
.vp-stats-dinput {
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
.vp-stats-dinput:focus {
  border-color: var(--pr);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
  background: var(--sf);
}
.vp-stats-sep {
  color: var(--txm);
  font-size: 12px;
  user-select: none;
}
.vp-stats-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--pr);
  animation: pulse 1s ease-in-out infinite;
  margin-left: 4px;
}
.vp-stats-presets {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.vp-sp {
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
.vp-sp:hover {
  background: var(--sfh);
  color: var(--tx);
  border-color: var(--bds);
}
.vp-sp--on {
  background: var(--pr);
  color: #fff;
  border-color: var(--pr);
}
.vp-sp--on:hover {
  background: var(--prh);
  border-color: var(--prh);
}
.vp-stats-row {
  display: flex;
  gap: 6px;
  padding: 8px 14px;
  overflow-x: auto;
  flex-shrink: 0;
  scrollbar-width: none;
}
.vp-stats-row::-webkit-scrollbar {
  display: none;
}
.vs {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 10px;
  background: var(--bg);
  border: 1px solid var(--bd);
  border-radius: var(--r);
  min-width: 90px;
  flex-shrink: 0;
}
.vs-i {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--rs);
  flex-shrink: 0;
}
.vs-i--pr {
  background: var(--prl);
  color: var(--pr);
}
.vs-i--ok {
  background: var(--okl);
  color: var(--ok);
}
.vs-i--am {
  background: var(--aml);
  color: var(--am);
}
.vs-i--er {
  background: var(--erl);
  color: var(--er);
}
.vs-i--te {
  background: var(--tel);
  color: var(--te);
}
.vs-i--pu {
  background: var(--pul);
  color: var(--pu);
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
  font: 500 8px/1 var(--fn);
  color: var(--txm);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.vp-date {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: var(--sf);
  border-bottom: 1px solid var(--bd);
  flex-shrink: 0;
}
.vp-date-arr {
  width: 32px;
  height: 40px;
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
.vp-date-arr:hover {
  background: var(--sfh);
  color: var(--tx);
}
.vp-week {
  display: flex;
  gap: 3px;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
}
.vp-week::-webkit-scrollbar {
  display: none;
}
.vp-dc {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 4px;
  border-radius: var(--rs);
  border: 1px solid transparent;
  background: none;
  cursor: pointer;
  transition: all var(--tr);
  flex: 1;
  min-width: 48px;
}
.vp-dc-d {
  font: 700 14px/1 var(--fm);
  color: var(--tx);
}
.vp-dc-w {
  font: 500 11px/1 var(--fn);
  color: var(--txm);
  text-transform: uppercase;
  margin-top: 3px;
}
.vp-dc:hover {
  background: var(--sfh);
}
.vp-dc--act {
  background: var(--pr) !important;
  border-color: var(--pr);
}
.vp-dc--act .vp-dc-d {
  color: #fff;
}
.vp-dc--act .vp-dc-w {
  color: rgba(255, 255, 255, 0.8);
}
.vp-dc--today:not(.vp-dc--act) {
  border-color: var(--pr);
}
.vp-dc--today:not(.vp-dc--act) .vp-dc-d {
  color: var(--pr);
}

.vp-loading {
  height: 3px;
  flex-shrink: 0;
  overflow: hidden;
  background: rgba(37, 99, 235, 0.1);
}
.vp-loading-bar {
  height: 100%;
  width: 40%;
  background: linear-gradient(90deg, var(--pr), var(--pu), var(--pr));
  border-radius: 2px;
  animation: vp-slide 1.2s ease-in-out infinite;
}
@keyframes vp-slide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(350%);
  }
}

/* Skeleton shimmer */
.vp-skel {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}
.vp-skel-line {
  height: 10px;
  border-radius: 5px;
  background: linear-gradient(
    90deg,
    var(--bd, #e2e8f0) 25%,
    var(--sfh, #f1f5f9) 50%,
    var(--bd, #e2e8f0) 75%
  );
  background-size: 400% 100%;
  animation: vp-shimmer 1.5s ease-in-out infinite;
}
.vp-skel-w70 {
  width: 70%;
}
.vp-skel-w50 {
  width: 50%;
}
.vp-skel-w90 {
  width: 90%;
}
.vp-skel-w40 {
  width: 40%;
}
@keyframes vp-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.vp-grid {
  flex: 1;
  overflow: auto;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
}
.vp-table {
  border-collapse: collapse;
  width: 100%;
  min-width: 900px;
}
.vp-table thead th {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--sfh);
  font: 700 12px/1 var(--fn);
  color: var(--tx2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 10px 8px;
  border: 1px solid var(--bd);
  text-align: center;
  white-space: nowrap;
}
.vp-th-time {
  width: 64px;
  min-width: 64px;
}
.vp-th-room {
  min-width: 220px;
  width: 260px;
}
.vp-td-time {
  width: 64px;
  min-width: 64px;
  text-align: center;
  vertical-align: middle;
  padding: 6px;
  border: 1px solid var(--bd);
  background: var(--sfh);
}
.vp-time-pill {
  display: inline-block;
  font: 700 13px/1 var(--fm);
  color: var(--pr);
  background: var(--prl);
  padding: 5px 10px;
  border-radius: 6px;
}
/* ── Table cell ── */
.vp-td-cell {
  border: 1px solid var(--bd);
  padding: 4px;
  vertical-align: top;
  cursor: pointer;
  transition: background var(--tr);
  height: 160px; /* min-height в контексте таблицы — строка растянется если контент больше */
}
.vp-td-cell:hover {
  background: var(--sfh);
}
/* ── Filter panel ── */
.vp-filter-panel {
  background: var(--sf);
  border-bottom: 1px solid var(--bd);
  padding: 10px 14px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.vp-fp-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.vp-fp-group--grow {
  flex: 1;
  min-width: 0;
}
.vp-fp-label {
  font: 700 10px/1 var(--fn);
  color: var(--tx2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.vp-fp-select {
  padding: 6px 10px;
  border: 1.5px solid var(--bd);
  border-radius: var(--rs);
  font: 500 12px/1 var(--fn);
  background: var(--bg);
  color: var(--tx);
  outline: none;
  min-width: 180px;
  cursor: pointer;
  transition: border-color var(--tr);
}
.vp-fp-select:focus {
  border-color: var(--pr);
}
.vp-fp-statuses {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.vp-fp-st {
  padding: 5px 10px;
  border-radius: 6px;
  border: 1.5px solid var(--bd);
  background: var(--sf);
  font: 600 11px/1 var(--fn);
  color: var(--tx2);
  cursor: pointer;
  transition: all 150ms;
  white-space: nowrap;
}
.vp-fp-st:hover {
  border-color: var(--bds);
  background: var(--sfh);
  color: var(--tx);
}
.vp-fp-st--on {
  font-weight: 700;
}
.vp-fp-clear {
  align-self: flex-end;
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid var(--er);
  background: var(--erl);
  color: var(--er);
  font: 600 11px/1 var(--fn);
  cursor: pointer;
  transition: all 150ms;
  white-space: nowrap;
}
.vp-fp-clear:hover {
  background: var(--er);
  color: #fff;
}

/* Бейдж на кнопке фильтра */
.hbtn-badge {
  background: var(--pr);
  color: #fff;
  font: 700 9px/1 var(--fm);
  padding: 1px 5px;
  border-radius: 8px;
  min-width: 14px;
  text-align: center;
}

/* Заглушка для отфильтрованных визитов */
.vp-card-hidden {
  height: 100%;
  border-radius: 7px;
  border-left: 3px solid var(--bd);
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    var(--bd) 4px,
    var(--bd) 5px
  );
  opacity: 0.35;
  min-height: 40px;
}

.vp-td-cell--off {
  cursor: not-allowed;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 5px,
    rgba(0, 0, 0, 0.03) 5px,
    rgba(0, 0, 0, 0.03) 10px
  );
}
.vp-td-cell--off:hover {
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 5px,
    rgba(0, 0, 0, 0.03) 5px,
    rgba(0, 0, 0, 0.03) 10px
  );
}

/* ── Visit card — нормальный поток, строка растягивается автоматически ── */
.vp-card {
  background: var(--sf);
  border-radius: 7px;
  border-left: 4px solid var(--txm);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  transition: box-shadow var(--tr);
  height: 100%;
  box-sizing: border-box;
}
.vp-card:hover {
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.13);
}

/* Имя + бейдж */
.vp-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
  flex-shrink: 0;
}
.vp-card-name {
  font: 700 14px/1.3 var(--fn);
  color: var(--tx);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  min-width: 0;
}
.vp-card-name--link {
  cursor: pointer;
  transition: color 150ms;
}
.vp-card-name--link:hover {
  color: var(--pr);
  text-decoration: underline;
}
.vp-card-badge {
  font: 600 10px/1 var(--fn);
  padding: 3px 7px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-top: 1px;
}

/* Телефон */
.vp-card-contacts {
  flex-shrink: 0;
  overflow: hidden;
}
.vp-card-phone,
.vp-card-email {
  font: 500 12px/1.3 var(--fm);
  color: var(--tx2);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 150ms;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.vp-card-phone:hover {
  color: var(--pr);
}

/* Отложено */
.vp-card-postponed {
  font: 500 11px/1 var(--fn);
  color: #2563eb;
  background: #eff6ff;
  border-radius: 4px;
  padding: 3px 7px;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* Чипы (размер, цвет, примерка, источник) */
.vp-card-meta {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.vp-card-meta > * {
  font: 500 11px/1 var(--fn);
  color: var(--tx2);
  background: var(--sfh);
  padding: 3px 7px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
}
.vp-card-fitting {
  color: var(--am) !important;
  background: var(--aml) !important;
}
.vp-card-src {
  color: var(--pu) !important;
  background: var(--pul) !important;
}
.vp-card-rec {
  color: #b45309 !important;
  background: #fef3c7 !important;
}
.vp-card-fitting-cb {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font: 500 11px/1 var(--fn);
  color: var(--tx2);
  cursor: pointer;
  padding: 3px 7px;
  background: var(--sfh);
  border-radius: 4px;
  white-space: nowrap;
}
.vp-card-fitting-cb input[type="checkbox"] {
  width: 13px;
  height: 13px;
  accent-color: #059669;
  cursor: pointer;
  flex-shrink: 0;
}
.vp-card-fitting-cb:has(input:checked) {
  color: #059669;
  background: var(--aml);
}

/* Призрак */
.vp-card-phantom-ico {
  font-size: 12px;
  margin-right: 2px;
  opacity: 0.65;
}

/* Сотрудник */
.vp-card-emp-row {
  flex-shrink: 0;
  overflow: hidden;
}
.vp-card-emp {
  font: 500 11px/1 var(--fn);
  color: var(--te) !important;
  background: var(--tel) !important;
  padding: 3px 7px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* Заметки */
.vp-card-notes {
  font: 400 11px/1.4 var(--fn);
  color: var(--txm);
  border-top: 1px dashed var(--bd);
  padding-top: 4px;
  margin-top: 2px;
  display: block;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
}

.vp-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  opacity: 0.4;
  transition: opacity var(--tr);
}
.vp-td-cell:hover .vp-empty {
  opacity: 0.7;
}

.vp-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 14px;
  background: var(--sf);
  border-top: 1px solid var(--bd);
  font: 500 11px/1 var(--fn);
  color: var(--tx2);
  flex-shrink: 0;
  gap: 8px;
}
.vp-footer b {
  color: var(--tx);
  font-family: var(--fm);
}
.vp-legend {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
}
.vp-lg {
  font: 700 7px/1 var(--fn);
  padding: 2px 5px;
  border-radius: 3px;
  white-space: nowrap;
}

/* Mobile bar */
.vp-mob {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 12px;
  background: var(--prl);
  border-bottom: 1px solid var(--bd);
  flex-shrink: 0;
}
.vp-mob-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--pr);
  font-size: 11px;
  font-weight: 500;
}
.vp-mob-fs {
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
.vp-mob-fs:active {
  background: var(--pr);
  color: #fff;
}

/* Fullscreen exit */
.vp-fsx {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--sf);
  border-bottom: 1px solid var(--bd);
  flex-shrink: 0;
}
.vp-fsx-info {
  font-size: 11px;
  color: var(--tx2);
}
.vp-fsx-info b {
  color: var(--tx);
  font-family: var(--fm);
}
.vp-fsx-btn {
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
.vp-fsx-btn:active {
  background: var(--sfh);
  color: var(--tx);
}

/* Fullscreen mode */
.vp--fs .vp-header,
.vp--fs .vp-stats-panel,
.vp--fs .vp-date,
.vp--fs .vp-footer,
.vp--fs .vp-mob {
  display: none !important;
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
  max-height: 400px;
}
.fold-leave-from {
  opacity: 1;
  max-height: 400px;
}
.fold-leave-to {
  opacity: 0;
  max-height: 0;
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

@media (max-width: 768px) {
  .vp-header {
    padding: 8px 10px;
    flex-wrap: wrap;
  }
  .vp-title {
    font-size: 15px;
  }
  .vp-branch {
    max-width: 120px;
    font-size: 10px;
  }
  .vp-stats-panel .vp-stats-period {
    flex-direction: column;
    padding: 6px 10px;
    gap: 6px;
    align-items: stretch;
  }
  .vp-stats-dates {
    justify-content: center;
  }
  .vp-stats-dinput {
    width: 115px;
    font-size: 10px;
  }
  .vp-stats-presets {
    justify-content: center;
  }
  .vp-stats-row {
    padding: 6px 10px;
    gap: 4px;
  }
  .vs {
    min-width: 80px;
    padding: 5px 7px;
  }
  .vs-b b {
    font-size: 12px;
  }
  .vp-date {
    padding: 5px 8px;
  }
  .vp-dc {
    padding: 3px 5px;
    min-width: 38px;
  }
  .vp-dc-d {
    font-size: 10px;
  }
  .vp-table {
    min-width: 700px;
  }
  .vp-td-cell {
    height: 140px;
    padding: 3px;
  }
  .vp-card {
    padding: 6px 8px;
    gap: 4px;
  }
  .vp-footer {
    flex-direction: column;
    gap: 3px;
    padding: 4px 10px;
    text-align: center;
  }
  .vp-legend {
    justify-content: center;
  }
}
</style>
