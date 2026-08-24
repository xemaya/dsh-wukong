/**
 * DSH // 天命 — 黑神话悟空皮肤客户端入口。
 *
 * 仅呈现层：一切写入以 body[data-dsh-wukong] 为作用域，cordis effect
 * disposer 完整还原。状态由 contract.ts 从产品真实 DOM 证据推导。
 */
import type { Context } from '@deepseek-ai/cordis'
import { createContractEngine, isEmptySession, type SkinState } from './contract.ts'
import { createCover } from './cover.ts'
import { createStage } from './stage.ts'
import { createInkTransition } from './vfx.ts'
import { WK_ICON, WK_BG_DIALOGUE, WK_BG_EXECUTION } from './art.generated.ts'
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
  const ink = createInkTransition()
  ctx.effect(() => () => ink.dispose(), 'ui-skin-wukong: ink transition')

  let stateBaselined = false
  const onState = (state: SkinState): void => {
    body.dataset.wukongState = state
    setPose(state)
    syncBackdrop()
    if (stateBaselined) ink.play()
    stateBaselined = true
  }
  const engine = createContractEngine(body, onState)

  const { cover, setVisible } = createCover()
  const syncCover = (): void => {
    const empty = isEmptySession(body)
    setVisible(empty)
    if (empty) body.dataset.wukongEmpty = ''
    else delete body.dataset.wukongEmpty
  }

  ctx.effect(() => () => {
    engine.dispose()
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
    if (relevant) engine.sync()
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
  syncCover()
}
