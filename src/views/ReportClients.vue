<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { reportsApi } from "@/services/reportsApi";

const router = useRouter();

const todayMsk = () => {
  const now = new Date();
  return new Date(now.getTime() + (3 * 60 - now.getTimezoneOffset()) * 60000)
    .toISOString()
    .slice(0, 10);
};

const startDate = ref(todayMsk());
const endDate = ref(todayMsk());
const isDownloading = ref(false);
const downloadDone = ref(false);
const downloadError = ref("");

const setPreset = (preset: "today" | "week" | "month" | "quarter") => {
  const msk = () => {
    const now = new Date();
    return new Date(now.getTime() + (3 * 60 - now.getTimezoneOffset()) * 60000);
  };
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const t = msk();
  endDate.value = fmt(t);
  if (preset === "today") {
    startDate.value = fmt(t);
  } else if (preset === "week") {
    const d = msk(); d.setDate(d.getDate() - 6); startDate.value = fmt(d);
  } else if (preset === "month") {
    const d = msk(); d.setDate(1); startDate.value = fmt(d);
  } else if (preset === "quarter") {
    const d = msk(); d.setMonth(d.getMonth() - 3); startDate.value = fmt(d);
  }
};

const handleDownload = async () => {
  isDownloading.value = true;
  downloadDone.value = false;
  downloadError.value = "";
  try {
    const result = await reportsApi.downloadClients({
      start_date: startDate.value || undefined,
      end_date: endDate.value || undefined,
    });
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url; a.download = result.filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    isDownloading.value = false;
    downloadDone.value = true;
  } catch (e) {
    isDownloading.value = false;
    downloadError.value = e instanceof Error ? e.message : "Ошибка выгрузки";
  }
};
</script>

<template>
  <div class="rep-page" style="--rep-color:#2563eb;--rep-light:#eff6ff;--rep-mid:#bfdbfe;">
    <!-- Colored header strip -->
    <div class="rep-strip">
      <button class="rep-back" @click="router.push('/reports')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Отчеты
      </button>
      <div class="rep-title-row">
        <div class="rep-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div>
          <h1 class="rep-title">Отчет по клиентам</h1>
          <p class="rep-subtitle">Новые и изменённые клиенты за период</p>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="rep-body">
      <div class="rep-card">
        <!-- Period -->
        <div class="rep-section">
          <span class="rep-section-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Период
          </span>
          <div class="rep-presets">
            <button class="rep-preset-btn" @click="setPreset('today')">Сегодня</button>
            <button class="rep-preset-btn" @click="setPreset('week')">Неделя</button>
            <button class="rep-preset-btn" @click="setPreset('month')">Месяц</button>
            <button class="rep-preset-btn" @click="setPreset('quarter')">Квартал</button>
          </div>
          <div class="rep-dates">
            <div class="rep-date-field">
              <span class="rep-date-lbl">с</span>
              <input v-model="startDate" type="date" class="rep-input" />
            </div>
            <div class="rep-date-field">
              <span class="rep-date-lbl">по</span>
              <input v-model="endDate" type="date" class="rep-input" />
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="rep-actions">
          <span v-if="downloadError" class="rep-error">{{ downloadError }}</span>
          <button
            class="rep-btn"
            :class="{ 'rep-btn--loading': isDownloading, 'rep-btn--done': downloadDone }"
            :disabled="isDownloading || downloadDone"
            @click="handleDownload"
          >
            <template v-if="!isDownloading && !downloadDone">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Выгрузить Excel
            </template>
            <template v-else-if="isDownloading">
              <span class="rep-spinner"></span>
              Формируем отчет...
            </template>
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
  </div>
</template>

<style scoped>
.rep-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
  font-family: "Manrope", -apple-system, BlinkMacSystemFont, sans-serif;
  color: #0f172a;
}

/* Header strip */
.rep-strip {
  background: var(--rep-light);
  border-bottom: 1.5px solid var(--rep-mid);
  padding: 18px 24px 22px;
  flex-shrink: 0;
}
.rep-back {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  color: var(--rep-color);
  font: 600 12px "Manrope", sans-serif;
  cursor: pointer;
  padding: 0;
  opacity: 0.75;
  transition: opacity 120ms;
  margin-bottom: 14px;
}
.rep-back:hover { opacity: 1; }
.rep-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}
.rep-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rep-color);
  flex-shrink: 0;
}
.rep-title {
  font: 800 20px/1 "Manrope", sans-serif;
  letter-spacing: -0.02em;
  margin: 0 0 4px;
  color: #0f172a;
}
.rep-subtitle {
  font: 400 12px/1 "Manrope", sans-serif;
  color: #64748b;
  margin: 0;
}

/* Body */
.rep-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
.rep-card {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 22px;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* Section */
.rep-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rep-section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font: 700 10px/1 "Manrope", sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

/* Presets */
.rep-presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.rep-preset-btn {
  padding: 5px 13px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: none;
  font: 600 11px "Manrope", sans-serif;
  color: #64748b;
  cursor: pointer;
  transition: all 120ms;
}
.rep-preset-btn:hover {
  background: var(--rep-light);
  border-color: var(--rep-mid);
  color: var(--rep-color);
}

/* Dates */
.rep-dates { display: flex; gap: 10px; }
.rep-date-field {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}
.rep-date-lbl {
  font: 600 12px/1 "Manrope", sans-serif;
  color: #94a3b8;
  white-space: nowrap;
}
.rep-input {
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
.rep-input:focus {
  border-color: var(--rep-color);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

/* Actions */
.rep-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rep-error {
  font: 500 11px/1.4 "Manrope", sans-serif;
  color: #dc2626;
}
.rep-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 42px;
  border: none;
  border-radius: 10px;
  background: var(--rep-color);
  color: #fff;
  font: 700 13px "Manrope", sans-serif;
  cursor: pointer;
  transition: all 180ms;
}
.rep-btn:hover:not(:disabled) {
  filter: brightness(1.08);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
}
.rep-btn:disabled { cursor: not-allowed; }
.rep-btn--loading { background: #64748b !important; }
.rep-btn--done { background: #059669 !important; }
.rep-spinner {
  width: 13px;
  height: 13px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: rep-spin 0.7s linear infinite;
  flex-shrink: 0;
}
@keyframes rep-spin { to { transform: rotate(360deg); } }

@media (max-width: 600px) {
  .rep-strip { padding: 14px 16px 18px; }
  .rep-body { padding: 16px; }
  .rep-dates { flex-direction: column; }
}
</style>
