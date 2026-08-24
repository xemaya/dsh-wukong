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
     节点（P2 HUD 等）若带 data-state，翻转它不能绕过防护。 */
  observer = new MutationObserver((records) => {
    let relevant = false
    for (const record of records) {
      const skinOwnedTarget = record.target instanceof Element
        && record.target.closest('[data-skin-owner]') !== null
      if (record.type === 'attributes') {
        if (record.attributeName === 'data-state' && !skinOwnedTarget) relevant = true
        continue
      }
      if (skinOwnedTarget) continue
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
