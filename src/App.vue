<script setup lang="ts">
import { ref, computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import AppHeader from "./components/AppHeader.vue";
import AppSidebar from "./components/AppSidebar.vue";
import MobileMenu from "./components/MobileMenu.vue";
import ToastContainer from "./components/ToastContainer.vue";
import LoadingOverlay from "./components/LoadingOverlay.vue";
import { useLoading } from "./composables/useLoading";

const route = useRoute();
const isMobileMenuOpen = ref(false);
const { loadingState } = useLoading();

const showAppInterface = computed(() => {
  return route.name !== "login";
});

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};
</script>

<template>
  <div class="h-screen h-[100dvh] overflow-hidden bg-gray-50">
    <!-- Global Loading Overlay -->
    <LoadingOverlay
      :is-visible="loadingState.isVisible"
      :title="loadingState.title"
      :message="loadingState.message"
    />

    <!-- Toast Container -->
    <ToastContainer />

    <!-- App Interface -->
    <template v-if="showAppInterface">
      <AppHeader @toggle-sidebar="toggleMobileMenu" />
      <AppSidebar />
      <MobileMenu :is-open="isMobileMenuOpen" @close="closeMobileMenu" />

      <main
        class="pt-14 md:pt-0 md:ml-64 transition-all duration-300 h-full overflow-hidden"
      >
        <RouterView />
      </main>
    </template>

    <!-- Login Page -->
    <template v-else>
      <RouterView />
    </template>
  </div>
</template>
