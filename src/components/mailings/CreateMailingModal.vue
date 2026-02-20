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

const form = ref({
  name: "",
  type: "telegram" as "telegram" | "email" | "max",
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
  value: "telegram" | "email" | "max";
  label: string;
  icon: IconName;
  color: string;
}> = [
  {
    value: "telegram",
    label: "Telegram",
    icon: "send",
    color: "text-blue-600",
  },
  {
    value: "max",
    label: "МАКС",
    icon: "message-circle",
    color: "text-purple-600",
  },
  {
    value: "email",
    label: "Email",
    icon: "mail",
    color: "text-green-600",
  },
];

const showSubject = computed(
  () =>
    form.value.type === "email" ||
    form.value.type === "telegram" ||
    form.value.type === "max"
);

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

const closeModal = () => {
  emit("close");
  resetForm();
};

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

const handleSubmit = async () => {
  if (
    !form.value.name ||
    !form.value.message ||
    form.value.targetAudience.length === 0
  ) {
    return;
  }

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
  if (index > -1) {
    form.value.targetAudience.splice(index, 1);
  } else {
    form.value.targetAudience.push(value);
  }
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
  >
    <div
      class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900">Создать рассылку</h2>
          <button
            @click="closeModal"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <AppIcon name="x" :size="24" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Название рассылки *
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="Введите название рассылки"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- Type Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">
              Тип рассылки *
            </label>
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="type in typeOptions"
                :key="type.value"
                type="button"
                @click="form.type = type.value"
                :class="[
                  'p-4 border-2 rounded-lg transition-all flex flex-col items-center gap-2',
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
                  <AppIcon :name="type.icon" :size="16" :class="[type.color]" />
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
              :required="showSubject"
              :placeholder="
                form.type === 'email'
                  ? 'Введите тему письма'
                  : 'Введите заголовок сообщения'
              "
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- Message -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Текст сообщения *
            </label>
            <textarea
              v-model="form.message"
              rows="4"
              required
              placeholder="Введите текст сообщения"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
            <div class="mt-1 text-xs text-gray-500">
              Символов: {{ form.message.length }}
            </div>
          </div>

          <!-- Target Audience -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">
              Целевая аудитория * ({{ estimatedRecipients }} получателей)
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="option in audienceOptions"
                :key="option.value"
                type="button"
                @click="toggleAudience(option.value)"
                :class="[
                  'p-3 text-left border rounded-lg transition-colors text-sm',
                  form.targetAudience.includes(option.value)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700',
                ]"
              >
                <div class="flex items-center gap-2">
                  <div
                    :class="[
                      'w-4 h-4 rounded border-2 flex items-center justify-center',
                      form.targetAudience.includes(option.value)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300',
                    ]"
                  >
                    <AppIcon
                      v-if="form.targetAudience.includes(option.value)"
                      name="check"
                      :size="12"
                      class="text-white"
                    />
                  </div>
                  {{ option.label }}
                </div>
              </button>
            </div>
          </div>

          <!-- Branch -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Филиал
            </label>
            <select
              v-model="form.branch"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option v-for="branch in branches" :key="branch" :value="branch">
                {{ branch }}
              </option>
            </select>
          </div>

          <!-- Scheduling -->
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <input
                v-model="form.sendNow"
                type="checkbox"
                id="sendNow"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label for="sendNow" class="text-sm font-medium text-gray-700">
                Отправить сейчас
              </label>
            </div>

            <div v-if="!form.sendNow">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Запланировать отправку
              </label>
              <input
                v-model="form.scheduledAt"
                type="datetime-local"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div class="mt-1 text-xs text-gray-500">
                Оставьте пустым для сохранения как черновик
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div
            class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200"
          >
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              :disabled="
                isSubmitting ||
                !form.name ||
                !form.message ||
                form.targetAudience.length === 0
              "
              class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <AppIcon
                v-if="isSubmitting"
                name="refresh-cw"
                :size="16"
                class="animate-spin"
              />
              {{
                isSubmitting
                  ? "Создание..."
                  : form.sendNow
                  ? "Отправить"
                  : "Создать рассылку"
              }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
