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

  const mountSlot = (title: string): void => {
    document.body.innerHTML = `<div data-slot="conversation.input.model">
      <button class="x_trigger_x">${title}</button></div>`
  }

  it('sync 从原生触发器读出模型与棍势', () => {
    mountSlot('DeepSeek R1 · high')
    const { chip, sync } = createLoadout()
    sync()
    expect(chip.textContent).toContain('DeepSeek R1')
    expect(chip.textContent).toContain('劈棍势')
  })

  it('点击转发原生触发器', () => {
    mountSlot('M · low')
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
