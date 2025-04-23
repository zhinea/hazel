<script setup lang="ts">
import { Notivue, Notification } from 'notivue'
import {useStorageRoute} from "@/composables/useStorageRoute";
import ConfigView from './pages/config/index.vue'
import ConfigCustomVariables from './pages/config/custom-variables.vue'

const route = useStorageRoute('content-script');
const config = useRecordConfigStore();

onMounted(async () => {
  await config.load();

  console.log(config);
})
// config.$subscribe((state) => {
//   // config.save()
// }, { detached: true })

</script>

<template>
  <div class="min-h-screen bg-background text-foreground">


    <div v-if="route.is('/')">
      Hello World

      <div @click="route.go('config')">go to config</div>
    </div>

    <ConfigView v-if="route.is('config')" />

    <ConfigCustomVariables v-if="route.is('config.custom-variable')" />

    <Notivue v-slot="item">
      <Notification :item="item" />
    </Notivue>
  </div>
</template>

<style scoped></style>
