<script setup lang="ts">
import { ref, watch } from "vue";
import AppIcon from "@/components/AppIcon.vue";

interface Props {
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  create: [saleData: any];
}>();

const form = ref({
  clientName: "",
  clientType: "individual",
  amount: 0,
  products: [""],
  manager: "",
  branch: "",
  notes: "",
});

const managers = [
  "Иван Петров",
  "Анна Смирнова",
  "Петр Николаев",
  "Мария Иванова",
];

const branches = ["Главный офис", "Филиал №1", "Филиал №2", "Филиал №3"];

const addProduct = () => {
  form.value.products.push("");
};

const removeProduct = (index: number) => {
  form.value.products.splice(index, 1);
};

const handleSubmit = () => {
  const saleData = {
    ...form.value,
    products: form.value.products.filter((p) => p.trim()),
    status: "pending",
  };
  emit("create", saleData);
  resetForm();
};

const resetForm = () => {
  form.value = {
    clientName: "",
    clientType: "individual",
    amount: 0,
    products: [""],
    manager: "",
    branch: "",
    notes: "",
  };
};

const closeModal = () => {
  emit("close");
  resetForm();
};

watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) {
      resetForm();
    }
  }
);
</script>

<template>
  <!-- Modal Backdrop -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    @click="closeModal"
  >
    <!-- Modal Content -->
    <div
      class="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Header -->
      <div
        class="px-6 py-4 border-b border-gray-200 flex items-center justify-between"
      >
        <h2 class="text-xl font-semibold text-gray-900">Новая продажа</h2>
        <button
          @click="closeModal"
          class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <AppIcon name="chevron-right" :size="20" class="rotate-45" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Client Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Название клиента</label
            >
            <input
              v-model="form.clientName"
              type="text"
              required
              class="w-full px-3 py```vue:src/components/sales/CreateSaleModal.vue -2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Введите название клиента"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Тип клиента</label
            >
            <select
              v-model="form.clientType"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="individual">Физическое лицо</option>
              <option value="company">Юридическое лицо</option>
            </select>
          </div>
        </div>

        <!-- Amount -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Сумма продажи</label
          >
          <input
            v-model.number="form.amount"
            type="number"
            min="0"
            step="100"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0"
          />
        </div>

        <!-- Products -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700"
              >Товары/Услуги</label
            >
            <button
              type="button"
              @click="addProduct"
              class="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <AppIcon name="trending-up" :size="14" />
              Добавить
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="(product, index) in form.products"
              :key="index"
              class="flex items-center gap-2"
            >
              <input
                v-model="form.products[index]"
                type="text"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Название товара или услуги"
              />
              <button
                v-if="form.products.length > 1"
                type="button"
                @click="removeProduct(index)"
                class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
              >
                <AppIcon name="chevron-right" :size="16" class="rotate-45" />
              </button>
            </div>
          </div>
        </div>

        <!-- Manager and Branch -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Менеджер</label
            >
            <select
              v-model="form.manager"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Выберите менеджера</option>
              <option
                v-for="manager in managers"
                :key="manager"
                :value="manager"
              >
                {{ manager }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Филиал</label
            >
            <select
              v-model="form.branch"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Выберите филиал</option>
              <option v-for="branch in branches" :key="branch" :value="branch">
                {{ branch }}
              </option>
            </select>
          </div>
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Примечания</label
          >
          <textarea
            v-model="form.notes"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Дополнительная информация о продаже..."
          ></textarea>
        </div>

        <!-- Actions -->
        <div
          class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200"
        >
          <button
            type="button"
            @click="closeModal"
            class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Создать продажу
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
