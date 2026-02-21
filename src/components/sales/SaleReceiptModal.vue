<script setup lang="ts">
import { X, MapPin, User, Package, ShoppingBag } from "lucide-vue-next";
import type { Sale, SaleItem } from "@/services/salesApi";

const props = defineProps<{
  open: boolean;
  sale: Sale | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "open-client", moyskladId: string): void;
}>();

const formatMoment = (v: string | null): string => {
  if (!v) return "—";
  const d = new Date(v.replace(" ", "T"));
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (v: number): string =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
  }).format(v);

const formatQty = (qty: number): string =>
  qty % 1 === 0 ? String(qty) : qty.toFixed(2);

const handleOverlay = (e: MouseEvent) => {
  if ((e.target as HTMLElement).classList.contains("srm-overlay"))
    emit("close");
};
</script>

<template>
  <Teleport to="body">
    <Transition name="srm-fade">
      <div v-if="open && sale" class="srm-overlay" @click="handleOverlay">
        <div class="srm-panel">
          <!-- Header -->
          <div class="srm-header">
            <div class="srm-header-left">
              <div class="srm-icon"><ShoppingBag :size="18" /></div>
              <div>
                <h2 class="srm-title">{{ sale.name }}</h2>
                <span class="srm-sub">{{ formatMoment(sale.moment) }}</span>
              </div>
            </div>
            <button class="srm-close" @click="emit('close')">
              <X :size="18" />
            </button>
          </div>

          <!-- Body -->
          <div class="srm-body">
            <!-- Store -->
            <div class="srm-info-row">
              <MapPin :size="13" class="srm-info-ico" />
              <span class="srm-info-label">Магазин</span>
              <span class="srm-info-val">{{ sale.store || "—" }}</span>
            </div>

            <!-- Client -->
            <div class="srm-info-row">
              <User :size="13" class="srm-info-ico" />
              <span class="srm-info-label">Покупатель</span>
              <button
                v-if="sale.agent_moysklad_id"
                class="srm-client-link"
                @click="emit('open-client', sale.agent_moysklad_id)"
              >
                {{ sale.agent_name || "—" }}
              </button>
              <span v-else class="srm-anonymous">Анонимная продажа</span>
            </div>

            <!-- Items -->
            <div class="srm-items-section">
              <h3 class="srm-items-title">
                <Package :size="13" />
                Товары ({{ sale.items.length }})
              </h3>

              <div class="srm-items" v-if="sale.items.length">
                <div
                  v-for="(item, i) in sale.items"
                  :key="i"
                  class="srm-item"
                >
                  <div class="srm-item-main">
                    <span class="srm-item-name">{{ item.name }}</span>
                    <span v-if="item.article" class="srm-item-article">
                      {{ item.article }}
                    </span>
                  </div>
                  <div class="srm-item-nums">
                    <span class="srm-item-qty">
                      {{ formatQty(item.quantity) }} × {{ formatCurrency(item.price) }}
                    </span>
                    <span v-if="item.discount > 0" class="srm-item-disc">
                      −{{ item.discount }}%
                    </span>
                    <span class="srm-item-total">
                      {{ formatCurrency(item.total) }}
                    </span>
                  </div>
                </div>
              </div>
              <div v-else class="srm-no-items">Товары не указаны</div>
            </div>
          </div>

          <!-- Footer: total -->
          <div class="srm-footer">
            <span class="srm-total-lbl">Итого</span>
            <span class="srm-total-val">{{ formatCurrency(sale.sum) }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.srm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
}
.srm-panel {
  width: min(480px, 100vw);
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  font-family: "Manrope", -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Header */
.srm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 22px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.srm-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.srm-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #059669, #0d9488);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.srm-title {
  font: 700 17px/1 "Manrope", sans-serif;
  margin: 0;
  color: #0f172a;
}
.srm-sub {
  font: 400 11px/1 "Manrope", sans-serif;
  color: #64748b;
  margin-top: 4px;
  display: block;
}
.srm-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  color: #94a3b8;
  transition: all 150ms;
}
.srm-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

/* Body */
.srm-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 22px 20px;
  display: flex;
  flex-direction: column;
}
.srm-body::-webkit-scrollbar {
  width: 4px;
}
.srm-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

/* Info rows */
.srm-info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}
.srm-info-ico {
  color: #94a3b8;
  flex-shrink: 0;
}
.srm-info-label {
  font: 600 10px/1 "Manrope", sans-serif;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  min-width: 80px;
  flex-shrink: 0;
}
.srm-info-val {
  font: 500 13px/1 "Manrope", sans-serif;
  color: #0f172a;
}
.srm-client-link {
  background: none;
  border: none;
  cursor: pointer;
  font: 600 13px/1 "Manrope", sans-serif;
  color: #2563eb;
  text-decoration: underline;
  padding: 0;
  text-align: left;
  transition: color 150ms;
}
.srm-client-link:hover {
  color: #1d4ed8;
}
.srm-anonymous {
  font: 400 12px/1 "Manrope", sans-serif;
  color: #94a3b8;
  font-style: italic;
}

/* Items */
.srm-items-section {
  margin-top: 20px;
}
.srm-items-title {
  font: 700 11px/1 "Manrope", sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #0f172a;
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.srm-items {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}
.srm-item {
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.srm-item:last-child {
  border-bottom: none;
}
.srm-item-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.srm-item-name {
  font: 600 13px/1.3 "Manrope", sans-serif;
  color: #0f172a;
}
.srm-item-article {
  font: 400 10px/1 "JetBrains Mono", monospace;
  color: #94a3b8;
}
.srm-item-nums {
  display: flex;
  align-items: center;
  gap: 8px;
}
.srm-item-qty {
  font: 400 11px/1 "JetBrains Mono", monospace;
  color: #64748b;
  flex: 1;
}
.srm-item-disc {
  font: 600 10px/1 "Manrope", sans-serif;
  color: #dc2626;
  background: #fee2e2;
  padding: 2px 5px;
  border-radius: 4px;
}
.srm-item-total {
  font: 700 13px/1 "JetBrains Mono", monospace;
  color: #0f172a;
}
.srm-no-items {
  font: 400 13px/1 "Manrope", sans-serif;
  color: #94a3b8;
  font-style: italic;
  padding: 14px 0;
}

/* Footer */
.srm-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 22px;
  border-top: 2px solid #e2e8f0;
  background: #fff;
  flex-shrink: 0;
}
.srm-total-lbl {
  font: 700 12px/1 "Manrope", sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}
.srm-total-val {
  font: 800 22px/1 "JetBrains Mono", monospace;
  color: #059669;
  letter-spacing: -0.02em;
}

/* Transition */
.srm-fade-enter-active,
.srm-fade-leave-active {
  transition: opacity 200ms;
}
.srm-fade-enter-from,
.srm-fade-leave-to {
  opacity: 0;
}
</style>
