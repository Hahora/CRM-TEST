<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import AppIcon from "@/components/AppIcon.vue";
import MailingsFilters from "@/components/mailings/MailingsFilters.vue";
import MailingsTable from "@/components/mailings/MailingsTable.vue";
import MailingsStats from "@/components/mailings/MailingsStats.vue";
import CreateMailingModal from "@/components/mailings/CreateMailingModal.vue";
import MailingDetailsModal from "@/components/mailings/MailingDetailsModal.vue";
import DevelopmentBanner from "@/components/DevelopmentBanner.vue";

interface Mailing {
  id: string;
  name: string;
  type: "telegram" | "email" | "max";
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  subject?: string;
  message: string;
  recipients: number;
  sent: number;
  delivered: number;
  opened?: number;
  clicked?: number;
  failed: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  createdBy: string;
  branch: string;
  targetAudience: string[];
}

interface MailingsFilters {
  search: string;
  type: string;
  status: string;
  branch: string;
  dateFrom: string;
  dateTo: string;
}

const mailings = ref<Mailing[]>([
  {
    id: "1",
    name: "Новогодняя акция 2024",
    type: "telegram",
    status: "sent",
    subject: "🎄 Новогодние скидки до 50%!",
    message:
      "Дорогие клиенты! Поздравляем с наступающим Новым годом! Специально для вас скидки до 50% на все товары до 31 декабря.",
    recipients: 1247,
    sent: 1247,
    delivered: 1198,
    opened: 856,
    clicked: 234,
    failed: 49,
    sentAt: "2024-01-15T10:00:00",
    createdAt: "2024-01-14T15:30:00",
    createdBy: "Иван Петров",
    branch: "Главный офис",
    targetAudience: ["vip", "active"],
  },
  {
    id: "2",
    name: "Напоминание о встрече",
    type: "max",
    status: "sent",
    message:
      "Напоминаем о встрече завтра в 14:00. Ждем вас по адресу: ул. Ленина, 1. Тел: +7(495)123-45-67",
    recipients: 45,
    sent: 45,
    delivered: 43,
    failed: 2,
    sentAt: "2024-01-15T16:30:00",
    createdAt: "2024-01-15T16:25:00",
    createdBy: "Анна Смирнова",
    branch: "Филиал №1",
    targetAudience: ["scheduled_visits"],
  },
  {
    id: "3",
    name: "Еженедельная рассылка",
    type: "email",
    status: "scheduled",
    subject: "Новости недели и специальные предложения",
    message:
      "Добро пожаловать в еженедельную рассылку! В этом выпуске: новые товары, акции и полезные советы.",
    recipients: 892,
    sent: 0,
    delivered: 0,
    failed: 0,
    scheduledAt: "2024-01-16T09:00:00",
    createdAt: "2024-01-15T14:20:00",
    createdBy: "Петр Николаев",
    branch: "Главный офис",
    targetAudience: ["active", "newsletter_subscribers"],
  },
  {
    id: "4",
    name: "Опрос удовлетворенности",
    type: "telegram",
    status: "draft",
    subject: "Помогите нам стать лучше!",
    message:
      "Уважаемые клиенты! Пройдите короткий опрос о качестве наших услуг. Это займет всего 2 минуты.",
    recipients: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    createdAt: "2024-01-15T11:45:00",
    createdBy: "Мария Иванова",
    branch: "Филиал №2",
    targetAudience: ["recent_clients"],
  },
  {
    id: "5",
    name: "Уведомление через МАКС",
    type: "max",
    status: "sending",
    subject: "Важное уведомление",
    message:
      "Уважаемые клиенты! Информируем вас об изменении режима работы в праздничные дни.",
    recipients: 234,
    sent: 156,
    delivered: 142,
    opened: 89,
    failed: 14,
    sentAt: "2024-01-15T18:00:00",
    createdAt: "2024-01-15T17:45:00",
    createdBy: "Дмитрий Козлов",
    branch: "Филиал №3",
    targetAudience: ["all"],
  },
]);

const filters = ref<MailingsFilters>({
  search: "",
  type: "all",
  status: "all",
  branch: "all",
  dateFrom: "",
  dateTo: "",
});

const isCreateModalOpen = ref(false);
const isDetailsModalOpen = ref(false);
const selectedMailing = ref<Mailing | null>(null);
const isLoading = ref(false);

const filteredMailings = computed(() => {
  let result = mailings.value;

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase();
    result = result.filter(
      (mailing) =>
        mailing.name.toLowerCase().includes(search) ||
        (mailing.subject && mailing.subject.toLowerCase().includes(search)) ||
        mailing.message.toLowerCase().includes(search)
    );
  }

  if (filters.value.type !== "all") {
    result = result.filter((mailing) => mailing.type === filters.value.type);
  }

  if (filters.value.status !== "all") {
    result = result.filter(
      (mailing) => mailing.status === filters.value.status
    );
  }

  if (filters.value.branch !== "all") {
    result = result.filter(
      (mailing) => mailing.branch === filters.value.branch
    );
  }

  return result;
});

const mailingsStats = computed(() => {
  const total = filteredMailings.value.length;
  const draft = filteredMailings.value.filter(
    (m) => m.status === "draft"
  ).length;
  const scheduled = filteredMailings.value.filter(
    (m) => m.status === "scheduled"
  ).length;
  const sent = filteredMailings.value.filter((m) => m.status === "sent").length;
  const failed = filteredMailings.value.filter(
    (m) => m.status === "failed"
  ).length;

  const totalRecipients = filteredMailings.value.reduce(
    (sum, m) => sum + m.recipients,
    0
  );
  const totalSent = filteredMailings.value.reduce((sum, m) => sum + m.sent, 0);
  const totalDelivered = filteredMailings.value.reduce(
    (sum, m) => sum + m.delivered,
    0
  );
  const totalOpened = filteredMailings.value.reduce(
    (sum, m) => sum + (m.opened || 0),
    0
  );

  const deliveryRate =
    totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;
  const openRate =
    totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0;

  return {
    total,
    draft,
    scheduled,
    sent,
    failed,
    totalRecipients,
    totalSent,
    totalDelivered,
    totalOpened,
    deliveryRate,
    openRate,
  };
});

const openCreateModal = () => {
  isCreateModalOpen.value = true;
};

const closeCreateModal = () => {
  isCreateModalOpen.value = false;
};

const openDetailsModal = (mailing: Mailing) => {
  selectedMailing.value = mailing;
  isDetailsModalOpen.value = true;
};

const closeDetailsModal = () => {
  isDetailsModalOpen.value = false;
  selectedMailing.value = null;
};

const handleCreateMailing = (mailingData: any) => {
  const newMailing: Mailing = {
    id: Date.now().toString(),
    ...mailingData,
    recipients: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    createdAt: new Date().toISOString(),
  };
  mailings.value.unshift(newMailing);
  closeCreateModal();
};

const handleUpdateFilters = (newFilters: MailingsFilters) => {
  filters.value = { ...newFilters };
};

const refreshData = async () => {
  isLoading.value = true;

  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log("Данные рассылок обновлены");

  isLoading.value = false;
};

const exportMailings = () => {
  console.log("Экспорт рассылок");
};

onMounted(() => {
  console.log("Mailings page loaded");
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <DevelopmentBanner />
    <!-- Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="p-4 md:p-6">
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 class="text-xl md:text-2xl font-bold text-gray-900">
              Рассылки
            </h1>
            <p class="text-sm md:text-base text-gray-600 mt-1">
              Управление массовыми рассылками и уведомлениями
            </p>
          </div>

          <div class="flex items-center gap-2 md:gap-3">
            <button
              @click="exportMailings"
              class="px-3 py-2 md:px-4 md:py-2 border border-gray-300 text-gray-700 text-xs md:text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1 md:gap-2"
            >
              <AppIcon name="file-text" :size="14" class="md:w-4 md:h-4" />
              <span class="hidden sm:inline">Экспорт</span>
            </button>
            <button
              @click="refreshData"
              :disabled="isLoading"
              class="px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white text-xs md:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2"
            >
              <AppIcon
                name="refresh-cw"
                :size="14"
                class="transition-transform md:w-4 md:h-4"
                :class="{ 'animate-spin': isLoading }"
              />
              <span class="hidden sm:inline">{{
                isLoading ? "Обновление..." : "Обновить"
              }}</span>
            </button>
            <button
              @click="openCreateModal"
              class="px-3 py-2 md:px-4 md:py-2 bg-green-600 text-white text-xs md:text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 md:gap-2"
            >
              <AppIcon name="send" :size="14" class="md:w-4 md:h-4" />
              <span class="hidden sm:inline">Новая рассылка</span>
              <span class="sm:hidden">Новая</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="p-4 md:p-6 space-y-6">
      <!-- Loading Overlay -->
      <div
        v-if="isLoading"
        class="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center"
      >
        <div class="bg-white rounded-lg p-6 flex items-center gap-3 shadow-lg">
          <AppIcon
            name="refresh-cw"
            :size="20"
            class="animate-spin text-blue-600"
          />
          <span class="text-gray-700 font-medium"
            >Обновление данных рассылок...</span
          >
        </div>
      </div>

      <!-- Filters -->
      <MailingsFilters
        :filters="filters"
        @update-filters="handleUpdateFilters"
      />

      <!-- Statistics Cards -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
      >
        <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"
            >
              <AppIcon name="send" :size="20" />
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-900">
                {{ mailings.filter((m) => m.status === "sent").length }}
              </div>
              <div class="text-sm text-gray-600">Отправлено</div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center"
            >
              <AppIcon name="clock" :size="20" />
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-900">
                {{ mailings.filter((m) => m.status === "scheduled").length }}
              </div>
              <div class="text-sm text-gray-600">Запланировано</div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 bg-gray-50 text-gray-600 rounded-lg flex items-center justify-center"
            >
              <AppIcon name="file-text" :size="20" />
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-900">
                {{ mailings.filter((m) => m.status === "draft").length }}
              </div>
              <div class="text-sm text-gray-600">Черновики</div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center"
            >
              <AppIcon name="users" :size="20" />
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-900">
                {{
                  mailings
                    .reduce((sum, m) => sum + m.recipients, 0)
                    .toLocaleString()
                }}
              </div>
              <div class="text-sm text-gray-600">Получателей</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mailings Table -->
      <MailingsTable
        :mailings="filteredMailings"
        @view-mailing="openDetailsModal"
      />

      <!-- Empty State -->
      <div
        v-if="!isLoading && filteredMailings.length === 0"
        class="bg-white rounded-xl border border-gray-200 p-8 md:p-12 text-center"
      >
        <div
          class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <AppIcon name="send" :size="32" class="text-gray-400" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {{
            filters.search ||
            filters.type ||
            filters.status ||
            filters.branch ||
            filters.dateFrom ||
            filters.dateTo
              ? "Рассылки не найдены"
              : "Нет рассылок"
          }}
        </h3>
        <p class="text-gray-600 mb-6">
          {{
            filters.search ||
            filters.type ||
            filters.status ||
            filters.branch ||
            filters.dateFrom ||
            filters.dateTo
              ? "Попробуйте изменить параметры поиска"
              : "Создайте первую рассылку для ваших клиентов"
          }}
        </p>
        <button
          v-if="
            !filters.search &&
            !filters.type &&
            !filters.status &&
            !filters.branch &&
            !filters.dateFrom &&
            !filters.dateTo
          "
          @click="openCreateModal"
          class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          Создать рассылку
        </button>
      </div>
    </div>

    <!-- Modals -->
    <CreateMailingModal
      :is-open="isCreateModalOpen"
      @close="closeCreateModal"
      @create="handleCreateMailing"
    />

    <MailingDetailsModal
      :is-open="isDetailsModalOpen"
      :mailing="selectedMailing"
      @close="closeDetailsModal"
    />
  </div>
</template>
