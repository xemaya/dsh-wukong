import type { Context } from '@deepseek-ai/cordis'
import './wukong.module.css'

export function apply(ctx: Context): void {
  const body = document.body
  ctx.effect(() => () => {
    delete body.dataset.dshWukong
  }, 'ui-skin-wukong: presentation layer')
  body.dataset.dshWukong = ''
}
