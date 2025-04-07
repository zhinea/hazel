<script setup lang="ts">
import { useConfigStore } from '@/stores/config.store'
import { useRouter } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'

const configStore = useConfigStore()
const router = useRouter()

function addCustomVariable() {
  router.push('/content-script-iframe/config/custom-variables')
}

function startRecording() {
  // Send message to background script to start recording with config
  chrome.runtime.sendMessage({
    action: 'startRecording',
    config: {
      name: configStore.recordingName,
      bypassCaptcha: configStore.bypassCaptcha,
      saveXhrFetch: configStore.saveXhrFetch,
      customVariables: configStore.customVariables
    }
  })
}
</script>

<template>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">Recording Configuration</h2>
    
    <div class="form-control mb-4">
      <label class="label">
        <span class="label-text">Recording Name</span>
      </label>
      <input 
        v-model="configStore.recordingName" 
        type="text" 
        placeholder="Enter recording name" 
        class="input input-bordered w-full"
      />
    </div>
    
    <div class="form-control mb-2">
      <label class="label cursor-pointer">
        <span class="label-text">Bypass Captcha</span>
        <input 
          v-model="configStore.bypassCaptcha" 
          type="checkbox" 
          class="toggle"
        />
      </label>
    </div>
    
    <div class="form-control mb-4">
      <label class="label cursor-pointer">
        <span class="label-text">Save XHR & Fetch Requests</span>
        <input 
          v-model="configStore.saveXhrFetch" 
          type="checkbox" 
          class="toggle"
        />
      </label>
    </div>
    
    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-lg font-semibold">Custom Variables</h3>
        <button 
          @click="addCustomVariable" 
          class="btn btn-sm btn-primary"
        >
          Add Variable
        </button>
      </div>
      
      <div v-if="configStore.customVariables.length === 0" class="text-gray-500 text-sm">
        No custom variables added yet.
      </div>
      
      <div v-else class="space-y-2">
        <div 
          v-for="variable in configStore.customVariables" 
          :key="variable.id"
          class="p-2 border rounded flex justify-between items-center"
        >
          <div>
            <div class="font-medium">{{ variable.name }}</div>
            <div class="text-xs text-gray-500">{{ variable.type }}</div>
          </div>
          <button 
            @click="configStore.removeVariable(variable.id)"
            class="btn btn-xs btn-error"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
    
    <div class="flex justify-end">
      <button 
        @click="startRecording" 
        class="btn btn-primary"
        :disabled="!configStore.recordingName"
      >
        Start Recording
      </button>
    </div>
  </div>
</template>