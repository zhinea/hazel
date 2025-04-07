import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Record } from '@/types/record'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import {pushNotification} from "@/utils/notifications";

export const useRecordsStore = defineStore('records', () => {
  const records = ref<Record[]>([])
  const isLoading = ref(false)
  const authStore = useAuthStore()

  // Fetch records from Supabase
  async function fetchRecords() {
    isLoading.value = true
    try {
      if (!authStore.isAuthenticated) {
        pushNotification({
          title: 'Authentication Required',
          message: 'Please log in to access your records',
          type: 'warning'
        })
        return
      }
      
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('user_id', authStore.user?.id)
        .order('created_at', { ascending: false })

      console.log(data, error)

      if (error) throw error
      
      if (data) {
        records.value = data
      }
    } catch (error) {
      console.error('Error fetching records:', error)
      pushNotification({
        title: 'Error',
        message: 'Failed to fetch records',
        type: 'error'
      })
    } finally {
      isLoading.value = false
    }
  }

  // Search records in Supabase
  async function searchRecords(query: string) {
    isLoading.value = true
    try {
      if (!authStore.isAuthenticated) return
      
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('createdAt', { ascending: false })
      
      if (error) throw error
      
      if (data) {
        records.value = data
      }
    } catch (error) {
      console.error('Error searching records:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Add a new record
  async function addRecord(record: Record) {
    if (!authStore.isAuthenticated) return
    
    isLoading.value = true
    try {
      const { data, error } = await supabase
        .from('records')
        .insert(record)
        .select()
      
      if (error) throw error
      
      if (data && data[0]) {
        records.value.unshift(data[0])
        pushNotification({
          title: 'Success',
          message: 'Record added successfully',
          type: 'success'
        })
      }
    } catch (error) {
      console.error('Error adding record:', error)
      pushNotification({
        title: 'Error',
        message: 'Failed to add record',
        type: 'error'
      })
    } finally {
      isLoading.value = false
    }
  }

  // Delete a record
  async function deleteRecord(id: string) {
    if (!authStore.isAuthenticated) return
    
    isLoading.value = true
    try {
      const { error } = await supabase
        .from('records')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      records.value = records.value.filter(r => r.id !== id)
      pushNotification({
        title: 'Success',
        message: 'Record deleted successfully',
        type: 'success'
      })
    } catch (error) {
      console.error('Error deleting record:', error)
      pushNotification({
        title: 'Error',
        message: 'Failed to delete record',
        type: 'error'
      })
    } finally {
      isLoading.value = false
    }
  }

  // Sort records by title
  async function sortRecords() {
    if (!authStore.isAuthenticated) return
    
    records.value.sort((a, b) => a.title.localeCompare(b.title))
  }

  return {
    records,
    isLoading,
    fetchRecords,
    searchRecords,
    addRecord,
    deleteRecord,
    sortRecords
  }
})