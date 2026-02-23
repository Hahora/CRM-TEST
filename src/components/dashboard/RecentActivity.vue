<script setup lang="ts">
import type { RecentActivityItem } from "@/services/dashboardApi";

const props = defineProps<{
  data: RecentActivityItem[];
  loading?: boolean;
}>();

const STATUS_CFG: Record<string, { label: string; cls: string; icon: string }> = {
  kupil:         { label: "Купил",         cls: "act--green",  icon: "sale"   },
  v_primerchnoy: { label: "В примерочной", cls: "act--amber",  icon: "visit"  },
  zapisalsya:    { label: "Записался",     cls: "act--blue",   icon: "visit"  },
  ne_prishel:    { label: "Не пришёл",     cls: "act--gray",   icon: "visit"  },
  otkazalsya:    { label: "Отказался",     cls: "act--red",    icon: "visit"  },
};

const cfg = (status: string) =>
  STATUS_CFG[status] ?? { label: status, cls: "act--gray", icon: "visit" };

const fmtTime = (dt: string) => {
  if (!dt) return "";
  const d = new Date(dt.includes("T") ? dt : dt.replace(" ", "T"));
  if (isNaN(d.getTime())) return dt;
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 1)   return "только что";
  if (diff < 60)  return `${diff} мин назад`;
  if (diff < 1440) return `${Math.floor(diff / 60)} ч назад`;
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
};

const fmtAmount = (v: number | null) =>
  v == null ? null : new Intl.NumberFormat("ru-RU", {
    style: "currency", currency: "RUB", minimumFractionDigits: 0,
  }).format(v);
</script>

<template>
  <div class="act-card">
    <div class="act-card-hdr">
      <h3 class="act-title">Последние активности</h3>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="act-list">
      <div v-for="i in 5" :key="i" class="act-sk">
        <div class="sk-ico" />
        <div class="sk-lines">
          <div class="sk-line sk-line--a" />
          <div class="sk-line sk-line--b" />
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="!data.length" class="act-empty">Нет активностей</div>

    <!-- List -->
    <div v-else class="act-list">
      <div
        v-for="(item, i) in data"
        :key="i"
        class="act-item"
        :class="cfg(item.status).cls"
      >
        <div class="act-dot" />
        <div class="act-body">
          <div class="act-row">
            <span class="act-label">{{ item.label }}</span>
            <span v-if="fmtAmount(item.amount)" class="act-amount">
              +{{ fmtAmount(item.amount) }}
            </span>
          </div>
          <div class="act-row act-row--sub">
            <span class="act-client">{{ item.client_name }}</span>
            <span v-if="item.employee_name" class="act-emp">· {{ item.employee_name }}</span>
            <span class="act-time">{{ fmtTime(item.updated_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.act-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; }
.act-card-hdr { margin-bottom: 12px; }
.act-title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0; }
.act-empty { padding: 24px 0; text-align: center; font-size: 13px; color: #94a3b8; }
.act-list { display: flex; flex-direction: column; gap: 0; }
.act-item { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
.act-item:last-child { border-bottom: none; }
.act-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
.act--green .act-dot { background: #10b981; }
.act--amber .act-dot { background: #f59e0b; }
.act--blue  .act-dot { background: #3b82f6; }
.act--gray  .act-dot { background: #94a3b8; }
.act--red   .act-dot { background: #ef4444; }
.act-body { flex: 1; min-width: 0; }
.act-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.act-row--sub { margin-top: 1px; }
.act-label { font-size: 12px; font-weight: 600; color: #0f172a; }
.act-amount { font-size: 12px; font-weight: 700; color: #10b981; margin-left: auto; font-family: "JetBrains Mono", monospace; }
.act-client { font-size: 11px; color: #334155; font-weight: 500; }
.act-emp { font-size: 11px; color: #64748b; }
.act-time { font-size: 10px; color: #94a3b8; margin-left: auto; white-space: nowrap; }
/* Skeleton */
.act-sk { display: flex; align-items: center; gap: 10px; padding: 8px 0; }
.sk-ico { width: 8px; height: 8px; border-radius: 50%; background: #e2e8f0; flex-shrink: 0; animation: sk-pulse 1.5s ease-in-out infinite; }
.sk-lines { flex: 1; display: flex; flex-direction: column; gap: 5px; }
.sk-line { height: 9px; border-radius: 4px; background: #e2e8f0; animation: sk-pulse 1.5s ease-in-out infinite; }
.sk-line--a { width: 60%; }
.sk-line--b { width: 40%; }
@keyframes sk-pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
</style>
