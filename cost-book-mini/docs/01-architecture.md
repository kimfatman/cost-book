# 01 · 整体架构

## 1. 架构分层

```
┌─────────────────────────────────────────────┐
│  index.html  应用外壳（Shell）                │
│  状态栏 / 导航栏 / 11 屏容器 / TabBar / FAB   │
│  全局交互层（toast / mask / sheet / dialog）  │
├─────────────────────────────────────────────┤
│  app.js      应用核心                        │
│  · 路由栈（Tab 切换 + 子页 push/pop）        │
│  · 全局 UI（toast/confirm/sheet/dialog）     │
│  · 模块注册调度（App.register + mount）      │
│  · 4 个 Tab 屏渲染（home/record/analysis/mine）│
├─────────────────────────────────────────────┤
│  subpages.js 子页模块（7 个，各自 IIFE）      │
│  form / product / product-detail /          │
│  reports / report-detail / suppliers /      │
│  categories                                 │
├─────────────────────────────────────────────┤
│  api.js      API 桩层（16 个异步接口）        │
│  mock.js     单一数据源（window.DB）          │
│  icons.js    离线图标库（window.ICONS）       │
└─────────────────────────────────────────────┘
```

**依赖方向单向向下**：页面 → api 桩 → mock 数据。页面禁止直接散写业务数据。

## 2. 路由机制

### 2.1 页面注册

每个页面在 `index.html` 中预置一个 `<section class="screen" data-screen="xxx" data-title="标题">`。Tab 屏额外带 `is-tab` 类。

### 2.2 导航 API（`app.js` 中的 `App` 对象）

| 方法 | 行为 |
|---|---|
| `App.showTab('record')` | 切换到底部 Tab（TabBar 点击触发） |
| `App.go('product', {productId: 'p1'})` | 进入子页并压栈；目标为 Tab 屏时自动走 Tab 切换 |
| `App.back()` | 弹栈返回上一屏（带 slide 动效） |
| `data-navto="xxx"` 属性 | DOM 全局委托：点击任意带此属性的元素即 `App.go` |
| `App.ctx` | 页面间传参容器（进入子页时传入，如 `{productId}`、`{formEdit}`） |

### 2.3 关键约定

- **App.ctx 合并而非覆盖**：`go()` 内部用 `Object.assign(App.ctx, opts)`，因此 `formPreset` 等跨页状态不会被意外清掉。
- **Tab 去重**：同一 Tab 重复点击不会重复入栈；栈中已有的同名 Tab 会先被移除再入栈。
- **每屏只有一个 active**：`body[data-screen]` + `.screen.is-active` 是唯一激活机制，导航状态由路由统一维护。

## 3. 模块注册与生命周期

页面逻辑通过 `App.register({ id, mount, demount, reload })` 注册：

```js
App.register({
  id: 'product',                    // 必须与 section 的 data-screen 一致
  mount: mountProduct,              // 进入时调用：渲染 + 绑定事件
  demount: demountProduct,          // 离开时调用：清理临时状态
  reload: reloadRecord              // 可选：同屏二次激活时刷新
});
```

- `mount` 内一律使用 `App.on(el, event, fn)` 绑定事件。
- `demount` 时 `App.on` 绑定的事件会被**自动统一解绑**（事件托管，见 §4），避免重复绑定。
- `demount` 中应清理 `App.ctx` 中的临时字段（如 `formEdit`）。

## 4. 事件托管

`app.js` 维护一个事件注册表 `els`：

- `App.on(el, ev, fn)` 记录并绑定；
- 每次 `mountModule` 切换模块前调用 `clearEls()` 统一解绑上一模块全部事件；
- **因此模块内不要直接用 `addEventListener` 绑页面级事件**（modal 内部临时元素除外，需自行清理），否则会出现重复触发。

## 5. API 桩层约定（接后端的关键）

`api.js` 中每个函数：

- 名称/入参/返回结构 = 未来真实接口的形状；
- 内部 `await delay(300~600)` 模拟网络延迟，使骨架屏/loading 可见；
- 返回统一 `{ code: 0, data: ... }`；
- 函数上方保留 `// TODO: replace with GET/POST/DELETE /api/xxx ...` 注释，接后端时按注释逐条替换为 `fetch` 即可。

完整契约见 [04-api-contract.md](04-api-contract.md)。

## 6. 渲染流程（以记账页为例）

```
mountRecord()
  ├─ renderRecordShell()    渲染统计条 + 筛选条 + 容器（#recListBox）
  ├─ loadRecords()          #recListBox 先填骨架屏
  │    └─ api.getRecords({type, keyword, cat})
  │         └─ 分组渲染：day-divider + c-card 列表
  │              └─ 行绑定 App.on(click) → sheet 动作面板
  └─ 筛选条件变化 → reloadRecord() → 重新执行上述流程
```

- 首次进入显示骨架屏 → 数据返回后渲染；空结果显示 `.c-empty`。
- 所有列表行、卡片、按钮带 `:active` 按压反馈。

## 7. 图标机制

- `icons.js` 导出 `window.ICONS`（`{ 'icon-name': '<svg>...</svg>' }`）与 `window.injectIcons()`。
- 静态 HTML 中：`<i class="ic" data-ic="wallet"></i>`，启动时 `injectIcons()` 统一注入。
- JS 生成 HTML 中：`icTag('wallet', 16)`（子页）或 `App.ic('wallet', 16)`（app.js 内）。
- 新增图标步骤：向 `icons.js` 的 `ICONS` 对象追加一项（值来自 lucide.dev 的 SVG），或运行时 `window.ICONS.name = '<svg>...'` 兜底。

## 8. 全局 UI 组件

| 组件 | 调用 | 说明 |
|---|---|---|
| Toast | `App.toast('已保存')` | 顶部胶囊提示，1.9s 自动消失 |
| 确认弹窗 | `App.confirm({title, desc, danger, onOk})` | 二次确认 |
| 动作面板 | `App.sheet([{icon, label, danger, onClick}], title)` | 底部弹出 |
| 详情弹窗 | `App.showMask()` + 复用 `.c-dialog` | 查看详情等 |
| 日期面板 | `DatePicker.show(initVal, cb)` | 子页共享（演示 2026-07） |
| 骨架屏 | `App.skeleton('list' | 'kpi')` / `skel('list')` | 加载占位 |
