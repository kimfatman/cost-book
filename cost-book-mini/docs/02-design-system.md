# 02 · 设计系统

## 1. 设计方向

- **风格**：minimal-light，账本 / ledger 暖纸质感
- **气质关键词**：可信、克制、高信息密度、数字精确
- **背景**：暖纸 `#F5F3EE` + CSS data-URI 微噪点纹理（营造纸质账本氛围）
- **反 AI 套路约束**：无紫白渐变、无纯黑 `#000`、无 emoji 图标、无同款重阴影

## 2. 设计令牌（`styles.css :root`，唯一来源）

```css
--c-ink:#23201B;  --c-ink-2:#5C5952;  --c-ink-3:#9B978D;   /* 墨色三级 */
--c-paper:#F5F3EE; --c-card:#FFFFFF;  --c-card-2:#F0EDE6; --c-line:#E5E1D8;
--c-brand:#0D7261; --c-brand-2:#0A5C4F; --c-brand-soft:#E3EFEB;   /* 松青绿主色 */
--c-amber:#B97A12; --c-amber-soft:#F7EDDA;                          /* 警示/强调 */
--c-danger:#C24A38; --c-danger-soft:#F8E7E2;                        /* 异常/删除 */
--r-sm:8px; --r-md:12px; --r-lg:16px; --r-xl:22px;
--sh-sm/md/lg: 三级柔和阴影（暖色黑 35,32,27）
--f-body: 系统中文栈（PingFang SC / HarmonyOS Sans / 微软雅黑）
--f-num: 数字字体栈（Bahnschrift / DIN / Segoe UI）+ tabular-nums
```

**规则**：禁止在组件中硬编码新颜色；`--c-ink-3` 为最浅可用文字色。金额/数字一律 `.t-num`。

## 3. 字号与间距

- 字号体系：11 / 12 / 13 / 14 / 15 / 17 / 20 / 24 / 28 / 32（px）
- 间距：4px 基数（4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48）
- 图标：16 / 18 / 20 / 22px，`stroke-width: 1.8`，颜色 `currentColor`

## 4. 组件类清单（已冻结，新增页面必须复用）

| 类 | 用途 | 关键变体 |
|---|---|---|
| `.c-card` | 白卡 | `--flat` 无阴影；`--hero` 品牌渐变卡 |
| `.c-btn` | 按钮 | `--primary/--soft/--ghost/--danger` × `--sm/--md/--block` |
| `.c-tag` | 标签 | `--ok/--warn/--danger/--outline` |
| `.c-cell` | 列表行 | `__icon/__body/__title/__sub/__value/__arrow` |
| `.c-field` / `.c-input` / `.c-textarea` | 表单 | `.c-input--amount` 大号金额；`.c-input-phone` |
| `.c-seg` | 分段控件 | `.is-active` |
| `.c-chip` | 筛选胶囊 | `.is-active` |
| `.c-kpi` | 指标 | `__label/__num/__delta`（`--up/--down`） |
| `.c-switch` | 开关 | `.is-on` |
| `.c-search` | 搜索框 | focus 品牌色描边 |
| `.c-progress` / `.mini-bar` | 进度/比例条 | `__bar`（`--amber/--danger`） |
| `.c-bars` | 柱状图 | `__col` + `.bar--cost/.bar--rev`（`growBar` 动画） |
| `.donut` | 环形图 | `.ring .fg`（dashoffset 过渡） |
| `.c-table` | 报表表格 | `.num` 加粗数字列 |
| `.c-skeleton` | 骨架屏 | `__line/__box` + shimmer |
| `.c-empty` | 空状态 | icon + 文案 |
| `.c-toast` / `.c-sheet` / `.c-dialog` / `.c-mask` | 全局交互层 | `.is-show` |
| `.c-fab` | 悬浮按钮 | `.is-hidden` |
| `.c-group` / `.sec-title` / `.day-divider` / `.filterbar` | 分组与区块 | — |
| `.receipt-thumb` | 凭证缩略图 | `--img` 已添加态 |

## 5. 状态规范

所有可交互元素必须覆盖：`hover`（桌面）、`:active`（按压反馈）、`focus`（输入框品牌色描边）、`disabled`（`opacity .45`）、空态（`.c-empty`）、加载态（骨架屏）。

## 6. 动效规范

| 场景 | 实现 |
|---|---|
| 页面进入 | `.is-stack` slideIn 300ms（`translateX(56px)→0`） |
| 页面返回 | `.is-unstack` slideOut 300ms |
| 列表/图表入场 | `growBar` scaleY 动画，`animation-delay` 依次错开 |
| 环形图 | `stroke-dashoffset` 1s `var(--ease)` 过渡（mount 后 setTimeout 触发） |
| 预算进度条 | width 从 0 过渡到目标值 |
| Tab 图标 | 点击 scale(.92)；激活态带 drop-shadow |
| 全局缓动 | `--ease: cubic-bezier(.4,0,.2,1)` |

## 7. 图标规范

- 唯一图标库：Lucide（内联 SVG，离线）
- 禁 emoji 作图标；同一含义全站用同一图标（如"返回"一律 `arrow-left`）
- 常用映射：记账 `wallet`、分析 `pie-chart`、菜品 `utensils`、报表 `file-text`、供应商 `truck`、删除 `trash-2`、编辑 `pencil`、异常 `alert-triangle`、上升/下降 `trending-up/down`
