<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

const REPORTS = [
  {
    route: "/reports/clients",
    title: "Отчет по клиентам",
    cardClass: "rp-card--blue",
    iconClass: "rp-card-icon--blue",
    arrowClass: "rp-card-arrow--blue",
    icon: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
  },
  {
    route: "/reports/sales",
    title: "Отчет по продажам",
    cardClass: "rp-card--amber",
    iconClass: "rp-card-icon--amber",
    arrowClass: "rp-card-arrow--amber",
    icon: `<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="13" y2="15"/>`,
  },
  {
    route: "/reports/visits",
    title: "Отчет по посещениям",
    cardClass: "rp-card--green",
    iconClass: "rp-card-icon--green",
    arrowClass: "rp-card-arrow--green",
    icon: `<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>`,
  },
] as const;
</script>

<template>
  <div class="rp-page">
    <header class="rp-header">
      <div>
        <h1 class="rp-title">Отчеты</h1>
        <p class="rp-sub">Выгрузка данных в Excel / CSV</p>
      </div>
    </header>

    <div class="rp-body">
      <div class="rp-cards">
        <button
          v-for="r in REPORTS"
          :key="r.route"
          class="rp-card"
          :class="r.cardClass"
          @click="router.push(r.route)"
        >
          <div class="rp-card-icon" :class="r.iconClass">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" v-html="r.icon" />
          </div>
          <div class="rp-card-body">
            <span class="rp-card-title">{{ r.title }}</span>
          </div>
          <div class="rp-card-arrow" :class="r.arrowClass">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rp-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
  font-family: "Manrope", -apple-system, BlinkMacSystemFont, sans-serif;
  color: #0f172a;
}

/* Header */
.rp-header {
  padding: 20px 24px 16px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.rp-title {
  font: 800 20px/1 "Manrope", sans-serif;
  letter-spacing: -0.02em;
  margin: 0 0 4px;
}
.rp-sub {
  font: 400 12px/1 "Manrope", sans-serif;
  color: #64748b;
  margin: 0;
}

/* Body */
.rp-body {
  flex: 1;
  padding: 28px 24px;
  overflow-y: auto;
}

/* Cards */
.rp-cards {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 540px;
}
.rp-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 20px 22px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  transition: all 180ms cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
}
.rp-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08);
  transform: translateY(-1px);
}
.rp-card--green:hover { border-color: #6ee7b7; box-shadow: 0 4px 20px rgba(5,150,105,0.08); }
.rp-card--amber:hover { border-color: #fcd34d; box-shadow: 0 4px 20px rgba(217,119,6,0.08); }

.rp-card-icon {
  width: 56px; height: 56px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.rp-card-icon--blue  { background: #eff6ff; color: #2563eb; }
.rp-card-icon--green { background: #ecfdf5; color: #059669; }
.rp-card-icon--amber { background: #fffbeb; color: #d97706; }

.rp-card-body { flex: 1; }
.rp-card-title { font: 700 15px/1 "Manrope", sans-serif; color: #0f172a; }

.rp-card-arrow { flex-shrink: 0; transition: transform 180ms, color 180ms; }
.rp-card-arrow--blue  { color: #2563eb; }
.rp-card-arrow--green { color: #059669; }
.rp-card-arrow--amber { color: #d97706; }
.rp-card:hover .rp-card-arrow { transform: translateX(3px); }

@media (max-width: 600px) {
  .rp-body { padding: 16px; }
  .rp-card { padding: 16px; gap: 14px; }
  .rp-card-icon { width: 46px; height: 46px; }
}
</style>
