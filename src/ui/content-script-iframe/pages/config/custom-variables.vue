<!-- VariableEditorPage.vue -->
<template>
  <div class="flex flex-col min-h-screen bg-[#121212] text-white dark">
    <!-- Header -->
    <header class="sticky top-0 z-10 bg-[#121212] border-b border-gray-800 px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <Button
              variant="ghost"
              size="icon"
              @click="() => router.go('config')"
              class="mr-2 text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <ArrowLeft class="h-5 w-5" />
          </Button>
          <h1 class="font-bold text-base">New Variable</h1>
        </div>
        <Button
            variant="default"
            size="sm"
            :disabled="isAllowedToSave"
            @click="handleSave"
        >
          <Check class="h-4 w-4" />
          Save
        </Button>
      </div>
    </header>

    <!-- Main -->
    <main class="flex-1 px-4 py-4 dark">
      <div class="space-y-6">
        <!-- Variable Name -->
        <div class="space-y-2">
          <Label for="variable-name" class="text-gray-300">Variable Name</Label>
          <Input
              id="variable-name"
              v-model="variableName"
              placeholder="e.g., username, searchTerm"
              class="bg-[#1e1e1e] border-gray-700 text-white focus:ring-purple-500"
          />
        </div>

        <!-- Variable Type -->
        <div class="space-y-2">
          <Label for="variable-type" class="text-gray-300">Variable Type</Label>
          <Select v-model="variableType" fullWidth>
            <SelectTrigger class="bg-[#1e1e1e] border-gray-700 text-white focus:ring-purple-500">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent class="bg-[#1e1e1e] border-gray-700 text-white">
              <SelectItem value="static">Static</SelectItem>
              <SelectItem value="ai">AI Generated</SelectItem>
              <SelectItem value="api">API Response</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Static value -->
        <div v-if="variableType==='static'" class="space-y-2">
          <Label for="static-value" class="text-gray-300">Value</Label>
          <Input
              id="static-value"
              v-model="staticValue"
              placeholder="Static value"
              class="bg-[#1e1e1e] border-gray-700 text-white focus:ring-purple-500"
          />
        </div>

        <!-- AI prompt -->
        <div v-if="variableType==='ai'" class="space-y-2">
          <div class="flex items-center justify-between">
            <Label for="ai-prompt" class="text-gray-300">AI Prompt</Label>
            <span :class="aiPrompt.length>200 ? 'text-red-500 text-xs' : 'text-gray-400 text-xs'">
              {{ aiPrompt.length }}/200
            </span>
          </div>
          <Textarea
              id="ai-prompt"
              v-model="aiPrompt"
              placeholder="Enter prompt for AI generation"
              maxLength="200"
              class="bg-[#1e1e1e] border-gray-700 text-white focus:ring-purple-500 min-h-[100px]"
          />
        </div>

        <!-- API config -->
        <div v-if="variableType==='api'" class="space-y-4">
          <!-- URL + Test -->
          <div class="space-y-2">
            <Label for="api-url" class="text-gray-300">API URL</Label>
            <div class="flex space-x-2">
              <Input
                  id="api-url"
                  v-model="apiUrl"
                  placeholder="https://api.example.com/data"
                  class="bg-[#1e1e1e] border-gray-700 text-white focus:ring-purple-500 flex-1"
              />
              <Button
                  variant="outline"
                  @click="handleTestRequest"
                  :disabled="!apiUrl"
              >
                <Play class="h-4 w-4" />
                Test
              </Button>
            </div>
          </div>

          <!-- Response -->
          <div v-if="apiResponse">
            <Label class="text-gray-300">Response</Label>
            <pre class="bg-[#1e1e1e] border border-gray-700 rounded-md p-3 text-xs text-gray-300 overflow-auto max-h-[200px]">
              {{ apiResponse }}
            </pre>
          </div>

          <!-- JSON Path + Verify -->
          <div v-if="apiResponse" class="space-y-2">
            <Label for="json-path" class="text-gray-300">JSON Path</Label>
            <div class="flex space-x-2">
              <Input
                  id="json-path"
                  v-model="jsonPath"
                  placeholder="data.profile.user.name"
                  class="bg-[#1e1e1e] border-gray-700 text-white focus:ring-purple-500 flex-1"
              />
              <Button
                  variant="outline"
                  @click="handleVerifyPath"
                  :disabled="!jsonPath"
                  class="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white disabled:bg-gray-900"
              >
                Verify
              </Button>
            </div>
            <p v-if="pathVerified!==null"
               :class="pathVerified ? 'text-green-500 text-xs mt-1' : 'text-red-500 text-xs mt-1'">
              {{ pathVerified
                ? 'Path verified successfully!'
                : 'Invalid path. Please check and try again.' }}
            </p>
          </div>

          <!-- Extracted Value -->
          <div v-if="extractedValue" class="space-y-2">
            <Label class="text-gray-300">Extracted Value</Label>
            <div class="bg-[#1e1e1e] border border-gray-700 rounded-md p-3 text-sm text-gray-300">
              {{ extractedValue }}
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowLeft, Check, Play } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { notify } from '@/utils/notifications';
import { v4 as uuidv4  } from 'uuid';
import {CustomVariable} from "@/types/record";

type VariableType = 'static' | 'ai' | 'api'

const router = useStorageRoute('content-script')
const recordConfig = useRecordConfigStore();

// State
const variableName = ref('')
const variableType = ref<VariableType>('static')
const staticValue = ref('')
const aiPrompt = ref('')
const apiUrl = ref('')
const apiResponse = ref<string | null>(null)
const jsonPath = ref('')
const pathVerified = ref<boolean | null>(null)
const extractedValue = ref<string | null>(null)

const isAllowedToSave = computed(() => !variableName.value || (variableType.value === 'api' && pathVerified.value !== true) || (variableType.value ==='ai' && aiPrompt.value.length>200) || (variableType.value === 'static' && !staticValue.value));

// Handlers
async function handleTestRequest() {
  try {
    const res = await fetch(apiUrl.value)
    const data = await res.json()
    apiResponse.value = JSON.stringify(data, null, 2)
    pathVerified.value = null
    extractedValue.value = null
  } catch {
    apiResponse.value = JSON.stringify({ error: 'Failed to fetch data' }, null, 2)
  }
}

function handleVerifyPath() {
  if (!apiResponse.value) return
  try {
    const data = JSON.parse(apiResponse.value)
    const val = jsonPath.value.split('.').reduce((acc: any, key) =>
        acc && acc[key] !== undefined ? acc[key] : undefined, data)
    if (val !== undefined) {
      pathVerified.value = true
      extractedValue.value = typeof val === 'object' ? JSON.stringify(val) : String(val)
    } else {
      pathVerified.value = false
      extractedValue.value = null
    }
  } catch {
    pathVerified.value = false
    extractedValue.value = null
  }
}

function handleSave() {
  if(recordConfig.variables.find(v => v.name === variableName.value)){
    notify({
      title: 'Variable Exists',
      message: 'A variable with the same name already exists.',
      type: 'error',
      duration: 2000
    })
    return
  }

  console.log('Saving variable:', {
    name: variableName.value,
    type: variableType.value,
    ...(variableType.value === 'static' && { value: staticValue.value }),
    ...(variableType.value === 'ai'     && { prompt: aiPrompt.value }),
    ...(variableType.value === 'api'    && {
      apiUrl: apiUrl.value,
      jsonPath: jsonPath.value,
      verified: pathVerified.value,
    }),
  })

  recordConfig.addVariable({
    id: uuidv4(),
    name: variableName.value,
    type: variableType.value,
    meta: {
      ...(variableType.value === 'static' && { value: staticValue.value }),
      ...(variableType.value === 'ai'     && { prompt: aiPrompt.value }),
      ...(variableType.value === 'api'    && {
        api: {
          url: apiUrl.value,
          extractPath: jsonPath.value,
          verified: pathVerified.value,
        }
      }),
    }
  } as CustomVariable)

  notify({
    title: 'Variable Saved',
    message: 'Your variable has been saved successfully.',
    type: 'success',
    duration: 1500
  })

  router.go('config')
}
</script>
