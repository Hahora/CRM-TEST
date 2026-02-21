<script setup lang="ts">
import { ref, computed } from "vue";
import AppIcon from "@/components/AppIcon.vue";
import MailingsStats from "@/components/mailings/MailingsStats.vue";
import MailingsFilters from "@/components/mailings/MailingsFilters.vue";
import type { MailingsFilters as TFilters } from "@/components/mailings/MailingsFilters.vue";
import MailingsTable from "@/components/mailings/MailingsTable.vue";
import type { Mailing } from "@/components/mailings/MailingsTable.vue";
import CreateMailingModal from "@/components/mailings/CreateMailingModal.vue";
import MailingDetailsModal from "@/components/mailings/MailingDetailsModal.vue";

// ── Данные ──────────────────────────────────────────────────────────────────

const mailings = ref<Mailing[]>([
  {
    id: "1",
    name: "Новогодняя акция 2024",
    type: "telegram",
    status: "sent",
    subject: "🎄 Новогодние скидки до 50%!",
    message: "Дорогие клиенты! Поздравляем с наступающим Новым годом! Специально для вас скидки до 50% на все товары до 31 декабря.",
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
    message: "Напоминаем о встрече завтра в 14:00. Ждем вас по адресу: ул. Ленина, 1. Тел: +7(495)123-45-67",
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
    message: "Добро пожаловать в еженедельную рассылку! В этом выпуске: новые товары, акции и полезные советы.",
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
    name: "Опрос удовлетворённости",
    type: "telegram",
    status: "draft",
    subject: "Помогите нам стать лучше!",
    message: "Уважаемые клиенты! Пройдите короткий опрос о качестве наших услуг. Это займет всего 2 минуты.",
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
    message: "Уважаемые клиенты! Информируем вас об изменении режима работы в праздничные дни.",
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

const isLoading = ref(false);

// ── Фильтры ──────────────────────────────────────────────────────────────────

const filters = ref<TFilters>({
  search: "",
  type: "all",
  status: "all",
  branch: "all",
  dateFrom: "",
  dateTo: "",
});

const filteredMailings = computed(() => {
  let result = mailings.value;

  if (filters.value.search) {
    const q = filters.value.search.toLowerCase();
    result = result.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.subject && m.subject.toLowerCase().includes(q)) ||
        m.message.toLowerCase().includes(q)
    );
  }

  if (filters.value.type !== "all") {
    result = result.filter((m) => m.type === filters.value.type);
  }

  if (filters.value.status !== "all") {
    result = result.filter((m) => m.status === filters.value.status);
  }

  if (filters.value.branch !== "all") {
    result = result.filter((m) => m.branch === filters.value.branch);
  }

  return result;
});

// ── Статистика ───────────────────────────────────────────────────────────────

const stats = computed(() => {
  const all = mailings.value;
  const totalSent = all.reduce((s, m) => s + m.sent, 0);
  const totalDelivered = all.reduce((s, m) => s + m.delivered, 0);
  const totalOpened = all.reduce((s, m) => s + (m.opened || 0), 0);

  return {
    total:           all.length,
    draft:           all.filter((m) => m.status === "draft").length,
    scheduled:       all.filter((m) => m.status === "scheduled").length,
    sent:            all.filter((m) => m.status === "sent").length,
    failed:          all.filter((m) => m.status === "failed").length,
    totalRecipients: all.reduce((s, m) => s + m.recipients, 0),
    totalSent,
    totalDelivered,
    totalOpened,
    deliveryRate:    totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0,
    openRate:        totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0,
  };
});

// ── Модальные окна ────────────────────────────────────────────────────────────

const isCreateModalOpen = ref(false);
const isDetailsModalOpen = ref(false);
const selectedMailing = ref<Mailing | null>(null);

const openDetails = (mailing: Mailing) => {
  selectedMailing.value = mailing;
  isDetailsModalOpen.value = true;
};

const closeDetails = () => {
  isDetailsModalOpen.value = false;
  selectedMailing.value = null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleCreate = (data: any) => {
  const newMailing: Mailing = {
    id: Date.now().toString(),
    ...data,
    recipients: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    createdAt: new Date().toISOString(),
  };
  mailings.value.unshift(newMailing);
  isCreateModalOpen.value = false;
};

const refresh = async () => {
  isLoading.value = true;
  await new Promise((r) => setTimeout(r, 800));
  isLoading.value = false;
};
</script>

<template>
  <div class="h-full overflow-hidden flex flex-col bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex-shrink-0">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-lg font-semibold text-gray-900">Рассылки</h1>
          <p class="text-xs text-gray-500 mt-0.5">Управление массовыми рассылками</p>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            @click="refresh"
            :disabled="isLoading"
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <AppIcon name="refresh-cw" :size="14" :class="{ 'animate-spin': isLoading }" />
            <span class="hidden sm:inline">Обновить</span>
          </button>
          <button
            @click="isCreateModalOpen = true"
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <AppIcon name="plus" :size="14" />
            <span class="hidden sm:inline">Новая рассылка</span>
            <span class="sm:hidden">Новая</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
      <MailingsStats :stats="stats" />

      <MailingsFilters
        :filters="filters"
        @update:filters="(v) => (filters = v)"
      />

      <MailingsTable
        :mailings="filteredMailings"
        :loading="isLoading"
        @view-mailing="openDetails"
      />
    </div>

    <!-- Modals -->
    <CreateMailingModal
      :is-open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @create="handleCreate"
    />

    <MailingDetailsModal
      :is-open="isDetailsModalOpen"
      :mailing="selectedMailing"
      @close="closeDetails"
    />
  </div>
</template>
