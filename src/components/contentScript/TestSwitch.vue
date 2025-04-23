<template>
  <div class="p-4">
    <div class="flex items-center space-x-2">
      <Switch 
        :checked="isChecked"
        @update:checked="handleChange"
      />
      <span>Test Switch</span>
    </div>
    <div class="mt-2">
      <button @click="toggleValue" class="px-2 py-1 bg-gray-700 rounded">
        Toggle Programmatically
      </button>
    </div>
    <div class="mt-2 text-sm">
      Current value: {{ isChecked }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Switch } from '@/components/ui/switch'

const isChecked = ref(false)

function handleChange(value: boolean) {
  console.log('Switch changed:', value)
  isChecked.value = value
}

function toggleValue() {
  isChecked.value = !isChecked.value
  console.log('Value toggled to:', isChecked.value)
}
</script> 