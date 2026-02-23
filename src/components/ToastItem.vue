<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import AppIcon from "./AppIcon.vue";

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

interface Props {
  toast: Toast;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  remove: [id: string];
}>();

const isVisible = ref(false);
const progress = ref(100);
let progressInterval: ReturnType<typeof setInterval>;

const iconName = computed(() => config.value.icon as any);

const config = computed(() => {
  const map = {
    success: {
      color: "#059669",
      colorLight: "#ecfdf5",
      icon: "check-circle",
    },
    error: {
      color: "#dc2626",
      colorLight: "#fef2f2",
      icon: "x-circle",
    },
    warning: {
      color: "#d97706",
      colorLight: "#fffbeb",
      icon: "alert-triangle",
    },
    info: {
      color: "#2563eb",
      colorLight: "#eff6ff",
      icon: "info",
    },
  };
  return map[props.toast.type] ?? map.info;
});

const handleClose = () => {
  isVisible.value = false;
  clearInterval(progressInterval);
  setTimeout(() => {
    emit("remove", props.toast.id);
  }, 300);
};

onMounted(() => {
  requestAnimationFrame(() => {
    isVisible.value = true;
  });

  if (!props.toast.persistent) {
    const duration = props.toast.duration || 5000;
    const step = 50;
    const decrement = (step / duration) * 100;

    progressInterval = setInterval(() => {
      progress.value -= decrement;
      if (progress.value <= 0) {
        progress.value = 0;
        clearInterval(progressInterval);
        handleClose();
      }
    }, step);
  }
});
</script>

<template>
  <Transition
    enter-active-class="ti-enter-active"
    enter-from-class="ti-enter-from"
    leave-active-class="ti-leave-active"
    leave-to-class="ti-leave-to"
  >
    <div
      v-if="isVisible"
      class="ti-wrap"
      :style="{ '--t-color': config.color, '--t-color-light': config.colorLight }"
      role="alert"
    >
      <div class="ti-body">
        <!-- Icon -->
        <div class="ti-icon-wrap">
          <AppIcon :name="iconName" :size="17" class="ti-icon" />
        </div>

        <!-- Content -->
        <div class="ti-content">
          <p class="ti-title">{{ toast.title }}</p>
          <p v-if="toast.message" class="ti-message">{{ toast.message }}</p>
        </div>

        <!-- Close -->
        <button class="ti-close" @click="handleClose" aria-label="Закрыть">
          <AppIcon name="x" :size="13" />
        </button>
      </div>

      <!-- Progress bar -->
      <div v-if="!toast.persistent" class="ti-progress-track">
        <div class="ti-progress-bar" :style="{ width: `${progress}%` }" />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.ti-wrap {
  width: 320px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-left: 3px solid var(--t-color);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.05);
  overflow: hidden;
  margin-bottom: 10px;
  font-family: "Manrope", -apple-system, BlinkMacSystemFont, sans-serif;
}

.ti-body {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 13px 13px 13px 14px;
}

.ti-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--t-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--t-color);
}

.ti-icon {
  color: var(--t-color);
}

.ti-content {
  flex: 1;
  min-width: 0;
  padding-top: 1px;
}

.ti-title {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
}

.ti-message {
  font-size: 12px;
  color: #64748b;
  margin: 3px 0 0;
  line-height: 1.4;
}

.ti-close {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 6px;
  color: #94a3b8;
  cursor: pointer;
  transition: background 120ms, color 120ms;
  margin: -2px -2px 0 0;
}

.ti-close:hover {
  background: #f1f5f9;
  color: #475569;
}

.ti-progress-track {
  height: 2px;
  background: #f1f5f9;
}

.ti-progress-bar {
  height: 100%;
  background: var(--t-color);
  opacity: 0.6;
  transition: width 50ms linear;
}

/* Transitions */
.ti-enter-active {
  transition: all 280ms cubic-bezier(0.21, 1.02, 0.73, 1);
}
.ti-leave-active {
  transition: all 220ms cubic-bezier(0.06, 0.71, 0.55, 1);
}
.ti-enter-from {
  transform: translateX(calc(100% + 16px));
  opacity: 0;
}
.ti-leave-to {
  transform: translateX(calc(100% + 16px));
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
}
</style>
