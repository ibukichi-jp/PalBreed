'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUser, MOCK_USER } from '@/lib/auth-helper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Sparkles, AlertCircle, Plus, Trash2, BookOpen, PlusCircle, Search, Info } from 'lucide-react'

interface RecipeMemo {
  id: number
  parent_a_name: string
  parent_b_name: string
  child_name: string
  is_mutation: boolean
}

// ひらがなをカタカナに変換するユーティリティ関数
const hiraganaToKatakana = (str: string): string => {
  return str.replace(/[\u3041-\u3096]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) + 0x60)
  })
}

export default function MyPalsPage() {
  const [user, setUser] = useState<any>(null)
  
  // 手持ちパルと配合メモの状態管理
  const [ownedPalNames, setOwnedPalNames] = useState<Set<string>>(new Set())
  const [recipes, setRecipes] = useState<RecipeMemo[]>([])
  
  const [dbError, setDbError] = useState(false)

  // 検索用キーワードの状態
  const [ownedSearch, setOwnedSearch] = useState('')
  const [recipeSearch, setRecipeSearch] = useState('')

  // 入力フォームの状態
  const [newPalName, setNewPalName] = useState('')
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
    return Array.from(ownedPalNames)
      .sort()
      .filter(name => name.toLowerCase().startsWith(val) && name.toLowerCase() !== val)
  }, [parentA, ownedPalNames])

  // 親Bの前方一致サジェスト候補
  const suggestionsB = useMemo(() => {
    const rawVal = parentB.trim()
    if (!rawVal) return []
    const val = hiraganaToKatakana(rawVal).toLowerCase()
    return Array.from(ownedPalNames)
      .sort()
      .filter(name => name.toLowerCase().startsWith(val) && name.toLowerCase() !== val)
  }, [parentB, ownedPalNames])

  // 子パルサジェスト表示用の状態
  const [showSuggestionsChild, setShowSuggestionsChild] = useState(false)

  // 生まれたパルの前方一致サジェスト候補
  const suggestionsChild = useMemo(() => {
    const rawVal = child.trim()
    if (!rawVal) return []
    const val = hiraganaToKatakana(rawVal).toLowerCase()
    return Array.from(ownedPalNames)
      .sort()
      .filter(name => name.toLowerCase().startsWith(val) && name.toLowerCase() !== val)
  }, [child, ownedPalNames])

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
          const savedOwned = localStorage.getItem('palbreed-mock-owned-names')
          if (savedOwned) setOwnedPalNames(new Set(JSON.parse(savedOwned)))

          const savedRecipes = localStorage.getItem('palbreed-mock-recipes')
          if (savedRecipes) setRecipes(JSON.parse(savedRecipes))
        } else {
          // Supabase接続時
          try {
            const supabase = createClient()
            
            // 1. 手持ちパルのロード
            const { data: ownedData, error: ownedError } = await supabase
              .from('user_pals')
              .select('pal_name')
              .eq('user_id', currentUser.id)

            if (ownedError) throw ownedError
            if (ownedData) {
              setOwnedPalNames(new Set(ownedData.map(d => d.pal_name)))
            }

            // 2. 配合メモのロード
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
            
            const savedOwned = localStorage.getItem('palbreed-mock-owned-names')
            if (savedOwned) setOwnedPalNames(new Set(JSON.parse(savedOwned)))

            const savedRecipes = localStorage.getItem('palbreed-mock-recipes')
            if (savedRecipes) setRecipes(JSON.parse(savedRecipes))
          }
        }
      }
    }
    init()
  }, [])

  // 手持ちパルの追加
  const handleAddPal = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = newPalName.trim()
    if (!name) return

    if (ownedPalNames.has(name)) {
      alert('そのパルは既に手持ちに登録されています。')
      return
    }

    const newOwned = new Set(ownedPalNames).add(name)
    setOwnedPalNames(newOwned)
    localStorage.setItem('palbreed-mock-owned-names', JSON.stringify(Array.from(newOwned)))
    setNewPalName('')

    if (user && user.id !== MOCK_USER.id && !dbError) {
      const supabase = createClient()
      const { error } = await supabase
        .from('user_pals')
        .insert({ user_id: user.id, pal_name: name })
      
      if (error) {
        console.error('Failed to save to Supabase:', error)
        const rolledBack = new Set(ownedPalNames)
        rolledBack.delete(name)
        setOwnedPalNames(rolledBack)
        localStorage.setItem('palbreed-mock-owned-names', JSON.stringify(Array.from(rolledBack)))
      }
    }
  }

  // 手動で手持ちを切り替えるトグル処理（詳細画面用）
  const handleTogglePalOwnership = async (name: string) => {
    const isAdding = !ownedPalNames.has(name)
    const newOwned = new Set(ownedPalNames)

    if (isAdding) {
      newOwned.add(name)
    } else {
      newOwned.delete(name)
    }

    setOwnedPalNames(newOwned)
    localStorage.setItem('palbreed-mock-owned-names', JSON.stringify(Array.from(newOwned)))

    if (user && user.id !== MOCK_USER.id && !dbError) {
      const supabase = createClient()
      if (isAdding) {
        const { error } = await supabase
          .from('user_pals')
          .insert({ user_id: user.id, pal_name: name })
        if (error) console.error('Failed to save to Supabase:', error)
      } else {
        const { error } = await supabase
          .from('user_pals')
          .delete()
          .eq('user_id', user.id)
          .eq('pal_name', name)
        if (error) console.error('Failed to delete from Supabase:', error)
      }
    }
  }

  // 手持ちパルの削除
  const handleRemovePal = async (name: string) => {
    const newOwned = new Set(ownedPalNames)
    newOwned.delete(name)
    setOwnedPalNames(newOwned)
    localStorage.setItem('palbreed-mock-owned-names', JSON.stringify(Array.from(newOwned)))

    if (user && user.id !== MOCK_USER.id && !dbError) {
      const supabase = createClient()
      const { error } = await supabase
        .from('user_pals')
        .delete()
        .eq('user_id', user.id)
        .eq('pal_name', name)
      
      if (error) {
        console.error('Failed to delete from Supabase:', error)
        newOwned.add(name)
        setOwnedPalNames(new Set(newOwned))
        localStorage.setItem('palbreed-mock-owned-names', JSON.stringify(Array.from(newOwned)))
      }
    }
  }

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

    // 手持ちパルに存在するかチェック
    if (!ownedPalNames.has(pA) || !ownedPalNames.has(pB)) {
      alert('親パルには、手持ちのパル（所持しているパル）のみを入力または選択してください。')
      return
    }

    // 順序制約 (A <= B) のため、日本語読みまたは文字列の大小で親の名前をソートして保存
    let parentAName = pA
    let parentBName = pB
    if (parentAName.localeCompare(parentBName) > 0) {
      [parentAName, parentBName] = [parentBName, parentAName]
    }

    // すでに同じ親の組み合わせが登録されているかチェック
    const isDuplicate = recipes.some(r => {
      // 1. 通常配合を登録しようとしている場合、同じ親ペアの通常配合があれば重複
      if (!isMutation) {
        return r.parent_a_name === parentAName && r.parent_b_name === parentBName && !r.is_mutation
      }
      // 2. 突然変異配合を登録しようとしている場合、同じ親ペア・同じ子パル・突然変異のものが既に登録されていれば重複
      return r.parent_a_name === parentAName && 
             r.parent_b_name === parentBName && 
             r.child_name === ch && 
             r.is_mutation
    })
    if (isDuplicate) {
      alert(isMutation 
        ? 'その親の組み合わせと突然変異パルのメモは既に登録されています。'
        : 'その親の組み合わせの通常配合メモは既に登録されています。'
      )
      return
    }

    // 1. 配合レシピのローカル状態追加
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

    // 2. 生まれたパルを手持ちパルにも自動登録する
    const isAlreadyOwned = ownedPalNames.has(ch)
    if (!isAlreadyOwned) {
      const newOwned = new Set(ownedPalNames).add(ch)
      setOwnedPalNames(newOwned)
      localStorage.setItem('palbreed-mock-owned-names', JSON.stringify(Array.from(newOwned)))
    }

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

      // 手持ちパルの自動DB登録（未所持の場合のみ）
      if (!isAlreadyOwned) {
        const { error: ownedError } = await supabase
          .from('user_pals')
          .insert({ user_id: user.id, pal_name: ch })
        
        if (ownedError) {
          console.error('Failed to auto-save owned pal to Supabase:', ownedError)
          // 手持ちの差し戻し
          const rolledBackOwned = new Set(ownedPalNames)
          rolledBackOwned.delete(ch)
          setOwnedPalNames(rolledBackOwned)
          localStorage.setItem('palbreed-mock-owned-names', JSON.stringify(Array.from(rolledBackOwned)))
        }
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
        // 差し戻し
        setRecipes(recipes)
        localStorage.setItem('palbreed-mock-recipes', JSON.stringify(recipes))
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
    <div className="container max-w-7xl px-4 py-8 mx-auto space-y-8">
      {/* イントロダクション */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            PalBreed (パルブリード)
          </h1>
          <p className="text-muted-foreground mt-2">
            自分で見つけたパルを登録し、体験した配合結果（親A ＋ 親B ➜ 子C）をメモ代わりに記録・管理する個人育成ブリーダー手帳です。
          </p>
        </div>
      </div>

      {dbError && (
        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl px-5 py-3 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>Supabaseへの接続に失敗しました。現在はローカルストレージ（ブラウザ内保存）で動作しています。</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 左カラム：手持ちパルの管理 */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border-border bg-zinc-900/30">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                手持ちパルの登録
              </CardTitle>
              <CardDescription>
                現在所持しているパルの名前を入力して追加します。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddPal} className="flex gap-2">
                <Input
                  placeholder="パル名を入力 (例: モコロン)..."
                  value={newPalName}
                  onChange={e => setNewPalName(e.target.value)}
                  className="bg-background border-border"
                />
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  追加
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 手持ち一覧 */}
          <Card className="border-border bg-zinc-900/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                登録済みの手持ちパル ({ownedPalNames.size})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ownedPalNames.size > 0 && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="手持ちパルを検索..."
                    value={ownedSearch}
                    onChange={e => setOwnedSearch(e.target.value)}
                    className="pl-8 h-8 text-xs bg-background/50 border-border"
                  />
                </div>
              )}
              {ownedPalNames.size === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">手持ちパルが登録されていません。</p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto pr-1">
                  {Array.from(ownedPalNames)
                    .filter(name => name.includes(ownedSearch))
                    .map(name => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:border-primary/50 transition-colors"
                      >
                        <button
                          onClick={() => setActiveDetailPal(name)}
                          className="hover:text-primary transition-colors text-left flex items-center gap-1"
                        >
                          <Info className="h-3 w-3 text-zinc-500" />
                          {name}
                        </button>
                        <button
                          onClick={() => handleRemovePal(name)}
                          className="text-zinc-500 hover:text-destructive transition-colors ml-1"
                          title="手持ちから削除"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右カラム：配合メモの追加と履歴 */}
        <div className="space-y-6 lg:col-span-2">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2 relative">
                    <label className="text-xs font-semibold text-zinc-400">親パル A</label>
                    <Input
                      placeholder="親Aを入力または選択..."
                      value={parentA}
                      onChange={e => setParentA(e.target.value)}
                      onFocus={() => setShowSuggestionsA(true)}
                      onBlur={() => setShowSuggestionsA(false)}
                      className="bg-background border-border"
                      autoComplete="off"
                    />
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
                    <Input
                      placeholder="親Bを入力または選択..."
                      value={parentB}
                      onChange={e => setParentB(e.target.value)}
                      onFocus={() => setShowSuggestionsB(true)}
                      onBlur={() => setShowSuggestionsB(false)}
                      className="bg-background border-border"
                      autoComplete="off"
                    />
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
                    <Input
                      placeholder="生まれたパルの名前..."
                      value={child}
                      onChange={e => setChild(e.target.value)}
                      onFocus={() => setShowSuggestionsChild(true)}
                      onBlur={() => setShowSuggestionsChild(false)}
                      className="bg-background border-border animate-pulse-light"
                      autoComplete="off"
                    />
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

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
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
                  <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8">
                    記録する
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* 配合メモ履歴一覧 */}
          <Card className="border-border bg-zinc-900/30">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-zinc-400" />
                配合メモ履歴 ({recipes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recipes.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="配合メモをパル名で検索 (親A、親B、子)..."
                    value={recipeSearch}
                    onChange={e => setRecipeSearch(e.target.value)}
                    className="pl-9 bg-background/50 border-border"
                  />
                </div>
              )}
              {recipes.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border/40 rounded-xl">
                  <p className="text-sm text-muted-foreground">登録済みの配合メモはありません。</p>
                  <p className="text-xs text-muted-foreground mt-1">上のフォームから初めての配合を記録しましょう！</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-1">
                  {recipes
                    .filter(recipe => 
                      recipe.parent_a_name.includes(recipeSearch) ||
                      recipe.parent_b_name.includes(recipeSearch) ||
                      recipe.child_name.includes(recipeSearch)
                    )
                    .map(recipe => {
                      const isParentAOwned = ownedPalNames.has(recipe.parent_a_name)
                      const isParentBOwned = ownedPalNames.has(recipe.parent_b_name)
                      const isChildOwned = ownedPalNames.has(recipe.child_name)
                      const isFullyOwned = isParentAOwned && isParentBOwned

                      return (
                        <div
                          key={recipe.id}
                          className={`flex items-center justify-between p-3 rounded-lg border bg-zinc-950/40 ${
                            isFullyOwned
                              ? 'border-primary/30 shadow-[0_0_10px_rgba(14,165,233,0.03)]'
                              : 'border-border/40'
                          }`}
                        >
                          <div className="flex flex-col gap-1 text-xs">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setActiveDetailPal(recipe.parent_a_name)}
                                className={`font-semibold hover:underline ${isParentAOwned ? 'text-primary' : 'text-zinc-400'}`}
                              >
                                {recipe.parent_a_name}
                              </button>
                              <span className="text-zinc-600">+</span>
                              <button
                                onClick={() => setActiveDetailPal(recipe.parent_b_name)}
                                className={`font-semibold hover:underline ${isParentBOwned ? 'text-primary' : 'text-zinc-400'}`}
                              >
                                {recipe.parent_b_name}
                              </button>
                            </div>
                             <div className="flex items-center gap-1.5 mt-0.5 text-zinc-500">
                              <span>➜</span>
                              <button
                                onClick={() => setActiveDetailPal(recipe.child_name)}
                                className={`font-bold hover:underline ${isChildOwned ? 'text-emerald-400' : 'text-primary/80'}`}
                              >
                                {recipe.child_name}
                              </button>
                              {recipe.is_mutation && (
                                <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1 rounded flex items-center gap-0.5 font-semibold">
                                  🧬 突然変異
                                </span>
                              )}
                              {isChildOwned && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded">所持済</span>}
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* パル詳細モーダル */}
      {activeDetailPal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-zinc-950 border border-border/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* モーダルのヘッダー */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border/40 bg-zinc-900/40">
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
              {/* 手持ちトグル */}
              <div className="flex justify-between items-center p-4 rounded-xl border border-border/60 bg-zinc-900/10">
                <span className="text-sm font-medium text-zinc-300">手持ちステータス</span>
                <Button
                  size="sm"
                  variant={ownedPalNames.has(activeDetailPal) ? "destructive" : "default"}
                  onClick={() => {
                    handleTogglePalOwnership(activeDetailPal)
                  }}
                  className="font-semibold"
                >
                  {ownedPalNames.has(activeDetailPal) ? "手持ちから削除" : "手持ちに登録"}
                </Button>
              </div>

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
                      <div key={r.id} className="text-xs p-3 rounded-lg bg-zinc-900/40 border border-border/40 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={ownedPalNames.has(r.parent_a_name) ? "text-primary font-bold" : "text-zinc-400"}>
                            {r.parent_a_name}
                          </span>
                          <span className="text-zinc-600">+</span>
                          <span className={ownedPalNames.has(r.parent_b_name) ? "text-primary font-bold" : "text-zinc-400"}>
                            {r.parent_b_name}
                          </span>
                          <span className="text-zinc-500">➜</span>
                          <span className="text-primary/95 font-bold">{r.child_name}</span>
                        </div>
                        {r.is_mutation && (
                          <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded font-semibold">
                            🧬 突然変異
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 順引き配合メモ */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-zinc-400 flex items-center gap-1.5 border-l-2 border-primary pl-2">
                  このパルを親とした配合メモ ({relatedForwardRecipes.length})
                </h4>
                {relatedForwardRecipes.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic pl-3">登録された配合メモはありません。</p>
                ) : (
                  <div className="space-y-2">
                    {relatedForwardRecipes.map(r => {
                      const partnerName = r.parent_a_name === activeDetailPal ? r.parent_b_name : r.parent_a_name;
                      return (
                        <div key={r.id} className="text-xs p-3 rounded-lg bg-zinc-900/40 border border-border/40 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-primary/80 font-bold">{activeDetailPal}</span>
                            <span className="text-zinc-600">+</span>
                            <span className={ownedPalNames.has(partnerName) ? "text-primary font-bold" : "text-zinc-400"}>
                              {partnerName}
                            </span>
                            <span className="text-zinc-500">➜</span>
                            <span className={ownedPalNames.has(r.child_name) ? "text-emerald-400 font-bold" : "text-primary/90 font-bold"}>
                              {r.child_name}
                            </span>
                          </div>
                          {r.is_mutation && (
                            <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded font-semibold">
                              🧬 突然変異
                            </span>
                          )}
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
    </div>
  )
}
