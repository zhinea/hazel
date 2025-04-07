<script setup lang="ts">
import { Notivue, Notification } from 'notivue'
import {useAuthStore} from "@/stores/auth.store";
import Auth from "@/components/Auth.vue";

const authStore = useAuthStore();

onMounted(() => {
  authStore.initialize();
});

</script>


<template>
  <div>
    <RouterView v-if="authStore.isAuthenticated" />
    <Auth v-else />

    <Notivue v-slot="item">
      <Notification :item="item" />
    </Notivue>
  </div>
</template>

<style scoped></style>
