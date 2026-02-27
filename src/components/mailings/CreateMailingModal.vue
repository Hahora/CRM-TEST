<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import AppIcon from "@/components/AppIcon.vue";
import { type IconName } from "@/components/icons";

interface Props {
  isOpen: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  close: [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: [mailingData: any];
}>();

const form = ref({
  name: "",
  type: "telegram" as "telegram" | "max",
  subject: "",
  message: "",
  targetAudience: [] as string[],
  branch: "Главный офис",
  scheduledAt: "",
  sendNow: false,
});

const isSubmitting = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const audienceOptions = [
  { value: "all",                   label: "Все клиенты"             },
  { value: "active",                label: "Активные клиенты"        },
  { value: "vip",                   label: "VIP клиенты"             },
  { value: "new",                   label: "Новые клиенты"           },
  { value: "inactive",              label: "Неактивные"              },
  { value: "newsletter_subscribers",label: "Подписчики рассылки"     },
  { value: "recent_clients",        label: "Недавние клиенты"        },
  { value: "scheduled_visits",      label: "Запланированные визиты"  },
];

const branches = ["Главный офис", "Филиал №1", "Филиал №2", "Филиал №3"];

const typeOptions: Array<{ value: "telegram" | "max"; label: string; icon: IconName }> = [
  { value: "telegram", label: "Telegram", icon: "send"           },
  { value: "max",      label: "МАКС",     icon: "message-circle" },
];

const estimatedRecipients = computed(() => {
  if (!form.value.targetAudience.length) return 0;
  const baseCount = 1000;
  let multiplier = 0.4;
  if (form.value.targetAudience.includes("all"))      multiplier = 1;
  else if (form.value.targetAudience.includes("vip")) multiplier = 0.1;
  else if (form.value.targetAudience.includes("active")) multiplier = 0.6;
  else if (form.value.targetAudience.includes("new")) multiplier = 0.2;
  else if (form.value.targetAudience.includes("inactive")) multiplier = 0.3;
  return Math.round(baseCount * multiplier * form.value.targetAudience.length);
});

const canSubmit = computed(() =>
  !!form.value.name.trim() && !!form.value.message.trim() && form.value.targetAudience.length > 0
);

const resetForm = () => {
  form.value = {
    name: "",
    type: "telegram",
    subject: "",
    message: "",
    targetAudience: [],
    branch: "Главный офис",
    scheduledAt: "",
    sendNow: false,
  };
  if (textareaRef.value) textareaRef.value.style.height = "auto";
};

const handleOverlay = (e: MouseEvent) => {
  if ((e.target as HTMLElement).classList.contains("cm-overlay")) closeModal();
};

const closeModal = () => {
  emit("close");
  resetForm();
};

const handleSubmit = async () => {
  if (!canSubmit.value || isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const mailingData = {
      ...form.value,
      status: form.value.sendNow
        ? "sending"
        : form.value.scheduledAt
        ? "scheduled"
        : "draft",
      createdBy: "Текущий пользователь",
    };
    emit("create", mailingData);
    resetForm();
  } finally {
    isSubmitting.value = false;
  }
};

const toggleAudience = (value: string) => {
  const index = form.value.targetAudience.indexOf(value);
  if (index > -1) form.value.targetAudience.splice(index, 1);
  else form.value.targetAudience.push(value);
};

const autoResize = () => {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
};

watch(() => form.value.message, () => nextTick(autoResize));
</script>

<template>
  <Teleport to="body">
    <Transition name="cm-fade">
      <div v-if="isOpen" class="cm-overlay" @click="handleOverlay">
        <Transition name="cm-slide">
          <div v-if="isOpen" class="cm-panel">
            <!-- Header -->
            <div class="cm-header">
              <div class="cm-header-left">
                <div class="cm-avatar">
                  <AppIcon name="send" :size="17" />
                </div>
                <h2 class="cm-title">Создать рассылку</h2>
              </div>
              <button class="cm-btn-close" @click="closeModal">
                <AppIcon name="x" :size="18" />
              </button>
            </div>

            <!-- Body -->
            <div class="cm-body">
              <form @submit.prevent="handleSubmit" class="cm-form">

                <!-- Название -->
                <div class="cm-section">
                  <h3 class="cm-section-title">Основное</h3>
                  <div class="cm-fields">
                    <div class="cm-field cm-field--full cm-field--req">
                      <label>Название</label>
                      <input
                        v-model="form.name"
                        type="text"
                        placeholder="Например: Акция июля"
                        autocomplete="off"
                      />
                    </div>

                    <!-- Тип -->
                    <div class="cm-field cm-field--full">
                      <label>Канал отправки</label>
                      <div class="cm-types">
                        <button
                          v-for="t in typeOptions"
                          :key="t.value"
                          type="button"
                          class="cm-type"
                          :class="{ 'cm-type--on': form.type === t.value }"
                          @click="form.type = t.value"
                        >
                          <AppIcon :name="t.icon" :size="14" />
                          {{ t.label }}
                        </button>
                      </div>
                    </div>

                    <!-- Заголовок -->
                    <div class="cm-field cm-field--full">
                      <label>Заголовок <span class="cm-optional">необязательно</span></label>
                      <input
                        v-model="form.subject"
                        type="text"
                        placeholder="Заголовок сообщения"
                        autocomplete="off"
                      />
                    </div>
                  </div>
                </div>

                <!-- Текст сообщения -->
                <div class="cm-section">
                  <h3 class="cm-section-title">
                    Текст сообщения
                    <span v-if="form.message" class="cm-count">{{ form.message.length }} симв.</span>
                  </h3>
                  <textarea
                    ref="textareaRef"
                    v-model="form.message"
                    class="cm-textarea"
                    placeholder="Введите текст рассылки. Нажмите Enter для нового абзаца."
                    @input="autoResize"
                  />
                  <p class="cm-hint">Enter — новый абзац</p>
                </div>

                <!-- Аудитория -->
                <div class="cm-section">
                  <h3 class="cm-section-title">
                    Аудитория
                    <span v-if="form.targetAudience.length" class="cm-count">
                      ≈{{ estimatedRecipients }} получателей
                    </span>
                  </h3>
                  <div class="cm-audience">
                    <button
                      v-for="opt in audienceOptions"
                      :key="opt.value"
                      type="button"
                      class="cm-audience-btn"
                      :class="{ 'cm-audience-btn--on': form.targetAudience.includes(opt.value) }"
                      @click="toggleAudience(opt.value)"
                    >
                      <span class="cm-audience-check">
                        <AppIcon
                          v-if="form.targetAudience.includes(opt.value)"
                          name="check"
                          :size="10"
                        />
                      </span>
                      {{ opt.label }}
                    </button>
                  </div>
                </div>

                <!-- Филиал + Отправка -->
                <div class="cm-section">
                  <h3 class="cm-section-title">Настройки</h3>
                  <div class="cm-fields">
                    <div class="cm-field cm-field--full">
                      <label>Филиал</label>
                      <select v-model="form.branch">
                        <option v-for="b in branches" :key="b" :value="b">{{ b }}</option>
                      </select>
                    </div>

                    <div class="cm-field cm-field--full">
                      <label class="cm-check-label">
                        <input type="checkbox" v-model="form.sendNow" />
                        <span>Отправить сейчас</span>
                      </label>
                    </div>

                    <div v-if="!form.sendNow" class="cm-field cm-field--full">
                      <label>Запланировать отправку <span class="cm-optional">необязательно</span></label>
                      <input v-model="form.scheduledAt" type="datetime-local" />
                      <span class="cm-hint">Оставьте пустым — будет сохранено как черновик</span>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            <!-- Footer -->
            <div class="cm-footer">
              <button type="button" class="cm-btn cm-btn--ghost" @click="closeModal">
                Отмена
              </button>
              <button
                type="button"
                class="cm-btn cm-btn--primary"
                :disabled="!canSubmit || isSubmitting"
                @click="handleSubmit"
              >
                <AppIcon v-if="isSubmitting" name="refresh-cw" :size="13" class="cm-spin" />
                {{ isSubmitting ? "Создание..." : form.sendNow ? "Отправить" : "Создать рассылку" }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Overlay ─────────────────────────────────────────── */
.cm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
}

/* ── Panel ───────────────────────────────────────────── */
.cm-panel {
  width: min(480px, 100vw);
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

/* ── Header ──────────────────────────────────────────── */
.cm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.cm-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.cm-avatar {
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
.cm-title {
  font: 700 16px/1 var(--fn, sans-serif);
  margin: 0;
  color: #0f172a;
}
.cm-btn-close {
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
  color: #94a3b8;
}
.cm-btn-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

/* ── Body ────────────────────────────────────────────── */
.cm-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}
.cm-body::-webkit-scrollbar { width: 4px; }
.cm-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.cm-form { display: flex; flex-direction: column; }

/* ── Section ─────────────────────────────────────────── */
.cm-section {
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}
.cm-section:last-of-type { border-bottom: none; }
.cm-section-title {
  font: 700 11px/1 var(--fn, sans-serif);
  color: #0f172a;
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 6px;
}
.cm-count {
  font: 500 11px/1 var(--fn, sans-serif);
  text-transform: none;
  letter-spacing: 0;
  color: #2563eb;
  background: #eff6ff;
  padding: 2px 7px;
  border-radius: 20px;
}
.cm-hint {
  margin: 5px 0 0;
  font: 400 11px/1.4 var(--fn, sans-serif);
  color: #94a3b8;
}
.cm-optional {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: #94a3b8;
  font-size: 10px;
}

/* ── Fields ──────────────────────────────────────────── */
.cm-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.cm-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cm-field--full { grid-column: 1 / -1; }
.cm-field label {
  font: 600 10px/1 var(--fn, sans-serif);
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 5px;
}
.cm-field--req label::after { content: " *"; color: #dc2626; }
.cm-field input,
.cm-field select {
  padding: 9px 11px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font: 400 13px/1.3 var(--fn, sans-serif);
  background: #fff;
  color: #0f172a;
  outline: none;
  transition: border-color 150ms, box-shadow 150ms;
}
.cm-field input:focus,
.cm-field select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}
.cm-field input::placeholder { color: #94a3b8; }

/* Checkbox label */
.cm-check-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font: 500 13px/1 var(--fn, sans-serif) !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
  color: #0f172a !important;
  padding: 4px 0;
}
.cm-check-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #2563eb;
  cursor: pointer;
  flex-shrink: 0;
}

/* ── Type selector ───────────────────────────────────── */
.cm-types {
  display: flex;
  gap: 6px;
}
.cm-type {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  border-radius: 8px;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  font: 600 12px/1 var(--fn, sans-serif);
  cursor: pointer;
  transition: all 150ms;
}
.cm-type:hover { border-color: #cbd5e1; background: #f8fafc; color: #0f172a; }
.cm-type--on { border-color: #2563eb; background: #eff6ff; color: #2563eb; }
.cm-type--on:hover { background: #eff6ff; }

/* ── Textarea ─────────────────────────────────────────── */
.cm-textarea {
  width: 100%;
  min-height: 96px;
  padding: 10px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font: 400 13px/1.6 var(--fn, sans-serif);
  background: #fff;
  color: #0f172a;
  outline: none;
  resize: none;
  overflow: hidden;
  box-sizing: border-box;
  transition: border-color 150ms, box-shadow 150ms;
}
.cm-textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}
.cm-textarea::placeholder { color: #94a3b8; }

/* ── Audience ─────────────────────────────────────────── */
.cm-audience {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.cm-audience-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 10px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #475569;
  font: 500 12px/1.2 var(--fn, sans-serif);
  cursor: pointer;
  transition: all 150ms;
  text-align: left;
}
.cm-audience-btn:hover { border-color: #cbd5e1; background: #f8fafc; color: #0f172a; }
.cm-audience-btn--on { border-color: #2563eb; background: #eff6ff; color: #1d4ed8; }
.cm-audience-btn--on:hover { background: #dbeafe; }
.cm-audience-check {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1.5px solid currentColor;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 150ms;
}
.cm-audience-btn--on .cm-audience-check {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

/* ── Footer ──────────────────────────────────────────── */
.cm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
  background: #fff;
  position: sticky;
  bottom: 0;
}
.cm-btn {
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
.cm-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.cm-btn--ghost {
  background: none;
  color: #64748b;
  border: 1.5px solid #e2e8f0;
}
.cm-btn--ghost:hover:not(:disabled) { background: #f1f5f9; color: #0f172a; }
.cm-btn--primary { background: #2563eb; color: #fff; }
.cm-btn--primary:hover:not(:disabled) {
  background: #1d4ed8;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}
.cm-spin { animation: cm-spin 0.7s linear infinite; }
@keyframes cm-spin { to { transform: rotate(360deg); } }

/* ── Transitions ─────────────────────────────────────── */
.cm-fade-enter-active, .cm-fade-leave-active { transition: opacity 200ms; }
.cm-fade-enter-from,  .cm-fade-leave-to      { opacity: 0; }
.cm-slide-enter-active { transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1); }
.cm-slide-leave-active { transition: transform 200ms cubic-bezier(0.4, 0, 1, 1); }
.cm-slide-enter-from,
.cm-slide-leave-to     { transform: translateX(100%); }

/* ── Mobile ──────────────────────────────────────────── */
@media (max-width: 640px) {
  .cm-panel  { width: 100vw; }
  .cm-fields { grid-template-columns: 1fr; }
  .cm-audience { grid-template-columns: 1fr; }
  .cm-types  { flex-direction: column; }
}
</style>
