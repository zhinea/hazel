<!-- ConfigPage.vue -->
<template>
  <div class="flex flex-col min-h-screen bg-[#121212] text-white dark">
    <!-- Header -->
    <header class="sticky top-0 z-10 bg-[#121212] border-b border-gray-800 px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <h1 class="font-bold text-base">New Record</h1>
        </div>
        <Button
            size="sm"
            class="dark"
            @click="startRecording"
            :disabled="isLoading"
        >
          <Video class="h-4 w-4" />
          {{ isLoading ? 'Starting...' : 'Start record' }}
        </Button>
      </div>
    </header>

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
              <div 
                class="animated-border-content flex items-center justify-between py-3 px-4 space-x-1 cursor-pointer"
              >
                <div>
                  <h3 class="text-sm font-medium text-gray-200">{{ option.title }}</h3>
                  <p class="text-xs text-gray-400 mt-1">{{ option.description }}</p>
                </div>
                <Switch
                    v-model:checked="config.options[option.id].meta.value"
                />
              </div>
            </div>

            <!-- Regular styling for other options -->
            <div
                v-else
                class="flex items-center justify-between py-3 border-b border-gray-800 space-x-1 px-1 cursor-pointer"
            >
              <div>
                <h3 class="text-sm font-medium text-gray-200">{{ option.title }}</h3>
                <p class="text-xs text-gray-400 mt-1">{{ option.description }}</p>
              </div>
              <Switch
                  v-model:checked="config.options[option.id].meta.value"
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


        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import CustomVariablesList from '@/components/contentScript/CustomVariableList.vue'
import {ArrowLeft, Check, Video} from 'lucide-vue-next'
import {RecordOption} from "@/types/record";
import TestSwitch from '@/components/contentScript/TestSwitch.vue'
import { Config } from '@/utils/config'
import { useAuthStore } from '@/stores/auth.store'
import { notify } from "@/utils/notifications"
import { useRecordsStore } from '@/stores/records.store'

const config = useRecordConfigStore();
const recordsStore = useRecordsStore();
const route = useStorageRoute('content-script');
const authStore = useAuthStore();
const isLoading = ref(false);

// Define options as an array for dynamic rendering
const options = ref([
  {
    id: RecordOption.BYPASS_CAPTCHA,
    title: 'Bypass Captcha',
    description: 'Automatically solve and bypass captchas',
    defaultValue: false,
    featured: false,
  },
  {
    id: RecordOption.XHR_INTERCEPT,
    title: 'Intercept XHR & Fetch',
    description: 'Intercept and modify network requests',
    defaultValue: false,
    featured: false,
  },
  {
    id: RecordOption.MULTI_TAB,
    title: 'Multi-tab',
    description: 'Watch everything even when you switch tabs',
    defaultValue: false,
    featured: false,
  },
  {
    id: RecordOption.MAGIC_SCRAPE,
    title: 'Magic Scrape',
    description: 'Automatically extract data from web pages using AI',
    defaultValue: false,
    featured: true,
  },
]);


function handleAddVariable() {
  route.go('config.custom-variable')
}

async function startRecording() {
  if (!config.name) {
    notify({
      title: 'Error',
      message: 'Please provide a name for the record',
      type: 'error'
    });
    return;
  }

  isLoading.value = true;
  try {
    if (!authStore.isAuthenticated) {
      notify({
        title: 'Authentication Required',
        message: 'Please log in to create a record',
        type: 'warning'
      });
      isLoading.value = false;
      return;
    }

    const recordData = {
      name: config.name,
      description: config.description || '',
      options: config.options,
      variables: config.variables
    };

    const data = await recordsStore.addRecord(recordData);
    
    // Save record ID for reference
    chrome.storage.local.set({ 'current-record-id': data.id });
    
    // Start the actual recording process
    chrome.runtime.sendMessage({ 
      action: 'startRecording',
      recordId: data.id 
    });
    
    // Close the config menu or transition to recording state
    // Depending on your UX flow
  } catch (error: unknown) {
    console.error('Error creating record:', error);
    notify({
      title: 'Error',
      message: error instanceof Error ? error.message : 'Failed to create record',
      type: 'error'
    });
  } finally {
    isLoading.value = false;
  }
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