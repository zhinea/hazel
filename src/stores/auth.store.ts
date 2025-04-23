import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Config } from '@/utils/config';
import type { User } from '@/types/user';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('auth_token'));
  const loading = ref(true);

  const isAuthenticated = computed(() => !!token.value);

  // Initialize the auth state
  const initialize = async () => {
    loading.value = true;
    
    // Check for token in localStorage
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      token.value = storedToken;
      await fetchUserProfile();
    }
    
    loading.value = false;
  };

  // Fetch user profile from API
  const fetchUserProfile = async () => {
    if (!token.value) return;
    
    try {
      const response = await fetch(`${Config.OAUTH_URL}/api/me`, {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        user.value = userData;
      } else {
        // If token is invalid, clear it
        token.value = null;
        localStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Set authentication token
  const setToken = async (newToken: string) => {
    token.value = newToken;
    localStorage.setItem('auth_token', newToken);
    await fetchUserProfile();
  };

  const signOut = async () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('auth_token');
  };

  return {
    user,
    token,
    loading,
    isAuthenticated,
    initialize,
    setToken,
    fetchUserProfile,
    signOut
  };
});