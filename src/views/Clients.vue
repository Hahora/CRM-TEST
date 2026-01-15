<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useClients } from "@/composables/useClients";
import AppIcon from "@/components/AppIcon.vue";
import ClientsStats from "@/components/clients/ClientsStats.vue";
import ClientsFiltersComponent from "@/components/clients/ClientsFilters.vue";
import ClientsTable from "@/components/clients/ClientsTable.vue";
import CreateClientModal from "@/components/clients/CreateClientModal.vue";
import ClientDetailsModal from "@/components/clients/ClientDetailsModal.vue";
import EditClientModal from "@/components/clients/EditClientModal.vue";
import ExportClientsModal from "@/components/clients/ExportClientsModal.vue";
import type { IconName } from "@/components/icons";
import type {
  Client,
  ClientsFilters as ClientsFiltersType,
  CreateClientData,
} from "@/types/clients";
import type { UpdateClientData } from "@/services/clientsApi";

const {
  clients,
  totalClients,
  currentPage,
  perPage,
  stats,
  isLoadingStats,
  isLoadingClients,
  isUpdatingClient,
  isExporting, // Добавил это!
  loadClients,
  loadStats,
  createClient,
  updateClient,
  exportClients,
  refreshData,
  setPage,
  setPerPage,
  getClientDetails,
} = useClients();

// Modal states
const isCreateModalOpen = ref(false);
const isDetailsModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isExportModalOpen = ref(false);
const selectedClient = ref<Client | null>(null);
const isLoadingClientDetails = ref(false);

// Фильтры
const filters = ref<ClientsFiltersType>({
  search: "",
  dateFrom: "",
  dateTo: "",
});

// Загрузка данных при монтировании
onMounted(async () => {
  await Promise.all([loadClients(filters.value), loadStats(filters.value)]);
});

// Отслеживание изменений фильтров
watch(
  filters,
  async (newFilters) => {
    await loadClients(newFilters);
    await loadStats(newFilters);
  },
  { deep: true }
);

// Обработчики модальных окон
const openCreateModal = () => {
  isCreateModalOpen.value = true;
};

const openDetailsModal = async (client: Client) => {
  try {
    isLoadingClientDetails.value = true;
    selectedClient.value = client;
    isDetailsModalOpen.value = true;

    const fullClientData = await getClientDetails(client.id);
    selectedClient.value = fullClientData;
  } catch (error) {
    console.error("Error loading client details:", error);
  } finally {
    isLoadingClientDetails.value = false;
  }
};

const closeDetailsModal = () => {
  isDetailsModalOpen.value = false;
  selectedClient.value = null;
  isLoadingClientDetails.value = false;
};

const openEditModal = (client: Client) => {
  selectedClient.value = client;
  isDetailsModalOpen.value = false;
  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
  selectedClient.value = null;
};

const openExportModal = () => {
  isExportModalOpen.value = true;
};

const closeExportModal = () => {
  isExportModalOpen.value = false;
};

// Обработчики действий
const handleCreateClient = async (clientData: CreateClientData) => {
  try {
    await createClient(clientData);
    isCreateModalOpen.value = false;
    await refreshData(filters.value);
  } catch (error) {
    console.error("Error creating client:", error);
  }
};

const handleUpdateClient = async (clientData: UpdateClientData) => {
  if (!selectedClient.value) return;

  try {
    const updatedClient = await updateClient(
      selectedClient.value.id,
      clientData
    );
    selectedClient.value = updatedClient;
    isEditModalOpen.value = false;
    await refreshData(filters.value);
  } catch (error) {
    console.error("Error updating client:", error);
  }
};

const handleExportWithFilters = async (exportFilters: {
  created_after?: string;
  created_before?: string;
}) => {
  try {
    await exportClients(exportFilters);
    isExportModalOpen.value = false;
  } catch (error) {
    console.error("Error exporting clients:", error);
  }
};

const handlePageChange = async (page: number) => {
  setPage(page);
  await loadClients(filters.value);
};

const handlePerPageChange = async (newPerPage: number) => {
  setPerPage(newPerPage);
  setPage(1);
  await loadClients(filters.value);
};

const handleFiltersChange = (newFilters: ClientsFiltersType) => {
  filters.value = { ...newFilters };
  setPage(1);
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
              Клиенты
            </h1>
            <p class="text-sm md:text-base text-gray-600 mt-1">
              Управление базой клиентов и их данными
            </p>
          </div>

          <div class="flex items-center gap-2 md:gap-3">
            <button
              @click="openExportModal"
              :disabled="isLoadingClients || isExporting"
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
              :disabled="isLoadingClients || isLoadingStats"
              class="px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white text-xs md:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2"
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
              @click="openCreateModal"
              class="px-3 py-2 md:px-4 md:py-2 bg-green-600 text-white text-xs md:text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 md:gap-2"
            >
              <AppIcon name="user-plus" :size="14" class="md:w-4 md:h-4" />
              <span class="hidden sm:inline">Новый клиент</span>
              <span class="sm:hidden">Новый</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="p-4 md:p-6 space-y-6">
      <!-- Stats -->
      <ClientsStats :stats="stats" :loading="isLoadingStats" />

      <!-- Filters -->
      <ClientsFiltersComponent
        :filters="filters"
        @update:filters="handleFiltersChange"
      />

      <!-- Table -->
      <ClientsTable
        :clients="clients"
        :loading="isLoadingClients"
        :current-page="currentPage"
        :per-page="perPage"
        :total="totalClients"
        @view-client="openDetailsModal"
        @page-change="handlePageChange"
        @per-page-change="handlePerPageChange"
      />
    </div>

    <!-- Create Client Modal -->
    <CreateClientModal
      :is-open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @create="handleCreateClient"
    />

    <!-- Client Details Modal -->
    <ClientDetailsModal
      :is-open="isDetailsModalOpen"
      :client="selectedClient"
      :loading="isLoadingClientDetails"
      @close="closeDetailsModal"
      @edit="openEditModal"
    />

    <!-- Edit Client Modal -->
    <EditClientModal
      :is-open="isEditModalOpen"
      :client="selectedClient"
      :is-submitting="isUpdatingClient"
      @close="closeEditModal"
      @update="handleUpdateClient"
    />

    <!-- Export Clients Modal -->
    <ExportClientsModal
      :is-open="isExportModalOpen"
      :is-exporting="isExporting"
      @close="closeExportModal"
      @export="handleExportWithFilters"
    />
  </div>
</template>
