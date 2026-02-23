<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { reportsApi } from "@/services/reportsApi";
import { visitsApi } from "@/services/visitsApi";
import type { Branch } from "@/services/visitsApi";
import { useAuth } from "@/composables/useAuth";

const router = useRouter();
const { isBranch, user } = useAuth();

const branches = ref<Branch[]>([]);
const selectedBranchIds = ref<number[]>([]);
const isLoadingBranches = ref(true);

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

const toggleBranch = (localId: number) => {
  const idx = selectedBranchIds.value.indexOf(localId);
  if (idx === -1) selectedBranchIds.value.push(localId);
  else selectedBranchIds.value.splice(idx, 1);
};

const handleDownload = async () => {
  isDownloading.value = true;
  downloadDone.value = false;
  downloadError.value = "";
  try {
    const result = await reportsApi.downloadVisits({
      start_date: startDate.value || undefined,
      end_date: endDate.value || undefined,
      branch_ids: selectedBranchIds.value.length > 0 ? selectedBranchIds.value : undefined,
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

onMounted(async () => {
  try {
    branches.value = await visitsApi.getBranches();
    if (isBranch.value && user.value?.branch_id != null) {
      branches.value = branches.value.filter((b) => b.local_id === user.value!.branch_id);
      selectedBranchIds.value = branches.value
        .map((b) => b.local_id)
        .filter((id): id is number => id != null);
    }
  } catch { branches.value = []; }
  finally { isLoadingBranches.value = false; }
});
</script>

<template>
  <div class="rep-page" style="--rep-color:#059669;--rep-light:#ecfdf5;--rep-mid:#a7f3d0;">
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
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div>
          <h1 class="rep-title">Отчет по посещениям</h1>
          <p class="rep-subtitle">Даты, консультанты, размеры, статусы посещений</p>
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

        <!-- Branches (multi-select) -->
        <div class="rep-section">
          <span class="rep-section-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Филиалы
          </span>
          <!-- Skeleton -->
          <div v-if="isLoadingBranches" class="rep-branches">
            <div v-for="i in 4" :key="i" class="rep-skeleton-row">
              <div class="rep-skeleton-box"></div>
              <div class="rep-skeleton-line" :style="{ width: i % 2 === 0 ? '55%' : '70%' }"></div>
            </div>
          </div>

          <!-- Loaded -->
          <div v-else class="rep-branches">
            <label class="rep-check rep-check--all">
              <input type="checkbox" :checked="selectedBranchIds.length === 0" @change="selectedBranchIds = []" class="rep-checkbox" />
              <span class="rep-check-mark"></span>
              <span class="rep-check-lbl">Все филиалы</span>
            </label>
            <label v-for="b in branches" :key="b.moysklad_id" class="rep-check" :class="{ 'rep-check--inactive': !b.is_active }">
              <input type="checkbox" :checked="b.local_id != null && selectedBranchIds.includes(b.local_id)" @change="b.local_id != null && toggleBranch(b.local_id)" class="rep-checkbox" />
              <span class="rep-check-mark"></span>
              <span class="rep-check-lbl">
                {{ b.name }}
                <span v-if="!b.is_active" class="rep-inactive-badge">неактивен</span>
              </span>
            </label>
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
.rep-title-row { display: flex; align-items: center; gap: 14px; }
.rep-icon {
  width: 48px; height: 48px; border-radius: 12px;
  background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex; align-items: center; justify-content: center;
  color: var(--rep-color); flex-shrink: 0;
}
.rep-title { font: 800 20px/1 "Manrope", sans-serif; letter-spacing: -0.02em; margin: 0 0 4px; color: #0f172a; }
.rep-subtitle { font: 400 12px/1 "Manrope", sans-serif; color: #64748b; margin: 0; }
.rep-body { flex: 1; overflow-y: auto; padding: 24px; }
.rep-card {
  background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px;
  padding: 22px; max-width: 480px; display: flex; flex-direction: column; gap: 22px;
}
.rep-section { display: flex; flex-direction: column; gap: 10px; }
.rep-section-label {
  display: flex; align-items: center; gap: 6px;
  font: 700 10px/1 "Manrope", sans-serif; text-transform: uppercase;
  letter-spacing: 0.06em; color: #64748b;
}
.rep-presets { display: flex; gap: 6px; flex-wrap: wrap; }
.rep-preset-btn {
  padding: 5px 13px; border: 1px solid #e2e8f0; border-radius: 6px;
  background: none; font: 600 11px "Manrope", sans-serif; color: #64748b;
  cursor: pointer; transition: all 120ms;
}
.rep-preset-btn:hover { background: var(--rep-light); border-color: var(--rep-mid); color: var(--rep-color); }
.rep-dates { display: flex; gap: 10px; }
.rep-date-field { display: flex; align-items: center; gap: 8px; flex: 1; }
.rep-date-lbl { font: 600 12px/1 "Manrope", sans-serif; color: #94a3b8; white-space: nowrap; }
.rep-input {
  flex: 1; height: 34px; padding: 0 10px; border: 1px solid #e2e8f0; border-radius: 8px;
  font: 400 12px "Manrope", sans-serif; color: #0f172a; background: #f8fafc;
  outline: none; transition: all 150ms; min-width: 0;
}
.rep-input:focus { border-color: var(--rep-color); background: #fff; box-shadow: 0 0 0 3px rgba(5,150,105,0.08); }

/* Branches */
.rep-branches {
  display: flex; flex-direction: column; gap: 2px;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 6px 4px; max-height: 220px; overflow-y: auto;
}
.rep-check {
  display: flex; align-items: center; gap: 10px; padding: 7px 10px;
  border-radius: 7px; cursor: pointer; transition: background 120ms; user-select: none;
}
.rep-check:hover { background: var(--rep-light); }
.rep-check--all { border-bottom: 1px solid #e2e8f0; margin-bottom: 4px; padding-bottom: 10px; }
.rep-check--inactive .rep-check-lbl { color: #94a3b8; }
.rep-checkbox { display: none; }
.rep-check-mark {
  width: 16px; height: 16px; border: 1.5px solid #cbd5e1; border-radius: 4px;
  flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  transition: all 150ms; background: #fff;
}
.rep-checkbox:checked + .rep-check-mark { background: var(--rep-color); border-color: var(--rep-color); }
.rep-checkbox:checked + .rep-check-mark::after {
  content: ""; display: block; width: 8px; height: 5px;
  border-left: 2px solid #fff; border-bottom: 2px solid #fff;
  transform: rotate(-45deg) translate(0px, -1px);
}
.rep-check-lbl { font: 500 13px/1 "Manrope", sans-serif; color: #0f172a; display: flex; align-items: center; gap: 6px; }
.rep-inactive-badge { font: 400 10px/1 "Manrope", sans-serif; color: #94a3b8; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }

/* Skeleton loader */
.rep-skeleton-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
}
.rep-skeleton-box {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: #e2e8f0;
  flex-shrink: 0;
  animation: rep-shimmer 1.4s ease-in-out infinite;
}
.rep-skeleton-line {
  height: 10px;
  border-radius: 5px;
  background: #e2e8f0;
  animation: rep-shimmer 1.4s ease-in-out infinite;
}
.rep-skeleton-row:nth-child(2) .rep-skeleton-box,
.rep-skeleton-row:nth-child(2) .rep-skeleton-line { animation-delay: 0.1s; }
.rep-skeleton-row:nth-child(3) .rep-skeleton-box,
.rep-skeleton-row:nth-child(3) .rep-skeleton-line { animation-delay: 0.2s; }
.rep-skeleton-row:nth-child(4) .rep-skeleton-box,
.rep-skeleton-row:nth-child(4) .rep-skeleton-line { animation-delay: 0.3s; }
@keyframes rep-shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.rep-actions { display: flex; flex-direction: column; gap: 10px; }
.rep-error { font: 500 11px/1.4 "Manrope", sans-serif; color: #dc2626; }
.rep-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; height: 42px; border: none; border-radius: 10px;
  background: var(--rep-color); color: #fff; font: 700 13px "Manrope", sans-serif;
  cursor: pointer; transition: all 180ms;
}
.rep-btn:hover:not(:disabled) { filter: brightness(1.08); box-shadow: 0 4px 14px rgba(0,0,0,0.18); }
.rep-btn:disabled { cursor: not-allowed; }
.rep-btn--loading { background: #64748b !important; }
.rep-btn--done { background: #059669 !important; }
.rep-spinner {
  width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff; border-radius: 50%; animation: rep-spin 0.7s linear infinite; flex-shrink: 0;
}
@keyframes rep-spin { to { transform: rotate(360deg); } }
@media (max-width: 600px) {
  .rep-strip { padding: 14px 16px 18px; }
  .rep-body { padding: 16px; }
  .rep-dates { flex-direction: column; }
}
</style>
