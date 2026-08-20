# 06 · 维护手册

## 1. 项目定位与边界

- 本项目是**高保真交互原型**：模拟数据 + 桩接口，无真实后端、无数据库、无用户体系。
- 交付形态为纯静态文件夹，可离线打开、可直接投递演示、可托管任意静态空间。
- 需要"真实上线"时，按 [04-api-contract.md](04-api-contract.md) 接入后端后另行部署。

## 2. 运行与部署

### 本地开发预览

```bash
python -m http.server 8618 --directory cost-book-mini   # 或直接双击 index.html
```

### 静态托管

项目零构建、零依赖，`cost-book-mini/` 目录整体上传即可（GitHub Pages / Vercel / 对象存储均可）。入口为 `index.html`，资源均相对路径引用。

## 3. 浏览器兼容性

| 能力 | 要求 | 说明 |
|---|---|---|
| CSS 变量 | Chrome 49+ / iOS 9.3+ | 全站依赖 |
| `backdrop-filter` | Chrome 76+ / Safari 9+ | 仅 TabBar 毛玻璃，缺失时回退为 92% 不透明白 |
| `env(safe-area-inset-*)` | iOS 11.2+ | 适配刘海屏底部 |
| `100dvh` | Chrome 108+ | 移动端全屏模式，低版本回退 `height:100%`（已在媒体查询中处理） |
| Promise / async | 现代浏览器 | 原型 API 桩使用；接后端时如需兼容旧 WebView 应引入 polyfill 或改 Promise |

建议测试：Chrome / Edge 最新版、iOS Safari、微信内置浏览器。

## 4. 变更后静态自检清单（每次改动必做）

1. `node --check` 全部 JS（`app.js`、`subpages.js`、`mock.js`、`api.js`、`icons.js`）；
2. 导航核对：新增的 `data-navto` / `data-tab` 目标必须存在对应 `section[data-screen]`；
3. 接口核对：新调用的 `api.*` 必须在 `api.js` 已定义；
4. 图标核对：新 `icTag('x')` 必须在 `window.ICONS` 中存在；
5. 跨页数据一致性：金额、月份口径与 `mock.js` 相互印证；
6. 空态/骨架屏：新列表必须处理空数据与加载中。

## 5. 常见问题排查

| 问题 | 原因 | 处理 |
|---|---|---|
| 页面白屏 | JS 语法错误 / 引用路径错误 | 查看 Console；`node --check`；核对 script 顺序（icons→mock→api→app→subpages） |
| 图标空白 | 图标名不在 ICONS | 补入 `icons.js` 或运行时兜底注入 |
| Tab 切换后内容不刷新 | 模块未注册或 mount 守卫 | 确认 `App.register` 的 id 与 `data-screen` 一致；去掉守卫逻辑 |
| 弹层无法关闭 | 事件绑定遗漏 | 确认使用 `App.on` 绑定 mask 点击与取消按钮 |
| 移动端布局异常 | 未按断点适配 | 检查 `@media (max-width:480px)` 的 `.stage/.phone` 规则 |

## 6. 维护约定

- **版本记录**：README 末尾维护版本号与变更摘要；
- **数据口径**：修改任何金额数据时同步核对 `month` / `share` / `records` / `reports` 的一致性；
- **视觉一致性**：任何新样式先查 `styles.css` 是否已有等价类，禁止复制粘贴内联样式扩散；
- **接口演进**：接口变更时同步更新 `docs/04-api-contract.md`，保证前后端契约唯一来源。

## 7. 上线前检查清单

- [ ] 全部文案为正式业务文案（无演示占位）
- [ ] 所有接口替换为真实后端并处理错误分支
- [ ] 重算/聚合逻辑已迁移服务端
- [ ] 空态、加载、异常态全流程可见
- [ ] iOS / Android / 微信 WebView 真机过一遍
- [ ] 隐私与数据合规（成本数据属经营敏感信息）
