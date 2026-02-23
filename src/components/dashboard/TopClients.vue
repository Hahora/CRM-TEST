<script setup lang="ts">
import type { TopClientItem } from "@/services/dashboardApi";

const props = defineProps<{
  data: TopClientItem[];
  loading?: boolean;
  notLoaded?: boolean;
}>();

const fmt = new Intl.NumberFormat("ru-RU", {
  style: "currency", currency: "RUB", minimumFractionDigits: 0,
});

const fmtDate = (s: string) => {
  if (!s) return "—";
  const d = new Date(s.includes("T") ? s : s.replace(" ", "T"));
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
};
</script>

<template>
  <div class="tc-card">
    <h3 class="tc-title">Топ клиенты</h3>

    <!-- Skeleton -->
    <div v-if="loading" class="tc-list">
      <div v-for="i in 4" :key="i" class="tc-sk">
        <div class="sk-num" />
        <div class="sk-lines">
          <div class="sk-line sk-line--a" />
          <div class="sk-line sk-line--b" />
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="!data.length" class="tc-empty">{{ notLoaded ? "Не загружено" : "Нет данных" }}</div>

    <!-- List -->
    <div v-else class="tc-list">
      <div v-for="(c, i) in data" :key="c.client_moysklad_id" class="tc-item">
        <div class="tc-num">{{ i + 1 }}</div>
        <div class="tc-body">
          <span class="tc-name">{{ c.client_name }}</span>
          <div class="tc-meta">
            <span class="tc-amount">{{ fmt.format(c.total_amount) }}</span>
            <span class="tc-date">{{ fmtDate(c.last_visit) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tc-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; }
.tc-title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 12px; }
.tc-empty { padding: 16px 0; text-align: center; font-size: 13px; color: #94a3b8; }
.tc-list { display: flex; flex-direction: column; gap: 0; }
.tc-item { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid #f1f5f9; }
.tc-item:last-child { border-bottom: none; }
.tc-num { width: 22px; height: 22px; border-radius: 50%; background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.tc-body { flex: 1; min-width: 0; }
.tc-name { font-size: 12px; font-weight: 600; color: #0f172a; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tc-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 2px; }
.tc-amount { font-size: 11px; font-weight: 700; color: #059669; font-family: "JetBrains Mono", monospace; }
.tc-date { font-size: 10px; color: #94a3b8; }
/* Skeleton */
.tc-sk { display: flex; align-items: center; gap: 10px; padding: 7px 0; }
.sk-num { width: 22px; height: 22px; border-radius: 50%; background: #e2e8f0; flex-shrink: 0; animation: sk-pulse 1.5s ease-in-out infinite; }
.sk-lines { flex: 1; display: flex; flex-direction: column; gap: 5px; }
.sk-line { height: 9px; border-radius: 4px; background: #e2e8f0; animation: sk-pulse 1.5s ease-in-out infinite; }
.sk-line--a { width: 70%; }
.sk-line--b { width: 50%; }
@keyframes sk-pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
</style>
