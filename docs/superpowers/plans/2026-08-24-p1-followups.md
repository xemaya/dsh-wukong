# P0 终审随行项 — P1 实施时一并处理

来源：2026-08-24 P0 全分支终审（Ready，无阻塞项）。P1 触碰同一批文件时批量处理。

## 加固（优先）

1. **观察者两分支 skin-owner 过滤对齐**（`src/client/index.ts`）：childList 分支的 added/removed 检查目前只认 `data-skin-owner === 'wukong'`，改为任意 `[data-skin-owner]` 节点都跳过——消除 wukong 在未来双皮肤互触发环路中的自身贡献（attributes 分支已是 any-skin 语义）。
2. **choice 信号只走 childList**：`data-question-key` 等不在 attributeFilter 里；若产品未来改为在既有节点上翻属性会漏检。P2 岔路接管任务落地时必须重估此信号面。
3. **`seenErrors` 以元素身份为键**：若 chat flow 虚拟化/重挂历史错误行会误判新错误触发假受创。现无证据 dsh 虚拟化；P2 棍势/HUD 接工具行时复查。
4. **goalCleared 部分完成用例补测**（~4 行）：现测试只覆盖"无 todo"半边；部分完成误触发功成属 §2 硬规则违例。

## 文档/卫生

5. README「从 assets-gen/*.webp」→ 实际是 .png；`tools/embed-assets.mjs` 头注释残留 afterglow 的 tool-emblems/AG_EMBLEMS 段落；package.json `files` 列了不存在的 `preview/`、license MIT 与自用不分发的表述矛盾（private:true 下均无实效）。
6. **封面无障碍**：cover 根节点加 `aria-hidden="true"`（纯装饰层，h1 不应进读屏标题导航）。
7. token 纯度小项：主按钮 border `#a86b34` 可改 `var(--wk-bronze)`。
8. 若 index.ts 的 chrome 类直写（theme-color meta）继续增多，拆 `chrome.ts` 模块保持 contract.ts 唯一 DOM 读者边界的例外是显式的。

## 环境备忘

- **双皮肤 livelock**：afterglow 与 wukong 同装会互相触发观察循环冻死页面（Task 7 二分实证）。当前机器状态：wukong 已安装，afterglow 已卸载。恢复 afterglow：`dsh plugin --profile web add -w ~/Workspace/deepseek/dsh-afterglow`（需先卸载 wukong）。
