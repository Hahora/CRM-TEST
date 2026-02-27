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
  <div class="h-screen h-[100dvh] flex flex-col overflow-hidden bg-gray-50">
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

      <!--
        Спейсер на мобайле под fixed AppHeader (h-14 = 56px).
        На десктопе (md+) хедер скрыт, спейсер не нужен.
      -->
      <div class="h-14 flex-shrink-0 md:hidden" aria-hidden="true" />

      <main
        class="flex-1 min-h-0 flex flex-col transition-all duration-200 overflow-hidden"
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
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
