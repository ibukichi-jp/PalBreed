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
})
