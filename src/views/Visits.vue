<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useVisits } from "@/composables/useVisits";
import AppIcon from "@/components/AppIcon.vue";
import VisitsStats from "@/components/visits/VisitsStats.vue";
import VisitsFilters from "@/components/visits/VisitsFilters.vue";
import VisitsTable from "@/components/visits/VisitsTable.vue";
import CreateVisitModal from "@/components/visits/CreateVisitModal.vue";
import VisitDetailsModal from "@/components/visits/VisitDetailsModal.vue";
import EditVisitModal from "@/components/visits/EditVisitModal.vue";
import ExportVisitsModal from "@/components/visits/ExportVisitsModal.vue";
import type {
  Visit,
  VisitsFilters as VisitsFiltersType,
  CreateVisitData,
  ExportFilters,
} from "@/types/visits";

const {
  visits,
  totalVisits,
  currentPage,
  perPage,
  stats,
  isLoadingVisits,
  isLoadingStats,
  isCreatingVisit,
  isExporting,
  loadVisits,
  loadStats,
  createVisit,
  exportVisits,
  refreshData,
  setPage,
  setPerPage,
  getVisitDetails,
  updateVisit,
  isUpdatingVisit,
} = useVisits();

// Modal states
const isCreateModalOpen = ref(false);
const isDetailsModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isExportModalOpen = ref(false);
const selectedVisit = ref<Visit | null>(null);
const isLoadingVisitDetails = ref(false);

// Фильтры
const filters = ref<VisitsFiltersType>({
  search: "",
  status: "all",
  branch_id: undefined,
  employee_id: undefined,
  start_date: "",
  end_date: "",
});

// Загрузка данных при монтировании
onMounted(async () => {
  const statsFilters = {
    start_date: filters.value.start_date || undefined,
    end_date: filters.value.end_date || undefined,
    branch_id: filters.value.branch_id
      ? Number(filters.value.branch_id)
      : undefined,
  };

  await Promise.all([loadVisits(filters.value), loadStats(statsFilters)]);
});

// Отслеживание изменений фильтров
watch(
  filters,
  async (newFilters) => {
    await loadVisits(newFilters);

    const statsFilters = {
      start_date: newFilters.start_date || undefined,
      end_date: newFilters.end_date || undefined,
      branch_id: newFilters.branch_id
        ? Number(newFilters.branch_id)
        : undefined,
    };
    await loadStats(statsFilters);
  },
  { deep: true }
);

// Обработчики модальных окон
const openCreateModal = () => {
  isCreateModalOpen.value = true;
};

const openDetailsModal = async (visit: Visit) => {
  try {
    isLoadingVisitDetails.value = true;
    selectedVisit.value = visit; // Показываем базовые данные сразу
    isDetailsModalOpen.value = true;

    // Загружаем полные данные посещения
    const fullVisitData = await getVisitDetails(Number(visit.id));
    selectedVisit.value = fullVisitData;
  } catch (error) {
    console.error("Error loading visit details:", error);
  } finally {
    isLoadingVisitDetails.value = false;
  }
};

const closeDetailsModal = () => {
  isDetailsModalOpen.value = false;
  selectedVisit.value = null;
  isLoadingVisitDetails.value = false;
};

const handleEditVisit = (visit: Visit) => {
  selectedVisit.value = visit;
  isDetailsModalOpen.value = false; // Закрываем модальное окно деталей
  isEditModalOpen.value = true; // Открываем модальное окно редактирования
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
  selectedVisit.value = null;
};

const handleUpdateVisit = async (visitData: any) => {
  try {
    if (!selectedVisit.value) return;

    await updateVisit(Number(selectedVisit.value.id), visitData);

    // Закрываем модальное окно
    isEditModalOpen.value = false;
    selectedVisit.value = null;

    // Обновляем данные
    await refreshData(filters.value);
  } catch (error) {
    console.error("Error updating visit:", error);
  }
};

const openExportModal = () => {
  isExportModalOpen.value = true;
};

const closeExportModal = () => {
  isExportModalOpen.value = false;
};

// Обработчики действий
const handleCreateVisit = async (visitData: CreateVisitData) => {
  try {
    await createVisit(visitData);
    isCreateModalOpen.value = false;
    await refreshData(filters.value);
  } catch (error) {
    console.error("Error creating visit:", error);
  }
};

const handlePageChange = async (page: number) => {
  setPage(page);
  await loadVisits(filters.value);
};

const handlePerPageChange = async (newPerPage: number) => {
  setPerPage(newPerPage);
  setPage(1); // Сбрасываем на первую страницу
  await loadVisits(filters.value);
};

const handleFiltersChange = (newFilters: VisitsFiltersType) => {
  filters.value = { ...newFilters };
  setPage(1); // Сбрасываем на первую страницу при изменении фильтров
};

const handleExportWithFilters = async (filters: ExportFilters) => {
  try {
    await exportVisits(filters);
    isExportModalOpen.value = false;
  } catch (error) {
    console.error("Error exporting visits:", error);
  }
};

const handleRefresh = async () => {
  await refreshData(filters.value);
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="px-4 md:px-6 py-4 md:py-6">
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 class="text-2xl md:text-3xl font-bold text-gray-900">
              Посещения
            </h1>
            <p class="text-sm md:text-base text-gray-600 mt-1">
              Управление визитами и встречами с клиентами
            </p>
          </div>

          <div class="flex items-center gap-2 md:gap-3">
            <button
              @click="openExportModal"
              :disabled="isLoadingVisits || isExporting"
              class="px-3 py-2 md:px-4 md:py-2 border border-gray-300 text-gray-700 text-xs md:text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2"
            >
              <AppIcon
                name="file-text"
                :size="14"
                class="md:w-4 md:h-4"
                :class="{ 'animate-pulse': isExporting }"
              />
              <span class="hidden sm:inline">
                {{ isExporting ? "Экспорт..." : "Экспорт" }}
              </span>
            </button>
            <button
              @click="handleRefresh"
              :disabled="isLoadingVisits || isLoadingStats"
              class="px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white text-xs md:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2"
            >
              <AppIcon
                name="refresh-cw"
                :size="14"
                class="[ 'transition-transform md:w-4 md:h-4', { 'animate-spin': isLoadingVisits || isLoadingStats }, ]"
              />
              <span class="hidden sm:inline">{{
                isLoadingVisits || isLoadingStats ? "Обновление..." : "Обновить"
              }}</span>
            </button>
            <button
              @click="openCreateModal"
              class="px-3 py-2 md:px-4 md:py-2 bg-orange-600 text-white text-xs md:text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-1 md:gap-2"
            >
              <AppIcon name="map-pin" :size="14" class="md:w-4 md:h-4" />
              <span class="hidden sm:inline">Новое посещение</span>
              <span class="sm:hidden">Новое</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="p-4 md:p-6 space-y-6">
      <!-- Stats -->
      <VisitsStats :stats="stats" :loading="isLoadingStats" />

      <!-- Filters -->
      <VisitsFilters :filters="filters" @update:filters="handleFiltersChange" />

      <!-- Visits Table -->
      <VisitsTable
        :visits="visits"
        :loading="isLoadingVisits"
        :current-page="currentPage"
        :per-page="perPage"
        :total="totalVisits"
        @view-visit="openDetailsModal"
        @page-change="handlePageChange"
        @per-page-change="handlePerPageChange"
      />
    </div>

    <!-- Create Visit Modal -->
    <CreateVisitModal
      :is-open="isCreateModalOpen"
      :is-submitting="isCreatingVisit"
      @close="isCreateModalOpen = false"
      @create="handleCreateVisit"
    />

    <!-- Visit Details Modal -->
    <VisitDetailsModal
      :is-open="isDetailsModalOpen"
      :visit="selectedVisit"
      :loading="isLoadingVisitDetails"
      @close="closeDetailsModal"
      @edit="handleEditVisit"
    />

    <!-- Edit Visit Modal -->
    <EditVisitModal
      :is-open="isEditModalOpen"
      :visit="selectedVisit"
      :is-submitting="isUpdatingVisit"
      @close="closeEditModal"
      @update="handleUpdateVisit"
    />

    <!-- Export Visits Modal -->
    <ExportVisitsModal
      :is-open="isExportModalOpen"
      :is-exporting="isExporting"
      @close="closeExportModal"
      @export="handleExportWithFilters"
    />
  </div>
</template>
