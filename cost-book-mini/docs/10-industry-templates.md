# 10 · 行业模板：数据结构与切换逻辑（全量梳理）

> 功能来源：`feat: add switchable industry templates`（fbb5243）
> 相关文件：`mock.js`（模板数据）/ `onboarding.js`（引导与持久化）/ `app.js`（运行时行业上下文）/ `hidden-cost.js`（行业专属估算模型）/ `subpages.js`（页面文案适配）/ `docs/03`、`docs/08`
> 核心机制：**「模板驱动」**——行业模板（`DB.industryTemplates`）是唯一事实源，引导流程选择 → 持久化 → `apply()` 应用到 `DB`，运行期页面与计算引擎按 `currentIndustryId()` 分支适配。

---

## 一、数据结构总览

### 1.1 存储位置与数量

- 数据源：`mock.js → window.DB.industryTemplates`
- 当前共 **8 个行业模板**，其中 **5 个在引导向导 Step1 可选**，3 个为隐藏模板（数据/模型已就绪，未放入选择列表，供后续扩展）：

| 模板 key | 名称 | 引导可选 | 隐性成本模型 | 说明 |
|---|---|---|---|---|
| `canteen` | 餐饮 | ✅ | ✅ | 7 分类 |
| `retail` | 零售 | ✅ | ✅ | 7 分类 |
| `ecommerce` | 电商 | ✅ | ✅ | 8 分类（新） |
| `beauty` | 美业服务 | ✅ | ✅ | 7 分类 |
| `stall` | 小商贩 | ✅ | ✅ | 5 分类（极简） |
| `fresh` | 生鲜果蔬 | ❌ | ✅ | 模板/模型已就绪 |
| `factory` | 小型制造 | ❌ | ✅ | 模板/模型已就绪 |
| `service` | 其他服务 | ❌ | ✅ | 模板/模型已就绪 |

### 1.2 单个模板字段

```js
{
  id: 'canteen',            // 模板标识（= 行业 key）
  name: '餐饮',             // 行业显示名（用于 store.type、Step3 预览）
  desc: '餐厅 / 小吃 / 饮品店', // 引导卡片副标题
  icon: 'utensils',         // 行业图标（引导卡片 / 我的页头像）
  noun: '菜品',             // 成本对象名词（菜品/商品/服务项目，页面文案驱动）
  productIcon: 'utensils',  // 产品列表图标（菜品成本页/空状态/列表行）
  alertHint: '食材价格波动时推送', // 成本异常提醒描述（我的页）
  categories: [             // 成本分类模板（记账页 chip、分类管理、图表着色）
    { id: 't1', name: '食材采购', color: '#1677FF' },
    // ... 5-8 项
  ],
  hiddenCost: {             // 隐性成本基准参数（hidden-cost.js 各行业模型消费）
    foodLoss: { low: 5, high: 8, mid: 5 },  // 区间型：{low, high, mid}
    utility: { rate: 0.10 }                 // 比例型：{rate}
  }
}
```

> **字段驱动约定**：`noun` / `productIcon` / `alertHint` 均下沉到模板数据（v2.4.2 起），
> `app.js` 的 `industryNoun()` / `industryProductIcon()` / `industryAlertHint()` 直接读模板字段，
> 新增行业不再需要改 if-else 分支，仅需补模板字段即可。

### 1.3 分类配色板现状（⚠️ 注意）

远程提交对 **canteen / retail / ecommerce / beauty / stall** 启用了新品牌色板，但 **fresh / factory / service** 仍保留旧色板，两套并存：

- 新色板：`#1677FF` 蓝 / `#12B76A` 绿 / `#F79009` 橙 / `#7F56D9` 紫 / `#F04438` 红 / `#0B1836` 深蓝 / `#667085` 灰 / `#A3AEC2` 浅灰
- 旧色板：`#0D7261` / `#3E6FA8` / `#B97A12` / `#8A5FA8` / `#C24A38` / `#5B7C6B` / `#9B978D`

建议后续统一为同一色板（切换行业后分类色会整体跳变）。

### 1.4 隐性成本基准参数约定

每个行业的 `hiddenCost` 由 `hidden-cost.js` 中对应模型消费，参数分两类：

| 类型 | 形态 | 语义 | 示例 |
|---|---|---|---|
| 区间型 | `{ low, high, mid }` | 行业基准区间与中值，用于 `rateHealth()` 健康度评分 | 餐饮损耗 5-8% / 电商退款 3-8% |
| 比例型 | `{ rate }` | 固定比例系数，直接乘基数 | 水电浪费 10% / 平台漏损 6% |

⚠️ **一致性要求**：模板里出现哪个 key，`hidden-cost.js` 的 `MODELS` 就必须有对应实现（当前 8 个模板均有实现，映射完整）；反之 `MODELS` 中不应有模板不存在的 key。

---

## 二、数据流（一条主线）

```
localStorage['sqd-ob']          ← 持久层（唯一持久化，key = Onboarding.OB_KEY）
        │  Onboarding.read() / save() / clear()
        ▼
Onboarding.apply(ob)            ← 应用到运行时（写 DB）
        │  DB.categories = 模板.categories 映射
        │  DB.store.industry / type / name / budget
        ▼
window.DB                       ← 运行时单一数据源（页面/引擎读取）
        │  currentIndustryId()  ← app.js：localStorage > DB.store.industry > 'canteen'
        ▼
页面渲染 + 隐性成本引擎          ← 按行业分支适配（见第三节）
```

持久化对象结构（`sqd-ob`）：

```js
{
  done: true,          // 完成标记（read() 仅返回 done===true 的对象）
  industry: 'canteen', // 行业 key（唯一必须项）
  storeName: '老街小馆 · 川菜',
  scale: '单店',        // 档口 / 单店 / 多店
  budget: 160000,      // 月成本预算
  phone: '138****6622' // 登录手机号
}
```

---

## 三、切换逻辑全链路

### 3.1 首次使用（新用户）

```
启动 App.init()
  ├─ Onboarding.read() === null
  └─ stack.push('login') → 登录屏
       └─ 登录成功 → App.go('onboarding')
             Step1 选行业（keys 硬编码，见 §3.4）
             Step2 门店名 / 规模 / 月预算（校验：名称非空、预算为正整数）
             Step3 模板分类预览 → 「开始使用」
                 └─ save({...}) → apply(read()) → App.resetTo('home')
```

### 3.2 运行中切换行业

```
我的页「切换行业」data-act="switchInd"
  ├─ confirm（提示分类将重置、隐性成本模型切换、演示数据保持不变）
  ├─ Onboarding.clear()          ← 清 localStorage，使启动逻辑回到未引导态
  └─ App.go('onboarding')        ← 重走 3 步向导
       └─ 完成后 save + apply 覆盖 DB.categories / DB.store.industry / type / budget
```

### 3.3 店铺设置同步写回

```
我的页「店铺设置」保存（openStoreSettings）
  ├─ DB.store.name / budget 直接改
  └─ Onboarding.read() → 更新 ob.storeName / ob.budget → Onboarding.save + apply
     （保持 localStorage 与 DB 一致，避免下次启动回退）
```

### 3.4 引导可选行业列表（硬编码）

`onboarding.js → buildStep1`：

```js
var keys = ['canteen', 'retail', 'ecommerce', 'beauty', 'stall'];
```

- 新增可选行业 = 改这里（fresh/factory/service 有模板与模型，但未列入，属"隐藏行业"）。

### 3.5 `apply(ob)` 具体副作用

| 写入 | 来源 | 说明 |
|---|---|---|
| `DB.categories` | `模板.categories` 整体替换 | 记账分类、分类管理、图表配色随之切换 |
| `DB.store.industry` | `ob.industry` | 行业上下文兜底字段 |
| `DB.store.type` | `模板.name + ' · ' + ob.scale` | 店铺卡展示 |
| `DB.store.name` | `ob.storeName` | 门店名 |
| `DB.store.budget` | `ob.budget` | 月预算 |
| **不动** `DB.records` | — | ⚠️ 旧行业分类记录残留，见第五节 |

---

## 四、行业影响面矩阵（运行时分支）

所有分支的行业来源：`app.js → currentIndustryId()`（优先级 `localStorage > DB.store.industry > 'canteen'`）。

| 能力 | 位置 | 分支逻辑 |
|---|---|---|
| 名词适配 `industryNoun()` | app.js | 读模板字段 `noun`（fallback `商品`） |
| 图标适配 `industryProductIcon()` | app.js | 读模板字段 `productIcon`（fallback `shopping-cart`） |
| 提醒文案 `industryAlertHint()` | app.js | 读模板字段 `alertHint`（fallback 通用文案） |
| 隐性成本模型 | hidden-cost.js `MODELS` | 按 key 路由 8 个行业模型（见 §1.1） |
| 菜品成本页文案 | subpages.js | 搜索占位、总数/超支名词、BOM 标签（`食材 BOM 合计`/`成本构成`）、按钮（`添加用料`/`添加成本项`）、空状态 |
| 我的页 | app.js | 店铺卡行业图标、经营工具入口 label（`菜品成本卡`/`服务项目成本卡`） |
| 工作台快捷入口 | app.js | `菜品成本` / `商品成本` 等 |

---

## 五、边界与已知问题（切换功能相关）

| # | 现象 | 原因 | 建议 |
|---|---|---|---|
| 1 | 切换行业后旧分类的记账记录仍显示，但 chip 不在新分类里，颜色 fallback 灰色 | `apply()` 只替换 `DB.categories`，不迁移 `records` | 切换时提示"历史记录分类将保留"，或按名称映射迁移 |
| 2 | 切换后 `DB.share`（成本构成）与新分类对不上 | share 是餐饮口径手写数据，不随行业重建 | 明确"分析页数据为餐饮演示数据"或按新分类重建 |
| 3 | 切换后 `DB.month` 经营指标不变 | confirm 文案已声明"演示经营数据保持不变" | 可接受，接后端后由服务端按门店返回 |
| 4 | 分类配色新旧两套并存 | 模板改造未覆盖 fresh/factory/service | 统一色板 |
| 5 | 隐藏行业（fresh/factory/service）无法经 UI 选择 | `buildStep1` keys 未包含 | 如需开放，加 key 即可 |
| 6 | 引导向导进度不持久化（刷新丢失） | `obState` 为内存态，仅完成时 save | 演示可接受，接后端后建议服务端会话 |
| 7 | ~~行业依赖为手写 if-else 分支（noun/icon/alertHint）~~ | **已修复（v2.4.2）**：三个字段下沉到模板数据，`app.js` 统一读字段 | — |

---

## 六、扩展新行业的标准步骤（Checklist）

1. `mock.js → DB.industryTemplates` 增加模板：`{ id, name, desc, icon, noun, productIcon, alertHint, categories[], hiddenCost{} }`（分类色用新色板）
2. `hidden-cost.js → MODELS` 增加同名模型函数（消费 `hiddenCost` 参数，输出 `item[]`）
3. `onboarding.js → buildStep1 keys` 加入 key（可选展示）
4. `app.js` 无需改 if-else（noun/productIcon/alertHint 已字段驱动）；如行业名词/图标特殊，直接在模板字段配置
5. `docs/08` 补充该行业模型公式与基准；`docs/03` 补充模板结构说明
6. 验证：引导可选 → 保存 → 分类/文案/隐性成本模型均切换正确
