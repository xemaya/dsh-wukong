/**
 * DSH // 天命 — 状态合同。唯一允许读产品 DOM 的模块。
 *
 * 五态全部来自产品真实 DOM 证据（与 dsh-afterglow 验证过的稳定契约一致）：
 *   [data-question-key] / [data-plan-review-key] / [data-approval-key] → 岔路
 *   [data-chat-flow] 内 data-state='running' 或 > [role='status']      → 降妖
 *   [data-tool][data-state='error'] 新增（非历史基线）                  → 受创
 *   战斗自然结束且真实 todo 全部 completed                              → 功成
 * 不伪造任何进度。
 */
export type SkinState = 'dialogue' | 'choice' | 'battle' | 'alert' | 'clear'

export const STATE_LABELS: Record<SkinState, string> = {
  dialogue: '问道',
  choice: '岔路',
  battle: '降妖',
  alert: '受创',
  clear: '功成',
}

export const CHOICE_SELECTOR = '[data-question-key], [data-plan-review-key], [data-approval-key]'
export const RUNNING_SELECTOR = "[data-chat-flow] [data-state='running'], [data-chat-flow] > [role='status']"
export const ERROR_SELECTOR = "[data-chat-flow] [data-tool][data-state='error']"
const TODO_ITEM_SELECTOR = "[data-testid='todo-panel'] li[data-status]"

export interface ContractEngine {
  sync(): void
  dispose(): void
}

export function createContractEngine(
  root: ParentNode,
  onState: (state: SkinState) => void,
  { alertMs = 4000, clearMs = 1200 }: { alertMs?: number; clearMs?: number } = {},
): ContractEngine {
  let steady: SkinState = 'dialogue'
  let transient: SkinState | undefined
  let rendered: SkinState | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let disposed = false

  /* 历史错误基线：会话（重）加载时已存在的错误行不是新闻。 */
  const seenErrors = new WeakSet<Element>()
  let errorsBaselined = false

  const render = (): void => {
    const state = transient ?? steady
    if (state === rendered || disposed) return
    rendered = state
    onState(state)
  }

  const setTransient = (state: SkinState, ms: number): void => {
    transient = state
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => {
      transient = undefined
      timer = undefined
      render()
    }, ms)
    render()
  }

  /* 功成是挣来的：只有真实 todo 计划全部 completed 才算目标达成。 */
  const goalCleared = (): boolean => {
    const items = root.querySelectorAll(TODO_ITEM_SELECTOR)
    if (items.length === 0) return false
    return [...items].every(item => item.getAttribute('data-status') === 'completed')
  }

  const sync = (): void => {
    if (disposed) return
    const executing = root.querySelector(RUNNING_SELECTOR) !== null
    let hadNewError = false
    for (const row of root.querySelectorAll(ERROR_SELECTOR)) {
      if (seenErrors.has(row)) continue
      seenErrors.add(row)
      if (errorsBaselined && (steady === 'battle' || executing)) hadNewError = true
    }
    errorsBaselined = true

    let next: SkinState = 'dialogue'
    if (root.querySelector(CHOICE_SELECTOR) !== null) next = 'choice'
    else if (executing) next = 'battle'

    if (hadNewError) {
      setTransient('alert', alertMs)
    } else if (steady === 'battle' && next === 'dialogue' && transient === undefined && goalCleared()) {
      setTransient('clear', clearMs)
    }
    steady = next

    /* 岔路是用户阻塞态，优先呈现——取消任何挂起的临时状态 */
    if (next === 'choice' && transient !== undefined) {
      if (timer !== undefined) clearTimeout(timer)
      transient = undefined
      timer = undefined
    }

    render()
  }

  return {
    sync,
    dispose(): void {
      disposed = true
      if (timer !== undefined) clearTimeout(timer)
    },
  }
}
