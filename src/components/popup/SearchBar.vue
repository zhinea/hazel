<!-- SearchBar.vue -->
<template>
  <div class="relative my-3">
    <div class="relative inline-flex w-full space-x-2">
      <div class="relative flex items-center w-full">
        <Search class="absolute left-3 h-4 w-4 text-gray-400" />
        <input
            type="text"
            placeholder="Search..."
            class="w-full pl-9 pr-3 py-2 bg-[#1e1e1e] border border-gray-700 rounded-md text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
            v-model="query"
            @input="handleChange"
        />
      </div>
      <button
          @click="refreshRecords"
          class="flex items-center bg-[#1e1e1e] text-gray-300 py-2 px-2 rounded-md border border-gray-700 text-sm hover:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
      >
        <!-- refresh icon -->
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M3 21v-5h5" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, defineProps } from 'vue'
import { Search } from 'lucide-vue-next'

/**
 * Props
 * onSearch: function to call with the latest query
 */
const props = defineProps<{
  onSearch: (query: string) => void,
  refreshRecords: () => void,
}>()

// local state
const query = ref('')

function handleChange() {
  props.onSearch(query.value)
}
</script>
