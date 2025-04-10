<!-- CustomVariablesList.vue -->
<template>
  <div>
    <!-- Empty state -->
    <div
        v-if="variables.length === 0"
        class="flex flex-col items-center justify-center py-6 text-center bg-[#1e1e1e] rounded-md border border-gray-700"
    >
      <p class="text-sm text-gray-400">No custom variables added yet</p>
      <p class="text-xs text-gray-500 mt-1">
        Add variables to store and manipulate data during automation
      </p>
    </div>

    <!-- List of variables -->
    <div v-else class="space-y-2">
      <div
          v-for="variable in variables"
          :key="variable.id"
          class="flex items-center justify-between p-3 bg-[#1e1e1e] rounded-md border border-gray-700 hover:border-gray-600 cursor-pointer"
          @click="goToVariable(variable.id)"
      >
        <div>
          <div class="inline-flex space-x-1 items-center">
            <h3 class="text-sm font-medium text-gray-200">
              {{ variable.name }}
            </h3>
            <span class="text-xs bg-blue-500 text-white px-1 rounded-lg pull-right">
              {{ getType(variable.type) }}
            </span>
          </div>
          <p class="text-xs text-gray-500">
            <template v-if="variable.type === 'static'">
              {{ variable.meta?.value }}
            </template>
            <template v-else-if="variable.type === 'ai'">
              Prompt: {{ variable.meta?.prompt }}
            </template>
            <template v-else-if="variable.type === 'api'">
              Extract Path: {{ variable.meta?.api?.extractPath }}
            </template>
          </p>
        </div>
        <div class="text-xs text-gray-500">

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {defineProps} from 'vue'
import {useRouter} from 'vue-router'
import {CustomVariable,CustomVariableTypes} from "@/types/record";

const props = defineProps<{
  variables: CustomVariable[]
}>()

const router = useRouter()

let getType = (type: string) => {
  return {
    [CustomVariableTypes.AI]: "AI Generated",
    [CustomVariableTypes.API]: "API Response",
    [CustomVariableTypes.STATIC]: "Static",
  }[type];
}

function goToVariable(id: string) {
  router.push(`/config/variables/${id}`)
}
</script>
