<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

const actions = [
  {
    id: "add-client",
    title: "Клиенты",
    cls: "qa--blue",
    route: "/clients",
    icon: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
  },
  {
    id: "new-sale",
    title: "Продажи",
    cls: "qa--green",
    route: "/sales",
    icon: `<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>`,
  },
  {
    id: "record-visit",
    title: "Визиты",
    cls: "qa--amber",
    route: "/visits",
    icon: `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>`,
  },
  {
    id: "mailings",
    title: "Рассылки",
    cls: "qa--purple",
    route: "/mailings",
    icon: `<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>`,
  },
] as const;
</script>

<template>
  <div class="qa-card">
    <h3 class="qa-title">Быстрые действия</h3>
    <div class="qa-grid">
      <button
        v-for="action in actions"
        :key="action.id"
        class="qa-btn"
        :class="action.cls"
        @click="router.push(action.route)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="action.icon" />
        <span class="qa-lbl">{{ action.title }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.qa-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; }
.qa-title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 12px; }
.qa-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.qa-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 14px 8px; border-radius: 10px; border: none; cursor: pointer; transition: filter 150ms, transform 100ms; }
.qa-btn:hover { filter: brightness(0.95); }
.qa-btn:active { transform: scale(0.97); }
.qa-lbl { font-size: 11px; font-weight: 600; }
.qa--blue   { background: #eff6ff; color: #2563eb; }
.qa--green  { background: #ecfdf5; color: #059669; }
.qa--amber  { background: #fffbeb; color: #d97706; }
.qa--purple { background: #f5f3ff; color: #7c3aed; }
@media (max-width: 768px) {
  .qa-card { padding: 12px; }
  .qa-btn { padding: 12px 8px; }
}
</style>
