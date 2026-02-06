<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { clientsApi } from "@/services/clientsApi";
import type { ClientDetail, Purchase } from "@/services/clientsApi";
import { MapPin } from "lucide-vue-next";

const props = defineProps<{
  moyskladId: string | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "delete", moyskladId: string): void;
}>();

const client = ref<ClientDetail | null>(null);
const isLoading = ref(false);
const error = ref("");
const purchasesPage = ref(0);
const PAGE_SIZE = 10;
const isLoadingMore = ref(false);
const expandedPurchase = ref<string | null>(null);

watch(
  () => props.moyskladId,
  async (id) => {
    if (!id) return;
    error.value = "";
    isLoading.value = true;
    purchasesPage.value = 0;
    expandedPurchase.value = null;
    try {
      client.value = await clientsApi.getClientDetail(id, PAGE_SIZE, 0);
    } catch (e: any) {
      error.value = e.message || "Ошибка загрузки";
    } finally {
      isLoading.value = false;
    }
  },
  { immediate: true }
);

const loadMorePurchases = async () => {
  if (!client.value || !props.moyskladId || isLoadingMore.value) return;
  isLoadingMore.value = true;
  try {
    const offset = client.value.purchases.purchases.length;
    const res = await clientsApi.getClientDetail(
      props.moyskladId,
      PAGE_SIZE,
      offset
    );
    client.value.purchases.purchases.push(...res.purchases.purchases);
    client.value.purchases.total = res.purchases.total;
  } catch (e) {
    console.error(e);
  } finally {
    isLoadingMore.value = false;
  }
};

const hasMorePurchases = computed(() => {
  if (!client.value) return false;
  return client.value.purchases.purchases.length < client.value.purchases.total;
});

const togglePurchase = (id: string) => {
  expandedPurchase.value = expandedPurchase.value === id ? null : id;
};

const typeLabel = (t?: string) => {
  switch (t) {
    case "individual":
      return "Физ. лицо";
    case "legal":
      return "Юр. лицо";
    case "entrepreneur":
      return "ИП";
    default:
      return "—";
  }
};

const sexLabel = (s?: string) => {
  switch (s) {
    case "MALE":
    case "male":
      return "Мужской";
    case "FEMALE":
    case "female":
      return "Женский";
    default:
      return "—";
  }
};

const fmtDate = (v?: string | null) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const fmtDateTime = (v?: string | null) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const fmtMoney = (v?: number | null) => {
  if (v == null) return "0 ₽";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
};

const fullName = computed(() => {
  if (!client.value) return "";
  const c = client.value;
  if (c.company_type === "legal") return c.name;
  const parts = [
    c.legal_last_name,
    c.legal_first_name,
    c.legal_middle_name,
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : c.name;
});

const handleDelete = () => {
  if (!props.moyskladId) return;
  if (!confirm("Удалить клиента? Это действие необратимо.")) return;
  emit("delete", props.moyskladId);
};

const handleOverlayClick = (e: MouseEvent) => {
  if ((e.target as HTMLElement).classList.contains("cdm-overlay")) {
    emit("close");
  }
};
</script>

<template>
  <Teleport to="body">
    <Transition name="cdm-fade">
      <div v-if="moyskladId" class="cdm-overlay" @click="handleOverlayClick">
        <Transition name="cdm-slide">
          <div v-if="moyskladId" class="cdm-modal">
            <!-- Header -->
            <div class="cdm-header">
              <div class="cdm-header-left">
                <div
                  class="cdm-avatar"
                  :class="{
                    'cdm-avatar--legal': client?.company_type === 'legal',
                    'cdm-avatar--ip': client?.company_type === 'entrepreneur',
                  }"
                >
                  {{ client?.name?.charAt(0)?.toUpperCase() || "?" }}
                </div>
                <div class="cdm-header-info">
                  <h2 class="cdm-name">
                    {{ isLoading ? "Загрузка..." : fullName }}
                  </h2>
                  <span
                    v-if="client"
                    class="cdm-type-badge"
                    :class="'cdm-type--' + client.company_type"
                    >{{ typeLabel(client.company_type) }}</span
                  >
                </div>
              </div>
              <div class="cdm-header-right">
                <button
                  class="cdm-btn-del"
                  @click="handleDelete"
                  title="Удалить клиента"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path
                      d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                    />
                  </svg>
                </button>
                <div class="cdm-header-sep"></div>
                <button class="cdm-btn-close" @click="$emit('close')">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Loading -->
            <div v-if="isLoading" class="cdm-loading">
              <div class="cdm-spinner"></div>
              <span>Загрузка данных клиента...</span>
            </div>

            <!-- Error -->
            <div v-else-if="error" class="cdm-error">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>{{ error }}</span>
            </div>

            <!-- Content -->
            <div v-else-if="client" class="cdm-body">
              <!-- Stats cards -->
              <div class="cdm-stats">
                <div class="cdm-stat">
                  <span class="cdm-stat-val cdm-stat-val--money">{{
                    fmtMoney(client.sales_amount || client.total_spent)
                  }}</span>
                  <span class="cdm-stat-label">Сумма покупок</span>
                </div>
                <div class="cdm-stat">
                  <span class="cdm-stat-val">{{ client.total_purchases }}</span>
                  <span class="cdm-stat-label">Покупок</span>
                </div>
                <div class="cdm-stat">
                  <span class="cdm-stat-val">{{ client.visit_count }}</span>
                  <span class="cdm-stat-label">Визитов</span>
                </div>
              </div>

              <!-- Info -->
              <div class="cdm-section">
                <h3 class="cdm-section-title">Информация</h3>
                <div class="cdm-info-grid">
                  <template v-if="client.company_type !== 'legal'">
                    <div class="cdm-info-row">
                      <span class="cdm-info-label">Имя</span
                      ><span class="cdm-info-val">{{
                        client.legal_first_name || "—"
                      }}</span>
                    </div>
                    <div class="cdm-info-row">
                      <span class="cdm-info-label">Фамилия</span
                      ><span class="cdm-info-val">{{
                        client.legal_last_name || "—"
                      }}</span>
                    </div>
                    <div class="cdm-info-row">
                      <span class="cdm-info-label">Отчество</span
                      ><span class="cdm-info-val">{{
                        client.legal_middle_name || "—"
                      }}</span>
                    </div>
                  </template>
                  <template
                    v-if="
                      client.company_type === 'legal' ||
                      client.company_type === 'entrepreneur'
                    "
                  >
                    <div class="cdm-info-row">
                      <span class="cdm-info-label">Название</span
                      ><span class="cdm-info-val">{{
                        client.name || "—"
                      }}</span>
                    </div>
                  </template>
                  <div class="cdm-info-row">
                    <span class="cdm-info-label">Телефон</span
                    ><span class="cdm-info-val cdm-info-val--mono">{{
                      client.phone || "—"
                    }}</span>
                  </div>
                  <div class="cdm-info-row">
                    <span class="cdm-info-label">Email</span
                    ><span class="cdm-info-val">{{ client.email || "—" }}</span>
                  </div>
                  <div class="cdm-info-row">
                    <span class="cdm-info-label">Telegram</span
                    ><span class="cdm-info-val">{{
                      client.telegram_id || "—"
                    }}</span>
                  </div>
                  <div class="cdm-info-row">
                    <span class="cdm-info-label">Откуда</span
                    ><span class="cdm-info-val">{{
                      client.source || "—"
                    }}</span>
                  </div>

                  <template v-if="client.company_type === 'individual'">
                    <div class="cdm-info-row">
                      <span class="cdm-info-label">Пол</span
                      ><span class="cdm-info-val">{{
                        sexLabel(client.sex)
                      }}</span>
                    </div>
                    <div class="cdm-info-row">
                      <span class="cdm-info-label">Дата рождения</span
                      ><span class="cdm-info-val">{{
                        fmtDate(client.birth_date)
                      }}</span>
                    </div>
                    <div class="cdm-info-row">
                      <span class="cdm-info-label">Свадьба</span
                      ><span class="cdm-info-val">{{
                        client.is_wedding ? "Да" : "Нет"
                      }}</span>
                    </div>
                    <template v-if="client.is_wedding">
                      <div class="cdm-info-row">
                        <span class="cdm-info-label">Дата свадьбы</span
                        ><span class="cdm-info-val">{{
                          fmtDate(client.wedding_date)
                        }}</span>
                      </div>
                      <div class="cdm-info-row">
                        <span class="cdm-info-label">Имя невесты</span
                        ><span class="cdm-info-val">{{
                          client.bride_name || "—"
                        }}</span>
                      </div>
                    </template>
                  </template>

                  <template v-if="client.company_type === 'legal'">
                    <div class="cdm-info-row">
                      <span class="cdm-info-label">ИНН</span
                      ><span class="cdm-info-val cdm-info-val--mono">{{
                        client.inn || "—"
                      }}</span>
                    </div>
                    <div class="cdm-info-row">
                      <span class="cdm-info-label">КПП</span
                      ><span class="cdm-info-val cdm-info-val--mono">{{
                        client.kpp || "—"
                      }}</span>
                    </div>
                    <div class="cdm-info-row">
                      <span class="cdm-info-label">ОГРН</span
                      ><span class="cdm-info-val cdm-info-val--mono">{{
                        client.ogrn || "—"
                      }}</span>
                    </div>
                    <div class="cdm-info-row cdm-info-row--full">
                      <span class="cdm-info-label">Юр. адрес</span
                      ><span class="cdm-info-val">{{
                        client.legal_address || "—"
                      }}</span>
                    </div>
                  </template>

                  <template v-if="client.company_type === 'entrepreneur'">
                    <div class="cdm-info-row">
                      <span class="cdm-info-label">ИНН</span
                      ><span class="cdm-info-val cdm-info-val--mono">{{
                        client.inn || "—"
                      }}</span>
                    </div>
                    <div class="cdm-info-row">
                      <span class="cdm-info-label">ОГРНИП</span
                      ><span class="cdm-info-val cdm-info-val--mono">{{
                        client.ogrnip || "—"
                      }}</span>
                    </div>
                  </template>

                  <div class="cdm-info-row">
                    <span class="cdm-info-label">Последняя покупка</span
                    ><span class="cdm-info-val">{{
                      fmtDate(client.last_purchase_date)
                    }}</span>
                  </div>
                  <div class="cdm-info-row">
                    <span class="cdm-info-label">МАКС ID</span
                    ><span class="cdm-info-val cdm-info-val--mono">{{
                      client.max_id || "—"
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Purchases -->
              <div class="cdm-section">
                <h3 class="cdm-section-title">
                  История покупок
                  <span class="cdm-section-badge">{{
                    client.purchases.total
                  }}</span>
                </h3>

                <div
                  v-if="client.purchases.purchases.length === 0"
                  class="cdm-empty"
                >
                  Покупок пока нет
                </div>

                <div v-else class="cdm-purchases">
                  <div
                    v-for="p in client.purchases.purchases"
                    :key="p.id"
                    class="cdm-purchase"
                    :class="{ 'cdm-purchase--open': expandedPurchase === p.id }"
                  >
                    <div
                      class="cdm-purchase-header"
                      @click="togglePurchase(p.id)"
                    >
                      <div class="cdm-purchase-left">
                        <span class="cdm-purchase-num">{{ p.name }}</span>
                        <span class="cdm-purchase-date">{{
                          fmtDateTime(p.moment)
                        }}</span>
                      </div>
                      <div class="cdm-purchase-right">
                        <span class="cdm-purchase-sum">{{
                          fmtMoney(p.sum)
                        }}</span>
                        <svg
                          class="cdm-purchase-arrow"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>

                    <div
                      v-if="expandedPurchase === p.id"
                      class="cdm-purchase-body"
                    >
                      <div class="cdm-purchase-store">
                        <MapPin :size="12" /> {{ p.store }}
                      </div>
                      <table class="cdm-items-table">
                        <thead>
                          <tr>
                            <th>Товар</th>
                            <th>Код</th>
                            <th>Кол-во</th>
                            <th>Цена</th>
                            <th>Скидка</th>
                            <th>Сумма</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(item, idx) in p.items" :key="idx">
                            <td class="cdm-td-name">
                              <span>{{ item.name }}</span>
                              <span
                                v-if="item.article"
                                class="cdm-td-article"
                                >{{ item.article }}</span
                              >
                            </td>
                            <td class="cdm-td-code">{{ item.code || "—" }}</td>
                            <td class="cdm-td-num">{{ item.quantity }}</td>
                            <td class="cdm-td-num">
                              {{ fmtMoney(item.price) }}
                            </td>
                            <td class="cdm-td-num cdm-td-discount">
                              {{ item.discount ? item.discount + "%" : "—" }}
                            </td>
                            <td class="cdm-td-num cdm-td-total">
                              {{ fmtMoney(item.total) }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <!-- Load more -->
                  <button
                    v-if="hasMorePurchases"
                    class="cdm-load-more"
                    :disabled="isLoadingMore"
                    @click="loadMorePurchases"
                  >
                    <template v-if="isLoadingMore">
                      <div class="cdm-spinner cdm-spinner--sm"></div>
                      Загрузка...
                    </template>
                    <template v-else> Показать ещё </template>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Overlay ── */
.cdm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
}
.cdm-modal {
  width: min(560px, 100vw);
  height: 100%;
  background: var(--sf, #fff);
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

/* ── Header ── */
.cdm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--bd, #e2e8f0);
  flex-shrink: 0;
}
.cdm-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.cdm-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.cdm-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font: 700 16px/40px var(--fn, sans-serif);
  text-align: center;
  flex-shrink: 0;
}
.cdm-avatar--legal {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
}
.cdm-avatar--ip {
  background: linear-gradient(135deg, #d97706, #f59e0b);
}
.cdm-header-info {
  min-width: 0;
}
.cdm-name {
  font: 700 16px/1.3 var(--fn, sans-serif);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--tx, #0f172a);
}
.cdm-type-badge {
  display: inline-block;
  font: 600 10px/1 var(--fn, sans-serif);
  padding: 3px 8px;
  border-radius: 20px;
  margin-top: 2px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}
.cdm-type--individual {
  background: #f0fdf4;
  color: #16a34a;
}
.cdm-type--legal {
  background: #eff6ff;
  color: #2563eb;
}
.cdm-type--entrepreneur {
  background: #fffbeb;
  color: #d97706;
}
.cdm-btn-close,
.cdm-btn-del {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  transition: all 150ms;
}
.cdm-btn-close {
  color: var(--txm, #94a3b8);
}
.cdm-btn-close:hover {
  background: var(--sfh, #f1f5f9);
  color: var(--tx, #0f172a);
}
.cdm-btn-del {
  color: #dc2626;
}
.cdm-btn-del:hover {
  background: #fef2f2;
}
.cdm-header-sep {
  width: 1px;
  height: 20px;
  background: var(--bd, #e2e8f0);
}

/* ── Loading / Error ── */
.cdm-loading,
.cdm-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--tx2, #64748b);
  font: 500 13px/1 var(--fn, sans-serif);
}
.cdm-error {
  color: #dc2626;
}
.cdm-spinner {
  width: 24px;
  height: 24px;
  border: 2.5px solid var(--bd, #e2e8f0);
  border-top-color: var(--pr, #2563eb);
  border-radius: 50%;
  animation: cdm-spin 0.7s linear infinite;
}
.cdm-spinner--sm {
  width: 16px;
  height: 16px;
  border-width: 2px;
}
@keyframes cdm-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Body scroll ── */
.cdm-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
}
.cdm-body::-webkit-scrollbar {
  width: 4px;
}
.cdm-body::-webkit-scrollbar-thumb {
  background: var(--bds, #cbd5e1);
  border-radius: 4px;
}

/* ── Stats ── */
.cdm-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--bd, #e2e8f0);
  border-bottom: 1px solid var(--bd, #e2e8f0);
}
.cdm-stat {
  background: var(--sf, #fff);
  padding: 14px 12px;
  text-align: center;
}
.cdm-stat-val {
  display: block;
  font: 800 18px/1.2 var(--fn, sans-serif);
  color: var(--tx, #0f172a);
}
.cdm-stat-val--money {
  font-size: 15px;
  color: var(--ok, #059669);
}
.cdm-stat-label {
  font: 500 10px/1 var(--fn, sans-serif);
  color: var(--txm, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 4px;
  display: block;
}

/* ── Section ── */
.cdm-section {
  padding: 16px 20px;
}
.cdm-section + .cdm-section {
  border-top: 1px solid var(--bd, #e2e8f0);
}
.cdm-section-title {
  font: 700 13px/1 var(--fn, sans-serif);
  color: var(--tx, #0f172a);
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.cdm-section-badge {
  background: var(--prl, #eff6ff);
  color: var(--pr, #2563eb);
  font: 700 10px/1 var(--fm, monospace);
  padding: 2px 7px;
  border-radius: 20px;
}

/* ── Info grid ── */
.cdm-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}
.cdm-info-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 0;
  border-bottom: 1px solid var(--bd, #e2e8f0);
}
.cdm-info-row--full {
  grid-column: 1/-1;
}
.cdm-info-label {
  font: 500 10px/1 var(--fn, sans-serif);
  color: var(--txm, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.cdm-info-val {
  font: 500 13px/1.3 var(--fn, sans-serif);
  color: var(--tx, #0f172a);
  word-break: break-word;
}
.cdm-info-val--mono {
  font-family: var(--fm, "JetBrains Mono", monospace);
  font-size: 12px;
}

/* ── Purchases ── */
.cdm-empty {
  text-align: center;
  padding: 24px;
  color: var(--txm, #94a3b8);
  font: 500 13px/1 var(--fn, sans-serif);
}
.cdm-purchases {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cdm-purchase {
  border: 1px solid var(--bd, #e2e8f0);
  border-radius: 8px;
  overflow: hidden;
  transition: all 150ms;
}
.cdm-purchase--open {
  border-color: var(--bds, #cbd5e1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.cdm-purchase-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 150ms;
}
.cdm-purchase-header:hover {
  background: var(--sfh, #f1f5f9);
}
.cdm-purchase-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.cdm-purchase-num {
  font: 700 12px/1 var(--fm, monospace);
  color: var(--pr, #2563eb);
  background: var(--prl, #eff6ff);
  padding: 3px 8px;
  border-radius: 4px;
  flex-shrink: 0;
}
.cdm-purchase-date {
  font: 400 12px/1 var(--fn, sans-serif);
  color: var(--tx2, #64748b);
}
.cdm-purchase-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.cdm-purchase-sum {
  font: 700 13px/1 var(--fn, sans-serif);
  color: var(--tx, #0f172a);
}
.cdm-purchase-arrow {
  transition: transform 200ms;
  color: var(--txm, #94a3b8);
}
.cdm-purchase--open .cdm-purchase-arrow {
  transform: rotate(180deg);
}

.cdm-purchase-body {
  padding: 0 14px 12px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.cdm-purchase-body::-webkit-scrollbar {
  height: 3px;
}
.cdm-purchase-body::-webkit-scrollbar-thumb {
  background: var(--bds, #cbd5e1);
  border-radius: 3px;
}
.cdm-purchase-store {
  font: 500 11px/1 var(--fn, sans-serif);
  color: var(--txm, #94a3b8);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ── Items table ── */
.cdm-items-table {
  width: 100%;
  min-width: 420px;
  border-collapse: collapse;
  font: 400 11px/1.4 var(--fn, sans-serif);
}
.cdm-items-table th {
  font: 600 9px/1 var(--fn, sans-serif);
  color: var(--txm, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 5px 4px;
  text-align: left;
  border-bottom: 1px solid var(--bd, #e2e8f0);
  white-space: nowrap;
}
.cdm-items-table td {
  padding: 5px 4px;
  border-bottom: 1px solid var(--bd, #e2e8f0);
  color: var(--tx, #0f172a);
  vertical-align: top;
}
.cdm-items-table tr:last-child td {
  border-bottom: none;
}
.cdm-td-name {
  min-width: 100px;
}
.cdm-td-name span:first-child {
  display: block;
  line-height: 1.3;
  word-break: break-word;
}
.cdm-td-article {
  display: block;
  font: 400 9px/1 var(--fm, monospace);
  color: var(--txm, #94a3b8);
  margin-top: 2px;
}
.cdm-td-code {
  font: 400 10px/1 var(--fm, monospace);
  color: var(--tx2, #64748b);
  white-space: nowrap;
}
.cdm-td-num {
  text-align: right;
  font-family: var(--fm, monospace);
  font-size: 11px;
  white-space: nowrap;
}
.cdm-td-discount {
  color: var(--er, #dc2626);
}
.cdm-td-total {
  font-weight: 600;
}

/* ── Load more ── */
.cdm-load-more {
  width: 100%;
  padding: 10px;
  margin-top: 8px;
  border: 1px dashed var(--bd, #e2e8f0);
  border-radius: 6px;
  background: none;
  font: 600 12px/1 var(--fn, sans-serif);
  color: var(--pr, #2563eb);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 150ms;
}
.cdm-load-more:hover:not(:disabled) {
  background: var(--prl, #eff6ff);
  border-color: var(--pr, #2563eb);
}
.cdm-load-more:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Transitions ── */
.cdm-fade-enter-active,
.cdm-fade-leave-active {
  transition: opacity 200ms;
}
.cdm-fade-enter-from,
.cdm-fade-leave-to {
  opacity: 0;
}
.cdm-slide-enter-active {
  transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
.cdm-slide-leave-active {
  transition: transform 200ms cubic-bezier(0.4, 0, 1, 1);
}
.cdm-slide-enter-from,
.cdm-slide-leave-to {
  transform: translateX(100%);
}

/* ── Mobile ── */
@media (max-width: 640px) {
  .cdm-modal {
    width: 100vw;
  }
  .cdm-stats {
    grid-template-columns: repeat(3, 1fr);
  }
  .cdm-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
