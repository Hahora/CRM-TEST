<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import AppIcon from "./AppIcon.vue";

interface Props {
  isVisible: boolean;
  title?: string;
  message?: string;
  type?: "spinner" | "dots" | "pulse";
  size?: "sm" | "md" | "lg";
  backdrop?: "blur" | "dark" | "light";
  position?: "fixed" | "absolute";
  zIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: "Загрузка...",
  message: "",
  type: "spinner",
  size: "md",
  backdrop: "blur",
  position: "fixed",
  zIndex: 50,
});

// Блокировка скролла при показе
onMounted(() => {
  if (props.isVisible && props.position === "fixed") {
    document.body.style.overflow = "hidden";
  }
});

onUnmounted(() => {
  if (props.position === "fixed") {
    document.body.style.overflow = "";
  }
});

// Размеры для разных типов
const getSizes = () => {
  switch (props.size) {
    case "sm":
      return {
        spinner: 16,
        container: "p-4",
        title: "text-sm",
        message: "text-xs",
      };
    case "lg":
      return {
        spinner: 32,
        container: "p-8",
        title: "text-xl",
        message: "text-base",
      };
    default: // md
      return {
        spinner: 24,
        container: "p-6",
        title: "text-lg",
        message: "text-sm",
      };
  }
};

const sizes = getSizes();

// Стили фона
const getBackdropClass = () => {
  switch (props.backdrop) {
    case "dark":
      return "bg-black/50";
    case "light":
      return "bg-white/80";
    default: // blur
      return "bg-black/20 backdrop-blur-sm";
  }
};
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isVisible"
        :class="[
          'inset-0 flex items-center justify-center',
          position === 'fixed' ? 'fixed' : 'absolute',
          getBackdropClass(),
        ]"
        :style="{ zIndex }"
      >
        <div
          :class="[
            'bg-white rounded-xl shadow-2xl border border-gray-200 flex items-center gap-4 max-w-sm w-full mx-4',
            sizes.container,
          ]"
        >
          <!-- Spinner Types -->
          <div class="flex-shrink-0">
            <!-- Default Spinner -->
            <div v-if="type === 'spinner'" class="relative">
              <AppIcon
                name="refresh-cw"
                :size="sizes.spinner"
                class="animate-spin text-blue-600"
              />
            </div>

            <!-- Dots Animation -->
            <div v-else-if="type === 'dots'" class="flex items-center gap-1">
              <div
                v-for="i in 3"
                :key="i"
                :class="[
                  'rounded-full bg-blue-600',
                  size === 'sm'
                    ? 'w-2 h-2'
                    : size === 'lg'
                    ? 'w-4 h-4'
                    : 'w-3 h-3',
                ]"
                :style="{
                  animation: `pulse 1.4s ease-in-out ${
                    (i - 1) * 0.2
                  }s infinite both`,
                }"
              ></div>
            </div>

            <!-- Pulse Animation -->
            <div v-else-if="type === 'pulse'" class="relative">
              <div
                :class="[
                  'rounded-full bg-blue-600 animate-ping absolute',
                  size === 'sm'
                    ? 'w-4 h-4'
                    : size === 'lg'
                    ? 'w-8 h-8'
                    : 'w-6 h-6',
                ]"
              ></div>
              <div
                :class="[
                  'rounded-full bg-blue-600',
                  size === 'sm'
                    ? 'w-4 h-4'
                    : size === 'lg'
                    ? 'w-8 h-8'
                    : 'w-6 h-6',
                ]"
              ></div>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div :class="['font-semibold text-gray-900 mb-1', sizes.title]">
              {{ title }}
            </div>
            <div v-if="message" :class="['text-gray-600', sizes.message]">
              {{ message }}
            </div>

            <!-- Slot for custom content -->
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@keyframes pulse {
  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
