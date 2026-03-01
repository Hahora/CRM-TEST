<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import AppIcon from "@/components/AppIcon.vue";
import MailingsStats from "@/components/mailings/MailingsStats.vue";
import MailingsFilters from "@/components/mailings/MailingsFilters.vue";
import type { MailingsFilters as TFilters } from "@/components/mailings/MailingsFilters.vue";
import MailingsTable from "@/components/mailings/MailingsTable.vue";
import type { Mailing } from "@/components/mailings/MailingsTable.vue";
import CreateMailingModal from "@/components/mailings/CreateMailingModal.vue";
import MailingDetailsModal from "@/components/mailings/MailingDetailsModal.vue";
import { mailingsApi } from "@/services/mailingsApi";
import type { Analytics, Campaign } from "@/services/mailingsApi";

// ── Данные ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
const currentPage = ref(1);
const totalMailings = ref(0);
const mailings = ref<Mailing[]>([]);
const isLoading = ref(false);
const analytics = ref<Analytics | null>(null);
const showStatsPanel = ref(false);

/** Маппинг bot_type API → тип рассылки UI */
function mapBotType(botType: string): Mailing["type"] {
  if (botType === "telegram") return "telegram";
  return "max";
}

/** Маппинг статуса кампании API → статус UI */
function mapStatus(status?: string): Mailing["status"] {
  switch (status) {
    case "draft":
      return "draft";
    case "scheduled":
      return "scheduled";
    case "sending":
      return "sending";
    case "sent":
    case "completed":
      return "sent";
    case "failed":
      return "failed";
    case "cancelled":
      return "cancelled";
    default:
      return "draft";
  }
}

// ── Фильтры ──────────────────────────────────────────────────────────────────

const filters = ref<TFilters>({
  search: "",
  type: "all",
  status: "all",
  dateFrom: "",
  dateTo: "",
});

/** UI-статус → статус API */
function toApiStatus(s: string): string | undefined {
  if (s === "all") return undefined;
  if (s === "sent") return "completed";
  return s;
}

const loadData = async () => {
  isLoading.value = true;
  try {
    const [campaignsRes, analyticsRes] = await Promise.allSettled([
      mailingsApi.getCampaigns({
        skip:     (currentPage.value - 1) * PAGE_SIZE,
        limit:    PAGE_SIZE,
        status:   toApiStatus(filters.value.status),
        bot_type: filters.value.type !== "all" ? filters.value.type : undefined,
        search:   filters.value.search || undefined,
      }),
      mailingsApi.getAnalytics("all"),
    ]);

    if (analyticsRes.status === "fulfilled") {
      analytics.value = analyticsRes.value;
    }

    const campaigns = campaignsRes.status === "fulfilled" ? campaignsRes.value : null;
    if (!campaigns) return;

    totalMailings.value = campaigns.total;
    mailings.value = campaigns.campaigns.map((c) => ({
      id:           String(c.id),
      campaignId:   c.id,
      name:         c.name,
      type:         mapBotType(c.bot_type),
      status:       mapStatus(c.status),
      message:      c.template?.content ?? "",
      templateName: c.template?.name,
      mediaUrl:     c.template?.media_url,
      mediaType:    c.template?.media_type,
      recipients:   0,
      sent:         0,
      delivered:    0,
      failed:       0,
      scheduledAt:  c.scheduled_at ?? undefined,
      sentAt:       c.sent_at ?? undefined,
      createdAt:    c.created_at ?? new Date().toISOString(),
    }));
  } finally {
    isLoading.value = false;
  }
};

watch(filters, () => { currentPage.value = 1; loadData(); }, { deep: true });
onMounted(loadData);

const onPageChange = (page: number) => { currentPage.value = page; loadData(); };

// ── Статистика ───────────────────────────────────────────────────────────────

const stats = computed(() => {
  const a = analytics.value;
  const draft     = a?.draft_campaigns     ?? 0;
  const scheduled = a?.scheduled_campaigns ?? 0;
  const sent      = a?.sent_campaigns      ?? 0;
  const cancelled = a?.cancelled_campaigns ?? 0;
  return {
    total: a ? draft + scheduled + sent + cancelled : totalMailings.value,
    draft,
    scheduled,
    sent,
    cancelled,
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

const handleCreate = (_campaign: Campaign) => {
  isCreateModalOpen.value = false;
  currentPage.value = 1;
  loadData();
};

const refresh = () => loadData();
</script>

<template>
  <div class="h-full overflow-hidden flex flex-col bg-gray-50">
    <!-- Header -->
    <div
      class="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex-shrink-0"
    >
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-lg font-semibold text-gray-900">Рассылки</h1>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            @click="showStatsPanel = !showStatsPanel"
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors"
            :class="
              showStatsPanel
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'text-gray-700 border-gray-200 hover:bg-gray-50'
            "
            title="Статистика"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span class="hidden sm:inline">Статистика</span>
          </button>
          <button
            @click="refresh"
            :disabled="isLoading"
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <AppIcon
              name="refresh-cw"
              :size="14"
              :class="{ 'animate-spin': isLoading }"
            />
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
        :mailings="mailings"
        :loading="isLoading"
        :total="totalMailings"
        :current-page="currentPage"
        :page-size="PAGE_SIZE"
        @view-mailing="openDetails"
        @page-change="onPageChange"
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
      @sent="(id) => {
        const m = mailings.find(x => x.id === id);
        if (m) m.status = 'sending';
      }"
      @cancelled="(id) => {
        const m = mailings.find(x => x.id === id);
        if (m) m.status = 'cancelled';
      }"
      @updated="(m) => {
        const idx = mailings.findIndex(x => x.id === m.id);
        if (idx !== -1) mailings[idx] = m;
        selectedMailing = m;
      }"
    />
  </div>
</template>

<style scoped>
.fold-enter-active {
  transition: all 200ms ease-out;
  overflow: hidden;
}
.fold-leave-active {
  transition: all 150ms ease-in;
  overflow: hidden;
}
.fold-enter-from,
.fold-leave-to {
  opacity: 0;
  max-height: 0;
}
.fold-enter-to,
.fold-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
