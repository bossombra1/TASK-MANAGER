<template>
  <router-view :key="$route.fullPath" />
  <ToastContainer />
  <PlanLimitModal />
</template>

<script setup>
import ToastContainer from './components/atoms/ToastContainer.vue';
import PlanLimitModal from './components/organisms/PlanLimitModal.vue';
</script>