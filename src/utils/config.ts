
export const Config = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
}

export function env(key: string, defaultValue?: string): string {
    return import.meta.env[key] || defaultValue || '';
}