# dsh-wukong P0 立骨 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建成可安装的 dsh 皮肤插件骨架：五态诚实状态机（含历史错误基线）、暗金 token 静态视觉、New Session 全屏封面页。

**Architecture:** Cordis 客户端插件（与 dsh-afterglow 同一插件合同：`apply(ctx)` + `ctx.effect` disposer + `cordis.patch.yml` 注入 web 插件表）。皮肤逻辑全新实现，按职责拆模块：`contract.ts` 是唯一读产品 DOM 的地方，输出五态状态；其余模块只消费状态。构建基础设施（tsdown 预设、资产内嵌工具）从 dsh-afterglow 原样复制——那是打包管线，不是皮肤代码。

**Tech Stack:** TypeScript + @deepseek-ai/cordis ^4.0.1 + tsdown 0.22.14 + lightningcss（CSS Modules）+ vitest + happy-dom（单测）。

**Spec:** `docs/superpowers/specs/2026-08-24-dsh-wukong-skin-design.md`

## Global Constraints

- 包名 `@dsh-external/dsh-wukong`；wiring id `ui-skin-wukong`；body 属性 `data-dsh-wukong`；皮肤标题 `DSH // 天命`；chrome 色 `#080706`。
- 角色是**天命人**（不是悟空/大圣）；游戏名《黑神话：悟空》可用于标题/描述。仅自用，不进 dsh-skin-market。
- 诚实状态机：所有状态来自真实 DOM 证据；不伪造进度、百分比、Boss 血条。
- 打开含历史错误的旧会话不得触发受创（错误基线规则）；普通回合结束不触发功成。
- 克隆/皮肤自建元素不做真实提交入口；原生控件语义与键盘可达性不变。
- disposer 必须完整还原全部 CSS/DOM 写入（title、favicon、theme-color、body 属性与内联样式、自建节点）。
- MutationObserver 必须过滤皮肤自有节点（`data-skin-owner`），否则会 livelock 页面（afterglow 踩过的坑，见其 `src/client/index.ts:970-976`）。
- 暗色是唯一版本：忽略产品明暗主题属性，恒用暗金视觉。
- Token 六色：Void `#080706` / Armor Ink `#171411` / Old Gold `#B9813F` / Bronze `#7F5B35` / Ember `#B95B2F` / Text `#EEE5D8`；亮金 `#E0B167`、危险红 `#AD3E33`、玉青 `#7D9A87`。
- 提交信息末尾带 Co-Authored-By / Claude-Session 尾注（见仓库现有提交）。

**参考仓库**（只读，不改动）：`/Users/huanghaibin/Workspace/deepseek/dsh-afterglow`。
**概念稿**：`/Users/huanghaibin/Downloads/dsh-wukong-black-myth-cover-final.html`（内含封面大图 data URI）。

---

### Task 1: 仓库骨架与构建管线

**Files:**
- Create: `package.json`, `tsdown.config.ts`, `cordis.patch.yml`, `skin.json`, `src/index.ts`, `src/client/index.ts`, `src/client/wukong.module.css`, `.gitignore`
- Copy: `build/`（整目录）、`tools/embed-assets.mjs` ← 从 dsh-afterglow 原样复制（构建基础设施；embed-assets 在 Task 3 改写资产清单）

**Interfaces:**
- Produces: 可构建的插件包——`pnpm build` 产出 `lib/index.js` + `lib/client.js`；`src/client/index.ts` 导出 `apply(ctx: Context): void`（后续任务在此文件扩展）。

- [ ] **Step 1: 复制构建基础设施**

```bash
cd /Users/huanghaibin/Workspace/deepseek/dsh-wukong
cp -r ../dsh-afterglow/build .
mkdir -p tools assets-gen src/client
cp ../dsh-afterglow/tools/embed-assets.mjs tools/
printf 'node_modules/\n' > .gitignore
```

- [ ] **Step 2: 写 package.json**

```json
{
  "name": "@dsh-external/dsh-wukong",
  "description": "DSH // 天命 skin for the dsh web GUI: Black Myth Wukong theme — ink-black and old-gold, the Destined One as the visible agent avatar",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "lib/index.js",
  "exports": {
    ".": "./lib/index.js",
    "./client": "./lib/client.js",
    "./skin.json": "./skin.json",
    "./package.json": "./package.json"
  },
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": { "inject": [], "platform": "web" }
  },
  "scripts": {
    "build": "tsdown",
    "test": "vitest run",
    "generate:assets": "node tools/embed-assets.mjs"
  },
  "license": "MIT",
  "peerDependencies": { "@deepseek-ai/cordis": "^4.0.1" },
  "devDependencies": {
    "@deepseek-ai/cordis": "^4.0.1",
    "lightningcss": "^1.32.0",
    "tsdown": "0.22.14"
  },
  "files": ["lib/index.js", "lib/client.js", "cordis.patch.yml", "skin.json", "preview", "src", "tools", "assets-gen", "README.md"]
}
```

- [ ] **Step 3: 写 tsdown.config.ts、cordis.patch.yml、skin.json**

`tsdown.config.ts`：

```ts
import { clientBundle } from './build/tsdown.client.ts'

export default clientBundle('@dsh-external/dsh-wukong', ['src/index.ts'], {
  portableCssModuleIds: true,
})
```

`cordis.patch.yml`：

```yaml
# dsh-wukong skin bundle patch: inserts its public dsh.client entry into
# the web plugin roster. Install with `dsh plugin --profile web add -w <path>`.
- insert:
    - id: ui-skin-wukong
      name: '@dsh-external/dsh-wukong'
```

`skin.json`：

```json
{
  "id": "wukong",
  "name": "DSH // 天命",
  "nameEn": "DSH // TIANMING",
  "author": "keman.ai",
  "tagline": "黑神话悟空主题：你执笔，天命人执棍",
  "description": "墨黑、古铜、暗金与余烬。天命人作为可见的 agent 化身驻守角色轨道；问道 / 岔路 / 降妖 / 受创 / 功成五态全部来自产品真实 DOM 证据，不伪造进度。仅自用，不分发。",
  "tags": ["black-myth", "wukong", "ink-gold", "battle-hud", "dark-only"],
  "accent": "#B9813F",
  "bodyAttr": "data-dsh-wukong",
  "package": "@dsh-external/dsh-wukong",
  "wiring": { "id": "ui-skin-wukong", "bundleWired": true },
  "order": 20
}
```

- [ ] **Step 4: 写入口桩**

`src/index.ts`（node 半侧空实现，与 afterglow 相同）：

```ts
export function apply(): void {}
```

`src/client/index.ts`（最小可构建桩，Task 4 扩展）：

```ts
import type { Context } from '@deepseek-ai/cordis'
import './wukong.module.css'

export function apply(ctx: Context): void {
  const body = document.body
  ctx.effect(() => () => {
    delete body.dataset.dshWukong
  }, 'ui-skin-wukong: presentation layer')
  body.dataset.dshWukong = ''
}
```

`src/client/wukong.module.css`（桩，Task 5 扩展）：

```css
:global(body[data-dsh-wukong]) {
  background: #080706;
}
```

- [ ] **Step 5: 安装依赖并构建**

```bash
pnpm install
pnpm build
ls lib/  # 期望：index.js client.js client.js.map
```

若 `clientBundle` 报入口/CSS 相关错误，对照 afterglow 的同名文件排查差异（唯一合法差异应是包名与入口内容）。

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: P0 仓库骨架——可构建的 dsh 皮肤插件包"
```

---

### Task 2: contract.ts 五态状态机（TDD）

**Files:**
- Create: `src/client/contract.ts`, `vitest.config.ts`
- Modify: `package.json`（加 vitest + happy-dom devDependencies）
- Test: `src/client/contract.test.ts`

**Interfaces:**
- Produces（Task 4/6 依赖，签名必须一字不差）:

```ts
export type SkinState = 'dialogue' | 'choice' | 'battle' | 'alert' | 'clear'
export const STATE_LABELS: Record<SkinState, string>  // 问道/岔路/降妖/受创/功成
export const CHOICE_SELECTOR: string
export const RUNNING_SELECTOR: string
export const ERROR_SELECTOR: string
export interface ContractEngine { sync(): void; dispose(): void }
export function createContractEngine(
  root: ParentNode,
  onState: (state: SkinState) => void,
  options?: { alertMs?: number; clearMs?: number },
): ContractEngine
```

`onState` 只在状态变化时回调一次。`sync()` 由调用方（MutationObserver / 初始化）驱动，engine 自己不建 observer——观察是 Task 4 的职责，推导是本任务的职责。

- [ ] **Step 1: 加测试依赖与配置**

```bash
pnpm add -D vitest@^2 happy-dom@^15
```

`vitest.config.ts`：

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { environment: 'happy-dom', include: ['src/**/*.test.ts'] },
})
```

- [ ] **Step 2: 写失败测试**

`src/client/contract.test.ts`。DOM 选择器合同继承 afterglow 验证过的稳定契约（见其 `src/client/index.ts:111-113`）：choice 优先于 battle；错误基线规则；功成只在 todo 全部 completed 时触发。

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createContractEngine, STATE_LABELS, type SkinState } from './contract.ts'

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
```

- [ ] **Step 3: 跑测试确认失败**

```bash
pnpm test
```

期望：FAIL，`contract.ts` 不存在。

- [ ] **Step 4: 实现 contract.ts**

```ts
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
```

- [ ] **Step 5: 跑测试确认通过**

```bash
pnpm test
```

期望：全部 PASS。同时 `pnpm build` 仍通过（contract.ts 尚未被入口引用也不应破坏构建）。

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: contract.ts 五态状态机（含历史错误基线，TDD）"
```

---

### Task 3: 资产提取与内嵌管线

**Files:**
- Create: `tools/extract-concept-assets.py`, `assets-gen/cover-tianming.<按实际 mime>`, `assets-gen/icon.png`, `src/client/art.generated.ts`（生成物）
- Modify: `tools/embed-assets.mjs`（改写资产清单为 wukong 的）

**Interfaces:**
- Produces（Task 4/6 依赖）: `src/client/art.generated.ts` 导出 `export const WK_COVER: string`（data URI）与 `export const WK_ICON: string`。

- [ ] **Step 1: 从概念稿提取封面图**

`tools/extract-concept-assets.py`：

```python
"""从概念稿 HTML 提取封面 data URI 到 assets-gen/（一次性工具）。"""
import base64, pathlib, re, sys

src = pathlib.Path('/Users/huanghaibin/Downloads/dsh-wukong-black-myth-cover-final.html')
out_dir = pathlib.Path(__file__).resolve().parent.parent / 'assets-gen'
m = re.search(r'data:(image/[a-z+]+);base64,([A-Za-z0-9+/=]+)', src.read_text())
if m is None:
    sys.exit('no data URI found in concept HTML')
ext = {'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp'}[m.group(1)]
path = out_dir / f'cover-tianming.{ext}'
path.write_bytes(base64.b64decode(m.group(2)))
print(path, path.stat().st_size)
```

```bash
python3 tools/extract-concept-assets.py
```

- [ ] **Step 2: 生成 icon.png（macOS sips 裁切缩放）**

从封面中心裁方形缩到 128px（sips 是 darwin 自带工具）：

```bash
cd assets-gen
cp cover-tianming.* icon-src.img
sips -s format png -Z 512 icon-src.img --out icon-tmp.png
# 取中心 128x128：先查尺寸再居中裁切
sips -g pixelWidth -g pixelHeight icon-tmp.png
sips -c 128 128 icon-tmp.png --out icon.png   # -c 从中心裁切到 128x128
rm icon-src.img icon-tmp.png
```

若 `-c` 行为与预期不符（裁切偏移），可接受任何居中近似——icon 只是 favicon。

- [ ] **Step 3: 改写 embed-assets.mjs 清单**

把 `ASSETS` 数组整个替换为（保留文件其余骨架，删除 afterglow 的 emblem SVG 段落——P0 无徽记资产）：

```js
const ASSETS = [
  ['WK_COVER', 'cover-tianming.<实际扩展名>'],
  ['WK_ICON', 'icon.png'],
]
```

注意 `MIME` 表需含实际扩展名（`.jpg` 需补 `'.jpg': 'image/jpeg'`）。

- [ ] **Step 4: 生成并验证**

```bash
pnpm generate:assets
head -c 200 src/client/art.generated.ts   # 期望看到 WK_COVER data URI
pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: 概念稿封面/icon 提取与内嵌管线"
```

---

### Task 4: client apply() 骨架——状态机接线与 disposer

**Files:**
- Modify: `src/client/index.ts`（替换 Task 1 的桩）
- Test: `src/client/apply.test.ts`

**Interfaces:**
- Consumes: `createContractEngine` / `STATE_LABELS`（Task 2）、`WK_ICON`（Task 3）。
- Produces: `body[data-dsh-wukong]` + `body[data-wukong-state='dialogue'|choice|battle|alert|clear]`——Task 5 的 CSS 与后续阶段全部挂在这两个属性上。`apply(ctx)` 内部预留 `onState` 单一入口。

- [ ] **Step 1: 写失败测试**

`src/client/apply.test.ts`（fake ctx 模拟 cordis effect 语义：effect 回调返回 disposer，dispose 时逆序执行）：

```ts
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
  afterEach(() => { document.body.replaceWith(document.createElement('body')) })

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
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm test
```

期望：apply.test FAIL（桩实现没有标题/favicon/状态机）。

- [ ] **Step 3: 实现 apply()**

`src/client/index.ts` 全文替换：

```ts
/**
 * DSH // 天命 — 黑神话悟空皮肤客户端入口。
 *
 * 仅呈现层：一切写入以 body[data-dsh-wukong] 为作用域，cordis effect
 * disposer 完整还原。状态由 contract.ts 从产品真实 DOM 证据推导。
 */
import type { Context } from '@deepseek-ai/cordis'
import { createContractEngine, type SkinState } from './contract.ts'
import { WK_ICON } from './art.generated.ts'
import './wukong.module.css'

const SKIN_OWNER = 'wukong'
const SKIN_TITLE = 'DSH // 天命'
const SKIN_CHROME_COLOR = '#080706'

export function apply(ctx: Context): void {
  const body = document.body
  const originalTitle = document.title
  const ownedNodes = new Set<Element>()
  let observer: MutationObserver | undefined
  let themeColorObserver: MutationObserver | undefined
  let themeColorMeta: HTMLMetaElement | null = null
  let previousThemeColor: string | undefined

  const onState = (state: SkinState): void => {
    body.dataset.wukongState = state
  }
  const engine = createContractEngine(body, onState)

  ctx.effect(() => () => {
    engine.dispose()
    observer?.disconnect()
    themeColorObserver?.disconnect()
    delete body.dataset.dshWukong
    delete body.dataset.wukongState
    ownedNodes.forEach(node => node.remove())
    if (themeColorMeta?.isConnected && themeColorMeta.content === SKIN_CHROME_COLOR) {
      themeColorMeta.content = previousThemeColor ?? ''
    }
    if (document.title === SKIN_TITLE) document.title = originalTitle
  }, 'ui-skin-wukong: presentation layer')

  body.dataset.dshWukong = ''
  body.dataset.wukongState = 'dialogue'
  document.title = SKIN_TITLE

  const favicon = document.createElement('link')
  favicon.rel = 'icon'
  favicon.type = 'image/png'
  favicon.href = WK_ICON
  favicon.dataset.skinOwner = SKIN_OWNER
  ownedNodes.add(favicon)
  document.head.append(favicon)

  /* 系统 chrome 色（PWA 标题栏/移动状态栏）恒为 Void。 */
  const syncSystemChrome = (): void => {
    const meta = document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (meta === null) return
    if (meta !== themeColorMeta) {
      themeColorMeta = meta
      previousThemeColor = meta.content
    }
    if (meta.content !== SKIN_CHROME_COLOR) meta.content = SKIN_CHROME_COLOR
  }
  themeColorObserver = new MutationObserver(syncSystemChrome)
  themeColorObserver.observe(document.head, {
    attributes: true, attributeFilter: ['content'], childList: true, subtree: true,
  })
  syncSystemChrome()

  /* 皮肤自有节点的变更绝不能再触发 sync——那个反馈环会 livelock 页面。 */
  observer = new MutationObserver((records) => {
    let relevant = false
    for (const record of records) {
      if (record.type === 'attributes') {
        if (record.attributeName === 'data-state') relevant = true
        continue
      }
      if (record.target instanceof Element && record.target.closest('[data-skin-owner]') !== null) continue
      const nodes = [...record.addedNodes, ...record.removedNodes]
      const skinOwned = nodes.every(node => (
        node instanceof Element && node.getAttribute('data-skin-owner') === SKIN_OWNER
      ))
      if (nodes.length > 0 && !skinOwned) relevant = true
    }
    if (relevant) engine.sync()
  })
  observer.observe(body, {
    attributes: true,
    attributeFilter: ['data-state'],
    childList: true,
    subtree: true,
  })

  engine.sync()
}
```

- [ ] **Step 4: 跑测试与构建确认通过**

```bash
pnpm test && pnpm build
```

期望：全部 PASS，构建成功。

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: client apply 骨架——状态机接线、favicon/title/chrome、完整 disposer"
```

---

### Task 5: token CSS 与工作态静态视觉

**Files:**
- Modify: `src/client/wukong.module.css`（替换桩，全部样式挂 `:global(body[data-dsh-wukong])` 作用域）

**Interfaces:**
- Consumes: `body[data-dsh-wukong]` / `body[data-wukong-state]`（Task 4）。
- Produces: CSS 变量 `--wk-void/--wk-ink/--wk-gold/--wk-gold2/--wk-bronze/--wk-ember/--wk-text/--wk-red/--wk-jade/--wk-line`——后续阶段（P1/P2）所有模块引用这些变量，不再写裸色值。

- [ ] **Step 1: 写 token 层与基础暗金视觉**

以下为骨架（必须完整落盘）；产品具体控件选择器参考 `dsh-afterglow/src/client/afterglow.module.css` 里出现过的产品选择器（那是已验证的可主题化表面清单），但**色值全部换 wukong token，不照抄 afterglow 的样式值**：

```css
:global(body[data-dsh-wukong]) {
  --wk-void: #080706;
  --wk-ink: #171411;
  --wk-surface: #11100e;
  --wk-gold: #b9813f;
  --wk-gold2: #e0b167;
  --wk-bronze: #7f5b35;
  --wk-ember: #b95b2f;
  --wk-red: #ad3e33;
  --wk-jade: #7d9a87;
  --wk-text: #eee5d8;
  --wk-text2: #c7b6a0;
  --wk-line: rgba(211, 164, 91, 0.16);

  background:
    radial-gradient(circle at 50% 0%, rgba(116, 76, 40, 0.13), transparent 24%),
    linear-gradient(180deg, #050403, var(--wk-void));
  color: var(--wk-text);
}

/* 执行/受创时背景转余烬光（场景art到位前用渐变占位，hook 已就绪） */
:global(body[data-dsh-wukong][data-wukong-state='battle']),
:global(body[data-dsh-wukong][data-wukong-state='alert']) {
  background:
    radial-gradient(circle at 50% 0%, rgba(185, 91, 47, 0.18), transparent 30%),
    linear-gradient(180deg, #0a0503, var(--wk-void));
}

/* 受创：一次性可读性优先，不做循环闪烁 */
:global(body[data-dsh-wukong][data-wukong-state='alert']) {
  --wk-line: rgba(173, 62, 51, 0.28);
}
```

在此骨架上继续覆盖（每条对照 afterglow.module.css 找到对应产品选择器后换 token 落实）：面板 surface 与描边（`--wk-ink`/`--wk-line`）、主按钮（金渐变 `linear-gradient(180deg, var(--wk-gold2), #a66c35)` + 深字 `#21150b`）、次按钮与 chip、滚动条、输入框 placeholder、链接与强调色。概念稿 `/Users/huanghaibin/Downloads/dsh-wukong-black-myth-cover-final.html` 的 `<style>` 段是密度与层次的视觉基准。

- [ ] **Step 2: 构建 + 测试回归**

```bash
pnpm test && pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: 暗金 token 系统与工作态静态视觉"
```

---

### Task 6: New Session 封面页（土地庙）

**Files:**
- Create: `src/client/cover.ts`
- Modify: `src/client/index.ts`（挂载 cover）、`src/client/contract.ts`（加 `isEmptySession`）、`src/client/wukong.module.css`（cover 样式）
- Test: `src/client/contract.test.ts`（补 isEmptySession 用例）

**Interfaces:**
- Consumes: `WK_COVER`（Task 3）、`body[data-wukong-state]`（Task 4）。
- Produces:

```ts
// contract.ts 追加
export function isEmptySession(root: ParentNode): boolean
// cover.ts
export function createCover(): { cover: HTMLDivElement; setVisible(visible: boolean): void }
```

- [ ] **Step 1: 【发现步骤】确认空会话的真实 DOM 特征**

启动 dsh web GUI（用户环境已能运行 dsh；如启动方式不明，问用户或查 `dsh --help`），打开一个**新会话**页面，在 DevTools 检查：`[data-chat-flow]` 此时是否存在？是否无消息子元素？记录真实特征。缺省假设（写入实现，发现步骤证伪则改）：**空会话 = `[data-chat-flow]` 不存在，或其下没有任何元素子节点**。若真实产品有专门的 empty-state 节点/属性，改用它并更新本步骤记录：

> 发现记录（执行时填写实测结果）：＿＿＿

- [ ] **Step 2: 写失败测试（isEmptySession）**

`contract.test.ts` 追加：

```ts
import { isEmptySession } from './contract.ts'

describe('isEmptySession', () => {
  it('无 chat-flow 或 chat-flow 为空 → true；有消息子元素 → false', () => {
    const root = document.createElement('div')
    expect(isEmptySession(root)).toBe(true)
    root.innerHTML = '<div data-chat-flow></div>'
    expect(isEmptySession(root)).toBe(true)
    root.innerHTML = '<div data-chat-flow><div data-tool data-state="ok"></div></div>'
    expect(isEmptySession(root)).toBe(false)
  })
})
```

```bash
pnpm test   # 期望 FAIL：isEmptySession 未导出
```

- [ ] **Step 3: 实现 isEmptySession 与 cover.ts**

`contract.ts` 追加（按 Step 1 实测调整判定）：

```ts
/* 土地庙：空会话（尚无任何回合内容）才展示封面。 */
export function isEmptySession(root: ParentNode): boolean {
  const flow = root.querySelector('[data-chat-flow]')
  return flow === null || flow.firstElementChild === null
}
```

`src/client/cover.ts`：

```ts
/**
 * 土地庙 — New Session 全屏封面层。纯呈现：不拦截任何输入，
 * pointer-events 仅落在封面自身装饰上，composer 等原生控件在其上层。
 */
import { WK_COVER } from './art.generated.ts'
import styles from './wukong.module.css'

export function createCover(): { cover: HTMLDivElement; setVisible(visible: boolean): void } {
  const cover = document.createElement('div')
  cover.dataset.skinOwner = 'wukong'
  cover.className = styles.cover
  cover.innerHTML = `
    <img class="${styles.coverArt}" alt="" src="${WK_COVER}"/>
    <div class="${styles.coverCopy}">
      <span class="${styles.coverKicker}">DeepSeek Harness · Black Myth Wukong</span>
      <h1 class="${styles.coverTitle}">直 面 天 命</h1>
    </div>`
  return {
    cover,
    setVisible(visible: boolean): void {
      cover.dataset.visible = visible ? '' : undefined as never
      if (visible) cover.dataset.visible = ''
      else delete cover.dataset.visible
    },
  }
}
```

`wukong.module.css` 追加（关键：`z-index` 低于产品 composer/侧栏所在层；封面只垫底不遮交互；渐变压暗保证前景可读，取概念稿 `.home-view .hero:after` 的双向渐变）：

```css
.cover {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.cover[data-visible] { opacity: 1; }
.coverArt {
  width: 100%; height: 100%;
  object-fit: cover; object-position: center;
  filter: contrast(1.03) brightness(0.9);
}
.cover::after {
  content: '';
  position: absolute; inset: 0;
  background:
    linear-gradient(90deg, rgba(4,3,3,.68) 0%, rgba(4,3,3,.26) 34%, rgba(4,3,3,.08) 56%, rgba(4,3,3,.2) 100%),
    linear-gradient(180deg, rgba(3,2,2,.08) 0%, rgba(3,2,2,.02) 45%, rgba(3,2,2,.34) 73%, rgba(3,2,2,.88) 100%);
}
.coverCopy {
  position: absolute; left: 42px; top: 50%;
  transform: translateY(-58%); max-width: 430px;
}
.coverKicker {
  display: inline-flex; padding: 6px 9px; border-radius: 999px;
  border: 1px solid var(--wk-line); background: rgba(8,6,5,.56);
  font-size: 9px; color: #b7a186; margin-bottom: 10px;
}
.coverTitle {
  margin: 0; font-family: 'STKaiti', 'KaiTi', serif;
  font-size: 42px; letter-spacing: 0.12em; line-height: 1.02;
  color: var(--wk-gold2); text-shadow: 0 4px 20px rgba(0,0,0,.62);
}
```

`index.ts` 的 `apply()` 内接线（在 `engine.sync()` 之前挂载；MutationObserver 已有的 `relevant` 分支同时驱动可见性）：

```ts
import { createCover } from './cover.ts'
import { isEmptySession } from './contract.ts'
// apply() 内：
const { cover, setVisible } = createCover()
ownedNodes.add(cover)
body.prepend(cover)
const syncCover = (): void => setVisible(isEmptySession(body))
// MutationObserver 回调里 `if (relevant) engine.sync()` 后追加：
//   if (relevant) syncCover()
// 初始化 engine.sync() 后追加 syncCover()
```

- [ ] **Step 4: 测试与构建**

```bash
pnpm test && pnpm build
```

期望：全部 PASS。

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: 土地庙——New Session 全屏封面层（直面天命）"
```

---

### Task 7: 安装与 playtest 验证

**Files:**
- Create: `screenshots/`（实测截图）、`README.md`（最小安装说明）

**Interfaces:**
- Consumes: 全部前序任务的构建产物 `lib/`。

- [ ] **Step 1: 安装到本机 dsh**

```bash
pnpm build
dsh plugin --profile web add -w /Users/huanghaibin/Workspace/deepseek/dsh-wukong
```

- [ ] **Step 2: Playtest（REQUIRED SUB-SKILL: playtesting-a-feature / verification-before-completion）**

打开 dsh web GUI，逐项走查并截图到 `screenshots/`：

1. 新会话页：封面显示，"直 面 天 命" 标题，composer 可正常输入（封面不拦截点击）。
2. 发起一个真实小任务（如"列出当前目录文件"）：工具执行期间 `body[data-wukong-state]` 翻为 `battle`，背景转余烬光。
3. 任务结束回到 `dialogue`；无 todo 时**没有**出现 `clear`。
4. 打开一个含历史错误的旧会话（如没有，检查 DevTools 里 `data-wukong-state` 未进入 `alert` 即可）。
5. 标题为 `DSH // 天命`，favicon 已换。
6. 卸载还原验证：`dsh plugin --profile web remove @dsh-external/dsh-wukong` 后刷新，标题/favicon/背景/body 属性全部恢复原生。

任何一项不符 → 回到对应任务修复，不得跳过。

- [ ] **Step 3: 写最小 README 并提交**

README 内容：一段简介（皮肤名、仅自用声明）、安装/卸载命令、P0 状态说明（含"场景/立绘资产待 codex 生产"）、截图。

```bash
git add -A && git commit -m "docs: P0 安装说明与 playtest 截图"
```

---

## Self-Review 记录

- **Spec 覆盖（P0 范围）**：仓库骨架（Task 1）、contract.ts 五态状态机含历史错误基线（Task 2）、token/场景静态视觉（Task 5，场景 art 位由渐变占位并预留 hook，实图待 codex 交付）、New Session 封面页（Task 6）、可安装验证（Task 7）。P1–P3 内容（立绘/HUD/棍势/岔路/披挂/章回/影神图/VFX）不在本计划。
- **占位符扫描**：无 TBD；Task 6 Step 1 的"发现记录"是刻意的执行时实测填空，非占位符。
- **类型一致性**：`createContractEngine(root, onState, options?)`、`SkinState`、`isEmptySession`、`createCover` 在各任务间签名一致；CSS 变量统一 `--wk-*` 前缀。
