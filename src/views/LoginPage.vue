<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import AppIcon from "@/components/AppIcon.vue";
import { useAuth } from "@/composables/useAuth";
import { useToast } from "@/composables/useToast";

const router = useRouter();
const { login, isLoading, isAuthenticated } = useAuth();
const { showError, showSuccess } = useToast();

const form = ref({
  login: "",
  password: "",
});

const showPassword = ref(false);

onMounted(() => {
  if (isAuthenticated.value) {
    router.push("/");
  }
});

const handleSubmit = async () => {
  if (!form.value.login || !form.value.password) {
    showError("Заполните все поля", "Введите логин и пароль для входа в систему");
    return;
  }
  const success = await login(form.value);
  if (success) {
    showSuccess("Вход выполнен", "Добро пожаловать в систему!");
  }
};

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};
</script>

<template>
  <div class="lp-root">
    <!-- Left branding panel -->
    <div class="lp-left">
      <div class="lp-left-inner">
        <!-- Logo -->
        <div class="lp-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>

        <!-- Brand name -->
        <div class="lp-brand">
          <h1 class="lp-brand-title">CRM СИСТЕМА</h1>
          <span class="lp-brand-sub">HUSBAND</span>
        </div>

        <!-- Features list -->
        <div class="lp-features">
          <div class="lp-feature">
            <div class="lp-feature-ico">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <span>Управление клиентами</span>
          </div>
          <div class="lp-feature">
            <div class="lp-feature-ico">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
            <span>Аналитика и отчёты</span>
          </div>
          <div class="lp-feature">
            <div class="lp-feature-ico">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <span>Мониторинг продаж</span>
          </div>
        </div>

        <!-- Decorative grid -->
        <div class="lp-grid" aria-hidden="true">
          <div v-for="i in 48" :key="i" class="lp-dot" />
        </div>
      </div>

      <div class="lp-left-footer">
        <span>© 2026 CRM v1.0.0</span>
      </div>
    </div>

    <!-- Right form panel -->
    <div class="lp-right">
      <div class="lp-card">
        <!-- Mobile brand (hidden on desktop) -->
        <div class="lp-mobile-brand">
          <div class="lp-mobile-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <div>
            <div class="lp-mobile-title">CRM СИСТЕМА</div>
            <div class="lp-mobile-sub">HUSBAND</div>
          </div>
        </div>

        <div class="lp-card-header">
          <h2 class="lp-card-title">Добро пожаловать</h2>
          <p class="lp-card-desc">Войдите в свой аккаунт, чтобы продолжить</p>
        </div>

        <form @submit.prevent="handleSubmit" class="lp-form">
          <!-- Login -->
          <div class="lp-field">
            <label for="login" class="lp-label">Логин</label>
            <div class="lp-input-wrap">
              <div class="lp-input-ico">
                <AppIcon name="user" :size="15" />
              </div>
              <input
                id="login"
                v-model="form.login"
                type="text"
                autocomplete="username"
                placeholder="Введите логин"
                class="lp-input"
                :disabled="isLoading"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="lp-field">
            <label for="password" class="lp-label">Пароль</label>
            <div class="lp-input-wrap">
              <div class="lp-input-ico">
                <AppIcon name="lock" :size="15" />
              </div>
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Введите пароль"
                class="lp-input lp-input--pw"
                :disabled="isLoading"
              />
              <button
                type="button"
                class="lp-pw-toggle"
                @click="togglePasswordVisibility"
                :disabled="isLoading"
                tabindex="-1"
              >
                <AppIcon :name="showPassword ? 'eye-off' : 'eye'" :size="15" />
              </button>
            </div>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            class="lp-submit"
            :disabled="isLoading || !form.login || !form.password"
          >
            <AppIcon v-if="isLoading" name="refresh-cw" :size="15" class="lp-spin" />
            <span>{{ isLoading ? "Вход..." : "Войти в систему" }}</span>
          </button>
        </form>

        <p class="lp-hint">Доступ только для авторизованных сотрудников</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap");

.lp-root {
  display: flex;
  min-height: 100dvh;
  min-height: 100vh;
  font-family: "Manrope", -apple-system, BlinkMacSystemFont, sans-serif;
  background: #f8fafc;
}

/* ── Left panel ── */
.lp-left {
  display: none;
  width: 420px;
  flex-shrink: 0;
  background: linear-gradient(145deg, #0f172a 0%, #1e3a5f 55%, #1e40af 100%);
  position: relative;
  overflow: hidden;
  flex-direction: column;
}

@media (min-width: 900px) {
  .lp-left {
    display: flex;
  }
}

.lp-left-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 48px 40px;
  position: relative;
  z-index: 1;
}

.lp-left-footer {
  padding: 20px 40px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  position: relative;
  z-index: 1;
}

/* Logo icon */
.lp-logo {
  width: 52px;
  height: 52px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 28px;
  backdrop-filter: blur(8px);
}

/* Brand */
.lp-brand {
  margin-bottom: 48px;
}

.lp-brand-title {
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin: 0 0 6px;
}

.lp-brand-sub {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
}

/* Features */
.lp-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lp-feature {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
  font-weight: 500;
}

.lp-feature-ico {
  width: 30px;
  height: 30px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.8);
}

/* Decorative dots */
.lp-grid {
  position: absolute;
  bottom: 60px;
  right: -10px;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 10px;
  opacity: 0.12;
  pointer-events: none;
}

.lp-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #fff;
}

/* Glow effect */
.lp-left::after {
  content: "";
  position: absolute;
  bottom: -80px;
  right: -80px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(96, 165, 250, 0.2) 0%, transparent 70%);
  pointer-events: none;
}

/* ── Right panel ── */
.lp-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: #f8fafc;
}

/* Card */
.lp-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 36px 32px;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06), 0 1px 4px rgba(15, 23, 42, 0.04);
}

/* Mobile brand */
.lp-mobile-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f1f5f9;
}

@media (min-width: 900px) {
  .lp-mobile-brand {
    display: none;
  }
}

.lp-mobile-logo {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #1e40af, #7c3aed);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.lp-mobile-title {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.lp-mobile-sub {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: #94a3b8;
  text-transform: uppercase;
}

/* Card header */
.lp-card-header {
  margin-bottom: 28px;
}

.lp-card-title {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin: 0 0 6px;
}

.lp-card-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

/* Form */
.lp-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.lp-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lp-label {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.lp-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.lp-input-ico {
  position: absolute;
  left: 11px;
  color: #94a3b8;
  pointer-events: none;
  display: flex;
}

.lp-input {
  width: 100%;
  padding: 11px 12px 11px 36px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font: 500 14px "Manrope", sans-serif;
  color: #0f172a;
  background: #f8fafc;
  outline: none;
  transition: border-color 150ms, box-shadow 150ms, background 150ms;
}

.lp-input::placeholder {
  color: #cbd5e1;
  font-weight: 400;
}

.lp-input:focus {
  border-color: #2563eb;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.lp-input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.lp-input--pw {
  padding-right: 40px;
}

.lp-pw-toggle {
  position: absolute;
  right: 10px;
  display: flex;
  align-items: center;
  color: #94a3b8;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: color 150ms, background 150ms;
}

.lp-pw-toggle:hover {
  color: #475569;
  background: #f1f5f9;
}

/* Submit */
.lp-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 13px 16px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  font: 700 14px "Manrope", sans-serif;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: opacity 150ms, transform 100ms, box-shadow 150ms;
  box-shadow: 0 2px 12px rgba(37, 99, 235, 0.3);
  margin-top: 4px;
}

.lp-submit:hover:not(:disabled) {
  opacity: 0.92;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.4);
  transform: translateY(-1px);
}

.lp-submit:active:not(:disabled) {
  transform: translateY(0);
}

.lp-submit:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.lp-spin {
  animation: spin 0.8s linear infinite;
}

/* Hint */
.lp-hint {
  margin: 20px 0 0;
  text-align: center;
  font-size: 11px;
  color: #94a3b8;
}
</style>
