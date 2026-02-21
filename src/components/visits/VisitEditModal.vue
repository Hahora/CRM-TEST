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
  Ghost,
  Heart,
} from "lucide-vue-next";

export interface VisitEditPayload {
  slot: string;
  room: number;
  visit: Visit | null;
  dateStr: string;
  branchMoyskladId: string;
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

// ── Size options ──
const sizeOptions182 = Array.from(
  { length: 14 },
  (_, i) => `${44 + i * 2}/182`
);
const sizeOptions194 = Array.from(
  { length: 10 },
  (_, i) => `${48 + i * 2}/194`
);

// ── New client callback ──
const onNewClientCreated = (client: any) => {
  if (client) {
    form.value.client_moysklad_id = client.moysklad_id || "";
    form.value.client_name = client.full_name || client.name || "";
    form.value.client_phone = client.phone || "";
    form.value.client_email = client.email || "";
    form.value.client_local_id = null;
    form.value.is_phantom = false;
    form.value.is_wedding = false;
    form.value.wedding_date = "";
    form.value.bride_name = "";
  }
};

// ── Form ──
const form = ref({
  client_moysklad_id: "",
  client_name: "",
  client_phone: "",
  client_email: "",
  client_local_id: null as number | null,
  is_phantom: false,
  phantom_name: "",
  phantom_phone: "",
  phantom_email: "",
  is_wedding: false,
  wedding_date: "",
  bride_name: "",
  size: "",
  color: "",
  source: "",
  recommended_by: "",
  notes: "",
  status: "zapisalsya" as VisitStatus,
  fitting: false,
  employee_moysklad_id: "",
  employee_name: "",
  postponed_until: "",
  deposit_amount: "" as string | number,
});
const visitId = ref<number | null>(null);
const isSaving = ref(false);
const customSource = ref("");

// ── Russian status → enum mapping ──
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
const normalizeStatus = (s: string): VisitStatus => {
  if (VISIT_STATUSES.some((st) => st.value === s)) return s as VisitStatus;
  return russianStatusMap[s.toLowerCase()] || "zapisalsya";
};

// ── Client wedding details ──
const isLoadingClientDetails = ref(false);

const loadClientDetails = async (moyskladId: string) => {
  if (!moyskladId) return;
  isLoadingClientDetails.value = true;
  try {
    const detail = await clientsApi.getClientDetail(moyskladId, 1);
    form.value.client_local_id = detail.id;
    form.value.is_wedding = detail.is_wedding || false;
    form.value.wedding_date = detail.wedding_date || "";
    form.value.bride_name = detail.bride_name || "";
    // Откуда узнал — берём из клиента (как логика свадьбы)
    if (detail.source?.startsWith("Порекомендовали: ")) {
      form.value.source = "Порекомендовали";
      form.value.recommended_by = detail.source.replace("Порекомендовали: ", "");
      customSource.value = "";
    } else if (detail.source && !VISIT_SOURCES.includes(detail.source as typeof VISIT_SOURCES[number])) {
      form.value.source = "Другое";
      form.value.recommended_by = "";
      customSource.value = detail.source;
    } else {
      form.value.source = detail.source || "";
      form.value.recommended_by = "";
      customSource.value = "";
    }
  } catch {
    // не критично
  }
  isLoadingClientDetails.value = false;
};

// ── Employees (dropdown) ──
const loadedEmployees = ref<VisitEmployee[]>([]);
const isLoadingEmployees = ref(false);

const loadEmployees = async () => {
  const branchMsId = props.payload?.branchMoyskladId;
  if (!branchMsId) return;
  isLoadingEmployees.value = true;
  try {
    loadedEmployees.value = await visitsApi.getEmployeesByBranch(branchMsId);
  } catch {
    loadedEmployees.value = [];
  }
  isLoadingEmployees.value = false;
};

const onEmployeeSelect = () => {
  const emp = loadedEmployees.value.find(
    (e) => e.moysklad_id === form.value.employee_moysklad_id
  );
  form.value.employee_name = emp?.full_name || "";
};

watch(
  () => props.open,
  (v) => {
    if (!v || !props.payload) return;
    const vis = props.payload.visit;
    if (vis) {
      visitId.value = vis.id;
      const isPhantom =
        vis.is_phantom_client || vis.client?.is_phantom || false;
      form.value = {
        client_moysklad_id: vis.client_moysklad_id || "",
        client_name: vis.client?.name || vis.client?.full_name || "",
        client_phone: vis.client?.phone || "",
        client_email: vis.client?.email || "",
        client_local_id: null,
        is_phantom: isPhantom,
        phantom_name: isPhantom
          ? vis.client?.name || vis.client?.full_name || ""
          : "",
        phantom_phone: isPhantom ? vis.client?.phone || "" : "",
        phantom_email: isPhantom ? vis.client?.email || "" : "",
        is_wedding: false,
        wedding_date: "",
        bride_name: "",
        size: vis.size || "",
        color: vis.color || "",
        source: vis.source?.startsWith("Порекомендовали: ")
          ? "Порекомендовали"
          : vis.source && !VISIT_SOURCES.includes(vis.source as typeof VISIT_SOURCES[number])
          ? "Другое"
          : vis.source || "",
        recommended_by: vis.source?.startsWith("Порекомендовали: ")
          ? vis.source.replace("Порекомендовали: ", "")
          : "",
        notes: vis.notes || "",
        status: normalizeStatus(vis.status),
        fitting: vis.fitting,
        employee_moysklad_id: vis.employee_moysklad_id || "",
        employee_name: vis.employee?.full_name || "",
        postponed_until: vis.postponed_until || "",
        deposit_amount: vis.deposit_amount ?? "",
      };
      // customSource для "Другое" из данных визита
      customSource.value =
        vis.source &&
        !vis.source.startsWith("Порекомендовали: ") &&
        !VISIT_SOURCES.includes(vis.source as typeof VISIT_SOURCES[number])
          ? vis.source
          : "";
      // Подтягиваем данные свадьбы и источника клиента если есть
      if (!isPhantom && vis.client_moysklad_id) {
        loadClientDetails(vis.client_moysklad_id);
      }
    } else {
      visitId.value = null;
      form.value = {
        client_moysklad_id: "",
        client_name: "",
        client_phone: "",
        client_email: "",
        client_local_id: null,
        is_phantom: false,
        phantom_name: "",
        phantom_phone: "",
        phantom_email: "",
        is_wedding: false,
        wedding_date: "",
        bride_name: "",
        size: "",
        color: "",
        source: "",
        recommended_by: "",
        notes: "",
        status: "zapisalsya",
        fitting: false,
        employee_moysklad_id: "",
        employee_name: "",
        postponed_until: "",
        deposit_amount: "",
      };
      customSource.value = "";
    }
    acClientOpen.value = false;
    loadEmployees();
  }
);

const isEdit = computed(() => !!visitId.value);

// ── Computed: show extra fields based on status / source ──
const showPostponedDate = computed(
  () =>
    form.value.status === "otlozhil_bez_depozita" ||
    form.value.status === "otlozhil_s_depozitom"
);
const showDepositAmount = computed(
  () => form.value.status === "otlozhil_s_depozitom"
);
const showRecommendedBy = computed(
  () => form.value.source === "Порекомендовали"
);
const showCustomSource = computed(
  () => form.value.source === "Другое"
);

// ── Save ──
const handleSave = async () => {
  if (!props.payload) return;
  isSaving.value = true;
  try {
    const p = props.payload;
    // Build source field: combine source + recommended_by if needed
    const sourceValue =
      showRecommendedBy.value && form.value.recommended_by
        ? `Порекомендовали: ${form.value.recommended_by}`
        : showCustomSource.value
        ? customSource.value.trim() || "Другое"
        : form.value.source || undefined;

    if (visitId.value) {
      const upd: UpdateVisitData = {
        status: form.value.status,
        fitting: form.value.fitting,
        fitting_room: p.room,
        size: form.value.size || undefined,
        color: form.value.color || undefined,
        source: sourceValue,
        notes: form.value.notes || undefined,
        employee_moysklad_id: form.value.employee_moysklad_id || undefined,
        client_moysklad_id: form.value.client_moysklad_id || undefined,
        postponed_until: showPostponedDate.value
          ? form.value.postponed_until || undefined
          : undefined,
        deposit_amount:
          showDepositAmount.value && form.value.deposit_amount !== ""
            ? Number(form.value.deposit_amount)
            : undefined,
      };
      if (form.value.is_phantom) {
        upd.is_phantom_client = true;
        upd.phantom_client_name = form.value.phantom_name || undefined;
        upd.phantom_client_phone = form.value.phantom_phone || undefined;
        upd.phantom_client_email = form.value.phantom_email || undefined;
        upd.client_moysklad_id = undefined;
      }
      const promises: Promise<any>[] = [visitsApi.updateVisit(visitId.value, upd)];
      if (form.value.client_local_id && !form.value.is_phantom) {
        promises.push(clientsApi.updateClient(form.value.client_local_id, {
          is_wedding: form.value.is_wedding,
          wedding_date: form.value.is_wedding && form.value.wedding_date ? form.value.wedding_date : null,
          bride_name: form.value.is_wedding && form.value.bride_name ? form.value.bride_name : null,
          source: sourceValue,
        }));
      }
      await Promise.all(promises);
    } else {
      // New visit: validate client
      const hasClient =
        form.value.client_moysklad_id || form.value.client_name.trim();
      const hasPhantom = form.value.is_phantom;
      if (!hasClient && !hasPhantom) {
        isSaving.value = false;
        return;
      }
      const data: CreateVisitData = {
        visit_datetime: `${p.dateStr}T${p.slot}:00+03:00`,
        fitting_room: p.room,
        branch_moysklad_id: p.branchMoyskladId,
        status: form.value.status,
        fitting: form.value.fitting,
        size: form.value.size || undefined,
        color: form.value.color || undefined,
        source: sourceValue,
        notes: form.value.notes || undefined,
        employee_moysklad_id: form.value.employee_moysklad_id || undefined,
        postponed_until: showPostponedDate.value
          ? form.value.postponed_until || undefined
          : undefined,
        deposit_amount:
          showDepositAmount.value && form.value.deposit_amount !== ""
            ? Number(form.value.deposit_amount)
            : undefined,
      };
      if (form.value.is_phantom) {
        data.is_phantom_client = true;
        data.phantom_client_name = form.value.phantom_name || undefined;
        data.phantom_client_phone = form.value.phantom_phone || undefined;
        data.phantom_client_email = form.value.phantom_email || undefined;
      } else {
        data.client_moysklad_id = form.value.client_moysklad_id || undefined;
      }
      const promises: Promise<any>[] = [visitsApi.createVisit(data)];
      if (form.value.client_local_id && !form.value.is_phantom) {
        promises.push(clientsApi.updateClient(form.value.client_local_id, {
          is_wedding: form.value.is_wedding,
          wedding_date: form.value.is_wedding && form.value.wedding_date ? form.value.wedding_date : null,
          bride_name: form.value.is_wedding && form.value.bride_name ? form.value.bride_name : null,
          source: sourceValue,
        }));
      }
      await Promise.all(promises);
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
const acClients = ref<any[]>([]);
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
  form.value.client_name = cl.full_name || cl.name || "";
  form.value.client_phone = cl.phone || "";
  form.value.client_email = cl.email || "";
  form.value.client_local_id = cl.id || null;
  form.value.is_phantom = false;
  // Данные свадьбы уже есть в ответе getClients — берём сразу
  form.value.is_wedding = cl.is_wedding || false;
  form.value.wedding_date = cl.wedding_date || "";
  form.value.bride_name = cl.bride_name || "";
  // Откуда узнал — берём из данных клиента
  if (cl.source?.startsWith("Порекомендовали: ")) {
    form.value.source = "Порекомендовали";
    form.value.recommended_by = cl.source.replace("Порекомендовали: ", "");
    customSource.value = "";
  } else if (cl.source && !VISIT_SOURCES.includes(cl.source as typeof VISIT_SOURCES[number])) {
    form.value.source = "Другое";
    form.value.recommended_by = "";
    customSource.value = cl.source;
  } else {
    form.value.source = cl.source || "";
    form.value.recommended_by = "";
    customSource.value = "";
  }
  acClientOpen.value = false;
};
const clearClient = () => {
  form.value.client_moysklad_id = "";
  form.value.client_name = "";
  form.value.client_phone = "";
  form.value.client_email = "";
  form.value.client_local_id = null;
  form.value.is_wedding = false;
  form.value.wedding_date = "";
  form.value.bride_name = "";
};
const enablePhantom = () => {
  clearClient();
  form.value.is_phantom = true;
};
const disablePhantom = () => {
  form.value.is_phantom = false;
  form.value.phantom_name = "";
  form.value.phantom_phone = "";
  form.value.phantom_email = "";
};
const getClientName = (cl: any) =>
  cl.full_name ||
  cl.name ||
  `${cl.first_name || ""} ${cl.last_name || ""}`.trim() ||
  "Без имени";
const getClientPhone = (cl: any) => cl.phone || "";
const getClientEmail = (cl: any) => cl.email || "";

// ── Status helpers ──
const statusColor = (s: VisitStatus): string => {
  switch (s) {
    case "kupil":
    case "vykupil_depozit":
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
      return "#f1f5f9";
  }
};
const statusIcon = (s: VisitStatus): string => {
  switch (s) {
    case "kupil":
      return "✓";
    case "vykupil_depozit":
      return "✦";
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
              <div class="vem-sec-row">
                <h3 class="vem-sec-title"><User :size="13" /> Клиент</h3>
                <div class="vem-sec-actions">
                  <button
                    v-if="!form.is_phantom"
                    class="vem-ghost-btn"
                    @click="enablePhantom"
                    title="Гость без регистрации"
                  >
                    <Ghost :size="12" /> Гость
                  </button>
                  <button
                    v-else
                    class="vem-ghost-btn vem-ghost-btn--on"
                    @click="disablePhantom"
                  >
                    <Ghost :size="12" /> Анонимный гость
                  </button>
                </div>
              </div>

              <!-- Phantom client fields -->
              <div v-if="form.is_phantom" class="vem-fields">
                <div class="vem-phantom-badge">
                  <Ghost :size="14" /> Гость без регистрации в базе
                </div>
                <div class="vem-field">
                  <label><User :size="11" /> Имя (необязательно)</label>
                  <input
                    v-model="form.phantom_name"
                    type="text"
                    placeholder="Иван Иванов..."
                  />
                </div>
                <div class="vem-field">
                  <label><Phone :size="11" /> Телефон (необязательно)</label>
                  <input
                    v-model="form.phantom_phone"
                    type="text"
                    placeholder="+7..."
                  />
                </div>
                <!-- Откуда узнал для анонима -->
                <div class="vem-field">
                  <label>Откуда узнал</label>
                  <select v-model="form.source">
                    <option value="">—</option>
                    <option v-for="s in VISIT_SOURCES" :key="s" :value="s">{{ s }}</option>
                  </select>
                </div>
                <div class="vem-field" v-if="showRecommendedBy">
                  <label><User :size="11" /> Кто порекомендовал</label>
                  <input v-model="form.recommended_by" type="text" placeholder="Имя или контакт..." />
                </div>
                <div class="vem-field" v-if="showCustomSource">
                  <label>Уточнение</label>
                  <input v-model="customSource" type="text" placeholder="Откуда именно..." />
                </div>
              </div>

              <!-- Regular client search -->
              <div v-else class="vem-fields">
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
                        :key="cl.moysklad_id || cl.id"
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

                <!-- Свадьба -->
                <div class="vem-field vem-field--full">
                  <label class="vem-wedding-toggle">
                    <input type="checkbox" v-model="form.is_wedding" />
                    <Heart :size="12" />
                    Свадьба
                    <span v-if="isLoadingClientDetails" class="vem-spinner vem-spinner--sm"></span>
                  </label>
                </div>
                <template v-if="form.is_wedding">
                  <div class="vem-field">
                    <label><Calendar :size="11" /> Дата свадьбы</label>
                    <input v-model="form.wedding_date" type="date" />
                  </div>
                  <div class="vem-field">
                    <label><User :size="11" /> Имя невесты</label>
                    <input
                      v-model="form.bride_name"
                      type="text"
                      placeholder="Имя невесты..."
                    />
                  </div>
                </template>
                <!-- Откуда узнал — клиентское поле -->
                <div class="vem-field">
                  <label>Откуда узнал</label>
                  <select v-model="form.source">
                    <option value="">—</option>
                    <option v-for="s in VISIT_SOURCES" :key="s" :value="s">{{ s }}</option>
                  </select>
                </div>
                <div class="vem-field" v-if="showRecommendedBy">
                  <label><User :size="11" /> Кто порекомендовал</label>
                  <input v-model="form.recommended_by" type="text" placeholder="Имя или контакт..." />
                </div>
                <div class="vem-field" v-if="showCustomSource">
                  <label>Уточнение</label>
                  <input v-model="customSource" type="text" placeholder="Откуда именно..." />
                </div>
              </div>
            </div>

            <!-- Details -->
            <div class="vem-section">
              <h3 class="vem-sec-title"><Palette :size="13" /> Детали</h3>
              <div class="vem-fields">
                <!-- Size select -->
                <div class="vem-field">
                  <label><Ruler :size="11" /> Размер</label>
                  <select v-model="form.size">
                    <option value="">— Выбрать —</option>
                    <optgroup label="182">
                      <option v-for="s in sizeOptions182" :key="s" :value="s">
                        {{ s }}
                      </option>
                    </optgroup>
                    <optgroup label="194">
                      <option v-for="s in sizeOptions194" :key="s" :value="s">
                        {{ s }}
                      </option>
                    </optgroup>
                  </select>
                </div>
                <div class="vem-field">
                  <label><Palette :size="11" /> Цвет</label
                  ><input v-model="form.color" placeholder="Красный..." />
                </div>
                <!-- Consultant dropdown -->
                <div class="vem-field">
                  <label>Консультант</label>
                  <select
                    v-model="form.employee_moysklad_id"
                    @change="onEmployeeSelect"
                    :disabled="isLoadingEmployees"
                  >
                    <option value="">
                      {{ isLoadingEmployees ? "Загрузка..." : "— Выбрать —" }}
                    </option>
                    <option
                      v-for="emp in loadedEmployees"
                      :key="emp.moysklad_id"
                      :value="emp.moysklad_id"
                    >
                      {{ emp.full_name
                      }}{{ emp.position ? ` · ${emp.position}` : "" }}
                    </option>
                  </select>
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

              <!-- Extra fields for postponed statuses -->
              <div
                v-if="showPostponedDate || showDepositAmount"
                class="vem-deposit-fields"
              >
                <div class="vem-field vem-field--big" v-if="showPostponedDate">
                  <label><Calendar :size="11" /> Отложен до</label>
                  <input
                    v-model="form.postponed_until"
                    type="text"
                    placeholder="Например: 25 февраля, 1 марта..."
                    class="vem-inp--big"
                  />
                </div>
                <div class="vem-field vem-field--big" v-if="showDepositAmount">
                  <label>Сумма депозита (₽)</label>
                  <input
                    v-model="form.deposit_amount"
                    type="number"
                    placeholder="0"
                    min="0"
                    class="vem-inp--big"
                  />
                </div>
              </div>

              <label class="vem-check">
                <input type="checkbox" v-model="form.fitting" />
                <span>Примерка костюма</span>
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
.vem-sec-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
.vem-sec-actions {
  display: flex;
  gap: 6px;
}
.vem-ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1.5px solid var(--bd, #e2e8f0);
  border-radius: 6px;
  background: none;
  font: 600 11px/1 var(--fn, sans-serif);
  color: var(--tx2, #64748b);
  cursor: pointer;
  transition: all 150ms;
}
.vem-ghost-btn:hover {
  border-color: var(--pr, #2563eb);
  color: var(--pr, #2563eb);
}
.vem-ghost-btn--on {
  background: #f0fdf4;
  border-color: #16a34a;
  color: #16a34a;
}
.vem-phantom-badge {
  grid-column: 1/-1;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
  border-radius: 8px;
  font: 600 12px/1 var(--fn, sans-serif);
  color: #16a34a;
  margin-bottom: 4px;
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
.vem-field--big {
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
.vem-inp--big {
  padding: 13px 14px !important;
  font-size: 14px !important;
  border-width: 2px !important;
}

/* Deposit fields section */
.vem-deposit-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 16px 0;
  padding: 16px;
  background: var(--sfh, #f8fafc);
  border-radius: 10px;
  border: 1.5px solid var(--bd, #e2e8f0);
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
.vem-spinner--sm {
  width: 10px;
  height: 10px;
}
.vem-wedding-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font: 600 13px/1 var(--fn, sans-serif);
  color: #be185d;
  user-select: none;
}
.vem-wedding-toggle input[type="checkbox"] {
  width: 15px;
  height: 15px;
  accent-color: #be185d;
  cursor: pointer;
}

/* ── Status grid — 4 columns ── */
.vem-statuses {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
  .vem-deposit-fields {
    grid-template-columns: 1fr;
  }
}
</style>
