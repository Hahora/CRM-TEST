import { ref, computed } from "vue";
import {
  clientsApi,
  type UpdateClientData,
  type SalesStats,
} from "@/services/clientsApi";
import { useToast } from "@/composables/useToast";
import type { Client, ClientsFilters, CreateClientData } from "@/types/clients";

const PAGE_SIZE = 50;

export const useClients = () => {
  const { showSuccess, showError } = useToast();

  // State
  const clients = ref<Client[]>([]);
  const totalClients = ref(0);
  const stats = ref<SalesStats>({
    total_sales_amount: 0,
    total_sales_count: 0,
    average_receipt: 0,
    period_from: "",
    period_to: "",
  });

  // Loading states
  const isLoadingClients = ref(false);
  const isLoadingMore = ref(false);
  const isLoadingStats = ref(false);
  const isCreatingClient = ref(false);
  const isUpdatingClient = ref(false);
  const isExporting = ref(false);

  // Бесконечная подгрузка
  const currentOffset = ref(0);
  const hasMore = ref(true);

  // Computed
  const hasClients = computed(() => clients.value.length > 0);
  const isEmpty = computed(
    () => !isLoadingClients.value && clients.value.length === 0
  );

  // Сохранённые фильтры для loadMore
  let lastFilters: ClientsFilters = {};

  // ══════════════════════════════════════════
  // Маппинг ClientsFilters → ClientsFiltersApi
  // Сервер: offset (с какой записи), limit (1-1000, дефолт 25)
  // search — поиск по имени/телефону/email
  // ══════════════════════════════════════════
  const buildApiFilters = (filters: ClientsFilters, offset: number) => ({
    search: filters.search || undefined,
    is_wedding: filters.is_wedding ?? undefined,
    source: filters.source || undefined,
    has_local_data: filters.has_local_data ?? undefined,
    telegram_id: filters.telegram_id || undefined,
    offset,
    limit: PAGE_SIZE,
  });

  // Дедупликация по moysklad_id (или id) — на случай если сервер вернёт пересечения
  const deduplicateClients = (list: Client[]): Client[] => {
    const seen = new Set<string>();
    return list.filter((c) => {
      // Используем moysklad_id как основной ключ, фолбэк на id
      const key = c.moysklad_id || (c.id != null ? `id_${c.id}` : null);
      if (!key) return true; // если нет ни id ни moysklad_id — оставляем
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // ── Загрузить первую порцию (сброс) ──
  const loadClients = async (filters: ClientsFilters = {}) => {
    try {
      isLoadingClients.value = true;
      lastFilters = { ...filters };

      const response = await clientsApi.getClients(buildApiFilters(filters, 0));

      const items = response.clients || [];
      clients.value = deduplicateClients(items);
      totalClients.value = response.total || 0;
      currentOffset.value = clients.value.length;
      hasMore.value = clients.value.length < totalClients.value;
    } catch (error) {
      console.error("Ошибка загрузки клиентов:", error);
      showError("Ошибка загрузки клиентов");
      clients.value = [];
      totalClients.value = 0;
    } finally {
      isLoadingClients.value = false;
    }
  };

  // ── Подгрузить следующую порцию (бесконечный скролл) ──
  const loadMore = async () => {
    if (!hasMore.value || isLoadingMore.value || isLoadingClients.value) return;

    isLoadingMore.value = true;
    try {
      const response = await clientsApi.getClients(
        buildApiFilters(lastFilters, currentOffset.value)
      );

      const newItems = response.clients || [];
      if (newItems.length > 0) {
        // Склеиваем и дедуплицируем
        const merged = [...clients.value, ...newItems];
        clients.value = deduplicateClients(merged);
        currentOffset.value = clients.value.length;
      }

      totalClients.value = response.total || totalClients.value;
      hasMore.value = clients.value.length < totalClients.value;

      // Если сервер вернул 0 новых — больше нечего грузить
      if (newItems.length === 0) {
        hasMore.value = false;
      }
    } catch (error) {
      console.error("Ошибка подгрузки клиентов:", error);
    } finally {
      isLoadingMore.value = false;
    }
  };

  const loadStats = async () => {
    try {
      isLoadingStats.value = true;
      const response = await clientsApi.getSalesStats();
      stats.value = response;
    } catch (error) {
      console.error("Ошибка загрузки статистики:", error);
      stats.value = {
        total_sales_amount: 0,
        total_sales_count: 0,
        average_receipt: 0,
        period_from: "",
        period_to: "",
      };
    } finally {
      isLoadingStats.value = false;
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
      console.error("Ошибка создания клиента:", error);
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

      // Обновляем в списке
      const index = clients.value.findIndex((c) => c.id === clientId);
      if (index !== -1) {
        clients.value[index] = updatedClient;
      }

      showSuccess("Клиент успешно обновлён");
      return updatedClient;
    } catch (error) {
      console.error("Ошибка обновления клиента:", error);
      showError("Ошибка обновления клиента");
      throw error;
    } finally {
      isUpdatingClient.value = false;
    }
  };

  // ── Поиск клиента (по телефону, имени, email) ──
  const searchByPhone = async (phone: string) => {
    return clientsApi.searchByPhone(phone);
  };

  const searchByName = async (name: string) => {
    return clientsApi.searchByName(name);
  };

  const searchByEmail = async (email: string) => {
    return clientsApi.searchByEmail(email);
  };

  const exportClients = async (
    filters: {
      created_after?: string;
      created_before?: string;
    } = {}
  ) => {
    try {
      isExporting.value = true;
      const blob = await clientsApi.exportClients(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const today = new Date()
        .toLocaleDateString("ru-RU", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
        .replace(/\./g, "-");
      link.download = `клиенты_экспорт_${today}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess("Экспорт клиентов завершён");
    } catch (error) {
      console.error("Ошибка экспорта клиентов:", error);
      showError("Ошибка экспорта клиентов");
    } finally {
      isExporting.value = false;
    }
  };

  const refreshData = async (filters: ClientsFilters = {}) => {
    await Promise.all([loadClients(filters), loadStats()]);
  };

  return {
    // State
    clients,
    totalClients,
    stats,
    hasMore,

    // Loading states
    isLoadingClients,
    isLoadingMore,
    isLoadingStats,
    isCreatingClient,
    isUpdatingClient,
    isExporting,

    // Computed
    hasClients,
    isEmpty,

    // Methods
    loadClients,
    loadMore,
    loadStats,
    createClient,
    updateClient,
    searchByPhone,
    searchByName,
    searchByEmail,
    exportClients,
    refreshData,
  };
};
