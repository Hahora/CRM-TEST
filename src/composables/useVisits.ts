// composables/useVisits.ts

import { ref, computed } from "vue";
import { visitsApi } from "@/services/visitsApi";
import { useToast } from "@/composables/useToast";
import type {
  Visit,
  VisitsStats,
  VisitsFilters,
  CreateVisitData,
  UpdateVisitData,
} from "@/types/visits";

export const useVisits = () => {
  const { showSuccess, showError } = useToast();

  const visits = ref<Visit[]>([]);
  const totalVisits = ref(0);
  const stats = ref<VisitsStats>({
    total_visits: 0,
    by_status: {},
    by_branch: [],
    conversion_rate: 0,
    total_purchase_amount: 0,
    average_purchase_amount: 0,
    purchased_items_summary: [],
  });

  const isLoadingVisits = ref(false);
  const isLoadingStats = ref(false);
  const isCreatingVisit = ref(false);
  const isUpdatingVisit = ref(false);
  const isExporting = ref(false);

  const hasVisits = computed(() => visits.value.length > 0);
  const isEmpty = computed(
    () => !isLoadingVisits.value && visits.value.length === 0
  );

  const loadVisits = async (
    filters: VisitsFilters = {
      search: "",
      status: "",
      start_date: "",
      end_date: "",
    }
  ) => {
    try {
      isLoadingVisits.value = true;
      const response = await visitsApi.getVisits({
        search: filters.search || undefined,
        status:
          filters.status && filters.status !== "all"
            ? filters.status
            : undefined,
        branch_id: filters.branch_id ? Number(filters.branch_id) : undefined,
        employee_id: filters.employee_id
          ? Number(filters.employee_id)
          : undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
        skip: 0,
        limit: 200, // Загружаем все за день
      });
      visits.value = response.visits || [];
      totalVisits.value = response.total || 0;
    } catch (error) {
      console.error("Ошибка загрузки посещений:", error);
      showError("Ошибка загрузки посещений");
      visits.value = [];
      totalVisits.value = 0;
    } finally {
      isLoadingVisits.value = false;
    }
  };

  const loadStats = async (
    filters: { start_date?: string; end_date?: string; branch_id?: number } = {}
  ) => {
    try {
      isLoadingStats.value = true;
      stats.value = await visitsApi.getVisitsStats(filters);
    } catch (error) {
      console.error("Ошибка загрузки статистики:", error);
    } finally {
      isLoadingStats.value = false;
    }
  };

  const createVisit = async (visitData: CreateVisitData): Promise<Visit> => {
    try {
      isCreatingVisit.value = true;
      const v = await visitsApi.createVisit(visitData);
      showSuccess("Посещение создано");
      return v;
    } catch (error) {
      showError("Ошибка создания посещения");
      throw error;
    } finally {
      isCreatingVisit.value = false;
    }
  };

  const updateVisit = async (
    visitId: number,
    visitData: UpdateVisitData
  ): Promise<Visit> => {
    try {
      isUpdatingVisit.value = true;
      const v = await visitsApi.updateVisit(visitId, visitData);
      const idx = visits.value.findIndex((x) => Number(x.id) === visitId);
      if (idx !== -1) visits.value[idx] = v;
      return v;
    } catch (error) {
      showError("Ошибка обновления посещения");
      throw error;
    } finally {
      isUpdatingVisit.value = false;
    }
  };

  const exportVisits = async (
    filters: { start_date?: string; end_date?: string; branch_id?: number } = {}
  ) => {
    try {
      isExporting.value = true;
      const blob = await visitsApi.exportVisits(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `посещения_${filters.start_date || "all"}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess("Экспорт завершён");
    } catch (error) {
      showError("Ошибка экспорта");
    } finally {
      isExporting.value = false;
    }
  };

  const refreshData = async (
    filters: VisitsFilters = {
      search: "",
      status: "",
      start_date: "",
      end_date: "",
    }
  ) => {
    await Promise.all([
      loadVisits(filters),
      loadStats({ start_date: filters.start_date, end_date: filters.end_date }),
    ]);
  };

  return {
    visits,
    totalVisits,
    stats,
    isLoadingVisits,
    isLoadingStats,
    isCreatingVisit,
    isUpdatingVisit,
    isExporting,
    hasVisits,
    isEmpty,
    loadVisits,
    loadStats,
    createVisit,
    updateVisit,
    exportVisits,
    refreshData,
  };
};
