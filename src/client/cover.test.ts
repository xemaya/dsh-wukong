import { describe, expect, it } from 'vitest'
import { createCover } from './cover.ts'

describe('createCover', () => {
  it('产出皮肤自有的封面节点，setVisible 切换 data-visible', () => {
    const { cover, setVisible } = createCover()
    expect(cover.dataset.skinOwner).toBe('wukong')
    expect(cover.dataset.visible).toBeUndefined()

    setVisible(true)
    expect(cover.dataset.visible).toBe('')

    setVisible(false)
    expect(cover.dataset.visible).toBeUndefined()
  })

  it('内嵌封面美术与文案节点', () => {
    const { cover } = createCover()
    expect(cover.querySelector('img')).not.toBeNull()
    expect(cover.querySelector('h1')?.textContent).toBe('直 面 天 命')
  })
})
