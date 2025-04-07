<script setup lang="ts">
import { useConfigStore, type VariableType } from '@/stores/config.store'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'

const configStore = useConfigStore()
const router = useRouter()

const variableName = ref('')
const variableType = ref<VariableType>('static')
const staticValue = ref('')
const apiEndpoint = ref('')
const apiHeaders = ref('')

function addVariable() {
  configStore.addVariable({
    id: uuidv4(),
    name: variableName.value,
    type: variableType.value,
    value: variableType.value === 'static' ? staticValue.value : '',
    apiEndpoint: variableType.value === 'api' ? apiEndpoint.value : undefined,
    apiHeaders: variableType.value === 'api' ? parseHeaders(apiHeaders.value) : undefined
  })
  
  router.push('/content-script-iframe/config')
}

function parseHeaders(headersStr: string): Record<string, string> {
  try {
    return headersStr.split('\n')
      .filter(line => line.trim() !== '')
      .reduce((acc, line) => {
        const [key, value] = line.split(':').map(part => part.trim())
        if (key && value) {
          acc[key] = value
        }
        return acc
      }, {} as Record<string, string>)
  } catch (e) {
    return {}
  }
}

function goBack() {
  router.push('/content-script-iframe/config')
}
</script>

<template>
  <div class="p-4">
    <div class="flex items-center mb-4">
      <button @click="goBack" class="btn btn-sm btn-ghost mr-2">
        &larr;
      </button>
      <h2 class="text-xl font-bold">Add Custom Variable</h2>
    </div>
    
    <div class="form-control mb-4">
      <label class="label">
        <span class="label-text">Variable Name</span>
      </label>
      <input 
        v-model="variableName" 
        type="text" 
        placeholder="Enter variable name" 
        class="input input-bordered w-full"
      />
    </div>
    
    <div class="form-control mb-4">
      <label class="label">
        <span class="label-text">Variable Type</span>
      </label>
      <select v-model="variableType" class="select select-bordered w-full">
        <option value="static">Static Value</option>
        <option value="ai">AI Generated</option>
        <option value="api">API Response</option>
      </select>
    </div>
    
    <div v-if="variableType === 'static'" class="form-control mb-4">
      <label class="label">
        <span class="label-text">Static Value</span>
      </label>
      <input 
        v-model="staticValue" 
        type="text" 
        placeholder="Enter static value" 
        class="input input-bordered w-full"
      />
    </div>
    
    <div v-if="variableType === 'api'" class="space-y-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text">API Endpoint</span>
        </label>
        <input 
          v-model="apiEndpoint" 
          type="text" 
          placeholder="https://api.example.com/data" 
          class="input input-bordered w-full"
        />
      </div>
      
      <div class="form-control">
        <label class="label">
          <span class="label-text">Headers (one per line, format: Key: Value)</span>
        </label>
        <textarea 
          v-model="apiHeaders" 
          placeholder="Content-Type: application/json
Authorization: Bearer token" 
          class="textarea textarea-bordered h-24"
        ></textarea>
      </div>
    </div>
    
    <div v-if="variableType === 'ai'" class="alert alert-info mb-4">
      <div>
        <span>AI-generated values will be created during playback.</span>
      </div>
    </div>
    
    <div class="flex justify-end">
      <button 
        @click="addVariable" 
        class="btn btn-primary"
        :disabled="!variableName || (variableType === 'static' && !staticValue) || (variableType === 'api' && !apiEndpoint)"
      >
        Add Variable
      </button>
    </div>
  </div>
</template>