# 04 · API 契约（桩层 → 真实后端）

`api.js` 中的 16 个异步函数即为**未来真实接口的形状**。接后端时逐条替换内部实现（保留函数签名与返回结构），页面代码无需改动。

通用约定：

- 返回结构统一 `{ code: 0, data: ... }`（`code !== 0` 视为失败）；
- 桩内 `delay(300~600)` 模拟延迟，替换为真实请求后可保留最小 loading 时间；
- 桩内直接读写 `DB`（内存态），真实后端应落库并返回同构数据。

## 接口清单

| # | 函数 | 方法 + 路径 | 入参 | 出参 data |
|---|---|---|---|---|
| 1 | `getOverview` | GET `/api/overview` | — | `{ store, month, alerts }` |
| 2 | `getRecords` | GET `/api/records` | `{type?, keyword?, cat?, page?}` | `{ list, total }` |
| 3 | `saveRecord` | POST `/api/records` | 记录对象（date/type/cat/amount/merchant/note/status/attach） | `{ id }` |
| 4 | `deleteRecord` | DELETE `/api/records/:id` | id | `{ ok: true }` |
| 5 | `getProducts` | GET `/api/products` | `{cat?, keyword?}` | `{ list, avgRatio, overCount, total }` |
| 6 | `getProduct` | GET `/api/products/:id` | id | `{ product }` |
| 7 | `addBomItem` | POST `/api/products/:id/bom` | `{name, spec, qty, amount}` | `{ product }`（服务端重算 cost/ratio/status） |
| 8 | `getAnalysis` | GET `/api/analysis` | `{period: 'cur'\|'last'}` | `{ period, share, trend, top, suppliers }` |
| 9 | `getReports` | GET `/api/reports` | — | `{ list }` |
| 10 | `getReport` | GET `/api/reports/:id` | id | `{ report }` |
| 11 | `getSuppliers` | GET `/api/suppliers` | `{keyword?}` | `{ list, total }` |
| 12 | `saveSupplier` | POST `/api/suppliers`（新增）/ PUT `/api/suppliers/:id`（编辑） | 供应商对象 | `{ id }` |
| 13 | `deleteSupplier` | DELETE `/api/suppliers/:id` | id | `{ ok: true }` |
| 14 | `getCategories` | GET `/api/categories` | — | `{ list }` |
| 15 | `saveCategory` | POST `/api/categories` / PUT `/api/categories/:id` | `{id?, name, color}` | `{ id }` |
| 16 | `deleteCategory` | DELETE `/api/categories/:id` | id | `{ ok, reason? }`（分类下仍有记录时 `ok:false` + reason） |

## 替换示例

```js
// 桩层现状（api.js）
getProducts: async function (opt) {
  await delay(380);
  var list = DB.products.filter(...);
  return ok({ list, avgRatio, overCount, total });
}

// 接后端后
getProducts: async function (opt) {
  const params = new URLSearchParams(opt).toString();
  const res = await fetch('/api/products?' + params);
  const json = await res.json();
  return json; // 保持 { code, data } 结构不变
}
```

## 服务端职责迁移点

1. **重算逻辑**：`addBomItem` 中的 `cost = bomTotal + labor + overhead`、`ratio = 1 - cost/price`、`status` 判定应迁移到服务端，保证一致；
2. **分类占用校验**：`deleteCategory` 的"分类下仍有记录"校验由服务端根据 records 关联判断；
3. **统计口径**：`avgRatio`、`overCount`、供应商 `spend` 求和等聚合由服务端计算，前端只做展示。
