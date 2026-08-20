// 算得清 · API 桩层：签名与未来真实接口一致，仅返回模拟数据。
// 后续接后端时，只需将各函数内的 delay/DB 读取替换为真实 fetch，函数签名与返回结构保持不变。
(function () {
  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function ok(data) { return { code: 0, data: data }; }

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
      var id = 'C20260714-' + String(100 + DB.records.length + 1);
      DB.records.unshift(Object.assign({ id: id }, rec));
      return ok({ id: id });
    },

    // TODO: replace with DELETE /api/records/:id → { ok: true }
    deleteRecord: async function (id) {
      await delay(350);
      for (var i = 0; i < DB.records.length; i++) {
        if (DB.records[i].id === id) { DB.records.splice(i, 1); break; }
      }
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
        p.bomTotal = Math.round((p.bomTotal + item.amount) * 100) / 100;
        p.cost = Math.round((p.bomTotal + p.labor + p.overhead) * 100) / 100;
        p.ratio = Math.round((1 - p.cost / p.price) * 1000) / 10;
        if (p.ratio < 60) p.status = '超支'; else p.status = '达标';
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
