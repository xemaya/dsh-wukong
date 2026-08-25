/**
 * 土地庙 — New Session 全屏封面层。纯呈现：不拦截任何输入，
 * pointer-events 仅落在封面自身装饰上，composer 等原生控件在其上层。
 */
import { WK_COVER, WK_TUDIMIAO } from './art.generated.ts'
import styles from './wukong.module.css'

export function createCover(): { cover: HTMLDivElement; setVisible(visible: boolean): void } {
  const cover = document.createElement('div')
  cover.dataset.skinOwner = 'wukong'
  cover.setAttribute('aria-hidden', 'true')
  cover.className = styles.cover
  cover.innerHTML = `
    <img class="${styles.coverArt}" alt="" src="${WK_COVER}"/>
    <div class="${styles.coverCopy}">
      <span class="${styles.coverKicker}">DeepSeek Harness · Black Myth Wukong</span>
      <h1 class="${styles.coverTitle}">直 面 天 命</h1>
    </div>
    <img class="${styles.coverShrine}" alt="" src="${WK_TUDIMIAO}"/>`
  return {
    cover,
    setVisible(visible: boolean): void {
      if (visible) cover.dataset.visible = ''
      else delete cover.dataset.visible
    },
  }
}
