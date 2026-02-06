<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { visitsApi, VISIT_STATUSES, VISIT_SOURCES } from "@/services/visitsApi";
import { clientsApi } from "@/services/clientsApi";
import type {
  Visit,
  VisitEmployee,
  VisitStatus,
  CreateVisitData,
  UpdateVisitData,
} from "@/services/visitsApi";
import type { Client } from "@/types/clients";
import {
  X,
  UserPlus,
  Search,
  Phone,
  Mail,
  User,
  Palette,
  Ruler,
  MessageSquare,
  Calendar,
  CheckCircle,
} from "lucide-vue-next";

export interface VisitEditPayload {
  slot: string;
  room: number;
  visit: Visit | null;
  dateStr: string;
  branchMoyskladId: string;
  branchLocalId?: number;
}

const props = defineProps<{
  open: boolean;
  payload: VisitEditPayload | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "saved"): void;
  (e: "open-new-client"): void;
}>();

// ── New client callback ──
const onNewClientCreated = (client: any) => {
  if (client) {
    form.value.client_moysklad_id = client.moysklad_id || "";
    form.value.client_name = client.name || client.full_name || "";
    form.value.client_phone = client.phone || "";
    form.value.client_email = client.email || "";
  }
};

// ── Form ──
const form = ref({
  client_moysklad_id: "",
  client_name: "",
  client_phone: "",
  client_email: "",
  size: "",
  color: "",
  source: "",
  notes: "",
  status: "zaplanirovano" as VisitStatus,
  fitting: false,
  employee_moysklad_id: "",
  employee_name: "",
});
const visitId = ref<number | null>(null);
const isSaving = ref(false);

watch(
  () => props.open,
  (v) => {
    if (!v || !props.payload) return;
    const vis = props.payload.visit;
    if (vis) {
      visitId.value = vis.id;
      form.value = {
        client_moysklad_id: vis.client_moysklad_id || "",
        client_name: vis.client?.name || "",
        client_phone: vis.client?.phone || "",
        client_email: vis.client?.email || "",
        size: vis.size || "",
        color: vis.color || "",
        source: vis.source || "",
        notes: vis.notes || "",
        status: vis.status,
        fitting: vis.fitting,
        employee_moysklad_id: vis.employee_moysklad_id || "",
        employee_name: vis.employee?.full_name || "",
      };
    } else {
      visitId.value = null;
      form.value = {
        client_moysklad_id: "",
        client_name: "",
        client_phone: "",
        client_email: "",
        size: "",
        color: "",
        source: "",
        notes: "",
        status: "zaplanirovano",
        fitting: false,
        employee_moysklad_id: "",
        employee_name: "",
      };
    }
    acClientOpen.value = false;
    acEmpOpen.value = false;
  }
);

const isEdit = computed(() => !!visitId.value);

// ── Save ──
const handleSave = async () => {
  if (!props.payload) return;
  isSaving.value = true;
  try {
    const p = props.payload;
    if (visitId.value) {
      const upd: UpdateVisitData = {
        status: form.value.status,
        fitting: form.value.fitting,
        fitting_room: p.room,
        size: form.value.size || undefined,
        color: form.value.color || undefined,
        source: form.value.source || undefined,
        notes: form.value.notes || undefined,
        employee_moysklad_id: form.value.employee_moysklad_id || undefined,
        client_moysklad_id: form.value.client_moysklad_id || undefined,
      };
      await visitsApi.updateVisit(visitId.value, upd);
    } else {
      if (!form.value.client_name.trim() && !form.value.client_moysklad_id) {
        isSaving.value = false;
        return;
      }
      const data: CreateVisitData = {
        visit_datetime: `${p.dateStr}T${p.slot}:00`,
        fitting_room: p.room,
        branch_moysklad_id: p.branchMoyskladId,
        status: form.value.status,
        fitting: form.value.fitting,
        size: form.value.size || undefined,
        color: form.value.color || undefined,
        source: form.value.source || undefined,
        notes: form.value.notes || undefined,
        employee_moysklad_id: form.value.employee_moysklad_id || undefined,
        client_moysklad_id: form.value.client_moysklad_id || undefined,
      };
      await visitsApi.createVisit(data);
    }
    emit("saved");
    emit("close");
  } catch (e) {
    console.error("Ошибка сохранения визита:", e);
  } finally {
    isSaving.value = false;
  }
};

// ── Client autocomplete ──
const acClients = ref<Client[]>([]);
const acClientLoading = ref(false);
const acClientOpen = ref(false);
let acTimer: ReturnType<typeof setTimeout> | null = null;

const searchClient = (query: string) => {
  if (query.length < 2) {
    acClients.value = [];
    acClientOpen.value = false;
    return;
  }
  acClientLoading.value = true;
  acClientOpen.value = true;
  if (acTimer) clearTimeout(acTimer);
  acTimer = setTimeout(async () => {
    try {
      const resp = await clientsApi.getClients({ search: query, limit: 8 });
      acClients.value = (resp as any).clients || (resp as any).data || [];
    } catch {
      acClients.value = [];
    }
    acClientLoading.value = false;
  }, 250);
};
const selectAcClient = (cl: any) => {
  form.value.client_moysklad_id = cl.moysklad_id || "";
  form.value.client_name = cl.name || cl.full_name || "";
  form.value.client_phone = cl.phone || "";
  form.value.client_email = cl.email || "";
  acClientOpen.value = false;
};
const getClientName = (cl: any) =>
  cl.name ||
  cl.full_name ||
  `${cl.first_name || ""} ${cl.last_name || ""}`.trim() ||
  "Без имени";
const getClientPhone = (cl: any) => cl.phone || "";
const getClientEmail = (cl: any) => cl.email || "";

// ── Employee autocomplete ──
const acEmployees = ref<VisitEmployee[]>([]);
const acEmpOpen = ref(false);
let empTimer: ReturnType<typeof setTimeout> | null = null;

const searchEmployee = (query: string) => {
  if (query.length < 1) {
    acEmployees.value = [];
    acEmpOpen.value = false;
    return;
  }
  acEmpOpen.value = true;
  if (empTimer) clearTimeout(empTimer);
  empTimer = setTimeout(async () => {
    try {
      const branchLocalId = props.payload?.branchLocalId;
      if (branchLocalId) {
        acEmployees.value = await visitsApi.getEmployeesByBranch(
          branchLocalId,
          query
        );
      } else {
        acEmployees.value = await visitsApi.searchEmployees(query);
      }
    } catch {
      acEmployees.value = [];
    }
  }, 200);
};
const selectAcEmployee = (emp: VisitEmployee) => {
  form.value.employee_moysklad_id = emp.moysklad_id;
  form.value.employee_name = emp.full_name;
  acEmpOpen.value = false;
};

// ── Status helpers ──
const statusColor = (s: VisitStatus): string => {
  switch (s) {
    case "kupil":
      return "#059669";
    case "ne_prishel":
    case "sdelka_provalena":
      return "#dc2626";
    case "otlozhil_bez_depozita":
    case "otlozhil_do_vechera":
      return "#d97706";
    case "otlozhil_s_depozitom":
      return "#2563eb";
    case "prishel":
      return "#0d9488";
    case "zapisalsya":
      return "#7c3aed";
    default:
      return "#94a3b8";
  }
};
const statusBg = (s: VisitStatus): string => {
  switch (s) {
    case "kupil":
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
      return "#f1f5f9";
  }
};
const statusIcon = (s: VisitStatus): string => {
  switch (s) {
    case "kupil":
      return "✓";
    case "ne_prishel":
      return "✗";
    case "sdelka_provalena":
      return "✗";
    case "otlozhil_bez_depozita":
      return "◷";
    case "otlozhil_s_depozitom":
      return "◈";
    case "otlozhil_do_vechera":
      return "◔";
    case "prishel":
      return "●";
    case "zapisalsya":
      return "◉";
    default:
      return "○";
  }
};

const handleOverlay = (e: MouseEvent) => {
  if ((e.target as HTMLElement).classList.contains("vem-overlay"))
    emit("close");
};

defineExpose({ onNewClientCreated });
</script>

<template>
  <Teleport to="body">
    <Transition name="vem-fade">
      <div v-if="open && payload" class="vem-overlay" @click="handleOverlay">
        <div class="vem-modal">
          <!-- Header -->
          <div class="vem-header">
            <div class="vem-header-left">
              <div class="vem-avatar"><Calendar :size="18" /></div>
              <div>
                <h2 class="vem-title">
                  {{ isEdit ? "Редактировать визит" : "Новый визит" }}
                </h2>
                <span class="vem-sub"
                  >Примерочная {{ payload.room }} · {{ payload.slot }} ·
                  {{ payload.dateStr }}</span
                >
              </div>
            </div>
            <button class="vem-btn-close" @click="$emit('close')">
              <X :size="18" />
            </button>
          </div>

          <!-- Body -->
          <div class="vem-body">
            <!-- Client -->
            <div class="vem-section">
              <h3 class="vem-sec-title"><User :size="13" /> Клиент</h3>
              <div class="vem-fields">
                <div class="vem-field vem-field--full vem-field--ac">
                  <label
                    ><Search :size="11" /> Поиск (имя, телефон, email)</label
                  >
                  <input
                    v-model="form.client_name"
                    type="text"
                    placeholder="Начните вводить имя, телефон или email..."
                    @input="searchClient(form.client_name)"
                    @focus="searchClient(form.client_name)"
                  />
                  <div v-if="acClientOpen" class="vem-ac">
                    <div v-if="acClientLoading" class="vem-ac-empty">
                      <span class="vem-spinner"></span> Поиск...
                    </div>
                    <template v-else-if="acClients.length">
                      <div
                        v-for="cl in acClients"
                        :key="(cl as any).moysklad_id || cl.id"
                        class="vem-ac-item"
                        @mousedown.prevent="selectAcClient(cl)"
                      >
                        <div class="vem-ac-main">
                          <span class="vem-ac-name">{{
                            getClientName(cl)
                          }}</span>
                          <span class="vem-ac-phone" v-if="getClientPhone(cl)"
                            ><Phone :size="9" /> {{ getClientPhone(cl) }}</span
                          >
                        </div>
                        <span class="vem-ac-email" v-if="getClientEmail(cl)"
                          ><Mail :size="9" /> {{ getClientEmail(cl) }}</span
                        >
                      </div>
                      <div
                        class="vem-ac-new"
                        @mousedown.prevent="$emit('open-new-client')"
                      >
                        <UserPlus :size="12" /> Новый клиент
                      </div>
                    </template>
                    <div v-else class="vem-ac-notfound">
                      <div class="vem-ac-empty">Клиенты не найдены</div>
                      <div
                        class="vem-ac-new"
                        @mousedown.prevent="$emit('open-new-client')"
                      >
                        <UserPlus :size="12" /> Создать нового клиента
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  class="vem-field vem-field--full"
                  v-if="!form.client_moysklad_id"
                >
                  <button
                    class="vem-newclient"
                    @click="$emit('open-new-client')"
                  >
                    <UserPlus :size="13" /> Новый клиент
                  </button>
                </div>
                <div class="vem-field">
                  <label><Phone :size="11" /> Телефон</label>
                  <input
                    v-model="form.client_phone"
                    type="text"
                    placeholder="+7..."
                    readonly
                    class="vem-inp--ro"
                  />
                </div>
                <div class="vem-field">
                  <label><Mail :size="11" /> Email</label>
                  <input
                    v-model="form.client_email"
                    type="text"
                    placeholder="—"
                    readonly
                    class="vem-inp--ro"
                  />
                </div>
              </div>
            </div>

            <!-- Details -->
            <div class="vem-section">
              <h3 class="vem-sec-title"><Palette :size="13" /> Детали</h3>
              <div class="vem-fields">
                <div class="vem-field">
                  <label><Ruler :size="11" /> Размер</label
                  ><input v-model="form.size" placeholder="M, L, 42..." />
                </div>
                <div class="vem-field">
                  <label><Palette :size="11" /> Цвет</label
                  ><input v-model="form.color" placeholder="Красный..." />
                </div>
                <div class="vem-field">
                  <label>Откуда узнал</label>
                  <select v-model="form.source">
                    <option value="">—</option>
                    <option v-for="s in VISIT_SOURCES" :key="s" :value="s">
                      {{ s }}
                    </option>
                  </select>
                </div>
                <div class="vem-field vem-field--ac">
                  <label>Консультант</label>
                  <input
                    v-model="form.employee_name"
                    type="text"
                    placeholder="Поиск сотрудника..."
                    @input="searchEmployee(form.employee_name)"
                    @focus="searchEmployee(form.employee_name)"
                  />
                  <div v-if="acEmpOpen && acEmployees.length" class="vem-ac">
                    <div
                      v-for="emp in acEmployees"
                      :key="emp.moysklad_id"
                      class="vem-ac-item"
                      @mousedown.prevent="selectAcEmployee(emp)"
                    >
                      <div class="vem-ac-main">
                        <span class="vem-ac-name">{{ emp.full_name }}</span>
                        <span class="vem-ac-pos" v-if="emp.position">{{
                          emp.position
                        }}</span>
                      </div>
                      <span class="vem-ac-phone" v-if="emp.phone"
                        ><Phone :size="9" /> {{ emp.phone }}</span
                      >
                    </div>
                  </div>
                </div>
                <div class="vem-field vem-field--full">
                  <label><MessageSquare :size="11" /> Комментарий</label>
                  <textarea
                    v-model="form.notes"
                    placeholder="Заметки..."
                    rows="3"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Status -->
            <div class="vem-section">
              <h3 class="vem-sec-title">Статус визита</h3>
              <div class="vem-statuses">
                <button
                  v-for="s in VISIT_STATUSES"
                  :key="s.value"
                  class="vem-st"
                  :class="{ 'vem-st--on': form.status === s.value }"
                  :style="
                    form.status === s.value
                      ? {
                          background: statusBg(s.value),
                          color: statusColor(s.value),
                          borderColor: statusColor(s.value),
                        }
                      : {}
                  "
                  @click="form.status = s.value"
                >
                  <span class="vem-st-icon">{{ statusIcon(s.value) }}</span>
                  <span>{{ s.label }}</span>
                </button>
              </div>
              <label class="vem-check">
                <input type="checkbox" v-model="form.fitting" />
                <CheckCircle
                  :size="15"
                  :style="{ color: form.fitting ? '#059669' : '#cbd5e1' }"
                />
                <span>Примерка состоялась</span>
              </label>
            </div>
          </div>

          <!-- Footer -->
          <div class="vem-footer">
            <button class="vem-btn vem-btn--ghost" @click="$emit('close')">
              Отмена
            </button>
            <button
              class="vem-btn vem-btn--primary"
              @click="handleSave"
              :disabled="isSaving"
            >
              <UserPlus v-if="!isEdit" :size="14" />
              {{ isEdit ? "Сохранить" : "Создать визит" }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.vem-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
}
.vem-modal {
  width: min(520px, 100vw);
  height: 100%;
  background: var(--sf, #fff);
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.vem-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 22px;
  border-bottom: 1px solid var(--bd, #e2e8f0);
  flex-shrink: 0;
}
.vem-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.vem-avatar {
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
.vem-title {
  font: 700 16px/1 var(--fn, sans-serif);
  margin: 0;
  color: var(--tx, #0f172a);
}
.vem-sub {
  font: 500 11px/1 var(--fn, sans-serif);
  color: var(--tx2, #64748b);
  margin-top: 3px;
  display: block;
}
.vem-btn-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  transition: all 150ms;
  color: var(--txm, #94a3b8);
}
.vem-btn-close:hover {
  background: var(--sfh, #f1f5f9);
  color: var(--tx, #0f172a);
}

.vem-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}
.vem-body::-webkit-scrollbar {
  width: 4px;
}
.vem-body::-webkit-scrollbar-thumb {
  background: var(--bds, #cbd5e1);
  border-radius: 4px;
}

.vem-section {
  padding: 20px 22px;
  border-bottom: 1px solid var(--bd, #e2e8f0);
}
.vem-section:last-child {
  border-bottom: none;
}
.vem-sec-title {
  font: 700 12px/1 var(--fn, sans-serif);
  color: var(--tx, #0f172a);
  margin: 0 0 16px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 6px;
}

.vem-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.vem-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  position: relative;
}
.vem-field--full {
  grid-column: 1/-1;
}
.vem-field--ac {
  position: relative;
}
.vem-field label {
  font: 600 10px/1 var(--fn, sans-serif);
  color: var(--tx2, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 4px;
}
.vem-field input,
.vem-field select,
.vem-field textarea {
  padding: 10px 12px;
  border: 1.5px solid var(--bd, #e2e8f0);
  border-radius: 8px;
  font: 400 13px/1.4 var(--fn, sans-serif);
  background: var(--sf, #fff);
  color: var(--tx, #0f172a);
  outline: none;
  transition: all 150ms;
}
.vem-field input:focus,
.vem-field select:focus,
.vem-field textarea:focus {
  border-color: var(--pr, #2563eb);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}
.vem-field input::placeholder,
.vem-field textarea::placeholder {
  color: var(--txm, #94a3b8);
}
.vem-field textarea {
  resize: vertical;
  min-height: 60px;
}
.vem-inp--ro {
  background: var(--sfh, #f1f5f9) !important;
  color: var(--tx2, #64748b) !important;
  cursor: default;
}

/* Autocomplete */
.vem-ac {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--sf, #fff);
  border: 1px solid var(--bds, #cbd5e1);
  border-top: 2px solid var(--pr, #2563eb);
  border-radius: 0 0 8px 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 100;
  max-height: 220px;
  overflow-y: auto;
}
.vem-ac-item {
  padding: 10px 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-bottom: 1px solid var(--bd, #e2e8f0);
  transition: background 150ms;
}
.vem-ac-item:last-child {
  border-bottom: none;
}
.vem-ac-item:hover {
  background: var(--prl, #eff6ff);
}
.vem-ac-main {
  display: flex;
  align-items: center;
  gap: 8px;
}
.vem-ac-name {
  font: 600 12px/1 var(--fn, sans-serif);
  color: var(--tx, #0f172a);
}
.vem-ac-phone {
  font: 500 10px/1 var(--fm, monospace);
  color: var(--tx2, #64748b);
  display: flex;
  align-items: center;
  gap: 3px;
}
.vem-ac-email {
  font: 400 10px/1 var(--fn, sans-serif);
  color: var(--txm, #94a3b8);
  display: flex;
  align-items: center;
  gap: 3px;
}
.vem-ac-pos {
  font: 500 10px/1 var(--fn, sans-serif);
  color: var(--txm, #94a3b8);
  background: var(--sfh, #f1f5f9);
  padding: 1px 5px;
  border-radius: 3px;
}
.vem-ac-empty {
  padding: 14px;
  text-align: center;
  font: 500 12px/1 var(--fn, sans-serif);
  color: var(--tx2, #64748b);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.vem-ac-notfound {
  display: flex;
  flex-direction: column;
}
.vem-ac-new {
  padding: 10px 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font: 600 12px/1 var(--fn, sans-serif);
  color: var(--pr, #2563eb);
  border-top: 1px dashed var(--bd, #e2e8f0);
  transition: background 150ms;
}
.vem-ac-new:hover {
  background: var(--prl, #eff6ff);
}
.vem-newclient {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1.5px dashed var(--pr, #2563eb);
  border-radius: 8px;
  background: var(--prl, #eff6ff);
  color: var(--pr, #2563eb);
  font: 600 12px/1 var(--fn, sans-serif);
  cursor: pointer;
  transition: all 150ms;
  width: 100%;
}
.vem-newclient:hover {
  background: var(--pr, #2563eb);
  color: #fff;
}
.vem-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--bd, #e2e8f0);
  border-top-color: var(--pr, #2563eb);
  border-radius: 50%;
  animation: vem-spin 0.6s linear infinite;
  display: inline-block;
}

/* ── Status grid — 3 columns, big buttons with icons ── */
.vem-statuses {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}
.vem-st {
  padding: 14px 8px;
  border-radius: 10px;
  border: 1.5px solid var(--bd, #e2e8f0);
  background: var(--sf, #fff);
  font: 600 11px/1.2 var(--fn, sans-serif);
  color: var(--tx2, #64748b);
  cursor: pointer;
  transition: all 150ms;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.vem-st:hover {
  border-color: var(--bds, #cbd5e1);
  background: var(--sfh, #f1f5f9);
  color: var(--tx, #0f172a);
}
.vem-st--on {
  border-width: 2px;
  font-weight: 700;
}
.vem-st-icon {
  font-size: 16px;
  line-height: 1;
}

.vem-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font: 500 14px/1 var(--fn, sans-serif);
  color: var(--tx, #0f172a);
  cursor: pointer;
  padding: 4px 0;
}
.vem-check input {
  width: 18px;
  height: 18px;
  accent-color: #059669;
  cursor: pointer;
  flex-shrink: 0;
}

.vem-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 22px;
  border-top: 1px solid var(--bd, #e2e8f0);
  flex-shrink: 0;
  background: var(--sf, #fff);
}
.vem-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 11px 22px;
  border-radius: 8px;
  font: 600 13px/1 var(--fn, sans-serif);
  border: none;
  cursor: pointer;
  transition: all 150ms;
}
.vem-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.vem-btn--ghost {
  background: none;
  color: var(--tx2, #64748b);
  border: 1.5px solid var(--bd, #e2e8f0);
}
.vem-btn--ghost:hover:not(:disabled) {
  background: var(--sfh, #f1f5f9);
  color: var(--tx, #0f172a);
}
.vem-btn--primary {
  background: var(--pr, #2563eb);
  color: #fff;
}
.vem-btn--primary:hover:not(:disabled) {
  background: var(--prh, #1d4ed8);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.vem-fade-enter-active,
.vem-fade-leave-active {
  transition: opacity 200ms;
}
.vem-fade-enter-from,
.vem-fade-leave-to {
  opacity: 0;
}
.vem-slide-enter-active {
  transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
.vem-slide-leave-active {
  transition: transform 200ms cubic-bezier(0.4, 0, 1, 1);
}
.vem-slide-enter-from,
.vem-slide-leave-to {
  transform: translateX(100%);
}
@keyframes vem-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .vem-modal {
    width: 100vw;
  }
  .vem-fields {
    grid-template-columns: 1fr;
  }
  .vem-statuses {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
