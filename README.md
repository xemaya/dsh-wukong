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

### P2 新增呈现

| 棍势 HUD（降妖，招式名+连击珠） | 岔路签文（choice 退暗+签文卡） | 披挂条（点击→原生模型菜单） |
| --- | --- | --- |
| ![hud](screenshots/shot-hud.png) | ![choice](screenshots/shot-choice.png) | ![loadout](screenshots/shot-loadout.png) |

| 章回 todo（第一回…回目编号） | 影神图 trajectory（纸纹+行分级左边线） |
| --- | --- |
| ![chapters](screenshots/shot-chapters.png) | ![trajectory](screenshots/shot-trajectory-zoom.png) |

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

## 项目状态：P0–P3 完成

### P0 / P1 —— 骨架、角色舞台、场景与转场

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
  的圆形裁切窗通过 `transform: scale` 二次放大聚焦头部。

### P2 —— 棍势 HUD / 岔路签文 / 披挂条 / 章回 / 影神图

真机 playtest 见 `.superpowers/sdd/2026-08-25-dsh-wukong-p2/task-6-report.md`：

- 棍势 HUD：`hud.ts` 仅 battle/alert 可见的顶部胶囊，招式名 + 四珠连击条，数据全部
  来自 `readBattleTelemetry` 对 `[data-chat-flow]` 工具行的真实读数（ok 累计、error
  清零、running 行取招式名），无假分母。真机验证：HUD 随工具执行实时刷新、珠数随
  真实 ok 行累积、label 随当前工具切换。
- 岔路签文：`[data-question-key]`/`[data-plan-review-key]`/`[data-approval-key]`
  卡片描边+渐变质感，触发时 `[data-chat-flow]` 退暗（opacity 0.55），选项
  `:focus-visible` 金色描边；纯 CSS 皮肤层，不克隆任何提交入口，原生点击/键盘
  Tab+Enter 提交路径完全未改动。真机用一个必然触发 `ask_user_question` 的任务验证
  通过（退暗生效、卡片质感生效、Tab 焦点环为 `--wk-gold2`、原生"提交"按钮点击后
  正常进入下一状态）。
- 披挂条：`loadout.ts` 在 composer 座位内渲染只读 chip，点击只转发原生模型触发器
  `.click()`，不做任何克隆提交；1.5s 轮询兜底 + mutation observer 双路刷新。真机
  验证：点击 chip 确实打开产品原生"模型/推理等级"菜单，原生菜单换挡（Off/High/
  Max）后 chip 文案在 1.5s 内（实测为下一次 DOM 变更即时触发，远快于轮询上限）刷新。
  模型名/棍势等级从原生触发器的 `title` 属性解析（`textContent` 本身无分隔符，见
  下方"已知限制"）。
- 章回 todo：`[data-testid='todo-panel'] li[data-status]` 前缀"第N回"（CJK 数字
  计数器），进行中=`--wk-ember`、完成=`--wk-jade`。真机验证：真实 3 步 todo 计划
  执行全程回目编号与灯色随 `data-status` 变化（completed 呈现为 jade；in-progress
  ember 色通过 computed style 直接验证）。
- 影神图 trajectory：`[data-trajectory-scroll]` 卷轴纸纹渐变，`[data-timeline-span]`
  内 user/tool/subtool 三类分级左边线（金/古铜/浅古铜），`[data-timeline-span][data-error='true']`
  转红。真机验证：真实 trajectory 页各字段 computed style 均匹配设计值；该边线画在顶部
  8px 高的迷你时间条上，视觉上是细节强调而非大面积色块，属设计既有形态。

### P3 —— 定身术与全篇加固收官

- 定身术：`vfx.ts` 的 `createOneShot` 通用一次性节点工厂（由水墨转场重构提炼）
  派生出 `createFreezeRing`——用户点击 Stop 且当前处于降妖态时，播放 900ms
  一次性金色定身圈定格动画，HUD 珠位同时追加 `wkBeadPulse` 点亮脉冲、受创态
  HUD 追加 `wkHudShake` 一次性震动，均只在属性翻转瞬间播放一次，
  `prefers-reduced-motion` 下全部关闭。Stop 按钮无稳定 data 钩子（详见
  `.superpowers/sdd/2026-08-25-dsh-wukong-p3/task-1-report.md` 的选择器发现记录），
  改用 `[data-composer-seat]` 祖先限定 + `aria-label` 正则 `/stop|停止/i` 在捕获
  阶段匹配点击。
- 加固批：
  - 影神图 error 选择器收紧为 `[data-timeline-span][data-error='true']`，避免误配
    非时间线节点上偶然同名的 `data-error` 属性。
  - 四档响应式舞台改写为 mobile-first / min-width 单向级联（不带 query 的基础规则
    即 <768 名牌头像档，`768px`/`1024px`/`1440px` 三个 min-width 断点逐级显式覆盖，
    1024px 起显式重置 border-radius/border/background/transform 回全身立绘值），
    消除旧版 max-width 分档写法潜在的分数像素缝隙；每档行为与旧实现逐一对照一致。
  - 披挂条轮询 `sync()` 增加 `chip.isConnected` 早退，chip 未挂载（尚未找到
    composer 座位，或皮肤已 dispose）时不做无意义的 DOM 读写。
  - `apply()` 补全 dispose 全清单单测：确认 dispose 后 body 无任何
    `[data-skin-owner]` 残留节点，清空的轮询定时器在之后也不再产生任何可观察
    副作用。
- 测试与构建：`pnpm test` 全绿 55 条用例（7 个测试文件）；`pnpm build` 通过。

## 已知限制

以下限制均为设计取舍或与上游 DOM 结构耦合导致的已知边界，非遗留 bug，记录以便
后续迭代参考：

- **披挂条模型名解析依赖 title 分隔符**：`loadout.ts` 优先解析原生模型触发器
  `title` 属性里的 `·`/`•`/`|` 分隔符拆出"模型 + 推理等级"；若上游把 `title`
  格式改为不含这三种分隔符之一，或分隔后不是恰好两段，会回退到 `textContent`
  拼接解析——但 `textContent` 本身没有分隔符，无法可靠拆出棍势等级，此时 chip
  只会显示拼接后的模型名，丢失棍势后缀。
- **`seenErrors` 按元素身份判重**：`contract.ts` 用 `WeakSet<Element>` 记录
  "已见过的错误行"做历史错误基线，前提是同一条错误消息在其生命周期内始终对应
  同一个 DOM 节点。若产品的消息列表引入虚拟化（滚出视口即回收/复用 DOM 节点），
  同一个 `Element` 可能先后代表不同的真实行，理论上可能出现新错误被误判为
  "已见过"（漏报受创），或历史错误因节点复用被误判为"新增"（误报受创）。当前
  产品 DOM 未观察到虚拟化，属潜在风险项而非已发生问题。
- **choice（岔路）信号仅走 childList 路径**：`index.ts` 的 `MutationObserver`
  只对 `attributeFilter: ['data-state', 'data-phase']` 的属性变更触发
  `engine.sync()`；`[data-question-key]`/`[data-plan-review-key]`/
  `[data-approval-key]` 的出现/消失目前都通过节点增删（`childList`）被捕获。
  若上游未来改为在已存在的节点上翻转这三个属性而不是增删节点来表达岔路态，
  皮肤不会捕捉到该信号。
- **双皮肤同时安装会 livelock**：提示保留在上方"安装"小节——两个 `ui-skin-*`
  皮肤插件同时启用会争抢同一套 DOM 观测/写入逻辑，实测导致页面主线程完全卡死；
  皮肤本身未做也不打算做自动检测或互斥防护，依赖使用者自律（同一时间只装一个）。

## 开发

```sh
pnpm test    # vitest，7 个测试文件、55 条用例（contract/cover/apply/stage/vfx/hud/loadout）
pnpm build   # tsdown 构建 lib/（node 入口 + client bundle）
```

> dsh 插件 bundle 变更后需重启 `dsh --profile web` 进程才生效（无热重载）。

## 许可

自用项目，不对外分发。
