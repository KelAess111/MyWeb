import { supabase } from '../lib/supabaseClient'
import { isLocalEditMode } from '../utils/editMode'
import { createAuthorSessionManager } from '../utils/authorSessionCore'

export const ensureAuthorSession = createAuthorSessionManager({
  client:supabase,
  isEditing:isLocalEditMode,
  expectedUserId:'8dff792d-ceab-4299-9d0a-e984191fe29c',
  // Production never needs local author credentials or automatic sign-in.
  credentials:() => import.meta.env.DEV ? {email:import.meta.env.VITE_AUTHOR_EMAIL,password:import.meta.env.VITE_AUTHOR_PASSWORD} : {},
})
