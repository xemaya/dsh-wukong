import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFreezeRing, createInkTransition } from './vfx.ts'

describe('createInkTransition', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('play 挂一次性墨晕层，约 620ms 后自移除', () => {
    const ink = createInkTransition()
    ink.play()
    expect(document.body.querySelector('[data-skin-owner="wukong"]')).not.toBeNull()
    vi.advanceTimersByTime(620)
    expect(document.body.querySelector('[data-skin-owner="wukong"]')).toBeNull()
  })

  it('播放中重复 play 不叠加（一次一个，反馈不是灯光秀）', () => {
    const ink = createInkTransition()
    ink.play()
    ink.play()
    expect(document.body.querySelectorAll('[data-skin-owner="wukong"]')).toHaveLength(1)
    ink.dispose()
  })

  it('dispose 清理挂起的层与定时器', () => {
    const ink = createInkTransition()
    ink.play()
    ink.dispose()
    expect(document.body.querySelector('[data-skin-owner="wukong"]')).toBeNull()
    vi.advanceTimersByTime(1000)  // 不抛错、无残留
  })
})

describe('createFreezeRing', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => { vi.useRealTimers(); document.body.innerHTML = '' })

  it('play 挂一次性定身圈，900ms 后自移除', () => {
    const ring = createFreezeRing()
    ring.play()
    expect(document.body.querySelector('[data-skin-owner="wukong"]')).not.toBeNull()
    vi.advanceTimersByTime(900)
    expect(document.body.querySelector('[data-skin-owner="wukong"]')).toBeNull()
  })

  it('播放中重复 play 不叠加', () => {
    const ring = createFreezeRing()
    ring.play(); ring.play()
    expect(document.body.querySelectorAll('[data-skin-owner="wukong"]')).toHaveLength(1)
    ring.dispose()
  })

  it('dispose 清理挂起层与定时器', () => {
    const ring = createFreezeRing()
    ring.play(); ring.dispose()
    expect(document.body.querySelector('[data-skin-owner="wukong"]')).toBeNull()
    vi.advanceTimersByTime(2000)
  })
})
