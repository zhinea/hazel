<script setup lang="ts">
import { Notivue, Notification } from 'notivue'
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">

    <RouterView />


    <Notivue v-slot="item">
      <Notification :item="item" />
    </Notivue>
  </div>
</template>

<style scoped></style>
