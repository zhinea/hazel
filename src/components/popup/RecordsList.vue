<!-- RecordsList.vue -->
<template>
  <div class="overflow-y-auto max-h-[calc(95vh-10rem)]">
    <!-- Empty state -->
    <div
        v-if="records.length === 0"
        class="flex flex-col items-center justify-center py-10 text-center"
    >
      <div class="rounded-full bg-gray-800 p-3 mb-4">
        <Play class="h-6 w-6 text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-300">No records found</h3>
      <p class="text-sm text-gray-500 mt-1">
        Create a new record or try a different search term
      </p>
    </div>

    <!-- Records list -->
    <div v-else class="space-y-0">
      <div
          v-for="record in records"
          :key="record.id"
          class="py-3 border-b border-gray-800 hover:bg-[#1e1e1e] px-2"
      >
        <div class="flex justify-between items-center">
          <div class="flex-1 min-w-0">
            <h3 class="text-base font-medium text-gray-200">
              {{ record.name }}
            </h3>
            <p class="text-sm text-gray-500">
              {{ formatDistanceToNow(record.createdAt, { addSuffix: true }) }}
            </p>
          </div>

          <div class="flex items-center ml-4 space-x-1">
            <!-- Play button -->
            <button
                class="p-1 rounded-sm text-gray-400 hover:text-white hover:bg-gray-700"
                aria-label="Play record"
            >
              <Play class="h-4 w-4" />
            </button>

            <!-- More‑options dropdown -->
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                    class="p-1 rounded-sm text-gray-400 hover:text-white hover:bg-gray-700"
                    aria-label="More options"
                >
                  <MoreHorizontal class="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                  align="end"
                  class="bg-[#1e1e1e] border border-gray-700 text-gray-300"
              >
                <DropdownMenuItem
                    class="focus:bg-gray-700 focus:text-white cursor-pointer"
                    @click="editRecord(record.id)"
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                    class="focus:bg-gray-700 focus:text-white cursor-pointer"
                    @click="onDelete(record.id)"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
import { Play, MoreHorizontal } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import type { Record } from '@/types/record'

const { records, onDelete } = defineProps<{
  records: Record[]
  onDelete: (id: string) => void
}>()

function editRecord(id: string) {
  console.log(`Edit record ${id}`)
}
</script>
