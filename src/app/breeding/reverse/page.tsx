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

interface CalculatedPair {
  parentAName: string
  parentBName: string
  isParentAOwned: boolean
  isParentBOwned: boolean
  isFullyAvailable: boolean
  isMutation: boolean
}

export default function ReverseBreedingPage() {
  const [user, setUser] = useState<any>(null)
  
  // 状態管理
  const [ownedPalNames, setOwnedPalNames] = useState<Set<string>>(new Set())
  const [recipes, setRecipes] = useState<RecipeMemo[]>([])
  
  const [selectedChild, setSelectedChild] = useState('')
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
            }
          }
        }
      }
    }
    init()
  }, [])

  // 登録済みの全配合メモから「子パル」の一覧（重複排除）を抽出してオートコンプリート候補にする
  const registeredChildren = Array.from(new Set(recipes.map(r => r.child_name)))

  // 選択された子パルに該当する親ペアのリスト
  const matchedPairs: CalculatedPair[] = recipes
    .filter(r => r.child_name.trim().toLowerCase() === selectedChild.trim().toLowerCase())
    .map(r => {
      const isParentAOwned = ownedPalNames.has(r.parent_a_name)
      const isParentBOwned = ownedPalNames.has(r.parent_b_name)
      return {
        parentAName: r.parent_a_name,
        parentBName: r.parent_b_name,
        isParentAOwned,
        isParentBOwned,
        isFullyAvailable: isParentAOwned && isParentBOwned,
        isMutation: r.is_mutation
      }
    })
    .sort((a, b) => {
      if (a.isFullyAvailable && !b.isFullyAvailable) return -1
      if (!a.isFullyAvailable && b.isFullyAvailable) return 1
      return a.parentAName.localeCompare(b.parentAName)
    })

  // フィルター適用後の一覧
  const displayedPairs = matchedPairs

  // 子パルの入力候補フィルタリング
  const suggestions = selectedChild
    ? registeredChildren.filter(name => name.includes(selectedChild) && name !== selectedChild)
    : registeredChildren

  return (
    <div className={isRetro ? "retro-theme min-h-screen p-4 space-y-8" : "container max-w-5xl px-4 py-8 mx-auto space-y-8"}>
      {/* イントロダクション */}
      <div className="border-b border-border/40 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          配合逆引き検索 (Reverse Search)
        </h1>
        <p className="text-muted-foreground mt-2">
          自分が記録した配合メモから、特定の子パルを生み出す親パルの組み合わせを検索します。
        </p>
      </div>

      {dbError && (
        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl px-5 py-3 text-sm">
          <AlertCircle className="h-5. w-5. flex-shrink-0" />
          <span>ローカルストレージのデータで動作しています。</span>
        </div>
      )}

      {/* 検索コントロールとフィルター */}
      <div className="bg-zinc-900/40 p-5 rounded-xl border border-border/40">
        {/* 子パル検索入力 */}
        <div className="relative max-w-md space-y-2">
          <label className="text-sm font-semibold text-zinc-300">調べたいパル (子)</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground search-icon" />
            <Input
              placeholder="調べたいパル名を入力..."
              value={selectedChild}
              onChange={e => {
                setSelectedChild(e.target.value)
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
                    setSelectedChild(name)
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
      {selectedChild && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-300">
              自分が登録した <span className="text-primary font-extrabold">{selectedChild}</span> の配合メモ
              <span className="text-sm font-mono text-muted-foreground ml-2">({displayedPairs.length} 件)</span>
            </h2>
          </div>

          {displayedPairs.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl bg-zinc-900/10">
              <HelpCircle className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-zinc-400 font-medium">配合メモが見つかりません</p>
              <p className="text-xs text-muted-foreground mt-1">
                そのパルが生まれた配合メモがまだ記録されていません。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedPairs.map((pair, index) => (
                <Card
                  key={index}
                  className={`relative overflow-hidden border transition-all duration-300 ${
                    pair.isFullyAvailable
                      ? 'border-primary/50 bg-primary/5 shadow-[0_0_15px_rgba(14,165,233,0.05)]'
                      : 'border-border/60 bg-zinc-900/20'
                  }`}
                >
                  {pair.isMutation && (
                    <span className="absolute top-2 right-2 text-[9px] bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 z-10">
                      🧬 突然変異
                    </span>
                  )}
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    {/* 親 A */}
                    <div className="flex-1 flex flex-col items-center p-3 rounded-lg bg-background/40 border border-border/40">
                      <p className="font-bold text-sm text-center truncate w-full">{pair.parentAName}</p>
                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full mt-2 border ${
                          pair.isParentAOwned
                            ? 'bg-primary/20 text-primary border-primary/30'
                            : 'bg-zinc-800 text-zinc-500 border-zinc-700/50'
                        }`}
                      >
                        {pair.isParentAOwned ? '手持ち' : '未所持'}
                      </span>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-zinc-600 font-extrabold text-xl">+</span>
                    </div>

                    {/* 親 B */}
                    <div className="flex-1 flex flex-col items-center p-3 rounded-lg bg-background/40 border border-border/40">
                      <p className="font-bold text-sm text-center truncate w-full">{pair.parentBName}</p>
                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full mt-2 border ${
                          pair.isParentBOwned
                            ? 'bg-primary/20 text-primary border-primary/30'
                            : 'bg-zinc-800 text-zinc-500 border-zinc-700/50'
                        }`}
                      >
                        {pair.isParentBOwned ? '手持ち' : '未所持'}
                      </span>
                    </div>

                    <div className="flex flex-col items-center px-1">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>

                    {/* 結果 (子) */}
                    <div className="flex-1 flex flex-col items-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="font-bold text-sm text-center truncate w-full text-primary">{selectedChild}</p>
                      <span
                        className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full mt-2 border ${
                          pair.isFullyAvailable
                            ? 'bg-primary text-primary-foreground border-transparent'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {pair.isFullyAvailable ? '配合可能' : '素材不足'}
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
