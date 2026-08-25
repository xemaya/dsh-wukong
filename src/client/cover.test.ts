import { describe, expect, it } from 'vitest'
import { createCover } from './cover.ts'
import styles from './wukong.module.css'

describe('createCover', () => {
  it('产出皮肤自有的封面节点，setVisible 切换 data-visible', () => {
    const { cover, setVisible, dispose } = createCover()
    expect(cover.dataset.skinOwner).toBe('wukong')
    expect(cover.dataset.visible).toBeUndefined()

    setVisible(true)
    expect(cover.dataset.visible).toBe('')

    setVisible(false)
    expect(cover.dataset.visible).toBeUndefined()
    dispose()
  })

  it('内嵌封面美术与文案节点', () => {
    const { cover, dispose } = createCover()
    expect(cover.querySelector('img')).not.toBeNull()
    expect(cover.querySelector('h1')?.textContent).toBe('直 面 天 命')
    dispose()
  })

  it('封面根不再整体 aria-hidden；装饰性美术/文案节点单独标注', () => {
    const { cover, dispose } = createCover()
    // 可聚焦的土地庙按钮不得嵌在 aria-hidden 子树里，故封面根本身不再
    // 整体 aria-hidden——装饰性节点改为各自标注。
    expect(cover.getAttribute('aria-hidden')).toBeNull()
    const art = cover.querySelector('img')
    expect(art?.getAttribute('aria-hidden')).toBe('true')
    const copy = cover.querySelector('h1')?.parentElement
    expect(copy?.getAttribute('aria-hidden')).toBe('true')
    dispose()
  })

  it('内嵌土地庙 hover 元素，装饰性 alt 为空', () => {
    const { cover, dispose } = createCover()
    const imgs = cover.querySelectorAll('img')
    expect(imgs.length).toBe(2)
    const shrine = imgs[imgs.length - 1]
    expect(shrine.getAttribute('alt')).toBe('')
    dispose()
  })

  it('土地庙是可访问的真按钮，带 aria-label，且不在 aria-hidden 子树内', () => {
    const { cover, dispose } = createCover()
    const shrine = cover.querySelector('button')
    expect(shrine).not.toBeNull()
    expect(shrine?.getAttribute('aria-label')).toBe('土地庙：查看历史对话')
    expect(shrine?.getAttribute('type')).toBe('button')
    expect(shrine?.closest('[aria-hidden="true"]')).toBeNull()
    dispose()
  })

  it('点击土地庙切换 data-wk-shrine-open 展开态', () => {
    const { cover, dispose } = createCover()
    const shrine = cover.querySelector('button')
    expect(cover.dataset.wkShrineOpen).toBeUndefined()

    shrine?.click()
    expect(cover.dataset.wkShrineOpen).toBe('')

    shrine?.click()
    expect(cover.dataset.wkShrineOpen).toBeUndefined()
    dispose()
  })

  it('Escape 关闭已展开的土地庙', () => {
    const { cover, dispose } = createCover()
    const shrine = cover.querySelector('button')
    shrine?.click()
    expect(cover.dataset.wkShrineOpen).toBe('')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(cover.dataset.wkShrineOpen).toBeUndefined()
    dispose()
  })

  it('封面隐藏（会话不再是空存档点）时重置土地庙展开态', () => {
    const { cover, setVisible, dispose } = createCover()
    const shrine = cover.querySelector('button')
    setVisible(true)
    shrine?.click()
    expect(cover.dataset.wkShrineOpen).toBe('')

    setVisible(false)
    expect(cover.dataset.wkShrineOpen).toBeUndefined()
    dispose()
  })

  it('香火烟雾元素存在于土地庙容器内，装饰性 aria-hidden，不参与点击语义', () => {
    const { cover, dispose } = createCover()
    const shrine = cover.querySelector('button')
    expect(shrine).not.toBeNull()

    // 烟雾容器与三缕烟雾都在 shrine 按钮子树内——只装饰香炉位置，不新增
    // 任何可交互节点；容器整体 aria-hidden，点击语义仍完全由外层
    // <button> 承担（CSS 另行给 pointer-events: none，真机走查校验）。
    const smoke = shrine?.querySelector(`.${styles.coverShrineSmoke}`)
    expect(smoke).not.toBeNull()
    expect(smoke?.getAttribute('aria-hidden')).toBe('true')
    expect(shrine?.contains(smoke as Node)).toBe(true)

    const wisps = smoke?.querySelectorAll(`.${styles.smokeWisp}`)
    expect(wisps?.length).toBe(3)
    wisps?.forEach((wisp) => {
      expect(wisp.tagName).toBe('SPAN')
    })
    dispose()
  })

  it('dispose 后 Escape 不再影响任何土地庙（监听已移除）', () => {
    const { cover, dispose } = createCover()
    const shrine = cover.querySelector('button')
    shrine?.click()
    expect(cover.dataset.wkShrineOpen).toBe('')
    dispose()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    // dispose 只应移除监听副作用，不回溯已展开的状态本身
    expect(cover.dataset.wkShrineOpen).toBe('')
  })
})
