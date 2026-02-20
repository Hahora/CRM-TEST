<script setup lang="ts">
import { ref, computed } from "vue";
import AppIcon from "@/components/AppIcon.vue";
import { type IconName } from "@/components/icons.ts";

interface Props {
  isOpen: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  close: [];
  create: [mailingData: any];
}>();

interface AudienceRow {
  value: string;
  label: string;
  scheduledAt: string; // пусто = сейчас
}

const form = ref({
  name: "",
  type: "telegram" as "telegram" | "email" | "max",
  subject: "",
  message: "",
  branch: "Главный офис",
});

// Выбранные получатели с индивидуальным временем
const selectedAudience = ref<AudienceRow[]>([]);
// Общее время для всех (применяется при выборе аудитории)
const globalScheduledAt = ref("");

const isSubmitting = ref(false);

const audienceOptions = [
  { value: "all", label: "Все клиенты" },
  { value: "active", label: "Активные клиенты" },
  { value: "vip", label: "VIP клиенты" },
  { value: "new", label: "Новые клиенты" },
  { value: "inactive", label: "Неактивные клиенты" },
  { value: "newsletter_subscribers", label: "Подписчики рассылки" },
  { value: "recent_clients", label: "Недавние клиенты" },
  { value: "scheduled_visits", label: "Запланированные визиты" },
];

const branches = ["Главный офис", "Филиал №1", "Филиал №2", "Филиал №3"];

const typeOptions: Array<{
  value: "telegram" | "email" | "max";
  label: string;
  icon: IconName;
  color: string;
}> = [
  { value: "telegram", label: "Telegram", icon: "send", color: "text-blue-600" },
  { value: "max", label: "МАКС", icon: "message-circle", color: "text-purple-600" },
  { value: "email", label: "Email", icon: "mail", color: "text-green-600" },
];

const showSubject = computed(
  () => form.value.type === "email" || form.value.type === "telegram" || form.value.type === "max"
);

const estimatedRecipients = computed(() => {
  const baseCount = 1000;
  return selectedAudience.value.reduce((sum, row) => {
    let multiplier = 0.4;
    if (row.value === "all") multiplier = 1;
    else if (row.value === "vip") multiplier = 0.1;
    else if (row.value === "active") multiplier = 0.6;
    else if (row.value === "new") multiplier = 0.2;
    else if (row.value === "inactive") multiplier = 0.3;
    return sum + Math.round(baseCount * multiplier);
  }, 0);
});

const isSelected = (value: string) =>
  selectedAudience.value.some((r) => r.value === value);

const toggleAudience = (option: { value: string; label: string }) => {
  const idx = selectedAudience.value.findIndex((r) => r.value === option.value);
  if (idx > -1) {
    selectedAudience.value.splice(idx, 1);
  } else {
    selectedAudience.value.push({
      value: option.value,
      label: option.label,
      scheduledAt: globalScheduledAt.value,
    });
  }
};

// При изменении глобального времени — обновить тех, у кого время совпадает или пусто
const applyGlobalTime = () => {
  selectedAudience.value.forEach((row) => {
    row.scheduledAt = globalScheduledAt.value;
  });
};

const removeAudience = (idx: number) => {
  selectedAudience.value.splice(idx, 1);
};

const closeModal = () => {
  emit("close");
  resetForm();
};

const resetForm = () => {
  form.value = { name: "", type: "telegram", subject: "", message: "", branch: "Главный офис" };
  selectedAudience.value = [];
  globalScheduledAt.value = "";
};

const handleSubmit = async () => {
  if (!form.value.name || !form.value.message || selectedAudience.value.length === 0) return;

  isSubmitting.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Определяем статус: если хотя бы одна группа с будущим временем — scheduled, иначе sending
    const hasScheduled = selectedAudience.value.some((row) => {
      if (!row.scheduledAt) return false;
      return new Date(row.scheduledAt) > new Date();
    });

    const mailingData = {
      ...form.value,
      targetAudience: selectedAudience.value.map((r) => r.value),
      scheduledAt: hasScheduled
        ? selectedAudience.value.find((r) => r.scheduledAt)?.scheduledAt
        : undefined,
      status: hasScheduled ? "scheduled" : "sending",
      createdBy: "Текущий пользователь",
    };

    emit("create", mailingData);
    resetForm();
  } finally {
    isSubmitting.value = false;
  }
};

</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
  >
    <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900">Создать рассылку</h2>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600 transition-colors">
            <AppIcon name="x" :size="24" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Название рассылки *</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="Введите название рассылки"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">Тип рассылки *</label>
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="type in typeOptions"
                :key="type.value"
                type="button"
                @click="form.type = type.value"
                :class="[
                  'p-4 border-2 rounded-lg transition-all flex flex-col items-center gap-2',
                  form.type === type.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300',
                ]"
              >
                <div :class="['w-8 h-8 rounded-lg flex items-center justify-center', form.type === type.value ? 'bg-blue-100' : 'bg-gray-100']">
                  <AppIcon :name="type.icon" :size="16" :class="type.color" />
                </div>
                <span class="text-sm font-medium">{{ type.label }}</span>
              </button>
            </div>
          </div>

          <!-- Subject -->
          <div v-if="showSubject">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ form.type === "email" ? "Тема письма" : "Заголовок" }} *
            </label>
            <input
              v-model="form.subject"
              type="text"
              :placeholder="form.type === 'email' ? 'Введите тему письма' : 'Введите заголовок сообщения'"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- Message -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Текст сообщения *</label>
            <textarea
              v-model="form.message"
              rows="4"
              required
              placeholder="Введите текст сообщения"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
            <div class="mt-1 text-xs text-gray-500">Символов: {{ form.message.length }}</div>
          </div>

          <!-- Target Audience + Time -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700">
                Получатели *
                <span v-if="estimatedRecipients > 0" class="ml-1 text-blue-600 font-semibold">~{{ estimatedRecipients.toLocaleString() }}</span>
              </label>
            </div>

            <!-- Чекбоксы аудитории -->
            <div class="grid grid-cols-2 gap-2 mb-4">
              <button
                v-for="option in audienceOptions"
                :key="option.value"
                type="button"
                @click="toggleAudience(option)"
                :class="[
                  'p-3 text-left border rounded-lg transition-colors text-sm',
                  isSelected(option.value)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700',
                ]"
              >
                <div class="flex items-center gap-2">
                  <div :class="['w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0', isSelected(option.value) ? 'border-blue-500 bg-blue-500' : 'border-gray-300']">
                    <AppIcon v-if="isSelected(option.value)" name="check" :size="12" class="text-white" />
                  </div>
                  {{ option.label }}
                </div>
              </button>
            </div>

            <!-- Время + список получателей -->
            <div v-if="selectedAudience.length > 0" class="border border-gray-200 rounded-lg overflow-hidden">
              <!-- Шапка: общее время -->
              <div class="flex items-center gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200">
                <span class="text-xs font-medium text-gray-500 shrink-0">Время для всех:</span>
                <input
                  v-model="globalScheduledAt"
                  type="datetime-local"
                  class="flex-1 text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  @change="applyGlobalTime"
                />
                <button
                  type="button"
                  class="text-xs text-blue-600 hover:text-blue-800 font-medium shrink-0 whitespace-nowrap"
                  @click="applyGlobalTime"
                >
                  Применить
                </button>
              </div>

              <!-- Строки по каждой группе -->
              <div
                v-for="(row, idx) in selectedAudience"
                :key="row.value"
                class="flex items-center gap-2 px-3 py-2 border-b border-gray-100 last:border-b-0"
              >
                <span class="text-sm text-gray-700 flex-1 truncate">{{ row.label }}</span>
                <input
                  v-model="row.scheduledAt"
                  type="datetime-local"
                  class="text-xs px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-40"
                />
                <span class="text-xs shrink-0" :class="row.scheduledAt && new Date(row.scheduledAt) > new Date() ? 'text-orange-500' : 'text-green-600'">
                  {{ row.scheduledAt && new Date(row.scheduledAt) > new Date() ? '⏰ запланировано' : '✓ сейчас' }}
                </span>
                <button type="button" @click="removeAudience(idx)" class="text-gray-400 hover:text-red-500 transition-colors shrink-0">
                  <AppIcon name="x" :size="14" />
                </button>
              </div>
            </div>

            <p v-else class="text-xs text-gray-400 mt-1">Выберите хотя бы одну группу получателей</p>
          </div>

          <!-- Branch -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Филиал</label>
            <select
              v-model="form.branch"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option v-for="branch in branches" :key="branch" :value="branch">{{ branch }}</option>
            </select>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || !form.name || !form.message || selectedAudience.length === 0"
              class="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <AppIcon v-if="isSubmitting" name="refresh-cw" :size="16" class="animate-spin" />
              <AppIcon v-else name="send" :size="15" />
              {{ isSubmitting ? "Отправка..." : "Отправить" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
