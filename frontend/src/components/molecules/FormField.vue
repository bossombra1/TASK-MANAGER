<template>
  <div class="form-group" :style="style">
    <label v-if="label">{{ label }}</label>
    <slot />
    <div v-if="hint" class="field-hint">{{ hint }}</div>
    <div v-if="error" class="field-error" :style="errorStyle">{{ error }}</div>
  </div>
</template>

<script setup>
const props = defineProps({ label: { type: String, default: '' }, hint: { type: String, default: '' }, error: { type: String, default: '' }, style: { type: String, default: '' }, errorStyle: { type: String, default: '' } });
</script>
