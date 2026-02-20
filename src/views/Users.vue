<script setup lang="ts">
import { ref, computed } from "vue";

interface MockUser {
  id: number;
  login: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  role: string;
  branch?: string;
  is_active: boolean;
  created_at: string;
}

interface UserForm {
  login: string;
  password: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  role: string;
  branch: string;
  is_active: boolean;
}

const ROLES = [
  { id: "chief_admin", label: "Главный администратор" },
  { id: "consultant",  label: "Консультант" },
];

const BRANCHES = [
  "Центральный",
  "Северный",
  "Западный",
  "Южный",
  "Восточный",
];

const users = ref<MockUser[]>([
  {
    id: 1,
    login: "husband-admin",
    first_name: "Admin",
    last_name: "Admin",
    role: "chief_admin",
    is_active: true,
    created_at: "2025-12-27",
  },
  {
    id: 2,
    login: "ivanova_k",
    first_name: "Карина",
    last_name: "Иванова",
    middle_name: "Сергеевна",
    role: "consultant",
    branch: "Центральный",
    is_active: true,
    created_at: "2026-01-10",
  },
  {
    id: 3,
    login: "petrov_m",
    first_name: "Михаил",
    last_name: "Петров",
    middle_name: "Андреевич",
    role: "consultant",
    branch: "Северный",
    is_active: true,
    created_at: "2026-01-15",
  },
  {
    id: 4,
    login: "sokolova_n",
    first_name: "Наталья",
    last_name: "Соколова",
    role: "consultant",
    branch: "Западный",
    is_active: false,
    created_at: "2026-02-01",
  },
  {
    id: 5,
    login: "morozov_a",
    first_name: "Алексей",
    last_name: "Морозов",
    middle_name: "Васильевич",
    role: "consultant",
    branch: "Южный",
    is_active: true,
    created_at: "2026-02-05",
  },
]);

const searchText = ref("");

const filteredUsers = computed(() => {
  const q = searchText.value.trim().toLowerCase();
  if (!q) return users.value;
  return users.value.filter(
    (u) =>
      u.login.toLowerCase().includes(q) ||
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q) ||
      (u.branch?.toLowerCase().includes(q) ?? false)
  );
});

// ── Modal state ──
const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);
const deleteConfirmId = ref<number | null>(null);
const showPassword = ref(false);

const blankForm = (): UserForm => ({
  login: "",
  password: "",
  first_name: "",
  last_name: "",
  middle_name: "",
  role: "consultant",
  branch: "",
  is_active: true,
});

const form = ref<UserForm>(blankForm());

const openCreate = () => {
  form.value = blankForm();
  isEditing.value = false;
  editingId.value = null;
  showPassword.value = false;
  showModal.value = true;
};

const openEdit = (u: MockUser) => {
  editingId.value = u.id;
  isEditing.value = true;
  showPassword.value = false;
  form.value = {
    login: u.login,
    password: "",
    first_name: u.first_name,
    last_name: u.last_name,
    middle_name: u.middle_name ?? "",
    role: u.role,
    branch: u.branch ?? "",
    is_active: u.is_active,
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const handleSave = () => {
  if (!form.value.login.trim() || !form.value.last_name.trim()) return;
  if (!isEditing.value && !form.value.password.trim()) return;

  if (isEditing.value && editingId.value !== null) {
    const idx = users.value.findIndex((u) => u.id === editingId.value);
    if (idx !== -1) {
      users.value[idx] = {
        ...users.value[idx],
        login: form.value.login.trim(),
        first_name: form.value.first_name.trim(),
        last_name: form.value.last_name.trim(),
        middle_name: form.value.middle_name.trim() || undefined,
        role: form.value.role,
        branch: form.value.branch || undefined,
        is_active: form.value.is_active,
      };
    }
  } else {
    const newId = users.value.length > 0 ? Math.max(...users.value.map((u) => u.id)) + 1 : 1;
    users.value.push({
      id: newId,
      login: form.value.login.trim(),
      first_name: form.value.first_name.trim(),
      last_name: form.value.last_name.trim(),
      middle_name: form.value.middle_name.trim() || undefined,
      role: form.value.role,
      branch: form.value.branch || undefined,
      is_active: form.value.is_active,
      created_at: new Date().toISOString().slice(0, 10),
    });
  }
  closeModal();
};

const confirmDelete = (id: number) => {
  deleteConfirmId.value = id;
};

const handleDelete = () => {
  if (deleteConfirmId.value === null) return;
  users.value = users.value.filter((u) => u.id !== deleteConfirmId.value);
  deleteConfirmId.value = null;
};

const getRoleLabel = (role: string) =>
  ROLES.find((r) => r.id === role)?.label ?? role;

const getInitials = (u: MockUser) => {
  const a = u.last_name?.charAt(0) ?? "";
  const b = u.first_name?.charAt(0) ?? "";
  return (a + b).toUpperCase() || u.login.slice(0, 2).toUpperCase();
};

const getFullName = (u: MockUser) => {
  const parts = [u.last_name, u.first_name, u.middle_name].filter(Boolean);
  return parts.join(" ") || u.login;
};

const avatarColor = (id: number) => {
  const palettes = [
    "from-blue-500 to-indigo-500",
    "from-violet-500 to-purple-500",
    "from-emerald-500 to-teal-500",
    "from-orange-500 to-amber-500",
    "from-rose-500 to-pink-500",
    "from-cyan-500 to-blue-500",
  ];
  return palettes[id % palettes.length];
};

const formValid = computed(() => {
  if (!form.value.login.trim() || !form.value.last_name.trim()) return false;
  if (!isEditing.value && !form.value.password.trim()) return false;
  if (form.value.role === "consultant" && !form.value.branch) return false;
  return true;
});
</script>

<template>
  <div class="up-page">
    <!-- HEADER -->
    <header class="up-header">
      <div class="up-header-left">
        <h1 class="up-title">Пользователи</h1>
        <span class="up-badge">{{ users.length }}</span>
      </div>

      <div class="up-search-wrap">
        <svg class="up-search-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="searchText"
          type="text"
          placeholder="Поиск по логину, имени, филиалу..."
          class="up-search-input"
        />
        <button v-if="searchText" class="up-search-clear" @click="searchText = ''">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <button class="up-btn-create" @click="openCreate">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>Новый пользователь</span>
      </button>
    </header>

    <!-- TABLE -->
    <div class="up-body">
      <div class="up-table-wrap">
        <!-- Table header -->
        <div class="up-thead">
          <div class="up-th up-th--user">Пользователь</div>
          <div class="up-th up-th--login">Логин</div>
          <div class="up-th up-th--role">Роль</div>
          <div class="up-th up-th--branch">Филиал</div>
          <div class="up-th up-th--status">Статус</div>
          <div class="up-th up-th--created">Создан</div>
          <div class="up-th up-th--actions"></div>
        </div>

        <!-- Empty -->
        <div v-if="filteredUsers.length === 0" class="up-empty">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          <span>Пользователи не найдены</span>
        </div>

        <!-- Rows -->
        <div
          v-for="u in filteredUsers"
          :key="u.id"
          class="up-row"
          :class="{ 'up-row--inactive': !u.is_active }"
        >
          <!-- User name + avatar -->
          <div class="up-td up-td--user">
            <div class="up-avatar" :class="`bg-gradient-to-br ${avatarColor(u.id)}`">
              {{ getInitials(u) }}
            </div>
            <div class="up-name-block">
              <span class="up-full-name">{{ getFullName(u) }}</span>
              <span class="up-id-chip">ID: {{ u.id }}</span>
            </div>
          </div>

          <!-- Login -->
          <div class="up-td up-td--login">
            <span class="up-login">{{ u.login }}</span>
          </div>

          <!-- Role -->
          <div class="up-td up-td--role">
            <span
              class="up-role-badge"
              :class="u.role === 'chief_admin' ? 'up-role-badge--admin' : 'up-role-badge--consultant'"
            >
              {{ getRoleLabel(u.role) }}
            </span>
          </div>

          <!-- Branch -->
          <div class="up-td up-td--branch">
            <span v-if="u.branch" class="up-branch">{{ u.branch }}</span>
            <span v-else class="up-dash">—</span>
          </div>

          <!-- Status -->
          <div class="up-td up-td--status">
            <span class="up-status" :class="u.is_active ? 'up-status--on' : 'up-status--off'">
              <span class="up-status-dot"></span>
              {{ u.is_active ? "Активен" : "Неактивен" }}
            </span>
          </div>

          <!-- Created -->
          <div class="up-td up-td--created">
            <span class="up-date">{{ u.created_at }}</span>
          </div>

          <!-- Actions -->
          <div class="up-td up-td--actions">
            <div v-if="deleteConfirmId === u.id" class="up-confirm">
              <span class="up-confirm-text">Удалить?</span>
              <button class="up-confirm-yes" @click="handleDelete">Да</button>
              <button class="up-confirm-no" @click="deleteConfirmId = null">Нет</button>
            </div>
            <div v-else class="up-actions">
              <button class="up-action-btn up-action-btn--edit" @click="openEdit(u)" title="Редактировать">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="up-action-btn up-action-btn--del" @click="confirmDelete(u.id)" title="Удалить">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <footer class="up-footer">
      <span>Всего: <b>{{ users.length }}</b></span>
      <span v-if="searchText">Найдено: <b>{{ filteredUsers.length }}</b></span>
    </footer>

    <!-- MODAL -->
    <Teleport to="body">
      <Transition name="up-modal">
        <div v-if="showModal" class="up-overlay" @click.self="closeModal">
          <div class="up-modal">
            <!-- Modal header -->
            <div class="up-modal-header">
              <h2 class="up-modal-title">
                {{ isEditing ? "Редактировать пользователя" : "Новый пользователь" }}
              </h2>
              <button class="up-modal-close" @click="closeModal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <!-- Modal body -->
            <div class="up-modal-body">
              <!-- Row 1: Фамилия + Имя -->
              <div class="up-form-row">
                <div class="up-field up-field--req">
                  <label class="up-label">Фамилия</label>
                  <input v-model="form.last_name" type="text" class="up-input" placeholder="Иванова" />
                </div>
                <div class="up-field up-field--req">
                  <label class="up-label">Имя</label>
                  <input v-model="form.first_name" type="text" class="up-input" placeholder="Карина" />
                </div>
              </div>

              <!-- Row 2: Отчество + Логин -->
              <div class="up-form-row">
                <div class="up-field">
                  <label class="up-label">Отчество</label>
                  <input v-model="form.middle_name" type="text" class="up-input" placeholder="Сергеевна" />
                </div>
                <div class="up-field up-field--req">
                  <label class="up-label">Логин</label>
                  <input v-model="form.login" type="text" class="up-input" placeholder="ivanova_k" autocomplete="off" />
                </div>
              </div>

              <!-- Row 3: Пароль -->
              <div class="up-form-row">
                <div class="up-field" :class="!isEditing ? 'up-field--req' : ''">
                  <label class="up-label">
                    Пароль
                    <span v-if="isEditing" class="up-label-hint">(оставьте пустым, чтобы не менять)</span>
                  </label>
                  <div class="up-pw-wrap">
                    <input
                      v-model="form.password"
                      :type="showPassword ? 'text' : 'password'"
                      class="up-input up-input--pw"
                      placeholder="••••••••"
                      autocomplete="new-password"
                    />
                    <button type="button" class="up-pw-eye" @click="showPassword = !showPassword" tabindex="-1">
                      <svg v-if="!showPassword" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Divider -->
              <div class="up-divider"></div>

              <!-- Row 4: Роль + Филиал -->
              <div class="up-form-row">
                <div class="up-field up-field--req">
                  <label class="up-label">Роль</label>
                  <select v-model="form.role" class="up-select">
                    <option v-for="r in ROLES" :key="r.id" :value="r.id">{{ r.label }}</option>
                  </select>
                </div>
                <div class="up-field" :class="form.role === 'consultant' ? 'up-field--req' : ''">
                  <label class="up-label">Филиал</label>
                  <select v-model="form.branch" class="up-select" :disabled="form.role !== 'consultant'">
                    <option value="">— не указан —</option>
                    <option v-for="b in BRANCHES" :key="b" :value="b">{{ b }}</option>
                  </select>
                </div>
              </div>

              <!-- Row 5: Статус -->
              <div class="up-form-row">
                <div class="up-field">
                  <label class="up-label">Статус</label>
                  <div class="up-toggle-row">
                    <button
                      type="button"
                      class="up-toggle"
                      :class="form.is_active ? 'up-toggle--on' : 'up-toggle--off'"
                      @click="form.is_active = !form.is_active"
                    >
                      <span class="up-toggle-knob"></span>
                    </button>
                    <span class="up-toggle-label" :class="form.is_active ? 'text-emerald-600' : 'text-gray-400'">
                      {{ form.is_active ? "Активен" : "Неактивен" }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal footer -->
            <div class="up-modal-footer">
              <button class="up-btn-cancel" @click="closeModal">Отмена</button>
              <button class="up-btn-save" :disabled="!formValid" @click="handleSave">
                {{ isEditing ? "Сохранить" : "Создать" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&display=swap");

/* ── Tokens ── */
.up-page {
  --bg: #f8fafc;
  --sf: #fff;
  --sfh: #f1f5f9;
  --bd: #e2e8f0;
  --bds: #cbd5e1;
  --tx: #0f172a;
  --tx2: #64748b;
  --txm: #94a3b8;
  --pr: #2563eb;
  --prh: #1d4ed8;
  --prl: #eff6ff;
  --ok: #059669;
  --okl: #ecfdf5;
  --er: #dc2626;
  --erl: #fef2f2;
  --r: 8px;
  --rs: 6px;
  --fn: "Manrope", -apple-system, sans-serif;
  --fm: "JetBrains Mono", monospace;
  --tr: 150ms cubic-bezier(0.4, 0, 0.2, 1);

  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg);
  font-family: var(--fn);
  color: var(--tx);
  overflow: hidden;
}

/* ── Header ── */
.up-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: var(--sf);
  border-bottom: 1px solid var(--bd);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.up-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.up-title {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
}

.up-badge {
  background: var(--prl);
  color: var(--pr);
  font: 700 11px/1 var(--fm);
  padding: 2px 7px;
  border-radius: 20px;
}

.up-search-wrap {
  position: relative;
  flex: 1;
  min-width: 180px;
  max-width: 380px;
}

.up-search-ico {
  position: absolute;
  left: 9px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--txm);
  pointer-events: none;
}

.up-search-input {
  width: 100%;
  padding: 7px 28px 7px 30px;
  border: 1px solid var(--bd);
  border-radius: var(--rs);
  font: 400 12px var(--fn);
  background: var(--bg);
  color: var(--tx);
  outline: none;
  transition: all var(--tr);
}

.up-search-input:focus {
  background: var(--sf);
  border-color: var(--pr);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.08);
}

.up-search-clear {
  position: absolute;
  right: 7px;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: none;
  background: var(--bd);
  color: var(--tx2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--tr);
}

.up-search-clear:hover { background: var(--bds); color: var(--tx); }

.up-btn-create {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: var(--pr);
  color: #fff;
  font: 600 12px/1 var(--fn);
  border: none;
  border-radius: var(--rs);
  cursor: pointer;
  transition: all var(--tr);
  white-space: nowrap;
  margin-left: auto;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}

.up-btn-create:hover {
  background: var(--prh);
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
  transform: translateY(-1px);
}

/* ── Body ── */
.up-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
}

/* ── Table ── */
.up-table-wrap {
  background: var(--sf);
  border: 1px solid var(--bd);
  border-radius: 12px;
  overflow: hidden;
}

.up-thead {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1.8fr 1.2fr 1fr 1fr 80px;
  padding: 0 12px;
  background: var(--sfh);
  border-bottom: 1px solid var(--bd);
}

.up-th {
  padding: 10px 8px;
  font: 600 10px/1 var(--fn);
  color: var(--tx2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.up-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 20px;
  color: var(--txm);
  font-size: 13px;
}

.up-row {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1.8fr 1.2fr 1fr 1fr 80px;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid var(--bd);
  transition: background var(--tr);
}

.up-row:last-child { border-bottom: none; }
.up-row:hover { background: #fafbfc; }
.up-row--inactive { opacity: 0.55; }

.up-td {
  padding: 12px 8px;
  font-size: 13px;
  color: var(--tx);
  min-width: 0;
}

/* User cell */
.up-td--user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.up-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font: 700 12px/1 var(--fm);
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.up-name-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.up-full-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.up-id-chip {
  font: 500 10px/1 var(--fm);
  color: var(--txm);
}

/* Login cell */
.up-login {
  font: 500 12px/1 var(--fm);
  color: var(--tx2);
}

/* Role badge */
.up-role-badge {
  display: inline-flex;
  padding: 3px 8px;
  border-radius: 20px;
  font: 600 10px/1.4 var(--fn);
  white-space: nowrap;
}

.up-role-badge--admin {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.up-role-badge--consultant {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

/* Branch */
.up-branch {
  font: 500 12px var(--fn);
  color: var(--tx2);
}

.up-dash { color: var(--txm); }

/* Status */
.up-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font: 600 11px/1 var(--fn);
}

.up-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.up-status--on { color: var(--ok); }
.up-status--on .up-status-dot { background: var(--ok); }
.up-status--off { color: var(--txm); }
.up-status--off .up-status-dot { background: var(--txm); }

/* Date */
.up-date {
  font: 400 12px/1 var(--fm);
  color: var(--txm);
}

/* Actions */
.up-td--actions { display: flex; justify-content: flex-end; }

.up-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity var(--tr);
}

.up-row:hover .up-actions { opacity: 1; }

.up-action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--bd);
  border-radius: var(--rs);
  background: var(--sf);
  cursor: pointer;
  transition: all var(--tr);
}

.up-action-btn--edit { color: var(--tx2); }
.up-action-btn--edit:hover { background: var(--prl); border-color: var(--pr); color: var(--pr); }

.up-action-btn--del { color: var(--tx2); }
.up-action-btn--del:hover { background: var(--erl); border-color: var(--er); color: var(--er); }

/* Delete confirm */
.up-confirm {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.up-confirm-text {
  font: 600 11px var(--fn);
  color: var(--er);
}

.up-confirm-yes, .up-confirm-no {
  padding: 3px 8px;
  border-radius: var(--rs);
  font: 600 11px var(--fn);
  border: 1px solid;
  cursor: pointer;
  transition: all var(--tr);
}

.up-confirm-yes {
  background: var(--er);
  border-color: var(--er);
  color: #fff;
}

.up-confirm-yes:hover { background: #b91c1c; }

.up-confirm-no {
  background: var(--sf);
  border-color: var(--bd);
  color: var(--tx2);
}

.up-confirm-no:hover { background: var(--sfh); }

/* ── Footer ── */
.up-footer {
  display: flex;
  gap: 16px;
  padding: 6px 16px;
  background: var(--sf);
  border-top: 1px solid var(--bd);
  font-size: 11px;
  color: var(--tx2);
  flex-shrink: 0;
}

.up-footer b {
  color: var(--tx);
  font-family: var(--fm);
}

/* ── Modal ── */
.up-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.up-modal {
  background: var(--sf);
  border: 1px solid var(--bd);
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.2);
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 32px);
  overflow: hidden;
}

.up-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--bd);
  flex-shrink: 0;
}

.up-modal-title {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.01em;
  margin: 0;
}

.up-modal-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--bd);
  border-radius: var(--rs);
  background: none;
  color: var(--txm);
  cursor: pointer;
  transition: all var(--tr);
}

.up-modal-close:hover { background: var(--sfh); color: var(--tx); }

.up-modal-body {
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.up-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.up-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.up-label {
  font: 700 10px/1 var(--fn);
  color: var(--tx2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 4px;
}

.up-label-hint {
  font: 400 10px var(--fn);
  text-transform: none;
  letter-spacing: 0;
  color: var(--txm);
}

.up-field--req .up-label::after {
  content: "*";
  color: var(--er);
  font-size: 11px;
}

.up-input, .up-select {
  padding: 9px 10px;
  border: 1.5px solid var(--bd);
  border-radius: var(--rs);
  font: 500 13px var(--fn);
  color: var(--tx);
  background: var(--bg);
  outline: none;
  transition: all var(--tr);
}

.up-input:focus, .up-select:focus {
  border-color: var(--pr);
  background: var(--sf);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.up-input::placeholder { color: var(--txm); font-weight: 400; }

.up-pw-wrap { position: relative; }

.up-input--pw { width: 100%; padding-right: 36px; box-sizing: border-box; }

.up-pw-eye {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  color: var(--txm);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: color var(--tr);
}

.up-pw-eye:hover { color: var(--tx2); }

.up-select:disabled { opacity: 0.45; cursor: not-allowed; }

.up-divider {
  border: none;
  border-top: 1px solid var(--bd);
  margin: 0 -20px;
}

/* Toggle */
.up-toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
}

.up-toggle {
  width: 38px;
  height: 22px;
  border-radius: 11px;
  border: none;
  cursor: pointer;
  position: relative;
  transition: background var(--tr);
  flex-shrink: 0;
}

.up-toggle--on { background: var(--ok); }
.up-toggle--off { background: var(--bds); }

.up-toggle-knob {
  position: absolute;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  top: 3px;
  transition: left var(--tr);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.up-toggle--on .up-toggle-knob { left: 19px; }
.up-toggle--off .up-toggle-knob { left: 3px; }

.up-toggle-label { font: 600 13px var(--fn); transition: color var(--tr); }

/* Modal footer */
.up-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid var(--bd);
  flex-shrink: 0;
}

.up-btn-cancel {
  padding: 8px 16px;
  border: 1px solid var(--bd);
  border-radius: var(--rs);
  background: var(--sf);
  color: var(--tx2);
  font: 600 12px var(--fn);
  cursor: pointer;
  transition: all var(--tr);
}

.up-btn-cancel:hover { background: var(--sfh); border-color: var(--bds); }

.up-btn-save {
  padding: 8px 20px;
  background: var(--pr);
  color: #fff;
  border: none;
  border-radius: var(--rs);
  font: 600 12px var(--fn);
  cursor: pointer;
  transition: all var(--tr);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}

.up-btn-save:hover:not(:disabled) {
  background: var(--prh);
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
}

.up-btn-save:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}

/* Modal transition */
.up-modal-enter-active { transition: all 200ms ease-out; }
.up-modal-leave-active { transition: all 150ms ease-in; }
.up-modal-enter-from { opacity: 0; }
.up-modal-enter-from .up-modal { transform: scale(0.96) translateY(8px); }
.up-modal-enter-to .up-modal { transform: scale(1) translateY(0); }
.up-modal-leave-to { opacity: 0; }
.up-modal-leave-to .up-modal { transform: scale(0.96) translateY(8px); }

/* ── Responsive ── */
@media (max-width: 768px) {
  .up-thead { display: none; }

  .up-row {
    grid-template-columns: 1fr;
    gap: 6px;
    padding: 12px;
    border-bottom: 1px solid var(--bd);
  }

  .up-td { padding: 0; }

  .up-td--login::before { content: "Логин: "; font-weight: 600; color: var(--tx2); font-size: 11px; }
  .up-td--branch::before { content: "Филиал: "; font-weight: 600; color: var(--tx2); font-size: 11px; }
  .up-td--created { display: none; }

  .up-actions { opacity: 1; }

  .up-form-row { grid-template-columns: 1fr; }
}
</style>
