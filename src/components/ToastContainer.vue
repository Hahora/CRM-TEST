<script setup lang="ts">
import { useToast } from "@/composables/useToast";
import ToastItem from "./ToastItem.vue";

const { toasts, removeToast } = useToast();
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-50 pointer-events-none">
      <div class="pointer-events-auto">
        <TransitionGroup
          enter-active-class="transition-all duration-300 ease-out"
          leave-active-class="transition-all duration-300 ease-in"
          move-class="transition-all duration-300"
        >
          <ToastItem
            v-for="toast in toasts"
            :key="toast.id"
            :toast="toast"
            @remove="removeToast"
          />
        </TransitionGroup>
      </div>
    </div>
  </Teleport>
</template>
