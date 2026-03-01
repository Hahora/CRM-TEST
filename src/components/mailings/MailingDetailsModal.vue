<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import AppIcon from "@/components/AppIcon.vue";
import EmojiPicker from "vue3-emoji-picker";
import "vue3-emoji-picker/css";
import type { Mailing } from "@/components/mailings/MailingsTable.vue";
import { mailingsApi } from "@/services/mailingsApi";
import type { CampaignStats } from "@/services/mailingsApi";

interface Props {
  isOpen: boolean;
  mailing: Mailing | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  sent: [id: string];
  updated: [mailing: Mailing];
}>();

// ── Режим ────────────────────────────────────────────────────────────────────

const isEditing = ref(false);

watch(() => props.isOpen, (open) => { if (!open) isEditing.value = false; });

// ── Статистика ───────────────────────────────────────────────────────────────

const stats = ref<CampaignStats | null>(null);
const statsLoad = ref(false);

watch(
  () => [props.isOpen, props.mailing?.campaignId] as const,
  async ([open, id]) => {
    if (!open || !id) { stats.value = null; return; }
    statsLoad.value = true;
    try { stats.value = await mailingsApi.getCampaignStats(id); }
    catch { stats.value = null; }
    finally { statsLoad.value = false; }
  },
  { immediate: true }
);

// ── Отправка ─────────────────────────────────────────────────────────────────

const isSending = ref(false);
const sendError = ref("");

const sendNow = async () => {
  if (!props.mailing || isSending.value) return;
  isSending.value = true; sendError.value = "";
  try {
    await mailingsApi.scheduleCampaign(props.mailing.campaignId, {
      campaign_id: props.mailing.campaignId, send_immediately: true,
    });
    emit("sent", props.mailing.id); emit("close");
  } catch (err) {
    sendError.value = (err as Error).message || "Ошибка при отправке";
  } finally { isSending.value = false; }
};

// ── Редактирование ───────────────────────────────────────────────────────────

const editorRef       = ref<HTMLDivElement | null>(null);
const mediaInputRef   = ref<HTMLInputElement | null>(null);
const showEmojiPicker = ref(false);
const isDragging      = ref(false);

const editForm = ref({ name: "", type: "telegram" as "telegram" | "max", message: "", scheduledAt: "", sendNow: false });
const isEmpty   = ref(true);
const charCount = ref(0);
const mediaFiles    = ref<File[]>([]);
const mediaPreviews = ref<string[]>([]);
const isSubmitting  = ref(false);
const submitStep    = ref("");
const submitError   = ref("");

const canSave = computed(() => !!editForm.value.name.trim() && !isEmpty.value);

const startEditing = () => {
  if (!props.mailing) return;
  editForm.value = {
    name: props.mailing.name, type: props.mailing.type,
    message: props.mailing.message, scheduledAt: props.mailing.scheduledAt ?? "", sendNow: false,
  };
  isEmpty.value = !props.mailing.message.trim();
  charCount.value = props.mailing.message.length;
  isEditing.value = true;
  setTimeout(() => { if (editorRef.value) editorRef.value.innerHTML = props.mailing!.message; }, 50);
};

const cancelEditing = () => {
  isEditing.value = false; submitError.value = "";
  mediaFiles.value = [];
  mediaPreviews.value.forEach(p => { if (p) URL.revokeObjectURL(p); });
  mediaPreviews.value = []; showEmojiPicker.value = false;
};

// ── Форматирование ───────────────────────────────────────────────────────────

const onEditorInput = () => {
  const el = editorRef.value; if (!el) return;
  const text = el.textContent ?? "";
  isEmpty.value = text.trim() === ""; charCount.value = text.length;
  editForm.value.message = el.innerHTML;
};
const applyFmt = (cmd: string) => { editorRef.value?.focus(); document.execCommand(cmd, false); onEditorInput(); };
const moveCursorAfter = (el: Element) => {
  const sel = window.getSelection(); if (!sel) return;
  const r = document.createRange(); r.setStartAfter(el); r.collapse(true);
  sel.removeAllRanges(); sel.addRange(r);
};
const toggleInlineTag = (tagName: string, className?: string) => {
  editorRef.value?.focus();
  const sel = window.getSelection(); if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  let ancestor: Node | null = range.commonAncestorContainer;
  let found: Element | null = null;
  while (ancestor && ancestor !== editorRef.value) {
    if (ancestor.nodeType === Node.ELEMENT_NODE) {
      const el = ancestor as Element;
      if (el.tagName.toLowerCase() === tagName && (!className || el.classList.contains(className))) { found = el; break; }
    }
    ancestor = ancestor.parentNode;
  }
  if (found) {
    const parent = found.parentNode!; const frag = document.createDocumentFragment();
    while (found.firstChild) frag.appendChild(found.firstChild);
    parent.replaceChild(frag, found);
  } else {
    const text = range.toString(); if (!text) return;
    const openTag = className ? `<${tagName} class="${className}">` : `<${tagName}>`;
    document.execCommand("insertHTML", false, `${openTag}${text}</${tagName}>`);
    const sel2 = window.getSelection();
    if (sel2 && sel2.rangeCount) {
      let n: Node | null = sel2.getRangeAt(0).commonAncestorContainer;
      while (n && n !== editorRef.value) {
        if (n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName.toLowerCase() === tagName && (!className || (n as Element).classList.contains(className))) { moveCursorAfter(n as Element); break; }
        n = n.parentNode;
      }
    }
  }
  onEditorInput();
};
const clearFormat = () => {
  editorRef.value?.focus(); document.execCommand("removeFormat", false);
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) { onEditorInput(); return; }
  const range = sel.getRangeAt(0);
  editorRef.value!.querySelectorAll("code, .tg-spoiler").forEach(el => {
    if (range.intersectsNode(el)) {
      const parent = el.parentNode!; const frag = document.createDocumentFragment();
      while (el.firstChild) frag.appendChild(el.firstChild);
      parent.replaceChild(frag, el);
    }
  });
  onEditorInput();
};
const fmtButtons = [
  { label: "B",   title: "Жирный",       cls: "fw-bold",   action: () => applyFmt("bold")                      },
  { label: "I",   title: "Курсив",        cls: "fw-italic", action: () => applyFmt("italic")                    },
  { label: "U",   title: "Подчёркнутый", cls: "fw-under",  action: () => applyFmt("underline")                 },
  { label: "S",   title: "Зачёркнутый",  cls: "fw-strike", action: () => applyFmt("strikeThrough")             },
  { label: "< >", title: "Код",           cls: "fw-code",   action: () => toggleInlineTag("code")               },
  { label: "||",  title: "Спойлер",       cls: "fw-spoil",  action: () => toggleInlineTag("span", "tg-spoiler") },
];
const insertEmoji = (emoji: { i: string }) => {
  showEmojiPicker.value = false; editorRef.value?.focus();
  document.execCommand("insertText", false, emoji.i); onEditorInput();
};

// ── Медиа ────────────────────────────────────────────────────────────────────

const addFiles = (files: FileList | File[]) => {
  for (const file of Array.from(files)) {
    mediaFiles.value.push(file);
    mediaPreviews.value.push(file.type.startsWith("image/") ? URL.createObjectURL(file) : "");
  }
};
const onFileSelect = (e: Event) => { const i = e.target as HTMLInputElement; if (i.files) addFiles(i.files); i.value = ""; };
const onDrop = (e: DragEvent) => { isDragging.value = false; if (e.dataTransfer?.files) addFiles(e.dataTransfer.files); };
const removeMedia = (i: number) => {
  const p = mediaPreviews.value[i]; if (p) URL.revokeObjectURL(p);
  mediaFiles.value.splice(i, 1); mediaPreviews.value.splice(i, 1);
};
const formatBytes = (b: number) => b < 1024 ? `${b} Б` : b < 1048576 ? `${(b/1024).toFixed(0)} КБ` : `${(b/1048576).toFixed(1)} МБ`;
const getMediaType = (f: File): "photo" | "video" | "document" | "audio" =>
  f.type.startsWith("image/") ? "photo" : f.type.startsWith("video/") ? "video" : f.type.startsWith("audio/") ? "audio" : "document";

// ── HTML → TG MD ─────────────────────────────────────────────────────────────

const htmlToTgMd = (html: string): string => {
  const div = document.createElement("div"); div.innerHTML = html;
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    const el = node as Element; const ch = Array.from(el.childNodes).map(walk).join(""); const tag = el.tagName?.toLowerCase();
    switch (tag) {
      case "b": case "strong": return `*${ch}*`;
      case "i": case "em":    return `_${ch}_`;
      case "u":               return `__${ch}__`;
      case "s": case "del": case "strike": return `~${ch}~`;
      case "code":            return `\`${ch}\``;
      case "span": return el.classList.contains("tg-spoiler") ? `||${ch}||` : ch;
      case "br":  return "\n";
      case "div": case "p": return ch + "\n";
      default: return ch;
    }
  };
  return walk(div).replace(/\n+$/, "");
};

// ── Сохранение ───────────────────────────────────────────────────────────────

const handleSave = async () => {
  if (!canSave.value || isSubmitting.value || !props.mailing) return;
  isSubmitting.value = true; submitError.value = "";
  try {
    const content = htmlToTgMd(editForm.value.message);
    let mediaUrl: string | undefined;
    let mediaType: "photo" | "video" | "document" | "audio" | undefined;
    const firstFile = mediaFiles.value[0];
    if (firstFile) {
      submitStep.value = "Загрузка медиа...";
      const mt = getMediaType(firstFile);
      const up = await mailingsApi.uploadMedia(firstFile, mt);
      mediaUrl = up.media_url; mediaType = mt;
    }
    const m = props.mailing as Mailing & { templateId?: number };
    if (m.templateId) {
      submitStep.value = "Обновление шаблона...";
      await mailingsApi.updateTemplate(m.templateId, {
        name: editForm.value.name, content, bot_type: editForm.value.type,
        ...(mediaUrl ? { media_url: mediaUrl, media_type: mediaType } : {}),
      });
    }
    submitStep.value = "Сохранение...";
    const updated = await mailingsApi.updateCampaign(props.mailing.campaignId, {
      name: editForm.value.name, scheduled_at: editForm.value.scheduledAt || null,
    });
    if (editForm.value.sendNow) {
      submitStep.value = "Запуск рассылки...";
      await mailingsApi.scheduleCampaign(props.mailing.campaignId, { campaign_id: props.mailing.campaignId, send_immediately: true });
    } else if (editForm.value.scheduledAt) {
      submitStep.value = "Планирование...";
      await mailingsApi.scheduleCampaign(props.mailing.campaignId, { campaign_id: props.mailing.campaignId, send_immediately: false, scheduled_at: editForm.value.scheduledAt });
    }
    emit("updated", { ...props.mailing, name: updated.name, type: editForm.value.type, message: content, scheduledAt: updated.scheduled_at ?? undefined });
    isEditing.value = false;
  } catch (err) {
    submitError.value = (err as Error).message || "Ошибка при сохранении";
  } finally { isSubmitting.value = false; submitStep.value = ""; }
};

// ── Хелперы отображения ───────────────────────────────────────────────────────

const getStatus = (s: string) => {
  const m: Record<string, { label: string; cls: string }> = {
    draft:     { label: "Черновик",      cls: "bg-gray-100 text-gray-700"    },
    scheduled: { label: "Запланировано", cls: "bg-orange-100 text-orange-700" },
    sending:   { label: "Отправляется",  cls: "bg-blue-100 text-blue-700"    },
    sent:      { label: "Отправлено",    cls: "bg-green-100 text-green-700"  },
    failed:    { label: "Ошибка",        cls: "bg-red-100 text-red-700"      },
  };
  return m[s] ?? { label: "Неизвестно", cls: "bg-gray-100 text-gray-600" };
};
const getType = (t: string) =>
  t === "telegram" ? { label: "Telegram", cls: "text-blue-600 bg-blue-50" } : { label: "МАКС", cls: "text-purple-600 bg-purple-50" };
const getTypeIcon = (t: string) => t === "telegram" ? "send" : "message-circle";
const fmt = (iso: string) => format(new Date(iso), "dd.MM.yyyy HH:mm", { locale: ru });
const typeOptions = [
  { value: "telegram" as const, label: "Telegram", icon: "send"           },
  { value: "max"      as const, label: "МАКС",     icon: "message-circle" },
];
const handleOverlay = (e: MouseEvent) => {
  if ((e.target as HTMLElement).classList.contains("dm-overlay") && !isSubmitting.value && !isSending.value) emit("close");
};
</script>

<template>
  <Teleport to="body">
    <Transition name="dm-fade">
      <div v-if="isOpen && mailing" class="dm-overlay" @click="handleOverlay">
        <Transition name="dm-slide">
          <div v-if="isOpen && mailing" class="dm-panel">

            <!-- Header -->
            <div class="dm-header">
              <div class="dm-header-left">
                <div class="dm-avatar" :class="getType(mailing.type).cls">
                  <AppIcon :name="getTypeIcon(mailing.type)" :size="17" />
                </div>
                <div class="dm-header-info">
                  <h2 class="dm-title">{{ isEditing ? 'Редактировать черновик' : mailing.name }}</h2>
                  <div class="dm-badges">
                    <span class="dm-type-label">{{ getType(mailing.type).label }}</span>
                    <span class="dm-status-badge" :class="getStatus(mailing.status).cls">{{ getStatus(mailing.status).label }}</span>
                  </div>
                </div>
              </div>
              <button class="dm-btn-close" :disabled="isSubmitting || isSending" @click="emit('close')">
                <AppIcon name="x" :size="18" />
              </button>
            </div>

            <!-- Body -->
            <div class="dm-body">

              <!-- ═══ VIEW ═══ -->
              <template v-if="!isEditing">
                <div class="dm-section">
                  <h3 class="dm-section-title">Содержание</h3>
                  <div class="dm-message">{{ mailing.message || '—' }}</div>
                  <div v-if="mailing.mediaType" class="dm-media-badge">
                    <AppIcon :name="mailing.mediaType === 'photo' ? 'package' : mailing.mediaType === 'video' ? 'play-circle' : 'file-text'" :size="13" />
                    {{ mailing.mediaType === 'photo' ? 'Фото' : mailing.mediaType === 'video' ? 'Видео' : 'Документ' }}
                    <span class="dm-media-badge-sub">(Telegram file_id)</span>
                  </div>
                </div>

                <div class="dm-section">
                  <h3 class="dm-section-title">Статистика</h3>
                  <div v-if="statsLoad" class="dm-stats-loading"><AppIcon name="refresh-cw" :size="13" class="dm-spin" /> Загрузка...</div>
                  <div v-else-if="!stats" class="dm-stats-empty">Статистика недоступна</div>
                  <div v-else>
                    <div class="dm-stats-grid">
                      <div class="dm-stat dm-stat--blue"><div class="dm-stat-value">{{ stats.total_messages.toLocaleString() }}</div><div class="dm-stat-label">Всего</div></div>
                      <div class="dm-stat dm-stat--green"><div class="dm-stat-value">{{ stats.sent_messages.toLocaleString() }}</div><div class="dm-stat-label">Отправлено</div></div>
                      <div class="dm-stat dm-stat--purple"><div class="dm-stat-value">{{ stats.delivery_rate.toFixed(1) }}%</div><div class="dm-stat-label">Доставлено</div><div class="dm-stat-sub">{{ stats.delivered_messages }}</div></div>
                      <div class="dm-stat dm-stat--amber"><div class="dm-stat-value">{{ stats.read_rate.toFixed(1) }}%</div><div class="dm-stat-label">Прочитано</div><div class="dm-stat-sub">{{ stats.read_messages }}</div></div>
                    </div>
                    <div v-if="stats.failed_messages > 0" class="dm-stats-failed"><AppIcon name="alert-circle" :size="13" /> Ошибок: {{ stats.failed_messages }}</div>
                  </div>
                </div>

                <div class="dm-section">
                  <h3 class="dm-section-title">Информация</h3>
                  <div class="dm-info-list">
                    <div class="dm-info-row"><span class="dm-info-label">Создано</span><span class="dm-info-value">{{ fmt(mailing.createdAt) }}</span></div>
                    <div v-if="mailing.scheduledAt" class="dm-info-row"><span class="dm-info-label">Запланировано</span><span class="dm-info-value dm-info-value--orange">{{ fmt(mailing.scheduledAt) }}</span></div>
                    <div v-if="mailing.sentAt" class="dm-info-row"><span class="dm-info-label">Отправлено</span><span class="dm-info-value dm-info-value--green">{{ fmt(mailing.sentAt) }}</span></div>
                    <div v-if="mailing.recipients > 0" class="dm-info-row"><span class="dm-info-label">Получателей</span><span class="dm-info-value">{{ mailing.recipients.toLocaleString() }}</span></div>
                  </div>
                </div>
              </template>

              <!-- ═══ EDIT ═══ -->
              <template v-else>
                <form @submit.prevent="handleSave" class="dm-form">
                  <div class="dm-section">
                    <h3 class="dm-section-title">Основное</h3>
                    <div class="dm-fields">
                      <div class="dm-field dm-field--req"><label>Название</label><input v-model="editForm.name" type="text" placeholder="Название рассылки" autocomplete="off" /></div>
                      <div class="dm-field">
                        <label>Канал</label>
                        <div class="dm-types">
                          <button v-for="t in typeOptions" :key="t.value" type="button" class="dm-type" :class="{ 'dm-type--on': editForm.type === t.value }" @click="editForm.type = t.value">
                            <AppIcon :name="t.icon" :size="13" /> {{ t.label }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="dm-section">
                    <div class="dm-section-row">
                      <h3 class="dm-section-title">Текст сообщения <span v-if="charCount > 0" class="dm-count">{{ charCount }} симв.</span></h3>
                      <div class="relative">
                        <button type="button" class="dm-emoji-btn" @mousedown.prevent @click.stop="showEmojiPicker = !showEmojiPicker">😊</button>
                        <template v-if="showEmojiPicker">
                          <div class="fixed inset-0 z-40" @click="showEmojiPicker = false" />
                          <div class="absolute top-full right-0 mt-1 z-50" @click.stop><EmojiPicker native @select="insertEmoji" /></div>
                        </template>
                      </div>
                    </div>
                    <div class="dm-fmt-bar">
                      <button v-for="b in fmtButtons" :key="b.label" type="button" :title="b.title" class="dm-fmt-btn" :class="b.cls" @mousedown.prevent @click="b.action()">{{ b.label }}</button>
                      <div class="dm-fmt-sep" />
                      <button type="button" title="Очистить форматирование" class="dm-fmt-btn dm-fmt-btn--clear" @mousedown.prevent @click="clearFormat"><AppIcon name="x" :size="11" /><span>Сброс</span></button>
                    </div>
                    <div ref="editorRef" contenteditable="true" class="dm-editor" :class="{ 'dm-editor--empty': isEmpty }" data-placeholder="Введите текст рассылки..." @input="onEditorInput" />
                  </div>

                  <div class="dm-section">
                    <h3 class="dm-section-title">Медиа <span v-if="mediaFiles.length" class="dm-count">{{ mediaFiles.length }}</span></h3>
                    <input ref="mediaInputRef" type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" style="display:none" @change="onFileSelect" />
                    <div class="dm-dropzone" :class="{ 'dm-dropzone--drag': isDragging }" @click="mediaInputRef?.click()" @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false" @drop.prevent="onDrop">
                      <AppIcon name="paperclip" :size="16" /><span>Перетащите или <u>выберите файлы</u></span><span class="dm-dropzone-sub">Фото, видео, документы</span>
                    </div>
                    <div v-if="mailing.mediaType && !mediaFiles.length" class="dm-existing-media">
                      <AppIcon :name="mailing.mediaType === 'photo' ? 'package' : mailing.mediaType === 'video' ? 'play-circle' : 'file-text'" :size="13" />
                      <span>Прикреплено: {{ mailing.mediaType === 'photo' ? 'Фото' : mailing.mediaType === 'video' ? 'Видео' : 'Документ' }}</span>
                    </div>
                    <div v-if="mediaFiles.length" class="dm-media-list">
                      <div v-for="(f, i) in mediaFiles" :key="i" class="dm-media-item">
                        <img v-if="mediaPreviews[i]" :src="mediaPreviews[i]" class="dm-media-thumb" :alt="f.name" />
                        <div v-else class="dm-media-icon"><AppIcon :name="f.type.startsWith('video/') ? 'play-circle' : 'file-text'" :size="15" /><span class="dm-media-fname">{{ f.name }}</span><span class="dm-media-sz">{{ formatBytes(f.size) }}</span></div>
                        <button type="button" class="dm-media-rm" @click="removeMedia(i)"><AppIcon name="x" :size="11" /></button>
                      </div>
                    </div>
                  </div>

                  <div class="dm-section">
                    <h3 class="dm-section-title">Настройки</h3>
                    <div class="dm-fields">
                      <div class="dm-field"><label class="dm-check-label"><input type="checkbox" v-model="editForm.sendNow" /><span>Отправить сейчас</span></label></div>
                      <div v-if="!editForm.sendNow" class="dm-field">
                        <label>Запланировать <span class="dm-optional">необязательно</span></label>
                        <input v-model="editForm.scheduledAt" type="datetime-local" />
                        <span class="dm-hint">Оставьте пустым — сохранится как черновик</span>
                      </div>
                    </div>
                  </div>
                </form>
              </template>
            </div>

            <!-- Progress -->
            <Transition name="dm-fade">
              <div v-if="isSubmitting" class="dm-progress-overlay">
                <AppIcon name="refresh-cw" :size="22" class="dm-spin text-blue-500" />
                <span>{{ submitStep || 'Сохранение...' }}</span>
              </div>
            </Transition>

            <!-- Footer -->
            <div class="dm-footer">
              <template v-if="!isEditing">
                <div v-if="sendError" class="dm-footer-error"><AppIcon name="alert-circle" :size="13" /> {{ sendError }}</div>
                <button v-if="mailing.status === 'draft'" class="dm-btn dm-btn--ghost" :disabled="isSending" @click="startEditing">
                  <AppIcon name="edit-2" :size="13" /> Редактировать
                </button>
                <button v-if="mailing.status === 'draft'" class="dm-btn dm-btn--green" :disabled="isSending" @click="sendNow">
                  <AppIcon v-if="isSending" name="refresh-cw" :size="13" class="dm-spin" /><AppIcon v-else name="send" :size="13" />
                  {{ isSending ? 'Отправка...' : 'Отправить' }}
                </button>
                <button v-if="mailing.status !== 'draft'" class="dm-btn dm-btn--ghost" @click="emit('close')">Закрыть</button>
              </template>
              <template v-else>
                <div v-if="submitError" class="dm-footer-error"><AppIcon name="alert-circle" :size="13" /> {{ submitError }}</div>
                <button class="dm-btn dm-btn--ghost" :disabled="isSubmitting" @click="cancelEditing">Отмена</button>
                <button class="dm-btn dm-btn--primary" :disabled="!canSave || isSubmitting" @click="handleSave">
                  <AppIcon v-if="isSubmitting" name="refresh-cw" :size="13" class="dm-spin" />
                  {{ isSubmitting ? 'Сохранение...' : editForm.sendNow ? 'Сохранить и отправить' : 'Сохранить' }}
                </button>
              </template>
            </div>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dm-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(15,23,42,0.45); backdrop-filter: blur(4px); display: flex; justify-content: flex-end; align-items: stretch; }
.dm-panel { position: relative; width: min(500px, 100vw); height: 100%; background: #fff; display: flex; flex-direction: column; box-shadow: -8px 0 40px rgba(0,0,0,0.12); overflow: hidden; }

/* Header */
.dm-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; gap: 12px; }
.dm-header-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.dm-avatar { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dm-header-info { min-width: 0; }
.dm-title { font: 700 15px/1.2 var(--fn, sans-serif); color: #0f172a; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dm-badges { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
.dm-type-label { font: 500 11px/1 var(--fn, sans-serif); color: #64748b; }
.dm-status-badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 20px; font: 500 11px/1 var(--fn, sans-serif); }
.dm-btn-close { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 6px; background: none; cursor: pointer; transition: all 150ms; color: #94a3b8; flex-shrink: 0; }
.dm-btn-close:hover:not(:disabled) { background: #f1f5f9; color: #0f172a; }
.dm-btn-close:disabled { opacity: 0.4; cursor: not-allowed; }

/* Body */
.dm-body { flex: 1; overflow-y: auto; overflow-x: hidden; }
.dm-body::-webkit-scrollbar { width: 4px; }
.dm-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.dm-form { display: flex; flex-direction: column; }

/* Section */
.dm-section { padding: 20px; border-bottom: 1px solid #f1f5f9; }
.dm-section:last-of-type { border-bottom: none; }
.dm-section-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.dm-section-title { font: 700 10px/1 var(--fn, sans-serif); color: #94a3b8; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.06em; display: flex; align-items: center; gap: 6px; }
.dm-section-row .dm-section-title { margin-bottom: 0; }
.dm-count { font: 500 10px/1 var(--fn, sans-serif); text-transform: none; letter-spacing: 0; color: #2563eb; background: #eff6ff; padding: 2px 6px; border-radius: 20px; }
.dm-hint { margin: 5px 0 0; font: 400 11px/1.4 var(--fn, sans-serif); color: #94a3b8; }
.dm-optional { font-weight: 400; text-transform: none; letter-spacing: 0; color: #94a3b8; font-size: 10px; }

/* View */
.dm-message { font: 400 13px/1.7 var(--fn, sans-serif); color: #0f172a; white-space: pre-wrap; word-break: break-word; }
.dm-media-badge { display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font: 400 12px/1 var(--fn, sans-serif); color: #64748b; }
.dm-media-badge-sub { color: #94a3b8; }
.dm-stats-loading, .dm-stats-empty { display: flex; align-items: center; gap: 6px; font: 400 13px/1 var(--fn, sans-serif); color: #94a3b8; }
.dm-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.dm-stat { text-align: center; border-radius: 10px; padding: 12px 8px; }
.dm-stat--blue { background: #eff6ff; } .dm-stat--green { background: #f0fdf4; } .dm-stat--purple { background: #faf5ff; } .dm-stat--amber { background: #fffbeb; }
.dm-stat-value { font: 700 18px/1 var(--fn, sans-serif); }
.dm-stat--blue .dm-stat-value { color: #2563eb; } .dm-stat--green .dm-stat-value { color: #16a34a; } .dm-stat--purple .dm-stat-value { color: #7c3aed; } .dm-stat--amber .dm-stat-value { color: #d97706; }
.dm-stat-label { font: 500 10px/1 var(--fn, sans-serif); color: #94a3b8; margin-top: 4px; }
.dm-stat-sub { font: 400 10px/1 var(--fn, sans-serif); color: #cbd5e1; margin-top: 2px; }
.dm-stats-failed { display: flex; align-items: center; gap: 6px; margin-top: 8px; padding: 8px 10px; background: #fef2f2; border-radius: 8px; font: 400 12px/1 var(--fn, sans-serif); color: #dc2626; }
.dm-info-list { display: flex; flex-direction: column; gap: 10px; }
.dm-info-row { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.dm-info-label { font: 400 11px/1 var(--fn, sans-serif); color: #94a3b8; }
.dm-info-value { font: 500 12px/1 var(--fn, sans-serif); color: #0f172a; }
.dm-info-value--orange { color: #ea580c; } .dm-info-value--green { color: #16a34a; }

/* Edit: Fields */
.dm-fields { display: flex; flex-direction: column; gap: 12px; }
.dm-field { display: flex; flex-direction: column; gap: 5px; }
.dm-field label { font: 600 10px/1 var(--fn, sans-serif); color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; display: flex; align-items: center; gap: 5px; }
.dm-field--req label::after { content: " *"; color: #dc2626; }
.dm-field input { padding: 9px 11px; border: 1.5px solid #e2e8f0; border-radius: 8px; font: 400 13px/1.3 var(--fn, sans-serif); background: #fff; color: #0f172a; outline: none; transition: border-color 150ms, box-shadow 150ms; }
.dm-field input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
.dm-field input::placeholder { color: #94a3b8; }
.dm-check-label { display: flex !important; align-items: center; gap: 8px; cursor: pointer; font: 500 13px/1 var(--fn, sans-serif) !important; text-transform: none !important; letter-spacing: 0 !important; color: #0f172a !important; padding: 4px 0; }
.dm-check-label input[type="checkbox"] { width: 16px; height: 16px; accent-color: #2563eb; cursor: pointer; flex-shrink: 0; }
.dm-types { display: flex; gap: 6px; }
.dm-type { flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 8px 6px; border-radius: 8px; border: 1.5px solid #e2e8f0; background: #fff; color: #64748b; font: 600 12px/1 var(--fn, sans-serif); cursor: pointer; transition: all 150ms; }
.dm-type:hover { border-color: #cbd5e1; background: #f8fafc; color: #0f172a; }
.dm-type--on { border-color: #2563eb; background: #eff6ff; color: #2563eb; }
.dm-emoji-btn { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 6px; background: none; cursor: pointer; font-size: 17px; transition: background 150ms; }
.dm-emoji-btn:hover { background: #f1f5f9; }
.dm-fmt-bar { display: flex; align-items: center; gap: 1px; padding: 5px 8px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-bottom: none; border-radius: 8px 8px 0 0; }
.dm-fmt-btn { display: flex; align-items: center; justify-content: center; min-width: 28px; height: 24px; padding: 0 5px; border: none; border-radius: 4px; background: none; cursor: pointer; color: #475569; font: 600 11px/1 'Courier New', monospace; transition: background 120ms; user-select: none; }
.dm-fmt-btn:hover { background: #e2e8f0; color: #0f172a; }
.dm-fmt-btn.fw-bold   { font-weight: 900; font-family: var(--fn, sans-serif); }
.dm-fmt-btn.fw-italic { font-style: italic; font-family: var(--fn, sans-serif); }
.dm-fmt-btn.fw-under  { text-decoration: underline; font-family: var(--fn, sans-serif); }
.dm-fmt-btn.fw-strike { text-decoration: line-through; font-family: var(--fn, sans-serif); }
.dm-fmt-btn.fw-code   { font-family: 'Courier New', monospace; font-size: 10px; color: #2563eb; }
.dm-fmt-btn.fw-spoil  { letter-spacing: -0.5px; color: #7c3aed; }
.dm-fmt-btn--clear { display: flex; align-items: center; gap: 3px; font: 500 10px/1 var(--fn, sans-serif); color: #94a3b8; padding: 0 6px; }
.dm-fmt-btn--clear:hover { background: #fee2e2; color: #dc2626; }
.dm-fmt-sep { width: 1px; height: 14px; background: #e2e8f0; margin: 0 4px; }
.dm-editor { position: relative; min-height: 120px; padding: 10px 12px; border: 1.5px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; font: 400 13px/1.7 var(--fn, sans-serif); background: #fff; color: #0f172a; outline: none; box-sizing: border-box; word-break: break-word; cursor: text; transition: border-color 150ms, box-shadow 150ms; }
.dm-editor:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
.dm-editor--empty::before { content: attr(data-placeholder); color: #94a3b8; pointer-events: none; position: absolute; top: 10px; left: 12px; }
.dm-editor :deep(b), .dm-editor :deep(strong) { font-weight: 700; }
.dm-editor :deep(i), .dm-editor :deep(em) { font-style: italic; }
.dm-editor :deep(u) { text-decoration: underline; }
.dm-editor :deep(s), .dm-editor :deep(del) { text-decoration: line-through; }
.dm-editor :deep(code) { font-family: 'Courier New', monospace; font-size: 11px; background: #f1f5f9; color: #1e40af; padding: 1px 4px; border-radius: 3px; }
.dm-editor :deep(.tg-spoiler) { background: #1e293b; color: #f8fafc; border-radius: 4px; padding: 0 3px; user-select: text; }
.dm-dropzone { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 14px 12px; border: 1.5px dashed #cbd5e1; border-radius: 10px; background: #f8fafc; cursor: pointer; transition: border-color 150ms, background 150ms; color: #94a3b8; text-align: center; font: 400 12px/1.4 var(--fn, sans-serif); }
.dm-dropzone:hover, .dm-dropzone--drag { border-color: #2563eb; background: #eff6ff; color: #2563eb; }
.dm-dropzone-sub { font: 400 10px/1 var(--fn, sans-serif); color: #94a3b8; margin-top: 2px; }
.dm-existing-media { display: flex; align-items: center; gap: 6px; margin-top: 8px; padding: 7px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font: 400 12px/1 var(--fn, sans-serif); color: #64748b; }
.dm-media-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(68px, 1fr)); gap: 8px; margin-top: 10px; }
.dm-media-item { position: relative; border-radius: 8px; overflow: hidden; border: 1.5px solid #e2e8f0; background: #f8fafc; aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.dm-media-thumb { width: 100%; height: 100%; object-fit: cover; display: block; }
.dm-media-icon { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; color: #64748b; width: 100%; height: 100%; padding: 6px; }
.dm-media-fname { font: 400 9px/1.2 var(--fn, sans-serif); color: #64748b; text-align: center; word-break: break-all; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.dm-media-sz { font: 400 9px/1 var(--fn, sans-serif); color: #94a3b8; }
.dm-media-rm { position: absolute; top: 3px; right: 3px; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 4px; background: rgba(15,23,42,0.55); color: #fff; cursor: pointer; opacity: 0; transition: opacity 150ms; padding: 0; }
.dm-media-item:hover .dm-media-rm { opacity: 1; }
.dm-media-rm:hover { background: #dc2626; }

/* Progress */
.dm-progress-overlay { position: absolute; inset: 0; z-index: 10; background: rgba(255,255,255,0.85); backdrop-filter: blur(2px); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; font: 500 13px/1 var(--fn, sans-serif); color: #334155; }

/* Footer */
.dm-footer { display: flex; justify-content: flex-end; align-items: center; gap: 8px; padding: 14px 20px; border-top: 1px solid #e2e8f0; flex-shrink: 0; background: #fff; }
.dm-footer-error { display: flex; align-items: center; gap: 6px; font: 400 12px/1.4 var(--fn, sans-serif); color: #dc2626; flex: 1; }
.dm-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 8px; font: 600 13px/1 var(--fn, sans-serif); border: none; cursor: pointer; transition: all 150ms; }
.dm-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.dm-btn--ghost { background: none; color: #64748b; border: 1.5px solid #e2e8f0; }
.dm-btn--ghost:hover:not(:disabled) { background: #f1f5f9; color: #0f172a; }
.dm-btn--primary { background: #2563eb; color: #fff; }
.dm-btn--primary:hover:not(:disabled) { background: #1d4ed8; box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
.dm-btn--green { background: #16a34a; color: #fff; }
.dm-btn--green:hover:not(:disabled) { background: #15803d; box-shadow: 0 4px 12px rgba(22,163,74,0.3); }

/* Transitions */
.dm-fade-enter-active, .dm-fade-leave-active { transition: opacity 200ms; }
.dm-fade-enter-from, .dm-fade-leave-to { opacity: 0; }
.dm-slide-enter-active { transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1); }
.dm-slide-leave-active { transition: transform 200ms cubic-bezier(0.4, 0, 1, 1); }
.dm-slide-enter-from, .dm-slide-leave-to { transform: translateX(100%); }

@media (max-width: 640px) {
  .dm-panel { width: 100vw; }
  .dm-stats-grid { grid-template-columns: repeat(2, 1fr); }
}

.dm-spin { animation: dm-spin 0.7s linear infinite; }
@keyframes dm-spin { to { transform: rotate(360deg); } }
</style>
