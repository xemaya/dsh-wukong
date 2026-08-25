/**
 * DSH // 天命 — 一次性特效。状态切换时全屏墨晕擦过（水墨转场）；
 * 用户点 Stop 打断降妖态时金圈定格（定身术）。
 * 反馈不是灯光秀：同一时刻至多一层，reduced-motion 下完全不播。
 */
import styles from './wukong.module.css'

export interface InkTransition {
  play(): void
  dispose(): void
}

function createOneShot(className: string, ms: number, decorate?: (node: HTMLDivElement) => void): InkTransition {
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
      decorate?.(node)
      document.body.append(node)
      timer = setTimeout(() => {
        node?.remove()
        node = undefined
        timer = undefined
      }, ms)
    },
    dispose(): void {
      if (timer !== undefined) clearTimeout(timer)
      node?.remove()
      node = undefined
    },
  }
}

export const createInkTransition = (): InkTransition => createOneShot(styles.inkWipe, 620)

/* 定身术总时长 1150ms（1.1–1.2s 区间），须与 wukong.module.css 的
   wkFreeze/wkFreezeFlash/wkFreezeGlyph 三条 animation-duration 保持同步，
   否则节点会在动画播完前被移除，出现闪断。金圈之外叠加全屏金色 vignette
   闪光（::before）与中央大号"定"字（.freezeGlyph），反馈原版金圈太弱。 */
export const createFreezeRing = (): InkTransition => createOneShot(styles.freezeRing, 1150, (node) => {
  const glyph = document.createElement('span')
  glyph.className = styles.freezeGlyph
  glyph.textContent = '定'
  node.append(glyph)
})
