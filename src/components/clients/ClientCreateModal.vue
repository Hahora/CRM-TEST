<script setup lang="ts">
import { ref, watch, computed } from "vue";
import {
  User,
  Briefcase,
  Building2,
  Phone,
  Mail,
  Send,
  Calendar,
  Heart,
  X,
  UserPlus,
} from "lucide-vue-next";

export interface NewClientData {
  name: string;
  company_type: "individual" | "legal" | "entrepreneur";
  phone: string;
  email: string;
  sex: string;
  birth_date: string;
  legal_first_name: string;
  legal_last_name: string;
  legal_middle_name: string;
  inn: string;
  kpp: string;
  ogrn: string;
  ogrnip: string;
  legal_address: string;
  telegram_id: string;
  max_id: string;
  source: string;
  is_wedding: boolean;
  wedding_date: string;
  bride_name: string;
}

const props = defineProps<{
  open: boolean;
  sources: string[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "create", data: NewClientData): void;
}>();

const defaultForm = (): NewClientData => ({
  name: "",
  company_type: "individual",
  phone: "",
  email: "",
  sex: "",
  birth_date: "",
  legal_first_name: "",
  legal_last_name: "",
  legal_middle_name: "",
  inn: "",
  kpp: "",
  ogrn: "",
  ogrnip: "",
  legal_address: "",
  telegram_id: "",
  max_id: "",
  source: "",
  is_wedding: false,
  wedding_date: "",
  bride_name: "",
});

const form = ref<NewClientData>(defaultForm());
const isSubmitting = ref(false);

watch(
  () => props.open,
  (v) => {
    if (v) form.value = defaultForm();
  }
);

const canSubmit = computed(() => {
  const f = form.value;
  if (!f.phone?.trim()) return false;
  if (f.company_type === "individual") return !!f.legal_first_name?.trim();
  return !!f.name?.trim();
});

const handleSubmit = () => {
  if (!canSubmit.value || isSubmitting.value) return;
  isSubmitting.value = true;
  emit("create", { ...form.value });
  setTimeout(() => {
    isSubmitting.value = false;
  }, 400);
};

const handleOverlay = (e: MouseEvent) => {
  if ((e.target as HTMLElement).classList.contains("ccm-overlay"))
    emit("close");
};

const types = [
  { key: "individual" as const, label: "Физ. лицо", icon: User },
  { key: "entrepreneur" as const, label: "ИП", icon: Briefcase },
  { key: "legal" as const, label: "Юр. лицо", icon: Building2 },
];
</script>

<template>
  <Teleport to="body">
    <Transition name="ccm-fade">
      <div v-if="open" class="ccm-overlay" @click="handleOverlay">
        <Transition name="ccm-slide">
          <div v-if="open" class="ccm-modal">
            <!-- Header -->
            <div class="ccm-header">
              <div class="ccm-header-left">
                <div class="ccm-avatar">
                  <UserPlus :size="18" />
                </div>
                <h2 class="ccm-title">Новый клиент</h2>
              </div>
              <button class="ccm-btn-close" @click="$emit('close')">
                <X :size="18" />
              </button>
            </div>

            <!-- Body -->
            <div class="ccm-body">
              <form @submit.prevent="handleSubmit" class="ccm-form">
                <!-- Type switcher -->
                <div class="ccm-section">
                  <div class="ccm-types">
                    <button
                      v-for="t in types"
                      :key="t.key"
                      type="button"
                      class="ccm-type"
                      :class="{ 'ccm-type--on': form.company_type === t.key }"
                      @click="form.company_type = t.key"
                    >
                      <component :is="t.icon" :size="15" />
                      {{ t.label }}
                    </button>
                  </div>
                </div>

                <!-- Main fields -->
                <div class="ccm-section">
                  <h3 class="ccm-section-title">Основные данные</h3>
                  <div class="ccm-fields">
                    <!-- Юр. лицо: название -->
                    <div
                      v-if="form.company_type === 'legal'"
                      class="ccm-field ccm-field--req"
                    >
                      <label><Building2 :size="12" /> Название</label>
                      <input
                        v-model="form.name"
                        type="text"
                        placeholder="ООО Ромашка"
                      />
                    </div>

                    <!-- ИП: название -->
                    <div
                      v-if="form.company_type === 'entrepreneur'"
                      class="ccm-field ccm-field--req"
                    >
                      <label><Briefcase :size="12" /> Название</label>
                      <input
                        v-model="form.name"
                        type="text"
                        placeholder="ИП Иванов И.И."
                      />
                    </div>

                    <!-- Физ / ИП: ФИО -->
                    <template v-if="form.company_type !== 'legal'">
                      <div class="ccm-field ccm-field--req">
                        <label><User :size="12" /> Имя</label>
                        <input
                          v-model="form.legal_first_name"
                          type="text"
                          :placeholder="
                            form.company_type === 'entrepreneur'
                              ? 'Иван'
                              : 'Пётр'
                          "
                        />
                      </div>
                      <div class="ccm-field">
                        <label>Фамилия</label>
                        <input
                          v-model="form.legal_last_name"
                          type="text"
                          :placeholder="
                            form.company_type === 'entrepreneur'
                              ? 'Иванов'
                              : 'Петров'
                          "
                        />
                      </div>
                      <div class="ccm-field">
                        <label>Отчество</label>
                        <input
                          v-model="form.legal_middle_name"
                          type="text"
                          :placeholder="
                            form.company_type === 'entrepreneur'
                              ? 'Иванович'
                              : 'Петрович'
                          "
                        />
                      </div>
                    </template>

                    <!-- Контакты -->
                    <div class="ccm-field ccm-field--req">
                      <label><Phone :size="12" /> Телефон</label>
                      <input
                        v-model="form.phone"
                        type="tel"
                        placeholder="+7 (999) 123-45-67"
                      />
                    </div>
                    <div class="ccm-field">
                      <label><Mail :size="12" /> Email</label>
                      <input
                        v-model="form.email"
                        type="email"
                        placeholder="email@mail.com"
                      />
                    </div>
                    <div class="ccm-field">
                      <label><Send :size="12" /> Telegram</label>
                      <input
                        v-model="form.telegram_id"
                        type="text"
                        placeholder="@user"
                      />
                    </div>
                  </div>
                </div>

                <!-- Individual extra -->
                <div
                  v-if="form.company_type === 'individual'"
                  class="ccm-section"
                >
                  <h3 class="ccm-section-title">Дополнительно</h3>
                  <div class="ccm-fields">
                    <div class="ccm-field">
                      <label>Пол</label>
                      <div class="ccm-sex-toggle">
                        <button
                          type="button"
                          class="ccm-sex-btn"
                          :class="{ 'ccm-sex-btn--on': form.sex === 'MALE' }"
                          @click="form.sex = form.sex === 'MALE' ? '' : 'MALE'"
                        >
                          М
                        </button>
                        <button
                          type="button"
                          class="ccm-sex-btn"
                          :class="{ 'ccm-sex-btn--on': form.sex === 'FEMALE' }"
                          @click="
                            form.sex = form.sex === 'FEMALE' ? '' : 'FEMALE'
                          "
                        >
                          Ж
                        </button>
                      </div>
                    </div>
                    <div class="ccm-field">
                      <label><Calendar :size="12" /> Дата рождения</label>
                      <input v-model="form.birth_date" type="date" />
                    </div>
                    <div class="ccm-field ccm-field--full">
                      <label class="ccm-check-label">
                        <input type="checkbox" v-model="form.is_wedding" />
                        <Heart
                          :size="13"
                          :class="{ 'ccm-heart--on': form.is_wedding }"
                        />
                        <span>Свадьба</span>
                      </label>
                    </div>
                    <template v-if="form.is_wedding">
                      <div class="ccm-field">
                        <label><Calendar :size="12" /> Дата свадьбы</label>
                        <input v-model="form.wedding_date" type="date" />
                      </div>
                      <div class="ccm-field">
                        <label>Имя невесты</label>
                        <input
                          v-model="form.bride_name"
                          type="text"
                          placeholder="Имя"
                        />
                      </div>
                    </template>
                  </div>
                </div>

                <!-- ИП: реквизиты -->
                <div
                  v-if="form.company_type === 'entrepreneur'"
                  class="ccm-section"
                >
                  <h3 class="ccm-section-title">Реквизиты</h3>
                  <div class="ccm-fields">
                    <div class="ccm-field">
                      <label>ИНН</label
                      ><input
                        v-model="form.inn"
                        type="text"
                        placeholder="123456789012"
                        maxlength="12"
                      />
                    </div>
                    <div class="ccm-field">
                      <label>ОГРНИП</label
                      ><input
                        v-model="form.ogrnip"
                        type="text"
                        placeholder="123456789012345"
                        maxlength="15"
                      />
                    </div>
                  </div>
                </div>

                <!-- Юр. лицо: реквизиты -->
                <div v-if="form.company_type === 'legal'" class="ccm-section">
                  <h3 class="ccm-section-title">Реквизиты</h3>
                  <div class="ccm-fields">
                    <div class="ccm-field">
                      <label>ИНН</label
                      ><input
                        v-model="form.inn"
                        type="text"
                        placeholder="7707083893"
                        maxlength="10"
                      />
                    </div>
                    <div class="ccm-field">
                      <label>КПП</label
                      ><input
                        v-model="form.kpp"
                        type="text"
                        placeholder="773601001"
                        maxlength="9"
                      />
                    </div>
                    <div class="ccm-field">
                      <label>ОГРН</label
                      ><input
                        v-model="form.ogrn"
                        type="text"
                        placeholder="1027700132195"
                        maxlength="13"
                      />
                    </div>
                    <div class="ccm-field ccm-field--full">
                      <label>Юридический адрес</label
                      ><input
                        v-model="form.legal_address"
                        type="text"
                        placeholder="г. Москва, ул. Примерная, д. 1"
                      />
                    </div>
                  </div>
                </div>

                <!-- Прочее -->
                <div class="ccm-section">
                  <h3 class="ccm-section-title">Прочее</h3>
                  <div class="ccm-fields">
                    <div class="ccm-field">
                      <label>МАКС ID</label
                      ><input
                        v-model="form.max_id"
                        type="text"
                        placeholder="ID"
                      />
                    </div>
                    <div class="ccm-field">
                      <label>Откуда узнал</label>
                      <select v-model="form.source">
                        <option value="">—</option>
                        <option v-for="s in sources" :key="s" :value="s">
                          {{ s }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Footer -->
                <div class="ccm-footer">
                  <button
                    type="button"
                    class="ccm-btn ccm-btn--ghost"
                    @click="$emit('close')"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    class="ccm-btn ccm-btn--primary"
                    :disabled="!canSubmit || isSubmitting"
                  >
                    <UserPlus :size="14" />
                    Создать
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ccm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
}
.ccm-modal {
  width: min(480px, 100vw);
  height: 100%;
  background: var(--sf, #fff);
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

/* Header */
.ccm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--bd, #e2e8f0);
  flex-shrink: 0;
}
.ccm-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ccm-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2563eb, #6366f1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ccm-title {
  font: 700 16px/1 var(--fn, sans-serif);
  margin: 0;
  color: var(--tx, #0f172a);
}
.ccm-btn-close {
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
.ccm-btn-close:hover {
  background: var(--sfh, #f1f5f9);
  color: var(--tx, #0f172a);
}

/* Body */
.ccm-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}
.ccm-body::-webkit-scrollbar {
  width: 4px;
}
.ccm-body::-webkit-scrollbar-thumb {
  background: var(--bds, #cbd5e1);
  border-radius: 4px;
}
.ccm-form {
  display: flex;
  flex-direction: column;
}

/* Types */
.ccm-types {
  display: flex;
  gap: 6px;
  padding: 0;
}
.ccm-type {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  border-radius: 8px;
  border: 1.5px solid var(--bd, #e2e8f0);
  background: var(--sf, #fff);
  color: var(--tx2, #64748b);
  font: 600 12px/1 var(--fn, sans-serif);
  cursor: pointer;
  transition: all 150ms;
}
.ccm-type:hover {
  border-color: var(--bds, #cbd5e1);
  background: var(--sfh, #f1f5f9);
  color: var(--tx, #0f172a);
}
.ccm-type--on {
  border-color: var(--pr, #2563eb);
  background: var(--prl, #eff6ff);
  color: var(--pr, #2563eb);
}
.ccm-type--on:hover {
  background: var(--prl, #eff6ff);
}

/* Section */
.ccm-section {
  padding: 16px 20px;
  border-bottom: 1px solid var(--bd, #e2e8f0);
}
.ccm-section:last-of-type {
  border-bottom: none;
}
.ccm-section-title {
  font: 700 12px/1 var(--fn, sans-serif);
  color: var(--tx, #0f172a);
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Fields */
.ccm-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.ccm-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ccm-field--full {
  grid-column: 1/-1;
}
.ccm-field label {
  font: 600 10px/1 var(--fn, sans-serif);
  color: var(--tx2, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 4px;
}
.ccm-field--req label::after {
  content: " *";
  color: var(--er, #dc2626);
}
.ccm-field input,
.ccm-field select {
  padding: 9px 11px;
  border: 1.5px solid var(--bd, #e2e8f0);
  border-radius: 8px;
  font: 400 13px/1.3 var(--fn, sans-serif);
  background: var(--sf, #fff);
  color: var(--tx, #0f172a);
  outline: none;
  transition: all 150ms;
}
.ccm-field input:focus,
.ccm-field select:focus {
  border-color: var(--pr, #2563eb);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}
.ccm-field input::placeholder {
  color: var(--txm, #94a3b8);
}

/* Sex toggle */
.ccm-sex-toggle {
  display: flex;
  gap: 4px;
}
.ccm-sex-btn {
  width: 42px;
  height: 36px;
  border-radius: 8px;
  border: 1.5px solid var(--bd, #e2e8f0);
  background: var(--sf, #fff);
  font: 700 13px/1 var(--fn, sans-serif);
  color: var(--tx2, #64748b);
  cursor: pointer;
  transition: all 150ms;
}
.ccm-sex-btn:hover {
  border-color: var(--bds, #cbd5e1);
  background: var(--sfh, #f1f5f9);
}
.ccm-sex-btn--on {
  border-color: var(--pr, #2563eb);
  background: var(--prl, #eff6ff);
  color: var(--pr, #2563eb);
}

/* Checkbox */
.ccm-check-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500 !important;
  font-size: 13px !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
  color: var(--tx, #0f172a) !important;
}
.ccm-check-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--pr, #2563eb);
  cursor: pointer;
  flex-shrink: 0;
}
.ccm-heart--on {
  color: #ef4444;
}

/* Footer */
.ccm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--bd, #e2e8f0);
  flex-shrink: 0;
  background: var(--sf, #fff);
  position: sticky;
  bottom: 0;
}
.ccm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 8px;
  font: 600 13px/1 var(--fn, sans-serif);
  border: none;
  cursor: pointer;
  transition: all 150ms;
}
.ccm-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.ccm-btn--ghost {
  background: none;
  color: var(--tx2, #64748b);
  border: 1.5px solid var(--bd, #e2e8f0);
}
.ccm-btn--ghost:hover:not(:disabled) {
  background: var(--sfh, #f1f5f9);
  color: var(--tx, #0f172a);
}
.ccm-btn--primary {
  background: var(--pr, #2563eb);
  color: #fff;
}
.ccm-btn--primary:hover:not(:disabled) {
  background: var(--prh, #1d4ed8);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

/* Transitions */
.ccm-fade-enter-active,
.ccm-fade-leave-active {
  transition: opacity 200ms;
}
.ccm-fade-enter-from,
.ccm-fade-leave-to {
  opacity: 0;
}
.ccm-slide-enter-active {
  transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
.ccm-slide-leave-active {
  transition: transform 200ms cubic-bezier(0.4, 0, 1, 1);
}
.ccm-slide-enter-from,
.ccm-slide-leave-to {
  transform: translateX(100%);
}

@media (max-width: 640px) {
  .ccm-modal {
    width: 100vw;
  }
  .ccm-fields {
    grid-template-columns: 1fr;
  }
  .ccm-types {
    flex-direction: column;
  }
}
</style>
