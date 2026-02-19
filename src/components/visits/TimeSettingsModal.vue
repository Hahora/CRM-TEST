<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { visitsApi } from "@/services/visitsApi";
import {
  X,
  Clock,
  Plus,
  Trash2,
  Calendar,
  Settings,
  Save,
  RotateCcw,
  AlertCircle,
  LayoutGrid,
} from "lucide-vue-next";

export interface TimeSettings {
  branchId: number;
  branchName: string;
  baseSlots: string[];
  todaySlots: string[];
  todayDate: string;
  mergedSchedule: string[];
}

const props = defineProps<{
  open: boolean;
  branchId: number | null;
  branchName: string;
  currentDate: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", settings: TimeSettings): void;
}>();

// ── State ──
const activeTab = ref<"base" | "today" | "rooms">("base");
const baseSlots = ref<string[]>([]);
const todaySlots = ref<string[]>([]);
const newBaseTime = ref("");
const newTodayTime = ref("");
const isLoadingBase = ref(false);
const isLoadingDate = ref(false);
const isSaving = ref(false);
const isSaved = ref(false);
const error = ref("");

// ── Fitting rooms state ──
const fittingRoomsCount = ref(6);
const isLoadingRooms = ref(false);

// ── Load from API ──
const loadSchedule = async () => {
  if (!props.branchId) return;
  error.value = "";

  isLoadingBase.value = true;
  isLoadingDate.value = true;
  isLoadingRooms.value = true;

  try {
    const res = await visitsApi.getBranchSchedule(props.branchId);
    baseSlots.value = res.base_schedule || [];
  } catch (e: any) {
    error.value = e.message || "Ошибка загрузки расписания";
    baseSlots.value = [
      "10:00", "11:00", "12:00", "13:00", "14:00",
      "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
    ];
  } finally {
    isLoadingBase.value = false;
  }

  try {
    const res = await visitsApi.getBranchScheduleForDate(
      props.branchId,
      props.currentDate
    );
    todaySlots.value = res.additional_slots || [];
  } catch {
    todaySlots.value = [];
  } finally {
    isLoadingDate.value = false;
  }

  try {
    const res = await visitsApi.getBranchFittingRooms(props.branchId);
    fittingRoomsCount.value = res.fitting_rooms_count ?? 6;
  } catch {
    fittingRoomsCount.value = 6;
  } finally {
    isLoadingRooms.value = false;
  }
};

watch(
  () => props.open,
  (v) => {
    if (v) {
      isSaved.value = false;
      error.value = "";
      activeTab.value = "base";
      loadSchedule();
    }
  }
);

// ── Sort helper ──
const sortSlots = (slots: string[]) =>
  [...new Set(slots)].sort((a, b) => a.localeCompare(b));

// ── Effective slots ──
const effectiveSlots = computed(() =>
  sortSlots([...baseSlots.value, ...todaySlots.value])
);

// ── Validate time format ──
const isValidTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

// ── Add / remove base ──
const addBaseSlot = () => {
  const t = newBaseTime.value.trim();
  if (!t || !isValidTime(t)) return;
  if (!baseSlots.value.includes(t)) {
    baseSlots.value = sortSlots([...baseSlots.value, t]);
  }
  newBaseTime.value = "";
};
const removeBaseSlot = (slot: string) => {
  baseSlots.value = baseSlots.value.filter((s) => s !== slot);
};

// ── Add / remove today ──
const addTodaySlot = () => {
  const t = newTodayTime.value.trim();
  if (!t || !isValidTime(t)) return;
  if (!todaySlots.value.includes(t) && !baseSlots.value.includes(t)) {
    todaySlots.value = sortSlots([...todaySlots.value, t]);
  }
  newTodayTime.value = "";
};
const removeTodaySlot = (slot: string) => {
  todaySlots.value = todaySlots.value.filter((s) => s !== slot);
};

// ── Quick add presets ──
const quickSlots = [
  "09:00",
  "09:30",
  "10:30",
  "11:30",
  "12:30",
  "13:30",
  "14:30",
  "15:30",
  "16:30",
  "17:30",
  "18:30",
  "19:30",
  "20:30",
  "21:00",
];
const availableQuickBase = computed(() =>
  quickSlots.filter((s) => !baseSlots.value.includes(s))
);
const availableQuickToday = computed(() =>
  quickSlots.filter(
    (s) => !baseSlots.value.includes(s) && !todaySlots.value.includes(s)
  )
);

// ── Reset base via API ──
const resetBase = async () => {
  if (!props.branchId) return;
  isLoadingBase.value = true;
  try {
    const res = await visitsApi.resetBranchSchedule(props.branchId);
    baseSlots.value = res.base_schedule || [];
  } catch (e: any) {
    error.value = e.message || "Ошибка сброса";
  } finally {
    isLoadingBase.value = false;
  }
};

// ── Reset today via API ──
const resetToday = async () => {
  if (!props.branchId) return;
  isLoadingDate.value = true;
  try {
    await visitsApi.deleteBranchDateSlots(props.branchId, props.currentDate);
    todaySlots.value = [];
  } catch (e: any) {
    error.value = e.message || "Ошибка удаления";
  } finally {
    isLoadingDate.value = false;
  }
};

// ── Save ──
const handleSave = async () => {
  if (!props.branchId) return;
  isSaving.value = true;
  error.value = "";
  try {
    await Promise.all([
      visitsApi.updateBranchSchedule(props.branchId, baseSlots.value),
      visitsApi.updateBranchFittingRooms(props.branchId, fittingRoomsCount.value),
    ]);
    if (todaySlots.value.length > 0) {
      await visitsApi.updateBranchDateSlots(
        props.branchId,
        props.currentDate,
        todaySlots.value
      );
    } else {
      try {
        await visitsApi.deleteBranchDateSlots(props.branchId, props.currentDate);
      } catch { /* ok */ }
    }
    isSaved.value = true;
    emit("save", {
      branchId: props.branchId,
      branchName: props.branchName,
      baseSlots: baseSlots.value,
      todaySlots: todaySlots.value,
      todayDate: props.currentDate,
      mergedSchedule: effectiveSlots.value,
    });
    setTimeout(() => { isSaved.value = false; }, 1200);
  } catch (e: any) {
    error.value = e.message || "Ошибка сохранения";
  } finally {
    isSaving.value = false;
  }
};

const formatDate = (d: string) => {
  try {
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      weekday: "short",
    });
  } catch {
    return d;
  }
};

const isLoading = computed(() => isLoadingBase.value || isLoadingDate.value);
</script>

<template>
  <Teleport to="body">
    <Transition name="tsm-fade">
      <div v-if="open" class="tsm-overlay" @click.self="$emit('close')">
        <Transition name="tsm-slide" appear>
          <div class="tsm-modal">
            <!-- Header -->
            <div class="tsm-header">
              <div class="tsm-header-left">
                <div class="tsm-avatar"><Settings :size="18" /></div>
                <div>
                  <h2 class="tsm-title">Настройки</h2>
                  <span class="tsm-sub">{{ branchName }}</span>
                </div>
              </div>
              <button class="tsm-btn-close" @click="$emit('close')">
                <X :size="18" />
              </button>
            </div>

            <!-- Error -->
            <div v-if="error" class="tsm-error">
              <AlertCircle :size="14" />
              <span>{{ error }}</span>
              <button class="tsm-error-x" @click="error = ''">
                <X :size="12" />
              </button>
            </div>

            <!-- Tabs -->
            <div class="tsm-tabs">
              <button
                class="tsm-tab"
                :class="{ 'tsm-tab--on': activeTab === 'base' }"
                @click="activeTab = 'base'"
              >
                <Clock :size="13" />
                <span>Расписание</span>
                <span class="tsm-tab-count">{{ baseSlots.length }}</span>
              </button>
              <button
                class="tsm-tab"
                :class="{ 'tsm-tab--on': activeTab === 'today' }"
                @click="activeTab = 'today'"
              >
                <Calendar :size="13" />
                <span>{{ formatDate(currentDate) }}</span>
                <span class="tsm-tab-count" v-if="todaySlots.length"
                  >+{{ todaySlots.length }}</span
                >
              </button>
              <button
                class="tsm-tab"
                :class="{ 'tsm-tab--on': activeTab === 'rooms' }"
                @click="activeTab = 'rooms'"
              >
                <LayoutGrid :size="13" />
                <span>Примерочные</span>
                <span class="tsm-tab-count">{{ fittingRoomsCount }}</span>
              </button>
            </div>

            <!-- Body -->
            <div class="tsm-body">
              <div v-if="isLoading" class="tsm-body-loading">
                <div class="tsm-spinner"></div>
                <span>Загрузка расписания...</span>
              </div>

              <template v-else>
                <!-- BASE TAB -->
                <div v-if="activeTab === 'base'" class="tsm-content">
                  <div class="tsm-desc">
                    <p>
                      Временные слоты, которые отображаются
                      <b>каждый день</b> для этого филиала.
                    </p>
                  </div>

                  <div class="tsm-add-row">
                    <div class="tsm-add-input-wrap">
                      <Clock :size="13" class="tsm-add-ico" />
                      <input
                        v-model="newBaseTime"
                        type="time"
                        class="tsm-add-input"
                        placeholder="HH:MM"
                        @keydown.enter="addBaseSlot"
                      />
                    </div>
                    <button
                      class="tsm-add-btn"
                      @click="addBaseSlot"
                      :disabled="!newBaseTime"
                    >
                      <Plus :size="14" /> Добавить
                    </button>
                  </div>

                  <div class="tsm-quick" v-if="availableQuickBase.length">
                    <span class="tsm-quick-label">Быстро добавить:</span>
                    <div class="tsm-quick-chips">
                      <button
                        v-for="s in availableQuickBase.slice(0, 8)"
                        :key="s"
                        class="tsm-chip tsm-chip--add"
                        @click="baseSlots = sortSlots([...baseSlots, s])"
                      >
                        <Plus :size="10" /> {{ s }}
                      </button>
                    </div>
                  </div>

                  <div class="tsm-slots">
                    <TransitionGroup name="tsm-slot">
                      <div
                        v-for="slot in baseSlots"
                        :key="slot"
                        class="tsm-slot"
                      >
                        <Clock :size="12" class="tsm-slot-ico" />
                        <span class="tsm-slot-time">{{ slot }}</span>
                        <button
                          class="tsm-slot-del"
                          @click="removeBaseSlot(slot)"
                          title="Удалить"
                        >
                          <X :size="11" />
                        </button>
                      </div>
                    </TransitionGroup>
                  </div>

                  <button
                    class="tsm-reset"
                    @click="resetBase"
                    :disabled="isLoadingBase"
                  >
                    <RotateCcw :size="12" /> Сбросить к стандартному (10:00 –
                    20:00)
                  </button>
                </div>

                <!-- TODAY TAB -->
                <div v-if="activeTab === 'today'" class="tsm-content">
                  <div class="tsm-desc">
                    <p>
                      Дополнительные слоты
                      <b>только на {{ formatDate(currentDate) }}</b
                      >. Они добавятся к основному расписанию.
                    </p>
                  </div>

                  <div class="tsm-add-row">
                    <div class="tsm-add-input-wrap">
                      <Calendar :size="13" class="tsm-add-ico" />
                      <input
                        v-model="newTodayTime"
                        type="time"
                        class="tsm-add-input"
                        @keydown.enter="addTodaySlot"
                      />
                    </div>
                    <button
                      class="tsm-add-btn"
                      @click="addTodaySlot"
                      :disabled="!newTodayTime"
                    >
                      <Plus :size="14" /> Добавить
                    </button>
                  </div>

                  <div class="tsm-quick" v-if="availableQuickToday.length">
                    <span class="tsm-quick-label">Быстро добавить:</span>
                    <div class="tsm-quick-chips">
                      <button
                        v-for="s in availableQuickToday.slice(0, 8)"
                        :key="s"
                        class="tsm-chip tsm-chip--add"
                        @click="todaySlots = sortSlots([...todaySlots, s])"
                      >
                        <Plus :size="10" /> {{ s }}
                      </button>
                    </div>
                  </div>

                  <div v-if="todaySlots.length" class="tsm-slots">
                    <TransitionGroup name="tsm-slot">
                      <div
                        v-for="slot in todaySlots"
                        :key="slot"
                        class="tsm-slot tsm-slot--today"
                      >
                        <Calendar :size="12" class="tsm-slot-ico" />
                        <span class="tsm-slot-time">{{ slot }}</span>
                        <span class="tsm-slot-badge">доп.</span>
                        <button
                          class="tsm-slot-del"
                          @click="removeTodaySlot(slot)"
                          title="Удалить"
                        >
                          <X :size="11" />
                        </button>
                      </div>
                    </TransitionGroup>
                  </div>
                  <div v-else class="tsm-empty">
                    <Calendar :size="24" />
                    <span>Нет дополнительных слотов на этот день</span>
                  </div>

                  <button
                    class="tsm-reset"
                    @click="resetToday"
                    v-if="todaySlots.length"
                    :disabled="isLoadingDate"
                  >
                    <Trash2 :size="12" /> Очистить все доп. слоты
                  </button>
                </div>

                <!-- ROOMS TAB -->
                <div v-if="activeTab === 'rooms'" class="tsm-content">
                  <div class="tsm-desc">
                    <p>Количество примерочных, доступных для записи в этом филиале.</p>
                  </div>
                  <div v-if="isLoadingRooms" class="tsm-body-loading">
                    <div class="tsm-spinner"></div>
                    <span>Загрузка...</span>
                  </div>
                  <div v-else class="tsm-rooms-ctrl">
                    <button
                      class="tsm-rooms-btn"
                      @click="fittingRoomsCount = Math.max(1, fittingRoomsCount - 1)"
                      :disabled="fittingRoomsCount <= 1"
                    >−</button>
                    <div class="tsm-rooms-val">
                      <span class="tsm-rooms-num">{{ fittingRoomsCount }}</span>
                      <span class="tsm-rooms-label">примерочных</span>
                    </div>
                    <button
                      class="tsm-rooms-btn"
                      @click="fittingRoomsCount = Math.min(20, fittingRoomsCount + 1)"
                      :disabled="fittingRoomsCount >= 20"
                    >+</button>
                  </div>
                  <div v-if="!isLoadingRooms" class="tsm-rooms-grid">
                    <div
                      v-for="n in 20"
                      :key="n"
                      class="tsm-rooms-cell"
                      :class="{ 'tsm-rooms-cell--on': n <= fittingRoomsCount }"
                      @click="fittingRoomsCount = n"
                    >{{ n }}</div>
                  </div>
                </div>

                <!-- Preview -->
                <div class="tsm-preview">
                  <div class="tsm-preview-header">
                    <span class="tsm-preview-title"
                      >Итого на {{ formatDate(currentDate) }}</span
                    >
                    <span class="tsm-preview-count"
                      >{{ effectiveSlots.length }} слотов</span
                    >
                  </div>
                  <div class="tsm-preview-grid">
                    <span
                      v-for="s in effectiveSlots"
                      :key="s"
                      class="tsm-preview-slot"
                      :class="{
                        'tsm-preview-slot--extra': todaySlots.includes(s),
                      }"
                      >{{ s }}</span
                    >
                  </div>
                </div>
              </template>
            </div>

            <!-- Footer -->
            <div class="tsm-footer">
              <button class="tsm-fbtn tsm-fbtn--ghost" @click="$emit('close')">
                Отмена
              </button>
              <button
                class="tsm-fbtn tsm-fbtn--primary"
                @click="handleSave"
                :disabled="isSaving || isLoading"
              >
                <div v-if="isSaving" class="tsm-spinner tsm-spinner--sm"></div>
                <Save v-else :size="14" />
                {{
                  isSaved
                    ? "Сохранено ✓"
                    : isSaving
                    ? "Сохранение..."
                    : "Сохранить"
                }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tsm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
}
.tsm-modal {
  width: min(520px, 100vw);
  height: 100%;
  background: var(--sf, #fff);
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.tsm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--bd, #e2e8f0);
  flex-shrink: 0;
}
.tsm-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.tsm-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.tsm-title {
  font: 700 17px/1 var(--fn, sans-serif);
  margin: 0;
  color: var(--tx, #0f172a);
}
.tsm-sub {
  font: 500 12px/1 var(--fn, sans-serif);
  color: var(--tx2, #64748b);
  margin-top: 4px;
  display: block;
}
.tsm-btn-close {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: none;
  cursor: pointer;
  transition: all 150ms;
  color: var(--txm, #94a3b8);
}
.tsm-btn-close:hover {
  background: var(--sfh, #f1f5f9);
  color: var(--tx, #0f172a);
}

.tsm-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: #fef2f2;
  color: #dc2626;
  font: 500 12px/1.3 var(--fn, sans-serif);
  flex-shrink: 0;
}
.tsm-error-x {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: none;
  color: #dc2626;
  cursor: pointer;
  margin-left: auto;
  flex-shrink: 0;
}
.tsm-error-x:hover {
  background: rgba(220, 38, 38, 0.1);
}

.tsm-spinner {
  width: 24px;
  height: 24px;
  border: 2.5px solid var(--bd, #e2e8f0);
  border-top-color: var(--pr, #2563eb);
  border-radius: 50%;
  animation: tsm-spin 0.7s linear infinite;
}
.tsm-spinner--sm {
  width: 14px;
  height: 14px;
  border-width: 2px;
}
@keyframes tsm-spin {
  to {
    transform: rotate(360deg);
  }
}

.tsm-body-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--tx2, #64748b);
  font: 500 13px/1 var(--fn, sans-serif);
}

.tsm-tabs {
  display: flex;
  border-bottom: 1px solid var(--bd, #e2e8f0);
  flex-shrink: 0;
  padding: 0 24px;
  gap: 4px;
}
.tsm-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  border: none;
  background: none;
  font: 600 12px/1 var(--fn, sans-serif);
  color: var(--tx2, #64748b);
  cursor: pointer;
  transition: all 150ms;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  border-radius: 6px 6px 0 0;
}
.tsm-tab:hover {
  color: var(--tx, #0f172a);
  background: var(--sfh, #f1f5f9);
}
.tsm-tab--on {
  color: var(--pr, #2563eb);
  border-bottom-color: var(--pr, #2563eb);
  background: rgba(37, 99, 235, 0.04);
}
.tsm-tab-count {
  background: var(--sfh, #f1f5f9);
  color: var(--tx2, #64748b);
  font: 700 10px/1 var(--fm, monospace);
  padding: 2px 6px;
  border-radius: 10px;
}
.tsm-tab--on .tsm-tab-count {
  background: var(--prl, #eff6ff);
  color: var(--pr, #2563eb);
}

.tsm-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
.tsm-body::-webkit-scrollbar {
  width: 4px;
}
.tsm-body::-webkit-scrollbar-thumb {
  background: var(--bds, #cbd5e1);
  border-radius: 4px;
}

.tsm-content {
  padding: 20px 24px;
}
.tsm-desc {
  margin-bottom: 16px;
}
.tsm-desc p {
  font: 400 13px/1.5 var(--fn, sans-serif);
  color: var(--tx2, #64748b);
  margin: 0;
}
.tsm-desc b {
  color: var(--tx, #0f172a);
  font-weight: 600;
}

.tsm-add-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.tsm-add-input-wrap {
  position: relative;
  flex: 1;
}
.tsm-add-ico {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--txm, #94a3b8);
  pointer-events: none;
}
.tsm-add-input {
  width: 100%;
  padding: 10px 12px 10px 34px;
  border: 1.5px solid var(--bd, #e2e8f0);
  border-radius: 10px;
  font: 500 14px/1 var(--fm, monospace);
  color: var(--tx, #0f172a);
  background: var(--sf, #fff);
  outline: none;
  transition: all 150ms;
}
.tsm-add-input:focus {
  border-color: var(--pr, #2563eb);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
.tsm-add-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  background: var(--pr, #2563eb);
  color: #fff;
  font: 600 12px/1 var(--fn, sans-serif);
  cursor: pointer;
  transition: all 150ms;
  flex-shrink: 0;
  white-space: nowrap;
}
.tsm-add-btn:hover:not(:disabled) {
  background: var(--prh, #1d4ed8);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}
.tsm-add-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tsm-quick {
  margin-bottom: 16px;
}
.tsm-quick-label {
  font: 500 10px/1 var(--fn, sans-serif);
  color: var(--txm, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: 8px;
}
.tsm-quick-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.tsm-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 5px 10px;
  border-radius: 20px;
  border: 1px dashed var(--bd, #e2e8f0);
  background: var(--sf, #fff);
  color: var(--tx2, #64748b);
  font: 600 11px/1 var(--fm, monospace);
  cursor: pointer;
  transition: all 150ms;
}
.tsm-chip--add:hover {
  border-color: var(--pr, #2563eb);
  color: var(--pr, #2563eb);
  background: var(--prl, #eff6ff);
  border-style: solid;
}

.tsm-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}
.tsm-slot {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--sfh, #f1f5f9);
  border: 1px solid var(--bd, #e2e8f0);
  border-radius: 10px;
  transition: all 200ms;
}
.tsm-slot:hover {
  border-color: var(--bds, #cbd5e1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.tsm-slot--today {
  background: var(--prl, #eff6ff);
  border-color: rgba(37, 99, 235, 0.2);
}
.tsm-slot-ico {
  color: var(--pr, #2563eb);
  flex-shrink: 0;
}
.tsm-slot--today .tsm-slot-ico {
  color: var(--am, #d97706);
}
.tsm-slot-time {
  font: 700 13px/1 var(--fm, monospace);
  color: var(--tx, #0f172a);
  letter-spacing: 0.02em;
}
.tsm-slot-badge {
  font: 700 8px/1 var(--fn, sans-serif);
  color: var(--am, #d97706);
  background: var(--aml, #fffbeb);
  padding: 2px 6px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.tsm-slot-del {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: none;
  color: var(--txm, #94a3b8);
  cursor: pointer;
  transition: all 150ms;
  margin-left: auto;
  flex-shrink: 0;
}
.tsm-slot-del:hover {
  background: var(--erl, #fef2f2);
  color: var(--er, #dc2626);
}

.tsm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 32px 16px;
  color: var(--txm, #94a3b8);
}
.tsm-empty span {
  font: 400 13px/1 var(--fn, sans-serif);
}

.tsm-reset {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px dashed var(--bd, #e2e8f0);
  border-radius: 8px;
  background: none;
  color: var(--tx2, #64748b);
  font: 500 11px/1 var(--fn, sans-serif);
  cursor: pointer;
  transition: all 150ms;
  margin-top: 4px;
}
.tsm-reset:hover:not(:disabled) {
  border-color: var(--bds, #cbd5e1);
  color: var(--tx, #0f172a);
  background: var(--sfh, #f1f5f9);
}
.tsm-reset:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tsm-preview {
  padding: 16px 24px;
  border-top: 1px solid var(--bd, #e2e8f0);
  background: var(--bg, #f8fafc);
}
.tsm-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.tsm-preview-title {
  font: 600 11px/1 var(--fn, sans-serif);
  color: var(--tx2, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.tsm-preview-count {
  font: 700 11px/1 var(--fm, monospace);
  color: var(--pr, #2563eb);
  background: var(--prl, #eff6ff);
  padding: 3px 8px;
  border-radius: 10px;
}
.tsm-preview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.tsm-preview-slot {
  font: 600 11px/1 var(--fm, monospace);
  padding: 5px 10px;
  border-radius: 6px;
  background: var(--sf, #fff);
  border: 1px solid var(--bd, #e2e8f0);
  color: var(--tx, #0f172a);
  transition: all 150ms;
}
.tsm-preview-slot--extra {
  background: var(--prl, #eff6ff);
  border-color: rgba(37, 99, 235, 0.2);
  color: var(--pr, #2563eb);
}

.tsm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid var(--bd, #e2e8f0);
  flex-shrink: 0;
  background: var(--sf, #fff);
}
.tsm-fbtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 11px 22px;
  border-radius: 10px;
  font: 600 13px/1 var(--fn, sans-serif);
  border: none;
  cursor: pointer;
  transition: all 150ms;
}
.tsm-fbtn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.tsm-fbtn--ghost {
  background: none;
  color: var(--tx2, #64748b);
  border: 1.5px solid var(--bd, #e2e8f0);
}
.tsm-fbtn--ghost:hover {
  background: var(--sfh, #f1f5f9);
  color: var(--tx, #0f172a);
}
.tsm-fbtn--primary {
  background: var(--pr, #2563eb);
  color: #fff;
}
.tsm-fbtn--primary:hover:not(:disabled) {
  background: var(--prh, #1d4ed8);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.tsm-fade-enter-active,
.tsm-fade-leave-active {
  transition: opacity 200ms;
}
.tsm-fade-enter-from,
.tsm-fade-leave-to {
  opacity: 0;
}
.tsm-slide-enter-active {
  transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
.tsm-slide-leave-active {
  transition: transform 200ms cubic-bezier(0.4, 0, 1, 1);
}
.tsm-slide-enter-from,
.tsm-slide-leave-to {
  transform: translateX(100%);
}

.tsm-slot-enter-active {
  transition: all 200ms ease-out;
}
.tsm-slot-leave-active {
  transition: all 150ms ease-in;
  position: absolute;
}
.tsm-slot-enter-from {
  opacity: 0;
  transform: scale(0.8);
}
.tsm-slot-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* ── Fitting rooms tab ── */
.tsm-rooms-ctrl {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 24px 0;
}
.tsm-rooms-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 2px solid var(--bd, #e2e8f0);
  background: var(--sf, #fff);
  font: 700 22px/1 var(--fn, sans-serif);
  color: var(--tx, #0f172a);
  cursor: pointer;
  transition: all 150ms;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tsm-rooms-btn:hover:not(:disabled) {
  border-color: var(--pr, #2563eb);
  color: var(--pr, #2563eb);
  background: var(--prl, #eff6ff);
}
.tsm-rooms-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.tsm-rooms-val {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 80px;
}
.tsm-rooms-num {
  font: 800 48px/1 var(--fm, monospace);
  color: var(--pr, #2563eb);
  letter-spacing: -0.04em;
}
.tsm-rooms-label {
  font: 500 12px/1 var(--fn, sans-serif);
  color: var(--tx2, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.tsm-rooms-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 6px;
  margin-top: 8px;
}
.tsm-rooms-cell {
  aspect-ratio: 1;
  border-radius: 8px;
  border: 1.5px solid var(--bd, #e2e8f0);
  background: var(--sf, #fff);
  font: 700 13px/1 var(--fm, monospace);
  color: var(--tx2, #64748b);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms;
}
.tsm-rooms-cell:hover {
  border-color: var(--pr, #2563eb);
  color: var(--pr, #2563eb);
  background: var(--prl, #eff6ff);
}
.tsm-rooms-cell--on {
  background: var(--pr, #2563eb);
  border-color: var(--pr, #2563eb);
  color: #fff;
}

@media (max-width: 640px) {
  .tsm-modal {
    width: 100vw;
  }
  .tsm-tabs {
    padding: 0 16px;
  }
  .tsm-content {
    padding: 16px;
  }
  .tsm-preview {
    padding: 12px 16px;
  }
  .tsm-footer {
    padding: 12px 16px;
  }
  .tsm-add-row {
    flex-direction: column;
  }
}
</style>
