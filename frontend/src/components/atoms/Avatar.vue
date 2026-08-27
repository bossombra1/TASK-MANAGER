<template>
  <div class="avatar" :style="{ background: color, width: size + 'px', height: size + 'px', fontSize: fontSize + 'px' }">
    <img v-if="avatarSrc" :src="avatarSrc" alt="" />
    <span v-else>{{ initialsText }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { colorFor, initials } from '../../utils/colors';
import { resolveAvatarUrl } from '../../utils/avatar';

const props = defineProps({
  userId: { type: String, default: null },
  nom: { type: String, default: '' },
  avatarUrl: { type: String, default: null },
  size: { type: Number, default: 30 },
});

const color = computed(() => colorFor(props.userId));
const initialsText = computed(() => initials(props.nom));
const fontSize = computed(() => Math.round(props.size * 0.36));
const avatarSrc = computed(() => resolveAvatarUrl(props.avatarUrl));
</script>
