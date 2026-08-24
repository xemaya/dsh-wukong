import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createContractEngine, isEmptySession, STATE_LABELS, type SkinState } from './contract.ts'

const flow = (inner: string): string => `<div data-chat-flow>${inner}</div>`
const runningTool = '<div data-tool data-state="running"></div>'
const errorTool = '<div data-tool data-state="error"></div>'

describe('createContractEngine', () => {
  let root: HTMLElement
  let states: SkinState[]
  let engine: ReturnType<typeof createContractEngine>

  const mount = (html: string): void => {
    root.innerHTML = html
    states = []
    engine = createContractEngine(root, s => states.push(s), { alertMs: 100, clearMs: 50 })
    engine.sync()
  }

  beforeEach(() => {
    vi.useFakeTimers()
    root = document.createElement('div')
    document.body.append(root)
  })
  afterEach(() => {
    engine.dispose()
    root.remove()
    vi.useRealTimers()
  })

  it('空会话 → 问道', () => {
    mount(flow(''))
    expect(states).toEqual(['dialogue'])
  })

  it('question 接管 → 岔路，且优先于执行中的工具', () => {
    mount(flow(runningTool) + '<div data-question-key="q1"></div>')
    expect(states.at(-1)).toBe('choice')
  })

  it('running 工具行 → 降妖；回合状态行同样算执行', () => {
    mount(flow(runningTool))
    expect(states.at(-1)).toBe('battle')
    mount(flow('<div role="status"></div>'))
    expect(states.at(-1)).toBe('battle')
  })

  it('加载时已存在的错误行是历史，不触发受创', () => {
    mount(flow(errorTool + runningTool))
    expect(states).not.toContain('alert')
  })

  it('执行中新增错误行 → 受创一次，超时后回到证据态', () => {
    mount(flow(runningTool))
    root.querySelector('[data-chat-flow]')!.insertAdjacentHTML('beforeend', errorTool)
    engine.sync()
    expect(states.at(-1)).toBe('alert')
    vi.advanceTimersByTime(100)
    expect(states.at(-1)).toBe('battle')
    // 同一错误行不重复触发
    engine.sync()
    expect(states.filter(s => s === 'alert')).toHaveLength(1)
  })

  it('alert 中出现 data-question-key → 立即为岔路（不等 alertMs）', () => {
    mount(flow(runningTool))
    root.querySelector('[data-chat-flow]')!.insertAdjacentHTML('beforeend', errorTool)
    engine.sync()
    expect(states.at(-1)).toBe('alert')
    // 在 alertMs 超时前插入 data-question-key
    root.insertAdjacentHTML('beforeend', '<div data-question-key="q1"></div>')
    engine.sync()
    // 应立即为 choice，无需等待 alert 超时
    expect(states.at(-1)).toBe('choice')
  })

  it('战斗结束且 todo 全部 completed → 功成，随后回问道', () => {
    mount(flow(runningTool) + `<div data-testid="todo-panel"><ul>
      <li data-status="completed"></li><li data-status="completed"></li></ul></div>`)
    root.querySelector('[data-tool]')!.setAttribute('data-state', 'ok')
    engine.sync()
    expect(states.at(-1)).toBe('clear')
    vi.advanceTimersByTime(50)
    expect(states.at(-1)).toBe('dialogue')
  })

  it('战斗结束但无 todo（或未全部完成）→ 直接回问道，不功成', () => {
    mount(flow(runningTool))
    root.querySelector('[data-tool]')!.setAttribute('data-state', 'ok')
    engine.sync()
    expect(states).not.toContain('clear')
    expect(states.at(-1)).toBe('dialogue')
  })

  it('dispose 后不再回调，定时器清理', () => {
    mount(flow(runningTool))
    root.querySelector('[data-chat-flow]')!.insertAdjacentHTML('beforeend', errorTool)
    engine.sync()
    const count = states.length
    engine.dispose()
    vi.advanceTimersByTime(1000)
    expect(states.length).toBe(count)
  })

  it('五态标签齐全', () => {
    expect(STATE_LABELS).toEqual({
      dialogue: '问道', choice: '岔路', battle: '降妖', alert: '受创', clear: '功成',
    })
  })
})

describe('isEmptySession', () => {
  let root: HTMLElement

  beforeEach(() => {
    root = document.createElement('div')
  })

  it('无 data-phase 节点 → false（未知即不展示封面）', () => {
    expect(isEmptySession(root)).toBe(false)
  })

  it("data-phase='active' 或 'settling' → false（会话有内容或尚在判定中）", () => {
    root.innerHTML = "<div data-phase='active'></div>"
    expect(isEmptySession(root)).toBe(false)
    root.innerHTML = "<div data-phase='settling'></div>"
    expect(isEmptySession(root)).toBe(false)
  })

  it("data-phase='hero' → true（产品自身的 New Session/空会话信号）", () => {
    root.innerHTML = "<div data-phase='hero'></div>"
    expect(isEmptySession(root)).toBe(true)
  })
})
