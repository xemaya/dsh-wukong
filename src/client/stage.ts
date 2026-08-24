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
