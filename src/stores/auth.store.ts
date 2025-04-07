import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const session = ref<Session | null>(null);
  const loading = ref(true);

  const isAuthenticated = computed(() => !!user.value);

  // Initialize the auth state
  const initialize = async () => {
    loading.value = true;
    
    // Get the current session
    const { data } = await supabase.auth.getSession();
    session.value = data.session;
    user.value = data.session?.user ?? null;
    
    // Set up auth state change listener
    supabase.auth.onAuthStateChange((_, newSession) => {
      session.value = newSession;
      user.value = newSession?.user ?? null;
    });
    
    loading.value = false;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
  };

  return {
    user,
    session,
    loading,
    isAuthenticated,
    initialize,
    signOut
  };
});