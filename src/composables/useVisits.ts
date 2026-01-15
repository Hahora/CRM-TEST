import { ref, computed } from "vue";
import { visitsApi } from "@/services/visitsApi";
import { useToast } from "@/composables/useToast";
import type {
  Visit,
  VisitsStats,
  VisitsFilters,
  CreateVisitData,
  UpdateVisitData,
  VisitFeedback,
} from "@/types/visits";

export const useVisits = () => {
  const { showSuccess, showError } = useToast();

  // Reactive state
  const visits = ref<Visit[]>([]);
  const totalVisits = ref(0);
  const currentPage = ref(1);
  const perPage = ref(10);
  const stats = ref<VisitsStats>({
    total_visits: 0,
    by_status: {
      "zapla nirovano": 0,
      zapisalsya: 0,
      prishel: 0,
      ne_prishel: 0,
      otlozhil_s_depozitom: 0,
      otlozhil_do_vechera: 0,
      kupil: 0,
      sdelka_provalena: 0,
    },
    by_branch: [],
    conversion_rate: 0,
    total_purchase_amount: 0,
    average_purchase_amount: 0,
    purchased_items_summary: [],
  });

  // Loading states
  const isLoadingVisits = ref(false);
  const isLoadingStats = ref(false);
  const isCreatingVisit = ref(false);
  const isUpdatingVisit = ref(false);
  const isExporting = ref(false);

  // Computed
  const totalPages = computed(() =>
    Math.ceil(totalVisits.value / perPage.value)
  );
  const hasVisits = computed(() => visits.value.length > 0);
  const isEmpty = computed(
    () => !isLoadingVisits.value && visits.value.length === 0
  );

  // Methods - ВСЕ ФУНКЦИИ ДОЛЖНЫ БЫТЬ НА ОДНОМ УРОВНЕ С loadVisits

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

      const apiFilters = {
        search: filters.search,
        client_id: filters.client_id ? parseInt(filters.client_id) : undefined,
        employee_id: filters.employee_id
          ? parseInt(filters.employee_id)
          : undefined,
        branch_id: filters.branch_id ? parseInt(filters.branch_id) : undefined,
        status: filters.status !== "all" ? filters.status : undefined,
        start_date: filters.start_date,
        end_date: filters.end_date,
        skip: (currentPage.value - 1) * perPage.value,
        limit: perPage.value,
      };

      const response = await visitsApi.getVisits(apiFilters);

      visits.value = response.visits || [];
      totalVisits.value = response.total || 0;
    } catch (error) {
      console.error("Load visits error:", error);
      showError("Ошибка загрузки посещений");
      visits.value = [];
      totalVisits.value = 0;
    } finally {
      isLoadingVisits.value = false;
    }
  };

  const loadStats = async (
    filters: {
      start_date?: string;
      end_date?: string;
      branch_id?: number;
    } = {}
  ) => {
    try {
      isLoadingStats.value = true;
      const response = await visitsApi.getVisitsStats(filters);
      stats.value = response;
    } catch (error) {
      console.error("Load stats error:", error);
      showError("Ошибка загрузки статистики");
      stats.value = {
        total_visits: 0,
        by_status: {
          "zapla nirovano": 0,
          zapisalsya: 0,
          prishel: 0,
          ne_prishel: 0,
          otlozhil_s_depozitom: 0,
          otlozhil_do_vechera: 0,
          kupil: 0,
          sdelka_provalena: 0,
        },
        by_branch: [],
        conversion_rate: 0,
        total_purchase_amount: 0,
        average_purchase_amount: 0,
        purchased_items_summary: [],
      };
    } finally {
      isLoadingStats.value = false;
    }
  };

  const getVisitDetails = async (visitId: number): Promise<Visit> => {
    try {
      const visit = await visitsApi.getVisit(visitId);
      return visit;
    } catch (error) {
      console.error("Get visit details error:", error);
      showError("Ошибка загрузки данных посещения");
      throw error;
    }
  };

  const createVisit = async (visitData: CreateVisitData): Promise<Visit> => {
    try {
      isCreatingVisit.value = true;
      const newVisit = await visitsApi.createVisit(visitData);
      showSuccess("Посещение успешно создано");
      return newVisit;
    } catch (error) {
      console.error("Create visit error:", error);
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
      const updatedVisit = await visitsApi.updateVisit(visitId, visitData);

      // Обновляем посещение в локальном списке
      const index = visits.value.findIndex((v) => v.id === visitId.toString());
      if (index !== -1) {
        visits.value[index] = updatedVisit;
      }

      showSuccess("Посещение успешно обновлено");
      return updatedVisit;
    } catch (error) {
      console.error("Update visit error:", error);
      showError("Ошибка обновления посещения");
      throw error;
    } finally {
      isUpdatingVisit.value = false;
    }
  };

  const addVisitFeedback = async (
    visitId: number,
    feedback: VisitFeedback
  ): Promise<Visit> => {
    try {
      const updatedVisit = await visitsApi.addVisitFeedback(visitId, feedback);

      // Обновляем посещение в локальном списке
      const index = visits.value.findIndex((v) => v.id === visitId.toString());
      if (index !== -1) {
        visits.value[index] = updatedVisit;
      }

      showSuccess("Отзыв успешно добавлен");
      return updatedVisit;
    } catch (error) {
      console.error("Add feedback error:", error);
      showError("Ошибка добавления отзыва");
      throw error;
    }
  };

  const exportVisits = async (
    filters: {
      start_date?: string;
      end_date?: string;
      branch_id?: number;
    } = {}
  ) => {
    try {
      isExporting.value = true;
      const blob = await visitsApi.exportVisits(filters);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      let fileName = "visits_export";
      if (filters.start_date || filters.end_date) {
        const from = filters.start_date || "start";
        const to = filters.end_date || "end";
        fileName += `_${from}_${to}`;
      } else {
        fileName += `_${new Date().toISOString().split("T")[0]}`;
      }
      fileName += ".xlsx";

      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess("Экспорт посещений завершен");
    } catch (error) {
      console.error("Export visits error:", error);
      showError("Ошибка экспорта посещений");
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
      loadStats({
        start_date: filters.start_date,
        end_date: filters.end_date,
        branch_id: filters.branch_id ? parseInt(filters.branch_id) : undefined,
      }),
    ]);
  };

  // Pagination methods
  const setPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page;
    }
  };

  const setPerPage = (newPerPage: number) => {
    perPage.value = newPerPage;
    currentPage.value = 1;
  };

  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++;
    }
  };

  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--;
    }
  };

  const goToFirstPage = () => {
    currentPage.value = 1;
  };

  const goToLastPage = () => {
    currentPage.value = totalPages.value;
  };

  return {
    // State
    visits,
    totalVisits,
    currentPage,
    perPage,
    stats,

    // Loading states
    isLoadingVisits,
    isLoadingStats,
    isCreatingVisit,
    isUpdatingVisit,
    isExporting,

    // Computed
    totalPages,
    hasVisits,
    isEmpty,

    // Methods
    loadVisits,
    loadStats,
    getVisitDetails,
    createVisit,
    updateVisit,
    addVisitFeedback,
    exportVisits,
    refreshData,

    // Pagination
    setPage,
    setPerPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
  };
};
