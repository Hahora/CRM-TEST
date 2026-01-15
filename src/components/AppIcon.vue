<script setup lang="ts">
import { computed } from "vue";
import { iconComponents, type IconName } from "@/components/icons";

interface Props {
  name: IconName;
  size?: number;
  class?: string | string[] | Record<string, boolean>;
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  class: "",
});

const IconComponent = computed(() => iconComponents[props.name]);
</script>

<template>
  <component :is="IconComponent" :size="size" :class="props.class" />
</template>
