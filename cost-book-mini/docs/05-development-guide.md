# 05 · 二次开发指南

## 1. 新增一个页面（完整步骤）

以新增「进货单管理」页为例：

**Step 1 · 注册屏幕**（`index.html`）

```html
<!-- 子页示例 -->
<section class="screen" data-screen="purchase" data-title="进货单"></section>
<!-- 若是底部 Tab：加 is-tab 类，并在 .tabbar 内追加 <a data-tab="purchase"> -->
```

**Step 2 · 写模块**（`subpages.js` 追加 IIFE）

```js
(function () {
  'use strict';
  function mountPurchase() {
    var sec = App.$('.screen[data-screen="purchase"]');
    sec.innerHTML = '<div id="purBody"></div>';
    fillBox('purBody', skel('list'));
    api.getPurchases().then(function (res) { /* 渲染 */ });
  }
  App.register({ id: 'purchase', mount: mountPurchase, demount: function () {} });
})();
```

**Step 3 · 加数据**：在 `mock.js` 的 `DB` 中新增 `purchases` 数组（字段规范见 [03-data-model.md](03-data-model.md)）。

**Step 4 · 加接口**：在 `api.js` 中新增桩函数并保留 `// TODO: replace with ...` 注释。

**Step 5 · 接入口**：任意页面加 `data-navto="purchase"` 元素即可跳转（如工作台快捷入口数组 `quicks` 追加一项）。

> 动效、骨架屏、空态、图标自动生效——无需额外配置。

## 2. 新增一个 Tab

1. `index.html`：新增 `<section class="screen is-tab" data-screen="xxx">`；
2. `.tabbar` 追加 `<a href="#" data-tab="xxx" data-ic="icon-name">`（顺序即展示顺序）；
3. `app.js` 的 `App.init` 中注册模块：`App.register({ id: 'xxx', mount, demount })`；
4. 图标需存在于 `icons.js`（否则 `icTag` 渲染为空，需运行时补全或加入图标库）。

## 3. 修改现有页面

- **局部改动**：只改对应模块函数，保持其他页面 1:1 不动（详见"迭代原则"）。
- **改文案/金额**：优先改 `mock.js`，页面会自动读取；注意跨页一致性（见数据模型文档 §13）。
- **改样式**：只允许使用 `styles.css` 既有令牌与组件类；新样式优先追加到 `styles.css` 组件区，不要在各页面内联硬编码新颜色。

## 4. 接入真实后端（上线前）

按 [04-api-contract.md](04-api-contract.md) 逐条替换 `api.js` 实现即可，**页面层零改动**的前提是保持返回结构不变。替换后：

1. 移除桩内 `DB` 读写，改真实请求；
2. 统一处理 `code !== 0` 的错误分支（原型仅在 saveRecord 有 catch）；
3. 将重算/聚合/占用校验逻辑迁移服务端；
4. 联调 loading 与骨架屏体验。

## 5. 编码规范

- **语法**：ES5（`var` + 函数声明），兼容低版本 WebView；不引入 Promise 之外的新特性（原型已用 async/await 于 api 桩，接后端时保持）。
- **命名**：模块 id 用 kebab-case；变量 camelCase；DOM id 唯一（`模块前缀 + 语义`，如 `prodSearch`）。
- **事件**：一律 `App.on`（自动解绑）；modal 内临时元素自建自清。
- **数据**：页面不直接改 `DB`（除演示性写操作如 BOM 删除、记录新增，需在代码注释标明）。
- **图标**：`icTag(name, size)`；`size` 缺省 24。禁止 emoji 作图标。
- **文案**：真实业务语感，禁止 lorem/sample。

## 6. 常用调试

| 场景 | 方法 |
|---|---|
| 图标不显示 | 检查名字是否在 `window.ICONS`；`injectIcons()` 是否在渲染后调用（`App.fill` 自动处理） |
| 事件重复触发 | 检查是否误用 `addEventListener`（应改 `App.on`） |
| 页面返回不刷新 | 检查 `mount` 是否有守卫逻辑（如 `if (!sec.firstChild)`），应每次进入重建 |
| 看数据 | DevTools Console 输入 `DB` / `api.getOverview().then(console.log)` |
| 骨架屏不消失 | 检查对应 `api.*` 是否被调用、是否有语法错误（Console 报错） |

## 7. 迭代原则（防止样式/结构漂移）

- 复用已冻结的组件类与令牌，不新造视觉语言；
- 不重写 App Shell 与 TabBar（`index.html` 中唯一一份）；
- 新功能优先"追加"而非"改动"既有模块结构；
- 每轮改动后执行静态自检（见 [06-maintenance.md](06-maintenance.md) §4）。
