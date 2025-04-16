<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GithubIcon } from 'lucide-vue-next';
import GoogleIcon from '@/assets/brands/google/icon.svg'
import { Config } from '@/utils/config';
import { useAuthStore } from '@/stores/auth.store';

const authStore = useAuthStore();
const loading = ref(false);
const error = ref<string | null>(null);

function launchAuthFlow(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url, interactive: true },
      (redirectUrl) => {
        if (chrome.runtime.lastError || !redirectUrl) {
          reject(chrome.runtime.lastError?.message || 'Authentication failed');
        } else {
          resolve(redirectUrl);
        }
      }
    );
  });
}

async function signInWithProvider(provider: 'google' | 'github') {
  loading.value = true;
  error.value = null;

  try {
    const redirectTo = chrome.identity.getRedirectURL();
    
    // Launch the Chrome extension OAuth window
    const redirectUrl = await launchAuthFlow(`${Config.OAUTH_URL}/webflow/${provider}?source=extension&redirect_uri=${redirectTo}`);
    
    // Pull token out of the hash or query
    const hashOrQuery = redirectUrl.split('#')[1] || redirectUrl.split('?')[1] || '';
    const params = new URLSearchParams(hashOrQuery.replace(/^#/, ''));
    const token = params.get('token');
    
    if (!token) {
      throw new Error('Authentication failed: No token received');
    }
    
    // Set the token in the auth store
    await authStore.setToken(token);
    
  } catch (err) {
    console.error('Sign-in error:', err);
    error.value = err instanceof Error ? err.message : String(err);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-background p-4 text-foreground dark">
    <div class="w-full max-w-md">
      <Card class="border-border bg-card">
        <CardHeader class="space-y-1">
          <CardTitle class="flex items-center justify-center gap-2 text-2xl font-bold">
            <img src="@/assets/brands/logo.png" alt="Hazel Logo" class="h-8 w-auto" />
            <span>Hazel</span>
          </CardTitle>
          <CardDescription class="text-center">
            The Cloud-based Browserless Recorder
          </CardDescription>
        </CardHeader>

        <CardContent class="space-y-4">
          <div class="space-y-2 mt-2">
            <Button
                @click="() => signInWithProvider('google')"
                :disabled="loading"
                variant="outline"
                class="w-full"
            >
              <GoogleIcon class="mr-2 h-4 w-4" />
              <span v-if="loading">Connecting...</span>
              <span v-else>Continue with Google</span>
            </Button>

            <Button
                @click="() => signInWithProvider('github')"
                :disabled="loading"
                variant="outline"
                class="w-full"
            >
              <GithubIcon class="mr-2 h-4 w-4" />
              <span v-if="loading">Connecting...</span>
              <span v-else>Continue with GitHub</span>
            </Button>
          </div>

          <Alert v-if="error" variant="destructive">
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>
        </CardContent>

        <CardFooter>
          <p class="text-xs text-center text-muted-foreground w-full">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>