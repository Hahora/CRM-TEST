<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import AppIcon from "@/components/AppIcon.vue";
import SalesFilters from "@/components/sales/SalesFilters.vue";
import SalesTable from "@/components/sales/SalesTable.vue";
import SalesStats from "@/components/sales/SalesStats.vue";
import CreateSaleModal from "@/components/sales/CreateSaleModal.vue";

interface Sale {
  id: string;
  clientName: string;
  clientType: "individual" | "company";
  amount: number;
  status: "pending" | "completed" | "cancelled";
  products: string[];
  manager: string;
  branch: string;
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

interface SalesFilters {
  search: string;
  status: string;
  branch: string;
  manager: string;
  dateFrom: string;
  dateTo: string;
}

const sales = ref<Sale[]>([
  {
    id: "1",
    clientName: 'ООО "Рога и копыта"',
    clientType: "company",
    amount: 125000,
    status: "completed",
    products: ["Оборудование А", "Услуга Б"],
    manager: "Иван Петров",
    branch: "Главный офис",
    createdAt: "2024-01-15T10:30:00",
    completedAt: "2024-01-15T14:20:00",
    notes: "Постоянный клиент, скидка 5%",
  },
  {
    id: "2",
    clientName: "Василий Сидоров",
    clientType: "individual",
    amount: 67500,
    status: "pending",
    products: ["Товар В"],
    manager: "Анна Смирнова",
    branch: "Филиал №1",
    createdAt: "2024-01-15T11:45:00",
    notes: "Ожидает подтверждения",
  },
  {
    id: "3",
    clientName: "ИП Морозов А.В.",
    clientType: "company",
    amount: 89000,
    status: "completed",
    products: ["Услуга Г", "Товар Д"],
    manager: "Петр Николаев",
    branch: "Филиал №2",
    createdAt: "2024-01-14T16:20:00",
    completedAt: "2024-01-15T09:15:00",
  },
  {
    id: "4",
    clientName: 'ООО "Стройка+"',
    clientType: "company",
    amount: 156000,
    status: "cancelled",
    products: ["Оборудование Е"],
    manager: "Мария Иванова",
    branch: "Главный офис",
    createdAt: "2024-01-14T14:10:00",
    notes: "Клиент отказался от покупки",
  },
  {
    id: "5",
    clientName: "Елена Волкова",
    clientType: "individual",
    amount: 34500,
    status: "pending",
    products: ["Товар Ж"],
    manager: "Иван Петров",
    branch: "Филиал №3",
    createdAt: "2024-01-15T13:30:00",
  },
]);

const filters = ref<SalesFilters>({
  search: "",
  status: "all",
  branch: "all",
  manager: "all",
  dateFrom: "",
  dateTo: "",
});

const isCreateModalOpen = ref(false);
const selectedSale = ref<Sale | null>(null);
const isLoading = ref(false);

const filteredSales = computed(() => {
  let result = sales.value;

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase();
    result = result.filter(
      (sale) =>
        sale.clientName.toLowerCase().includes(search) ||
        sale.products.some((product) => product.toLowerCase().includes(search))
    );
  }

  if (filters.value.status !== "all") {
    result = result.filter((sale) => sale.status === filters.value.status);
  }

  if (filters.value.branch !== "all") {
    result = result.filter((sale) => sale.branch === filters.value.branch);
  }

  if (filters.value.manager !== "all") {
    result = result.filter((sale) => sale.manager === filters.value.manager);
  }

  return result;
});

const salesStats = computed(() => {
  const total = filteredSales.value.length;
  const completed = filteredSales.value.filter(
    (s) => s.status === "completed"
  ).length;
  const pending = filteredSales.value.filter(
    (s) => s.status === "pending"
  ).length;
  const cancelled = filteredSales.value.filter(
    (s) => s.status === "cancelled"
  ).length;
  const totalAmount = filteredSales.value
    .filter((s) => s.status === "completed")
    .reduce((sum, sale) => sum + sale.amount, 0);

  return {
    total,
    completed,
    pending,
    cancelled,
    totalAmount,
    conversionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
});

const openCreateModal = () => {
  isCreateModalOpen.value = true;
};

const closeCreateModal = () => {
  isCreateModalOpen.value = false;
};

const handleCreateSale = (saleData: any) => {
  const newSale: Sale = {
    id: Date.now().toString(),
    ...saleData,
    createdAt: new Date().toISOString(),
  };
  sales.value.unshift(newSale);
  closeCreateModal();
};

const handleUpdateFilters = (newFilters: SalesFilters) => {
  filters.value = { ...newFilters };
};

const refreshData = async () => {
  isLoading.value = true;

  // Имитация загрузки данных с сервера
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Здесь будет логика обновления данных с API
  console.log("Данные продаж обновлены");

  isLoading.value = false;
};

const exportSales = () => {
  // Здесь будет логика экспорта
  console.log("Экспорт продаж");
};

onMounted(() => {
  console.log("Sales page loaded");
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-4 md:py-6">
      <div
        class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Продажи</h1>
          <p class="text-sm md:text-base text-gray-600 mt-1">
            Управление продажами и сделками
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="exportSales"
            class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <AppIcon name="file-text" :size="16" />
            Экспорт
          </button>
          <button
            @click="refreshData"
            :disabled="isLoading"
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <AppIcon
              name="refresh-cw"
              :size="16"
              :class="{
                'transition-transform': true,
                'animate-spin': isLoading,
              }"
            />
            {{ isLoading ? "Обновление..." : "Обновить" }}
          </button>
          <!-- <button
                @click="openCreateModal"
                class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <AppIcon name="trending-up" :size="16" />
                Новая продажа
              </button> -->
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
            >Обновление данных продаж...</span
          >
        </div>
      </div>

      <!-- Stats -->
      <SalesStats :stats="salesStats" />

      <!-- Filters -->
      <SalesFilters :filters="filters" @update:filters="handleUpdateFilters" />

      <!-- Sales Table -->
      <SalesTable
        :sales="filteredSales"
        :loading="isLoading"
        @view-sale="selectedSale = $event"
      />
    </div>

    <!-- Create Sale Modal -->
    <CreateSaleModal
      :is-open="isCreateModalOpen"
      @close="closeCreateModal"
      @create="handleCreateSale"
    />
  </div>
</template>
