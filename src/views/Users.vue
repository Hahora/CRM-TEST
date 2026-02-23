<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { usersApi, type ApiUser, type CreateUserPayload, type UpdateUserPayload } from "@/services/usersApi";
import { visitsApi, type Branch } from "@/services/visitsApi";
import { useAuth } from "@/composables/useAuth";
import { useToast } from "@/composables/useToast";

const { user, userRole } = useAuth();
const { showSuccess, showError } = useToast();

const ROLE_IDS = { chief_admin: 1, admin: 2, branch: 3 } as const;

const ROLES_ALL = [
  { id: 1, name: "chief_admin", label: "Главный администратор" },
  { id: 2, name: "admin",       label: "Администратор" },
  { id: 3, name: "branch",      label: "Филиал" },
];

const ROLES_ADMIN = [{ id: 3, name: "branch", label: "Филиал" }];

// ── State ──
const users      = ref<ApiUser[]>([]);
const branches   = ref<Branch[]>([]);
const isLoading  = ref(true);
const isSaving   = ref(false);
const searchText = ref("");

const showModal       = ref(false);
const isEditing       = ref(false);
const editingId       = ref<number | null>(null);
const deleteConfirmId = ref<number | null>(null);
const deleteLoadingId = ref<number | null>(null);
const showPassword    = ref(false);

interface UserFormState {
  login:       string;
  password:    string;
  first_name:  string;
  last_name:   string;
  middle_name: string;
  role_id:     number;
  branch_id:   number | null;
  is_active:   boolean;
}

const blankForm = (): UserFormState => ({
  login:       "",
  password:    "",
  first_name:  "",
  last_name:   "",
  middle_name: "",
  role_id:     ROLE_IDS.branch,
  branch_id:   null,
  is_active:   true,
});

const form = ref<UserFormState>(blankForm());

// ── Role helpers ──
const isChiefAdmin   = computed(() => userRole.value === "chief_admin");
const isAdmin        = computed(() => userRole.value === "admin");
const currentUserId  = computed(() => user.value?.id ?? null);
const availableRoles = computed(() => isAdmin.value ? ROLES_ADMIN : ROLES_ALL);

// Reset branch_id when role changes away from branch
watch(() => form.value.role_id, (id) => {
  if (id !== ROLE_IDS.branch) form.value.branch_id = null;
});

// ── Permissions ──
const canEdit = (u: ApiUser) => {
  if (isChiefAdmin.value) return true;
  if (isAdmin.value) return u.role.name === "branch";
  return false;
};

const canDelete = (u: ApiUser) => {
  if (isChiefAdmin.value) return u.id !== currentUserId.value;
  if (isAdmin.value) return u.role.name === "branch";
  return false;
};

// ── Computed ──
const filteredUsers = computed(() => {
  const q = searchText.value.trim().toLowerCase();
  if (!q) return users.value;
  return users.value.filter(
    (u) =>
      u.login.toLowerCase().includes(q) ||
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q) ||
      (u.middle_name?.toLowerCase().includes(q) ?? false)
  );
});

const formValid = computed(() => {
  if (!form.value.last_name.trim()) return false;
  if (!isEditing.value) {
    if (!form.value.login.trim()) return false;
    if (!form.value.password.trim()) return false;
  }
  if (form.value.role_id === ROLE_IDS.branch && !form.value.branch_id) return false;
  return true;
});

const activeBranches = computed(() => branches.value.filter((b) => b.is_active));

const editingRoleName  = computed(() => ROLES_ALL.find((r) => r.id === form.value.role_id)?.name ?? "");
const editingRoleLabel = computed(() => ROLES_ALL.find((r) => r.id === form.value.role_id)?.label ?? "");

// ── Helpers ──
const getFullName = (u: ApiUser) => {
  const parts = [u.last_name, u.first_name, u.middle_name].filter(Boolean);
  return parts.join(" ") || u.login || String(u.id);
};

const getInitials = (u: ApiUser) => {
  const a = u.last_name?.charAt(0) ?? "";
  const b = u.first_name?.charAt(0) ?? "";
  return (a + b).toUpperCase() || u.login?.slice(0, 2).toUpperCase() || "?";
};

const avatarColor = (id: number) => {
  const p = [
    "from-blue-500 to-indigo-500",
    "from-violet-500 to-purple-500",
    "from-emerald-500 to-teal-500",
    "from-orange-500 to-amber-500",
    "from-rose-500 to-pink-500",
    "from-cyan-500 to-blue-500",
  ];
  return p[id % p.length];
};

const getRoleClass = (name: string) => {
  if (name === "chief_admin") return "up-role--chief";
  if (name === "admin")       return "up-role--admin";
  return "up-role--branch";
};

const getRoleLabel = (name: string) =>
  ROLES_ALL.find((r) => r.name === name)?.label ?? name;

const getBranchName = (branchId: number | null) => {
  if (!branchId) return null;
  return branches.value.find((b) => b.local_id === branchId)?.name ?? String(branchId);
};

// ── Data loading ──
const loadData = async () => {
  isLoading.value = true;
  try {
    const [usersData, branchesData] = await Promise.all([
      usersApi.getUsers(),
      visitsApi.getBranches(),
    ]);
    users.value    = usersData;
    branches.value = branchesData;
  } catch (e) {
    showError("Ошибка загрузки", e instanceof Error ? e.message : "Не удалось загрузить данные");
  } finally {
    isLoading.value = false;
  }
};

// ── Modal ──
const openCreate = () => {
  form.value     = blankForm();
  isEditing.value  = false;
  editingId.value  = null;
  showPassword.value = false;
  showModal.value  = true;
};

const openEdit = (u: ApiUser) => {
  editingId.value  = u.id;
  isEditing.value  = true;
  showPassword.value = false;
  form.value = {
    login:       u.login,
    password:    "",
    first_name:  u.first_name,
    last_name:   u.last_name,
    middle_name: u.middle_name ?? "",
    role_id:     u.role.id,
    branch_id:   u.branch_id,
    is_active:   u.is_active,
  };
  showModal.value = true;
};

const closeModal = () => { showModal.value = false; };

// ── Save ──
const handleSave = async () => {
  if (!formValid.value || isSaving.value) return;
  isSaving.value = true;
  try {
    if (isEditing.value && editingId.value !== null) {
      const payload: UpdateUserPayload = {
        first_name:  form.value.first_name.trim(),
        last_name:   form.value.last_name.trim(),
        middle_name: form.value.middle_name.trim() || null,
        is_active:   form.value.is_active,
        branch_id:   form.value.branch_id,
      };
      const updated = await usersApi.updateUser(editingId.value, payload);
      const idx = users.value.findIndex((u) => u.id === editingId.value);
      if (idx !== -1) users.value[idx] = updated;
      showSuccess("Сохранено", "Пользователь обновлён");
    } else {
      const payload: CreateUserPayload = {
        login:       form.value.login.trim(),
        password:    form.value.password,
        first_name:  form.value.first_name.trim(),
        last_name:   form.value.last_name.trim(),
        middle_name: form.value.middle_name.trim() || null,
        role_id:     form.value.role_id,
        branch_id:   form.value.branch_id,
        is_active:   form.value.is_active,
      };
      const created = await usersApi.createUser(payload);
      users.value.push(created);
      showSuccess("Создан", "Пользователь добавлен");
    }
    closeModal();
  } catch (e) {
    const err = e as any;
    if (err.status === 409) {
      showError("Логин занят", "Пользователь с таким логином уже существует");
    } else if (err.status === 403) {
      showError("Нет прав", "Недостаточно прав для выполнения операции");
    } else {
      showError("Ошибка", err.message || "Не удалось сохранить");
    }
  } finally {
    isSaving.value = false;
  }
};

// ── Delete ──
const confirmDelete = (id: number) => { deleteConfirmId.value = id; };

const handleDelete = async () => {
  if (deleteConfirmId.value === null) return;
  const id = deleteConfirmId.value;
  deleteLoadingId.value = id;
  try {
    await usersApi.deleteUser(id);
    users.value = users.value.filter((u) => u.id !== id);
    showSuccess("Удалён", "Пользователь удалён");
  } catch (e) {
    const err = e as any;
    if (err.status === 400) {
      showError("Нельзя удалить", "Невозможно удалить этого пользователя");
    } else if (err.status === 403) {
      showError("Нет прав", "Недостаточно прав для удаления");
    } else {
      showError("Ошибка", err.message || "Не удалось удалить пользователя");
    }
  } finally {
    deleteConfirmId.value = null;
    deleteLoadingId.value = null;
  }
};

onMounted(loadData);
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
          placeholder="Поиск по логину, имени..."
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

        <!-- Skeleton loading -->
        <template v-if="isLoading">
          <div
            v-for="i in 5"
            :key="i"
            class="up-row up-row--skeleton"
            :style="{ '--sk-delay': `${(i - 1) * 0.1}s` }"
          >
            <div class="up-td up-td--user">
              <div class="up-sk-avatar"></div>
              <div class="up-sk-lines">
                <div class="up-sk-line up-sk-line--lg"></div>
                <div class="up-sk-line up-sk-line--sm"></div>
              </div>
            </div>
            <div class="up-td"><div class="up-sk-line up-sk-line--md"></div></div>
            <div class="up-td"><div class="up-sk-badge"></div></div>
            <div class="up-td"><div class="up-sk-line up-sk-line--md"></div></div>
            <div class="up-td"><div class="up-sk-line up-sk-line--sm"></div></div>
            <div class="up-td"><div class="up-sk-line up-sk-line--sm"></div></div>
            <div class="up-td"></div>
          </div>
        </template>

        <!-- Empty -->
        <div v-else-if="filteredUsers.length === 0" class="up-empty">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          <span>Пользователи не найдены</span>
        </div>

        <!-- Rows -->
        <template v-else>
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
              <span class="up-role-badge" :class="getRoleClass(u.role.name)">
                {{ getRoleLabel(u.role.name) }}
              </span>
            </div>

            <!-- Branch -->
            <div class="up-td up-td--branch">
              <span v-if="getBranchName(u.branch_id)" class="up-branch">{{ getBranchName(u.branch_id) }}</span>
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
              <span class="up-date">{{ u.created_at?.slice(0, 10) ?? "—" }}</span>
            </div>

            <!-- Actions -->
            <div class="up-td up-td--actions">
              <div v-if="deleteConfirmId === u.id" class="up-confirm">
                <span class="up-confirm-text">Удалить?</span>
                <button
                  class="up-confirm-yes"
                  :disabled="deleteLoadingId === u.id"
                  @click="handleDelete"
                >
                  <span v-if="deleteLoadingId === u.id" class="up-spinner up-spinner--sm"></span>
                  <span v-else>Да</span>
                </button>
                <button class="up-confirm-no" @click="deleteConfirmId = null">Нет</button>
              </div>
              <div v-else class="up-actions">
                <button
                  v-if="canEdit(u)"
                  class="up-action-btn up-action-btn--edit"
                  @click="openEdit(u)"
                  title="Редактировать"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  v-if="canDelete(u)"
                  class="up-action-btn up-action-btn--del"
                  @click="confirmDelete(u.id)"
                  title="Удалить"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </template>
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
              <!-- Фамилия + Имя -->
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

              <!-- Отчество + Логин (только при создании) -->
              <div class="up-form-row">
                <div class="up-field">
                  <label class="up-label">Отчество</label>
                  <input v-model="form.middle_name" type="text" class="up-input" placeholder="Сергеевна" />
                </div>
                <div v-if="!isEditing" class="up-field up-field--req">
                  <label class="up-label">Логин</label>
                  <input v-model="form.login" type="text" class="up-input" placeholder="ivanova_k" autocomplete="off" />
                </div>
              </div>

              <!-- Пароль: только при создании -->
              <div v-if="!isEditing" class="up-form-row">
                <div class="up-field up-field--req">
                  <label class="up-label">Пароль</label>
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

              <!-- Логин + Роль (read-only при редактировании) -->
              <div v-if="isEditing" class="up-form-row">
                <div class="up-field">
                  <label class="up-label">Логин</label>
                  <div class="up-info-val up-info-val--mono">{{ form.login }}</div>
                </div>
                <div class="up-field">
                  <label class="up-label">Роль</label>
                  <div class="up-info-val">
                    <span class="up-role-badge" :class="getRoleClass(editingRoleName)">{{ editingRoleLabel }}</span>
                  </div>
                </div>
              </div>

              <div class="up-divider"></div>

              <!-- Роль (select, только создание) + Филиал -->
              <div class="up-form-row">
                <div v-if="!isEditing" class="up-field up-field--req">
                  <label class="up-label">Роль</label>
                  <select v-model="form.role_id" class="up-select" :disabled="isAdmin">
                    <option v-for="r in availableRoles" :key="r.id" :value="r.id">{{ r.label }}</option>
                  </select>
                </div>
                <div
                  class="up-field"
                  :class="[
                    form.role_id === ROLE_IDS.branch ? 'up-field--req' : '',
                    isEditing ? 'up-field--full' : '',
                  ]"
                >
                  <label class="up-label">Филиал</label>
                  <select
                    v-model="form.branch_id"
                    class="up-select"
                    :disabled="form.role_id !== ROLE_IDS.branch"
                  >
                    <option :value="null">— не указан —</option>
                    <option v-for="b in activeBranches" :key="b.local_id" :value="b.local_id">{{ b.name }}</option>
                  </select>
                </div>
              </div>

              <!-- Статус -->
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
                    <span
                      class="up-toggle-label"
                      :class="form.is_active ? 'up-toggle-label--on' : 'up-toggle-label--off'"
                    >
                      {{ form.is_active ? "Активен" : "Неактивен" }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal footer -->
            <div class="up-modal-footer">
              <button class="up-btn-cancel" @click="closeModal">Отмена</button>
              <button class="up-btn-save" :disabled="!formValid || isSaving" @click="handleSave">
                <span v-if="isSaving" class="up-spinner"></span>
                <span v-else>{{ isEditing ? "Сохранить" : "Создать" }}</span>
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
  --bg:  #f8fafc;
  --sf:  #fff;
  --sfh: #f1f5f9;
  --bd:  #e2e8f0;
  --bds: #cbd5e1;
  --tx:  #0f172a;
  --tx2: #64748b;
  --txm: #94a3b8;
  --pr:  #2563eb;
  --prh: #1d4ed8;
  --prl: #eff6ff;
  --ok:  #059669;
  --okl: #ecfdf5;
  --er:  #dc2626;
  --erl: #fef2f2;
  --r:   8px;
  --rs:  6px;
  --fn:  "Manrope", -apple-system, sans-serif;
  --fm:  "JetBrains Mono", monospace;
  --tr:  150ms cubic-bezier(0.4, 0, 0.2, 1);

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

.up-header-left { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.up-title { font-size: 16px; font-weight: 800; letter-spacing: -0.02em; margin: 0; }

.up-badge {
  background: var(--prl);
  color: var(--pr);
  font: 700 11px/1 var(--fm);
  padding: 2px 7px;
  border-radius: 20px;
}

.up-search-wrap { position: relative; flex: 1; min-width: 180px; max-width: 380px; }

.up-search-ico {
  position: absolute; left: 9px; top: 50%;
  transform: translateY(-50%); color: var(--txm); pointer-events: none;
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
  position: absolute; right: 7px; top: 50%; transform: translateY(-50%);
  width: 15px; height: 15px; border-radius: 50%; border: none;
  background: var(--bd); color: var(--tx2);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all var(--tr);
}
.up-search-clear:hover { background: var(--bds); color: var(--tx); }

.up-btn-create {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  background: var(--pr); color: #fff;
  font: 600 12px/1 var(--fn);
  border: none; border-radius: var(--rs);
  cursor: pointer; transition: all var(--tr); white-space: nowrap;
  margin-left: auto;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}
.up-btn-create:hover {
  background: var(--prh);
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
  transform: translateY(-1px);
}

/* ── Body ── */
.up-body { flex: 1; min-height: 0; overflow-y: auto; padding: 16px; }

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
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 48px 20px; color: var(--txm); font-size: 13px;
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

.up-td { padding: 12px 8px; font-size: 13px; color: var(--tx); min-width: 0; }

/* Skeleton */
.up-row--skeleton { pointer-events: none; }

@keyframes up-shimmer {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

.up-sk-avatar, .up-sk-line, .up-sk-badge {
  background: #e2e8f0;
  border-radius: 4px;
  animation: up-shimmer 1.4s ease-in-out infinite;
  animation-delay: var(--sk-delay, 0s);
}

.up-sk-avatar  { width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0; }
.up-sk-lines   { display: flex; flex-direction: column; gap: 5px; }
.up-sk-line--lg { height: 11px; width: 80%; }
.up-sk-line--md { height: 10px; width: 65%; }
.up-sk-line--sm { height: 9px;  width: 50%; }
.up-sk-badge   { height: 18px; width: 80px; border-radius: 20px; }

/* User cell */
.up-td--user { display: flex; align-items: center; gap: 10px; }

.up-avatar {
  width: 34px; height: 34px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font: 700 12px/1 var(--fm); color: #fff; flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.up-name-block { display: flex; flex-direction: column; gap: 2px; min-width: 0; }

.up-full-name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.up-id-chip   { font: 500 10px/1 var(--fm); color: var(--txm); }

/* Login */
.up-login { font: 500 12px/1 var(--fm); color: var(--tx2); }

/* Role badges */
.up-role-badge {
  display: inline-flex; padding: 3px 8px;
  border-radius: 20px; font: 600 10px/1.4 var(--fn);
  white-space: nowrap; border: 1px solid transparent;
}
.up-role--chief  { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
.up-role--admin  { background: #f5f3ff; color: #6d28d9; border-color: #ddd6fe; }
.up-role--branch { background: #ecfdf5; color: #065f46; border-color: #a7f3d0; }

/* Branch */
.up-branch { font: 500 12px var(--fn); color: var(--tx2); }
.up-dash   { color: var(--txm); }

/* Status */
.up-status { display: inline-flex; align-items: center; gap: 5px; font: 600 11px/1 var(--fn); }
.up-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.up-status--on  { color: var(--ok); }
.up-status--on  .up-status-dot { background: var(--ok); }
.up-status--off { color: var(--txm); }
.up-status--off .up-status-dot { background: var(--txm); }

/* Date */
.up-date { font: 400 12px/1 var(--fm); color: var(--txm); }

/* Actions */
.up-td--actions { display: flex; justify-content: flex-end; }

.up-actions { display: flex; gap: 4px; opacity: 0; transition: opacity var(--tr); }
.up-row:hover .up-actions { opacity: 1; }

.up-action-btn {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--bd); border-radius: var(--rs);
  background: var(--sf); cursor: pointer; transition: all var(--tr);
}
.up-action-btn--edit { color: var(--tx2); }
.up-action-btn--edit:hover { background: var(--prl); border-color: var(--pr); color: var(--pr); }
.up-action-btn--del  { color: var(--tx2); }
.up-action-btn--del:hover  { background: var(--erl); border-color: var(--er);  color: var(--er); }

/* Delete confirm */
.up-confirm { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.up-confirm-text { font: 600 11px var(--fn); color: var(--er); }

.up-confirm-yes, .up-confirm-no {
  padding: 3px 8px; border-radius: var(--rs);
  font: 600 11px var(--fn); border: 1px solid;
  cursor: pointer; transition: all var(--tr);
  min-width: 32px; display: flex; align-items: center; justify-content: center;
}
.up-confirm-yes { background: var(--er); border-color: var(--er); color: #fff; }
.up-confirm-yes:hover:not(:disabled) { background: #b91c1c; }
.up-confirm-yes:disabled { opacity: 0.6; cursor: not-allowed; }
.up-confirm-no  { background: var(--sf); border-color: var(--bd); color: var(--tx2); }
.up-confirm-no:hover  { background: var(--sfh); }

/* Spinner */
.up-spinner {
  width: 13px; height: 13px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: up-spin 0.7s linear infinite;
  flex-shrink: 0;
}
.up-spinner--sm { width: 10px; height: 10px; }
@keyframes up-spin { to { transform: rotate(360deg); } }

/* ── Footer ── */
.up-footer {
  display: flex; gap: 16px; padding: 6px 16px;
  background: var(--sf); border-top: 1px solid var(--bd);
  font-size: 11px; color: var(--tx2); flex-shrink: 0;
}
.up-footer b { color: var(--tx); font-family: var(--fm); }

/* ── Modal ── */
.up-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 16px;
}

.up-modal {
  background: var(--sf);
  border: 1px solid var(--bd);
  border-radius: 16px;
  width: 100%; max-width: 520px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.2);
  display: flex; flex-direction: column;
  max-height: calc(100dvh - 32px);
  overflow: hidden;
}

.up-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--bd);
  flex-shrink: 0;
}

.up-modal-title { font-size: 15px; font-weight: 800; letter-spacing: -0.01em; margin: 0; }

.up-modal-close {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--bd); border-radius: var(--rs);
  background: none; color: var(--txm); cursor: pointer; transition: all var(--tr);
}
.up-modal-close:hover { background: var(--sfh); color: var(--tx); }

.up-modal-body {
  padding: 20px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 14px;
}

.up-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.up-field { display: flex; flex-direction: column; gap: 5px; }
.up-field--full { grid-column: 1 / -1; }

.up-label {
  font: 700 10px/1 var(--fn); color: var(--tx2);
  text-transform: uppercase; letter-spacing: 0.04em;
  display: flex; align-items: center; gap: 4px;
}

.up-field--req .up-label::after { content: "*"; color: var(--er); font-size: 11px; }

.up-input, .up-select {
  padding: 9px 10px;
  border: 1.5px solid var(--bd); border-radius: var(--rs);
  font: 500 13px var(--fn); color: var(--tx);
  background: var(--bg); outline: none; transition: all var(--tr);
}
.up-input:focus, .up-select:focus {
  border-color: var(--pr); background: var(--sf);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}
.up-input::placeholder { color: var(--txm); font-weight: 400; }
.up-select:disabled    { opacity: 0.45; cursor: not-allowed; }

.up-pw-wrap { position: relative; }
.up-input--pw { width: 100%; padding-right: 36px; box-sizing: border-box; }

.up-pw-eye {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  display: flex; align-items: center;
  color: var(--txm); background: none; border: none;
  cursor: pointer; padding: 2px; border-radius: 4px; transition: color var(--tr);
}
.up-pw-eye:hover { color: var(--tx2); }

/* Info display (read-only fields) */
.up-info-val {
  height: 38px;
  display: flex; align-items: center;
  padding: 0 10px;
  border: 1.5px solid var(--bd); border-radius: var(--rs);
  background: var(--sfh);
  font: 500 13px var(--fn); color: var(--tx2);
}
.up-info-val--mono { font-family: var(--fm); font-size: 12px; }

.up-divider { border: none; border-top: 1px solid var(--bd); margin: 0 -20px; }

/* Toggle */
.up-toggle-row { display: flex; align-items: center; gap: 10px; padding: 4px 0; }

.up-toggle {
  width: 38px; height: 22px; border-radius: 11px;
  border: none; cursor: pointer; position: relative;
  transition: background var(--tr); flex-shrink: 0;
}
.up-toggle--on  { background: var(--ok); }
.up-toggle--off { background: var(--bds); }

.up-toggle-knob {
  position: absolute; width: 16px; height: 16px;
  background: #fff; border-radius: 50%; top: 3px;
  transition: left var(--tr);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}
.up-toggle--on  .up-toggle-knob { left: 19px; }
.up-toggle--off .up-toggle-knob { left: 3px; }

.up-toggle-label      { font: 600 13px var(--fn); transition: color var(--tr); }
.up-toggle-label--on  { color: var(--ok); }
.up-toggle-label--off { color: var(--txm); }

/* Modal footer */
.up-modal-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 14px 20px; border-top: 1px solid var(--bd); flex-shrink: 0;
}

.up-btn-cancel {
  padding: 8px 16px; border: 1px solid var(--bd); border-radius: var(--rs);
  background: var(--sf); color: var(--tx2);
  font: 600 12px var(--fn); cursor: pointer; transition: all var(--tr);
}
.up-btn-cancel:hover { background: var(--sfh); border-color: var(--bds); }

.up-btn-save {
  padding: 8px 20px;
  background: var(--pr); color: #fff;
  border: none; border-radius: var(--rs);
  font: 600 12px var(--fn); cursor: pointer; transition: all var(--tr);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
  display: flex; align-items: center; gap: 7px;
  min-width: 80px; justify-content: center;
}
.up-btn-save:hover:not(:disabled) {
  background: var(--prh);
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
}
.up-btn-save:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

/* Modal transition */
.up-modal-enter-active { transition: all 200ms ease-out; }
.up-modal-leave-active { transition: all 150ms ease-in; }
.up-modal-enter-from { opacity: 0; }
.up-modal-enter-from .up-modal { transform: scale(0.96) translateY(8px); }
.up-modal-enter-to   .up-modal { transform: scale(1) translateY(0); }
.up-modal-leave-to { opacity: 0; }
.up-modal-leave-to   .up-modal { transform: scale(0.96) translateY(8px); }

/* ── Responsive ── */
@media (max-width: 768px) {
  .up-thead { display: none; }
  .up-row { grid-template-columns: 1fr; gap: 6px; padding: 12px; }
  .up-td { padding: 0; }
  .up-td--login::before  { content: "Логин: ";  font-weight: 600; color: var(--tx2); font-size: 11px; }
  .up-td--branch::before { content: "Филиал: "; font-weight: 600; color: var(--tx2); font-size: 11px; }
  .up-td--created { display: none; }
  .up-actions { opacity: 1; }
  .up-form-row { grid-template-columns: 1fr; }
}
</style>
