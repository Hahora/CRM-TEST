<script setup lang="ts">
import type { ScheduleItem } from "@/services/dashboardApi";

const props = defineProps<{
  data: ScheduleItem[];
  loading?: boolean;
}>();

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  zapisalsya:    { label: "Записался",      cls: "st--blue"  },
  v_primerchnoy: { label: "В примерочной",  cls: "st--amber" },
  kupil:         { label: "Купил",          cls: "st--green" },
  ne_prishel:    { label: "Не пришёл",      cls: "st--gray"  },
  otkazalsya:    { label: "Отказался",      cls: "st--red"   },
};

const cfg = (status: string) =>
  STATUS_CFG[status] ?? { label: status, cls: "st--gray" };

const fmtPhone = (p: string) => {
  if (!p) return "";
  const d = p.replace(/\D/g, "");
  if (d.length === 11) return `+${d[0]} (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7,9)}-${d.slice(9)}`;
  return p;
};
</script>

<template>
  <div class="ts-card">
    <div class="ts-hdr">
      <h3 class="ts-title">Расписание на сегодня</h3>
      <span v-if="!loading && data.length" class="ts-count">{{ data.length }}</span>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="ts-list">
      <div v-for="i in 4" :key="i" class="ts-sk">
        <div class="sk-time" />
        <div class="sk-lines">
          <div class="sk-line sk-line--a" />
          <div class="sk-line sk-line--b" />
        </div>
        <div class="sk-badge" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="!data.length" class="ts-empty">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      Записей нет
    </div>

    <!-- List -->
    <div v-else class="ts-list">
      <div v-for="item in data" :key="item.id" class="ts-item">
        <div class="ts-time">{{ item.time }}</div>
        <div class="ts-body">
          <span class="ts-client">{{ item.client_name }}</span>
          <div class="ts-meta">
            <span v-if="item.client_phone" class="ts-phone">{{ fmtPhone(item.client_phone) }}</span>
            <span v-if="item.employee_name" class="ts-emp">{{ item.employee_name }}</span>
            <span v-if="item.fitting_room" class="ts-room">Прим. {{ item.fitting_room }}</span>
          </div>
        </div>
        <span class="ts-badge" :class="cfg(item.status).cls">{{ cfg(item.status).label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ts-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; }
.ts-hdr { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.ts-title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0; }
.ts-count { font-size: 11px; font-weight: 700; background: #eff6ff; color: #2563eb; border-radius: 10px; padding: 1px 7px; }
.ts-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 20px 0; font-size: 12px; color: #94a3b8; }
.ts-list { display: flex; flex-direction: column; gap: 0; }
.ts-item { display: flex; align-items: flex-start; gap: 10px; padding: 7px 0; border-bottom: 1px solid #f1f5f9; }
.ts-item:last-child { border-bottom: none; }
.ts-time { font: 700 12px/1.2 "JetBrains Mono", monospace; color: #2563eb; width: 36px; flex-shrink: 0; padding-top: 2px; }
.ts-body { flex: 1; min-width: 0; }
.ts-client { font-size: 12px; font-weight: 600; color: #0f172a; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ts-meta { display: flex; align-items: center; gap: 6px; margin-top: 2px; flex-wrap: wrap; }
.ts-phone { font-size: 10px; color: #64748b; }
.ts-emp { font-size: 10px; color: #64748b; }
.ts-room { font-size: 10px; color: #94a3b8; background: #f1f5f9; border-radius: 4px; padding: 1px 4px; }
.ts-badge { font-size: 10px; font-weight: 600; border-radius: 6px; padding: 2px 6px; white-space: nowrap; flex-shrink: 0; }
.st--blue  { background: #eff6ff; color: #2563eb; }
.st--amber { background: #fffbeb; color: #d97706; }
.st--green { background: #ecfdf5; color: #059669; }
.st--gray  { background: #f1f5f9; color: #64748b; }
.st--red   { background: #fef2f2; color: #dc2626; }
/* Skeleton */
.ts-sk { display: flex; align-items: center; gap: 10px; padding: 7px 0; }
.sk-time { width: 36px; height: 14px; border-radius: 4px; background: #e2e8f0; flex-shrink: 0; animation: sk-pulse 1.5s ease-in-out infinite; }
.sk-lines { flex: 1; display: flex; flex-direction: column; gap: 5px; }
.sk-line { height: 9px; border-radius: 4px; background: #e2e8f0; animation: sk-pulse 1.5s ease-in-out infinite; }
.sk-line--a { width: 65%; }
.sk-line--b { width: 45%; }
.sk-badge { width: 52px; height: 18px; border-radius: 6px; background: #e2e8f0; flex-shrink: 0; animation: sk-pulse 1.5s ease-in-out infinite; }
@keyframes sk-pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
</style>
