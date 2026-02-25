<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import AppIcon from "@/components/AppIcon.vue";
import MailingsStats from "@/components/mailings/MailingsStats.vue";
import MailingsFilters from "@/components/mailings/MailingsFilters.vue";
import type { MailingsFilters as TFilters } from "@/components/mailings/MailingsFilters.vue";
import MailingsTable from "@/components/mailings/MailingsTable.vue";
import type { Mailing } from "@/components/mailings/MailingsTable.vue";
import CreateMailingModal from "@/components/mailings/CreateMailingModal.vue";
import MailingDetailsModal from "@/components/mailings/MailingDetailsModal.vue";
import { mailingsApi } from "@/services/mailingsApi";
import type { Analytics } from "@/services/mailingsApi";

// ── Данные ──────────────────────────────────────────────────────────────────

const mailings = ref<Mailing[]>([]);
const isLoading = ref(false);
const analytics = ref<Analytics | null>(null);
const showStatsPanel = ref(true);

/** Маппинг bot_type API → тип рассылки UI */
function mapBotType(botType: string): Mailing["type"] {
  if (botType === "telegram") return "telegram";
  return "max";
}

/** Маппинг статуса кампании API → статус UI */
function mapStatus(status?: string): Mailing["status"] {
  switch (status) {
    case "draft":      return "draft";
    case "scheduled":  return "scheduled";
    case "sending":    return "sending";
    case "sent":
    case "completed":  return "sent";
    case "failed":     return "failed";
    default:           return "draft";
  }
}

const loadData = async () => {
  isLoading.value = true;
  try {
    const [campaigns, analyticsData] = await Promise.allSettled([
      mailingsApi.getCampaigns(),
      mailingsApi.getAnalytics("month"),
    ]);

    if (campaigns.status === "fulfilled") {
      mailings.value = campaigns.value.map((c) => ({
        id: String(c.id),
        name: c.name,
        type: mapBotType(c.bot_type),
        status: mapStatus(c.status),
        message: "",
        recipients: 0,
        sent: 0,
        delivered: 0,
        failed: 0,
        scheduledAt: c.scheduled_at ?? undefined,
        createdAt: c.created_at ?? new Date().toISOString(),
        createdBy: "",
        branch: "",
        targetAudience: [],
      }));
    }

    if (analyticsData.status === "fulfilled") {
      analytics.value = analyticsData.value;
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadData);

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

  return result;
});

// ── Статистика ───────────────────────────────────────────────────────────────

const stats = computed(() => {
  const all = mailings.value;
  const a = analytics.value;

  const totalSent      = a?.total_sent      ?? all.reduce((s, m) => s + m.sent, 0);
  const totalDelivered = a?.total_delivered ?? all.reduce((s, m) => s + m.delivered, 0);
  const totalOpened    = a?.total_opened    ?? all.reduce((s, m) => s + (m.opened || 0), 0);

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
    deliveryRate:    a?.delivery_rate ?? (totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0),
    openRate:        a?.open_rate     ?? (totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0),
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
const handleCreate = async (data: any) => {
  try {
    const campaign = await mailingsApi.createCampaign({
      name: data.name,
      template_id: data.template_id ?? 0,
      bot_type: data.type ?? "telegram",
      scheduled_at: data.scheduledAt ?? null,
    });
    mailings.value.unshift({
      id: String(campaign.id),
      name: campaign.name,
      type: mapBotType(campaign.bot_type),
      status: mapStatus(campaign.status),
      message: data.message ?? "",
      recipients: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      scheduledAt: campaign.scheduled_at ?? undefined,
      createdAt: campaign.created_at ?? new Date().toISOString(),
      createdBy: "",
      branch: "",
      targetAudience: [],
    });
  } catch {
    // При ошибке добавляем локально как черновик
    mailings.value.unshift({
      id: Date.now().toString(),
      ...data,
      recipients: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      status: "draft",
      createdAt: new Date().toISOString(),
    });
  }
  isCreateModalOpen.value = false;
};

const refresh = () => loadData();
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
            @click="showStatsPanel = !showStatsPanel"
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors"
            :class="showStatsPanel
              ? 'bg-blue-50 text-blue-600 border-blue-200'
              : 'text-gray-700 border-gray-200 hover:bg-gray-50'"
            title="Статистика"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <span class="hidden sm:inline">Статистика</span>
          </button>
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
      <Transition name="fold">
        <div v-if="showStatsPanel">
          <MailingsStats :stats="stats" />
        </div>
      </Transition>

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

<style scoped>
.fold-enter-active { transition: all 200ms ease-out; overflow: hidden; }
.fold-leave-active { transition: all 150ms ease-in;  overflow: hidden; }
.fold-enter-from,
.fold-leave-to   { opacity: 0; max-height: 0; }
.fold-enter-to,
.fold-leave-from { opacity: 1; max-height: 500px; }
</style>
