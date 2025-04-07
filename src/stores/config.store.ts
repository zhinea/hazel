import { defineStore } from 'pinia'
import { ref } from 'vue'

export type VariableType = 'static' | 'ai' | 'api'

export interface CustomVariable {
  id: string
  name: string
  type: VariableType
  value: string
  apiEndpoint?: string
  apiHeaders?: Record<string, string>
}

export const useConfigStore = defineStore('config', () => {
  const recordingName = ref('')
  const bypassCaptcha = ref(false)
  const saveXhrFetch = ref(false)
  const customVariables = ref<CustomVariable[]>([])
  
  function addVariable(variable: CustomVariable) {
    customVariables.value.push(variable)
  }
  
  function updateVariable(id: string, updates: Partial<CustomVariable>) {
    const index = customVariables.value.findIndex(v => v.id === id)
    if (index !== -1) {
      customVariables.value[index] = { ...customVariables.value[index], ...updates }
    }
  }
  
  function removeVariable(id: string) {
    const index = customVariables.value.findIndex(v => v.id === id)
    if (index !== -1) {
      customVariables.value.splice(index, 1)
    }
  }
  
  return {
    recordingName,
    bypassCaptcha,
    saveXhrFetch,
    customVariables,
    addVariable,
    updateVariable,
    removeVariable
  }
})