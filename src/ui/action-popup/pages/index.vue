<!-- RecordsPage.vue -->
<template>
  <div class="flex flex-col min-h-screen bg-[#121212] text-white">
    <Navbar />

    <main class="flex-1 px-4 py-2">
      <!-- Search -->
      <SearchBar :onSearch="handleSearch" :refreshRecords="refreshRecords" />
      <!-- Actions row -->
      <div class="flex justify-end items-center mb-3">
        <button
            @click="sortRecords"
            class="flex items-center text-gray-300 text-sm hover:text-white"
        >
          <!-- sort icon -->
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
              class="mr-1"
          >
            <path d="M11 5h10" />
            <path d="M11 9h5" />
            <path d="M11 13h7" />
            <path d="M11 17h3" />
            <path d="M3 17l2 2 4-4" />
            <path d="M3 7l2 2 4-4" />
          </svg>
          Sort
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="recordsStore.isLoading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>

      <!-- No records state -->
      <div v-else-if="recordsStore.records.length === 0" class="text-center py-8 text-gray-400">
        <p>No records found</p>
      </div>

      <!-- Records list -->
      <RecordsList
          v-else
          :records="recordsStore.records"
          :onDelete="handleDelete"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import Navbar from '@/components/popup/Navbar.vue'
import SearchBar from '@/components/popup/SearchBar.vue'
import RecordsList from '@/components/popup/RecordsList.vue'
import { useRecordsStore } from '@/stores/records.store'
import { useAuthStore } from '@/stores/auth.store'

// Initialize stores
const recordsStore = useRecordsStore()
const authStore = useAuthStore()

// Fetch records on component mount
onMounted(async () => {
  if (authStore.isAuthenticated) {
    await recordsStore.fetchRecords()
  }
})

// handlers
function handleSearch(query: string) {
  recordsStore.searchRecords(query)
}

function handleDelete(id: string) {
  recordsStore.deleteRecord(id)
}

function refreshRecords() {
  recordsStore.fetchRecords()
}

function sortRecords() {
  recordsStore.sortRecords()
}

function showAddRecordModal() {
  // Implement modal for adding new records
  // This would be implemented in a separate component
  console.log('Show add record modal')
}
</script>