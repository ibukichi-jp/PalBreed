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
})
