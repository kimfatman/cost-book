// 算得清 · 模拟数据源（单一数据源：所有页面读取 DB，禁止散落硬编码）
window.DB = {
  store: {
    name: '老街小馆 · 川菜',
    type: '餐饮 · 1 家门店',
    plan: '专业版',
    budget: 160000,
    credit: 92,
    updated: '2026-07-14 21:30'
  },
  // 本月经营指标（7 月）
  month: {
    cost: 128640, revenue: 214300, profit: 85660, ratio: 60.0,
    budgetUsed: 80.4,
    lastCost: 116980, costDelta: 9.9,
    lastRatio: 58.2, ratioDelta: 1.8,
    prevRevenue: 201800, revenueDelta: 6.2,
    prevProfit: 81260, profitDelta: 5.4,
    recordCount: 19
  },
  // 成本分类（含色点，用于列表与图表）
  categories: [
    { id: 'c1', name: '食材采购', color: '#0D7261' },
    { id: 'c2', name: '人力工资', color: '#3E6FA8' },
    { id: 'c3', name: '房租水电', color: '#B97A12' },
    { id: 'c4', name: '营销推广', color: '#8A5FA8' },
    { id: 'c5', name: '物流仓储', color: '#C24A38' },
    { id: 'c6', name: '设备折旧', color: '#5B7C6B' },
    { id: 'c7', name: '其他', color: '#9B978D' }
  ],
  // 成本记录（时间倒序）
  records: [
    { id: 'C20260714-0082', date: '2026-07-14', type: '支出', cat: '食材采购', amount: 3860, merchant: '川味食材批发', note: '鲜牛肉 40kg、毛肚 12kg（周结算）', status: '已核算', attach: true },
    { id: 'C20260714-0081', date: '2026-07-14', type: '支出', cat: '食材采购', amount: 1280, merchant: '青蔬鲜配', note: '当季蔬菜 3 批', status: '已核算', attach: false },
    { id: 'C20260714-0080', date: '2026-07-14', type: '支出', cat: '营销推广', amount: 600, merchant: '美团外卖', note: '满减活动分摊（7.12-7.14）', status: '待核算', attach: false },
    { id: 'C20260713-0079', date: '2026-07-13', type: '支出', cat: '食材采购', amount: 4520, merchant: '川味食材批发', note: '水产：黑鱼 30kg、花鲢 25kg', status: '已核算', attach: true },
    { id: 'C20260713-0078', date: '2026-07-13', type: '收入', cat: '其他', amount: 860, merchant: '废品回收', note: '纸箱酒瓶回收', status: '已核算', attach: false },
    { id: 'C20260712-0077', date: '2026-07-12', type: '支出', cat: '人力工资', amount: 7200, merchant: '员工工资', note: '后厨 3 人 7 月上半月', status: '待核算', attach: false },
    { id: 'C20260712-0076', date: '2026-07-12', type: '支出', cat: '物流仓储', amount: 450, merchant: '顺丰冷链', note: '7 月冷链配送费', status: '已核算', attach: true },
    { id: 'C20260711-0075', date: '2026-07-11', type: '支出', cat: '食材采购', amount: 2980, merchant: '老城粮油', note: '大米 200kg、食用油 40L', status: '异常', attach: false },
    { id: 'C20260711-0074', date: '2026-07-11', type: '支出', cat: '房租水电', amount: 5800, merchant: '物业', note: '7 月房租', status: '已核算', attach: true },
    { id: 'C20260710-0073', date: '2026-07-10', type: '支出', cat: '食材采购', amount: 2150, merchant: '青蔬鲜配', note: '蔬菜水果补货', status: '已核算', attach: false },
    { id: 'C20260709-0072', date: '2026-07-09', type: '支出', cat: '营销推广', amount: 300, merchant: '抖音本地生活', note: '达人探店车马费', status: '已核算', attach: true },
    { id: 'C20260708-0071', date: '2026-07-08', type: '支出', cat: '食材采购', amount: 3350, merchant: '川味食材批发', note: '干辣椒、花椒等调味 1 批', status: '已核算', attach: false },
    { id: 'C20260706-0070', date: '2026-07-06', type: '支出', cat: '设备折旧', amount: 1200, merchant: '财务计提', note: '厨房设备 7 月折旧', status: '已核算', attach: false },
    { id: 'C20260705-0069', date: '2026-07-05', type: '支出', cat: '食材采购', amount: 4120, merchant: '鲜锋肉品', note: '猪五花 60kg、排骨 30kg', status: '已核算', attach: true },
    { id: 'C20260704-0068', date: '2026-07-04', type: '支出', cat: '物流仓储', amount: 320, merchant: '美团跑腿', note: '外送包装盒补货', status: '已核算', attach: false },
    { id: 'C20260703-0067', date: '2026-07-03', type: '支出', cat: '人力工资', amount: 4800, merchant: '临时工', note: '周末帮工 2 人（2 天）', status: '已核算', attach: false },
    { id: 'C20260702-0066', date: '2026-07-02', type: '支出', cat: '食材采购', amount: 2650, merchant: '老城粮油', note: '调味料、干货补货', status: '已核算', attach: false },
    { id: 'C20260701-0065', date: '2026-07-01', type: '支出', cat: '房租水电', amount: 2860, merchant: '国家电网', note: '6 月电费', status: '已核算', attach: true },
    { id: 'C20260630-0064', date: '2026-06-30', type: '支出', cat: '营销推广', amount: 1500, merchant: '抖音本地生活', note: '6 月团购核销分成', status: '已核算', attach: false },
    { id: 'C20260628-0063', date: '2026-06-28', type: '支出', cat: '食材采购', amount: 5280, merchant: '川味食材批发', note: '6 月末集中备货', status: '已核算', attach: true }
  ],
  // 菜品成本卡（单位成本 = 材料 + 人工 + 分摊）
  products: [
    { id: 'p1', name: '水煮鱼', cat: '热菜', price: 68, cost: 24.6, ratio: 63.8, status: '达标', bomTotal: 18.6, labor: 4.2, overhead: 1.8,
      items: [
        { name: '黑鱼', spec: '750g', qty: '1 条', amount: 12.9 },
        { name: '黄豆芽', spec: '300g', qty: '1 份', amount: 1.6 },
        { name: '干辣椒/花椒', spec: '', qty: '1 份', amount: 2.4 },
        { name: '食用油及辅料', spec: '', qty: '1 份', amount: 1.7 }
      ],
      history: [26.1, 25.8, 26.4, 25.9, 25.2, 24.6] },
    { id: 'p2', name: '毛血旺', cat: '热菜', price: 58, cost: 22.9, ratio: 60.5, status: '达标', bomTotal: 16.1, labor: 4.0, overhead: 2.8,
      items: [
        { name: '毛肚', spec: '250g', qty: '1 份', amount: 8.5 },
        { name: '鸭血', spec: '400g', qty: '1 份', amount: 2.2 },
        { name: '午餐肉', spec: '200g', qty: '1 份', amount: 3.4 },
        { name: '豆芽/莴笋', spec: '', qty: '1 份', amount: 2.0 }
      ],
      history: [23.4, 23.1, 23.0, 22.8, 23.2, 22.9] },
    { id: 'p3', name: '回锅肉', cat: '热菜', price: 42, cost: 17.4, ratio: 58.6, status: '达标', bomTotal: 13.8, labor: 2.8, overhead: 0.8,
      items: [
        { name: '猪五花', spec: '400g', qty: '1 份', amount: 11.2 },
        { name: '青蒜/青椒', spec: '', qty: '1 份', amount: 1.6 },
        { name: '豆瓣酱辅料', spec: '', qty: '1 份', amount: 1.0 }
      ],
      history: [17.9, 17.6, 17.5, 17.4, 17.5, 17.4] },
    { id: 'p4', name: '酸菜鱼', cat: '热菜', price: 66, cost: 23.8, ratio: 63.9, status: '达标', bomTotal: 18.8, labor: 3.4, overhead: 1.6,
      items: [
        { name: '花鲢', spec: '800g', qty: '1 份', amount: 13.6 },
        { name: '酸菜', spec: '400g', qty: '1 份', amount: 3.2 },
        { name: '配菜辅料', spec: '', qty: '1 份', amount: 2.0 }
      ],
      history: [24.9, 24.5, 24.2, 24.0, 23.9, 23.8] },
    { id: 'p5', name: '口水鸡', cat: '凉菜', price: 36, cost: 12.1, ratio: 66.4, status: '达标', bomTotal: 10.9, labor: 1.2, overhead: 0,
      items: [
        { name: '三黄鸡', spec: '600g', qty: '1 份', amount: 8.4 },
        { name: '红油料汁', spec: '', qty: '1 份', amount: 1.5 },
        { name: '配菜', spec: '', qty: '1 份', amount: 1.0 }
      ],
      history: [12.6, 12.4, 12.3, 12.2, 12.2, 12.1] },
    { id: 'p6', name: '担担面', cat: '主食', price: 18, cost: 6.3, ratio: 65.0, status: '超支', bomTotal: 5.5, labor: 0.8, overhead: 0,
      items: [
        { name: '碱水面', spec: '250g', qty: '1 份', amount: 1.8 },
        { name: '肉臊', spec: '80g', qty: '1 份', amount: 2.6 },
        { name: '花生碎/佐料', spec: '', qty: '1 份', amount: 1.1 }
      ],
      history: [5.9, 6.0, 6.1, 6.2, 6.3, 6.3] },
    { id: 'p7', name: '红糖糍粑', cat: '主食', price: 16, cost: 4.8, ratio: 70.0, status: '达标', bomTotal: 2.2, labor: 2.6, overhead: 0,
      items: [
        { name: '糯米', spec: '200g', qty: '1 份', amount: 0.9 },
        { name: '红糖浆', spec: '', qty: '1 份', amount: 0.8 },
        { name: '黄豆粉', spec: '', qty: '1 份', amount: 0.5 }
      ],
      history: [5.0, 4.9, 4.9, 4.8, 4.9, 4.8] },
    { id: 'p8', name: '桂花酸梅汤', cat: '饮品', price: 12, cost: 2.9, ratio: 75.8, status: '达标', bomTotal: 2.3, labor: 0.6, overhead: 0,
      items: [
        { name: '乌梅/山楂', spec: '', qty: '1 份', amount: 1.1 },
        { name: '冰糖', spec: '', qty: '1 份', amount: 0.5 },
        { name: '包装杯', spec: '', qty: '1 份', amount: 0.7 }
      ],
      history: [3.1, 3.0, 3.0, 2.9, 3.0, 2.9] }
  ],
  // 近 6 月成本/收入趋势
  trend: [
    { month: '2026-02', cost: 102400, revenue: 168200 },
    { month: '2026-03', cost: 109800, revenue: 182600 },
    { month: '2026-04', cost: 112600, revenue: 191400 },
    { month: '2026-05', cost: 114200, revenue: 198800 },
    { month: '2026-06', cost: 116980, revenue: 198400 },
    { month: '2026-07', cost: 128640, revenue: 214300 }
  ],
  // 本月成本构成（求和 = 128,640）
  share: [
    { cat: '食材采购', amount: 61240, pct: 47.6 },
    { cat: '人力工资', amount: 28800, pct: 22.4 },
    { cat: '房租水电', amount: 15480, pct: 12.0 },
    { cat: '营销推广', amount: 10800, pct: 8.4 },
    { cat: '物流仓储', amount: 4560, pct: 3.5 },
    { cat: '设备折旧', amount: 3860, pct: 3.0 },
    { cat: '其他', amount: 3900, pct: 3.0 }
  ],
  // 上月成本构成（求和 = 116,980）
  shareLast: [
    { cat: '食材采购', amount: 56240, pct: 48.1 },
    { cat: '人力工资', amount: 27600, pct: 23.6 },
    { cat: '房租水电', amount: 15020, pct: 12.8 },
    { cat: '营销推广', amount: 9200, pct: 7.9 },
    { cat: '物流仓储', amount: 4230, pct: 3.6 },
    { cat: '设备折旧', amount: 2890, pct: 2.5 },
    { cat: '其他', amount: 1800, pct: 1.5 }
  ],
  periods: {
    cur: { label: '本月', cost: 128640, revenue: 214300, ratio: 60.0, ratioDelta: 1.8 },
    last: { label: '上月', cost: 116980, revenue: 198400, ratio: 58.2, ratioDelta: -1.8 }
  },
  // TOP5 高成本菜品
  topProducts: [
    { name: '水煮鱼', cost: 24.6, ratio: 63.8, delta: -1.5 },
    { name: '酸菜鱼', cost: 23.8, ratio: 63.9, delta: -0.4 },
    { name: '毛血旺', cost: 22.9, ratio: 60.5, delta: -0.3 },
    { name: '回锅肉', cost: 17.4, ratio: 58.6, delta: -0.1 },
    { name: '口水鸡', cost: 12.1, ratio: 66.4, delta: -0.5 }
  ],
  // 供应商（本月应付合计 = 86,240）
  suppliers: [
    { id: 's1', name: '川味食材批发', contact: '王姐', cat: '食材', spend: 31860, orders: 23, trend: 'up', initial: '川' },
    { id: 's2', name: '老城粮油', contact: '刘师傅', cat: '粮油', spend: 15680, orders: 11, trend: 'down', initial: '老' },
    { id: 's3', name: '青蔬鲜配', contact: '小陈', cat: '蔬菜', spend: 12840, orders: 18, trend: 'up', initial: '青' },
    { id: 's4', name: '鲜锋肉品', contact: '赵老板', cat: '肉禽', spend: 11320, orders: 9, trend: 'down', initial: '鲜' },
    { id: 's5', name: '顺丰冷链', contact: '客服', cat: '物流', spend: 6840, orders: 15, trend: 'up', initial: '顺' },
    { id: 's6', name: '美团外卖', contact: '运营顾问', cat: '平台', spend: 7700, orders: 7, trend: 'up', initial: '美' }
  ],
  // 月度报表（3 期）
  reports: [
    { id: 'R202606', month: '2026-06', label: '2026 年 6 月', totalCost: 116980, revenue: 198400, margin: 81420, ratio: 58.2, status: '已生成',
      items: [
        { cat: '食材采购', amount: 56240, pct: 48.1, delta: -0.6 },
        { cat: '人力工资', amount: 27600, pct: 23.6, delta: 0.4 },
        { cat: '房租水电', amount: 15020, pct: 12.8, delta: 0 },
        { cat: '营销推广', amount: 9200, pct: 7.9, delta: 0.8 },
        { cat: '物流仓储', amount: 4230, pct: 3.6, delta: -0.2 },
        { cat: '设备折旧', amount: 2890, pct: 2.5, delta: 0 },
        { cat: '其他', amount: 1800, pct: 1.5, delta: -0.4 }
      ] },
    { id: 'R202605', month: '2026-05', label: '2026 年 5 月', totalCost: 114200, revenue: 198800, margin: 84600, ratio: 57.4, status: '已生成',
      items: [
        { cat: '食材采购', amount: 53900, pct: 47.2, delta: 0.8 },
        { cat: '人力工资', amount: 26500, pct: 23.2, delta: 0.2 },
        { cat: '房租水电', amount: 15020, pct: 13.2, delta: 0 },
        { cat: '营销推广', amount: 8100, pct: 7.1, delta: -0.5 },
        { cat: '物流仓储', amount: 4340, pct: 3.8, delta: 0.1 },
        { cat: '设备折旧', amount: 2890, pct: 2.5, delta: 0 },
        { cat: '其他', amount: 3450, pct: 3.0, delta: 0.3 }
      ] },
    { id: 'R202604', month: '2026-04', label: '2026 年 4 月', totalCost: 112600, revenue: 191400, margin: 78800, ratio: 58.8, status: '已生成',
      items: [
        { cat: '食材采购', amount: 52700, pct: 46.8, delta: -1.2 },
        { cat: '人力工资', amount: 26200, pct: 23.3, delta: 0.5 },
        { cat: '房租水电', amount: 15020, pct: 13.3, delta: 0 },
        { cat: '营销推广', amount: 8700, pct: 7.7, delta: 1.1 },
        { cat: '物流仓储', amount: 4180, pct: 3.7, delta: -0.1 },
        { cat: '设备折旧', amount: 2890, pct: 2.6, delta: 0 },
        { cat: '其他', amount: 2910, pct: 2.6, delta: -0.3 }
      ] }
  ],
  // 待办提醒
  alerts: [
    { kind: 'pending', title: '3 笔单据待核算', desc: '含 7/12 人力工资 ¥7,200', meta: '前往记账' },
    { kind: 'over', title: '食材采购超预算 12.6%', desc: '较月度预算多 ¥6,860', meta: '查看分析' },
    { kind: 'wave', title: '7 月成本率波动提醒', desc: '成本率 60.0%，环比 +1.8pp', meta: '查看趋势' }
  ],
  // 行业引导模板：注册引导时按所选行业初始化成本分类
  industryTemplates: {
    canteen: {
      id: 'canteen', name: '餐饮', desc: '餐厅 / 小吃 / 饮品店', icon: 'utensils',
      categories: [
        { id: 't1', name: '食材采购', color: '#0D7261' },
        { id: 't2', name: '人力工资', color: '#3E6FA8' },
        { id: 't3', name: '房租水电', color: '#B97A12' },
        { id: 't4', name: '营销推广', color: '#8A5FA8' },
        { id: 't5', name: '物流仓储', color: '#C24A38' },
        { id: 't6', name: '设备折旧', color: '#5B7C6B' },
        { id: 't7', name: '其他', color: '#9B978D' }
      ],
      // 隐性成本基准（docs/08-hidden-cost-engine.md）
      hiddenCost: {
        foodLoss: { low: 5, high: 8, mid: 5 },   // 食材损耗率 %
        utility: { rate: 0.10 },                  // 水电隐性浪费 10%
        expiry: { rate: 0.03 }                    // 库存过期 3%
      }
    },
    retail: {
      id: 'retail', name: '零售', desc: '超市 / 便利店 / 服装店', icon: 'store',
      categories: [
        { id: 't1', name: '商品采购', color: '#0D7261' },
        { id: 't2', name: '人力工资', color: '#3E6FA8' },
        { id: 't3', name: '房租水电', color: '#B97A12' },
        { id: 't4', name: '营销推广', color: '#8A5FA8' },
        { id: 't5', name: '物流配送', color: '#5B7C6B' },
        { id: 't6', name: '损耗报损', color: '#C24A38' },
        { id: 't7', name: '其他', color: '#9B978D' }
      ],
      hiddenCost: {
        shrinkage: { low: 1, high: 3, mid: 1.6 }, // 门店损耗率 %（NRF 均值 1.4-1.6%）
        carrying: { rate: 0.25 },                  // 库存年化持有成本
        obsolete: { rate: 0.25 }                   // 滞销过时率
      }
    },
    fresh: {
      id: 'fresh', name: '生鲜果蔬', desc: '菜场 / 水果店 / 水产', icon: 'shopping-basket',
      categories: [
        { id: 't1', name: '进货采购', color: '#0D7261' },
        { id: 't2', name: '损耗报损', color: '#C24A38' },
        { id: 't3', name: '摊位租金', color: '#B97A12' },
        { id: 't4', name: '水电杂费', color: '#3E6FA8' },
        { id: 't5', name: '人力工资', color: '#8A5FA8' },
        { id: 't6', name: '物流运费', color: '#5B7C6B' },
        { id: 't7', name: '其他', color: '#9B978D' }
      ],
      hiddenCost: {
        loss: { low: 2, high: 5, mid: 3.5 }, // 综合损耗率 %（叶菜/水产 ≤5%）
        coldchain: { rate: 0.10 },           // 冷链电费占比
        shr2: { rate: 3 }                    // 鲜度折价 3%
      }
    },
    beauty: {
      id: 'beauty', name: '美容美发', desc: '理发 / 美甲 / 护肤', icon: 'scissors',
      categories: [
        { id: 't1', name: '产品耗材', color: '#0D7261' },
        { id: 't2', name: '人力工资', color: '#3E6FA8' },
        { id: 't3', name: '房租水电', color: '#B97A12' },
        { id: 't4', name: '营销推广', color: '#8A5FA8' },
        { id: 't5', name: '设备折旧', color: '#5B7C6B' },
        { id: 't6', name: '耗品杂项', color: '#C24A38' },
        { id: 't7', name: '其他', color: '#9B978D' }
      ],
      hiddenCost: {
        idle: { low: 21, high: 53, mid: 40 },  // 工位空置率 %（利用率中位 47%）
        noshow: { rate: 0.10 },                // 爽约率 10%
        chair: { vacancy: 0.2, share: 0.14 }   // 空置率 20% × 工位租金占比 14%
      }
    },
    factory: {
      id: 'factory', name: '小型制造', desc: '加工 / 作坊 / 工厂', icon: 'factory',
      categories: [
        { id: 't1', name: '原材料', color: '#0D7261' },
        { id: 't2', name: '人力工资', color: '#3E6FA8' },
        { id: 't3', name: '厂房水电', color: '#B97A12' },
        { id: 't4', name: '设备维护', color: '#5B7C6B' },
        { id: 't5', name: '物流运输', color: '#C24A38' },
        { id: 't6', name: '营销推广', color: '#8A5FA8' },
        { id: 't7', name: '其他', color: '#9B978D' }
      ],
      hiddenCost: {
        scrap: { low: 2, high: 5, mid: 3 },   // 废品率 %
        downtime: { rate: 0.07 },             // 停机损失占成本 7%
        rework: { rate: 0.05 }                // 返工工时占比 5%
      }
    },
    service: {
      id: 'service', name: '其他服务', desc: '培训 / 维修 / 家政', icon: 'sparkles',
      categories: [
        { id: 't1', name: '人力工资', color: '#3E6FA8' },
        { id: 't2', name: '房租水电', color: '#B97A12' },
        { id: 't3', name: '营销推广', color: '#8A5FA8' },
        { id: 't4', name: '办公耗材', color: '#0D7261' },
        { id: 't5', name: '差旅费用', color: '#5B7C6B' },
        { id: 't6', name: '其他', color: '#9B978D' }
      ],
      hiddenCost: {
        idle: { low: 20, high: 45, mid: 30 }, // 工时闲置率 %
        noshow: { rate: 0.12 },               // 爽约率 12%
        material: { rate: 0.08 }              // 耗材浪费率 8%
      }
    },
    // 商贸 · 摆摊商贩：为地摊/夜市/集市商贩优化的极简模型
    stall: {
      id: 'stall', name: '商贸摆摊', desc: '地摊 / 夜市 / 集市商贩', icon: 'shopping-cart',
      categories: [
        { id: 't1', name: '进货成本', color: '#0D7261' },
        { id: 't2', name: '摊位费', color: '#B97A12' },
        { id: 't3', name: '交通搬运', color: '#3E6FA8' },
        { id: 't4', name: '损耗折价', color: '#C24A38' },
        { id: 't5', name: '其他杂费', color: '#9B978D' }
      ],
      hiddenCost: {
        loss: { low: 5, high: 10, mid: 7 },    // 货品损耗率 %（无冷链环境更高）
        stallFee: { low: 5, high: 15, mid: 10 }, // 摊位费占营收 %
        weather: { rate: 0.15 },               // 出摊空档率 %（雨天/缺勤）
        clearance: { rate: 0.03 }              // 尾货折价损失 3%
      }
    }
  }
};
