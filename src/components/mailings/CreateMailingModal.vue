<script setup lang="ts">
import { ref, computed } from "vue";
import AppIcon from "@/components/AppIcon.vue";
import { type IconName } from "@/components/icons";
import EmojiPicker from "vue3-emoji-picker";
import "vue3-emoji-picker/css";
import { mailingsApi } from "@/services/mailingsApi";
import type { Campaign } from "@/services/mailingsApi";

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
  message: "",
  scheduledAt: "",
  sendNow: false,
});

const isSubmitting = ref(false);
const editorRef    = ref<HTMLDivElement | null>(null);
const isEmpty      = ref(true);
const charCount    = ref(0);
const showEmojiPicker = ref(false);

// ── Медиа ───────────────────────────────────────────────────────────────────

const mediaFiles    = ref<File[]>([]);
const mediaPreviews = ref<string[]>([]);
const mediaInputRef = ref<HTMLInputElement | null>(null);
const isDragging    = ref(false);

const addFiles = (files: FileList | File[]) => {
  for (const file of Array.from(files)) {
    mediaFiles.value.push(file);
    mediaPreviews.value.push(file.type.startsWith("image/") ? URL.createObjectURL(file) : "");
  }
};

const onFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files) addFiles(input.files);
  input.value = "";
};

const onDrop = (e: DragEvent) => {
  isDragging.value = false;
  if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
};

const removeMedia = (i: number) => {
  const p = mediaPreviews.value[i];
  if (p) URL.revokeObjectURL(p);
  mediaFiles.value.splice(i, 1);
  mediaPreviews.value.splice(i, 1);
};

const formatBytes = (b: number) => {
  if (b < 1024) return `${b} Б`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} КБ`;
  return `${(b / (1024 * 1024)).toFixed(1)} МБ`;
};

// ── Редактор ────────────────────────────────────────────────────────────────

const onEditorInput = () => {
  const el = editorRef.value;
  if (!el) return;
  const text = el.textContent ?? "";
  isEmpty.value  = text.trim() === "";
  charCount.value = text.length;
  form.value.message = el.innerHTML;
};

/** Формат через execCommand — встроенный toggle (bold/italic/underline/strikeThrough) */
const applyFmt = (cmd: string) => {
  editorRef.value?.focus();
  document.execCommand(cmd, false);
  onEditorInput();
};

/** Перемещает курсор сразу после элемента el */
const moveCursorAfter = (el: Element) => {
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.setStartAfter(el);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
};

/**
 * Toggle-обёртка для произвольного тега (code, span.tg-spoiler).
 * Если курсор уже внутри — снимает форматирование (unwrap).
 * Иначе — оборачивает выделение и выносит курсор за элемент.
 */
const toggleInlineTag = (tagName: string, className?: string) => {
  editorRef.value?.focus();
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);

  // Ищем ближайший предок с нужным тегом (и классом)
  let ancestor: Node | null = range.commonAncestorContainer;
  let found: Element | null = null;
  while (ancestor && ancestor !== editorRef.value) {
    if (ancestor.nodeType === Node.ELEMENT_NODE) {
      const el = ancestor as Element;
      if (
        el.tagName.toLowerCase() === tagName &&
        (!className || el.classList.contains(className))
      ) {
        found = el;
        break;
      }
    }
    ancestor = ancestor.parentNode;
  }

  if (found) {
    // Unwrap: вынимаем содержимое наружу
    const parent = found.parentNode!;
    const frag = document.createDocumentFragment();
    while (found.firstChild) frag.appendChild(found.firstChild);
    parent.replaceChild(frag, found);
  } else {
    // Wrap выделения
    const text = range.toString();
    if (!text) return;
    const openTag = className ? `<${tagName} class="${className}">` : `<${tagName}>`;
    document.execCommand("insertHTML", false, `${openTag}${text}</${tagName}>`);
    // После insertHTML курсор внутри вставленного тега — поднимаемся до него и выходим
    const sel2 = window.getSelection();
    if (sel2 && sel2.rangeCount) {
      let n: Node | null = sel2.getRangeAt(0).commonAncestorContainer;
      while (n && n !== editorRef.value) {
        if (
          n.nodeType === Node.ELEMENT_NODE &&
          (n as Element).tagName.toLowerCase() === tagName &&
          (!className || (n as Element).classList.contains(className))
        ) {
          moveCursorAfter(n as Element);
          break;
        }
        n = n.parentNode;
      }
    }
  }
  onEditorInput();
};

/** Снимает всё форматирование с выделения */
const clearFormat = () => {
  editorRef.value?.focus();
  // Снимаем нативное форматирование (bold/italic/u/s)
  document.execCommand("removeFormat", false);
  // Снимаем кастомные теги (code, tg-spoiler)
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) { onEditorInput(); return; }
  const range = sel.getRangeAt(0);
  const editorEl = editorRef.value!;
  editorEl.querySelectorAll("code, .tg-spoiler").forEach((el) => {
    if (range.intersectsNode(el)) {
      const parent = el.parentNode!;
      const frag = document.createDocumentFragment();
      while (el.firstChild) frag.appendChild(el.firstChild);
      parent.replaceChild(frag, el);
    }
  });
  onEditorInput();
};

const fmtButtons: Array<{ label: string; title: string; cls?: string; action: () => void }> = [
  { label: "B",   title: "Жирный",        cls: "fw-bold",   action: () => applyFmt("bold")                          },
  { label: "I",   title: "Курсив",         cls: "fw-italic", action: () => applyFmt("italic")                        },
  { label: "U",   title: "Подчёркнутый",  cls: "fw-under",  action: () => applyFmt("underline")                     },
  { label: "S",   title: "Зачёркнутый",   cls: "fw-strike", action: () => applyFmt("strikeThrough")                 },
  { label: "< >", title: "Код",            cls: "fw-code",   action: () => toggleInlineTag("code")                   },
  { label: "||",  title: "Спойлер",        cls: "fw-spoil",  action: () => toggleInlineTag("span", "tg-spoiler")     },
];

// ── Эмодзи ──────────────────────────────────────────────────────────────────

const insertEmoji = (emoji: { i: string }) => {
  showEmojiPicker.value = false;
  editorRef.value?.focus();
  document.execCommand("insertText", false, emoji.i);
  onEditorInput();
};

// ── Конвертация HTML → Telegram Markdown ────────────────────────────────────

const htmlToTgMd = (html: string): string => {
  const div = document.createElement("div");
  div.innerHTML = html;
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    const el   = node as Element;
    const ch   = Array.from(el.childNodes).map(walk).join("");
    const tag  = el.tagName?.toLowerCase();
    switch (tag) {
      case "b": case "strong": return `*${ch}*`;
      case "i": case "em":    return `_${ch}_`;
      case "u":               return `__${ch}__`;
      case "s": case "del": case "strike": return `~${ch}~`;
      case "code":            return `\`${ch}\``;
      case "span":
        if (el.classList.contains("tg-spoiler")) return `||${ch}||`;
        return ch;
      case "br": return "\n";
      case "div": case "p": return ch + "\n";
      default: return ch;
    }
  };
  return walk(div).replace(/\n+$/, "");
};

// ── Форма ───────────────────────────────────────────────────────────────────

// ── Часовой пояс (МСК, UTC+3) ────────────────────────────────────────────────

const _mosOpts: Intl.DateTimeFormatOptions = {
  timeZone: "Europe/Moscow",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hour12: false,
};
const getMoscowNow    = (): string => new Intl.DateTimeFormat("sv-SE", _mosOpts).format(new Date()).replace(" ", "T");
const moscowLocalToUtc = (local: string): string => new Date(local + ":00+03:00").toISOString();

// ─────────────────────────────────────────────────────────────────────────────

const typeOptions: Array<{ value: "telegram" | "max"; label: string; icon: IconName }> = [
  { value: "telegram", label: "Telegram", icon: "send"           },
  { value: "max",      label: "МАКС",     icon: "message-circle" },
];

const submitStep  = ref("");
const submitError = ref("");

const canSubmit = computed(() =>
  !!form.value.name.trim() && !isEmpty.value
);

const getMediaType = (file: File): "photo" | "video" | "document" | "audio" => {
  if (file.type.startsWith("image/")) return "photo";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "document";
};

const resetForm = () => {
  form.value = { name: "", type: "telegram", message: "", scheduledAt: "", sendNow: false };
  isEmpty.value    = true;
  charCount.value  = 0;
  submitStep.value = "";
  submitError.value = "";
  if (editorRef.value) editorRef.value.innerHTML = "";
  showEmojiPicker.value = false;
  mediaPreviews.value.forEach((p) => { if (p) URL.revokeObjectURL(p); });
  mediaFiles.value    = [];
  mediaPreviews.value = [];
};

const handleOverlay = (e: MouseEvent) => {
  if ((e.target as HTMLElement).classList.contains("cm-overlay")) closeModal();
};

const closeModal = () => {
  if (isSubmitting.value) return;
  emit("close");
  resetForm();
};

const handleSubmit = async () => {
  if (!canSubmit.value || isSubmitting.value) return;
  if (!form.value.sendNow && form.value.scheduledAt) {
    if (new Date(form.value.scheduledAt + ":00+03:00").getTime() <= Date.now()) {
      submitError.value = "Нельзя запланировать на прошедшее время (МСК)";
      return;
    }
  }
  isSubmitting.value = true;
  submitError.value  = "";

  try {
    // 1. Загрузка медиа (только первый файл — Telegram принимает 1 медиа на сообщение)
    let mediaUrl: string | undefined;
    let mediaType: "photo" | "video" | "document" | "audio" | undefined;

    const firstFile = mediaFiles.value[0];
    if (firstFile) {
      submitStep.value = "Загрузка медиа...";
      const mt = getMediaType(firstFile);
      const uploaded = await mailingsApi.uploadMedia(firstFile, mt);
      mediaUrl  = uploaded.media_url;
      mediaType = mt;
    }

    // 2. Создание шаблона
    submitStep.value = "Создание шаблона...";
    const template = await mailingsApi.createTemplate({
      name:      form.value.name,
      content:   htmlToTgMd(form.value.message),
      category:  "marketing",
      bot_type:  form.value.type,
      language:  "ru",
      is_active: true,
      ...(mediaUrl ? { media_url: mediaUrl, media_type: mediaType } : {}),
    });

    // 3. Создание кампании
    submitStep.value = "Создание кампании...";
    const scheduledUtc = form.value.scheduledAt ? moscowLocalToUtc(form.value.scheduledAt) : null;
    const campaign = await mailingsApi.createCampaign({
      name:           form.value.name,
      template_id:    template.id,
      bot_type:       form.value.type,
      segment_filter: { has_telegram: form.value.type === "telegram" },
      scheduled_at:   scheduledUtc,
    });

    // 4. Запуск / планирование
    if (form.value.sendNow) {
      submitStep.value = "Запуск рассылки...";
      await mailingsApi.scheduleCampaign(campaign.id, { send_immediately: true });
    } else if (form.value.scheduledAt) {
      submitStep.value = "Планирование рассылки...";
      await mailingsApi.scheduleCampaign(campaign.id, { scheduled_at: scheduledUtc! });
    }

    const result: Campaign = { ...campaign, template };
    emit("create", result);
    resetForm();
  } catch (err) {
    submitError.value = (err as Error).message || "Ошибка при создании рассылки";
  } finally {
    isSubmitting.value = false;
    submitStep.value   = "";
  }
};
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

                <!-- Основное -->
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
                  </div>
                </div>

                <!-- Текст сообщения -->
                <div class="cm-section">
                  <div class="cm-section-row">
                    <h3 class="cm-section-title">
                      Текст сообщения
                      <span v-if="charCount > 0" class="cm-count">{{ charCount }} симв.</span>
                    </h3>
                    <!-- Emoji -->
                    <div class="relative">
                      <button
                        type="button"
                        class="cm-emoji-btn"
                        title="Эмодзи"
                        @mousedown.prevent
                        @click.stop="showEmojiPicker = !showEmojiPicker"
                      >😊</button>
                      <template v-if="showEmojiPicker">
                        <div class="fixed inset-0 z-40" @click="showEmojiPicker = false" />
                        <div class="absolute top-full right-0 mt-1 z-50" @click.stop>
                          <EmojiPicker native @select="insertEmoji" />
                        </div>
                      </template>
                    </div>
                  </div>

                  <!-- Панель форматирования -->
                  <div class="cm-fmt-bar">
                    <button
                      v-for="b in fmtButtons"
                      :key="b.label"
                      type="button"
                      :title="b.title"
                      class="cm-fmt-btn"
                      :class="b.cls"
                      @mousedown.prevent
                      @click="b.action()"
                    >{{ b.label }}</button>
                    <div class="cm-fmt-sep" />
                    <button
                      type="button"
                      title="Очистить форматирование"
                      class="cm-fmt-btn cm-fmt-btn--clear"
                      @mousedown.prevent
                      @click="clearFormat"
                    >
                      <AppIcon name="x" :size="11" />
                      <span>Сброс</span>
                    </button>
                    <div class="cm-fmt-sep" />
                    <span class="cm-fmt-hint">Выделите текст → стиль</span>
                  </div>

                  <!-- WYSIWYG редактор -->
                  <div
                    ref="editorRef"
                    contenteditable="true"
                    class="cm-editor"
                    :class="{ 'cm-editor--empty': isEmpty }"
                    data-placeholder="Введите текст рассылки..."
                    @input="onEditorInput"
                  />
                  <p class="cm-hint">Enter — новый абзац</p>
                </div>

                <!-- Медиа -->
                <div class="cm-section">
                  <h3 class="cm-section-title">
                    Медиа
                    <span v-if="mediaFiles.length" class="cm-count">{{ mediaFiles.length }}</span>
                  </h3>

                  <!-- Скрытый input -->
                  <input
                    ref="mediaInputRef"
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                    style="display:none"
                    @change="onFileSelect"
                  />

                  <!-- Drop zone -->
                  <div
                    class="cm-dropzone"
                    :class="{ 'cm-dropzone--drag': isDragging }"
                    @click="mediaInputRef?.click()"
                    @dragover.prevent="isDragging = true"
                    @dragleave.prevent="isDragging = false"
                    @drop.prevent="onDrop"
                  >
                    <AppIcon name="paperclip" :size="18" />
                    <span>Перетащите или <u>выберите файлы</u></span>
                    <span class="cm-dropzone-sub">Фото, видео, PDF, документы</span>
                  </div>

                  <!-- Список прикреплённых файлов -->
                  <div v-if="mediaFiles.length" class="cm-media-list">
                    <div
                      v-for="(f, i) in mediaFiles"
                      :key="i"
                      class="cm-media-item"
                    >
                      <!-- Превью изображения -->
                      <img
                        v-if="mediaPreviews[i]"
                        :src="mediaPreviews[i]"
                        class="cm-media-thumb"
                        :alt="f.name"
                      />
                      <!-- Иконка для не-изображений -->
                      <div v-else class="cm-media-icon">
                        <AppIcon
                          :name="f.type.startsWith('video/') ? 'play-circle' : 'file-text'"
                          :size="16"
                        />
                      </div>

                      <div class="cm-media-info">
                        <span class="cm-media-name">{{ f.name }}</span>
                        <span class="cm-media-size">{{ formatBytes(f.size) }}</span>
                      </div>

                      <button
                        type="button"
                        class="cm-media-rm"
                        title="Удалить"
                        @click="removeMedia(i)"
                      >
                        <AppIcon name="x" :size="12" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Настройки -->
                <div class="cm-section">
                  <h3 class="cm-section-title">Настройки</h3>
                  <div class="cm-fields">
                    <div class="cm-field cm-field--full">
                      <label class="cm-check-label">
                        <input type="checkbox" v-model="form.sendNow" />
                        <span>Отправить сейчас</span>
                      </label>
                    </div>

                    <div v-if="!form.sendNow" class="cm-field cm-field--full">
                      <label>Запланировать отправку <span class="cm-optional">необязательно</span></label>
                      <input v-model="form.scheduledAt" type="datetime-local" :min="getMoscowNow()" />
                      <span class="cm-hint">Оставьте пустым — будет сохранено как черновик</span>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            <!-- Прогресс отправки -->
            <Transition name="cm-fade">
              <div v-if="isSubmitting" class="cm-progress-overlay">
                <AppIcon name="refresh-cw" :size="22" class="cm-spin text-blue-500" />
                <span>{{ submitStep || "Обработка..." }}</span>
              </div>
            </Transition>

            <!-- Footer -->
            <div class="cm-footer">
              <!-- Ошибка -->
              <div v-if="submitError" class="cm-submit-error">
                <AppIcon name="alert-circle" :size="13" />
                {{ submitError }}
              </div>
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
  position: relative;
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
.cm-header-left { display: flex; align-items: center; gap: 12px; }
.cm-avatar {
  width: 38px; height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2563eb, #6366f1);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.cm-title { font: 700 16px/1 var(--fn, sans-serif); margin: 0; color: #0f172a; }
.cm-btn-close {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border: none; border-radius: 6px; background: none;
  cursor: pointer; transition: all 150ms; color: #94a3b8;
}
.cm-btn-close:hover { background: #f1f5f9; color: #0f172a; }

/* ── Body ────────────────────────────────────────────── */
.cm-body { flex: 1; overflow-y: auto; overflow-x: hidden; }
.cm-body::-webkit-scrollbar { width: 4px; }
.cm-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.cm-form { display: flex; flex-direction: column; }

/* ── Section ─────────────────────────────────────────── */
.cm-section { padding: 20px; border-bottom: 1px solid #e2e8f0; }
.cm-section:last-of-type { border-bottom: none; }
.cm-section-row {
  display: flex; align-items: center; justify-content: space-between;
  margin: 0 0 10px;
}
.cm-section-title {
  font: 700 11px/1 var(--fn, sans-serif);
  color: #0f172a; margin: 0 0 14px;
  text-transform: uppercase; letter-spacing: 0.05em;
  display: flex; align-items: center; gap: 6px;
}
.cm-section-row .cm-section-title { margin-bottom: 0; }
.cm-count {
  font: 500 11px/1 var(--fn, sans-serif);
  text-transform: none; letter-spacing: 0;
  color: #2563eb; background: #eff6ff;
  padding: 2px 7px; border-radius: 20px;
}
.cm-hint { margin: 6px 0 0; font: 400 11px/1.4 var(--fn, sans-serif); color: #94a3b8; }
.cm-optional { font-weight: 400; text-transform: none; letter-spacing: 0; color: #94a3b8; font-size: 10px; }
.cm-emoji-btn {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border: none; border-radius: 6px; background: none;
  cursor: pointer; font-size: 17px; line-height: 1; transition: background 150ms;
}
.cm-emoji-btn:hover { background: #f1f5f9; }

/* ── Formatting bar ──────────────────────────────────── */
.cm-fmt-bar {
  display: flex; align-items: center; gap: 1px;
  padding: 5px 8px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
}
.cm-fmt-btn {
  display: flex; align-items: center; justify-content: center;
  min-width: 30px; height: 26px; padding: 0 6px;
  border: none; border-radius: 5px; background: none;
  cursor: pointer; color: #475569;
  font: 600 12px/1 'Courier New', monospace;
  transition: background 120ms, color 120ms;
  user-select: none;
}
.cm-fmt-btn:hover { background: #e2e8f0; color: #0f172a; }
.cm-fmt-btn.fw-bold   { font-weight: 900; font-family: var(--fn, sans-serif); }
.cm-fmt-btn.fw-italic { font-style: italic; font-family: var(--fn, sans-serif); }
.cm-fmt-btn.fw-under  { text-decoration: underline; font-family: var(--fn, sans-serif); }
.cm-fmt-btn.fw-strike { text-decoration: line-through; font-family: var(--fn, sans-serif); }
.cm-fmt-btn.fw-code   { font-family: 'Courier New', monospace; font-size: 11px; color: #2563eb; }
.cm-fmt-btn.fw-spoil  { letter-spacing: -0.5px; color: #7c3aed; }
.cm-fmt-btn--clear {
  display: flex; align-items: center; gap: 3px;
  font: 500 11px/1 var(--fn, sans-serif);
  color: #94a3b8;
  padding: 0 7px;
}
.cm-fmt-btn--clear:hover { background: #fee2e2; color: #dc2626; }
.cm-fmt-sep { width: 1px; height: 16px; background: #e2e8f0; margin: 0 5px; }
.cm-fmt-hint { margin-left: auto; font: 400 10px/1 var(--fn, sans-serif); color: #94a3b8; white-space: nowrap; }

/* ── WYSIWYG Editor ──────────────────────────────────── */
.cm-editor {
  position: relative;
  min-height: 120px;
  padding: 10px 12px;
  border: 1.5px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 8px 8px;
  font: 400 13px/1.7 var(--fn, sans-serif);
  background: #fff;
  color: #0f172a;
  outline: none;
  box-sizing: border-box;
  word-break: break-word;
  cursor: text;
  transition: border-color 150ms, box-shadow 150ms;
}
.cm-editor:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}
.cm-editor--empty::before {
  content: attr(data-placeholder);
  color: #94a3b8;
  pointer-events: none;
  position: absolute;
  top: 10px; left: 12px;
}

/* Стили форматирования внутри редактора */
.cm-editor :deep(b),
.cm-editor :deep(strong) { font-weight: 700; }
.cm-editor :deep(i),
.cm-editor :deep(em) { font-style: italic; }
.cm-editor :deep(u) { text-decoration: underline; }
.cm-editor :deep(s),
.cm-editor :deep(strike),
.cm-editor :deep(del) { text-decoration: line-through; }
.cm-editor :deep(code) {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background: #f1f5f9;
  color: #1e40af;
  padding: 1px 5px;
  border-radius: 4px;
}
.cm-editor :deep(.tg-spoiler) {
  background: #1e293b;
  color: #f8fafc;
  border-radius: 4px;
  padding: 0 3px;
  user-select: text;
}

/* ── Fields ──────────────────────────────────────────── */
.cm-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.cm-field { display: flex; flex-direction: column; gap: 5px; }
.cm-field--full { grid-column: 1 / -1; }
.cm-field label {
  font: 600 10px/1 var(--fn, sans-serif);
  color: #64748b; text-transform: uppercase; letter-spacing: 0.04em;
  display: flex; align-items: center; gap: 5px;
}
.cm-field--req label::after { content: " *"; color: #dc2626; }
.cm-field input,
.cm-field select {
  padding: 9px 11px;
  border: 1.5px solid #e2e8f0; border-radius: 8px;
  font: 400 13px/1.3 var(--fn, sans-serif);
  background: #fff; color: #0f172a;
  outline: none; transition: border-color 150ms, box-shadow 150ms;
}
.cm-field input:focus,
.cm-field select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
.cm-field input::placeholder { color: #94a3b8; }

.cm-check-label {
  display: flex !important; align-items: center; gap: 8px;
  cursor: pointer;
  font: 500 13px/1 var(--fn, sans-serif) !important;
  text-transform: none !important; letter-spacing: 0 !important;
  color: #0f172a !important; padding: 4px 0;
}
.cm-check-label input[type="checkbox"] {
  width: 16px; height: 16px; accent-color: #2563eb;
  cursor: pointer; flex-shrink: 0;
}

/* ── Type selector ───────────────────────────────────── */
.cm-types { display: flex; gap: 6px; }
.cm-type {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px 8px; border-radius: 8px;
  border: 1.5px solid #e2e8f0; background: #fff; color: #64748b;
  font: 600 12px/1 var(--fn, sans-serif); cursor: pointer; transition: all 150ms;
}
.cm-type:hover { border-color: #cbd5e1; background: #f8fafc; color: #0f172a; }
.cm-type--on { border-color: #2563eb; background: #eff6ff; color: #2563eb; }
.cm-type--on:hover { background: #eff6ff; }

/* ── Media ───────────────────────────────────────────── */
.cm-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 18px 16px;
  border: 1.5px dashed #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  cursor: pointer;
  transition: border-color 150ms, background 150ms, color 150ms;
  color: #94a3b8;
  text-align: center;
  font: 400 13px/1.4 var(--fn, sans-serif);
  user-select: none;
}
.cm-dropzone:hover,
.cm-dropzone--drag {
  border-color: #2563eb;
  background: #eff6ff;
  color: #2563eb;
}
.cm-dropzone-sub {
  font: 400 11px/1 var(--fn, sans-serif);
  color: #94a3b8;
  margin-top: 2px;
}
.cm-dropzone--drag .cm-dropzone-sub { color: #93c5fd; }

/* Сетка превью */
.cm-media-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 8px;
  margin-top: 12px;
}
.cm-media-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.cm-media-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.cm-media-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #64748b;
  padding: 8px 4px;
  width: 100%;
  height: 100%;
}
.cm-media-name {
  font: 400 9px/1.2 var(--fn, sans-serif);
  color: #64748b;
  text-align: center;
  word-break: break-all;
  max-width: 100%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  padding: 0 4px;
}
.cm-media-size { display: none; }
/* Кнопка удаления — появляется при наведении */
.cm-media-rm {
  position: absolute;
  top: 3px; right: 3px;
  width: 18px; height: 18px;
  display: flex; align-items: center; justify-content: center;
  border: none; border-radius: 4px;
  background: rgba(15,23,42,0.55);
  color: #fff;
  cursor: pointer;
  opacity: 0;
  transition: opacity 150ms;
  padding: 0;
}
.cm-media-item:hover .cm-media-rm { opacity: 1; }
.cm-media-rm:hover { background: #dc2626; }

/* ── Progress overlay ───────────────────────────────── */
.cm-progress-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font: 500 13px/1 var(--fn, sans-serif);
  color: #334155;
  pointer-events: all;
}

.cm-submit-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font: 400 12px/1.4 var(--fn, sans-serif);
  color: #dc2626;
  flex: 1;
}

/* ── Footer ──────────────────────────────────────────── */
.cm-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0; flex-shrink: 0;
  background: #fff; position: sticky; bottom: 0;
}
.cm-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 18px; border-radius: 8px;
  font: 600 13px/1 var(--fn, sans-serif);
  border: none; cursor: pointer; transition: all 150ms;
}
.cm-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.cm-btn--ghost { background: none; color: #64748b; border: 1.5px solid #e2e8f0; }
.cm-btn--ghost:hover:not(:disabled) { background: #f1f5f9; color: #0f172a; }
.cm-btn--primary { background: #2563eb; color: #fff; }
.cm-btn--primary:hover:not(:disabled) { background: #1d4ed8; box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
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
  .cm-types  { flex-direction: column; }
  .cm-fmt-hint { display: none; }
}
</style>
