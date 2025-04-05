<!-- SearchBar.vue -->
<template>
  <div class="relative my-3">
    <div class="relative flex items-center">
      <Search class="absolute left-3 h-4 w-4 text-gray-400" />
      <input
          type="text"
          placeholder="Search..."
          class="w-full pl-9 pr-3 py-2 bg-[#1e1e1e] border border-gray-700 rounded-md text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
          v-model="query"
          @input="handleChange"
      />
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
  onSearch: (query: string) => void
}>()

// local state
const query = ref('')

function handleChange() {
  props.onSearch(query.value)
}
</script>
