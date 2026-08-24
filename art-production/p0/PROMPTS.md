# P1 美术资产生产提示词（交 codex）

产出目录：`art-production/p0/`（本目录）。验收通过后由实现者接入 `assets-gen/`，不要直接写 `assets-gen/`。
共 7 张：5 张天命人立绘 + 2 张黑风山场景。仅自用项目，可直接引用《黑神话：悟空》风格与"天命人"。

## 零、给 codex 的总要求（每张都附在提示词前面）

> 你在为一套 UI 皮肤生产游戏风格资产。硬性要求：
> 1. 立绘输出**透明背景 PNG**（若模型不支持 alpha，就在纯中灰 #808080 背景上生成，再抠图输出透明版，发丝/衣摆边缘不得有灰边或矩形残块）。
> 2. 画面里**绝对不能出现**：文字、水印、logo、UI 元素、签名、地面投影托底。
> 3. 五张立绘是**同一个角色**：同一张脸、同一套服装、同一光向（正面偏左上方的冷灰主光 + 微弱暖金轮廓光）、同一身体比例、同一落脚基准线。先生成 dialogue 姿势定稿作为角色基准，之后四张全部以它为参考图（img2img / 角色参考）生成，只改姿势与表情。
> 4. 每张先出 2–4 个候选，挑剪影最清晰的一张出高清成品。

## 一、角色设定卡（五张立绘共用，粘贴在每条立绘提示词开头）

**中文设定**：天命人——《黑神话：悟空》主角风格的年轻猴形武者。精瘦矫健（不是魁梧老猴王），棕红短毛，金色瞳，面容坚毅少年气。着装：破旧的深褐麻布短打 + 局部古铜/暗金甲片（左肩甲、护腕、腰甲），赤足或草鞋，腰间红绳。武器：如意金箍棒（深墨铁棒身、两端暗金箍）。整体气质：黑暗神话、写实幻想、水墨氛围，配色以墨黑、古铜、暗金、余烬橙为主。

**English core prompt（模型主提示）**:
`the Destined One from Black Myth: Wukong style, a lean agile young monkey warrior, reddish-brown short fur, golden eyes, resolute expression, wearing tattered dark-brown cloth shorts with bronze and old-gold armor pieces (left pauldron, bracers, waist guard), red cord at waist, holding a long black-iron staff with dark-gold bands (Ruyi Jingu Bang), dark mythological fantasy, realistic painterly style, ink-wash atmosphere, palette of ink black / bronze / old gold #B9813F / ember orange #B95B2F, single character, full body, clean silhouette, front-left cool key light with faint warm gold rim light, transparent background, no text, no watermark, no ground shadow`

**规格（五张相同）**：竖幅，宽高比约 2:3～9:16，**成品高度 ≥1600px**（目标 1600–2000px）；角色占画面高度约 85%，脚部完整可见；四角透明。

## 二、五张立绘（角色设定卡 + 以下姿势差分）

剪影必须五张互相可区分（不靠表情靠姿势）。

### 1. `tianming-dialogue-master.png` — 问道·待机
姿势：直立放松，双手拄棍于体前（棍尖点地），微微侧身，平静专注地看向画面左侧（消息区方向），尾巴自然下垂。
`standing at ease, both hands resting on the staff planted vertically in front, slight three-quarter turn, calm attentive gaze toward the left, relaxed shoulders, tail hanging naturally`

### 2. `tianming-choice-master.png` — 岔路·抉择
姿势：棍横扛于肩后，单手搭棍，头侧转目光锐利地投向画面左下（选项卡方向），另一只手半抬似在示意，重心偏一侧。
`staff carried horizontally across the shoulders behind the neck, one hand hooked over it, head turned sharply looking down-left, other hand half-raised in a gesturing motion, weight shifted to one leg`

### 3. `tianming-execution-master.png` — 降妖·战斗
姿势：战斗进行时——弓步，双手握棍斜挥至身侧，衣摆毛发被劲风带起，眼神凶悍，肢体张力拉满，剪影呈对角线。
`dynamic combat pose, deep lunge, both hands gripping the staff mid-swing across the body diagonal, cloth and fur whipped by motion, fierce battle expression, strong diagonal silhouette, sense of explosive movement`

### 4. `tianming-recovery-master.png` — 受创
姿势：单膝跪地，一手撑棍支住身体，另一手按住肋侧，低头喘息但未倒下，肩部甲片可有裂纹缺口，姿态传达"受挫但要站起来"。
`kneeling on one knee, one hand gripping the staff planted for support, other hand pressed against his ribs, head lowered breathing hard, cracked chipped pauldron, wounded but unbroken, about to rise`

### 5. `tianming-clear-master.png` — 功成·收势
姿势：背脊挺直立棍收势，棍垂直立于体侧，另一手自然下垂或轻拂尘，下颌微抬，平静的胜利感，微风拂动衣摆。
`upright victorious stance, staff planted vertically at his side, spine straight, free hand relaxed, chin slightly lifted, calm triumphant afterglow, light breeze in cloth and fur`

## 三、两张场景（16:9，宽 ≥1536px，建议 2048–2560px）

**共同要求**：黑风山意象——翻涌云海、嶙峋黑石山崖、半山古刹（飞檐、残破经幡、石灯笼）、远山如墨。构图：视觉重心偏画面右侧留出中央文字区（中央 1/3 纹理密度要低、对比要弱，UI 文字要叠在上面）。**画面内无任何角色、动物、文字、UI、水印**。写实厚涂 + 水墨氛围。
`Black Wind Mountain: rolling sea of clouds, jagged black rock cliffs, an ancient half-ruined temple on the mountainside with upturned eaves, tattered prayer banners and stone lanterns, distant ink-wash peaks, no characters, no text, no UI, painterly dark fantasy, cinematic wide shot, 16:9, low-detail low-contrast central third for UI text overlay`

### 6. `blackwind-dialogue-base.png` — 冷月版
`cold moonlit night, blue-grey moonlight from upper right, silver mist, quiet and serene, palette of ink black / cold slate blue / faint silver, temple windows faintly warm`
（冷月青灰主调，安静克制，庙窗一点微暖光。）

### 7. `blackwind-execution-base.png` — 余烬版
**必须与第 6 张同构图**：用第 6 张作 img2img 底图重打光，山形/庙位/云位不得移动。
`same exact composition relit: burning ember sky, fire-lit clouds from behind the peaks, ember orange #B95B2F and old gold rim light on rocks and temple, drifting sparks in the air, ominous battle atmosphere`
（火烧云余烬光，燃战氛围，可有零星火星飘浮。）

## 四、验收清单（codex 自检后交付）

- [ ] 立绘：透明 PNG、alpha 四角透明、发丝/手指/衣摆无色边残块
- [ ] 立绘：五张同脸同装同光向同比例，头部大小与落脚线连续切换不跳动（叠图检查）
- [ ] 立绘：高度 ≥1600px；剪影互相可区分（缩到 10% 高度仍能认出是哪个状态）
- [ ] 立绘：无文字/水印/背景残片/地面投影
- [ ] 场景：16:9、宽 ≥1536px；两张构图逐像素级一致仅光照不同；中央 1/3 低对比；无角色无文字无 UI
- [ ] 文件名与本文档完全一致，放入 `art-production/p0/`
