import { describe, expect, it } from 'vitest'
import { createStage } from './stage.ts'
import { WK_POSE_DIALOGUE, WK_POSE_EXECUTION } from './art.generated.ts'

describe('createStage', () => {
  it('初始为问道立绘，双层交叉淡入结构', () => {
    const { stage } = createStage()
    expect(stage.dataset.skinOwner).toBe('wukong')
    const imgs = stage.querySelectorAll('img')
    expect(imgs).toHaveLength(2)
    const active = stage.querySelector('img[data-active]') as HTMLImageElement
    expect(active.src).toBe(WK_POSE_DIALOGUE)
  })

  it('setPose 切换：新姿势进前层，旧层退出', () => {
    const { stage, setPose } = createStage()
    setPose('battle')
    const active = stage.querySelector('img[data-active]') as HTMLImageElement
    expect(active.src).toBe(WK_POSE_EXECUTION)
    expect(stage.querySelectorAll('img[data-active]')).toHaveLength(1)
  })

  it('同状态重复 setPose 不翻层', () => {
    const { stage, setPose } = createStage()
    const before = stage.querySelector('img[data-active]')
    setPose('dialogue')
    expect(stage.querySelector('img[data-active]')).toBe(before)
  })

  it('立绘为装饰：alt 空 + aria-hidden', () => {
    const { stage } = createStage()
    expect(stage.getAttribute('aria-hidden')).toBe('true')
    stage.querySelectorAll('img').forEach(img => expect(img.alt).toBe(''))
  })
})
