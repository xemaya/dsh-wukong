/**
 * DSH // 天命 — 黑神话悟空皮肤客户端入口。
 *
 * 仅呈现层：一切写入以 body[data-dsh-wukong] 为作用域，cordis effect
 * disposer 完整还原。状态由 contract.ts 从产品真实 DOM 证据推导。
 */
import type { Context } from '@deepseek-ai/cordis'
import { createContractEngine, isEmptySession, readBattleTelemetry, type SkinState } from './contract.ts'
import { createCover } from './cover.ts'
import { createHud } from './hud.ts'
import { createLoadout } from './loadout.ts'
import { createStage } from './stage.ts'
import { createFreezeRing, createInkTransition } from './vfx.ts'
import { WK_ICON, WK_BG_DIALOGUE, WK_BG_EXECUTION } from './art.generated.ts'
import './wukong.module.css'

const SKIN_OWNER = 'wukong'
const SKIN_TITLE = 'DSH // 天命'
const SKIN_CHROME_COLOR = '#080706'
const COMPOSER_SEAT_SELECTOR = '[data-composer-seat]'
/* Stop 按钮无 data-slot 等稳定钩子（dsh-upstream ui-conversation/src/client/skeleton/
   InputBar.tsx:797-810,812-831）：独立 Stop 按钮与"主按钮变身 Stop"两处均只有
   aria-label={t('input.stop')}，取值 '停止生成'（locales.ts:24）/ 'Stop generating'
   （locales.ts:201）。故按兜底方案匹配：座内 button 的 aria-label 含 stop/停止。 */
const STOP_LABEL_PATTERN = /stop|停止/i

export function apply(ctx: Context): void {
  const body = document.body
  const originalTitle = document.title
  const ownedNodes = new Set<Element>()
  let observer: MutationObserver | undefined
  let themeColorObserver: MutationObserver | undefined
  let themeColorMeta: HTMLMetaElement | null = null
  let previousThemeColor: string | undefined

  // 保存产品原内联背景值，供 disposer 还原
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

  const { stage, setPose } = createStage()
  const { hud, sync: syncHud } = createHud()
  const { chip: loadoutChip, sync: syncLoadout } = createLoadout()
  const ink = createInkTransition()
  ctx.effect(() => () => ink.dispose(), 'ui-skin-wukong: ink transition')

  const freeze = createFreezeRing()
  ctx.effect(() => () => freeze.dispose(), 'ui-skin-wukong: freeze ring')
  const onStopClick = (event: MouseEvent): void => {
    const target = event.target
    if (!(target instanceof Element)) return
    const button = target.closest('button[aria-label]')
    if (button === null || button.closest(COMPOSER_SEAT_SELECTOR) === null) return
    const label = button.getAttribute('aria-label') ?? ''
    if (!STOP_LABEL_PATTERN.test(label)) return
    if (body.dataset.wukongState === 'battle') freeze.play()
  }
  document.addEventListener('click', onStopClick, { capture: true, passive: true })
  ctx.effect(() => () => document.removeEventListener('click', onStopClick, { capture: true }), 'ui-skin-wukong: stop listener')

  const refreshHud = (): void => {
    syncHud((body.dataset.wukongState ?? 'dialogue') as SkinState, readBattleTelemetry(body))
  }

  let stateBaselined = false
  const onState = (state: SkinState): void => {
    body.dataset.wukongState = state
    setPose(state)
    syncBackdrop()
    refreshHud()
    if (stateBaselined) ink.play()
    stateBaselined = true
  }
  const engine = createContractEngine(body, onState)

  const { cover, setVisible, dispose: disposeCover } = createCover()
  const syncCover = (): void => {
    const empty = isEmptySession(body)
    setVisible(empty)
    if (empty) body.dataset.wukongEmpty = ''
    else delete body.dataset.wukongEmpty
  }

  ctx.effect(() => () => {
    engine.dispose()
    disposeCover()
    observer?.disconnect()
    themeColorObserver?.disconnect()
    delete body.dataset.dshWukong
    delete body.dataset.wukongState
    delete body.dataset.wukongEmpty
    ownedNodes.forEach(node => node.remove())
    if (themeColorMeta?.isConnected && themeColorMeta.content === SKIN_CHROME_COLOR) {
      themeColorMeta.content = previousThemeColor ?? ''
    }
    if (document.title === SKIN_TITLE) document.title = originalTitle
    for (const [property, value] of previousBackground) {
      body.style.setProperty(property, value)
    }
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

  ownedNodes.add(cover)
  body.prepend(cover)

  ownedNodes.add(stage)
  body.append(stage)

  ownedNodes.add(hud)
  body.append(hud)

  ownedNodes.add(loadoutChip)
  /* 座内 append，绝不插在 React 兄弟之间；React 重渲染掉座位时重挂。 */
  const seatLoadout = (): void => {
    const seat = document.querySelector<HTMLElement>(COMPOSER_SEAT_SELECTOR)
    if (seat === null) { loadoutChip.remove(); return }
    if (loadoutChip.parentElement !== seat) seat.append(loadoutChip)
    syncLoadout()
  }
  /* 触发器标题无可观察钩子（afterglow 同款问题）：慢轮询兜底 */
  const loadoutPoll = setInterval(syncLoadout, 1500)
  ctx.effect(() => () => clearInterval(loadoutPoll), 'ui-skin-wukong: loadout poll')

  /* 若产品页面已有 theme-color meta（PWA 标题栏/移动状态栏），则恒写为 Void；
     产品没有该 meta 时皮肤不代为注入。 */
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

  /* 皮肤自有节点的变更绝不能再触发 sync——那个反馈环会 livelock 页面。
     attributes 分支与 childList 分支必须用同一条 skin-owned 过滤：未来皮肤自有
     节点（P2 HUD 等）若带 data-state，翻转它不能绕过防护。
     data-phase 是 ConversationRoot 根节点的 React 受控属性（hero/settling/
     active），phase 切换时只触发一次 attributes 记录，不伴随 childList 变更
     ——必须与 data-state 同列入 attributeFilter，否则封面永远不会随真实会话
     状态更新（只会停在挂载时的初值）。 */
  observer = new MutationObserver((records) => {
    let relevant = false
    let coverRelevant = false
    for (const record of records) {
      const skinOwnedTarget = record.target instanceof Element
        && record.target.closest('[data-skin-owner]') !== null
      if (record.type === 'attributes') {
        if (skinOwnedTarget) continue
        if (record.attributeName === 'data-state') relevant = true
        if (record.attributeName === 'data-phase') coverRelevant = true
        continue
      }
      if (skinOwnedTarget) continue
      const nodes = [...record.addedNodes, ...record.removedNodes]
      const skinOwned = nodes.every(node => (
        node instanceof Element && node.hasAttribute('data-skin-owner')
      ))
      if (nodes.length > 0 && !skinOwned) {
        relevant = true
        coverRelevant = true
      }
    }
    if (relevant) {
      engine.sync()
      refreshHud()
      seatLoadout()
    }
    if (relevant || coverRelevant) syncCover()
  })
  observer.observe(body, {
    attributes: true,
    attributeFilter: ['data-state', 'data-phase'],
    childList: true,
    subtree: true,
  })

  syncBackdrop()
  engine.sync()
  refreshHud()
  syncCover()
  seatLoadout()
}
