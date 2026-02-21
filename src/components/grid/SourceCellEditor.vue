<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from "vue";
import { VISIT_SOURCES } from "@/services/visitsApi";

// ag-grid passes initial value via this prop
const props = defineProps<{ params: { value: string } }>();

// ── Parse incoming encoded value ──
const parse = (v: string) => {
  if (v?.startsWith("Порекомендовали: ")) {
    return { type: "Порекомендовали", custom: v.replace("Порекомендовали: ", "") };
  }
  if (v && !VISIT_SOURCES.includes(v as (typeof VISIT_SOURCES)[number])) {
    return { type: "Другое", custom: v };
  }
  return { type: v || "", custom: "" };
};

const { type: initType, custom: initCustom } = parse(props.params.value);
const selectedType = ref(initType);
const customText   = ref(initCustom);

const showCustom = computed(
  () => selectedType.value === "Порекомендовали" || selectedType.value === "Другое"
);

// ag-grid calls this to get the final cell value
const getValue = (): string => {
  if (selectedType.value === "Порекомендовали") {
    return customText.value.trim()
      ? `Порекомендовали: ${customText.value.trim()}`
      : "Порекомендовали";
  }
  if (selectedType.value === "Другое") {
    return customText.value.trim() || "Другое";
  }
  return selectedType.value;
};

defineExpose({ getValue });

const selectRef = ref<HTMLSelectElement | null>(null);
const inputRef  = ref<HTMLInputElement | null>(null);

onMounted(() => selectRef.value?.focus());

const onTypeChange = () => {
  if (showCustom.value) nextTick(() => inputRef.value?.focus());
};
</script>

<template>
  <div class="sce-wrap">
    <select ref="selectRef" v-model="selectedType" class="sce-select" @change="onTypeChange">
      <option value="">—</option>
      <option v-for="s in VISIT_SOURCES" :key="s" :value="s">{{ s }}</option>
    </select>
    <input
      v-if="showCustom"
      ref="inputRef"
      v-model="customText"
      type="text"
      class="sce-input"
      :placeholder="selectedType === 'Порекомендовали' ? 'Кто порекомендовал...' : 'Уточнение...'"
    />
  </div>
</template>

<style scoped>
.sce-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  padding: 0 4px;
  background: #fff;
}
.sce-select {
  border: 1.5px solid #2563eb;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 12px;
  height: 28px;
  outline: none;
  background: #fff;
  cursor: pointer;
}
.sce-input {
  border: 1.5px solid #2563eb;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  height: 28px;
  outline: none;
  min-width: 120px;
}
</style>
