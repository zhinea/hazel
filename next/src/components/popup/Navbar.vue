<!-- Navbar.vue -->
<template>
  <nav
    class="sticky top-0 z-10 bg-[#121212] border-b border-gray-800 px-4 py-3"
  >
    <div class="flex items-center justify-between">
      <div class="font-bold text-xl">Hazel</div>

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

const router = useRouter()

function onRecord() {
  console.log("Record")
}

function goHome() {
  router.push("/")
}
</script>
