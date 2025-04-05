import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Record } from '@/types/record'
import {IncommingMessage} from "@/types/message";

export const useRecordsStore = defineStore('records', () => {
  const records = ref<Record[]>([])
  const isLoading = ref(false)

  // Fetch records from storage
  async function fetchRecords() {
    isLoading.value = true
    try {
      const response = await chrome.runtime.sendMessage(<IncommingMessage>{
        action: 'storage::records.all'
      })
      
      if (response?.status && response.data) {
        records.value = response.data
      }
    } catch (error) {
      console.error('Error fetching records:', error)

    } finally {
      isLoading.value = false
    }
  }

  // Save records to storage
  async function saveRecords() {
    try {
      await chrome.runtime.sendMessage({
        action: 'storage:records.set',
        key: 'list',
        value: records.value
      })
    } catch (error) {
      console.error('Error saving records:', error)
    }
  }

  // Add a new record
  async function addRecord(record: Record) {
    records.value.push(record)
    await saveRecords()
  }

  // Delete a record
  async function deleteRecord(id: string) {
    records.value = records.value.filter(r => r.id !== id)
    await saveRecords()
  }

  // Sort records by title
  async function sortRecords() {
    records.value.sort((a, b) => a.title.localeCompare(b.title))
    await saveRecords()
  }

  return {
    records,
    isLoading,
    fetchRecords,
    saveRecords,
    addRecord,
    deleteRecord,
    sortRecords
  }
})