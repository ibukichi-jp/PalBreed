import { createClient } from './supabase/client'

export const MOCK_USER = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'mock-user@palbreed.example.com',
}

export function isMockEnabled() {
  return process.env.NEXT_PUBLIC_DEVELOPMENT_MOCK_AUTH === 'true'
}

export async function getCurrentUser() {
  if (typeof window === 'undefined') {
    return null
  }
  
  if (isMockEnabled()) {
    const hasSession = document.cookie.includes('palbreed-mock-session=true')
    if (hasSession) {
      return MOCK_USER
    }
  }

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (e) {
    console.error('Failed to get Supabase user:', e)
    return null
  }
}

export async function signInWithGoogle() {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) throw error
}

export async function signInMock() {
  document.cookie = 'palbreed-mock-session=true; path=/; max-age=2592000; SameSite=Lax'
  window.location.href = '/'
}

export async function signOut() {
  if (isMockEnabled()) {
    document.cookie = 'palbreed-mock-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
  }
  
  try {
    const supabase = createClient()
    await supabase.auth.signOut()
  } catch (e) {
    console.error('Supabase signout error:', e)
  }
  window.location.href = '/login'
}
