'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUser, MOCK_USER } from '@/lib/auth-helper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Sparkles, AlertCircle, Trash2, BookOpen, PlusCircle, Search, Check, X } from 'lucide-react'

interface RecipeMemo {
  id: number
  parent_a_name: string
  parent_b_name: string
  child_name: string
  is_mutation: boolean
}

// ひらがな -> カタカナの変換関数 (前方一致検索で「あぬびす」➜「アヌビス」をマッチさせるため)
function hiraganaToKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, function (match) {
    const chr = match.charCodeAt(0) + 0x60
    return String.fromCharCode(chr)
  })
}

export default function MyPalsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null)
  
  // 配合メモの状態管理
  const [recipes, setRecipes] = useState<RecipeMemo[]>([])
  
  const [dbError, setDbError] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // 登録済みの配合レシピからパル名を動的に抽出
  const registeredPalNames = useMemo(() => {
    const names = new Set<string>()
    recipes.forEach(r => {
      if (r.parent_a_name) names.add(r.parent_a_name)
      if (r.parent_b_name) names.add(r.parent_b_name)
      if (r.child_name) names.add(r.child_name)
    })
    return names
  }, [recipes])

  // 検索用キーワードの状態
  const [recipeSearch, setRecipeSearch] = useState('')

  // 入力フォームの状態
  const [parentA, setParentA] = useState('')
  const [parentB, setParentB] = useState('')
  const [child, setChild] = useState('')
  const [isMutation, setIsMutation] = useState(false)

  // サジェスト表示用の状態
  const [showSuggestionsA, setShowSuggestionsA] = useState(false)
  const [showSuggestionsB, setShowSuggestionsB] = useState(false)

  // 親Aの前方一致サジェスト候補
  const suggestionsA = useMemo(() => {
    const rawVal = parentA.trim()
    if (!rawVal) return []
    const val = hiraganaToKatakana(rawVal).toLowerCase()
    return Array.from(registeredPalNames)
      .sort()
      .filter(name => name.toLowerCase().startsWith(val) && name.toLowerCase() !== val)
  }, [parentA, registeredPalNames])

  // 親Bの前方一致サジェスト候補
  const suggestionsB = useMemo(() => {
    const rawVal = parentB.trim()
    if (!rawVal) return []
    const val = hiraganaToKatakana(rawVal).toLowerCase()
    return Array.from(registeredPalNames)
      .sort()
      .filter(name => name.toLowerCase().startsWith(val) && name.toLowerCase() !== val)
  }, [parentB, registeredPalNames])

  // 子パルサジェスト表示用の状態
  const [showSuggestionsChild, setShowSuggestionsChild] = useState(false)

  // 生まれたパルの前方一致サジェスト候補
  const suggestionsChild = useMemo(() => {
    const rawVal = child.trim()
    if (!rawVal) return []
    const val = hiraganaToKatakana(rawVal).toLowerCase()
    return Array.from(registeredPalNames)
      .sort()
      .filter(name => name.toLowerCase().startsWith(val) && name.toLowerCase() !== val)
  }, [child, registeredPalNames])

  // 詳細モーダル表示用の状態
  const [activeDetailPal, setActiveDetailPal] = useState<string | null>(null)

  // 初期化とデータの読み込み
  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentUser()
      setUser(currentUser)

      if (currentUser) {
        if (currentUser.id === MOCK_USER.id) {
          // モックログイン時：ローカルストレージからロード
          const savedRecipes = localStorage.getItem('palbreed-mock-recipes')
          if (savedRecipes) setRecipes(JSON.parse(savedRecipes))
        } else {
          // Supabase接続時
          try {
            const supabase = createClient()
            
            // 配合メモのロード
            const { data: recipesData, error: recipesError } = await supabase
              .from('breed_recipes')
              .select('id, parent_a_name, parent_b_name, child_name, is_mutation')
              .eq('user_id', currentUser.id)
              .order('created_at', { ascending: false })

            if (recipesError) throw recipesError
            if (recipesData) {
              setRecipes(recipesData as RecipeMemo[])
            }
          } catch (e) {
            console.error('Database load error. Falling back to local storage.', e)
            setDbError(true)
            
            const savedRecipes = localStorage.getItem('palbreed-mock-recipes')
            if (savedRecipes) setRecipes(JSON.parse(savedRecipes))
          }
        }
      }
    }
    init()
  }, [])

  // 配合メモの登録
  const handleAddRecipe = async (e: React.FormEvent) => {
    e.preventDefault()
    const pA = parentA.trim()
    const pB = parentB.trim()
    const ch = child.trim()

    if (!pA || !pB || !ch) {
      alert('親A、親B、生まれたパルすべての名前を入力してください。')
      return
    }

    // 順序制約 (A <= B) のため、日本語読みまたは文字列の大小で親の名前をソートして保存
    let parentAName = pA
    let parentBName = pB
    if (parentAName.localeCompare(parentBName) > 0) {
      [parentAName, parentBName] = [parentBName, parentAName]
    }

    // 同一配合の重複登録チェック (親A、親B、生まれたパルの一致)
    const isDuplicate = recipes.some(
      r =>
        r.parent_a_name.toLowerCase() === parentAName.toLowerCase() &&
        r.parent_b_name.toLowerCase() === parentBName.toLowerCase() &&
        r.child_name.toLowerCase() === ch.toLowerCase()
    )

    if (isDuplicate) {
      alert('この配合メモは既に登録されています。')
      setParentA('')
      setParentB('')
      setChild('')
      setIsMutation(false)
      return
    }

    const tempId = Date.now()
    const newRecipe: RecipeMemo = {
      id: tempId,
      parent_a_name: parentAName,
      parent_b_name: parentBName,
      child_name: ch,
      is_mutation: isMutation
    }

    const updatedRecipes = [newRecipe, ...recipes]
    setRecipes(updatedRecipes)
    localStorage.setItem('palbreed-mock-recipes', JSON.stringify(updatedRecipes))

    // 成功トーストの表示
    setSuccessMessage(`「${parentAName} ＋ ${parentBName} ➜ ${ch}」を記録しました！`)
    setTimeout(() => {
      setSuccessMessage(null)
    }, 4000)

    // 入力フォームのクリア
    setParentA('')
    setParentB('')
    setChild('')
    setIsMutation(false)

    // DB保存
    if (user && user.id !== MOCK_USER.id && !dbError) {
      const supabase = createClient()
      
      // 配合レシピの保存
      const { data: recipeData, error: recipeError } = await supabase
        .from('breed_recipes')
        .insert({
          user_id: user.id,
          parent_a_name: parentAName,
          parent_b_name: parentBName,
          child_name: ch,
          is_mutation: isMutation
        })
        .select('id')
        .single()

      if (recipeError) {
        console.error('Failed to save recipe to Supabase:', recipeError)
        // 配合の差し戻し
        const rolledBack = recipes.filter(r => r.id !== tempId)
        setRecipes(rolledBack)
        localStorage.setItem('palbreed-mock-recipes', JSON.stringify(rolledBack))
      } else if (recipeData) {
        // IDの更新
        setRecipes(prev => prev.map(r => r.id === tempId ? { ...r, id: recipeData.id } : r))
      }
    }
  }

  // 配合メモの削除
  const handleRemoveRecipe = async (id: number) => {
    const targetRecipe = recipes.find(r => r.id === id)
    if (!targetRecipe) return

    const updatedRecipes = recipes.filter(r => r.id !== id)
    setRecipes(updatedRecipes)
    localStorage.setItem('palbreed-mock-recipes', JSON.stringify(updatedRecipes))

    if (user && user.id !== MOCK_USER.id && !dbError) {
      const supabase = createClient()
      const { error } = await supabase
        .from('breed_recipes')
        .delete()
        .eq('user_id', user.id)
        .eq('id', id)
      
      if (error) {
        console.error('Failed to delete recipe from Supabase:', error)
        // 削除の差し戻し
        const rolledBack = [targetRecipe, ...updatedRecipes]
        setRecipes(rolledBack)
        localStorage.setItem('palbreed-mock-recipes', JSON.stringify(rolledBack))
      }
    }
  }

  // 詳細モーダルで表示する関連データ
  const relatedReverseRecipes = activeDetailPal
    ? recipes.filter(r => r.child_name.toLowerCase() === activeDetailPal.toLowerCase())
    : []

  const relatedForwardRecipes = activeDetailPal
    ? recipes.filter(
        r =>
          r.parent_a_name.toLowerCase() === activeDetailPal.toLowerCase() ||
          r.parent_b_name.toLowerCase() === activeDetailPal.toLowerCase()
      )
    : []

  return (
    <div className="min-h-screen p-4 space-y-8">
      {/* イントロダクション */}
      <div className="pb-4">
        <p className="text-muted-foreground mt-2">
          自分で見つけたパルを登録し、体験した配合結果（親A ＋ 親B ➜ 子C）をメモ代わりに記録・管理する個人育成ブリーダー手帳です。
        </p>
      </div>

      {dbError && (
        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl px-5 py-3 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>Supabaseへの接続に失敗しました。現在はローカルストレージ（ブラウザ内保存）で動作しています。</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 左カラム：配合メモの記録 */}
        <div className="space-y-6 lg:col-span-1">
          {/* 配合メモ登録 */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-primary" />
                配合メモの記録
              </CardTitle>
              <CardDescription>
                実際に体験した「親A ＋ 親B ➜ 子C」の配合データを記録します。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddRecipe} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2 relative">
                    <label className="text-xs font-semibold text-zinc-400">親パル A</label>
                    <div className="relative">
                      <Input
                        placeholder="親Aを入力または選択..."
                        value={parentA}
                        onChange={e => setParentA(e.target.value)}
                        onFocus={() => setShowSuggestionsA(true)}
                        onBlur={() => setShowSuggestionsA(false)}
                        className="bg-background border-border pr-8"
                        autoComplete="off"
                      />
                      {parentA && (
                        <button
                          type="button"
                          onClick={() => setParentA('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {showSuggestionsA && suggestionsA.length > 0 && (
                      <div className="absolute top-full left-0 z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {suggestionsA.map(name => (
                          <div
                            key={name}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              setParentA(name)
                              setShowSuggestionsA(false)
                            }}
                            className="px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 hover:text-white cursor-pointer transition-colors"
                          >
                            {name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-xs font-semibold text-zinc-400">親パル B</label>
                    <div className="relative">
                      <Input
                        placeholder="親Bを入力または選択..."
                        value={parentB}
                        onChange={e => setParentB(e.target.value)}
                        onFocus={() => setShowSuggestionsB(true)}
                        onBlur={() => setShowSuggestionsB(false)}
                        className="bg-background border-border pr-8"
                        autoComplete="off"
                      />
                      {parentB && (
                        <button
                          type="button"
                          onClick={() => setParentB('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {showSuggestionsB && suggestionsB.length > 0 && (
                      <div className="absolute top-full left-0 z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {suggestionsB.map(name => (
                          <div
                            key={name}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              setParentB(name)
                              setShowSuggestionsB(false)
                            }}
                            className="px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 hover:text-white cursor-pointer transition-colors"
                          >
                            {name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-xs font-semibold text-zinc-400">生まれたパル</label>
                    <div className="relative">
                      <Input
                        placeholder="生まれたパルの名前..."
                        value={child}
                        onChange={e => setChild(e.target.value)}
                        onFocus={() => setShowSuggestionsChild(true)}
                        onBlur={() => setShowSuggestionsChild(false)}
                        className="bg-background border-border pr-8"
                        autoComplete="off"
                      />
                      {child && (
                        <button
                          type="button"
                          onClick={() => setChild('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {showSuggestionsChild && suggestionsChild.length > 0 && (
                      <div className="absolute top-full left-0 z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {suggestionsChild.map(name => (
                          <div
                            key={name}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              setChild(name)
                              setShowSuggestionsChild(false)
                            }}
                            className="px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 hover:text-white cursor-pointer transition-colors"
                          >
                            {name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is-mutation"
                      checked={isMutation}
                      onCheckedChange={(checked) => setIsMutation(!!checked)}
                      className="border-muted-foreground/60 data-[state=checked]:bg-purple-600 data-[state=checked]:text-white"
                    />
                    <label
                      htmlFor="is-mutation"
                      className="text-sm font-semibold leading-none text-zinc-300 cursor-pointer flex items-center gap-1.5 select-none"
                    >
                      🧬 突然変異として記録する
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                      記録する
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setParentA('')
                        setParentB('')
                        setChild('')
                        setIsMutation(false)
                      }}
                      className="border-border text-zinc-400 hover:text-white"
                    >
                      クリア
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* 右カラム：配合メモの履歴 */}
        <div className="space-y-6 lg:col-span-1">

          {/* 配合メモ履歴一覧 */}
          <Card className="border-border bg-zinc-900/30">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-zinc-400" />
                配合メモ検索
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recipes.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground search-icon" />
                  <Input
                    placeholder="配合メモをパル名で検索 (親A、親B、子)..."
                    value={recipeSearch}
                    onChange={e => setRecipeSearch(e.target.value)}
                    className="pl-9 pr-8 bg-background/50 border-border search-input"
                  />
                  {recipeSearch && (
                    <button
                      type="button"
                      onClick={() => setRecipeSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
              {recipes.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border/40 rounded-xl">
                  <p className="text-sm text-muted-foreground">登録済みの配合メモはありません。</p>
                  <p className="text-xs text-muted-foreground mt-1">左のフォームから初めての配合を記録しましょう！</p>
                </div>
              ) : recipeSearch.trim() !== '' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-1">
                  {recipes
                    .filter(recipe => {
                      const q = hiraganaToKatakana(recipeSearch)
                      return (
                        recipe.parent_a_name.includes(q) ||
                        recipe.parent_b_name.includes(q) ||
                        recipe.child_name.includes(q)
                      )
                    })
                    .map(recipe => {
                      return (
                        <div
                          key={recipe.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-zinc-950/40 border-border/40"
                        >
                          <div className="flex flex-col gap-1 text-xs">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setActiveDetailPal(recipe.parent_a_name)}
                                className="font-semibold hover:underline text-zinc-200"
                              >
                                {recipe.parent_a_name}
                              </button>
                              <span className="text-zinc-600">+</span>
                              <button
                                onClick={() => setActiveDetailPal(recipe.parent_b_name)}
                                className="font-semibold hover:underline text-zinc-200"
                              >
                                {recipe.parent_b_name}
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-zinc-500">
                              <span>➜</span>
                              <button
                                onClick={() => setActiveDetailPal(recipe.child_name)}
                                className="font-bold hover:underline text-emerald-400"
                              >
                                {recipe.child_name}
                              </button>
                              {recipe.is_mutation && (
                                <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1 rounded flex items-center gap-0.5 font-semibold">
                                  🧬 突然変異
                                </span>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveRecipe(recipe.id)}
                            className="h-8 w-8 hover:text-destructive hover:bg-destructive/10 text-zinc-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* パル詳細モーダル */}
      {activeDetailPal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-zinc-950 border border-border/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 dialog-window">
            {/* モーダルのヘッダー */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border/40 bg-zinc-900/40 dialog-header">
              <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                <Sparkles className="h-5 w-5 text-primary" />
                {activeDetailPal} の詳細
              </h3>
              <button
                onClick={() => setActiveDetailPal(null)}
                className="text-zinc-400 hover:text-foreground text-sm font-semibold transition-colors"
              >
                閉じる
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* 逆引き配合メモ */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-zinc-400 flex items-center gap-1.5 border-l-2 border-primary pl-2">
                  このパルが生まれる配合メモ ({relatedReverseRecipes.length})
                </h4>
                {relatedReverseRecipes.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic pl-3">登録された配合メモはありません。</p>
                ) : (
                  <div className="space-y-2">
                    {relatedReverseRecipes.map(r => (
                      <div key={r.id} className="text-xs p-2.5 rounded-lg border border-border/40 bg-zinc-900/20 flex items-center justify-between">
                        <div>
                          <span className="text-zinc-300 font-semibold">{r.parent_a_name}</span>
                          <span className="mx-1.5 text-zinc-500">+</span>
                          <span className="text-zinc-300 font-semibold">{r.parent_b_name}</span>
                        </div>
                        {r.is_mutation && <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1 rounded font-semibold">🧬 突然変異</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 順引き配合メモ */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-zinc-400 flex items-center gap-1.5 border-l-2 border-primary pl-2">
                  このパルを親とする配合メモ ({relatedForwardRecipes.length})
                </h4>
                {relatedForwardRecipes.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic pl-3">登録された配合メモはありません。</p>
                ) : (
                  <div className="space-y-2">
                    {relatedForwardRecipes.map(r => {
                      const partnerName = r.parent_a_name.toLowerCase() === activeDetailPal.toLowerCase() ? r.parent_b_name : r.parent_a_name
                      return (
                        <div key={r.id} className="text-xs p-2.5 rounded-lg border border-border/40 bg-zinc-900/20 flex items-center justify-between">
                          <div>
                            <span className="text-zinc-300 font-semibold">{activeDetailPal}</span>
                            <span className="mx-1.5 text-zinc-500">+</span>
                            <span className="text-zinc-300 font-semibold">{partnerName}</span>
                            <span className="mx-2 text-zinc-500">➜</span>
                            <span className="text-emerald-400 font-bold">{r.child_name}</span>
                          </div>
                          {r.is_mutation && <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1 rounded font-semibold">🧬 突然変異</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {successMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white rounded-xl px-5 py-3.5 shadow-lg border border-emerald-500/20 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-semibold">{successMessage}</span>
        </div>
      )}
    </div>
  )
}
