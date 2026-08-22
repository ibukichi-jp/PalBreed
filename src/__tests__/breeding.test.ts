describe('Breeding Logic', () => {
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
    interface RecipeMemo {
      id: number
      parent_a_name: string
      parent_b_name: string
      child_name: string
      is_mutation: boolean
    }

    const checkDuplicate = (
      recipes: RecipeMemo[],
      parentAName: string,
      parentBName: string,
      childName: string,
      isMutation: boolean
    ): boolean => {
      return recipes.some(r => {
        if (!isMutation) {
          return r.parent_a_name === parentAName && r.parent_b_name === parentBName && !r.is_mutation
        }
        return r.parent_a_name === parentAName && 
               r.parent_b_name === parentBName && 
               r.child_name === childName && 
               r.is_mutation
      })
    }

    const mockRecipes: RecipeMemo[] = [
      { id: 1, parent_a_name: 'ツッパニャン', parent_b_name: 'モコロン', child_name: 'チキピ', is_mutation: false },
      { id: 2, parent_a_name: 'ツッパニャン', parent_b_name: 'モコロン', child_name: 'アヌビス', is_mutation: true }
    ]

    test('prevents registering duplicate normal recipes for the same parent pair', () => {
      // ツッパニャン + モコロン の通常配合 (is_mutation = false) は既に存在するため重複
      const isDuplicate = checkDuplicate(mockRecipes, 'ツッパニャン', 'モコロン', 'チキピ', false)
      expect(isDuplicate).toBe(true)
    })

    test('allows registering mutation recipe even if normal recipe for the same parent pair exists (different child name)', () => {
      // ツッパニャン + モコロン の通常配合はあるが、新しい突然変異 (is_mutation = true, child = ジェドラン) は重複しない
      const isDuplicate = checkDuplicate(mockRecipes, 'ツッパニャン', 'モコロン', 'ジェドラン', true)
      expect(isDuplicate).toBe(false)
    })

    test('prevents registering duplicate mutation recipe with the exact same parent pair and child name', () => {
      // ツッパニャン + モコロン -> アヌビス (is_mutation = true) は既に存在するため重複
      const isDuplicate = checkDuplicate(mockRecipes, 'ツッパニャン', 'モコロン', 'アヌビス', true)
      expect(isDuplicate).toBe(true)
    })

    test('allows registering normal recipe if only mutation recipes exist for the parent pair', () => {
      const mutationOnlyRecipes = [
        { id: 2, parent_a_name: 'ツッパニャン', parent_b_name: 'モコロン', child_name: 'アヌビス', is_mutation: true }
      ]
      // 突然変異のみ登録されている場合、通常配合 (is_mutation = false) は登録可能
      const isDuplicate = checkDuplicate(mutationOnlyRecipes, 'ツッパニャン', 'モコロン', 'チキピ', false)
      expect(isDuplicate).toBe(false)
    })
  })
})
