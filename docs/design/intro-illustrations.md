# 第零课插图：生成提示词与规格

用途：给第零课「认识数学建模」配 6 张情景插图，交给 ChatGPT / Codex 的图片生成批量出图。
原则：**插图只负责营造情景，不承载数据**。图中不出现任何文字、数字、Logo；凡是带数字的图示（雨伞调配、出门时刻、九步流程）都由页面代码绘制和动画，保证与实时计算一致。

## 1. 统一规格（每张都要满足）

| 项 | 要求 |
|---|---|
| 尺寸 | 1600 × 900（16:9）；第 6 张可 1600 × 1000 |
| 格式 | WebP / PNG / JPG 均可；放进 `frontend/src/learning/intro/img/`，文件名与下表完全一致即自动显示（缺哪张就不显示哪张）。上线前建议转成 WebP，每张 ≤ 150 KB |
| 背景 | 纯色暖白 `#FAF9F5`，四周留 6% 安全边（页面会放进圆角卡片，深色主题下卡片保持浅底） |
| 文字 | **完全不要文字、数字、字母、招牌、Logo、真实学校标识** |
| 人物 | 大学生，简洁无脸部细节或简化五官，衣着日常，性别与外貌多样，不刻板 |
| 文件名 | 按下表 `intro-0X-xxx.png` |

## 2. 统一风格前缀（每条提示词前都加上）

```
Flat editorial vector illustration, clean geometric shapes, soft grain texture, limited palette:
deep teal #157A6E, mint #91E4C8, warm orange accent #B55313, slate #1B2A2F, warm off-white background #FAF9F5.
Calm, modern, friendly, for a university learning website. Simplified faces, no facial detail.
Absolutely no text, no letters, no numbers, no signs with writing, no logos, no watermarks.
Generous empty margin around the scene. 16:9.
```

## 3. 六张插图

| # | 文件名 | 放在哪里 | 画面要说明的事 |
|---|---|---|---|
| 1 | `intro-01-rain-umbrellas.png` | 课程封面 | 本课的引子：伞够，但放错了地方 |
| 2 | `intro-02-walk-to-class.png` | 第 1 节表 1 前 | 同一段路，题目没说的条件（红绿灯、书包、手机、天气） |
| 3 | `intro-03-map-vs-metro.png` | 第 1 节“地铁线路图”段 | 模型是简化：真实街区 vs 简化线路图 |
| 4 | `intro-04-morning-rush.png` | 第 3 节开头 | 小周赶早八、用手机计时记录数据 |
| 5 | `intro-05-team-table.png` | 第 4 节开头 | 三类工作互相交叉，不是各干各的 |
| 6 | `intro-06-three-paths.png` | 第 9 节开头 | 学完第零课，三条路线可选 |

### 1 · 雨天的两个雨伞点（封面）
```
A rainy university campus seen from a slightly elevated angle. On the left, the entrance of a modern
teaching building with a small umbrella rack that is almost empty, and a short line of students waiting
under the eaves, one checking the sky. On the right, in the distance, a dormitory area with a second
umbrella rack that is full of folded teal umbrellas and nobody around. A faint dashed path connects the
two racks across a wet plaza with puddles reflecting light. Soft diagonal rain lines.
```

### 2 · 去教学楼的路
```
A morning campus road from a dormitory on the left to a teaching building on the right, drawn as a
gentle curve. Along the road: one pedestrian crossing with a traffic light (light shown as plain colored
circles, no symbols), a student carrying a heavy backpack while looking at a phone, another student
walking briskly, a few clouds with a hint of drizzle above half of the road. Small dotted markers along
the path suggest distance without any numbers.
```

### 3 · 真实街区与简化线路图
```
Split composition. Left half: a detailed bird's-eye view of a dense city district with winding streets,
trees, rooftops and a river. Right half: the same area reduced to a clean transit-style diagram with three
colored straight lines (teal, orange, slate) at 45 and 90 degree angles, round station dots and two
interchange rings. A subtle arrow or transition between the halves shows simplification.
No station names, no text of any kind.
```

### 4 · 赶早八
```
Early morning on campus, cool light. A student hurrying along a path toward a teaching building, holding
a phone that shows a stopwatch-like circular progress ring (no digits). A few small floating cards around
the phone suggest several days of records as simple bars of different lengths, one bar with a tiny rain
cloud icon. Long morning shadows, a bicycle parked nearby.
```

### 5 · 建模队的一张桌子
```
Three university students around one table, working together. One stands at a small whiteboard drawing
abstract shapes and arrows (no writing). One has a laptop showing a simple bar chart and a line chart.
One is writing a document on a tablet with page outlines. They are pointing at each other's work and
talking, with visual lines connecting the whiteboard, the chart and the document to show the work is
shared. Coffee cups, sticky notes without writing.
```

### 6 · 三条路线
```
A friendly crossroads on a campus lawn. A student with a small backpack stands at the start of three
paths that lead toward three distinct landmarks: a path to a workshop with gears and stacked boxes
(optimization), a path to an observatory-like building with a rising curve drawn in the sky (prediction),
a path to a garden with balance scales and ranked podium blocks (evaluation). Signposts are blank wooden
boards with only simple icons, no words.
```

## 4. 接入状态（2026-10-17）

**已接入：极简版 V2**（负责人选定）。六张 1600 × 900 WebP，每张 28–50 KB，共约 234 KB，懒加载；页面按 2:1 显示，只裁掉上下少量留白。替代文字已按实际画面重写；第 4、9 节的图加了说明文字。



- 六个位置都已在代码中预留（`illustrations.tsx`），中文替代文字（alt）已写好；图片懒加载、固定 16:9，不会造成页面跳动；
- 深色主题下图片放在浅底圆角卡片中；
- 交回图片后我还会：转 WebP 压缩、手机 375 宽检查裁切；
- 在 `docs/content/intro-course-sources.md` 注明“插图由 AI 生成，经人工挑选”；
- 检查图中是否意外出现文字、数字或类似真实品牌的元素，有就退回重做。

## 5. 代码动画（已实现，`UmbrellaScene.tsx`）

- 雨伞调配：**1 个图标 = 1 把伞**，两点各一个 8 列网格；虚线方框是需要伞的人，橙色虚线框 = 想借却没借到的人，灰色伞 = 多出来没人借。拖动 x 时，恰好 |Δx| 把伞从一点飞到另一点（其余伞原地不动，带轻微先后次序），时长 0.65 秒；
- 出现在雨伞案例第 2 步（现状）、第 4 步（调配）和第 5 步（你的方案遇到新需求）；
- 细雨：CSS 动画；系统开启“减少动态效果”时不显示，调配也变成瞬间完成；
- 场景是装饰（`aria-hidden`），所有数字仍以文字给出；没有引入新依赖，没有 GIF / 视频。
