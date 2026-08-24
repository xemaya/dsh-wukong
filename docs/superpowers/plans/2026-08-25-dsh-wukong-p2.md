# dsh-wukong P2 招式 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 棍势连击 HUD、岔路签文选择、披挂/棍势三式装备条、章回 todo 与影神图 trajectory——黑神话专属交互全部落地。

**Architecture:** 延续既有架构：`contract.ts` 新增战斗遥测纯函数（唯一读产品 DOM），新模块 `hud.ts`/`loadout.ts` 只消费遥测与状态；岔路与章回/影神图走纯 CSS（不建 JS 模块）。所有产品选择器来自 afterglow 已验证契约与 dsh-upstream 源码勘察（见下），不发明选择器。交互红线不变：皮肤节点不做真实提交入口，披挂条点击只转发原生触发器。

**Tech Stack:** 同 P1。

**Spec:** `docs/superpowers/specs/2026-08-24-dsh-wukong-skin-design.md`（§3 全部机制映射、§5 红线、§7 P2）

## Global Constraints

- 沿用 P0/P1 全部硬约束（作用域、诚实状态、disposer、observer 过滤、暗色唯一、`--wk-*` token、reduced-motion、尾注）。
- **已验证产品选择器合同**（controller 勘察，逐字使用，不得发明新产品选择器）：
  - 工具行：`[data-chat-flow] [data-tool][data-state]`；用户行：`[data-chat-flow] [class*='_userRow']`；工具名 = `data-tool` 属性值（'true'/'false'/空视为无名）。
  - 模型槽：`[data-slot='conversation.input.model']`，原生触发器 `button[class*='_trigger']`（其内）。
  - composer 座：`[data-composer-seat]`（座内 append，绝不插在 React 兄弟节点之间——livelock 前科）。
  - 选择接管：`[data-question-key]`/`[data-plan-review-key]`/`[data-approval-key]`（已在 contract.ts）。
  - todo：`[data-testid='todo-panel'] li[data-status]`。
  - trajectory：`[data-trajectory-scroll]`、`[data-timeline-span='tool'|'user'|'message'|'subtool'|'context']`、`[data-kind='tool'|'subtool']`（dsh-upstream ui-trajectory 源码勘察）。
- 棍势珠是真实证据：珠数 = 当前回合（最后一条用户行之后）最后一个 error 行之后的 `ok` 工具行数，上限 4；无权威分母不显示百分比。
- 披挂/棍势条只做显示 + 点击转发原生触发器 click()；不克隆菜单（afterglow 的完整装备舱按 YAGNI 砍掉）。
- 棍势三式映射：effort 文本含 low→戳棍势、medium→立棍势、high→劈棍势，其他显示原文。
- 工作分支 `p2-moves`（自 main 分叉）。

---

### Task 1: contract.ts 战斗遥测（TDD）

**Files:**
- Modify: `src/client/contract.ts`
- Test: `src/client/contract.test.ts` 追加

**Interfaces:**
- Produces:

```ts
export const TOOL_ROW_SELECTOR = "[data-chat-flow] [data-tool][data-state]"
export const USER_ROW_SELECTOR = "[data-chat-flow] [class*='_userRow']"
export interface BattleTelemetry { currentTool?: string; beads: number }
export function readBattleTelemetry(root: ParentNode): BattleTelemetry
```

- [ ] **Step 1: 写失败测试**

`contract.test.ts` 追加（用既有 flow/root 辅助；新建独立 describe）：

```ts
import { readBattleTelemetry } from './contract.ts'

const tool = (state: string, name = 'Bash'): string => `<div data-tool="${name}" data-state="${state}"></div>`
const userRow = '<div class="x_userRow_x"></div>'

describe('readBattleTelemetry', () => {
  let root: HTMLElement
  beforeEach(() => { root = document.createElement('div'); document.body.append(root) })
  afterEach(() => root.remove())

  it('空流 → 0 珠无当前招式', () => {
    root.innerHTML = flow('')
    expect(readBattleTelemetry(root)).toEqual({ currentTool: undefined, beads: 0 })
  })

  it('当前回合 ok 行积珠，上限 4', () => {
    root.innerHTML = flow(userRow + tool('ok') + tool('ok') + tool('ok') + tool('ok') + tool('ok') + tool('running', 'Edit'))
    expect(readBattleTelemetry(root)).toEqual({ currentTool: 'Edit', beads: 4 })
  })

  it('error 清零：只数最后一个 error 之后的 ok', () => {
    root.innerHTML = flow(userRow + tool('ok') + tool('error') + tool('ok') + tool('ok'))
    expect(readBattleTelemetry(root).beads).toBe(2)
  })

  it('上一回合的行不计入：只数最后用户行之后', () => {
    root.innerHTML = flow(tool('ok') + tool('ok') + userRow + tool('ok'))
    expect(readBattleTelemetry(root).beads).toBe(1)
  })

  it('data-tool 为 true/false/空时无招式名', () => {
    root.innerHTML = flow(userRow + '<div data-tool data-state="running"></div>')
    expect(readBattleTelemetry(root).currentTool).toBeUndefined()
  })
})
```

- [ ] **Step 2: 跑测试确认失败** — `pnpm test`

- [ ] **Step 3: 实现**

`contract.ts` 追加：

```ts
export const TOOL_ROW_SELECTOR = "[data-chat-flow] [data-tool][data-state]"
export const USER_ROW_SELECTOR = "[data-chat-flow] [class*='_userRow']"

export interface BattleTelemetry {
  currentTool?: string
  beads: number
}

function toolName(row: Element): string | undefined {
  const raw = row.getAttribute('data-tool')?.trim()
  if (raw === undefined || raw === '' || raw === 'true' || raw === 'false') return undefined
  return raw
}

/* 棍势是挣来的：当前回合（最后用户行之后）最后一次失误后的连续战果，上限四颗。 */
export function readBattleTelemetry(root: ParentNode): BattleTelemetry {
  const rows = [...root.querySelectorAll(TOOL_ROW_SELECTOR)]
  const users = root.querySelectorAll(USER_ROW_SELECTOR)
  const lastUser = users[users.length - 1]
  const turnRows = lastUser === undefined ? rows : rows.filter(row => (
    (lastUser.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
  ))
  let beads = 0
  for (const row of turnRows) {
    const state = row.getAttribute('data-state')
    if (state === 'error') beads = 0
    else if (state === 'ok') beads += 1
  }
  const running = [...turnRows].reverse().find(row => row.getAttribute('data-state') === 'running')
  return {
    currentTool: running === undefined ? undefined : toolName(running),
    beads: Math.min(beads, 4),
  }
}
```

- [ ] **Step 4: 测试通过 + 构建** — `pnpm test && pnpm build`
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: 棍势遥测——当前回合连击/招式名纯函数"`

---

### Task 2: hud.ts 棍势连击 HUD（TDD）

**Files:**
- Create: `src/client/hud.ts`
- Modify: `src/client/index.ts`（挂载 + 每次 sync 后刷新）
- Modify: `src/client/wukong.module.css`
- Test: `src/client/hud.test.ts`

**Interfaces:**
- Consumes: `readBattleTelemetry`/`BattleTelemetry`/`STATE_LABELS`（Task 1 + 既有）。
- Produces: `createHud(): BattleHud`，`interface BattleHud { hud: HTMLDivElement; sync(state: SkinState, t: BattleTelemetry): void }`。可见性由 CSS 按 `body[data-wukong-state]` 控制（battle/alert 显示）。

- [ ] **Step 1: 写失败测试**

`src/client/hud.test.ts`：

```ts
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
})
```

- [ ] **Step 2: 跑测试确认失败** — `pnpm test`

- [ ] **Step 3: 实现 hud.ts**

```ts
/**
 * DSH // 天命 — 棍势连击 HUD。降妖/受创时顶部显示当前招式与棍势珠。
 * 珠数与招式名全部来自 readBattleTelemetry 的真实 DOM 证据。
 * 可见性由 CSS 按 body[data-wukong-state] 控制，本模块只管内容。
 */
import type { BattleTelemetry, SkinState } from './contract.ts'
import { STATE_LABELS } from './contract.ts'
import styles from './wukong.module.css'

export interface BattleHud {
  hud: HTMLDivElement
  sync(state: SkinState, t: BattleTelemetry): void
}

export function createHud(): BattleHud {
  const hud = document.createElement('div')
  hud.dataset.skinOwner = 'wukong'
  hud.setAttribute('aria-hidden', 'true')
  hud.className = styles.hud

  const label = document.createElement('span')
  label.dataset.wkHudLabel = ''
  const beads = document.createElement('span')
  beads.className = styles.hudBeads
  for (let i = 0; i < 4; i += 1) {
    const bead = document.createElement('i')
    bead.dataset.wkBead = ''
    beads.append(bead)
  }
  hud.append(label, beads)
  const beadNodes = [...beads.children] as HTMLElement[]

  return {
    hud,
    sync(state: SkinState, t: BattleTelemetry): void {
      const name = t.currentTool === undefined ? '' : ` // ${t.currentTool.toUpperCase().slice(0, 18)}`
      const text = state === 'alert' ? STATE_LABELS.alert : `${STATE_LABELS.battle}${name}`
      if (label.textContent !== text) label.textContent = text
      beadNodes.forEach((bead, index) => {
        const lit = index < t.beads
        if (lit) bead.dataset.lit = ''
        else delete bead.dataset.lit
      })
    },
  }
}
```

CSS 追加：

```css
/* ===== 棍势 HUD（P2）：仅降妖/受创可见 ===== */
.hud {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  display: none;
  align-items: center;
  gap: 10px;
  padding: 7px 14px;
  border: 1px solid var(--wk-line);
  border-radius: 999px;
  background: rgba(13, 11, 9, 0.82);
  backdrop-filter: blur(10px);
  color: var(--wk-gold2);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  pointer-events: none;
}
:global(body[data-dsh-wukong][data-wukong-state='battle']) .hud,
:global(body[data-dsh-wukong][data-wukong-state='alert']) .hud {
  display: inline-flex;
}
:global(body[data-dsh-wukong][data-wukong-state='alert']) .hud {
  color: var(--wk-red);
  border-color: rgba(173, 62, 51, 0.35);
}
.hudBeads {
  display: inline-flex;
  gap: 5px;
}
.hudBeads i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid var(--wk-bronze);
  background: transparent;
  transform: rotate(45deg);
  border-radius: 2px;
}
.hudBeads i[data-lit] {
  background: var(--wk-gold2);
  border-color: var(--wk-gold2);
  box-shadow: 0 0 6px rgba(224, 177, 103, 0.55);
}
```

- [ ] **Step 4: index.ts 接线**

```ts
// import 追加：
import { createHud } from './hud.ts'
import { readBattleTelemetry } from './contract.ts'

// apply() 内（stage 创建旁）：
const { hud, sync: syncHud } = createHud()
ownedNodes.add(hud)
body.append(hud)
const refreshHud = (): void => {
  syncHud((body.dataset.wukongState ?? 'dialogue') as SkinState, readBattleTelemetry(body))
}

// onState 内（syncBackdrop() 之后）追加：refreshHud()
// MutationObserver 回调里 `if (relevant) { engine.sync(); syncCover() }` 处追加 refreshHud()
//   （工具行 data-state 翻转即使不改变皮肤状态也要刷新珠数）
// 初始化 engine.sync() 后追加 refreshHud()
```

- [ ] **Step 5: 测试 + 构建 + Commit** — `pnpm test && pnpm build`；`git commit -m "feat: 棍势连击 HUD——真实工具链珠数与当前招式"`

---

### Task 3: 岔路签文（纯 CSS）

**Files:**
- Modify: `src/client/wukong.module.css`

无 JS、无克隆：给原生 question/plan-review/approval 容器加签文卡质感 + CSS 计数器编号 + 键盘焦点强化；岔路态场景退暗。全部 `:global(body[data-dsh-wukong])` 作用域。

- [ ] **Step 1: 写 CSS**

```css
/* ===== 岔路签文（P2）：只描皮，不动交互 ===== */
:global(body[data-dsh-wukong][data-wukong-state='choice']) :global([data-chat-flow]) {
  opacity: 0.55;
  transition: opacity 0.25s ease;
}
:global(body[data-dsh-wukong]) :global([data-question-key]),
:global(body[data-dsh-wukong]) :global([data-plan-review-key]),
:global(body[data-dsh-wukong]) :global([data-approval-key]) {
  border: 1px solid rgba(211, 164, 91, 0.35);
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(38, 29, 19, 0.5), rgba(17, 14, 11, 0.85));
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  counter-reset: wk-route;
}
:global(body[data-dsh-wukong]) :global([data-question-key]) button,
:global(body[data-dsh-wukong]) :global([data-plan-review-key]) button,
:global(body[data-dsh-wukong]) :global([data-approval-key]) button {
  position: relative;
  border-color: rgba(211, 164, 91, 0.28);
}
:global(body[data-dsh-wukong]) :global([data-question-key]) button:focus-visible,
:global(body[data-dsh-wukong]) :global([data-plan-review-key]) button:focus-visible,
:global(body[data-dsh-wukong]) :global([data-approval-key]) button:focus-visible {
  outline: 2px solid var(--wk-gold2);
  outline-offset: 2px;
}
```

（刻意不做 ::before 编号：产品选项按钮的内部布局未知，伪元素编号可能与原生文案重叠——待 playtest 观察原生按钮结构后，编号作为 Task 6 的可选微调。此决定写入报告。）

- [ ] **Step 2: 构建 + 回归 + Commit** — `pnpm test && pnpm build`；`git commit -m "feat: 岔路签文——choice 态退暗与签文卡质感（纯 CSS）"`

---

### Task 4: loadout.ts 披挂/棍势三式

**Files:**
- Create: `src/client/loadout.ts`
- Modify: `src/client/index.ts`（座位挂载 + 轮询 + 重挂）
- Modify: `src/client/wukong.module.css`
- Test: `src/client/loadout.test.ts`

**Interfaces:**
- Consumes: 模型槽合同（Global Constraints）。
- Produces: `createLoadout(): Loadout`，`interface Loadout { chip: HTMLButtonElement; sync(): void }`。chip 文本从原生触发器读出；点击转发原生触发器。

- [ ] **Step 1: 写失败测试**

`src/client/loadout.test.ts`：

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLoadout, stanceFor } from './loadout.ts'

describe('stanceFor', () => {
  it('三式映射', () => {
    expect(stanceFor('low')).toBe('戳棍势')
    expect(stanceFor('Medium')).toBe('立棍势')
    expect(stanceFor('HIGH')).toBe('劈棍势')
    expect(stanceFor('ultra')).toBe('ultra')
  })
})

describe('createLoadout', () => {
  afterEach(() => { document.body.innerHTML = '' })

  const mountSlot = (title: string): void => {
    document.body.innerHTML = `<div data-slot="conversation.input.model">
      <button class="x_trigger_x">${title}</button></div>`
  }

  it('sync 从原生触发器读出模型与棍势', () => {
    mountSlot('DeepSeek R1 · high')
    const { chip, sync } = createLoadout()
    sync()
    expect(chip.textContent).toContain('DeepSeek R1')
    expect(chip.textContent).toContain('劈棍势')
  })

  it('点击转发原生触发器', () => {
    mountSlot('M · low')
    const { chip, sync } = createLoadout()
    sync()
    const trigger = document.querySelector<HTMLButtonElement>("[data-slot='conversation.input.model'] button")!
    const spy = vi.fn()
    trigger.addEventListener('click', spy)
    chip.click()
    expect(spy).toHaveBeenCalledOnce()
  })

  it('无触发器时 chip 显示占位不抛错', () => {
    const { chip, sync } = createLoadout()
    sync()
    expect(chip.textContent).toContain('—')
  })
})
```

- [ ] **Step 2: 跑测试确认失败** — `pnpm test`

- [ ] **Step 3: 实现 loadout.ts**

```ts
/**
 * DSH // 天命 — 披挂条。显示当前模型（披挂）与 reasoning effort（棍势三式），
 * 数据从产品原生模型触发器读出；点击只转发原生触发器 click()。
 * 不克隆菜单，不做任何真实提交入口。
 */
import styles from './wukong.module.css'

const MODEL_SLOT_SELECTOR = "[data-slot='conversation.input.model']"
const TRIGGER_SELECTOR = `${MODEL_SLOT_SELECTOR} button[class*='_trigger'], ${MODEL_SLOT_SELECTOR} button`

export function stanceFor(effort: string): string {
  if (/low/i.test(effort)) return '戳棍势'
  if (/medium/i.test(effort)) return '立棍势'
  if (/high/i.test(effort)) return '劈棍势'
  return effort
}

export interface Loadout {
  chip: HTMLButtonElement
  sync(): void
}

export function createLoadout(): Loadout {
  const chip = document.createElement('button')
  chip.type = 'button'
  chip.dataset.skinOwner = 'wukong'
  chip.className = styles.loadoutChip
  chip.setAttribute('aria-label', '披挂：打开模型选择')
  chip.addEventListener('click', () => {
    document.querySelector<HTMLButtonElement>(TRIGGER_SELECTOR)?.click()
  })

  return {
    chip,
    sync(): void {
      const trigger = document.querySelector<HTMLButtonElement>(TRIGGER_SELECTOR)
      const raw = trigger?.textContent?.trim() ?? ''
      let text = '披挂 —'
      if (raw !== '') {
        const [model, effort] = raw.split(/\s*[·•|]\s*/, 2)
        text = effort === undefined
          ? `披挂 ${model}`
          : `披挂 ${model} · ${stanceFor(effort)}`
      }
      if (chip.textContent !== text) chip.textContent = text
    },
  }
}
```

CSS 追加：

```css
/* ===== 披挂条（P2）===== */
.loadoutChip {
  height: 26px;
  border: 1px solid var(--wk-line);
  border-radius: 7px;
  background: var(--wk-ink);
  color: var(--wk-text2);
  font-size: 10px;
  padding: 0 9px;
  cursor: pointer;
}
.loadoutChip:hover {
  border-color: rgba(211, 164, 91, 0.4);
  color: var(--wk-gold2);
}
```

- [ ] **Step 4: index.ts 接线（座位模式 + 轮询）**

```ts
// import：
import { createLoadout } from './loadout.ts'

const COMPOSER_SEAT_SELECTOR = '[data-composer-seat]'

// apply() 内：
const { chip: loadoutChip, sync: syncLoadout } = createLoadout()
ownedNodes.add(loadoutChip)
/* 座内 append，绝不插在 React 兄弟之间；React 重渲染掉座位时重挂。 */
const seatLoadout = (): void => {
  const seat = document.querySelector<HTMLElement>(COMPOSER_SEAT_SELECTOR)
  if (seat === null) { loadoutChip.remove(); return }
  if (loadoutChip.parentElement !== seat) seat.append(loadoutChip)
  syncLoadout()
}
// MutationObserver 回调：structureChanged 概念——在 childList 且非 skin-owned 的 relevant 分支追加 seatLoadout()
//  （当前实现 relevant 不区分来源，直接在 `if (relevant)` 块里调用 seatLoadout() 即可）
// 初始化处：seatLoadout()
// 触发器标题无可观察钩子（afterglow 同款问题）：慢轮询兜底
const loadoutPoll = setInterval(syncLoadout, 1500)
ctx.effect(() => () => clearInterval(loadoutPoll), 'ui-skin-wukong: loadout poll')
```

- [ ] **Step 5: 测试 + 构建 + Commit** — `pnpm test && pnpm build`；`git commit -m "feat: 披挂条——模型/棍势三式显示与原生转发"`

---

### Task 5: 章回 todo 与影神图 trajectory（纯 CSS）

**Files:**
- Modify: `src/client/wukong.module.css`

- [ ] **Step 1: 写 CSS**

```css
/* ===== 章回（P2）：真实 todo 才有回目 ===== */
:global(body[data-dsh-wukong]) :global([data-testid='todo-panel'] ul) {
  counter-reset: wk-chapter;
}
:global(body[data-dsh-wukong]) :global([data-testid='todo-panel'] li[data-status]) {
  position: relative;
  counter-increment: wk-chapter;
}
:global(body[data-dsh-wukong]) :global([data-testid='todo-panel'] li[data-status])::before {
  content: '第' counter(wk-chapter, cjk-ideographic) '回';
  margin-right: 6px;
  font-size: 9px;
  color: var(--wk-bronze);
  font-weight: 700;
}
:global(body[data-dsh-wukong]) :global([data-testid='todo-panel'] li[data-status='in-progress'])::before {
  color: var(--wk-ember);
}
:global(body[data-dsh-wukong]) :global([data-testid='todo-panel'] li[data-status='completed'])::before {
  color: var(--wk-jade);
}

/* ===== 影神图（P2）：trajectory 卷轴纸纹与行分级 ===== */
:global(body[data-dsh-wukong]) :global([data-trajectory-scroll]) {
  background:
    radial-gradient(circle at 18% 8%, rgba(116, 76, 40, 0.08), transparent 40%),
    linear-gradient(180deg, rgba(13, 11, 9, 0.9), rgba(8, 7, 6, 0.95));
}
:global(body[data-dsh-wukong]) :global([data-timeline-span='user']) {
  border-left: 2px solid var(--wk-gold);
}
:global(body[data-dsh-wukong]) :global([data-timeline-span='tool']) {
  border-left: 2px solid var(--wk-bronze);
}
:global(body[data-dsh-wukong]) :global([data-timeline-span='subtool']) {
  border-left: 2px solid rgba(127, 91, 53, 0.4);
}
:global(body[data-dsh-wukong]) :global([data-error='true']) {
  border-left-color: var(--wk-red);
}
```

（::before 编号如与产品 todo 项内部布局冲突——li 内是 flex 时前缀可能换行——用 playtest 观察，Task 6 允许微调为 `position:absolute` 方案。）

- [ ] **Step 2: 构建 + 回归 + Commit** — `pnpm test && pnpm build`；`git commit -m "feat: 章回 todo 与影神图 trajectory（纯 CSS）"`

---

### Task 6: 真机 playtest 与截图

**Files:**
- Update: `screenshots/`、`README.md`

- [ ] **Step 1: 重装**（bundle 变更需重启 `dsh --profile web` 进程——P1 发现记录）

```bash
pnpm build
dsh plugin --profile web remove @dsh-external/dsh-wukong || true
dsh plugin --profile web add -w /Users/huanghaibin/Workspace/deepseek/dsh-wukong
# 重启 dsh web 进程后再验
```

- [ ] **Step 2: 走查（Playwright MCP，每项证据）**

1. 发起多工具任务：HUD 出现、招式名实时变化、棍势珠随 ok 行累积 → `shot-hud.png`；若任务含失败行，珠清零可见（不能刻意制造失败则记录未覆盖）。
2. 触发一次 ask_user_question（给 agent 出一个必然要问的任务，如"问我要一个颜色再继续"）：岔路退暗 + 签文卡质感 + 键盘 Tab 焦点环 + 原生点击提交仍可用 → `shot-choice.png`。
3. 披挂条显示当前模型/棍势；点击打开原生模型菜单；用原生菜单换 effort 后 1.5s 内文本刷新 → `shot-loadout.png`。
4. 让 agent 建 todo 计划：回目编号"第一回…"与灯色随状态变化 → `shot-chapters.png`。
5. Trajectory 页：影神图纸纹与行分级左边线 → `shot-trajectory.png`。
6. 全量回归：P1 六项快速复走（立绘/背景/转场/封面/响应式/卸载还原）。

琐碎 CSS 修复在-scope（修后重建重启重验）；编号 ::before 与产品布局冲突时按任务 3/5 预案微调。

- [ ] **Step 3: README 更新（P2 状态+新截图）+ Commit**

---

## Self-Review 记录

- **Spec §3 覆盖**：棍势连击条（T1+T2）、棍势三式=effort（T4）、披挂=模型（T4）、章回=todo（T5）、影神图=trajectory（T5）、岔路（T3）。定身术=Stop 与一次性命中/碎甲 VFX 属 P3。水墨转场已在 P1。
- **红线自查**：无克隆提交入口（披挂条只转发原生 click；岔路纯 CSS）；珠数无假分母；HUD 只在 battle/alert 显示。
- **占位符扫描**：无。
- **类型一致性**：`BattleTelemetry`/`readBattleTelemetry`/`createHud(sync(state,t))`/`createLoadout(sync())`/`stanceFor` 各任务一致。
