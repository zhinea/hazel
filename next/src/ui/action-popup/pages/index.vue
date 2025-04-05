<!-- RecordsPage.vue -->
<template>
  <div class="flex flex-col min-h-screen bg-[#121212] text-white">
    <!-- Purple accent borders -->
<!--    <div class="fixed top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-600 to-fuchsia-600"></div>-->
<!--    <div class="fixed top-0 right-0 w-1 h-full bg-gradient-to-b from-purple-600 to-fuchsia-600"></div>-->

    <Navbar />

    <main class="flex-1 px-4 py-2">
      <!-- Search -->
      <SearchBar :onSearch="setSearchQuery" />

      <!-- Actions row -->
      <div class="flex justify-between items-center mb-3">
        <button
            @click="syncToCloud"
            class="flex items-center bg-[#1e1e1e] text-gray-300 py-2 px-4 rounded-md border border-gray-700 text-sm hover:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          <!-- cloud‑sync icon -->
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
              class="mr-2"
          >
            <path d="M8 17.01l4-4 4 4" />
            <path d="M12 12.01v8" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
          </svg>
          Sync to cloud
        </button>

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

      <!-- Records list -->
      <RecordsList
          :records="filteredRecords"
          :onDelete="handleDelete"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Navbar from '@/components/popup/Navbar.vue'
import SearchBar from '@/components/popup/SearchBar.vue'
import RecordsList from '@/components/popup/RecordsList.vue'
import type { Record } from '@/types/record'

// search state
const searchQuery = ref('')

// initial sample data
const records = ref<Record[]>([
  {
    id: '1',
    title: 'Twitter Trends to Google',
    description: 'Automatically tracks Twitter trends and searches them on Google',
    createdAt: new Date('2023-05-10'),
  },
  {
    id: '2',
    title: 'Google Keyword Research',
    description: 'Extracts keyword data from Google Search Console',
    createdAt: new Date('2023-06-15'),
  },
  {
    id: '3',
    title: 'Generate lorem ipsum',
    description: 'Creates custom lorem ipsum text based on parameters',
    createdAt: new Date('2023-07-22'),
  },
  {
    id: '4',
    title: 'Search in ProductHunt',
    description: 'Searches for products on ProductHunt and extracts data',
    createdAt: new Date('2023-08-05'),
  }
])

// computed filter
const filteredRecords = computed(() =>
    records.value.filter((r) =>
        r.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
)

// handlers
function setSearchQuery(q: string) {
  searchQuery.value = q
}

function handleDelete(id: string) {
  records.value = records.value.filter((r) => r.id !== id)
}

function syncToCloud() {
  console.log('Sync to cloud')
}

function sortRecords() {
  console.log('Sort')
}
</script>
