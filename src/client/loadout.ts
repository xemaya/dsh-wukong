/**
 * DSH // 天命 — 披挂条。显示当前模型（披挂）与 reasoning effort（棍势三式），
 * 数据从产品原生模型触发器读出；点击只转发原生触发器 click()。
 * 不克隆菜单，不做任何真实提交入口。
 */
import styles from './wukong.module.css'

const MODEL_SLOT_SELECTOR = "[data-slot='conversation.input.model']"
const TRIGGER_SELECTOR = `${MODEL_SLOT_SELECTOR} button[class*='_trigger'], ${MODEL_SLOT_SELECTOR} button`

export function stanceFor(effort: string): string {
  if (/low/i.test(effort)) return '戳棍势'
  if (/medium/i.test(effort)) return '立棍势'
  if (/high/i.test(effort)) return '劈棍势'
  return effort
}

export interface Loadout {
  chip: HTMLButtonElement
  sync(): void
}

export function createLoadout(): Loadout {
  const chip = document.createElement('button')
  chip.type = 'button'
  chip.dataset.skinOwner = 'wukong'
  chip.className = styles.loadoutChip
  chip.setAttribute('aria-label', '披挂：打开模型选择')
  chip.addEventListener('click', () => {
    document.querySelector<HTMLButtonElement>(TRIGGER_SELECTOR)?.click()
  })

  return {
    chip,
    sync(): void {
      const trigger = document.querySelector<HTMLButtonElement>(TRIGGER_SELECTOR)
      const raw = trigger?.textContent?.trim() ?? ''
      let text = '披挂 —'
      if (raw !== '') {
        const [model, effort] = raw.split(/\s*[·•|]\s*/, 2)
        text = effort === undefined
          ? `披挂 ${model}`
          : `披挂 ${model} · ${stanceFor(effort)}`
      }
      if (chip.textContent !== text) chip.textContent = text
    },
  }
}
