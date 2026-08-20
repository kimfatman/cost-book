// 算得清 · API 桩层：签名与未来真实接口一致，仅返回模拟数据。
// 后续接后端时，只需将各函数内的 delay/DB 读取替换为真实 fetch，函数签名与返回结构保持不变。
(function () {
  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function ok(data) { return { code: 0, data: data }; }

  function round2(n) { return Math.round(n * 100) / 100; }
  function round1(n) { return Math.round(n * 10) / 10; }

  /* 本月口径判断（演示数据仅 2026-07 记账联动本月指标） */
  function isCurMonth(date) { return String(date || '').indexOf('2026-07') === 0; }

  /* 菜品成本率与状态（与 subpages.js deleteBom 共用同一规则） */
  function recalcProduct(p) {
    p.bomTotal = round2((p.items || []).reduce(function (s, it) { return s + (Number(it.amount) || 0); }, 0));
    p.cost = round2(p.bomTotal + (p.labor || 0) + (p.overhead || 0));
    p.ratio = Math.round((p.cost / p.price) * 1000) / 10;   // 成本率 = cost / price
    p.status = p.ratio > 45 ? '超支' : '达标';
    return p;
  }

  /* U3 修复：记账新增/删除后同步本月经营指标与成本构成 */
  function syncMonth(rec, delta) {
    if (!rec || !isCurMonth(rec.date)) return;
    var m = DB.month;
    var amt = Number(rec.amount) || 0;
    if (rec.type === '收入') {
      m.revenue = Math.max(0, round2(m.revenue + delta * amt));
    } else {
      m.cost = Math.max(0, round2(m.cost + delta * amt));
      var s = null;
      DB.share.forEach(function (x) { if (x.cat === rec.cat) s = x; });
      if (s) {
        s.amount = Math.max(0, round2(s.amount + delta * amt));
        var total = DB.share.reduce(function (sum, x) { return sum + x.amount; }, 0);
        DB.share.forEach(function (x) { x.pct = total > 0 ? round1(x.amount / total * 100) : 0; });
      }
    }
    m.profit = round2(m.revenue - m.cost);
    m.ratio = m.revenue > 0 ? round1(m.cost / m.revenue * 100) : 0;
    m.budgetUsed = DB.store.budget > 0 ? round1(m.cost / DB.store.budget * 100) : 0;
    m.recordCount = Math.max(0, m.recordCount + delta);
  }

  var api = {
    // TODO: replace with GET /api/overview  → { store, month, alerts }
    getOverview: async function () {
      await delay(420);
      return ok({ store: DB.store, month: DB.month, alerts: DB.alerts });
    },

    // TODO: replace with GET /api/records?type=&keyword=&cat=&page= → { list, total }
    getRecords: async function (opt) {
      await delay(360);
      opt = opt || {};
      var list = DB.records.filter(function (r) {
        if (opt.type && opt.type !== '全部' && r.type !== opt.type) return false;
        if (opt.cat && opt.cat !== '全部' && r.cat !== opt.cat) return false;
        if (opt.keyword) {
          var kw = opt.keyword.toLowerCase();
          if (r.merchant.toLowerCase().indexOf(kw) < 0 && r.note.toLowerCase().indexOf(kw) < 0) return false;
        }
        return true;
      });
      return ok({ list: list, total: list.length });
    },

    // TODO: replace with POST /api/records  → { id }
    saveRecord: async function (rec) {
      await delay(600);
      /* 单号取现有最大序号 +1，补零与历史格式一致（C20260714-0083） */
      var maxSeq = 0;
      DB.records.forEach(function (r) {
        var m = /-(\d+)$/.exec(r.id);
        if (m) maxSeq = Math.max(maxSeq, Number(m[1]));
      });
      var id = 'C20260714-' + ('0000' + (maxSeq + 1)).slice(-4);
      DB.records.unshift(Object.assign({ id: id }, rec));
      syncMonth(rec, 1);
      return ok({ id: id });
    },

    // TODO: replace with DELETE /api/records/:id → { ok: true }
    deleteRecord: async function (id) {
      await delay(350);
      var removed = null;
      for (var i = 0; i < DB.records.length; i++) {
        if (DB.records[i].id === id) { removed = DB.records[i]; DB.records.splice(i, 1); break; }
      }
      if (removed) syncMonth(removed, -1);
      return ok({ ok: true });
    },

    // TODO: replace with GET /api/products?cat=&keyword= → { list, avgRatio, overCount }
    getProducts: async function (opt) {
      await delay(380);
      opt = opt || {};
      var list = DB.products.filter(function (p) {
        if (opt.cat && opt.cat !== '全部' && p.cat !== opt.cat) return false;
        if (opt.keyword && p.name.toLowerCase().indexOf(opt.keyword.toLowerCase()) < 0) return false;
        return true;
      });
      var avgRatio = (list.reduce(function (s, p) { return s + p.ratio; }, 0) / Math.max(list.length, 1));
      var overCount = list.filter(function (p) { return p.status === '超支'; }).length;
      return ok({ list: list, avgRatio: avgRatio, overCount: overCount, total: DB.products.length });
    },

    // TODO: replace with GET /api/products/:id → { product }
    getProduct: async function (id) {
      await delay(320);
      var p = null;
      for (var i = 0; i < DB.products.length; i++) { if (DB.products[i].id === id) { p = DB.products[i]; break; } }
      return ok({ product: p });
    },

    // TODO: replace with POST /api/products/:id/bom  → { product }
    addBomItem: async function (id, item) {
      await delay(450);
      var p = null;
      for (var i = 0; i < DB.products.length; i++) { if (DB.products[i].id === id) { p = DB.products[i]; break; } }
      if (p) {
        p.items.push(item);
        recalcProduct(p);
      }
      return ok({ product: p });
    },

    // TODO: replace with GET /api/analysis?period= → { period, share, trend, top, suppliers }
    getAnalysis: async function (period) {
      await delay(420);
      var share = period === 'last' ? DB.shareLast : DB.share;
      var per = period === 'last' ? DB.periods.last : DB.periods.cur;
      return ok({ period: per, share: share, trend: DB.trend, top: DB.topProducts, suppliers: DB.suppliers });
    },

    // TODO: replace with GET /api/reports → { list }
    getReports: async function () {
      await delay(360);
      return ok({ list: DB.reports });
    },

    // TODO: replace with GET /api/reports/:id → { report }
    getReport: async function (id) {
      await delay(300);
      var r = null;
      for (var i = 0; i < DB.reports.length; i++) { if (DB.reports[i].id === id) { r = DB.reports[i]; break; } }
      return ok({ report: r });
    },

    // TODO: replace with GET /api/suppliers?keyword= → { list, total }
    getSuppliers: async function (opt) {
      await delay(340);
      opt = opt || {};
      var list = DB.suppliers.filter(function (s) {
        if (opt.keyword && s.name.toLowerCase().indexOf(opt.keyword.toLowerCase()) < 0) return false;
        return true;
      });
      return ok({ list: list, total: DB.suppliers.length });
    },

    // TODO: replace with POST /api/suppliers  /  PUT /api/suppliers/:id → { id }
    saveSupplier: async function (sup) {
      await delay(500);
      if (sup.id) {
        for (var i = 0; i < DB.suppliers.length; i++) {
          if (DB.suppliers[i].id === sup.id) { DB.suppliers[i] = Object.assign(DB.suppliers[i], sup); break; }
        }
      } else {
        sup.id = 's' + (DB.suppliers.length + 1);
        sup.spend = 0; sup.orders = 0; sup.trend = 'up';
        sup.initial = sup.name.charAt(0);
        DB.suppliers.push(sup);
      }
      return ok({ id: sup.id });
    },

    // TODO: replace with DELETE /api/suppliers/:id → { ok }
    deleteSupplier: async function (id) {
      await delay(320);
      for (var i = 0; i < DB.suppliers.length; i++) { if (DB.suppliers[i].id === id) { DB.suppliers.splice(i, 1); break; } }
      return ok({ ok: true });
    },

    // TODO: replace with GET /api/categories → { list }
    getCategories: async function () {
      await delay(300);
      return ok({ list: DB.categories });
    },

    // TODO: replace with POST /api/categories / PUT /api/categories/:id → { id }
    saveCategory: async function (cat) {
      await delay(450);
      if (cat.id) {
        for (var i = 0; i < DB.categories.length; i++) {
          if (DB.categories[i].id === cat.id) { DB.categories[i] = Object.assign(DB.categories[i], cat); break; }
        }
      } else {
        cat.id = 'c' + (DB.categories.length + 1);
        DB.categories.push(cat);
      }
      return ok({ id: cat.id });
    },

    // TODO: replace with DELETE /api/categories/:id → { ok }
    deleteCategory: async function (id) {
      await delay(320);
      var used = DB.records.some(function (r) { return r.cat === catName(id); });
      if (used) return ok({ ok: false, reason: '分类下仍有记录' });
      for (var i = 0; i < DB.categories.length; i++) { if (DB.categories[i].id === id) { DB.categories.splice(i, 1); break; } }
      return ok({ ok: true });

      function catName(cid) {
        for (var j = 0; j < DB.categories.length; j++) { if (DB.categories[j].id === cid) return DB.categories[j].name; }
        return '';
      }
    }
  };

  window.api = api;
})();
