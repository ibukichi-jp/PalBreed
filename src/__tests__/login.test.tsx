import React from 'react'
import { render, screen } from '@testing-library/react'
import LoginPage from '../app/login/page'

jest.mock('../lib/auth-helper', () => ({
  signInWithGoogle: jest.fn(),
  signInMock: jest.fn(),
  isMockEnabled: jest.fn().mockReturnValue(true),
}))

describe('LoginPage Component', () => {
  test('renders login card with title and buttons', () => {
    render(<LoginPage />)
    
    const titleElement = screen.getByText('PalBreed')
    expect(titleElement).toBeInTheDocument()

    const descriptionElement = screen.getByText(/パルワールド手持ちパル管理/i)
    expect(descriptionElement).toBeInTheDocument()

    const googleButton = screen.getByText('Google でサインイン')
    expect(googleButton).toBeInTheDocument()

    const mockButton = screen.getByText('テストユーザーでログイン')
    expect(mockButton).toBeInTheDocument()
  })
})
