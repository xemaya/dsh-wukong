# DSH // 天命 · 黑神话悟空皮肤

DeepSeek Harness Web GUI 的原创主题皮肤：以《黑神话：悟空》的墨黑与老金为基调，
把「天命人」映射为可见的 agent 化身。**仅供本人自用**，非官方 franchise 联名，
不含任何游戏原始素材（角色画面为原创/AI 生成，游戏名仅作主题致意）。

一切呈现均来自产品真实 DOM 证据驱动的五态状态机（问道 / 岔路 / 降妖 / 受创 / 功成），
不伪造任何进度。

## 预览

| 新会话封面（冷月，舞台隐藏） | 问道态（会话中，冷月背景） | 执行态（降妖，余烬背景+挥棍姿势） |
| --- | --- | --- |
| ![cover](screenshots/shot-cover.png) | ![stage](screenshots/shot-stage.png) | ![battle](screenshots/shot-battle.png) |

| 旧会话（历史错误不误报） | 卸载后恢复原生 |
| --- | --- |
| ![old-session](screenshots/shot-old-session.png) | ![uninstalled](screenshots/shot-uninstalled.png) |

### 四档响应式舞台

| ≥1440px 全身 | 1024–1439px 半身 | 768–1023px 胸像 | <768px 名牌头像 |
| --- | --- | --- | --- |
| ![full](screenshots/shot-tier-full.png) | ![half](screenshots/shot-tier-half.png) | ![bust](screenshots/shot-tier-bust.png) | ![plate](screenshots/shot-tier-plate.png) |

## 安装

```sh
pnpm install
pnpm build
dsh plugin --profile web add -w /path/to/dsh-wukong
```

卸载（恢复原生标题 / favicon / 背景 / body 属性）：

```sh
dsh plugin --profile web remove @dsh-external/dsh-wukong
```

> 一个 dsh web 实例同一时间只应启用一个 `ui-skin-*` 皮肤插件。两个皮肤
> 插件同时安装会互相争抢同一套 DOM 观测/写入逻辑，实测会导致页面主线程
> livelock（完全卡死，DevTools 也无法执行任何脚本）。若本机已装有其他
> 皮肤（如 dsh-afterglow），请先卸载它再安装本皮肤。

## P0/P1 状态

P0、P1 均已完成（骨架 + 可安装 + 五态状态机 + New Session 封面 + 角色舞台 + 场景双光照 +
水墨转场 + 真机 playtest）：

- 骨架：`contract.ts` 五态状态机（含历史错误基线，重载旧会话不会误报"受创"）、
  `--wk-*` token、New Session 封面页（"直 面 天 命"）。
- 角色舞台：`stage.ts` 五态立绘双层交叉淡入淡出，四档响应式（≥1440 全身 /
  1024–1439 半身 / 768–1023 胸像 / <768 名牌头像），空会话时舞台隐藏。
- 场景双光照：问道/岔路=冷月版背景，降妖/受创=余烬版背景，随 `data-wukong-state`
  切换。
- 水墨转场：`vfx.ts` 一次性 620ms 墨晕特效，状态切换时播放，reduced-motion 下不播。
- 美术资产处理：由 `art-production/` 原图经 cwebp 压缩为 `assets-gen/*.webp` 内嵌，
  `art.generated.ts` 由 `tools/embed-assets.mjs` 自动生成，无需手动改动。
- 真机 playtest（Playwright MCP 驱动本机 dsh web GUI）：会话中立绘/背景随真实工具调用
  状态切换、四档响应式实测、卸载→刷新→全还原→重装恢复全链路验证通过；胸像/名牌头像档
  的圆形裁切窗通过 `transform: scale` 二次放大聚焦头部（P1 用裁切顶数，专门胸像半身图
  留给 P3）。
- P2–P3（HUD / 棍势特效 / 岔路呈现 / 披挂装备位 / 章回节奏 / 影神图 / 专门胸像美术）
  不在本轮范围内。

## 开发

```sh
pnpm test    # vitest，contract/cover/apply 三组用例
pnpm build   # tsdown 构建 lib/（node 入口 + client bundle）
```

## 许可

自用项目，不对外分发。
