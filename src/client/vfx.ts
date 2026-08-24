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
