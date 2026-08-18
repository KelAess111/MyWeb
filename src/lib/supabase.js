import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const AFTERLIGHT_STORAGE_BUCKETS = {
  images: import.meta.env.VITE_AFTERLIGHT_IMAGES_BUCKET ?? 'journal-images',
  videos: import.meta.env.VITE_AFTERLIGHT_VIDEOS_BUCKET ?? 'journal-videos',
}

export const AFTERLIGHT_SIGNED_URL_EXPIRES_IN = Number(import.meta.env.VITE_AFTERLIGHT_SIGNED_URL_EXPIRES_IN ?? 60 * 60)

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
