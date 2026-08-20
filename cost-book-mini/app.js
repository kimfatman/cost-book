/* 算得清 · 应用核心
   - 路由（tab 切换 + 子页压栈/弹栈）
   - 全局 UI：toast / confirm / sheet / dialog
   - 模块注册调度：App.register({id, mount, demount, reload})
   - Tab 屏渲染：home / record / analysis / mine */
(function () {
  'use strict';

  var registry = {};
  var currentModule = null;   // 当前已挂载模块 id
  var stack = [];             // 页面栈（tab 也入栈）

  var dom = {};
  var els = [];

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- 通用事件托管（demount 自动清理） ---------- */
  function on(el, ev, fn) {
    if (!el) return;
    els.push([el, ev, fn]);
    el.addEventListener(ev, fn);
  }
  function clearEls() {
    els.forEach(function (t) { t[0].removeEventListener(t[1], t[2]); });
    els = [];
  }

  /* ---------- 格式化 ---------- */
  function money(n) {
    n = Number(n) || 0;
    return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function money0(n) {
    n = Math.round(Number(n) || 0);
    return n.toLocaleString('zh-CN');
  }
  function pct(n) { return (Number(n) || 0).toFixed(1); }
  function monthShort(m) { return m.slice(5) + '月'; }

  function catColor(name) {
    var c = null;
    DB.categories.forEach(function (x) { if (x.name === name) c = x.color; });
    return c || '#9B978D';
  }

  /* ---------- 图标辅助：JS 生成 data-ic 元素 ---------- */
  function ic(name, size) {
    var s = size ? ' style="width:' + size + 'px;height:' + size + 'px"' : '';
    return '<i class="ic"' + s + ' data-ic="' + name + '"></i>';
  }
  function inject() {
    document.querySelectorAll('[data-ic]').forEach(function (el) {
      var n = el.getAttribute('data-ic');
      if (window.ICONS[n]) el.innerHTML = window.ICONS[n];
    });
  }
  function scheduleInject(root) {
    if (window.ICONS) {
      var targets = (root || document).querySelectorAll('[data-ic]');
      targets.forEach(function (el) {
        var n = el.getAttribute('data-ic');
        if (window.ICONS[n]) el.innerHTML = window.ICONS[n];
      });
    }
  }

  /* ---------- 路由 ---------- */
  function setScreen(name, opts) {
    opts = opts || {};
    $all('.screen').forEach(function (s) {
      var active = s.getAttribute('data-screen') === name;
      s.classList.remove('is-active', 'is-stack', 'is-unstack');
      if (active) s.classList.add('is-active');
    });
    var scr = $('.screen[data-screen="' + name + '"]');
    if (scr) {
      scr.scrollTop = 0;
      dom.navTitle.textContent = scr.getAttribute('data-title') || '算得清';
      var isTab = scr.classList.contains('is-tab');
      dom.navBack.hidden = isTab;
      dom.tabbar.style.display = isTab ? 'flex' : 'none';
      // 悬浮记账按钮仅记账页显示
      if (dom.fab) dom.fab.classList.toggle('is-hidden', name !== 'record');
      $all('.tabbar a').forEach(function (a) {
        a.classList.toggle('is-active', isTab && a.getAttribute('data-tab') === name);
      });
      // 子页入场动画
      if (!isTab) scr.classList.add('is-stack');
    }
    document.body.setAttribute('data-screen', name);
  }

  function unmountCurrent() {
    if (currentModule && registry[currentModule] && registry[currentModule].demount) {
      registry[currentModule].demount();
    }
    currentModule = null;
  }

  function mountModule(id, force) {
    var m = registry[id];
    if (!m) return;
    if (currentModule === id && !force && m.reload) { m.reload(); return; }
    if (currentModule === id && !force) return;
    unmountCurrent();
    clearEls();
    currentModule = id;
    m.mount();
  }

  /* tab 切换（同一 tab 重复点击不重复入栈） */
  function showTab(tab, opts) {
    if (stack[stack.length - 1] === tab) return;
    // 移除栈中已有的同名 tab，避免重复
    for (var i = stack.length - 1; i >= 0; i--) {
      if (stack[i] === tab) stack.splice(i, 1);
    }
    stack.push(tab);
    if (opts) App.ctx = Object.assign(App.ctx || {}, opts);
    setScreen(tab, {});
    mountModule(tab, true);
  }

  /* 子页进入；目标为 tab 时走 tab 切换 */
  function go(name, opts) {
    var scr = $('.screen[data-screen="' + name + '"]');
    if (scr && scr.classList.contains('is-tab')) {
      showTab(name, opts);
      return;
    }
    stack.push(name);
    App.ctx = Object.assign(App.ctx || {}, opts || {});
    setScreen(name, opts);
    mountModule(name, true);
  }

  function back() {
    if (stack.length <= 1) return;
    var cur = stack.pop();
    var prev = stack[stack.length - 1];
    var scr = $('.screen[data-screen="' + cur + '"]');
    if (scr) {
      scr.classList.remove('is-stack');
      scr.classList.add('is-unstack');
      setTimeout(function () { scr.classList.remove('is-unstack'); }, 320);
    }
    setScreen(prev, {});
    mountModule(prev, true);
  }

  /* ---------- 全局 UI ---------- */
  var toastTimer = null;
  function toast(msg) {
    dom.toast.textContent = msg;
    dom.toast.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { dom.toast.classList.remove('is-show'); }, 1900);
  }

  function confirm(opts) {
    opts = opts || {};
    var ok = dom.dialog.querySelector('.js-dialog-ok');
    var cancel = dom.dialog.querySelector('.js-dialog-cancel');
    dom.dialog.querySelector('.c-dialog__title').textContent = opts.title || '确认操作';
    dom.dialog.querySelector('.c-dialog__desc').textContent = opts.desc || '';
    ok.textContent = opts.okText || '确定';
    ok.className = 'c-btn c-btn--primary js-dialog-ok' + (opts.danger ? ' js-danger' : '');
    cancel.style.display = '';
    var handler = function () { hideDialog(); opts.onOk && opts.onOk(); };
    ok.onclick = handler;
    cancel.onclick = function () { hideDialog(); };
    dom.mask.classList.add('is-show');
    dom.dialog.classList.add('is-show');
    ok.style.background = opts.danger ? 'var(--c-danger)' : '';
  }

  function hideDialog() {
    dom.mask.classList.remove('is-show');
    dom.dialog.classList.remove('is-show');
  }

  /* 底部动作面板：items = [{icon, label, danger, onClick}] */
  function sheet(items, title) {
    var box = dom.sheet;
    var html = '<div class="c-sheet__grab"></div>';
    if (title) html += '<div class="c-sheet__title">' + title + '</div>';
    items.forEach(function (it, i) {
      html += '<button class="c-sheet__item' + (it.danger ? ' c-sheet__item--danger' : '') + '" data-i="' + i + '">' +
        ic(it.icon) + '<span>' + it.label + '</span></button>';
    });
    box.innerHTML = html;
    scheduleInject(box);
    $all('.c-sheet__item', box).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var it = items[Number(btn.getAttribute('data-i'))];
        hideSheet();
        it.onClick && it.onClick();
      });
    });
    dom.mask.classList.add('is-show');
    box.classList.add('is-show');
  }
  function hideSheet() {
    dom.mask.classList.remove('is-show');
    dom.sheet.classList.remove('is-show');
  }
  function showMask() { dom.mask.classList.add('is-show'); }
  function hideMask() { dom.mask.classList.remove('is-show'); }

  /* ---------- 骨架屏 ---------- */
  function skeleton(kind) {
    if (kind === 'list') {
      var h = '';
      for (var i = 0; i < 6; i++) {
        h += '<div class="c-card sk-card" style="margin-bottom:10px;padding:14px 16px;">' +
          '<div class="c-skeleton__line c-skeleton" style="width:38%;"></div>' +
          '<div class="c-skeleton__line c-skeleton" style="width:76%;margin-bottom:0;"></div></div>';
      }
      return h;
    }
    if (kind === 'kpi') {
      return '<div class="c-card sk-card" style="margin-bottom:12px;padding:16px;"><div class="c-skeleton__line c-skeleton" style="width:40%;"></div>' +
        '<div class="c-skeleton__line c-skeleton" style="width:62%;height:20px;margin-bottom:0;"></div></div>' +
        '<div style="display:flex;gap:10px;margin-bottom:12px;">' +
        '<div class="c-skeleton__box c-skeleton" style="flex:1;height:88px;"></div>' +
        '<div class="c-skeleton__box c-skeleton" style="flex:1;height:88px;"></div></div>' +
        '<div class="c-skeleton__box c-skeleton" style="height:180px;border-radius:16px;"></div>';
    }
    return '<div class="c-skeleton__box c-skeleton" style="height:140px;border-radius:16px;"></div>';
  }

  /* ---------- 渲染工具 ---------- */
  function fill(id, html) {
    var el = $('#' + id);
    if (el) { el.innerHTML = html; scheduleInject(el); }
    return el;
  }

  /* ============================================================
     Tab 屏 1 · 工作台 home
  ============================================================ */
  function mountHome() {
    fill('homeKpi', skeleton('kpi'));
    fill('homeTrend', skeleton());
    fill('homeAlerts', skeleton('list'));
    api.getOverview().then(function (res) {
      var d = res.data;
      renderHome(d.store, d.month, d.alerts);
    });
  }
  function renderHome(store, m, alerts) {
    var h = '';

    /* 店铺卡 */
    h += '<div class="c-card c-card--hero" style="padding:18px 18px 20px;">';
    h += '<div style="display:flex;align-items:center;gap:11px;">' +
      '<div style="width:42px;height:42px;border-radius:13px;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;">' + ic('store', 22) + '</div>' +
      '<div style="flex:1;"><div style="font-size:16px;font-weight:800;letter-spacing:.3px;">' + store.name + '</div>' +
      '<div style="font-size:11px;opacity:.82;margin-top:2px;">' + store.type + ' · ' + store.plan + '</div></div>' +
      '<span class="c-tag c-tag--ok" style="background:rgba(255,255,255,.18);color:#fff;">' + ic('shield-check') + '信用 ' + store.credit + '</span></div>';
    h += '<div style="display:flex;align-items:flex-end;gap:8px;margin-top:20px;">' +
      '<div style="font-size:12px;opacity:.85;">本月总成本</div>' +
      '<div class="t-num" style="font-size:30px;font-weight:800;line-height:1;">¥' + money0(m.cost) + '</div></div>';
    h += '<div style="margin-top:16px;display:flex;gap:10px;">' +
      '<button class="c-btn c-btn--sm" style="background:#fff;color:var(--c-brand);font-weight:700;flex:1;" data-navto="form" data-preset="expense">' + ic('plus') + ' 记一笔</button>' +
      '<button class="c-btn c-btn--sm" style="background:rgba(255,255,255,.16);color:#fff;flex:1;" data-navto="reports">' + ic('file-text') + ' 成本报表</button></div>';
    h += '</div>';

    /* 预算进度 */
    var budgetPct = m.budgetUsed;
    var barCls = budgetPct > 90 ? 'c-progress__bar--danger' : (budgetPct > 75 ? 'c-progress__bar--amber' : '');
    h += '<div class="c-card" style="margin-top:12px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
      '<div class="c-kpi__label">' + ic('coins') + '7 月成本预算</div>' +
      '<span class="t-num" style="font-size:12px;font-weight:700;color:' + (budgetPct > 90 ? 'var(--c-danger)' : 'var(--c-ink-2)') + ';">' + pct(budgetPct) + '% 已用</span></div>' +
      '<div class="c-progress"><div class="c-progress__bar ' + barCls + '" data-w="' + Math.min(budgetPct, 100) + '%" style="width:0"></div></div>' +
      '<div style="display:flex;justify-content:space-between;margin-top:8px;font-size:11px;color:var(--c-ink-3);">' +
      '<span class="t-num">已用 ¥' + money0(m.cost) + '</span><span class="t-num">预算 ¥' + money0(store.budget) + '</span></div></div>';

    /* KPI 卡片 */
    h += '<div style="display:flex;gap:10px;margin-top:12px;">';
    var kpis = [
      { label: '收入', val: '¥' + money0(m.revenue), delta: '+' + m.revenueDelta + '%', up: true, ic: 'trending-up' },
      { label: '毛利', val: '¥' + money0(m.profit), delta: '+' + m.profitDelta + '%', up: true, ic: 'trending-up' },
      { label: '成本率', val: pct(m.ratio) + '%', delta: '+' + m.ratioDelta + 'pp', up: false, ic: 'trending-up' }
    ];
    kpis.forEach(function (k) {
      h += '<div class="c-card" style="flex:1;padding:12px 13px;">' +
        '<div style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--c-ink-3);">' + ic(k.ic, 12) + k.label + '</div>' +
        '<div class="t-num" style="font-size:17px;font-weight:800;margin-top:5px;">' + k.val + '</div>' +
        '<div class="t-num" style="font-size:10px;font-weight:700;color:' + (k.up ? 'var(--c-danger)' : 'var(--c-ink-3)') + ';margin-top:3px;">' + k.delta + ' 环比</div></div>';
    });
    h += '</div>';

    /* 快捷入口 */
    h += '<div class="c-card" style="margin-top:12px;padding:12px 8px;">' +
      '<div style="display:flex;justify-content:space-around;">';
    var quicks = [
      { ic: 'notebook-pen', label: '记一笔', to: 'form' },
      { ic: 'utensils', label: '菜品成本', to: 'product' },
      { ic: 'file-text', label: '报表', to: 'reports' },
      { ic: 'truck', label: '供应商', to: 'suppliers' }
    ];
    quicks.forEach(function (q) {
      h += '<button class="c-btn" style="flex-direction:column;height:auto;gap:5px;padding:6px 12px;" data-navto="' + q.to + '">' +
        '<span style="width:38px;height:38px;border-radius:12px;background:var(--c-brand-soft);color:var(--c-brand);display:flex;align-items:center;justify-content:center;">' + ic(q.ic, 19) + '</span>' +
        '<span style="font-size:11px;font-weight:600;color:var(--c-ink-2);">' + q.label + '</span></button>';
    });
    h += '</div></div>';

    fill('homeKpi', h);

    /* 近 6 月趋势（柱线图） */
    var trendHtml = '<div class="sec-title"><span>近 6 月成本与收入</span><button class="link c-btn" data-navto="analysis">' + ic('chevron-right') + '</button></div>';
    trendHtml += '<div class="c-card">';
    trendHtml += '<div class="c-bars">';
    var max = 0;
    DB.trend.forEach(function (t) { max = Math.max(max, t.cost, t.revenue); });
    DB.trend.forEach(function (t, i) {
      var hc = Math.round(t.cost / max * 100);
      var hr = Math.round(t.revenue / max * 100);
      trendHtml += '<div class="c-bars__col">' +
        '<div style="display:flex;align-items:flex-end;gap:3px;flex:1;width:100%;justify-content:center;">' +
        '<div class="bar bar--cost" style="height:' + hc + '%;animation-delay:' + (i * .06) + 's;max-width:12px;width:9px;"></div>' +
        '<div class="bar bar--rev" style="height:' + hr + '%;animation-delay:' + (i * .06 + .03) + 's;max-width:12px;width:9px;"></div></div>' +
        '<div class="lbl">' + monthShort(t.month) + '</div></div>';
    });
    trendHtml += '</div>';
    trendHtml += '<div style="display:flex;gap:14px;justify-content:center;margin-top:10px;font-size:11px;color:var(--c-ink-3);">' +
      '<span style="display:inline-flex;align-items:center;gap:5px;"><i style="width:8px;height:8px;border-radius:2px;background:var(--c-brand);display:inline-block;"></i>成本</span>' +
      '<span style="display:inline-flex;align-items:center;gap:5px;"><i style="width:8px;height:8px;border-radius:2px;background:#D68F1E;display:inline-block;"></i>收入</span></div></div>';
    fill('homeTrend', trendHtml);

    /* 待办提醒 */
    var ah = '<div class="sec-title"><span>待办提醒</span><span style="font-size:11px;color:var(--c-ink-3);font-weight:400;">' + alerts.length + ' 项</span></div>';
    ah += '<div class="c-group">';
    alerts.forEach(function (a) {
      var icon = a.kind === 'pending' ? 'clipboard-list' : (a.kind === 'over' ? 'alert-triangle' : 'trending-up');
      var color = a.kind === 'pending' ? 'var(--c-brand)' : (a.kind === 'over' ? 'var(--c-danger)' : 'var(--c-amber)');
      var bg = a.kind === 'pending' ? 'var(--c-brand-soft)' : (a.kind === 'over' ? 'var(--c-danger-soft)' : 'var(--c-amber-soft)');
      ah += '<div class="c-card" style="padding:13px 15px;margin-bottom:9px;display:flex;align-items:center;gap:12px;">' +
        '<div style="width:38px;height:38px;border-radius:11px;background:' + bg + ';color:' + color + ';display:flex;align-items:center;justify-content:center;flex:none;">' + ic(icon, 19) + '</div>' +
        '<div style="flex:1;min-width:0;"><div style="font-size:13.5px;font-weight:700;">' + a.title + '</div>' +
        '<div style="font-size:11.5px;color:var(--c-ink-3);margin-top:1px;">' + a.desc + '</div></div>' +
        '<span style="font-size:11px;font-weight:600;color:var(--c-brand);flex:none;">' + a.meta + '</span></div>';
    });
    ah += '</div>';
    fill('homeAlerts', ah);

    /* 预算进度条动画 */
    setTimeout(function () {
      $all('.c-progress__bar[data-w]').forEach(function (b) { b.style.width = b.getAttribute('data-w'); });
    }, 120);
  }

  /* ============================================================
     Tab 屏 2 · 记账 record（filter 状态存 App.ctx.recordFilter）
  ============================================================ */
  var recordState = { type: '全部', keyword: '', cat: '全部' };

  function mountRecord() {
    renderRecordShell();
    loadRecords();
  }
  function reloadRecord() { renderRecordShell(); loadRecords(); }

  function renderRecordShell() {
    var h = '';
    /* 顶部统计条 */
    h += '<div class="c-card c-card--hero" style="padding:16px 18px;margin-bottom:12px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;">' +
      '<div><div style="font-size:12px;opacity:.85;">7 月已记账</div>' +
      '<div class="t-num" style="font-size:22px;font-weight:800;margin-top:3px;">¥' + money0(DB.month.cost) + '</div></div>' +
      '<div style="text-align:right;"><div style="font-size:12px;opacity:.85;">本月笔数</div>' +
      '<div class="t-num" style="font-size:22px;font-weight:800;margin-top:3px;">' + DB.month.recordCount + '<span style="font-size:12px;font-weight:600;opacity:.8;"> 笔</span></div></div></div></div>';

    /* 筛选条 */
    h += '<div class="filterbar">' +
      '<div class="c-search">' + ic('search') + '<input id="recSearch" placeholder="搜索商户 / 备注" value="' + recordState.keyword + '"></div>' +
      '<button class="c-btn c-btn--ghost c-btn--md" id="recFilterBtn">' + ic('filter') + ' 筛选</button></div>';

    /* 类型分段 + 分类 chips */
    h += '<div class="c-seg" style="margin-bottom:10px;" id="recTypeSeg">' +
      '<button data-t="全部" class="' + (recordState.type === '全部' ? 'is-active' : '') + '">全部</button>' +
      '<button data-t="支出" class="' + (recordState.type === '支出' ? 'is-active' : '') + '">支出</button>' +
      '<button data-t="收入" class="' + (recordState.type === '收入' ? 'is-active' : '') + '">收入</button></div>';
    h += '<div class="chips" style="margin-bottom:4px;" id="recCatChips">' +
      '<button class="c-chip' + (recordState.cat === '全部' ? ' is-active' : '') + '" data-c="全部">全部</button>';
    DB.categories.forEach(function (c) {
      h += '<button class="c-chip' + (recordState.cat === c.name ? ' is-active' : '') + '" data-c="' + c.name + '"><span style="width:7px;height:7px;border-radius:2px;background:' + c.color + ';display:inline-block;"></span>' + c.name + '</button>';
    });
    h += '</div>';

    h += '<div id="recListBox"></div>';
    fill('recordList', h);

    /* 事件 */
    var search = $('#recSearch');
    var debounce = null;
    on(search, 'input', function () {
      clearTimeout(debounce);
      debounce = setTimeout(function () { recordState.keyword = search.value.trim(); loadRecords(); }, 260);
    });
    on($('#recFilterBtn'), 'click', function () {
      sheet([
        { icon: 'wallet', label: '只看支出', onClick: function () { recordState.type = '支出'; reloadRecord(); } },
        { icon: 'trending-up', label: '只看收入', onClick: function () { recordState.type = '收入'; reloadRecord(); } },
        { icon: 'check', label: '全部类型', onClick: function () { recordState.type = '全部'; reloadRecord(); } }
      ], '筛选类型');
    });
    $all('#recTypeSeg button').forEach(function (b) {
      on(b, 'click', function () { recordState.type = b.getAttribute('data-t'); reloadRecord(); });
    });
    $all('#recCatChips .c-chip').forEach(function (b) {
      on(b, 'click', function () { recordState.cat = b.getAttribute('data-c'); reloadRecord(); });
    });
  }

  function loadRecords() {
    var box = $('#recListBox');
    box.innerHTML = '<div style="padding:8px 0;">' + skeleton('list') + '</div>';
    api.getRecords({ type: recordState.type, keyword: recordState.keyword, cat: recordState.cat }).then(function (res) {
      var list = res.data.list;
      if (!list.length) {
        box.innerHTML = '<div class="c-empty">' + ic('receipt') + '<p>没有符合条件的记录</p><div class="sub">换个筛选条件试试</div></div>';
        return;
      }
      /* 按日期分组 */
      var groups = [];
      list.forEach(function (r) {
        var g = null;
        for (var i = 0; i < groups.length; i++) { if (groups[i].date === r.date) { g = groups[i]; break; } }
        if (!g) { g = { date: r.date, items: [] }; groups.push(g); }
        g.items.push(r);
      });
      var h = '';
      groups.forEach(function (g) {
        h += '<div class="day-divider"><span>' + friendlyDate(g.date) + '</span></div>';
        h += '<div class="c-card" style="padding:4px 15px;">';
        g.items.forEach(function (r) {
          var color = r.type === '收入' ? 'var(--c-brand)' : 'var(--c-ink)';
          var sign = r.type === '收入' ? '+' : '−';
          var stTag = r.status === '已核算' ? '<span class="c-tag c-tag--ok">已核算</span>'
            : (r.status === '异常' ? '<span class="c-tag c-tag--danger">异常</span>' : '<span class="c-tag c-tag--warn">待核算</span>');
          h += '<div class="c-cell" data-id="' + r.id + '">' +
            '<div class="c-cell__icon" style="background:' + catColor(r.cat) + '22;color:' + catColor(r.cat) + ';">' + ic(r.type === '收入' ? 'trending-up' : 'receipt') + '</div>' +
            '<div class="c-cell__body"><div class="c-cell__title">' + r.merchant + '</div>' +
            '<div class="c-cell__sub">' + r.cat + ' · ' + r.id.slice(-4) + (r.attach ? ' · 有凭证' : '') + '</div></div>' +
            '<div style="text-align:right;"><div class="t-num" style="font-size:14px;font-weight:800;color:' + color + ';">' + sign + '¥' + money(r.amount) + '</div>' +
            '<div style="margin-top:2px;">' + stTag + '</div></div>' +
            '<div class="c-cell__arrow">' + ic('chevron-right') + '</div></div>';
        });
        h += '</div>';
      });
      box.innerHTML = h;
      /* 行点击 → 动作面板 */
      $all('#recListBox .c-cell').forEach(function (row) {
        on(row, 'click', function () {
          var id = row.getAttribute('data-id');
          var rec = null;
          DB.records.forEach(function (r) { if (r.id === id) rec = r; });
          if (!rec) return;
          sheet([
            { icon: 'eye', label: '查看详情', onClick: function () { viewRecord(rec); } },
            { icon: 'pencil', label: '编辑此笔', onClick: function () { openForm(rec); } },
            { icon: 'trash-2', label: '删除记录', danger: true, onClick: function () { removeRecord(rec); } }
          ], rec.merchant + ' · ' + rec.id);
        });
      });
    });
  }

  function friendlyDate(d) {
    var today = '2026-07-14';
    if (d === today) return '今天 · ' + d.slice(5).replace('-', '月') + '日';
    return d.slice(5).replace('-', '月') + '日 · 周' + '一二三四五六日'[new Date(d).getDay()];
  }

  function viewRecord(rec) {
    showMask();
    dom.dialog.querySelector('.c-dialog__title').textContent = '记录详情';
    dom.dialog.querySelector('.c-dialog__desc').innerHTML =
      '<div style="text-align:left;font-size:13px;line-height:2;color:var(--c-ink);">' +
      '<div>单号：<b class="t-num">' + rec.id + '</b></div>' +
      '<div>日期：' + rec.date + '</div>' +
      '<div>类型：' + rec.type + ' · ' + rec.cat + '</div>' +
      '<div>金额：<b class="t-num" style="color:var(--c-brand);font-size:16px;">¥' + money(rec.amount) + '</b></div>' +
      '<div>商户：' + rec.merchant + '</div>' +
      '<div>备注：' + (rec.note || '无') + '</div>' +
      '<div>状态：' + rec.status + (rec.attach ? ' · 含凭证' : '') + '</div></div>';
    dom.dialog.querySelector('.js-dialog-ok').textContent = '知道了';
    dom.dialog.querySelector('.js-dialog-ok').onclick = function () { hideDialog(); };
    dom.dialog.querySelector('.js-dialog-cancel').style.display = 'none';
    dom.dialog.classList.add('is-show');
  }

  function removeRecord(rec) {
    confirm({
      title: '删除这条记录？',
      desc: '「' + rec.merchant + ' · ¥' + money(rec.amount) + '」删除后不可恢复。',
      danger: true,
      onOk: function () {
        api.deleteRecord(rec.id).then(function () {
          DB.month.recordCount = Math.max(DB.month.recordCount - 1, 0);
          toast('已删除');
          reloadRecord();
        });
      }
    });
  }

  /* 打开记一笔（预填编辑态） */
  function openForm(rec) {
    App.ctx.formEdit = rec || null;
    App.ctx.formPreset = rec ? null : (App.ctx.formPreset || 'expense');
    go('form');
  }

  /* ============================================================
     Tab 屏 3 · 分析 analysis
  ============================================================ */
  var analysisState = { period: 'cur' };

  function mountAnalysis() { renderAnalysis(); }

  function renderAnalysis() {
    var sec = $('.screen[data-screen="analysis"]');
    if (!sec) return;
    var h = '<div class="seg-row"><div class="c-seg" id="anaPeriod">' +
      '<button data-p="cur" class="' + (analysisState.period === 'cur' ? 'is-active' : '') + '">本月</button>' +
      '<button data-p="last" class="' + (analysisState.period === 'last' ? 'is-active' : '') + '">上月</button></div></div>';
    h += '<div id="anaShareBox">' + skeleton() + '</div>';
    h += '<div id="anaTrendBox">' + skeleton() + '</div>';
    h += '<div id="anaTopBox">' + skeleton('list') + '</div>';
    h += '<div id="anaSupBox">' + skeleton('list') + '</div>';
    h += '<div id="anaHidden"></div>';
    sec.innerHTML = h;
    scheduleInject(sec);

    $all('#anaPeriod button').forEach(function (b) {
      on(b, 'click', function () {
        analysisState.period = b.getAttribute('data-p');
        renderAnalysis();
      });
    });
    loadAnalysis();
  }

  function loadAnalysis() {
    api.getAnalysis(analysisState.period).then(function (res) {
      var d = res.data;
      renderShare(d.period, d.share);
      renderAnaTrend(d.trend);
      renderAnaTop(d.top);
      renderAnaSup(d.suppliers);
      renderHiddenCost();
    });
  }

  /* 隐性成本估算模块（引擎：hidden-cost.js，设计：docs/08-hidden-cost-engine.md） */
  function renderHiddenCost() {
    var box = $('#anaHidden');
    if (!box || !window.HiddenCost) return;
    var r = HiddenCost.estimate();
    var lvColor = r.level === '优' ? 'var(--c-brand)' : (r.level === '良' ? 'var(--c-brand)' : (r.level === '注意' ? 'var(--c-amber)' : 'var(--c-danger)'));

    var h = '<div class="sec-title"><span>隐性成本估算</span><span style="font-size:11px;color:var(--c-ink-3);font-weight:400;">' + esc(r.industryName) + '专属模型</span></div>';
    h += '<div class="c-card c-card--flat" style="padding:14px 16px;">';

    /* 汇总条 */
    h += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">' +
      '<div style="flex:1;"><div style="font-size:12px;color:var(--c-ink-2);">本月隐性成本估算</div>' +
      '<div class="t-num" style="font-size:22px;font-weight:800;margin-top:2px;color:' + lvColor + ';">¥' + money0(r.total) + '</div>' +
      '<div style="font-size:11px;color:var(--c-ink-3);margin-top:3px;">约占营收 ' + r.ratio.toFixed(1) + '% · 健康度 ' + r.health + '</div></div>' +
      '<div style="text-align:center;flex:none;"><div style="width:54px;height:54px;border-radius:50%;border:3px solid ' + lvColor + ';display:flex;align-items:center;justify-content:center;flex-direction:column;color:' + lvColor + ';"><span class="t-num" style="font-size:18px;font-weight:800;line-height:1;">' + r.health + '</span><span style="font-size:10px;">' + r.level + '</span></div>' +
      '<div style="font-size:10px;color:var(--c-ink-3);margin-top:4px;">健康度</div></div></div>';

    /* 成本项明细 */
    r.items.forEach(function (it) {
      var bar = Math.min(it.health, 100);
      var barColor = it.health >= 70 ? 'var(--c-brand)' : (it.health >= 55 ? 'var(--c-amber)' : 'var(--c-danger)');
      h += '<div style="display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-top:1px solid var(--c-line);">' +
        '<span style="width:32px;height:32px;border-radius:10px;background:var(--c-brand-soft);color:var(--c-brand);display:flex;align-items:center;justify-content:center;flex:none;">' + ic(it.icon, 16) + '</span>' +
        '<div style="flex:1;min-width:0;">' +
        '<div style="display:flex;align-items:baseline;gap:6px;"><span style="font-size:13px;font-weight:700;">' + esc(it.name) + '</span>' +
        '<span class="t-num" style="font-size:13px;font-weight:800;margin-left:auto;color:' + barColor + ';">¥' + money0(it.estimate) + '</span></div>' +
        '<div style="font-size:10.5px;color:var(--c-ink-3);margin-top:3px;">' + esc(it.formula) + ' · 基准 ' + esc(it.benchmark) + '</div>' +
        '<div style="height:4px;border-radius:2px;background:var(--c-card-2);margin-top:6px;overflow:hidden;"><div style="width:' + bar + '%;height:100%;background:' + barColor + ';border-radius:2px;transition:width .8s var(--ease);"></div></div>' +
        '<div style="font-size:11px;color:var(--c-ink-2);line-height:1.6;margin-top:6px;">' + esc(it.tip) + '</div></div></div>';
    });

    h += '<div style="font-size:10.5px;color:var(--c-ink-3);padding-top:8px;border-top:1px solid var(--c-line);">基于经营数据与行业基准参数估算，实际值请以盘点与对账为准 · 模型见 docs/08</div>';
    h += '</div>';
    box.innerHTML = h;
    scheduleInject(box);
  }

  function renderShare(per, share) {
    /* 环形图 */
    var total = 251.2;
    var acc = 0;
    var segs = '';
    share.forEach(function (s, i) {
      var dash = Math.max(s.pct / 100 * total - 2.2, 1.5);
      segs += '<circle cx="48" cy="48" r="40" fill="none" stroke="' + catColor(s.cat) + '" stroke-width="11" stroke-dasharray="' + dash + ' ' + total + '" stroke-dashoffset="' + (-acc) + '" stroke-linecap="round" style="transition:stroke-dasharray 1s var(--ease);animation-delay:' + (i * .12) + 's;"></circle>';
      acc += s.pct / 100 * total;
    });
    var donutSvg = '<svg class="ring" width="108" height="108" viewBox="0 0 96 96">' +
      '<circle class="bg" cx="48" cy="48" r="40"></circle>' + segs + '</svg>';

    var h = '<div class="c-card">' +
      '<div class="sec-title" style="margin-top:0;"><span>' + (per.label) + '成本构成</span><span class="t-num" style="font-size:12px;color:var(--c-ink-3);font-weight:600;">合计 ¥' + money0(per.cost) + '</span></div>' +
      '<div class="donut-wrap">' +
      '<div class="donut">' + donutSvg + '<div class="center"><span class="v">¥' + money0(per.cost) + '</span><span class="t">总成本</span></div></div>' +
      '<div class="legend">';
    share.slice(0, 5).forEach(function (s) {
      h += '<div class="row"><span class="dot" style="background:' + catColor(s.cat) + ';"></span>' +
        '<span class="name">' + s.cat + '</span>' +
        '<span class="amt t-num">¥' + money0(s.amount) + '</span>' +
        '<span class="pct">' + pct(s.pct) + '%</span></div>';
    });
    h += '<div class="row"><span class="dot" style="background:var(--c-ink-3);"></span><span class="name">其他 2 项</span><span class="amt t-num">¥' + money0(share[5].amount + share[6].amount) + '</span><span class="pct">' + pct(share[5].pct + share[6].pct) + '%</span></div>';
    h += '</div></div></div>';
    fill('anaShareBox', h);
    setTimeout(function () {
      $all('#anaShareBox .ring circle[stroke-dasharray]').forEach(function (c, i) {
        var dash = c.getAttribute('stroke-dasharray').split(' ')[0];
        setTimeout(function () { c.style.strokeDasharray = dash + ' ' + total; }, 50 + i * 60);
      });
    }, 80);
  }

  function renderAnaTrend(trend) {
    var h = '<div class="sec-title"><span>近 6 月趋势</span><span style="font-size:11px;color:var(--c-ink-3);font-weight:400;">成本率 60.0%</span></div>';
    h += '<div class="c-card">';
    h += '<div class="c-bars" style="height:110px;">';
    var max = 0;
    trend.forEach(function (t) { max = Math.max(max, t.cost, t.revenue); });
    trend.forEach(function (t, i) {
      var hc = Math.round(t.cost / max * 100);
      var hr = Math.round(t.revenue / max * 100);
      h += '<div class="c-bars__col"><div style="display:flex;align-items:flex-end;gap:3px;flex:1;justify-content:center;width:100%;">' +
        '<div class="bar bar--cost" style="height:' + hc + '%;width:9px;animation-delay:' + (i * .06) + 's;"></div>' +
        '<div class="bar bar--rev" style="height:' + hr + '%;width:9px;animation-delay:' + (i * .06 + .03) + 's;"></div></div>' +
        '<div class="lbl">' + monthShort(t.month) + '</div></div>';
    });
    h += '</div></div>';
    fill('anaTrendBox', h);
  }

  function renderAnaTop(top) {
    var h = '<div class="sec-title"><span>成本 TOP5 菜品</span><button class="link c-btn" data-navto="product">' + ic('chevron-right') + '全部菜品</button></div>';
    h += '<div class="c-card" style="padding:6px 15px;">';
    var maxCost = 25;
    top.forEach(function (t, i) {
      var w = Math.round(t.cost / maxCost * 100);
      h += '<div class="cost-row"><div style="width:20px;flex:none;text-align:center;font-size:12px;font-weight:800;color:' + (i < 3 ? 'var(--c-brand)' : 'var(--c-ink-3)') + ';">' + (i + 1) + '</div>' +
        '<div class="info" style="width:auto;min-width:76px;"><div class="n">' + t.name + '</div><div class="pct">成本率 ' + pct(t.ratio) + '%</div></div>' +
        '<div class="mini-bar"><div class="mini-bar__fill" style="width:' + w + '%;background:var(--c-brand);transition:width .8s var(--ease);"></div></div>' +
        '<div class="t-num" style="font-size:12.5px;font-weight:700;width:52px;text-align:right;">¥' + t.cost + '</div></div>';
    });
    h += '</div>';
    fill('anaTopBox', h);
  }

  function renderAnaSup(sups) {
    var h = '<div class="sec-title"><span>本月供应商支出</span><button class="link c-btn" data-navto="suppliers">' + ic('chevron-right') + '管理</button></div>';
    h += '<div class="c-card" style="padding:6px 15px;">';
    sups.slice(0, 4).forEach(function (s) {
      h += '<div class="c-cell" data-navto="suppliers">' +
        '<div class="c-cell__icon" style="background:var(--c-brand-soft);color:var(--c-brand);font-weight:800;font-size:14px;">' + s.initial + '</div>' +
        '<div class="c-cell__body"><div class="c-cell__title">' + s.name + '</div><div class="c-cell__sub">' + s.orders + ' 笔订单</div></div>' +
        '<div class="c-cell__value t-num">¥' + money0(s.spend) + '</div>' +
        '<div class="c-cell__arrow">' + ic('chevron-right') + '</div></div>';
    });
    h += '</div>';
    fill('anaSupBox', h);
  }

  /* ============================================================
     Tab 屏 4 · 我的 mine（静态）
  ============================================================ */
  function mountMine() {
    var h = '';
    var ob = window.Onboarding && Onboarding.read ? Onboarding.read() : null;
    var indId = (ob && ob.industry) || 'canteen';
    var indIcon = (DB.industryTemplates[indId] && DB.industryTemplates[indId].icon) || 'store';
    var phone = (ob && ob.phone) || '未绑定';

    /* 店铺卡 */
    h += '<div class="c-card c-card--hero" style="padding:20px;">' +
      '<div style="display:flex;align-items:center;gap:14px;">' +
      '<div style="width:50px;height:50px;border-radius:16px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;color:#fff;">' + ic(indIcon, 26) + '</div>' +
      '<div style="flex:1;"><div style="font-size:16.5px;font-weight:800;">' + DB.store.name + '</div>' +
      '<div style="font-size:11.5px;opacity:.82;margin-top:2px;">' + DB.store.type + ' · ' + DB.store.plan + '</div>' +
      '<div style="font-size:11px;opacity:.65;margin-top:2px;">账号 ' + esc(phone) + ' · 数据更新 ' + DB.store.updated + '</div></div></div>' +
      '<div style="display:flex;gap:8px;margin-top:16px;">' +
      '<button class="c-btn c-btn--sm" style="background:#fff;color:var(--c-brand);flex:1;font-weight:700;" data-act="storeSettings">' + ic('settings') + ' 店铺设置</button>' +
      '<button class="c-btn c-btn--sm" style="background:rgba(255,255,255,.16);color:#fff;flex:1;" data-navto="categories">' + ic('shopping-basket') + ' 分类管理</button></div></div>';

    /* 菜单组 */
    function group(title, items) {
      var g = '<div class="c-group"><div class="g-title">' + title + '</div><div class="c-card" style="padding:4px 15px;">';
      items.forEach(function (it, i) {
        g += '<div class="c-cell" ' + (it.to ? 'data-navto="' + it.to + '"' : 'data-act="' + it.act + '"') + '>' +
          '<div class="c-cell__icon" style="background:' + it.bg + ';color:' + it.color + ';">' + ic(it.ic) + '</div>' +
          '<div class="c-cell__body"><div class="c-cell__title">' + it.label + '</div></div>' +
          (it.right ? '<span style="font-size:11px;color:var(--c-ink-3);">' + it.right + '</span>' : '') +
          '<div class="c-cell__arrow">' + ic('chevron-right') + '</div></div>';
      });
      g += '</div></div>';
      return g;
    }

    h += group('经营工具', [
      { ic: 'utensils', label: '菜品成本卡', color: 'var(--c-brand)', bg: 'var(--c-brand-soft)', to: 'product' },
      { ic: 'file-text', label: '成本报表', color: 'var(--c-amber)', bg: 'var(--c-amber-soft)', to: 'reports' },
      { ic: 'truck', label: '供应商管理', color: 'var(--c-brand)', bg: 'var(--c-brand-soft)', to: 'suppliers' },
      { ic: 'shopping-basket', label: '成本分类', color: 'var(--c-amber)', bg: 'var(--c-amber-soft)', to: 'categories' }
    ]);

    h += '<div class="c-group"><div class="g-title">偏好</div><div class="c-card" style="padding:4px 15px;">' +
      '<div class="c-cell" data-act="remind">' +
      '<div class="c-cell__icon" style="background:var(--c-amber-soft);color:var(--c-amber);">' + ic('bell') + '</div>' +
      '<div class="c-cell__body"><div class="c-cell__title">成本异常提醒</div><div class="c-cell__sub">食材价格波动时推送</div></div>' +
      '<div class="c-switch is-on" id="swRemind"></div></div>' +
      '<div class="c-cell" data-act="credit">' +
      '<div class="c-cell__icon" style="background:var(--c-brand-soft);color:var(--c-brand);">' + ic('shield-check') + '</div>' +
      '<div class="c-cell__body"><div class="c-cell__title">免密记账</div><div class="c-cell__sub">快速记一笔时免验证</div></div>' +
      '<div class="c-switch is-on" id="swCredit"></div></div></div></div>';

    h += group('其他', [
      { ic: 'store', label: '切换行业', color: 'var(--c-brand)', bg: 'var(--c-brand-soft)', act: 'switchInd', right: DB.store.type.split(' · ')[0] },
      { ic: 'help-circle', label: '帮助与反馈', color: 'var(--c-ink-2)', bg: 'var(--c-card-2)', act: 'help' },
      { ic: 'users', label: '邀请店员协作', color: 'var(--c-ink-2)', bg: 'var(--c-card-2)', act: 'invite' },
      { ic: 'badge-check', label: '关于算得清', color: 'var(--c-ink-2)', bg: 'var(--c-card-2)', right: 'v2.4.1', act: 'about' }
    ]);

    h += '<div style="padding:18px 0 30px;text-align:center;font-size:11px;color:var(--c-ink-3);">算得清 · 让每一笔成本都算得清</div>';

    fill('mineBody', h);

    /* 交互 */
    var swRemind = $('#swRemind');
    if (swRemind) on(swRemind, 'click', function () { swRemind.classList.toggle('is-on'); toast(swRemind.classList.contains('is-on') ? '已开启成本异常提醒' : '已关闭提醒'); });
    var swCredit = $('#swCredit');
    if (swCredit) on(swCredit, 'click', function () { swCredit.classList.toggle('is-on'); toast(swCredit.classList.contains('is-on') ? '已开启免密记账' : '已关闭免密记账'); });

    $all('#mineBody [data-act]').forEach(function (el) {
      on(el, 'click', function () {
        var act = el.getAttribute('data-act');
        if (act === 'about') {
          confirm({ title: '算得清 · 商家成本管家', desc: '版本 v2.4.1（演示原型）\n面向中小商家的精细化成本核算工具\n服务仅用于产品演示，数据均为模拟。' });
        } else if (act === 'help') {
          toast('帮助中心即将上线');
        } else if (act === 'invite') {
          toast('已生成邀请链接（演示）');
        } else if (act === 'storeSettings') {
          openStoreSettings();
        } else if (act === 'switchInd') {
          confirm({
            title: '切换行业',
            desc: '切换后成本分类将按新行业模板重置，分析页的隐性成本估算也会切换到该行业模型（演示经营数据保持不变）。',
            okText: '去切换',
            onOk: function () {
              if (window.Onboarding) Onboarding.clear();
              go('onboarding');
            }
          });
        }
      });
    });
  }

  /* 店铺设置弹层：修改门店名 / 月预算 / 预算提醒开关 */
  function openStoreSettings() {
    showMask();
    var cur = DB.store.budget || 0;
    dom.dialog.querySelector('.c-dialog__title').textContent = '店铺设置';
    dom.dialog.querySelector('.js-dialog-ok').textContent = '保存';
    dom.dialog.querySelector('.js-dialog-cancel').style.display = '';
    dom.dialog.querySelector('.js-dialog-cancel').onclick = function () { hideDialog(); };
    dom.dialog.querySelector('.c-dialog__desc').innerHTML =
      '<div style="text-align:left;padding:2px 0 6px;">' +
      '<div class="c-field" style="margin-bottom:12px;"><div class="c-field__label">门店名称</div>' +
      '<input class="c-input" id="setName" value="' + esc(DB.store.name) + '" maxlength="20"></div>' +
      '<div class="c-field" style="margin-bottom:12px;"><div class="c-field__label">月成本预算（元）</div>' +
      '<input class="c-input c-input-phone" id="setBudget" inputmode="numeric" value="' + (cur || '') + '" placeholder="如：80000"></div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 2px;border-top:1px solid var(--c-line);">' +
      '<div><div style="font-size:13px;font-weight:600;">预算超支提醒</div><div style="font-size:11px;color:var(--c-ink-3);">成本率超 75% 时推送预警</div></div>' +
      '<div class="c-switch is-on" id="setBudgetAlert"></div></div></div>';
    dom.dialog.classList.add('is-show');

    var ok = dom.dialog.querySelector('.js-dialog-ok');
    ok.onclick = function () {
      var name = $('#setName').value.trim();
      var budget = $('#setBudget').value.replace(/[^\d]/g, '');
      if (!name) { toast('请输入门店名称'); return; }
      if (budget && Number(budget) <= 0) { toast('请输入正确的预算金额'); return; }
      DB.store.name = name;
      if (budget) DB.store.budget = Number(budget);
      if (window.Onboarding) {
        var ob = Onboarding.read();
        if (ob) {
          ob.storeName = name;
          if (budget) ob.budget = Number(budget);
          Onboarding.save(ob);
          Onboarding.apply(ob);
        }
      }
      hideDialog();
      toast('店铺设置已保存');
      reloadTab('mine');
    };
  }

  /* ============================================================
     App 公开接口 + 模块注册表
  ============================================================ */
  var App = {
    ctx: { formPreset: 'expense', formEdit: null },
    $: $,
    on: on,
    ic: ic,
    inject: inject,
    scheduleInject: scheduleInject,
    money: money,
    money0: money0,
    pct: pct,
    catColor: catColor,
    skeleton: skeleton,
    fill: fill,
    toast: toast,
    confirm: confirm,
    sheet: sheet,
    showMask: showMask,
    hideMask: hideMask,
    hideSheet: hideSheet,
    hideDialog: hideDialog,
    go: go,
    back: back,
    showTab: showTab,
    // 重置页面栈到指定 Tab（登录/引导完成等场景）
    resetTo: function (tab) {
      stack.length = 0;
      showTab(tab);
    },
    openForm: openForm,
    register: function (m) { registry[m.id] = m; },
    registry: registry,
    // 供子页刷新 tab
    reloadTab: function (tab) { mountModule(tab, true); },
    setNavSide: function (html) { dom.navSide.innerHTML = html; App.scheduleInject(dom.navSide); },
    clearNavSide: function () { dom.navSide.innerHTML = ''; }
  };
  window.App = App;

  /* ---------- 启动 ---------- */
  App.init = function () {
    dom.navBack = $('#navBack');
    dom.navTitle = $('#navTitle');
    dom.navSide = $('#navSide');
    dom.screens = $('#screens');
    dom.tabbar = $('#tabbar');
    dom.toast = $('#toast');
    dom.mask = $('#mask');
    dom.sheet = $('#sheet');
    dom.dialog = $('#dialog');
    dom.fab = document.querySelector('.c-fab');

    /* 全局点击委托：data-navto 导航 + data-tab Tab 切换（常驻，不随模块清理） */
    document.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== document.body) {
        if (t.hasAttribute && t.hasAttribute('data-tab')) {
          e.preventDefault();
          showTab(t.getAttribute('data-tab'));
          return;
        }
        if (t.hasAttribute && t.hasAttribute('data-navto')) {
          var to = t.getAttribute('data-navto');
          var opts = {};
          if (t.hasAttribute('data-preset')) opts.formPreset = t.getAttribute('data-preset');
          go(to, opts);
          return;
        }
        t = t.parentNode;
      }
    });
    /* 常驻壳层事件：直接绑定，避免被模块切换时的事件托管清理 */
    dom.navBack.addEventListener('click', function () { back(); });
    dom.mask.addEventListener('click', function () { hideSheet(); hideDialog(); });

    /* 注册模块 */
    App.register({ id: 'home', mount: mountHome, demount: function () { } });
    App.register({ id: 'record', mount: mountRecord, demount: function () { }, reload: reloadRecord });
    App.register({ id: 'analysis', mount: mountAnalysis, demount: function () { } });
    App.register({ id: 'mine', mount: mountMine, demount: function () { } });

    /* 启动：未完成行业引导 → 先登录再引导；已完成 → 应用行业配置直接进工作台 */
    var ob = window.Onboarding && Onboarding.read ? Onboarding.read() : null;
    if (ob) {
      Onboarding.apply(ob);
      stack.push('home');
      setScreen('home');
      mountModule('home');
    } else {
      stack.push('login');
      setScreen('login');
      mountModule('login');
    }
  };
})();
