import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Record } from '@/types/record'
import { Config } from '@/utils/config'
import { useAuthStore } from '@/stores/auth.store'
import { notify } from "@/utils/notifications"

export const useRecordsStore = defineStore('records', () => {
  const records = ref<Record[]>([])
  const isLoading = ref(false)
  const authStore = useAuthStore()

  // Helper function for API requests
  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    if (!authStore.token) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${Config.OAUTH_URL}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`,
        ...options.headers
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(error.message || 'API request failed')
    }

    return response.json()
  }

  // Fetch records from API
  async function fetchRecords() {
    isLoading.value = true
    try {
      if (!authStore.isAuthenticated) {
        notify({
          title: 'Authentication Required',
          message: 'Please log in to access your records',
          type: 'warning'
        })
        return
      }
      
      // Using the route defined in api.php: Route::get('/', [RecordController::class, 'index'])
      const data = await apiRequest('/v1/records')
      records.value = data
    } catch (error) {
      console.error('Error fetching records:', error)
      notify({
        title: 'Error',
        message: 'Failed to fetch records',
        type: 'error'
      })
    } finally {
      isLoading.value = false
    }
  }

  // Search records in API
  async function searchRecords(query: string) {
    isLoading.value = true
    try {
      if (!authStore.isAuthenticated) return
      
      // Since there's no specific search endpoint in api.php, we'll assume search is handled by a query parameter
      // to the index method. You may need to implement this in your RecordController.
      const data = await apiRequest(`/v1/records?search=${encodeURIComponent(query)}`)
      records.value = data
    } catch (error) {
      console.error('Error searching records:', error)
      notify({
        title: 'Error',
        message: 'Failed to search records',
        type: 'error'
      })
    } finally {
      isLoading.value = false
    }
  }

  // Add a new record
  async function addRecord(record: Omit<Record, 'id'>) {
    if (!authStore.isAuthenticated) return
    
    isLoading.value = true;
    try {
      // Using the route defined in api.php: Route::post('/', [RecordController::class, 'store'])
      const data = await apiRequest('/v1/records', {
        method: 'POST',
        body: JSON.stringify(record)
      });
      
      records.value.unshift(data);
      notify({
        title: 'Success',
        message: 'Record added successfully',
        type: 'success'
      });
      
      return data;
    } catch (error) {
      console.error('Error adding record:', error);
      notify({
        title: 'Error',
        message: 'Failed to add record',
        type: 'error'
      });
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  // Delete a record
  async function deleteRecord(id: string) {
    if (!authStore.isAuthenticated) return
    
    isLoading.value = true
    try {
      // Note: There's no delete route defined in api.php yet
      // You'll need to add a route like: Route::delete('/{id}', [RecordController::class, 'destroy'])
      await apiRequest(`/v1/records/${id}`, {
        method: 'DELETE'
      })
      
      records.value = records.value.filter(r => r.id !== id)
      notify({
        title: 'Success',
        message: 'Record deleted successfully',
        type: 'success'
      })
    } catch (error) {
      console.error('Error deleting record:', error)
      notify({
        title: 'Error',
        message: 'Failed to delete record',
        type: 'error'
      })
    } finally {
      isLoading.value = false
    }
  }

  // Sort records by name (client-side)
  function sortRecords() {
    if (!authStore.isAuthenticated) return
    
    records.value.sort((a, b) => a.name.localeCompare(b.name))
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