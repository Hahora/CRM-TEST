<script setup lang="ts">
import { ref, onMounted } from "vue";
import { visitsApi } from "@/services/visitsApi";
import type { Branch } from "@/services/visitsApi";

type ReportType = "clients" | "visits" | "sales";

const branches = ref<Branch[]>([]);

// ── Modal state ──
const activeReport = ref<ReportType | null>(null);
const selectedBranchId = ref<number | null>(null); // null = все филиалы
const startDate = ref("");
const endDate = ref("");
const isDownloading = ref(false);
const downloadDone = ref(false);
const downloadError = ref("");

const REPORTS = {
  clients: {
    title: "Отчет по клиентам",
    desc: "Новые и изменённые клиенты за период",
    color: "#2563eb",
    colorLight: "#eff6ff",
    colorMid: "#bfdbfe",
    filename: "clients_report",
    icon: "clients",
  },
  visits: {
    title: "Отчет по посещениям",
    desc: "Даты, консультанты, размеры, статусы посещений",
    color: "#059669",
    colorLight: "#ecfdf5",
    colorMid: "#a7f3d0",
    filename: "visits_report",
    icon: "visits",
  },
  sales: {
    title: "Отчет по продажам",
    desc: "Чеки, суммы, товары, консультанты, магазины",
    color: "#d97706",
    colorLight: "#fffbeb",
    colorMid: "#fde68a",
    filename: "sales_report",
    icon: "sales",
  },
} as const;

const openModal = (type: ReportType) => {
  activeReport.value = type;
  selectedBranchId.value = null;
  startDate.value = "";
  endDate.value = "";
  downloadDone.value = false;
  downloadError.value = "";
};

const closeModal = () => {
  if (isDownloading.value) return;
  activeReport.value = null;
};

const handleOverlay = (e: MouseEvent) => {
  if ((e.target as HTMLElement).classList.contains("rp-overlay")) closeModal();
};

const selectBranch = (localId: number | null) => {
  selectedBranchId.value = localId;
};

const handleDownload = async () => {
  if (!activeReport.value) return;
  isDownloading.value = true;
  downloadDone.value = false;
  downloadError.value = "";

  try {
    if (activeReport.value === "sales") {
      // Эндпоинт в разработке — временная заглушка
      await new Promise((r) => setTimeout(r, 1800));
      const dateStr = new Date().toISOString().slice(0, 10);
      const csv = `"Отчет по продажам"\n"Дата выгрузки: ${new Date().toLocaleDateString("ru-RU")}"\n\n"(эндпоинт в разработке)"`;
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales_report_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const token = localStorage.getItem("access_token");
      const baseUrl = (import.meta.env.VITE_API_BASE_URL as string || "").replace(/\/$/, "");
      const params = new URLSearchParams();

      if (startDate.value && endDate.value) {
        params.set("start_date", startDate.value);
        params.set("end_date", endDate.value);
      } else {
        params.set("period", "month");
      }

      let path = "";
      if (activeReport.value === "clients") {
        path = "/api/v1/reports/clients-changes";
      } else {
        path = "/api/v1/reports/visits-excel";
        if (selectedBranchId.value !== null) {
          params.set("branch_id", String(selectedBranchId.value));
        }
      }

      const response = await fetch(`${baseUrl}${path}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        let msg = `Ошибка сервера: ${response.status}`;
        try {
          const json = JSON.parse(text);
          if (json.detail) msg = json.detail;
        } catch { /* ignore */ }
        throw new Error(msg);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Имя файла из Content-Disposition или дефолтное
      const cd = response.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename[^;=\n]*=([^;\n]*)/);
      const filename = match?.[1]?.replace(/["']/g, "").trim()
        ?? `${REPORTS[activeReport.value].filename}.xlsx`;
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    isDownloading.value = false;
    downloadDone.value = true;
    setTimeout(() => closeModal(), 900);
  } catch (e) {
    isDownloading.value = false;
    downloadError.value = e instanceof Error ? e.message : "Ошибка выгрузки";
  }
};

onMounted(async () => {
  try {
    branches.value = await visitsApi.getBranches();
  } catch {
    branches.value = [];
  }
});
</script>

<template>
  <div class="rp-page">
    <!-- HEADER -->
    <header class="rp-header">
      <div>
        <h1 class="rp-title">Отчеты</h1>
        <p class="rp-sub">Выгрузка данных в Excel / CSV</p>
      </div>
    </header>

    <!-- CARDS -->
    <div class="rp-body">
      <div class="rp-cards">
        <!-- Клиенты -->
        <button class="rp-card rp-card--blue" @click="openModal('clients')">
          <div class="rp-card-icon rp-card-icon--blue">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="rp-card-body">
            <span class="rp-card-title">Отчет по клиентам</span>
            <span class="rp-card-desc">История посещений, покупки, источники привлечения</span>
          </div>
          <div class="rp-card-arrow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>
        </button>

        <!-- Продажи -->
        <button class="rp-card rp-card--amber" @click="openModal('sales')">
          <div class="rp-card-icon rp-card-icon--amber">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="5" y="2" width="14" height="20" rx="2"/>
              <line x1="9" y1="7" x2="15" y2="7"/>
              <line x1="9" y1="11" x2="15" y2="11"/>
              <line x1="9" y1="15" x2="13" y2="15"/>
            </svg>
          </div>
          <div class="rp-card-body">
            <span class="rp-card-title">Отчет по продажам</span>
            <span class="rp-card-desc">Чеки, суммы, товары, консультанты, магазины</span>
          </div>
          <div class="rp-card-arrow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>
        </button>

        <!-- Посещения -->
        <button class="rp-card rp-card--green" @click="openModal('visits')">
          <div class="rp-card-icon rp-card-icon--green">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div class="rp-card-body">
            <span class="rp-card-title">Отчет по посещениям</span>
            <span class="rp-card-desc">Даты, консультанты, размеры, статусы посещений</span>
          </div>
          <div class="rp-card-arrow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>
        </button>
      </div>
    </div>

    <!-- MODAL -->
    <Teleport to="body">
      <Transition name="rp-fade">
        <div v-if="activeReport" class="rp-overlay" @click="handleOverlay">
          <Transition name="rp-slide">
            <div v-if="activeReport" class="rp-modal">
              <!-- Modal header -->
              <div class="rp-modal-header" :style="{ borderColor: REPORTS[activeReport].colorMid }">
                <div class="rp-modal-icon" :style="{ background: REPORTS[activeReport].colorLight, color: REPORTS[activeReport].color }">
                  <!-- Clients icon -->
                  <svg v-if="activeReport === 'clients'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <!-- Visits icon -->
                  <svg v-else-if="activeReport === 'visits'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <!-- Sales icon -->
                  <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="5" y="2" width="14" height="20" rx="2"/>
                    <line x1="9" y1="7" x2="15" y2="7"/>
                    <line x1="9" y1="11" x2="15" y2="11"/>
                    <line x1="9" y1="15" x2="13" y2="15"/>
                  </svg>
                </div>
                <div>
                  <h2 class="rp-modal-title">{{ REPORTS[activeReport].title }}</h2>
                  <p class="rp-modal-sub">{{ REPORTS[activeReport].desc }}</p>
                </div>
                <button class="rp-modal-close" @click="closeModal" :disabled="isDownloading">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <!-- Modal body -->
              <div class="rp-modal-body">
                <!-- Period -->
                <div class="rp-section">
                  <label class="rp-section-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Период
                  </label>
                  <div class="rp-dates">
                    <div class="rp-date-field">
                      <span class="rp-date-lbl">с</span>
                      <input v-model="startDate" type="date" class="rp-input" />
                    </div>
                    <div class="rp-date-field">
                      <span class="rp-date-lbl">по</span>
                      <input v-model="endDate" type="date" class="rp-input" />
                    </div>
                  </div>
                </div>

                <!-- Branches (только для посещений) -->
                <div v-if="activeReport === 'visits'" class="rp-section">
                  <label class="rp-section-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    Филиал
                  </label>
                  <div class="rp-branches">
                    <!-- Все -->
                    <label class="rp-check rp-check--all">
                      <input
                        type="radio"
                        :checked="selectedBranchId === null"
                        @change="selectBranch(null)"
                        class="rp-checkbox"
                      />
                      <span class="rp-check-mark"></span>
                      <span class="rp-check-lbl">Все филиалы</span>
                    </label>
                    <!-- Конкретный -->
                    <label
                      v-for="b in branches"
                      :key="b.moysklad_id"
                      class="rp-check"
                      :class="{ 'rp-check--inactive': !b.is_active }"
                    >
                      <input
                        type="radio"
                        :checked="selectedBranchId === b.local_id"
                        @change="selectBranch(b.local_id ?? null)"
                        class="rp-checkbox"
                      />
                      <span class="rp-check-mark"></span>
                      <span class="rp-check-lbl">
                        {{ b.name }}
                        <span v-if="!b.is_active" class="rp-inactive-badge">неактивен</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Modal footer -->
              <div class="rp-modal-footer">
                <div class="rp-footer-l">
                  <span v-if="downloadError" class="rp-error">{{ downloadError }}</span>
                  <span v-else-if="!startDate && !endDate" class="rp-period-hint">По умолчанию: последний месяц</span>
                </div>
                <div class="rp-footer-r">
                  <button class="rp-btn-cancel" @click="closeModal" :disabled="isDownloading">
                    Отмена
                  </button>
                  <button
                    class="rp-btn-download"
                    :style="{ background: isDownloading || downloadDone ? undefined : REPORTS[activeReport].color }"
                    :class="{ 'rp-btn-download--loading': isDownloading, 'rp-btn-download--done': downloadDone }"
                    @click="handleDownload"
                    :disabled="isDownloading || downloadDone"
                  >
                    <!-- Idle -->
                    <template v-if="!isDownloading && !downloadDone">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Выгрузить
                    </template>
                    <!-- Loading -->
                    <template v-else-if="isDownloading">
                      <span class="rp-spinner"></span>
                      Формируем отчет...
                    </template>
                    <!-- Done -->
                    <template v-else>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Готово!
                    </template>
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.rp-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
  font-family: "Manrope", -apple-system, BlinkMacSystemFont, sans-serif;
  color: #0f172a;
}

/* Header */
.rp-header {
  padding: 20px 24px 16px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.rp-title {
  font: 800 20px/1 "Manrope", sans-serif;
  letter-spacing: -0.02em;
  margin: 0 0 4px;
}
.rp-sub {
  font: 400 12px/1 "Manrope", sans-serif;
  color: #64748b;
  margin: 0;
}

/* Body */
.rp-body {
  flex: 1;
  padding: 28px 24px;
  overflow-y: auto;
}

/* Cards */
.rp-cards {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 540px;
}
.rp-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 20px 22px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  transition: all 180ms cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
}
.rp-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08);
  transform: translateY(-1px);
}
.rp-card--green:hover {
  border-color: #6ee7b7;
  box-shadow: 0 4px 20px rgba(5, 150, 105, 0.08);
}
.rp-card--amber:hover {
  border-color: #fcd34d;
  box-shadow: 0 4px 20px rgba(217, 119, 6, 0.08);
}
.rp-card-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rp-card-icon--blue {
  background: #eff6ff;
  color: #2563eb;
}
.rp-card-icon--green {
  background: #ecfdf5;
  color: #059669;
}
.rp-card-icon--amber {
  background: #fffbeb;
  color: #d97706;
}
.rp-card--amber:hover .rp-card-arrow {
  color: #d97706;
}
.rp-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.rp-card-title {
  font: 700 15px/1 "Manrope", sans-serif;
  color: #0f172a;
}
.rp-card-desc {
  font: 400 12px/1.4 "Manrope", sans-serif;
  color: #64748b;
}
.rp-card-arrow {
  color: #94a3b8;
  flex-shrink: 0;
  transition: transform 180ms;
}
.rp-card:hover .rp-card-arrow {
  transform: translateX(3px);
  color: #2563eb;
}
.rp-card--green:hover .rp-card-arrow {
  color: #059669;
}

/* Overlay */
.rp-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* Modal */
.rp-modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 460px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.rp-modal-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px 22px 18px;
  border-bottom: 1.5px solid #e2e8f0;
}
.rp-modal-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rp-modal-title {
  font: 700 16px/1.1 "Manrope", sans-serif;
  margin: 0 0 4px;
  color: #0f172a;
}
.rp-modal-sub {
  font: 400 11px/1.4 "Manrope", sans-serif;
  color: #64748b;
  margin: 0;
}
.rp-modal-close {
  margin-left: auto;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  color: #94a3b8;
  transition: all 150ms;
}
.rp-modal-close:hover:not(:disabled) {
  background: #f1f5f9;
  color: #0f172a;
}
.rp-modal-close:disabled { opacity: 0.4; cursor: not-allowed; }

/* Modal body */
.rp-modal-body {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 60vh;
  overflow-y: auto;
}
.rp-modal-body::-webkit-scrollbar { width: 4px; }
.rp-modal-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

.rp-section { display: flex; flex-direction: column; gap: 10px; }
.rp-section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font: 700 10px/1 "Manrope", sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

/* Dates */
.rp-dates { display: flex; gap: 10px; }
.rp-date-field {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}
.rp-date-lbl {
  font: 600 12px/1 "Manrope", sans-serif;
  color: #94a3b8;
  white-space: nowrap;
}
.rp-input {
  flex: 1;
  height: 34px;
  padding: 0 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font: 400 12px "Manrope", sans-serif;
  color: #0f172a;
  background: #f8fafc;
  outline: none;
  transition: all 150ms;
  min-width: 0;
}
.rp-input:focus {
  border-color: #2563eb;
  background: #fff;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.08);
}

/* Branches */
.rp-branches {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 6px 4px;
}
.rp-check {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 7px;
  cursor: pointer;
  transition: background 120ms;
  user-select: none;
}
.rp-check:hover { background: #eff6ff; }
.rp-check--all {
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 4px;
  padding-bottom: 10px;
}
.rp-check--inactive .rp-check-lbl { color: #94a3b8; }
.rp-checkbox { display: none; }
.rp-check-mark {
  width: 16px;
  height: 16px;
  border: 1.5px solid #cbd5e1;
  border-radius: 4px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms;
  background: #fff;
  position: relative;
}
.rp-checkbox:checked + .rp-check-mark {
  background: #2563eb;
  border-color: #2563eb;
}
.rp-checkbox:checked + .rp-check-mark::after {
  content: "";
  display: block;
  width: 8px;
  height: 5px;
  border-left: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: rotate(-45deg) translate(0px, -1px);
}
.rp-check-lbl {
  font: 500 13px/1 "Manrope", sans-serif;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 6px;
}
.rp-inactive-badge {
  font: 400 10px/1 "Manrope", sans-serif;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

/* Modal footer */
.rp-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 16px 22px;
  border-top: 1px solid #e2e8f0;
  background: #fafbfc;
}
.rp-footer-l {
  flex: 1;
  min-width: 0;
}
.rp-footer-r {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.rp-error {
  font: 500 11px/1.4 "Manrope", sans-serif;
  color: #dc2626;
}
.rp-period-hint {
  font: 400 11px/1 "Manrope", sans-serif;
  color: #94a3b8;
}
.rp-btn-cancel {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: none;
  font: 600 12px "Manrope", sans-serif;
  color: #64748b;
  cursor: pointer;
  transition: all 150ms;
}
.rp-btn-cancel:hover:not(:disabled) { background: #f1f5f9; color: #0f172a; }
.rp-btn-cancel:disabled { opacity: 0.4; cursor: not-allowed; }

.rp-btn-download {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 18px;
  border-radius: 8px;
  border: none;
  font: 700 12px "Manrope", sans-serif;
  color: #fff;
  cursor: pointer;
  transition: all 180ms;
  min-width: 150px;
  justify-content: center;
}
.rp-btn-download:hover:not(:disabled) { filter: brightness(1.08); box-shadow: 0 3px 10px rgba(0,0,0,0.15); }
.rp-btn-download:disabled { cursor: not-allowed; }
.rp-btn-download--loading { background: #64748b !important; }
.rp-btn-download--done { background: #059669 !important; }

.rp-spinner {
  width: 13px;
  height: 13px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: rp-spin 0.7s linear infinite;
  flex-shrink: 0;
}
@keyframes rp-spin { to { transform: rotate(360deg); } }

/* Transitions */
.rp-fade-enter-active, .rp-fade-leave-active { transition: opacity 200ms; }
.rp-fade-enter-from, .rp-fade-leave-to { opacity: 0; }
.rp-slide-enter-active { transition: all 220ms cubic-bezier(0.34, 1.2, 0.64, 1); }
.rp-slide-leave-active { transition: all 160ms ease-in; }
.rp-slide-enter-from { opacity: 0; transform: scale(0.94) translateY(8px); }
.rp-slide-leave-to { opacity: 0; transform: scale(0.96) translateY(4px); }

@media (max-width: 600px) {
  .rp-body { padding: 16px; }
  .rp-card { padding: 16px; gap: 14px; }
  .rp-card-icon { width: 46px; height: 46px; }
  .rp-dates { flex-direction: column; }
}
</style>
