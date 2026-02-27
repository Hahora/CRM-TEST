<script setup lang="ts">
import { ref, watch } from "vue";
import { clientsApi } from "@/services/clientsApi";
import AppIcon from "@/components/AppIcon.vue";

interface Props {
  open: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  select: [clientId: number];
  "create-new": [];
}>();

interface ClientRow {
  id: number;
  name: string;
  phone?: string;
  email?: string;
}

const query      = ref("");
const results    = ref<ClientRow[]>([]);
const isLoading  = ref(false);
const noResults  = ref(false);
let   searchTimer: ReturnType<typeof setTimeout> | null = null;

const reset = () => {
  query.value     = "";
  results.value   = [];
  noResults.value = false;
  isLoading.value = false;
  if (searchTimer) { clearTimeout(searchTimer); searchTimer = null; }
};

watch(() => props.open, (open) => {
  if (open) reset();
});

const doSearch = async (q: string) => {
  const trimmed = q.trim();
  if (!trimmed) { results.value = []; noResults.value = false; return; }
  isLoading.value = true;
  noResults.value = false;
  try {
    const res = await clientsApi.getClients({ search: trimmed, limit: 20 });
    // API возвращает { clients: [...] } или { items: [...] }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any[] = (res as any).clients ?? (res as any).items ?? [];
    results.value = raw.map((c: any) => ({
      id:    c.id,
      name:  c.name  || c.full_name || `Клиент #${c.id}`,
      phone: c.phone,
      email: c.email,
    })).filter((c) => c.id != null);
    noResults.value = results.value.length === 0;
  } catch {
    results.value   = [];
    noResults.value = true;
  } finally {
    isLoading.value = false;
  }
};

const onInput = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => doSearch(query.value), 350);
};

const select = (client: ClientRow) => {
  emit("select", client.id);
};
</script>

<template>
  <Transition name="csm-fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center px-4"
      @click.self="emit('close')"
    >
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="emit('close')" />

      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden"
           style="max-height: min(560px, 90dvh)">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 class="text-base font-semibold text-gray-900">Выбрать клиента</h3>
          <button
            @click="emit('close')"
            class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <AppIcon name="x" :size="16" />
          </button>
        </div>

        <!-- Search -->
        <div class="px-4 pt-3 pb-2 flex-shrink-0">
          <div class="relative">
            <AppIcon
              name="search"
              :size="15"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              v-model="query"
              type="text"
              placeholder="Имя, телефон или email..."
              autocomplete="off"
              class="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              @input="onInput"
            />
            <AppIcon
              v-if="isLoading"
              name="refresh-cw"
              :size="14"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
            />
          </div>
          <p class="mt-1.5 text-xs text-gray-400 pl-1">Введите минимум 2 символа для поиска</p>
        </div>

        <!-- Results -->
        <div class="flex-1 overflow-y-auto px-2 pb-2 min-h-0">
          <!-- Подсказка: ничего не введено -->
          <div
            v-if="!query.trim() && !results.length"
            class="flex flex-col items-center justify-center py-10 gap-2 text-gray-400"
          >
            <AppIcon name="users" :size="28" class="text-gray-300" />
            <span class="text-sm">Начните вводить для поиска</span>
          </div>

          <!-- Не найдено -->
          <div
            v-else-if="noResults && !isLoading"
            class="flex flex-col items-center justify-center py-8 gap-2 text-gray-400"
          >
            <AppIcon name="search" :size="24" class="text-gray-300" />
            <span class="text-sm">Клиенты не найдены</span>
          </div>

          <!-- Список -->
          <ul v-else class="space-y-1 pt-1">
            <li
              v-for="client in results"
              :key="client.id"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div class="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <AppIcon name="user" :size="14" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ client.name }}</p>
                <p v-if="client.phone" class="text-xs text-gray-400 truncate">{{ client.phone }}</p>
                <p v-else-if="client.email" class="text-xs text-gray-400 truncate">{{ client.email }}</p>
              </div>
              <button
                @click="select(client)"
                class="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                Выбрать
              </button>
            </li>
          </ul>
        </div>

        <!-- Footer -->
        <div class="px-4 py-3 border-t border-gray-100 flex-shrink-0">
          <button
            @click="emit('create-new')"
            class="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
          >
            <AppIcon name="user-plus" :size="15" />
            Новый клиент
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.csm-fade-enter-active, .csm-fade-leave-active { transition: opacity 150ms ease; }
.csm-fade-enter-from, .csm-fade-leave-to       { opacity: 0; }
</style>
