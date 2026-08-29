describe('Breeding Logic', () => {
  interface RecipeMemo {
    id: number
    parent_a_name: string
    parent_b_name: string
    child_name: string
    is_mutation: boolean
  }

  const sortParents = (parentA: string, parentB: string): [string, string] => {
    return [parentA, parentB].sort((a, b) => a.localeCompare(b)) as [string, string]
  }

  test('sorts parent names alphabetically', () => {
    const [pA, pB] = sortParents('Lamball', 'Chikipi')
    expect(pA).toBe('Chikipi')
    expect(pB).toBe('Lamball')
  })

  test('sorts Japanese parent names in Gojuon order', () => {
    const [pA, pB] = sortParents('モコロン', 'ツッパニャン')
    expect(pA).toBe('ツッパニャン')
    expect(pB).toBe('モコロン')
  })

  test('keeps names sorted if they are already in order', () => {
    const [pA, pB] = sortParents('アヌビス', 'ジェドラン')
    expect(pA).toBe('アヌビス')
    expect(pB).toBe('ジェドラン')
  })

  describe('Recipe Duplication Check', () => {

    const checkDuplicate = (
      recipes: RecipeMemo[],
      parentAName: string,
      parentBName: string,
      childName: string
    ): boolean => {
      return recipes.some(
        r =>
          r.parent_a_name.toLowerCase() === parentAName.toLowerCase() &&
          r.parent_b_name.toLowerCase() === parentBName.toLowerCase() &&
          r.child_name.toLowerCase() === childName.toLowerCase()
      )
    }

    const mockRecipes: RecipeMemo[] = [
      { id: 1, parent_a_name: 'ツッパニャン', parent_b_name: 'モコロン', child_name: 'チキピ', is_mutation: false },
      { id: 2, parent_a_name: 'ツッパニャン', parent_b_name: 'モコロン', child_name: 'アヌビス', is_mutation: true }
    ]

    test('prevents registering duplicate recipe with the exact same parent pair and child name', () => {
      // 親と子が同じものは重複
      const isDuplicate = checkDuplicate(mockRecipes, 'ツッパニャン', 'モコロン', 'チキピ')
      expect(isDuplicate).toBe(true)
    })

    test('allows registering recipe if the child name is different even with same parent pair', () => {
      // 親が同じでも、生まれるパルが異なれば登録可能
      const isDuplicate = checkDuplicate(mockRecipes, 'ツッパニャン', 'モコロン', 'ジェドラン')
      expect(isDuplicate).toBe(false)
    })

    test('ignores character case when checking for duplicates', () => {
      // アルファベットの大文字小文字表記が異なっても重複と判定される
      const englishRecipes: RecipeMemo[] = [
        { id: 1, parent_a_name: 'Lamball', parent_b_name: 'Chikipi', child_name: 'Anubis', is_mutation: false }
      ]
      const isDuplicate = checkDuplicate(englishRecipes, 'lamball', 'chikipi', 'anubis')
      expect(isDuplicate).toBe(true)
    })
  })

  describe('Recipe Search Filtering', () => {
    const filterRecipes = (
      recipes: RecipeMemo[],
      query: string,
      searchParent: boolean,
      searchChild: boolean
    ): RecipeMemo[] => {
      const q = query.trim().toLowerCase()
      if (q === '') return recipes
      const isNoFilter = !searchParent && !searchChild
      return recipes.filter(r => {
        const matchParent = (searchParent || isNoFilter) && (
          r.parent_a_name.toLowerCase().includes(q) ||
          r.parent_b_name.toLowerCase().includes(q)
        )
        const matchChild = (searchChild || isNoFilter) && r.child_name.toLowerCase().includes(q)
        return matchParent || matchChild
      })
    }

    const testRecipes: RecipeMemo[] = [
      { id: 1, parent_a_name: 'モコロン', parent_b_name: 'ツッパニャン', child_name: 'チキピ', is_mutation: false },
      { id: 2, parent_a_name: 'アヌビス', parent_b_name: 'ツッパニャン', child_name: 'モコロン', is_mutation: false },
      { id: 3, parent_a_name: 'アヌビス', parent_b_name: 'ジェドラン', child_name: 'ホルス', is_mutation: true }
    ]

    test('matches both parent and child when both search flags are true', () => {
      const results = filterRecipes(testRecipes, 'モコロン', true, true)
      expect(results.length).toBe(2)
      expect(results.some(r => r.id === 1)).toBe(true)
      expect(results.some(r => r.id === 2)).toBe(true)
    })

    test('matches only parent when searchParent is true and searchChild is false', () => {
      const results = filterRecipes(testRecipes, 'モコロン', true, false)
      expect(results.length).toBe(1)
      expect(results[0].id).toBe(1)
    })

    test('matches only child when searchParent is false and searchChild is true', () => {
      const results = filterRecipes(testRecipes, 'モコロン', false, true)
      expect(results.length).toBe(1)
      expect(results[0].id).toBe(2)
    })

    test('matches both parent and child when both searchParent and searchChild are false', () => {
      const results = filterRecipes(testRecipes, 'モコロン', false, false)
      expect(results.length).toBe(2)
      expect(results.some(r => r.id === 1)).toBe(true)
      expect(results.some(r => r.id === 2)).toBe(true)
    })
  })
})
