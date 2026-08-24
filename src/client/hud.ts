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
