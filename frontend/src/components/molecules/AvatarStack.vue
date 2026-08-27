<template>
  <div class="avatar-stack">
    <Avatar
      v-for="u in users.slice(0, limit)"
      :key="u.id"
      :user-id="u.id"
      :nom="u.nom"
      :avatar-url="u.avatar_url"
      :size="size"
      v-bind="avatarAttrs"
    />
    <slot />
  </div>
</template>

<script setup>
import Avatar from '../../atoms/Avatar.vue';
const props = defineProps({ users: { type: Array, default: () => [] }, limit: { type: Number, default: 3 }, size: { type: Number, default: 30 }, avatarAttrs: { type: Object, default: () => ({}) } });
</script>
