<template>
  <textarea
    :value="modelValue"
    @input="onInput"
    v-bind="$attrs"
    :class="['atom-textarea', $attrs.class]"
  />
</template>

<script setup>
const props = defineProps({ modelValue: [String, Number, null] });
const emit = defineEmits(['update:modelValue']);

const onInput = (e) => emit('update:modelValue', e.target.value);
</script>

<style scoped>
.atom-textarea {
  width: 100%;
  min-height: 100px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card-bg);
  color: var(--text);
  font-size: 14px;
  resize: vertical;
}
</style>
