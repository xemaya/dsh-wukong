import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLoadout, stanceFor } from './loadout.ts'

describe('stanceFor', () => {
  it('三式映射', () => {
    expect(stanceFor('low')).toBe('戳棍势')
    expect(stanceFor('Medium')).toBe('立棍势')
    expect(stanceFor('HIGH')).toBe('劈棍势')
    expect(stanceFor('ultra')).toBe('ultra')
  })
})

describe('createLoadout', () => {
  afterEach(() => { document.body.innerHTML = '' })

  // 真实产品 DOM 形状（见 task-6-report.md）：模型名与推理等级分别渲染在两个
  // 无分隔符的 <span> 里（textContent 拼接后没有分隔符），分隔符 "·" 只出现在
  // trigger 的 title 属性里。
  const mountSlot = (model: string, effort?: string): void => {
    const title = effort === undefined ? model : `${model} · ${effort}`
    const effortSpan = effort === undefined ? '' : `<span class="_7KE1Ra_triggerEffort">${effort}</span>`
    document.body.innerHTML = `<div data-slot="conversation.input.model">
      <button class="_7KE1Ra_trigger" title="${title}"><span class="_7KE1Ra_triggerLabel">${model}</span>${effortSpan}</button></div>`
  }

  it('sync 从原生触发器 title 属性读出模型与棍势', () => {
    mountSlot('DeepSeek R1', 'high')
    const { chip, sync } = createLoadout()
    sync()
    expect(chip.textContent).toContain('DeepSeek R1')
    expect(chip.textContent).toContain('劈棍势')
  })

  it('点击转发原生触发器', () => {
    mountSlot('M', 'low')
    const { chip, sync } = createLoadout()
    sync()
    const trigger = document.querySelector<HTMLButtonElement>("[data-slot='conversation.input.model'] button")!
    const spy = vi.fn()
    trigger.addEventListener('click', spy)
    chip.click()
    expect(spy).toHaveBeenCalledOnce()
  })

  it('无触发器时 chip 显示占位不抛错', () => {
    const { chip, sync } = createLoadout()
    sync()
    expect(chip.textContent).toContain('—')
  })
})
