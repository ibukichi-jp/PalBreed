'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUser, MOCK_USER } from '@/lib/auth-helper'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Sparkles, HelpCircle, ArrowRight, Search, AlertCircle } from 'lucide-react'

interface RecipeMemo {
  id: number
  parent_a_name: string
  parent_b_name: string
  child_name: string
  is_mutation: boolean
}

interface ForwardResult {
  partnerName: string
  childName: string
  isPartnerOwned: boolean
  isChildOwned: boolean
  isMutation: boolean
}

export default function ForwardBreedingPage() {
  const [user, setUser] = useState<any>(null)
  
  // 状態管理
  const [ownedPalNames, setOwnedPalNames] = useState<Set<string>>(new Set())
  const [recipes, setRecipes] = useState<RecipeMemo[]>([])
  
  const [selectedParentA, setSelectedParentA] = useState('')
  const [dbError, setDbError] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const [isRetro, setIsRetro] = useState(false)

  // レトロテーマの設定を LocalStorage から復元
  useEffect(() => {
    const saved = localStorage.getItem('palbreed-retro-mode')
    if (saved === 'true') {
      setIsRetro(true)
    }
  }, [])

  // 初期化とデータのロード
  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentUser()
      setUser(currentUser)

      if (currentUser) {
        if (currentUser.id === MOCK_USER.id) {
          // モック時
          const savedOwned = localStorage.getItem('palbreed-mock-owned-names')
          if (savedOwned) setOwnedPalNames(new Set(JSON.parse(savedOwned)))

          const savedRecipes = localStorage.getItem('palbreed-mock-recipes')
          if (savedRecipes) {
            const parsedRecipes = JSON.parse(savedRecipes)
            setRecipes(parsedRecipes)
            if (parsedRecipes.length > 0) {
              setSelectedParentA(parsedRecipes[0].parent_a_name)
            }
          }
        } else {
          // Supabase接続時
          try {
            const supabase = createClient()
            
            // 1. 手持ちパル
            const { data: ownedData, error: ownedError } = await supabase
              .from('user_pals')
              .select('pal_name')
              .eq('user_id', currentUser.id)

            if (ownedError) throw ownedError
            if (ownedData) setOwnedPalNames(new Set(ownedData.map(d => d.pal_name)))

            // 2. 配合メモ
            const { data: recipesData, error: recipesError } = await supabase
              .from('breed_recipes')
              .select('id, parent_a_name, parent_b_name, child_name, is_mutation')
              .eq('user_id', currentUser.id)

            if (recipesError) throw recipesError
            if (recipesData) {
              setRecipes(recipesData as RecipeMemo[])
              if (recipesData.length > 0) {
                // デフォルトで最新の配合メモの親を選択
                setSelectedParentA(recipesData[0].parent_a_name)
              }
            }
          } catch (e) {
            console.error('Supabase load error. Using local storage.', e)
            setDbError(true)

            const savedOwned = localStorage.getItem('palbreed-mock-owned-names')
            if (savedOwned) setOwnedPalNames(new Set(JSON.parse(savedOwned)))

            const savedRecipes = localStorage.getItem('palbreed-mock-recipes')
            if (savedRecipes) {
              const parsedRecipes = JSON.parse(savedRecipes)
              setRecipes(parsedRecipes)
              if (parsedRecipes.length > 0) {
                setSelectedParentA(parsedRecipes[0].parent_a_name)
              }
            }
          }
        }
      }
    }
    init()
  }, [])

  // 登録済みの全配合メモから「親パル」の一覧（重複排除）を抽出してオートコンプリート候補にする
  const registeredParents = Array.from(
    new Set([
      ...recipes.map(r => r.parent_a_name),
      ...recipes.map(r => r.parent_b_name)
    ])
  )

  // 選択された親パルAを含んでいる配合パターンの抽出
  const forwardResults: ForwardResult[] = recipes
    .filter(r => {
      const searchKey = selectedParentA.trim().toLowerCase()
      return (
        r.parent_a_name.trim().toLowerCase() === searchKey ||
        r.parent_b_name.trim().toLowerCase() === searchKey
      )
    })
    .map(r => {
      const searchKey = selectedParentA.trim().toLowerCase()
      // パートナーの割り出し
      const partnerName =
        r.parent_a_name.trim().toLowerCase() === searchKey
          ? r.parent_b_name
          : r.parent_a_name
      
      const isPartnerOwned = ownedPalNames.has(partnerName)
      const isChildOwned = ownedPalNames.has(r.child_name)

      return {
        partnerName,
        childName: r.child_name,
        isPartnerOwned,
        isChildOwned,
        isMutation: r.is_mutation
      }
    })
    .sort((a, b) => {
      if (a.isPartnerOwned && !b.isPartnerOwned) return -1
      if (!a.isPartnerOwned && b.isPartnerOwned) return 1
      return a.partnerName.localeCompare(b.partnerName)
    })

  // 親パルの入力候補フィルタリング
  const suggestions = selectedParentA
    ? registeredParents.filter(name => name.includes(selectedParentA) && name !== selectedParentA)
    : registeredParents

  return (
    <div className={isRetro ? "retro-theme min-h-screen p-4 space-y-8" : "container max-w-5xl px-4 py-8 mx-auto space-y-8"}>
      {/* イントロダクション */}
      <div className="border-b border-border/40 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          配合順引き検索 (Forward Search)
        </h1>
        <p className="text-muted-foreground mt-2">
          自分が記録した配合メモから、特定の親パルを基準とした配合記録の一覧を検索します。
        </p>
      </div>

      {dbError && (
        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl px-5 py-3 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>ローカルストレージのデータで動作しています。</span>
        </div>
      )}

      {/* 検索コントロール */}
      <div className="bg-zinc-900/40 p-5 rounded-xl border border-border/40">
        <div className="relative max-w-md space-y-2">
          <label className="text-sm font-semibold text-zinc-300">基準にする親パル (親A)</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground search-icon" />
            <Input
              placeholder="親パル名を入力..."
              value={selectedParentA}
              onChange={e => {
                setSelectedParentA(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              className="pl-9 bg-background/50 border-border search-input"
            />
          </div>

          {/* ドロップダウン候補リスト */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto bg-zinc-950 border border-border rounded-lg shadow-2xl">
              {suggestions.map(name => (
                <button
                  key={name}
                  onClick={() => {
                    setSelectedParentA(name)
                    setShowDropdown(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-primary/10 hover:text-primary transition-colors border-b border-border/20 last:border-0 text-foreground font-semibold"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 検索結果 */}
      {selectedParentA && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-300">
              自分が登録した <span className="text-primary font-extrabold">{selectedParentA}</span> の配合メモ
              <span className="text-sm font-mono text-muted-foreground ml-2">({forwardResults.length} 件)</span>
            </h2>
          </div>

          {forwardResults.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl bg-zinc-900/10">
              <HelpCircle className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-zinc-400 font-medium">配合メモが見つかりません</p>
              <p className="text-xs text-muted-foreground mt-1">
                その親パルが使われた配合メモがまだ記録されていません。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {forwardResults.map((result, index) => (
                <Card
                  key={index}
                  className={`relative overflow-hidden border border-border/60 transition-all duration-300 ${
                    result.isPartnerOwned
                      ? 'bg-zinc-900/40 border-primary/20'
                      : 'bg-zinc-900/10'
                  }`}
                >
                  {result.isMutation && (
                    <span className="absolute top-2 right-2 text-[9px] bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 z-10">
                      🧬 突然変異
                    </span>
                  )}
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    {/* 親 A (選択中) */}
                    <div className="flex-1 flex flex-col items-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="font-bold text-sm text-center truncate w-full">{selectedParentA}</p>
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full mt-2 border bg-primary/25 text-primary border-primary/30">
                        親 A
                      </span>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-zinc-600 font-extrabold text-xl">+</span>
                    </div>

                    {/* 相手の親 B */}
                    <div className="flex-1 flex flex-col items-center p-3 rounded-lg bg-background/40 border border-border/40">
                      <p className="font-bold text-sm text-center truncate w-full">{result.partnerName}</p>
                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full mt-2 border ${
                          result.isPartnerOwned
                            ? 'bg-primary/20 text-primary border-primary/30'
                            : 'bg-zinc-800 text-zinc-500 border-zinc-700/50'
                        }`}
                      >
                        {result.isPartnerOwned ? '手持ち' : '未所持'}
                      </span>
                    </div>

                    <div className="flex flex-col items-center px-1">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>

                    {/* 生まれる子 C */}
                    <div className="flex-1 flex flex-col items-center p-3 rounded-lg bg-background/40 border border-border/40">
                      <p className="font-bold text-sm text-center truncate w-full text-primary">{result.childName}</p>
                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full mt-2 border ${
                          result.isChildOwned
                            ? 'bg-primary/20 text-primary border-primary/30'
                            : 'bg-zinc-800 text-zinc-500 border-zinc-700/50'
                        }`}
                      >
                        {result.isChildOwned ? '手持ち' : '未所持'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
