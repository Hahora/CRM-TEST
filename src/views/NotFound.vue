<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <div class="nf-root">
    <!-- Code -->
    <div class="nf-code">404</div>

    <!-- Icon -->
    <div class="nf-icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        <line x1="11" y1="8" x2="11" y2="11"/>
        <line x1="11" y1="14" x2="11.01" y2="14"/>
      </svg>
    </div>

    <h1 class="nf-title">Страница не найдена</h1>
    <p class="nf-desc">
      Запрошенный адрес не существует или был перемещён.<br>
      Проверьте URL или вернитесь на главную.
    </p>

    <div class="nf-path">{{ $route.fullPath }}</div>

    <div class="nf-actions">
      <button class="nf-btn nf-btn--primary" @click="router.push('/dashboard')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        На дашборд
      </button>
      <button class="nf-btn nf-btn--ghost" @click="router.back()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Назад
      </button>
    </div>

    <!-- Decorative grid -->
    <div class="nf-grid" aria-hidden="true">
      <div v-for="i in 80" :key="i" class="nf-dot" />
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@600;700&family=Manrope:wght@400;500;600;700;800&display=swap");

.nf-root {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 40px 24px;
  background: #f8fafc;
  font-family: "Manrope", -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  overflow: hidden;
  text-align: center;
}

/* Big 404 number */
.nf-code {
  font-family: "JetBrains Mono", monospace;
  font-size: clamp(80px, 16vw, 140px);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.04em;
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 4px;
  user-select: none;
}

/* Search icon */
.nf-icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  margin-bottom: 24px;
}

.nf-title {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin: 0 0 10px;
}

.nf-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.7;
  margin: 0 0 20px;
  max-width: 360px;
}

/* Path chip */
.nf-path {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 20px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 32px;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Actions */
.nf-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.nf-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 10px;
  font: 600 13px "Manrope", sans-serif;
  cursor: pointer;
  transition: all 150ms;
  border: none;
  white-space: nowrap;
}

.nf-btn--primary {
  background: #2563eb;
  color: #fff;
  box-shadow: 0 2px 10px rgba(37, 99, 235, 0.25);
}

.nf-btn--primary:hover {
  background: #1d4ed8;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35);
  transform: translateY(-1px);
}

.nf-btn--ghost {
  background: #fff;
  color: #374151;
  border: 1px solid #e2e8f0;
}

.nf-btn--ghost:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

/* Decorative dots */
.nf-grid {
  position: absolute;
  bottom: 0;
  right: 0;
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 12px;
  padding: 24px;
  opacity: 0.07;
  pointer-events: none;
}

.nf-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #2563eb;
}
</style>
