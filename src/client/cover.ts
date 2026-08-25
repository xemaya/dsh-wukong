/**
 * 土地庙 — New Session 全屏封面层 + 存档点入口。
 *
 * 封面本体（美术图 + 文案）仍是纯装饰：pointer-events 落在皮肤自有
 * 装饰上不拦截任何产品输入。土地庙不再是装饰 img——它是皮肤自有的
 * 真按钮：点击只切换皮肤自身的 data-wk-shrine-open 展示态（封面美术
 * 淡出，露出封面之下、结构上本就独立于 div[data-phase] 的原生侧栏
 * 会话列表），不代产品做任何提交/导航，因此允许作为真实交互控件存在。
 *
 * 无障碍：可聚焦按钮不得嵌在 aria-hidden 子树里——封面根节点不再整体
 * aria-hidden，改为只在纯装饰的美术图/文案节点上单独标注 aria-hidden，
 * 土地庙按钮保持在无障碍树里可达。
 */
import { WK_COVER, WK_TUDIMIAO } from './art.generated.ts'
import styles from './wukong.module.css'

export interface Cover {
  cover: HTMLDivElement
  setVisible(visible: boolean): void
  /** 移除土地庙 Escape 监听（document 级），皮肤 dispose 时必须调用。 */
  dispose(): void
}

export function createCover(): Cover {
  const cover = document.createElement('div')
  cover.dataset.skinOwner = 'wukong'
  cover.className = styles.cover
  cover.innerHTML = `
    <img class="${styles.coverArt}" alt="" aria-hidden="true" src="${WK_COVER}"/>
    <div class="${styles.coverLeft}">
      <div class="${styles.coverCopy}" aria-hidden="true">
        <span class="${styles.coverKicker}">DeepSeek Harness · Black Myth Wukong</span>
        <h1 class="${styles.coverTitle}">直 面 天 命</h1>
      </div>
      <button type="button" class="${styles.coverShrine}" aria-label="土地庙：查看历史对话">
        <span class="${styles.coverShrineFigure}">
          <img class="${styles.coverShrineArt}" alt="" aria-hidden="true" src="${WK_TUDIMIAO}"/>
          <span class="${styles.coverShrineSmoke}" aria-hidden="true">
            <span class="${styles.smokeWisp}"></span>
            <span class="${styles.smokeWisp}"></span>
            <span class="${styles.smokeWisp}"></span>
          </span>
        </span>
        <span class="${styles.coverShrineHint}" aria-hidden="true">土地庙 · 历史对话</span>
      </button>
    </div>`

  const shrine = cover.querySelector<HTMLButtonElement>(`.${styles.coverShrine}`)
  if (shrine === null) throw new Error('unreachable: cover markup missing shrine button')

  const closeShrine = (): void => { delete cover.dataset.wkShrineOpen }
  const toggleShrine = (): void => {
    if (cover.dataset.wkShrineOpen === undefined) cover.dataset.wkShrineOpen = ''
    else closeShrine()
  }
  shrine.addEventListener('click', toggleShrine)

  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return
    if (cover.dataset.wkShrineOpen === undefined) return
    closeShrine()
  }
  document.addEventListener('keydown', onKeydown)

  return {
    cover,
    setVisible(visible: boolean): void {
      if (visible) {
        cover.dataset.visible = ''
      } else {
        // 会话不再是空存档点（真实会话已产生内容）：封面本就要隐去，
        // 土地庙展开态一并复位，避免下次封面重新出现时残留“已展开”。
        delete cover.dataset.visible
        closeShrine()
      }
    },
    dispose(): void {
      document.removeEventListener('keydown', onKeydown)
    },
  }
}
