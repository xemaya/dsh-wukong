import { describe, expect, it } from 'vitest'
import { createHud } from './hud.ts'

describe('createHud', () => {
  it('结构：标签、招式名、四颗珠槽，皮肤属性齐全', () => {
    const { hud } = createHud()
    expect(hud.dataset.skinOwner).toBe('wukong')
    expect(hud.getAttribute('aria-hidden')).toBe('true')
    expect(hud.querySelectorAll('[data-wk-bead]')).toHaveLength(4)
  })

  it('sync 渲染真实遥测：降妖 // BASH + 2 珠亮', () => {
    const { hud, sync } = createHud()
    sync('battle', { currentTool: 'Bash', beads: 2 })
    expect(hud.querySelector('[data-wk-hud-label]')!.textContent).toBe('降妖 // BASH')
    expect(hud.querySelectorAll('[data-wk-bead][data-lit]')).toHaveLength(2)
  })

  it('alert 显示受创；无招式名时只显状态', () => {
    const { hud, sync } = createHud()
    sync('alert', { currentTool: undefined, beads: 0 })
    expect(hud.querySelector('[data-wk-hud-label]')!.textContent).toBe('受创')
    expect(hud.querySelectorAll('[data-wk-bead][data-lit]')).toHaveLength(0)
  })

  it('同值 sync 不改写 DOM（textContent 引用稳定）', () => {
    const { hud, sync } = createHud()
    sync('battle', { currentTool: 'Bash', beads: 2 })
    const label = hud.querySelector('[data-wk-hud-label]')!
    const before = label.textContent
    sync('battle', { currentTool: 'Bash', beads: 2 })
    expect(label.textContent).toBe(before)
  })

  it('同值 sync 珠位零 mutation record（幂等写入，非"先删后写"）', () => {
    const { hud, sync } = createHud()
    sync('battle', { currentTool: 'Bash', beads: 2 })

    const observer = new MutationObserver(() => {})
    observer.observe(hud, { attributes: true, subtree: true, attributeFilter: ['data-lit'] })
    sync('battle', { currentTool: 'Bash', beads: 2 })
    const records = observer.takeRecords()
    observer.disconnect()

    expect(records).toHaveLength(0)
  })
})
