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

const config = computed(() => {
  const map = {
    success: {
      bg: "bg-white dark:bg-gray-900",
      border: "border-green-500",
      icon: "check-circle",
      iconBg: "bg-green-100 dark:bg-green-900/40",
      iconColor: "text-green-600 dark:text-green-400",
      progressColor: "bg-green-500",
      titleColor: "text-gray-900 dark:text-gray-100",
    },
    error: {
      bg: "bg-white dark:bg-gray-900",
      border: "border-red-500",
      icon: "x-circle",
      iconBg: "bg-red-100 dark:bg-red-900/40",
      iconColor: "text-red-600 dark:text-red-400",
      progressColor: "bg-red-500",
      titleColor: "text-gray-900 dark:text-gray-100",
    },
    warning: {
      bg: "bg-white dark:bg-gray-900",
      border: "border-amber-500",
      icon: "alert-triangle",
      iconBg: "bg-amber-100 dark:bg-amber-900/40",
      iconColor: "text-amber-600 dark:text-amber-400",
      progressColor: "bg-amber-500",
      titleColor: "text-gray-900 dark:text-gray-100",
    },
    info: {
      bg: "bg-white dark:bg-gray-900",
      border: "border-blue-500",
      icon: "info",
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      progressColor: "bg-blue-500",
      titleColor: "text-gray-900 dark:text-gray-100",
    },
  };
  return map[props.toast.type] ?? map.info;
});

const handleClose = () => {
  isVisible.value = false;
  clearInterval(progressInterval);
  setTimeout(() => {
    emit("remove", props.toast.id);
  }, 400);
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
    enter-active-class="transition-all duration-400 ease-[cubic-bezier(0.21,1.02,0.73,1)]"
    enter-from-class="translate-x-full opacity-0 scale-95"
    enter-to-class="translate-x-0 opacity-100 scale-100"
    leave-active-class="transition-all duration-300 ease-[cubic-bezier(0.06,0.71,0.55,1)]"
    leave-from-class="translate-x-0 opacity-100 scale-100 max-h-40"
    leave-to-class="translate-x-full opacity-0 scale-95 max-h-0"
  >
    <div
      v-if="isVisible"
      :class="[
        'mb-3 rounded-xl border-l-4 shadow-xl shadow-black/8 max-w-sm w-full overflow-hidden',
        'backdrop-blur-sm ring-1 ring-black/5 dark:ring-white/10',
        config.bg,
        config.border,
      ]"
      role="alert"
    >
      <div class="p-4">
        <div class="flex items-start gap-3">
          <!-- Icon -->
          <div
            :class="[
              'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
              config.iconBg,
            ]"
          >
            <AppIcon :name="config.icon" :size="18" :class="config.iconColor" />
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0 pt-0.5">
            <h4
              :class="[
                'text-sm font-semibold leading-tight',
                config.titleColor,
              ]"
            >
              {{ toast.title }}
            </h4>
            <p
              v-if="toast.message"
              class="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed"
            >
              {{ toast.message }}
            </p>
          </div>

          <!-- Close Button -->
          <button
            @click="handleClose"
            class="flex-shrink-0 p-1.5 -m-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
            aria-label="Закрыть"
          >
            <AppIcon name="x" :size="14" />
          </button>
        </div>
      </div>

      <!-- Progress bar -->
      <div
        v-if="!toast.persistent"
        class="h-0.5 w-full bg-gray-100 dark:bg-gray-800"
      >
        <div
          :class="[
            'h-full transition-all duration-75 ease-linear rounded-full',
            config.progressColor,
          ]"
          :style="{ width: `${progress}%`, opacity: 0.7 }"
        />
      </div>
    </div>
  </Transition>
</template>
