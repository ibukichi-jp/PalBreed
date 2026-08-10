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

  const isLinkActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  const isMockUser = user?.id === MOCK_USER.id

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2 font-bold text-xl tracking-wider text-primary">
            <Sparkles className="h-5 w-5 animate-pulse text-primary" />
            <span>PalBreed</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className={`transition-colors hover:text-primary ${
                isLinkActive('/') ? 'text-primary font-semibold' : 'text-muted-foreground'
              }`}
            >
              手持ち管理
            </Link>
            <Link
              href="/breeding/reverse"
              className={`transition-colors hover:text-primary ${
                isLinkActive('/breeding/reverse') ? 'text-primary font-semibold' : 'text-muted-foreground'
              }`}
            >
              配合逆引き
            </Link>
            <Link
              href="/breeding/forward"
              className={`transition-colors hover:text-primary ${
                isLinkActive('/breeding/forward') ? 'text-primary font-semibold' : 'text-muted-foreground'
              }`}
            >
              配合順引き
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end text-xs">
                <span className="text-muted-foreground">Logged in as</span>
                <span className="font-medium flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {isMockUser ? 'テストユーザー (Mock)' : user.email}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                title="ログアウト"
                className="hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
