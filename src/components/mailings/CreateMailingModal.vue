<script setup lang="ts">
import { ref, computed } from "vue";
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
  value: "telegram" | "max";
  label: string;
  icon: IconName;
  color: string;
}> = [
  { value: "telegram", label: "Telegram", icon: "send",           color: "text-blue-600"   },
  { value: "max",      label: "МАКС",     icon: "message-circle", color: "text-purple-600" },
];

const showSubject = computed(() => true);

const estimatedRecipients = computed(() => {
  const baseCount = 1000;
  let multiplier = 1;

  if (form.value.targetAudience.includes("all")) multiplier = 1;
  else if (form.value.targetAudience.includes("vip")) multiplier = 0.1;
  else if (form.value.targetAudience.includes("active")) multiplier = 0.6;
  else if (form.value.targetAudience.includes("new")) multiplier = 0.2;
  else if (form.value.targetAudience.includes("inactive")) multiplier = 0.3;
  else multiplier = 0.4;

  return Math.round(baseCount * multiplier * form.value.targetAudience.length);
});

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
};

const closeModal = () => {
  emit("close");
  resetForm();
};

const handleSubmit = async () => {
  if (!form.value.name || !form.value.message || form.value.targetAudience.length === 0) return;

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
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
  >
    <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div class="p-5">
        <!-- Header -->
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-semibold text-gray-900">Создать рассылку</h2>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600 transition-colors">
            <AppIcon name="x" :size="20" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Название *</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="Введите название рассылки"
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <!-- Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Тип рассылки *</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="type in typeOptions"
                :key="type.value"
                type="button"
                @click="form.type = type.value"
                :class="[
                  'p-3 border-2 rounded-lg transition-all flex flex-col items-center gap-1.5',
                  form.type === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300',
                ]"
              >
                <div
                  :class="[
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    form.type === type.value ? 'bg-blue-100' : 'bg-gray-100',
                  ]"
                >
                  <AppIcon :name="type.icon" :size="16" :class="type.color" />
                </div>
                <span class="text-sm font-medium">{{ type.label }}</span>
              </button>
            </div>
          </div>

          <!-- Subject -->
          <div v-if="showSubject">
            <label class="block text-sm font-medium text-gray-700 mb-1">Заголовок</label>
            <input
              v-model="form.subject"
              type="text"
              placeholder="Введите заголовок сообщения"
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            ></textarea>
            <div class="mt-0.5 text-xs text-gray-400">{{ form.message.length }} символов</div>
          </div>

          <!-- Audience -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Целевая аудитория *
              <span v-if="form.targetAudience.length > 0" class="text-gray-400 font-normal">
                (≈{{ estimatedRecipients }} получателей)
              </span>
            </label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="option in audienceOptions"
                :key="option.value"
                type="button"
                @click="toggleAudience(option.value)"
                :class="[
                  'p-2.5 text-left border rounded-lg transition-colors text-sm flex items-center gap-2',
                  form.targetAudience.includes(option.value)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700',
                ]"
              >
                <div
                  :class="[
                    'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                    form.targetAudience.includes(option.value)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300',
                  ]"
                >
                  <AppIcon
                    v-if="form.targetAudience.includes(option.value)"
                    name="check"
                    :size="10"
                    class="text-white"
                  />
                </div>
                {{ option.label }}
              </button>
            </div>
          </div>

          <!-- Branch -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Филиал</label>
            <select
              v-model="form.branch"
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option v-for="branch in branches" :key="branch" :value="branch">
                {{ branch }}
              </option>
            </select>
          </div>

          <!-- Scheduling -->
          <div class="space-y-3">
            <label class="flex items-center gap-2.5 cursor-pointer">
              <input
                v-model="form.sendNow"
                type="checkbox"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span class="text-sm font-medium text-gray-700">Отправить сейчас</span>
            </label>

            <div v-if="!form.sendNow">
              <label class="block text-sm font-medium text-gray-700 mb-1">Запланировать отправку</label>
              <input
                v-model="form.scheduledAt"
                type="datetime-local"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <div class="mt-0.5 text-xs text-gray-400">Оставьте пустым для сохранения как черновик</div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || !form.name || !form.message || form.targetAudience.length === 0"
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AppIcon v-if="isSubmitting" name="refresh-cw" :size="14" class="animate-spin" />
              {{ isSubmitting ? "Создание..." : form.sendNow ? "Отправить" : "Создать рассылку" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
