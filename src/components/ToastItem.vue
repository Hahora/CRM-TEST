<script setup lang="ts">
import { onMounted, ref } from "vue";
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

const getToastStyles = () => {
  switch (props.toast.type) {
    case "success":
      return "bg-green-50 border-green-200 text-green-800";
    case "error":
      return "bg-red-50 border-red-200 text-red-800";
    case "warning":
      return "bg-orange-50 border-orange-200 text-orange-800";
    case "info":
      return "bg-blue-50 border-blue-200 text-blue-800";
    default:
      return "bg-gray-50 border-gray-200 text-gray-800";
  }
};

const getIconName = () => {
  switch (props.toast.type) {
    case "success":
      return "check-circle";
    case "error":
      return "x-circle";
    case "warning":
      return "alert-triangle";
    case "info":
      return "info";
    default:
      return "info";
  }
};

const getIconColor = () => {
  switch (props.toast.type) {
    case "success":
      return "text-green-500";
    case "error":
      return "text-red-500";
    case "warning":
      return "text-orange-500";
    case "info":
      return "text-blue-500";
    default:
      return "text-gray-500";
  }
};

const handleClose = () => {
  isVisible.value = false;
  setTimeout(() => {
    emit("remove", props.toast.id);
  }, 300);
};

onMounted(() => {
  isVisible.value = true;

  // Автоматическое закрытие
  if (!props.toast.persistent) {
    const duration = props.toast.duration || 5000;
    setTimeout(() => {
      handleClose();
    }, duration);
  }
});
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="transform translate-y-full opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform translate-y-full opacity-0"
  >
    <div
      v-if="isVisible"
      :class="[
        'mb-4 p-4 rounded-lg border shadow-lg max-w-sm w-full',
        getToastStyles(),
      ]"
      role="alert"
    >
      <div class="flex items-start gap-3">
        <!-- Icon -->
        <div class="flex-shrink-0 mt-0.5">
          <AppIcon :name="getIconName()" :size="20" :class="getIconColor()" />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-semibold mb-1">
            {{ toast.title }}
          </h4>
          <p v-if="toast.message" class="text-sm opacity-90">
            {{ toast.message }}
          </p>
        </div>

        <!-- Close Button -->
        <button
          @click="handleClose"
          class="flex-shrink-0 p-1 rounded-md hover:bg-black hover:bg-opacity-10 transition-colors"
          aria-label="Закрыть"
        >
          <AppIcon name="x" :size="16" class="opacity-70" />
        </button>
      </div>
    </div>
  </Transition>
</template>
