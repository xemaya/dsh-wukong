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

function createOneShot(className: string, ms: number): InkTransition {
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
export const createFreezeRing = (): InkTransition => createOneShot(styles.freezeRing, 900)
