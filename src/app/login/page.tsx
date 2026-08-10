'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { signInWithGoogle, signInMock, isMockEnabled } from '@/lib/auth-helper'
import { Sparkles, HelpCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [showMock, setShowMock] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mockLoading, setMockLoading] = useState(false)

  useEffect(() => {
    setShowMock(isMockEnabled())
  }, [])

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      await signInWithGoogle()
    } catch (e) {
      console.error(e)
      setLoading(false)
      alert('Googleログインの開始に失敗しました。')
    }
  }

  const handleMockLogin = async () => {
    setMockLoading(true)
    await signInMock()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-zinc-955 to-black px-4">
      {/* ガラスモーフィズム効果のあるログインカード */}
      <Card className="w-full max-w-md border-border/40 bg-zinc-900/60 backdrop-blur-md shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-wider text-primary">
            PalBreed
          </CardTitle>
          <CardDescription className="text-zinc-400 text-sm mt-1">
            パルワールド手持ちパル管理 & 配合シミュレータ
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-6">
          <Button
            onClick={handleGoogleLogin}
            disabled={loading || mockLoading}
            className="w-full py-6 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)]"
          >
            {loading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Google でサインイン
          </Button>

          {showMock && (
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border/60"></div>
              <span className="flex-shrink mx-4 text-zinc-500 text-xs uppercase tracking-widest font-mono">
                DEVELOPMENT ONLY
              </span>
              <div className="flex-grow border-t border-border/60"></div>
            </div>
          )}

          {showMock && (
            <Button
              variant="outline"
              onClick={handleMockLogin}
              disabled={loading || mockLoading}
              className="w-full py-6 text-sm font-semibold border-border hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all duration-300"
            >
              {mockLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <HelpCircle className="mr-2 h-4 w-4" />
              )}
              テストユーザーでログイン
            </Button>
          )}
        </CardContent>

        <CardFooter className="justify-center pb-6">
          <p className="text-zinc-500 text-xs text-center">
            サインインすることで、配合レシピの検索や所持パルの保存機能が有効になります。
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
