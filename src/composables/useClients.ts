import { ref, computed } from "vue";
import { clientsApi, type UpdateClientData } from "@/services/clientsApi";
import { useToast } from "@/composables/useToast";
import type {
  Client,
  ClientsStats,
  ClientsFilters,
  CreateClientData,
} from "@/types/clients";

export const useClients = () => {
  const { showSuccess, showError } = useToast();

  // Reactive state
  const clients = ref<Client[]>([]);
  const totalClients = ref(0);
  const currentPage = ref(1);
  const perPage = ref(10);
  const stats = ref<ClientsStats>({
    total_clients: 0,
    total_spent: 0,
    average_purchase: 0,
  });

  // Loading states
  const isLoadingClients = ref(false);
  const isLoadingStats = ref(false);
  const isCreatingClient = ref(false);
  const isUpdatingClient = ref(false);
  const isExporting = ref(false);

  // Computed
  const totalPages = computed(() =>
    Math.ceil(totalClients.value / perPage.value)
  );
  const hasClients = computed(() => clients.value.length > 0);
  const isEmpty = computed(
    () => !isLoadingClients.value && clients.value.length === 0
  );

  // Methods
  const loadClients = async (filters: ClientsFilters = {}) => {
    try {
      isLoadingClients.value = true;

      const apiFilters = {
        search: filters.search,
        created_after: filters.dateFrom,
        created_before: filters.dateTo,
        skip: (currentPage.value - 1) * perPage.value,
        limit: perPage.value,
      };

      const response = await clientsApi.getClients(apiFilters);

      clients.value = response.clients || [];
      totalClients.value = response.total || 0;
    } catch (error) {
      console.error("Load clients error:", error);
      showError("Ошибка загрузки клиентов");
      clients.value = [];
      totalClients.value = 0;
    } finally {
      isLoadingClients.value = false;
    }
  };

  const loadStats = async (filters: ClientsFilters = {}) => {
    try {
      isLoadingStats.value = true;

      const statsFilters = {
        created_after: filters.dateFrom,
        created_before: filters.dateTo,
      };

      const response = await clientsApi.getClientsStats(statsFilters);
      stats.value = response;
    } catch (error) {
      console.error("Load stats error:", error);
      showError("Ошибка загрузки статистики");
      // Устанавливаем значения по умолчанию при ошибке
      stats.value = {
        total_clients: 0,
        total_spent: 0,
        average_purchase: 0,
      };
    } finally {
      isLoadingStats.value = false;
    }
  };

  const getClientDetails = async (clientId: number): Promise<Client> => {
    try {
      const client = await clientsApi.getClient(clientId);
      return client;
    } catch (error) {
      console.error("Get client details error:", error);
      showError("Ошибка загрузки данных клиента");
      throw error;
    }
  };

  const createClient = async (
    clientData: CreateClientData
  ): Promise<Client> => {
    try {
      isCreatingClient.value = true;
      const newClient = await clientsApi.createClient(clientData);
      showSuccess("Клиент успешно создан");
      return newClient;
    } catch (error) {
      console.error("Create client error:", error);
      showError("Ошибка создания клиента");
      throw error;
    } finally {
      isCreatingClient.value = false;
    }
  };

  const updateClient = async (
    clientId: number,
    clientData: UpdateClientData
  ): Promise<Client> => {
    try {
      isUpdatingClient.value = true;
      const updatedClient = await clientsApi.updateClient(clientId, clientData);

      // Обновляем клиента в локальном списке
      const index = clients.value.findIndex((c) => c.id === clientId);
      if (index !== -1) {
        clients.value[index] = updatedClient;
      }

      showSuccess("Клиент успешно обновлен");
      return updatedClient;
    } catch (error) {
      console.error("Update client error:", error);
      showError("Ошибка обновления клиента");
      throw error;
    } finally {
      isUpdatingClient.value = false;
    }
  };

  const exportClients = async (
    filters: {
      created_after?: string;
      created_before?: string;
      branch_id?: number;
    } = {}
  ) => {
    try {
      isExporting.value = true;
      const blob = await clientsApi.exportClients(filters);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Формируем имя файла с датами если они указаны
      let fileName = "clients_export";
      if (filters.created_after || filters.created_before) {
        const from = filters.created_after || "start";
        const to = filters.created_before || "end";
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

      showSuccess("Экспорт клиентов завершен");
    } catch (error) {
      console.error("Export clients error:", error);
      showError("Ошибка экспорта клиентов");
    } finally {
      isExporting.value = false;
    }
  };

  const refreshData = async (filters: ClientsFilters = {}) => {
    await Promise.all([loadClients(filters), loadStats(filters)]);
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
    clients,
    totalClients,
    currentPage,
    perPage,
    stats,

    // Loading states
    isLoadingClients,
    isLoadingStats,
    isCreatingClient,
    isUpdatingClient,
    isExporting,

    // Computed
    totalPages,
    hasClients,
    isEmpty,

    // Methods
    loadClients,
    loadStats,
    getClientDetails,
    createClient,
    updateClient,
    exportClients,
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
