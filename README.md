# DSH // 天命 · 黑神话悟空皮肤

DeepSeek Harness Web GUI 的原创主题皮肤：以《黑神话：悟空》的墨黑与老金为基调，
把「天命人」映射为可见的 agent 化身。**仅供本人自用**，非官方 franchise 联名，
不含任何游戏原始素材（角色画面为原创/AI 生成，游戏名仅作主题致意）。

一切呈现均来自产品真实 DOM 证据驱动的五态状态机（问道 / 岔路 / 降妖 / 受创 / 功成），
不伪造任何进度。

## 预览

| 新会话封面 | 执行态（降妖） |
| --- | --- |
| ![cover](screenshots/shot-cover.png) | ![battle](screenshots/shot-battle.png) |

| 旧会话（历史错误不误报） | 卸载后恢复原生 |
| --- | --- |
| ![old-session](screenshots/shot-old-session.png) | ![uninstalled](screenshots/shot-uninstalled.png) |

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

P0 完成（骨架 + 可安装 + 五态状态机 + New Session 封面 + 立绘/场景美术接入）；P1 实施中：

- 已完成：仓库骨架、`contract.ts` 五态状态机（含历史错误基线，重载旧会话不会
  误报"受创"）、`--wk-*` token、New Session 封面页（"直 面 天 命"）、立绘与场景
  美术资产、安装 / 卸载 / 重装全链路 playtest 验证。
- 美术资产处理：由 `art-production/p0/` 原图经 cwebp 压缩为 `assets-gen/*.webp` 内嵌，
  `art.generated.ts` 由 `tools/embed-assets.mjs` 自动生成，无需手动改动。
- P1–P3（HUD / 棍势特效 / 岔路呈现 / 披挂装备位 / 章回节奏 / 影神图 / VFX）不在本轮范围内。

## 开发

```sh
pnpm test    # vitest，contract/cover/apply 三组用例
pnpm build   # tsdown 构建 lib/（node 入口 + client bundle）
```

## 许可

自用项目，不对外分发。
