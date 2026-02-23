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
const isSidebarCollapsed = ref(localStorage.getItem("sidebar-collapsed") === "true");
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

const handleSidebarCollapse = (collapsed: boolean) => {
  isSidebarCollapsed.value = collapsed;
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
      <AppSidebar @toggle-collapse="handleSidebarCollapse" />
      <MobileMenu :is-open="isMobileMenuOpen" @close="closeMobileMenu" />

      <main
        class="pt-14 md:pt-0 transition-all duration-200 h-full overflow-hidden"
        :class="isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'"
      >
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <div :key="route.path" class="page-wrap">
              <component :is="Component" />
            </div>
          </Transition>
        </RouterView>
      </main>
    </template>

    <!-- Login Page -->
    <template v-else>
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <div :key="route.path" class="page-wrap">
            <component :is="Component" />
          </div>
        </Transition>
      </RouterView>
    </template>
  </div>
</template>

<style>
.page-wrap {
  height: 100%;
  overflow: hidden;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
