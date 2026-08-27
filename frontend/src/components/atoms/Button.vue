<template>
  <button v-bind="$attrs">
    <slot />
  </button>
</template>

<script setup>
// Intentionally no defineProps to forward all attributes and native listeners
</script>
