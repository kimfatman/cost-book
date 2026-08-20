/* 算得清 · 隐性成本算法引擎（Hidden Cost Engine）
   - 按行业专属模型估算月度隐性成本
   - 输入：DB（经营数据 + 行业模板）+ Onboarding 配置
   - 输出：{ total, ratio, health, level, items[] }
   设计文档：docs/08-hidden-cost-engine.md */
(function () {
  'use strict';

  var CONFIG = null;

  /* 从行业模板读取基准配置（按行业实时读取，不做跨行业缓存） */
  function cfg(industry) {
    var tpl = DB.industryTemplates && DB.industryTemplates[industry];
    return (tpl && tpl.hiddenCost) || (DB.industryTemplates.canteen && DB.industryTemplates.canteen.hiddenCost) || null;
  }

  function round(n) { return Math.round(n * 100) / 100; }

  /* 分类金额小计（按名称模糊匹配） */
  function catTotal(names) {
    var sum = 0;
    DB.records.forEach(function (r) {
      if (r.type !== '支出') return;
      names.forEach(function (n) {
        if (r.cat.indexOf(n) >= 0) sum += Number(r.amount) || 0;
      });
    });
    return round(sum);
  }

  /* 单项健康度：实测率 vs 基准区间 → 0-100 */
  function rateHealth(rate, base) {
    var mid = (base.low + base.high) / 2;
    if (rate <= mid) return 92;
    if (rate <= base.high) return 78;
    if (rate <= base.high * 1.5) return 58;
    return 35;
  }

  /* 标准化成本项 */
  function item(key, name, icon, estimate, formula, benchmark, health, tip) {
    return {
      key: key, name: name, icon: icon,
      estimate: round(Math.max(estimate, 0)),
      formula: formula, benchmark: benchmark,
      health: health, tip: tip
    };
  }

  /* ============================================================
     行业专属计算模型
  ============================================================ */
  var MODELS = {

    /* 餐饮：食材损耗 + 成本率漏损（BOM 理论差）+ 水电隐性 + 库存过期 */
    canteen: function (m, ob) {
      var c = cfg('canteen');
      var rev = m.revenue || 0;
      var purchase = catTotal(['食材', '粮油', '蔬菜', '肉禽']) || rev * 0.35;

      /* 1. 食材损耗：实际损耗类记录优先，无则基准估算 */
      var lossActual = catTotal(['损耗', '报损']);
      var loss = lossActual || purchase * c.foodLoss.mid / 100;
      var lossHealth = lossActual ? rateHealth(lossActual / purchase * 100, c.foodLoss) : 72;

      /* 2. 成本率漏损：实际成本率 vs 理论成本率（BOM）
         BOM 仅含配方小料时理论成本率偏低（不完整），因此用行业理论成本率区间
         （食材 30-40% + 人工房租等 25-35%）作为参照，只对超出区间的部分计漏损 */
      var theoCost = 0, theoRev = 0;
      DB.products.forEach(function (p) {
        theoCost += (p.bomTotal || 0) + (p.labor || 0) + (p.overhead || 0);
        theoRev += p.price || 0;
      });
      var theoRatio = theoRev ? theoCost / theoRev * 100 : 0;
      var actualRatio = rev ? m.cost / rev * 100 : 0;
      /* 理论完整成本率：小料 BOM 成本率 + 人工房租 25-35% 区间中值 */
      var fullRatio = theoRatio + 30;
      /* 漏损 = 实际成本率超出"理论完整成本率 + 2pp 合理波动"的部分 */
      var leakPp = Math.max(actualRatio - fullRatio - 2, 0);
      var leak = leakPp > 0 ? rev * leakPp / 100 : 0;
      var leakHealth = leakPp <= 2 ? 88 : (leakPp <= 4 ? 70 : 45);

      /* 3. 水电隐性浪费 */
      var util = catTotal(['房租', '水电']) || m.cost * 0.12;
      var utilLoss = util * c.utility.rate;
      var utilHealth = 75;

      /* 4. 库存过期 */
      var expiry = purchase * c.expiry.rate;
      var expiryHealth = 80;

      var items = [
        item('loss', '食材损耗漏损', 'trash-2', loss,
          lossActual ? '损耗报损记录实际金额' : '食材采购额 × 基准损耗率 ' + c.foodLoss.mid + '%',
          '合格线 ' + c.foodLoss.low + '-' + c.foodLoss.high + '%', lossHealth,
          lossActual ? '已按实际报损记录估算，建议增加每日盘点校准' : '建议登记每日损耗与盘点差异，替换基准估算'),
        item('leak', '成本率漏损', 'percent', leak,
          '(实际成本率 ' + actualRatio.toFixed(1) + '% − 理论完整成本率 ' + fullRatio.toFixed(1) + '%) × 营收',
          'BOM 小料 + 人工房租约 30%', leakHealth,
          leakPp > 2 ? '实际成本率显著高于理论口径，检查称重误差、跑单与采购溢价' : '成本率与理论口径一致，控制良好'),
        item('utility', '水电隐性浪费', 'zap', utilLoss,
          '房租水电 ¥' + fmtMoney0(util) + ' × 隐性浪费率 ' + (c.utility.rate * 100) + '%',
          '未计量浪费约 8-12%', utilHealth, '待机能耗与冷库/设备空转是主要漏损点，可加装分项计量'),
        item('expiry', '库存过期损耗', 'package', expiry,
          '食材采购 ¥' + fmtMoney0(purchase) + ' × ' + (c.expiry.rate * 100) + '%',
          '囤货过期约 3%', expiryHealth, '按先进先出补货，烘焙/茶饮等短保品类建议提升订货频次')
      ];
      return items;
    },

    /* 零售：门店损耗 + 库存持有 + 滞销过时 */
    retail: function (m) {
      var c = cfg('retail');
      var rev = m.revenue || 0;

      var shrink = rev * c.shrinkage.mid / 100;
      var shrinkHealth = rateHealth(c.shrinkage.mid, c.shrinkage);

      /* 采购基数：有实际记录用记录，无记录用成本口径（不超总成本）*/
      var purchase = catTotal(['商品采购', '进货']);
      if (!purchase) purchase = Math.min(rev * 0.6, m.cost, m.cost * 0.7);
      var carry = purchase * c.carrying.rate / 12;
      var carryHealth = 78;

      var stale = purchase * c.obsolete.rate * 0.5;
      var staleHealth = 75;

      return [
        item('shrink', '门店损耗（Shrinkage）', 'shopping-basket', shrink,
          '营收 ¥' + fmtMoney0(rev) + ' × 基准损耗率 ' + c.shrinkage.mid + '%',
          '行业均值 ' + c.shrinkage.low + '-' + c.shrinkage.high + '%', shrinkHealth,
          '定期盘点并与账面比对，损耗超 3% 排查破损与上架流程'),
        item('carry', '库存持有成本', 'archive', carry,
          '商品采购 ¥' + fmtMoney0(purchase) + ' × 年化持有 ' + (c.carrying.rate * 100) + '% ÷ 12',
          '资金+仓储+保险+折旧 约年化 25%', carryHealth,
          '压缩高值低周转库存，ABC 分类管理减少资金占用'),
        item('stale', '滞销过时损失', 'trending-down', stale,
          '商品采购 ¥' + fmtMoney0(purchase) + ' × ' + (c.obsolete.rate * 100) + '% 过时率 × 折价 50%',
          '服装等季末 20-30% 过时', staleHealth,
          '临近过季前提前促销清库，避免折价加深')
      ];
    },

    /* 生鲜：商品损耗（按品类）+ 冷链电费 */
    fresh: function (m) {
      var c = cfg('fresh');
      var rev = m.revenue || 0;
      var purchase = catTotal(['进货', '采购']) || rev * 0.65;

      var loss = purchase * c.loss.mid / 100;
      var lossHealth = rateHealth(c.loss.mid, c.loss);

      var util = catTotal(['水电']) || m.cost * 0.1;
      var cold = util * c.coldchain.rate;
      var coldHealth = 76;

      var lossAmt = catTotal(['损耗', '报损']);
      var amtRatio = lossAmt && rev ? lossAmt / (lossAmt + rev) * 100 : 0;

      return [
        item('loss', '商品损耗', 'leaf', loss,
          '进货额 ¥' + fmtMoney0(purchase) + ' × 综合损耗率 ' + c.loss.mid + '%',
          '整体 ≤' + c.loss.high + '%（叶菜/水产 ≤5%）', lossHealth,
          amtRatio > c.loss.high ? '金额损耗率 ' + amtRatio.toFixed(1) + '% 已超线，优化订货周期与陈列' : '损耗在可控区间，坚持先进先出'),
        item('cold', '冷链隐性电费', 'snowflake', cold,
          '水电 ¥' + fmtMoney0(util) + ' × 冷链占比 ' + (c.coldchain.rate * 100) + '%',
          '冷柜/冰台占门店电费 8-12%', coldHealth,
          '冷柜定期除霜、夜间调温可节省 15% 以上冷链电费'),
        item('shr2', '退换与鲜度损失', 'refresh-cw', lossAmt || rev * c.shr2.rate / 100,
          lossAmt ? '损耗报损记录实际金额' : '营收 × ' + c.shr2.rate + '%',
          '鲜度折价销售约 2-4%', amtRatio ? rateHealth(amtRatio, c.loss) : 76,
          '临期商品先折价清货，降低报损量')
      ];
    },

    /* 美容美发：工时空置 + 爽约 + 空置工位 */
    beauty: function (m) {
      var c = cfg('beauty');
      var rev = m.revenue || 0;
      var labor = catTotal(['人力', '工资']) || m.cost * 0.45;

      /* 技师利用率：无数据时用中位 47%，可售工时按 22 天 × 8h */
      var utilRate = 0.6; /* 默认按健康线估算；有排班数据可替换 */
      var idle = labor * (1 - utilRate);
      var idleHealth = rateHealth((1 - utilRate) * 100, c.idle);

      var noShow = rev * c.noshow.rate / 100;
      var noShowHealth = 78;

      var rent = catTotal(['房租']) || m.cost * 0.2;
      var chair = rent * c.chair.vacancy * c.chair.share;
      var chairHealth = 74;

      return [
        item('idle', '工时空置成本', 'clock', idle,
          '人力工资 ¥' + fmtMoney0(labor) + ' × 空置率 ' + ((1 - utilRate) * 100).toFixed(0) + '%',
          '利用率中位 47% / 标杆 79%', idleHealth,
          '按预约密度动态排班，错峰安排培训与盘点填充空档'),
        item('noshow', '爽约损失', 'calendar-x', noShow,
          '营收 ¥' + fmtMoney0(rev) + ' × 爽约率 ' + (c.noshow.rate * 100) + '%',
          '行业爽约率 10-15%', noShowHealth,
          '预约前 24h 短信确认，可降低约 40% 爽约'),
        item('chair', '空置工位分摊', 'armchair', chair,
          '房租 ¥' + fmtMoney0(rent) + ' × 空置率 ' + (c.chair.vacancy * 100) + '% × 工位占比 ' + (c.chair.share * 100) + '%',
          '工位占房租 10-18%', chairHealth,
          '空工位 = 租金在烧，提高翻台或引入合租分时')
      ];
    },

    /* 小型制造：废品 + 停机 + 返工 */
    factory: function (m) {
      var c = cfg('factory');
      var rev = m.revenue || 0;
      var material = catTotal(['原材料']) || m.cost * 0.6;

      var scrap = material * c.scrap.mid / 100;
      var scrapHealth = rateHealth(c.scrap.mid, c.scrap);

      var oeeAvail = 0.9; /* 可用率默认 90%，有设备记录可替换 */
      var downtime = m.cost * c.downtime.rate;
      var downHealth = 76;

      var rework = labor();
      function labor() { return catTotal(['人力', '工资']) || m.cost * 0.2; }
      var reworkCost = rework * c.rework.rate;
      var reworkHealth = 78;

      return [
        item('scrap', '废品损失', 'x-circle', scrap,
          '原材料 ¥' + fmtMoney0(material) + ' × 废品率 ' + c.scrap.mid + '%',
          '行业废品率 ' + c.scrap.low + '-' + c.scrap.high + '%', scrapHealth,
          '记录废品原因与工位，首件检验可大幅降低批量报废'),
        item('downtime', '停机损失', 'pause-circle', downtime,
          '总成本 ¥' + fmtMoney0(m.cost) + ' × 停机损失率 ' + (c.downtime.rate * 100) + '%',
          'OEE 可用率损失占产能 5-10%', downHealth,
          'OEE = 可用率×性能率×良品率，优先处理高频短停机'),
        item('rework', '返工成本（Hidden Factory）', 'refresh-cw', reworkCost,
          '人力 ¥' + fmtMoney0(rework) + ' × 返工工时占比 ' + (c.rework.rate * 100) + '%',
          '一次合格率 FPY ≥98%', reworkHealth,
          '返工是隐形工厂：统计返工工时与原因，按根因改善')
      ];
    },

    /* 商贸摆摊：货品损耗 + 摊位费占比 + 出摊空档 + 尾货折价（摆摊专属） */
    stall: function (m) {
      var c = cfg('stall');
      var rev = m.revenue || 0;
      var purchase = catTotal(['进货']) || rev * 0.55;

      /* 1. 货品损耗：无冷链环境损耗率 5-10% */
      var loss = purchase * c.loss.mid / 100;
      var lossHealth = rateHealth(c.loss.mid, c.loss);

      /* 2. 摊位费占比检查：摊位费 ÷ 营收，超 15% 警示 */
      var fee = catTotal(['摊位']) || rev * c.stallFee.mid / 100;
      var feeRatio = rev ? fee / rev * 100 : 0;
      var feeHealth = rateHealth(feeRatio, c.stallFee);

      /* 3. 出摊空档损失：雨天/缺勤日固定成本沉没（摊位费+交通按日分摊） */
      var fixed = fee + catTotal(['交通', '搬运']);
      var gap = fixed * c.weather.rate;
      var gapHealth = 74;

      /* 4. 尾货折价：收摊前甩卖损失 */
      var clear = purchase * c.clearance.rate;
      var clearHealth = 80;

      return [
        item('loss', '货品损耗', 'trash-2', loss,
          '进货额 ¥' + fmtMoney0(purchase) + ' × 损耗率 ' + c.loss.mid + '%',
          '摆摊无冷链损耗 5-10%', lossHealth,
          '按销量分批补货、收摊前降价清尾，避免隔夜损耗'),
        item('fee', '摊位费占比', 'landmark', fee,
          '摊位费 ¥' + fmtMoney0(fee) + ' ÷ 营收 ' + feeRatio.toFixed(1) + '%',
          '健康线 ≤' + c.stallFee.high + '%', feeHealth,
          feeRatio > c.stallFee.high ? '摊位费占营收 ' + feeRatio.toFixed(1) + '% 已超线，评估换摊/分时租摊' : '摊位费占比合理'),
        item('gap', '出摊空档损失', 'cloud-rain', gap,
          '固定成本（摊位费+交通）¥' + fmtMoney0(fixed) + ' × 空档率 ' + (c.weather.rate * 100) + '%',
          '雨天/缺勤造成固定成本沉没', gapHealth,
          '雨天转线上甩卖或备好雨棚，减少"出摊即亏"的天数'),
        item('clear', '尾货折价损失', 'percent', clear,
          '进货额 ¥' + fmtMoney0(purchase) + ' × 折价率 ' + (c.clearance.rate * 100) + '%',
          '收摊甩卖损失约 3%', clearHealth,
          '按当日客流预估进货量，宁可少进勤补')
      ];
    },

    /* 其他服务：工时利用率 + 爽约 + 耗材 */
    service: function (m) {
      var c = cfg('service');
      var rev = m.revenue || 0;
      var labor = catTotal(['人力', '工资']) || m.cost * 0.55;

      var idle = labor * 0.3;
      var idleHealth = rateHealth(30, c.idle);

      var noShow = rev * c.noshow.rate / 100;
      var noShowHealth = 78;

      var mat = catTotal(['耗材', '办公']) || m.cost * 0.08;
      var matLoss = mat * c.material.rate;
      var matHealth = 80;

      return [
        item('idle', '工时利用率损失', 'clock', idle,
          '人力 ¥' + fmtMoney0(labor) + ' × 预估闲置 30%',
          '服务行业利用率基准 65%+', idleHealth,
          '排班按需求波动，闲时安排回访与客户维护'),
        item('noshow', '爽约/取消损失', 'calendar-x', noShow,
          '营收 ¥' + fmtMoney0(rev) + ' × 爽约率 ' + (c.noshow.rate * 100) + '%',
          '行业爽约率 10-15%', noShowHealth,
          '预收定金或到店前确认，显著降低空档'),
        item('material', '耗材浪费', 'layers', matLoss,
          '耗材 ¥' + fmtMoney0(mat) + ' × 浪费率 ' + (c.material.rate * 100) + '%',
          '耗材浪费约 6-10%', matHealth,
          '按单领料登记，减少无主耗材流失')
      ];
    }
  };

  /* ============================================================
     引擎入口
  ============================================================ */
  function estimate() {
    var ob = window.Onboarding && Onboarding.read ? Onboarding.read() : null;
    var industry = (ob && ob.industry) || 'canteen';
    var m = DB.month || {};
    var model = MODELS[industry] || MODELS.canteen;

    var items = model(m, ob || {});
    var total = 0;
    items.forEach(function (it) { total += it.estimate; });

    var rev = m.revenue || 1;
    var ratio = total / rev * 100;

    /* 加权健康度 */
    var wsum = 0, wtotal = 0;
    items.forEach(function (it) {
      wsum += it.health * it.estimate;
      wtotal += it.estimate;
    });
    var health = wtotal > 0 ? Math.round(wsum / wtotal) : 80;
    var level = health >= 85 ? '优' : (health >= 70 ? '良' : (health >= 55 ? '注意' : '警示'));

    return {
      industry: industry,
      industryName: (DB.industryTemplates[industry] && DB.industryTemplates[industry].name) || '',
      total: round(total),
      ratio: round(ratio),
      health: health,
      level: level,
      items: items
    };
  }

  window.HiddenCost = {
    estimate: estimate,
    MODELS: MODELS
  };
})();
