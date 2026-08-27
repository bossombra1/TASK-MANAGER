<template>
  <input
    :value="modelValue"
    @input="onInput"
    v-bind="$attrs"
    :class="['atom-input', $attrs.class]"
  />
</template>

<script setup>
const props = defineProps({ modelValue: [String, Number, null] });
const emit = defineEmits(['update:modelValue']);

const onInput = (e) => emit('update:modelValue', e.target.value);
</script>

<style scoped>
.atom-input {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--card-bg);
  color: var(--text);
  font-size: 14px;
}
</style>
