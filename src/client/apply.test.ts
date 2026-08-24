import { afterEach, describe, expect, it, vi } from 'vitest'
import { apply } from './index.ts'
import { WK_POSE_EXECUTION } from './art.generated.ts'

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

  it('土地庙封面挂载于 body 首位，dispose 后移除', () => {
    const { ctx, dispose } = fakeCtx()
    apply(ctx as never)
    const cover = document.body.firstElementChild
    expect(cover?.getAttribute('data-skin-owner')).toBe('wukong')
    expect(cover?.querySelector('h1')).not.toBeNull()

    dispose()
    expect(document.body.querySelector('[data-skin-owner="wukong"] h1')).toBeNull()
  })

  it("data-phase='hero' → 封面初始即可见；无 hero 信号则不可见", () => {
    document.body.insertAdjacentHTML('beforeend', "<div data-phase='hero'></div>")
    const { ctx, dispose } = fakeCtx()
    apply(ctx as never)
    const cover = document.body.querySelector('[data-skin-owner="wukong"]') as HTMLElement
    expect(cover.dataset.visible).toBe('')
    dispose()
  })

  it("data-phase 从 'hero' 翻转为 'active' 后，封面随 MutationObserver 隐藏（不依赖 childList 变更）", async () => {
    const phase = document.createElement('div')
    phase.dataset.phase = 'hero'
    document.body.append(phase)
    const { ctx, dispose } = fakeCtx()
    apply(ctx as never)
    const cover = document.body.querySelector('[data-skin-owner="wukong"]') as HTMLElement
    expect(cover.dataset.visible).toBe('')

    phase.dataset.phase = 'active'
    await new Promise(r => setTimeout(r, 50))
    expect(cover.dataset.visible).toBeUndefined()
    dispose()
  })

  it('舞台随状态换姿势；空会话（[data-phase="hero"]）时 body 置位 data-wukong-empty', async () => {
    /* isEmptySession 现实现（contract.ts）：仅看 [data-phase='hero'] 是否存在，
       无 chat-flow 兜底逻辑；页面初始若无任何 data-phase 节点，判定为“非空”，
       与 apply.test 既有的封面用例（"无 hero 信号则不可见"）一致。此处显式插入
       hero 节点以构造真实的空会话前提，而不是依赖“无 data-phase = 空”的误设。 */
    document.body.insertAdjacentHTML('beforeend', "<div data-phase='hero'></div>")
    const { ctx, dispose } = fakeCtx()
    apply(ctx as never)
    expect(document.body.dataset.wukongEmpty).toBe('')
    expect(document.querySelector('[data-skin-owner="wukong"] img[data-active]')).not.toBeNull()

    document.body.insertAdjacentHTML('beforeend',
      '<div data-chat-flow><div data-tool data-state="running"></div></div>')
    await new Promise(r => setTimeout(r, 50))
    /* hero 节点仍在 DOM 中——空会话判定与状态机判定相互独立，舞台照样随
       真实状态换姿势。 */
    expect(document.body.dataset.wukongState).toBe('battle')
    const active = document.querySelector('[data-skin-owner="wukong"] img[data-active]') as HTMLImageElement
    expect(active.src).toBe(WK_POSE_EXECUTION)

    document.querySelector('[data-phase]')!.setAttribute('data-phase', 'active')
    await new Promise(r => setTimeout(r, 50))
    expect(document.body.dataset.wukongEmpty).toBeUndefined()

    dispose()
    expect(document.body.dataset.wukongEmpty).toBeUndefined()
  })

  it('dispose 时移除 data-wukong-empty（即使空会话态仍在）', () => {
    document.body.insertAdjacentHTML('beforeend', "<div data-phase='hero'></div>")
    const { ctx, dispose } = fakeCtx()
    apply(ctx as never)
    expect(document.body.dataset.wukongEmpty).toBe('')
    dispose()
    expect(document.body.dataset.wukongEmpty).toBeUndefined()
  })

  it('场景背景随状态换光照，dispose 还原内联背景', async () => {
    document.body.style.setProperty('background-image', 'none')  // 模拟产品原有内联值
    const { ctx, dispose } = fakeCtx()
    apply(ctx as never)
    expect(document.body.style.getPropertyValue('background-image')).toContain('data:image/webp')
    const dialogueBg = document.body.style.getPropertyValue('background-image')
    document.body.insertAdjacentHTML('beforeend',
      '<div data-chat-flow><div data-tool data-state="running"></div></div>')
    await new Promise(r => setTimeout(r, 50))
    const battleBg = document.body.style.getPropertyValue('background-image')
    expect(battleBg).not.toBe(dialogueBg)
    expect(document.body.dataset.wukongState).toBe('battle')
    dispose()
    expect(document.body.style.getPropertyValue('background-image')).toBe('none')
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

  it('其他皮肤的 data-skin-owner 节点增删不驱动状态机', async () => {
    const { ctx, dispose } = fakeCtx()
    apply(ctx as never)
    const alien = document.createElement('div')
    alien.dataset.skinOwner = 'someothersk'
    alien.innerHTML = '<div data-tool data-state="running"></div>'
    document.body.append(alien)
    await new Promise(r => setTimeout(r, 50))
    // alien 子树不在 [data-chat-flow] 里，本就不该驱动；断言的是"没有因节点增删而 sync 出 battle"
    expect(document.body.dataset.wukongState).toBe('dialogue')
    alien.remove()
    dispose()
  })

  it('dispose 后 body 无任何皮肤节点，轮询停止', async () => {
    // 自包含：只在本用例内切到 fake timers 并在结束前切回 real timers，
    // 不影响本文件其它用例里既有的 `await new Promise(r => setTimeout(r, 50))`
    // 微任务等待（那些用例运行时 fake timers 并未激活）。
    vi.useFakeTimers()
    const { ctx, dispose } = fakeCtx()
    apply(ctx as never)
    dispose()
    expect(document.body.querySelectorAll('[data-skin-owner]')).toHaveLength(0)
    const title = document.title
    vi.advanceTimersByTime(5000)  // poll 若未清会继续跑（不可观察副作用，但不应抛错）
    expect(document.title).toBe(title)
    vi.useRealTimers()
  })
})
