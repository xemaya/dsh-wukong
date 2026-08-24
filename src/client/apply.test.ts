import { afterEach, describe, expect, it } from 'vitest'
import { apply } from './index.ts'

function fakeCtx() {
  const disposers: Array<() => void> = []
  return {
    ctx: { effect(run: () => () => void, _label?: string) { disposers.push(run()) } },
    dispose() { for (const fn of disposers.reverse()) fn() },
  }
}

describe('apply', () => {
  afterEach(() => {
    document.body.replaceWith(document.createElement('body'))
    document.head.querySelectorAll('meta[name="theme-color"]').forEach(el => el.remove())
  })

  it('挂载 body 属性、标题与初始状态；dispose 完整还原', () => {
    document.title = 'original'
    const { ctx, dispose } = fakeCtx()
    apply(ctx as never)
    expect(document.body.dataset.dshWukong).toBe('')
    expect(document.body.dataset.wukongState).toBe('dialogue')
    expect(document.title).toBe('DSH // 天命')
    expect(document.head.querySelector('link[rel="icon"][data-skin-owner="wukong"]')).not.toBeNull()

    dispose()
    expect(document.body.dataset.dshWukong).toBeUndefined()
    expect(document.body.dataset.wukongState).toBeUndefined()
    expect(document.title).toBe('original')
    expect(document.head.querySelector('[data-skin-owner="wukong"]')).toBeNull()
  })

  it('running 工具行出现后 body 进入降妖态', async () => {
    const { ctx, dispose } = fakeCtx()
    apply(ctx as never)
    document.body.insertAdjacentHTML('beforeend',
      '<div data-chat-flow><div data-tool data-state="running"></div></div>')
    await new Promise(r => setTimeout(r, 50))  // 等 MutationObserver 微任务
    expect(document.body.dataset.wukongState).toBe('battle')
    dispose()
  })

  it('皮肤自有节点上的 data-state 翻转不触发状态机（防 livelock）', async () => {
    const { ctx, dispose } = fakeCtx()
    apply(ctx as never)
    document.body.insertAdjacentHTML('beforeend',
      '<div data-chat-flow><div data-tool data-skin-owner="wukong" data-state="idle"></div></div>')
    await new Promise(r => setTimeout(r, 50))
    expect(document.body.dataset.wukongState).toBe('dialogue')

    document.querySelector('[data-tool]')!.setAttribute('data-state', 'running')
    await new Promise(r => setTimeout(r, 50))
    expect(document.body.dataset.wukongState).toBe('dialogue')
    dispose()
  })

  it('产品工具行的 data-state 属性翻转（非皮肤节点）仍正常驱动状态机', async () => {
    const { ctx, dispose } = fakeCtx()
    apply(ctx as never)
    document.body.insertAdjacentHTML('beforeend',
      '<div data-chat-flow><div data-tool data-state="running"></div></div>')
    await new Promise(r => setTimeout(r, 50))
    expect(document.body.dataset.wukongState).toBe('battle')

    document.querySelector('[data-tool]')!.setAttribute('data-state', 'error')
    await new Promise(r => setTimeout(r, 50))
    expect(document.body.dataset.wukongState).toBe('alert')
    dispose()
  })

  it('产品已有 theme-color meta 时同步为 Void 色，dispose 后恢复原值', () => {
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.content = '#123456'
    document.head.append(meta)

    const { ctx, dispose } = fakeCtx()
    apply(ctx as never)
    expect(meta.content).toBe('#080706')

    dispose()
    expect(meta.content).toBe('#123456')
  })
})
