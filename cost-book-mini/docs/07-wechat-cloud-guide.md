# 07 · 微信云开发接入改造方案（逐函数对照）

> 目标：把「算得清」从纯静态原型升级为真实可用的小程序，后端采用**微信云开发**（云函数 + 云数据库 + 云存储 + 定时触发器），免自建服务器、免备案。
>
> 核心原则：**客户端 `api.js` 的函数签名与返回结构保持不变**，页面层零改动；改造只发生在 `api.js` 内部实现与新增的云函数。

---

## 1. 整体架构

```
┌─────────────────────────────────────────────┐
│  小程序端（原型改造后）                       │
│  · 页面层：index.html / app.js / subpages.js │  ← 零改动
│  · 数据层：api.js（重写内部实现）             │  ← 唯一改动点
│  · 新增：登录态管理 auth.js / 云开发初始化    │
├─────────────────────────────────────────────┤
│  wx.cloud.callFunction({ name, data })       │
├─────────────────────────────────────────────┤
│  云函数（Node.js，每个接口一个）              │
│  · auth：登录/换取 openid/JWT 签发            │
│  · record：CRUD + 分页查询                   │
│  · product / bom / supplier / category       │
│  · report：生成 + 查询                       │
│  · upload：凭证文件上传                       │
│  · 定时触发器：每月 1 日生成报表 / 预算告警    │
├─────────────────────────────────────────────┤
│  云数据库（集合） + 云存储（凭证图片）         │
└─────────────────────────────────────────────┘
```

## 2. 前置准备

1. 小程序后台开通「云开发」，创建环境（如 `prod`），记录 `环境 ID`。
2. `project.config.json` 配置 `cloudfunctionRoot: "cloudfunctions/"`。
3. 客户端初始化（原型入口 `index.html` 的启动脚本处）：

```js
// app 启动时（原型中在 App.init 前）
if (!wx.cloud) {
  console.error('请使用 2.2.3 以上基础库以使用云能力');
} else {
  wx.cloud.init({ env: 'prod-xxxx', traceUser: true });
}
```

> 注意：原型是 H5/静态页，真实小程序版需将其改造为微信小程序页面结构（WXML/WXSS/JS），本方案聚焦**数据层与云函数**，页面改造另见 `docs/05-development-guide.md` 的迁移章节。

## 3. 会话与鉴权

### 3.1 登录注册（新增 2 个云函数）

| 云函数 | 触发 | 职责 |
|---|---|---|
| `login` | 小程序启动时 `wx.cloud.callFunction({name:'login'})` | 通过 `cloud.getWXContext().OPENID` 静默登录；首次登录自动创建 `users` 记录；返回 `{ openid, userId, isNew }` |
| `bindPhone` | 用户点击「手机号登录」按钮（`button open-type="getPhoneNumber"`） | 用 `cloud.openapi.phonenumber.getPhoneNumber({ code })` 换取手机号，绑定到 user；返回 `{ phone }` |

### 3.2 租户模型（多店隔离）

原型中的 `DB.store` 是单店；真实多租户模型：

- `users`：`{ _id, openid, phone, name, role: 'owner'|'staff', storeIds: [] , activeStoreId }`
- `stores`：`{ _id, name, type, industry, plan, budget, credit, createdAt, ownerId }`

**每个业务云函数第一步都从 `cloud.getWXContext()` 拿 openid → 查 user → 取 activeStoreId → 所有查询强制带 `storeId` 条件**，杜绝越权。

### 3.3 鉴权注入

云函数内统一封装（建议抽 `cloudfunctions/common/auth.js` 共享）：

```js
exports.getSession = async function () {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) throw new Error('未登录');
  const db = cloud.database();
  const res = await db.collection('users').where({ openid: OPENID }).get();
  const user = res.data[0];
  if (!user) throw new Error('用户不存在，请先 login');
  return { user, db };
};
```

## 4. 数据模型映射（mock.js DB → 云数据库集合）

| 原型对象 | 云数据库集合 | 关键字段（新增） |
|---|---|---|
| `DB.store` | `stores` | `storeId`、`industry`（行业，用于行业化分类模板） |
| `DB.categories` | `categories` | `storeId`、`industry`（模板来源）、`sort` |
| `DB.records` | `records` | `storeId`、`userId`（记账人）、`attachFileId`（凭证 fileID） |
| `DB.products` | `products` | `storeId`、`price`、`cost`、`ratio`、`status`、`bomTotal/labor/overhead` |
| 菜品 `items` | `bom_items`（子集合） | `productId`、`name/spec/qty/amount` |
| `DB.suppliers` | `suppliers` | `storeId`、`contact/phone/note`、`spend/orders/trend` |
| `DB.reports` | `reports` | `storeId`、`month`（唯一索引）、`items`、`status` |
| `DB.trend/share/periods` | 不落库 | 由 `records` 聚合实时计算（见 §5.8） |
| `DB.alerts` | `alerts` | `storeId`、`kind`、`read` 状态 |

> 建议为 `records.storeId + date`、`products.storeId`、`reports.storeId + month` 建索引。

## 5. 逐函数对照（api.js 16 个接口）

> 约定：`// 云函数` 标注为新增的云函数名；客户端每个函数改为：
> ```js
> const res = await wx.cloud.callFunction({ name: 'xxx', data: {...} });
> return res.result; // 保持 { code, data } 结构
> ```

### 5.1 `getOverview` → 云函数 `overview`

| 项 | 内容 |
|---|---|
| 桩实现 | 直接读 `DB.store / DB.month / DB.alerts` |
| 改造 | 查 `stores`（按 user.activeStoreId）→ 聚合 `records`：本月 cost（type='支出' 求和）、revenue（type='收入' 求和）、profit、ratio、budgetUsed= cost/budget；上月同口径算环比；查 `alerts`（未读） |
| 返回 | `{ store, month, alerts }`（字段与原型一致） |
| 备注 | `store.credit` 可先给默认值，后续接信用体系 |

### 5.2 `getRecords` → 云函数 `records.list`

| 项 | 内容 |
|---|---|
| 桩实现 | `DB.records.filter(type/keyword/cat)` |
| 改造 | `db.collection('records').where({ storeId, 可选 type/cat, 备注或商户 db.RegExp(keyword) }).orderBy('date','desc').limit(20).skip(page*20)` |
| 返回 | `{ list, total }`（total 用 `.count()`） |
| 备注 | 客户端已传 `{type, keyword, cat}`，新增 `page` 参数可加分页 |

### 5.3 `saveRecord` → 云函数 `records.create` / `records.update`

| 项 | 内容 |
|---|---|
| 桩实现 | `DB.records.unshift(...)` 生成 `id` |
| 改造 | create：`add({ storeId, userId, ...rec, createdAt: db.serverDate() })`；update：按 `_id` + `storeId` 校验后 `update()` |
| 返回 | `{ id }`（`_id`） |
| 备注 | 服务端应重算 `status`（'待核算' 等）与记账人；凭证 fileID 存入 `attachFileId` |

### 5.4 `deleteRecord` → 云函数 `records.remove`

| 项 | 内容 |
|---|---|
| 桩实现 | 数组 splice |
| 改造 | `where({ _id: id, storeId }).remove()`；顺带删除云存储中的凭证文件（`cloud.deleteFile`） |
| 返回 | `{ ok: true }` |

### 5.5 `getProducts` → 云函数 `products.list`

| 项 | 内容 |
|---|---|
| 桩实现 | filter + `avgRatio/overCount` 前端计算 |
| 改造 | 查 `products`（where storeId + cat/name 正则）；`avgRatio`、`overCount` 改由**服务端聚合**返回 |
| 返回 | `{ list, avgRatio, overCount, total }` |

### 5.6 `getProduct` → 云函数 `products.detail`

| 项 | 内容 |
|---|---|
| 桩实现 | 按 id 查 `DB.products` |
| 改造 | 查 `products` + 关联查询 `bom_items`（`where({ productId: id })`），拼成 `{ product: { ...p, items } }` |
| 返回 | `{ product }` |

### 5.7 `addBomItem` → 云函数 `bom.add`

| 项 | 内容 |
|---|---|
| 桩实现 | 前端 push + 重算 `bomTotal/cost/ratio/status` |
| 改造 | **重算逻辑迁移到云函数**：`bom_items.add` → 聚合求和 bomTotal → `cost = bomTotal + labor + overhead` → `ratio = 1 - cost/price` → 更新 `products` 与 status |
| 返回 | `{ product }`（重算后的完整对象） |
| 备注 | 这是原型中最重要的"逻辑上移"点，避免客户端算错 |

### 5.8 `getAnalysis` → 云函数 `analysis`

| 项 | 内容 |
|---|---|
| 桩实现 | 读 `DB.share / shareLast / trend / topProducts / suppliers` |
| 改造 | 全部**实时聚合**：按 `period` 取对应月份 records → `groupBy cat` 求构成 `share`；按月分组求 `trend`（近 6 月）；按 products.ratio 排序取 TOP5；`suppliers` 查集合 |
| 返回 | `{ period, share, trend, top, suppliers }` |
| 备注 | 数据量大时可用聚合管道 `aggregate`（`group/match/sort`）一次性计算 |

### 5.9 `getReports` → 云函数 `reports.list`

| 项 | 内容 |
|---|---|
| 桩实现 | 读 `DB.reports` |
| 改造 | `where({ storeId }).orderBy('month','desc')` |
| 返回 | `{ list }` |

### 5.10 `getReport` → 云函数 `reports.detail`

| 项 | 内容 |
|---|---|
| 桩实现 | 按 id 读 |
| 改造 | `doc(id)`（校验 storeId），返回含 `items` |
| 返回 | `{ report }` |

### 5.11 `getSuppliers` → 云函数 `suppliers.list`

| 项 | 内容 |
|---|---|
| 桩实现 | filter keyword |
| 改造 | `where({ storeId, 名称正则 })`；`spend/orders/trend` 由服务端聚合（可基于 `records` 中 `merchant` 匹配该供应商） |
| 返回 | `{ list, total }` |

### 5.12 `saveSupplier` → 云函数 `suppliers.create` / `suppliers.update`

| 项 | 内容 |
|---|---|
| 桩实现 | push / Object.assign |
| 改造 | create：`add({ storeId, ...sup })`；update：校验 storeId 后 `update()`；`initial` 服务端取首字 |
| 返回 | `{ id }` |

### 5.13 `deleteSupplier` → 云函数 `suppliers.remove`

| 项 | 内容 |
|---|---|
| 桩实现 | splice |
| 改造 | 校验 storeId 后删除；若关联记录可标记禁用而非硬删 |
| 返回 | `{ ok: true }` |

### 5.14 `getCategories` → 云函数 `categories.list`

| 项 | 内容 |
|---|---|
| 桩实现 | 读 `DB.categories` |
| 改造 | 返回 `where({ storeId })`；**首次进入行业引导时从 `industry_templates` 模板集合复制初始化**（见 §6） |
| 返回 | `{ list }` |

### 5.15 `saveCategory` → 云函数 `categories.create` / `categories.update`

| 项 | 内容 |
|---|---|
| 桩实现 | push / Object.assign |
| 改造 | 校验 storeId + 名称去重（同店不允许重名） |
| 返回 | `{ id }` |

### 5.16 `deleteCategory` → 云函数 `categories.remove`

| 项 | 内容 |
|---|---|
| 桩实现 | 前端查 `DB.records` 占用 |
| 改造 | **占用校验上移服务端**：`records.where({ storeId, cat: name }).count() > 0 → { ok:false, reason }` |
| 返回 | `{ ok, reason? }` |

## 6. 行业引导（差异化落地点）

新增云函数 + 集合，接入时机 = 首次 login 且 `store.industry` 为空：

- 集合 `industry_templates`：预置 餐饮 / 零售 / 生鲜果蔬 / 美容美发 / 小型制造 的分类模板（名称 + 色值 + 默认预算占比）
- 云函数 `onboarding.create`：接收 `{ industry, storeName, budget }` → 创建 `stores` → 从模板批量写入 `categories`
- 客户端：注册后进入引导向导页（现有原型可新增 `data-screen="onboarding"` 页），完成后进工作台

## 7. 文件上传（凭证照片）

- 新增云函数 `upload.getUploadUrl` 或直接客户端：
  ```js
  wx.cloud.uploadFile({
    cloudPath: `receipts/${openid}/${Date.now()}.jpg`,
    filePath: 拍照/相册临时路径
  }).then(res => fileID)
  ```
- 记一笔保存时把 `fileID` 存入 `records.attachFileId`；详情页用 `wx.cloud.getTempFileURL` 换取临时 URL 显示。

## 8. 定时触发器（云函数定时）

`config.json` 声明触发器（每月 1 日 01:00）：

```json
{
  "triggers": [
    { "name": "monthlyReport", "type": "timer", "config": "0 0 1 * * * *" }
  ]
}
```

- `monthlyReport`：遍历上月有数据的 stores → 聚合生成 `reports` → 写 `alerts`（预算超支/成本异常）
- 报表详情页的「导出」可改为生成 PDF（云函数用模板 + 云存储返回 URL）

## 9. 客户端 `api.js` 重写模板

```js
const call = (name, data) =>
  wx.cloud.callFunction({ name, data }).then(res => {
    const r = res.result || {};
    if (r.code !== 0) throw new Error(r.message || '请求失败');
    return r;
  });

var api = {
  getOverview: () => call('overview', {}),
  getRecords: (opt) => call('records.list', opt),
  saveRecord: (rec) => call(rec.id ? 'records.update' : 'records.create', rec),
  deleteRecord: (id) => call('records.remove', { id }),
  getProducts: (opt) => call('products.list', opt),
  getProduct: (id) => call('products.detail', { id }),
  addBomItem: (id, item) => call('bom.add', { id, item }),
  getAnalysis: (period) => call('analysis', { period }),
  getReports: () => call('reports.list', {}),
  getReport: (id) => call('reports.detail', { id }),
  getSuppliers: (opt) => call('suppliers.list', opt),
  saveSupplier: (sup) => call(sup.id ? 'suppliers.update' : 'suppliers.create', sup),
  deleteSupplier: (id) => call('suppliers.remove', { id }),
  getCategories: () => call('categories.list', {}),
  saveCategory: (cat) => call(cat.id ? 'categories.update' : 'categories.create', cat),
  deleteCategory: (id) => call('categories.remove', { id })
};
```

> 保持 `window.api = api` 导出，页面层零改动；错误处理统一在 `call` 内捕获。

## 10. 迁移步骤清单

1. 开通云开发环境，配置 `project.config.json` 与客户端 `wx.cloud.init`
2. 编写 `cloudfunctions/common/auth.js` + `login` / `bindPhone`
3. 建集合与索引（§4），灌入 `industry_templates`
4. 按 §5 逐个实现 16 个云函数（可并行），用「原型 mock 数据」做对照联调
5. 重写客户端 `api.js` 为 §9 模板；`mock.js` 降级为「无网络时的离线演示模式」（`wx.getNetworkType` 或开关切换）
6. 凭证上传（§7）、定时报表（§8）
7. 行业引导页对接（§6）
8. 安全规则：云数据库权限设为「仅创建者可读写」+ 云函数用管理员权限访问，业务校验全部在云函数内完成
9. 真机测试（登录/多店/上传/订阅消息）后提审

## 11. 风险与注意

- **冷启动**：云函数首次调用延迟 1-3s，原型骨架屏已天然适配；高频接口可考虑常驻配置
- **费用**：云开发按量计费，免费额度约 1GB 存储 + 20 万次调用/月，起步足够；注意云函数超时默认 3s，聚合复杂接口调到 10-20s
- **数据一致性**：`cost/ratio/status` 的重算只允许发生在云函数（bom.add / records 保存），客户端只读
- **安全**：所有查询强制 `storeId` 条件；用户 openid 不落客户端可读字段；凭证文件权限用 `cloudPath` 含 openid 隔离
- **原型兼容**：`mock.js` 保留，方便无后端环境演示与 UI 迭代，两套数据层通过 `api` 门面切换
