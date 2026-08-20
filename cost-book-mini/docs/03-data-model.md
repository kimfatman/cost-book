# 03 · 数据模型（mock.js）

所有业务数据集中在 `window.DB`，是**唯一数据源**。页面读取 DB 或通过 api 桩获取，禁止散写硬编码数据。以下为全量字段说明（数值单位：元）。

## 1. `DB.store` 店铺信息

| 字段 | 类型 | 示例 | 说明 |
|---|---|---|---|
| name | string | 老街小馆 · 川菜 | 店铺名 |
| type | string | 餐饮 · 1 家门店 | 业态 |
| plan | string | 专业版 | 套餐 |
| budget | number | 160000 | 月度成本预算 |
| credit | number | 92 | 信用分 |
| updated | string | 2026-07-14 21:30 | 数据更新时间 |

## 2. `DB.month` 本月经营指标

| 字段 | 示例 | 说明 |
|---|---|---|
| cost | 128640 | 本月总成本 |
| revenue | 214300 | 本月收入 |
| profit | 85660 | 本月毛利（= revenue - cost） |
| ratio | 60.0 | 成本率 % |
| budgetUsed | 80.4 | 预算已用 % |
| lastCost | 116980 | 上月成本 |
| costDelta | 9.9 | 成本环比 % |
| lastRatio | 58.2 | 上月成本率 |
| ratioDelta | 1.8 | 成本率环比 pp |
| prevRevenue / prevProfit | 201800 / 81260 | 上月收入 / 毛利 |
| revenueDelta / profitDelta | 6.2 / 5.4 | 环比 % |
| recordCount | 19 | 本月记账笔数 |

## 3. `DB.categories` 成本分类

`{ id, name, color }` 数组。7 个预设：食材采购（#0D7261）、人力工资（#3E6FA8）、房租水电（#B97A12）、营销推广（#8A5FA8）、物流仓储（#C24A38）、设备折旧（#5B7C6B）、其他（#9B978D）。`color` 用于分类色点与图表着色（`catColor(name)` 按名称查色）。

## 4. `DB.records` 成本记录（20 条，时间倒序）

| 字段 | 说明 |
|---|---|
| id | 单号，如 `C20260714-0082` |
| date | 日期 `YYYY-MM-DD` |
| type | `支出` / `收入` |
| cat | 分类名（对应 categories.name） |
| amount | 金额 |
| merchant | 商户名称 |
| note | 备注 |
| status | `已核算` / `待核算` / `异常` |
| attach | boolean，是否有凭证 |

**记账页按 date 分组展示；删除/新增记录直接修改此数组。**

## 5. `DB.products` 菜品成本卡（8 个）

| 字段 | 说明 |
|---|---|
| id / name / cat | 标识 / 菜名 / 分类（热菜·凉菜·主食·饮品） |
| price | 售价 |
| cost | 单位成本（= bomTotal + labor + overhead） |
| ratio | 成本率 %（`1 - cost/price`），>60 视为偏高，≥66 警示 |
| status | `达标` / `超支` |
| bomTotal | 用料配方合计 |
| labor | 人工成本分摊 |
| overhead | 水电房租分摊 |
| items | BOM 配方数组：`{name, spec, qty, amount}` |
| history | 近 6 月单位成本数组（升序，对应 2-7 月） |

**一致性约束**：`cost === round(bomTotal + labor + overhead)`；`addBomItem` 桩会同步重算三者的关系。

## 6. `DB.trend` 近 6 月趋势

`[{month: '2026-02'…'2026-07', cost, revenue}]`，共 6 项，用于柱状图。

## 7. `DB.share` / `DB.shareLast` 成本构成

`[{cat, amount, pct}]`，分别对应本月/上月。两项 amount 之和分别为 128,640 与 116,980（与 month 一致）。

## 8. `DB.periods` 期间标签

`{ cur, last }`，各含 `{label, cost, revenue, ratio, ratioDelta}`，供分析页分段切换。

## 9. `DB.topProducts` TOP5 高成本菜品

`[{name, cost, ratio, delta}]`。

## 10. `DB.suppliers` 供应商（6 家）

| 字段 | 说明 |
|---|---|
| id / name / contact | 标识 / 名称 / 对接人 |
| cat | 品类（食材/粮油/蔬菜/肉禽/物流/平台） |
| spend | 本月支出 |
| orders | 本月订单数 |
| trend | `up` / `down` 环比方向 |
| initial | 头像首字 |

**页面展示分组**：食材/粮油/蔬菜/肉禽/物流 → 食材类；平台 → 平台类。

## 11. `DB.reports` 月度报表（3 期）

| 字段 | 说明 |
|---|---|
| id / month / label | 如 `R202606` / `2026-06` / `2026 年 6 月` |
| totalCost / revenue / margin / ratio | 总成本 / 收入 / 毛利 / 成本率 |
| status | `已生成` |
| items | 分类明细 `[{cat, amount, pct, delta}]`，delta 为环比 pp |

## 12. `DB.alerts` 待办提醒

`[{kind: 'pending'|'over'|'wave', title, desc, meta}]`，工作台展示。

## 数据一致性约定

- 跨页金额必须一致（如 month.cost、share 求和、record 明细相互印证）；
- 修改 mock 数据时同步检查：`share` 求和 = `month.cost`；`reports` 与 `trend` 的月份口径一致；
- 新增记录后 `month.recordCount` 需同步（原型中由 `deleteRecord` / 记一笔流程维护）。
