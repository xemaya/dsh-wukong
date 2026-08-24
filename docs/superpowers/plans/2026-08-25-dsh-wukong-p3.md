# dsh-wukong P3 抛光 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 定身术等一次性战斗反馈、响应式与选择器加固、reduced-motion/键盘/dispose 验收、最终 README/截图/皮肤预览——整套皮肤收官。

**Architecture:** 不新增大模块：定身术与珠位反馈并入 `vfx.ts`/`hud.ts` 既有结构；加固项全是既有文件的小改。最后一轮全量 playtest 是 P0–P3 总验收。

**Tech Stack:** 同 P1/P2。

**Spec:** `docs/superpowers/specs/2026-08-24-dsh-wukong-skin-design.md`（§3 定身术、§5 红线、§7 P3、§8 验收）

## Global Constraints

- 沿用全部既有硬约束（作用域/诚实状态/disposer/observer 过滤/暗色唯一/token/尾注）。
- 一次性反馈原则：无永久循环动画；`prefers-reduced-motion` 下只保留颜色/形状/标签变化。
- 定身术是纯化妆：拦截不了也不去拦截产品 Stop 语义，只监听（capture、passive）真实点击后播放一次性效果。
- 工作分支 `p3-polish`（自 main 分叉）。

## P2 终审随行清单（本计划消化）

1. `[data-error='true']` 选择器收紧为 `[data-timeline-span][data-error='true']`（Task 2）
2. dispose 单测补：dispose 后 body 无 `[data-skin-owner]` 且 poll 已清（Task 2）
3. `shot-choice.png` 过时（含修复前披挂文本）——Task 4 重拍
4. loadout title 三段分隔脆弱性——已知限制，README 已知问题段记录（Task 3）
5. poll 对已卸 chip 的空写——`!chip.isConnected` 早退（Task 2）
6. P1 遗留：响应式档位改 min-width 单向级联，消除分数像素缝隙（Task 2）

---

### Task 1: 定身术与珠位一次性反馈（TDD）

**Files:**
- Modify: `src/client/vfx.ts`（定身圈）、`src/client/hud.ts`（珠位点亮脉冲/受创震动 CSS 钩子）、`src/client/index.ts`（Stop 监听接线）、`src/client/wukong.module.css`
- Test: `src/client/vfx.test.ts` 追加

**Interfaces:**
- Produces: `createInkTransition` 不变；`vfx.ts` 新增 `export function createFreezeRing(): { play(): void; dispose(): void }`（与 InkTransition 同构：一次性节点 + 900ms 自移除 + reduced-motion/单例守卫）。

- [ ] **Step 1: 写失败测试**

`vfx.test.ts` 追加（复制既有 ink 三用例的结构，换 createFreezeRing 与 900ms 时长；断言节点 className 含 freeze 样式类）：

```ts
import { createFreezeRing } from './vfx.ts'

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
```

- [ ] **Step 2: 确认 RED** — `pnpm test`

- [ ] **Step 3: 实现**

`vfx.ts`：把 ink 的"一次性节点+定时器+守卫"骨架提为内部工厂复用（DRY，两个导出共用）：

```ts
function createOneShot(className: string, ms: number): { play(): void; dispose(): void } {
  let node: HTMLDivElement | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  return {
    play(): void {
      if (reducedMotion.matches || node !== undefined) return
      node = document.createElement('div')
      node.dataset.skinOwner = 'wukong'
      node.setAttribute('aria-hidden', 'true')
      node.className = className
      document.body.append(node)
      timer = setTimeout(() => { node?.remove(); node = undefined; timer = undefined }, ms)
    },
    dispose(): void {
      if (timer !== undefined) clearTimeout(timer)
      node?.remove()
      node = undefined
    },
  }
}

export interface InkTransition { play(): void; dispose(): void }
export const createInkTransition = (): InkTransition => createOneShot(styles.inkWipe, 620)
export const createFreezeRing = (): InkTransition => createOneShot(styles.freezeRing, 900)
```

（重构后 ink 既有 3 个测试必须原样通过——这是重构安全网。）

CSS 追加：

```css
/* ===== 定身术（P3）：用户点 Stop 的一次性金圈定格 ===== */
.freezeRing {
  position: fixed;
  inset: 0;
  z-index: 60;
  pointer-events: none;
  background: radial-gradient(circle at 50% 55%, transparent 30%, rgba(224, 177, 103, 0.16) 46%, transparent 62%);
  animation: wkFreeze 0.9s ease-out forwards;
}
@keyframes wkFreeze {
  0% { opacity: 0; transform: scale(0.4); }
  22% { opacity: 1; }
  100% { opacity: 0; transform: scale(1.25); }
}
/* 珠位点亮脉冲与受创一次性震动（动画只在属性翻转瞬间播一次） */
.hudBeads i[data-lit] {
  animation: wkBeadPulse 0.32s ease-out;
}
@keyframes wkBeadPulse {
  0% { transform: rotate(45deg) scale(1.7); }
  100% { transform: rotate(45deg) scale(1); }
}
:global(body[data-dsh-wukong][data-wukong-state='alert']) .hud {
  animation: wkHudShake 0.4s ease-out;
}
@keyframes wkHudShake {
  0%, 100% { transform: translateX(-50%); }
  25% { transform: translateX(calc(-50% - 5px)); }
  55% { transform: translateX(calc(-50% + 4px)); }
}
@media (prefers-reduced-motion: reduce) {
  .freezeRing { display: none; }
  .hudBeads i[data-lit],
  :global(body[data-dsh-wukong][data-wukong-state='alert']) .hud { animation: none; }
}
```

`index.ts` 接线（Stop 按钮无已验证选择器——**发现步骤**：grep dsh-upstream 的 conversation input/composer 源码找 stop/abort 按钮的稳定属性（data-slot/aria-label），记录证据；找不到稳定钩子就用兜底：监听 document 捕获阶段 click，命中 `[data-composer-seat]` 祖先内 aria-label 含 stop/停止 的 button 才播）：

```ts
const freeze = createFreezeRing()
ctx.effect(() => () => freeze.dispose(), 'ui-skin-wukong: freeze ring')
const onStopClick = (event: MouseEvent): void => {
  const target = event.target
  if (!(target instanceof Element)) return
  if (target.closest('<发现步骤确定的 Stop 按钮选择器>') !== null
    && body.dataset.wukongState === 'battle') freeze.play()
}
document.addEventListener('click', onStopClick, { capture: true, passive: true })
ctx.effect(() => () => document.removeEventListener('click', onStopClick, { capture: true }), 'ui-skin-wukong: stop listener')
```

- [ ] **Step 4: GREEN + 构建** — `pnpm test && pnpm build`
- [ ] **Step 5: Commit** — `git commit -m "feat: 定身术金圈与珠位/受创一次性反馈"`

---

### Task 2: 加固批（随行项 1/2/5/6）

**Files:**
- Modify: `src/client/wukong.module.css`（选择器收紧 + min-width 级联）、`src/client/loadout.ts`（isConnected 早退）
- Test: `src/client/apply.test.ts` 追加 dispose 全清单测

- [ ] **Step 1: 影神图 error 选择器收紧**：`[data-error='true']` → `[data-timeline-span][data-error='true']`。
- [ ] **Step 2: 响应式改 min-width 单向级联**：四档 media query 重写为 mobile-first——基础（<768 名牌值）不带 query；`@media (min-width: 768px)` 覆盖胸像档；`(min-width: 1024px)` 半身档+安全区；`(min-width: 1440px)` 全身档。行为对照现值逐档一致（380/280/132/88、高度、object-fit、scale(2.1) 只在 768-1023 与 <768 档——注意 min-width 级联下 1024+ 档必须显式重置 transform/object-fit 回全身值）。消除分数像素缝隙。
- [ ] **Step 3: loadout poll 早退**：`sync()` 开头 `if (!chip.isConnected) return`——单测补：chip 未挂载时 sync 不改 textContent。
- [ ] **Step 4: dispose 全清单测**（apply.test.ts 追加）：

```ts
it('dispose 后 body 无任何皮肤节点，轮询停止', async () => {
  vi.useFakeTimers()
  const { ctx, dispose } = fakeCtx()
  apply(ctx as never)
  dispose()
  expect(document.body.querySelectorAll('[data-skin-owner]')).toHaveLength(0)
  const title = document.title
  vi.advanceTimersByTime(5000)   // poll 若未清会继续跑（不可观察副作用，但不应抛错）
  expect(document.title).toBe(title)
  vi.useRealTimers()
})
```

- [ ] **Step 5: 全绿 + 构建 + Commit** — `git commit -m "chore: P2 终审加固批——选择器收紧/min-width 级联/poll 早退/dispose 单测"`

---

### Task 3: README 收官与已知限制

**Files:**
- Modify: `README.md`、`skin.json`

- [ ] **Step 1: README**：状态段改"P0–P3 完成"；特性清单对齐 spec §3 全部机制（含定身术）；新增"已知限制"段：loadout title 分隔脆弱性、seenErrors 依赖元素身份（虚拟化场景可能误报）、choice 信号仅 childList 路径、双皮肤 livelock 提示保留。
- [ ] **Step 2: skin.json**：`description` 补 P2/P3 机制一句话；加 `"preview": { "dark": "preview/dark.webp" }`，并把最能代表的截图转 webp 放 `preview/dark.webp`（`cwebp -q 80 screenshots/shot-battle.png -o preview/dark.webp`；package.json files 数组把 `preview` 加回来）。
- [ ] **Step 3: 构建回归 + Commit** — `git commit -m "docs: README 收官与皮肤市场预览图"`

---

### Task 4: 总验收 playtest（P0–P3 全量）

**Files:**
- Update: `screenshots/`（含重拍 shot-choice.png）、`README.md`（如截图引用变化）

- [ ] **Step 1: 重装重启**（同 P2 流程）。
- [ ] **Step 2: 全量走查**（对照 spec §8 验收标准）：
  1. 五态视觉识别：遮住状态文字，问道/岔路/降妖/受创四态凭视觉可辨（立绘剪影+光照+HUD）→ 各态截图
  2. 定身术：battle 中点 Stop → 金圈一次性播放，产品停止语义正常 → `shot-freeze.png`
  3. 珠位脉冲与受创震动一次性（无循环）
  4. reduced-motion：系统开启后（或 CDP 模拟 `prefers-reduced-motion`）：无转场/无脉冲/无震动/立绘瞬切，颜色标签仍变
  5. 键盘全程：Tab 走完 composer/选项/披挂 chip（chip 可聚焦可 Enter），焦点环可见
  6. 四档响应式复走（min-width 重构后逐档确认无回归 + 1023.5px 分数宽度无缝隙）
  7. 卸载还原全清单（title/favicon/背景/body 属性/全部皮肤节点）→ 重装收尾
  8. 重拍过时的 `shot-choice.png`
- [ ] **Step 3: 提交 + Commit** — `git commit -m "docs: P3 总验收截图与走查记录"`

---

## Self-Review 记录

- **Spec 覆盖**：§3 定身术（T1）、一次性反馈替代装饰（T1）、§7 P3 reduced-motion/键盘/性能验收（T4）、截图与 README（T3/T4）。P2 终审 5 条随行 + P1 遗留 min-width 全部有归属（清单节）。
- **占位符扫描**：T1 Stop 选择器是刻意的发现步骤填空（含兜底方案），非占位符。
- **类型一致性**：`createOneShot` 内部工厂统一 InkTransition 形状；`createFreezeRing` 导出与测试一致。
