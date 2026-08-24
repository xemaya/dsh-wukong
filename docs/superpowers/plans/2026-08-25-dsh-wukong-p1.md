# dsh-wukong P1 化身 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 天命人五态立绘驻守角色轨道（四档响应式）、黑风山双光照场景替换渐变占位、水墨转场，并清掉 P0 终审随行项。

**Architecture:** 沿用 P0 架构：`contract.ts` 是唯一产品 DOM 读者，新模块 `stage.ts`（角色舞台）与 `vfx.ts`（一次性水墨转场）只消费 `onState` 回调的状态。资产经 cwebp 压缩为 webp 后走既有 embed 管线内嵌。响应式四档全部由 CSS media query 承担；胸像档用同一张主立绘的 CSS 裁切（object-fit/position），不做独立胸像文件（spec §6.3 将胸像列为后续资产，P1 用 CSS 裁切达标）。

**Tech Stack:** TypeScript + cordis + tsdown + lightningcss + vitest/happy-dom + cwebp（/opt/homebrew/bin/cwebp，已确认存在）。

**Spec:** `docs/superpowers/specs/2026-08-24-dsh-wukong-skin-design.md`（§3 水墨转场、§4.3 角色、§4.4 响应式、§7 P1）
**随行项清单:** `docs/superpowers/plans/2026-08-24-p1-followups.md`

## Global Constraints

- 沿用 P0 全部硬约束：`data-dsh-wukong`/`data-wukong-state` 作用域；诚实状态（不伪造）；disposer 完整还原；MutationObserver 过滤 `[data-skin-owner]`；暗色唯一；`--wk-*` token（新 CSS 不写裸色值，渐变/alpha 合成例外）。
- 新增节点一律 `data-skin-owner="wukong"` + `ownedNodes`；pointer-events 不拦截产品交互。
- 立绘/场景模块只消费 contract 状态，不读产品 DOM。
- `prefers-reduced-motion: reduce` 下：无转场动画、立绘切换仅瞬时换图（CSS transition 归零）。
- 资产只经 `tools/embed-assets.mjs` 内嵌；`assets-gen/` 只放压缩成品，`art-production/p0/` 原图不动。
- 工作分支 `p1-avatar`（自 main 分叉）；提交尾注（空行后）：

```
Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011k1Bi7BQgMWAofLXxLEpZq
```

**参考（只读）**：`/Users/huanghaibin/Workspace/deepseek/dsh-afterglow`（舞台/背景切换的已验证做法）。

---

### Task 1: 资产压缩与内嵌（webp 管线）

**Files:**
- Create: `tools/compress-assets.sh`
- Create: `assets-gen/pose-{dialogue,choice,execution,recovery,clear}.webp`, `assets-gen/bg-{dialogue,execution}.webp`, `assets-gen/cover.webp`（生成物）
- Delete: `assets-gen/cover-tianming.png`（被 cover.webp 取代，缩 bundle）
- Modify: `tools/embed-assets.mjs`（ASSETS 清单）
- Regenerate: `src/client/art.generated.ts`

**Interfaces:**
- Produces（Task 2/3 消费）: `art.generated.ts` 导出 `WK_POSE_DIALOGUE`, `WK_POSE_CHOICE`, `WK_POSE_EXECUTION`, `WK_POSE_RECOVERY`, `WK_POSE_CLEAR`, `WK_BG_DIALOGUE`, `WK_BG_EXECUTION`（均为 webp data URI），`WK_COVER` 改为 webp，`WK_ICON` 不变。

- [ ] **Step 1: 写压缩脚本并执行**

`tools/compress-assets.sh`：

```bash
#!/bin/sh
# art-production/p0 验收原图 → assets-gen webp（cwebp: 立绘含 alpha q82，场景 q80，封面 q84）
set -e
cd "$(dirname "$0")/.."
for p in dialogue choice execution recovery clear; do
  cwebp -q 82 -m 6 -alpha_q 90 "art-production/p0/tianming-$p-master.png" -o "assets-gen/pose-$p.webp"
done
cwebp -q 80 -m 6 art-production/p0/blackwind-dialogue-base.png -o assets-gen/bg-dialogue.webp
cwebp -q 80 -m 6 art-production/p0/blackwind-execution-base.png -o assets-gen/bg-execution.webp
cwebp -q 84 -m 6 assets-gen/cover-tianming.png -o assets-gen/cover.webp
ls -la assets-gen/*.webp
```

```bash
chmod +x tools/compress-assets.sh && ./tools/compress-assets.sh
```

验收：每个 pose ≤ 400KB、bg ≤ 600KB、cover ≤ 600KB（超出就降 q 重跑；q 低于 70 仍超标则报告）。

- [ ] **Step 2: 更新 embed 清单并重新生成**

`tools/embed-assets.mjs` 的 `ASSETS` 数组整体替换为：

```js
const ASSETS = [
  ['WK_COVER', 'cover.webp'],
  ['WK_ICON', 'icon.png'],
  ['WK_POSE_DIALOGUE', 'pose-dialogue.webp'],
  ['WK_POSE_CHOICE', 'pose-choice.webp'],
  ['WK_POSE_EXECUTION', 'pose-execution.webp'],
  ['WK_POSE_RECOVERY', 'pose-recovery.webp'],
  ['WK_POSE_CLEAR', 'pose-clear.webp'],
  ['WK_BG_DIALOGUE', 'bg-dialogue.webp'],
  ['WK_BG_EXECUTION', 'bg-execution.webp'],
]
```

```bash
rm assets-gen/cover-tianming.png
pnpm generate:assets
grep -c '^export' src/client/art.generated.ts   # 期望 9
pnpm test && pnpm build
ls -la lib/   # client.js 应明显小于之前的 3.2MB（cover png→webp）再加立绘后的净值，记录数字
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: P1 资产 webp 压缩内嵌（五态立绘+双光照场景+封面瘦身）"
```

---

### Task 2: 角色舞台 stage.ts（四档响应式）

**Files:**
- Create: `src/client/stage.ts`
- Modify: `src/client/index.ts`（挂载 + onState 接线 + `data-wukong-empty`）
- Modify: `src/client/wukong.module.css`（舞台样式 + 四档 media query + 安全区）
- Test: `src/client/stage.test.ts`，`src/client/apply.test.ts` 追加

**Interfaces:**
- Consumes: `WK_POSE_*`（Task 1）、`SkinState`/`STATE_LABELS`（contract.ts）、`isEmptySession`。
- Produces: `createStage(): CharacterStage`，`interface CharacterStage { stage: HTMLDivElement; setPose(state: SkinState): void }`；`body[data-wukong-empty]`（空会话时置位，Task 3/CSS 消费）。

- [ ] **Step 1: 写失败测试**

`src/client/stage.test.ts`：

```ts
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
```

`apply.test.ts` 追加：

```ts
it('舞台随状态换姿势；空会话时 body 有 data-wukong-empty', async () => {
  const { ctx, dispose } = fakeCtx()
  apply(ctx as never)
  expect(document.body.dataset.wukongEmpty).toBe('')          // 初始无 chat-flow = 空
  expect(document.querySelector('[data-skin-owner="wukong"] img[data-active]')).not.toBeNull()
  document.body.insertAdjacentHTML('beforeend',
    '<div data-phase="active"><div data-chat-flow><div data-tool data-state="running"></div></div></div>')
  await new Promise(r => setTimeout(r, 50))
  expect(document.body.dataset.wukongEmpty).toBeUndefined()
  dispose()
  expect(document.body.dataset.wukongEmpty).toBeUndefined()
})
```

（注意：现有 apply.test 的空会话判定基于 `[data-phase='hero']`，本用例的初始"空"成立是因为页面根本没有 data-phase 节点——与 contract.ts 现实现一致：无 hero 节点时看 chat-flow。写用例前先读 `contract.ts` 的 `isEmptySession` 实测语义，若与此处断言冲突，以 contract.ts 现实现为准调整断言并在报告说明。）

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm test   # stage.test FAIL: stage.ts 不存在
```

- [ ] **Step 3: 实现 stage.ts**

```ts
/**
 * DSH // 天命 — 角色舞台。天命人五态立绘驻守右侧固定轨道，
 * 双 <img> 层交叉淡入换姿势。纯呈现：只消费 contract 状态。
 * 响应式四档全部在 wukong.module.css 的 media query 里。
 */
import {
  WK_POSE_CHOICE,
  WK_POSE_CLEAR,
  WK_POSE_DIALOGUE,
  WK_POSE_EXECUTION,
  WK_POSE_RECOVERY,
} from './art.generated.ts'
import type { SkinState } from './contract.ts'
import styles from './wukong.module.css'

const POSES: Record<SkinState, string> = {
  dialogue: WK_POSE_DIALOGUE,
  choice: WK_POSE_CHOICE,
  battle: WK_POSE_EXECUTION,
  alert: WK_POSE_RECOVERY,
  clear: WK_POSE_CLEAR,
}

export interface CharacterStage {
  stage: HTMLDivElement
  setPose(state: SkinState): void
}

export function createStage(): CharacterStage {
  const stage = document.createElement('div')
  stage.dataset.skinOwner = 'wukong'
  stage.setAttribute('aria-hidden', 'true')
  stage.className = styles.stage

  const back = document.createElement('img')
  const front = document.createElement('img')
  for (const img of [back, front]) {
    img.alt = ''
    img.className = styles.stagePose
    img.decoding = 'async'
  }
  front.src = POSES.dialogue
  front.dataset.active = ''
  stage.append(back, front)

  let current: SkinState = 'dialogue'
  let layers = { front, back }

  return {
    stage,
    setPose(state: SkinState): void {
      if (state === current) return
      current = state
      layers.back.src = POSES[state]
      layers.back.dataset.active = ''
      delete layers.front.dataset.active
      layers = { front: layers.back, back: layers.front }
    },
  }
}
```

- [ ] **Step 4: CSS——舞台、四档、响应式安全区**

`wukong.module.css` 追加（module 局部类 + :global 组合）：

```css
/* ===== 角色舞台（P1）===== */
.stage {
  position: fixed;
  right: 0;
  bottom: 0;
  width: var(--wk-stage-w, 380px);
  height: min(86vh, 1100px);
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}
.stagePose {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: bottom center;
  opacity: 0;
  transition: opacity 0.35s ease;
  filter: drop-shadow(0 12px 30px rgba(0, 0, 0, 0.45));
}
.stagePose[data-active] {
  opacity: 1;
}

/* 空会话（土地庙封面）时封面即主视觉，舞台退场 */
:global(body[data-wukong-empty]) .stage {
  display: none;
}

/* 安全区：≥1024 时主内容给舞台让出轨道宽（选择器来自 afterglow 已验证面） */
@media (min-width: 1024px) {
  :global(body[data-dsh-wukong] [data-chat-flow]) {
    padding-right: calc(var(--wk-stage-w, 380px) * 0.72);
  }
}

/* 四档响应式 */
@media (min-width: 1440px) {
  :global(body[data-dsh-wukong]) { --wk-stage-w: 380px; }
}
@media (min-width: 1024px) and (max-width: 1439px) {
  :global(body[data-dsh-wukong]) { --wk-stage-w: 280px; }
  .stage { height: min(70vh, 820px); }
  .stagePose { object-fit: cover; object-position: top center; } /* 半身裁切 */
}
@media (min-width: 768px) and (max-width: 1023px) {
  :global(body[data-dsh-wukong]) { --wk-stage-w: 132px; }
  .stage {
    height: 132px;
    width: 132px;
    right: 10px;
    bottom: 96px;
    border-radius: 50%;
    border: 1px solid var(--wk-line);
    background: var(--wk-ink);
  }
  .stagePose { object-fit: cover; object-position: top center; } /* 胸像 */
}
@media (max-width: 767px) {
  :global(body[data-dsh-wukong]) { --wk-stage-w: 88px; }
  .stage {
    height: 88px;
    width: 88px;
    right: 8px;
    bottom: 88px;
    border-radius: 50%;
    border: 1px solid var(--wk-line);
    background: var(--wk-ink);
  }
  .stagePose { object-fit: cover; object-position: top center; } /* 名牌头像 */
}

@media (prefers-reduced-motion: reduce) {
  .stagePose { transition: none; }
}
```

- [ ] **Step 5: index.ts 接线**

在 `apply()` 内（`const engine = createContractEngine(...)` 之前）加导入与创建；`onState` 扩展；空态属性与 cover 同步维护：

```ts
// 顶部 import 区追加：
import { createStage } from './stage.ts'

// apply() 内，onState 定义处替换为：
const { stage, setPose } = createStage()
const onState = (state: SkinState): void => {
  body.dataset.wukongState = state
  setPose(state)
}

// 挂载（cover 挂载代码旁）：
ownedNodes.add(stage)
body.append(stage)

// syncCover 定义处替换为（同一处维护 cover 可见性与 body 空态属性）：
const syncCover = (): void => {
  const empty = isEmptySession(body)
  setVisible(empty)
  if (empty) body.dataset.wukongEmpty = ''
  else delete body.dataset.wukongEmpty
}

// disposer 里追加（delete body.dataset.wukongState 旁）：
delete body.dataset.wukongEmpty
```

（stage 节点在 ownedNodes 中，disposer 现有的 `ownedNodes.forEach(node => node.remove())` 已覆盖移除。）

- [ ] **Step 6: 测试与构建**

```bash
pnpm test && pnpm build
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: 天命人角色舞台——五态立绘四档响应式"
```

---

### Task 3: 黑风山双光照背景接入

**Files:**
- Modify: `src/client/index.ts`（syncBackdrop + disposer 还原）
- Modify: `src/client/wukong.module.css`（渐变降级为 fallback 注释说明）
- Test: `src/client/apply.test.ts` 追加

**Interfaces:**
- Consumes: `WK_BG_DIALOGUE` / `WK_BG_EXECUTION`（Task 1）、`body[data-wukong-state]`。
- Produces: body 内联 `background-image`（场景图）；CSS 渐变继续作为图片加载前/失败的底色。

- [ ] **Step 1: 写失败测试**

`apply.test.ts` 追加：

```ts
it('场景背景随状态换光照，dispose 还原内联背景', async () => {
  document.body.style.setProperty('background-image', 'none')  // 模拟产品原有内联值
  const { ctx, dispose } = fakeCtx()
  apply(ctx as never)
  expect(document.body.style.getPropertyValue('background-image')).toContain('data:image/webp')
  document.body.insertAdjacentHTML('beforeend',
    '<div data-chat-flow><div data-tool data-state="running"></div></div>')
  await new Promise(r => setTimeout(r, 50))
  const battleBg = document.body.style.getPropertyValue('background-image')
  expect(document.body.dataset.wukongState).toBe('battle')
  dispose()
  expect(document.body.style.getPropertyValue('background-image')).toBe('none')
})
```

（问道/降妖两张图的 data URI 不同——若要强断言可比较 apply 后与 battle 后的值不相等；happy-dom 对 style 属性是纯字符串存储，断言取值即可。）

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm test
```

- [ ] **Step 3: 实现 syncBackdrop**

`index.ts` 的 `apply()` 内（body.dataset 设置之后、observer 之前）：

```ts
// 顶部 import 追加：
import { WK_BG_DIALOGUE, WK_BG_EXECUTION } from './art.generated.ts'

// apply() 内：保存产品原内联背景值，供 disposer 还原
const previousBackground = new Map<string, string>()
for (const property of ['background-image', 'background-position', 'background-size', 'background-attachment', 'background-repeat']) {
  previousBackground.set(property, body.style.getPropertyValue(property))
}

/* 黑风山场景：问道=冷月版；降妖/受创=余烬版。CSS 渐变仍在图层下方兜底。 */
const syncBackdrop = (): void => {
  const state = body.dataset.wukongState
  const lit = state === 'battle' || state === 'alert'
  body.style.setProperty('background-image', `url(${lit ? WK_BG_EXECUTION : WK_BG_DIALOGUE})`)
}
body.style.setProperty('background-position', 'center center')
body.style.setProperty('background-size', 'cover')
body.style.setProperty('background-attachment', 'fixed')
body.style.setProperty('background-repeat', 'no-repeat')

// onState 内（setPose 之后）追加：
syncBackdrop()

// apply() 尾部初始化（engine.sync() 之前）显式调用一次：
syncBackdrop()

// disposer 追加：
for (const [property, value] of previousBackground) {
  body.style.setProperty(property, value)
}
```

`wukong.module.css` 中 `:global(body[data-dsh-wukong])` 的 `background` 声明上方加注释：`/* 渐变为场景图加载前/缺失时的兜底；运行时内联 background-image 覆盖其上 */`（渐变声明本身保留不动）。

- [ ] **Step 4: 测试与构建**

```bash
pnpm test && pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: 黑风山双光照场景背景（冷月/余烬随状态切换）"
```

---

### Task 4: 水墨转场 vfx.ts

**Files:**
- Create: `src/client/vfx.ts`
- Modify: `src/client/index.ts`（状态变化触发）
- Modify: `src/client/wukong.module.css`（inkWipe 样式与 keyframes）
- Test: `src/client/vfx.test.ts`

**Interfaces:**
- Consumes: 无资产依赖（纯 CSS 墨晕）。
- Produces: `createInkTransition(): InkTransition`，`interface InkTransition { play(): void; dispose(): void }`。

- [ ] **Step 1: 写失败测试**

`src/client/vfx.test.ts`：

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createInkTransition } from './vfx.ts'

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
```

（happy-dom 的 matchMedia('(prefers-reduced-motion: reduce)').matches 默认 false，测试按动画路径走。）

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm test
```

- [ ] **Step 3: 实现 vfx.ts 与样式**

```ts
/**
 * DSH // 天命 — 一次性特效。P1 仅水墨转场：状态切换时全屏墨晕擦过。
 * 反馈不是灯光秀：同一时刻至多一层，reduced-motion 下完全不播。
 */
import styles from './wukong.module.css'

export interface InkTransition {
  play(): void
  dispose(): void
}

const INK_MS = 620

export function createInkTransition(): InkTransition {
  let node: HTMLDivElement | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

  return {
    play(): void {
      if (reducedMotion.matches || node !== undefined) return
      node = document.createElement('div')
      node.dataset.skinOwner = 'wukong'
      node.setAttribute('aria-hidden', 'true')
      node.className = styles.inkWipe
      document.body.append(node)
      timer = setTimeout(() => {
        node?.remove()
        node = undefined
        timer = undefined
      }, INK_MS)
    },
    dispose(): void {
      if (timer !== undefined) clearTimeout(timer)
      node?.remove()
      node = undefined
    },
  }
}
```

`wukong.module.css` 追加：

```css
/* ===== 水墨转场（P1）：一次性，620ms 自移除 ===== */
.inkWipe {
  position: fixed;
  inset: 0;
  z-index: 60;
  pointer-events: none;
  background:
    radial-gradient(circle at 30% 45%, rgba(5, 4, 3, 0.9) 0%, rgba(5, 4, 3, 0.55) 34%, transparent 62%),
    radial-gradient(circle at 68% 58%, rgba(5, 4, 3, 0.8) 0%, transparent 55%);
  animation: wkInkWipe 0.62s ease-out forwards;
}
@keyframes wkInkWipe {
  0% { opacity: 0; transform: scale(0.6); }
  28% { opacity: 1; }
  100% { opacity: 0; transform: scale(1.6); }
}
@media (prefers-reduced-motion: reduce) {
  .inkWipe { display: none; }
}
```

- [ ] **Step 4: index.ts 接线**

```ts
// import 追加：
import { createInkTransition } from './vfx.ts'

// apply() 内（createStage 旁）：
const ink = createInkTransition()
ctx.effect(() => () => ink.dispose(), 'ui-skin-wukong: ink transition')

// onState 替换为（首次渲染不播转场——加载不是切换）：
let stateBaselined = false
const onState = (state: SkinState): void => {
  body.dataset.wukongState = state
  setPose(state)
  syncBackdrop()
  if (stateBaselined) ink.play()
  stateBaselined = true
}
```

- [ ] **Step 5: 测试与构建**

```bash
pnpm test && pnpm build
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: 水墨转场——状态切换一次性墨晕"
```

---

### Task 5: P0 终审随行项清扫

**Files:**
- Modify: `src/client/index.ts`、`src/client/contract.test.ts`、`src/client/cover.ts`、`src/client/cover.test.ts`、`src/client/wukong.module.css`、`tools/embed-assets.mjs`、`package.json`、`README.md`

对照 `docs/superpowers/plans/2026-08-24-p1-followups.md` 逐项（第 2/3/8 项是 P2 备忘不动，第 6 项 cover aria-hidden，第 1 项过滤对齐，第 4 项补测试，第 5 项文档卫生，第 7 项 token 纯度）：

- [ ] **Step 1: 过滤对齐（followup #1）+ 测试**

`index.ts` MutationObserver 回调里 childList 分支的 added/removed 判定，从"全部节点 `data-skin-owner === SKIN_OWNER`"放宽为"全部节点带任意 `data-skin-owner`"：

```ts
const skinOwned = nodes.every(node => (
  node instanceof Element && node.hasAttribute('data-skin-owner')
))
```

`apply.test.ts` 追加：

```ts
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
```

- [ ] **Step 2: goalCleared 部分完成测试（followup #4）**

`contract.test.ts` 追加：

```ts
it('todo 部分完成 → 战斗结束不功成', () => {
  mount(flow(runningTool) + `<div data-testid="todo-panel"><ul>
    <li data-status="completed"></li><li data-status="pending"></li></ul></div>`)
  root.querySelector('[data-tool]')!.setAttribute('data-state', 'ok')
  engine.sync()
  expect(states).not.toContain('clear')
  expect(states.at(-1)).toBe('dialogue')
})
```

- [ ] **Step 3: cover aria-hidden（followup #6）+ 测试**

`cover.ts` 的 `createCover()` 里 `cover.dataset.skinOwner = 'wukong'` 后加：

```ts
cover.setAttribute('aria-hidden', 'true')
```

`cover.test.ts` 追加：

```ts
it('封面是纯装饰层：aria-hidden', () => {
  const { cover } = createCover()
  expect(cover.getAttribute('aria-hidden')).toBe('true')
})
```

- [ ] **Step 4: 文档/清单卫生（followup #5）+ token 纯度（followup #7）**

- `tools/embed-assets.mjs`：删除文件头注释里关于 `tool-emblems.svg` / `AG_EMBLEMS` 的段落（Task 1 改写后若已顺带删除则跳过并在报告说明）。
- `package.json`：`files` 数组删掉 `"preview"`；`"license": "MIT"` 改为 `"license": "UNLICENSED"`（自用不分发，private 已 true）。
- `README.md`：资产描述与实际一致（现在确实是 webp——Task 1 之后描述应为"由 `art-production/p0/` 原图经 cwebp 压缩为 `assets-gen/*.webp` 内嵌"）；P0 状态段更新为 P1 状态（立绘/场景已接入，README 里"资产待 codex 生产"字样删除）。
- `wukong.module.css`：主按钮 `border: 1px solid #a86b34` → `border: 1px solid var(--wk-bronze)`。

- [ ] **Step 5: 测试、构建、Commit**

```bash
pnpm test && pnpm build
git add -A && git commit -m "chore: P0 终审随行项清扫（过滤对齐/补测试/aria/文档卫生/token 纯度）"
```

---

### Task 6: 真机 playtest 与截图更新

**Files:**
- Update: `screenshots/`（重拍）、`README.md`（截图引用如有变化）

- [ ] **Step 1: 构建并重装**

```bash
pnpm build
dsh plugin --profile web remove @dsh-external/dsh-wukong || true
dsh plugin --profile web add -w /Users/huanghaibin/Workspace/deepseek/dsh-wukong
```

- [ ] **Step 2: Playtest 走查（Playwright MCP，逐项截图+evaluate 证据）**

1. 会话页（非空会话）：右侧天命人立绘可见、消息卡不压脸（≥1440 视口）→ `shot-stage.png`
2. 发真实小任务：执行中立绘切挥棍姿势 + 背景切余烬版（`document.body.style.backgroundImage` 值变化）+ 水墨转场肉眼可见 → `shot-battle.png`（重拍）
3. 任务结束回问道立绘与冷月背景
4. 新会话页：封面正常、舞台隐藏（`body[data-wukong-empty]` 置位）→ `shot-cover.png`（重拍）
5. 四档响应式：browser_resize 到 1600/1280/900/600 宽各截一张 → `shot-tier-{full,half,bust,plate}.png`；900/600 档确认胸像圆窗显示头部而非躯干（object-position 调优在此步做，允许微调 CSS 后重建重验）
6. 卸载→刷新→背景/立绘/body 属性全还原→重装恢复

任何失败项：琐碎 CSS 调整在本仓库内修复重验；逻辑性失败报 DONE_WITH_CONCERNS/BLOCKED。

- [ ] **Step 3: README 截图更新 + Commit**

```bash
git add -A && git commit -m "docs: P1 playtest 截图与 README 更新"
```

---

## Self-Review 记录

- **Spec 覆盖（P1 范围）**：五态立绘接入（T1+T2）、四档响应式（T2）、场景双光照（T3）、水墨转场（T4）、随行项（T5）、真机验证（T6）。胸像档用 CSS 裁切而非独立文件——spec §6.3 将胸像列为"后续资产"，P1 以裁切达标，若效果不佳 P3 再引入专门裁切图。
- **占位符扫描**：无。
- **类型一致性**：`createStage`/`CharacterStage`/`setPose(state: SkinState)`、`createInkTransition`/`InkTransition`、`WK_POSE_*`/`WK_BG_*` 命名在各任务一致；`data-wukong-empty` 在 T2 产出、CSS 与 T6 消费。
