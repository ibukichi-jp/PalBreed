import { isMockEnabled, getCurrentUser, MOCK_USER } from '../lib/auth-helper'

jest.mock('../lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'supabase-user-id', email: 'test@example.com' } } }),
    },
  })),
}))

describe('Auth Helper', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    })
  })

  afterAll(() => {
    process.env = originalEnv
  })

  test('isMockEnabled returns true when env variable is "true"', () => {
    process.env.NEXT_PUBLIC_DEVELOPMENT_MOCK_AUTH = 'true'
    expect(isMockEnabled()).toBe(true)
  })

  test('isMockEnabled returns false when env variable is not "true"', () => {
    process.env.NEXT_PUBLIC_DEVELOPMENT_MOCK_AUTH = 'false'
    expect(isMockEnabled()).toBe(false)
  })

  test('getCurrentUser returns MOCK_USER when mock is enabled and mock session cookie exists', async () => {
    process.env.NEXT_PUBLIC_DEVELOPMENT_MOCK_AUTH = 'true'
    document.cookie = 'palbreed-mock-session=true'
    
    const user = await getCurrentUser()
    expect(user).toEqual(MOCK_USER)
  })

  test('getCurrentUser fetches from Supabase when cookie is missing', async () => {
    process.env.NEXT_PUBLIC_DEVELOPMENT_MOCK_AUTH = 'true'
    document.cookie = ''
    
    const user = await getCurrentUser()
    expect(user).toEqual({ id: 'supabase-user-id', email: 'test@example.com' })
  })
})
