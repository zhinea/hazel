<!-- Navbar.vue -->
<template>
  <nav
    class="sticky top-0 z-10 bg-[#121212] border-b border-gray-800 px-4 py-3"
  >
    <div class="flex items-center justify-between">
      <div class="font-bold text-xl flex items-center">
        <img
          src="@assets/brands/logo.png"
          alt="logo"
          class="h-8 w-auto mr-2 inline"
        />
        <span>Hazel</span>
      </div>

      <div class="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          @click="onRecord"
          aria-label="Record"
          class="text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <Video class="h-24 w-24" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          @click="goHome"
          aria-label="Home"
          class="text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <Home class="h-24 w-24" />
        </Button>
      </div>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { useRouter } from "vue-router"
import { Home, Video, Crosshair } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {BasicResponseServer, IncommingMessage} from "@/types/message";

const router = useRouter()
const { go } = useStorageRoute('content-script');
const windowStore = useWindowStore();

function onRecord() {
  windowStore.openContentScript();
  go('config')
}

function goHome() {
  router.push("/")
}
</script>
