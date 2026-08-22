'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getCurrentUser, signOut, MOCK_USER } from '@/lib/auth-helper'
import { Button } from '@/components/ui/button'
import { LogOut, User, Sparkles } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    getCurrentUser().then(setUser)
  }, [])

  if (pathname === '/login') return null

  const isMockUser = user?.id === MOCK_USER.id

  return (
    <header className="w-full border-b-2 border-[#808080]">
      <div className="flex h-12 items-center justify-between px-4">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2 font-bold text-lg">
            <Sparkles className="h-4 w-4" />
            <span>PalBreed</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end text-[11px] font-mono">
                <span>Logged in as:</span>
                <span className="font-bold flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {isMockUser ? 'テストユーザー (Mock)' : user.email}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                title="ログアウト"
                className="hover:underline"
              >
                <LogOut className="h-4 w-4 mr-1" />
                ログアウト
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
