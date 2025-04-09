<!-- ConfigPage.vue -->
<template>
  <div class="flex flex-col min-h-screen bg-[#121212] text-white">
    <!-- Main form -->
    <main class="flex-1 px-4 py-4 mt-2">
      <div class="space-y-6">
        <!-- Record Name -->
        <div class="space-y-2">
          <Label for="record-name" class="text-gray-300">Record Name</Label>
          <Input
              id="record-name"
              v-model="config.name"
              class="bg-[#1e1e1e] border-gray-700 text-white focus:ring-purple-500"
          />
        </div>

        <!-- Options -->
        <div class="space-y-4">
          <p class="text-base font-medium text-gray-200">Options</p>

          <template v-for="(option, index) in options" :key="index">
            <!-- Special styling for Multi-tab option -->
            <div v-if="option.featured" class="animated-border-wrapper">
              <div class="animated-border-content flex items-center justify-between py-3 px-4 space-x-1">
                <div>
                  <h3 class="text-sm font-medium text-gray-200">{{ option.title }}</h3>
                  <p class="text-xs text-gray-400 mt-1">{{ option.description }}</p>
                </div>
                <Switch
                    v-model:checked="config.options[option.id]"
                    class="data-[state=checked]:bg-purple-600"
                />
              </div>
            </div>

            <!-- Regular styling for other options -->
            <div
                v-else
                class="flex items-center justify-between py-3 border-b border-gray-800 space-x-1 px-1"
            >
              <div>
                <h3 class="text-sm font-medium text-gray-200">{{ option.title }}</h3>
                <p class="text-xs text-gray-400 mt-1">{{ option.description }}</p>
              </div>
              <Switch
                  v-model:checked="config.options[option.id]"
                  class="data-[state=checked]:bg-purple-600"
              />
            </div>
          </template>
        </div>

        <!-- Custom Variables -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-medium text-gray-200">Custom Variables</h2>
            <Button
                variant="outline"
                size="sm"
                @click="handleAddVariable"
                class="dark"
            >
              Add Variable
            </Button>
          </div>
          <CustomVariablesList :variables="config.variables" />

          <div class="flex justify-end">
            <Button color="primary" size="sm" class="dark">
              <Video class="h-4 w-4 mr-2" />
              Start Record
            </Button>
          </div>

        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import CustomVariablesList from '@/components/contentScript/CustomVariableList.vue'
import { Video } from 'lucide-vue-next'

const config = useRecordConfigStore();
const route = useStorageRoute('content-script');

// Define options as an array for dynamic rendering
const options = ref([
  {
    id: 'bypassCaptcha',
    title: 'Bypass Captcha',
    description: 'Automatically solve and bypass captchas',
    defaultValue: false,
    featured: false,
  },
  {
    id: 'xhrIntercept',
    title: 'Intercept XHR & Fetch',
    description: 'Intercept and modify network requests',
    defaultValue: false,
    featured: false,
  },
  {
    id: 'multiTab',
    title: 'Multi-tab',
    description: 'Watch everything even when you switch tabs',
    defaultValue: false,
    featured: false,
  },
  {
    id: 'magicScrape',
    title: 'Magic Scrape',
    description: 'Automatically extract data from web pages using AI',
    defaultValue: false,
    featured: true,
  },
]);

function handleAddVariable() {
  route.go('config.custom-variable')
}

</script>
<style scoped>
.animated-border-wrapper {
  position: relative;
  border-radius: 4px;
  padding: 1px;
  background: linear-gradient(90deg,
  #3b82f6, /* blue */
  #8b5cf6, /* violet */
  #ec4899, /* pink */
  #8b5cf6, /* violet */
  #3b82f6  /* blue */
  );
  background-size: 200% 100%;
  animation: gradientBorder 3s linear infinite;
}

.animated-border-content {
  background-color: #121212; /* Match your background color */
  border-radius: 3px; /* Slightly smaller than wrapper */
  height: 100%;
  width: 100%;
}

@keyframes gradientBorder {
  0% { background-position: 0% 0; }
  100% { background-position: 200% 0; }
}
</style>