/* ============================================================
   算得清 · 子页面模块共享骨架（勿删本文件头注释）
   全局可用：App / DB / api / ICONS / injectIcons
   辅助函数：fmtMoney / fmtMoney0 / fmtPct / catColor / catDot / icTag / esc
   日期面板：DatePicker.show(初始值, 回调) / DatePicker.hide()
   ============================================================ */
(function () {
  'use strict';

  window.fmtMoney = function (n) {
    n = Number(n) || 0;
    return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  window.fmtMoney0 = function (n) { return (Math.round(Number(n) || 0)).toLocaleString('zh-CN'); };
  window.fmtPct = function (n) { return (Number(n) || 0).toFixed(1); };
  window.catColor = function (name) { return App.catColor(name); };
  window.catDot = function (name) { return '<span style="display:inline-block;width:7px;height:7px;border-radius:2px;background:' + App.catColor(name) + ';margin-right:5px;"></span>'; };
  window.icTag = function (name, size) {
    var s = size ? ' style="width:' + size + 'px;height:' + size + 'px"' : '';
    return '<i class="ic"' + s + ' data-ic="' + name + '"></i>';
  };
  window.esc = function (s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  window.skel = function (kind) { return App.skeleton(kind); };
  window.fillBox = function (id, html) { return App.fill(id, html); };

  /* ---------- 日期面板（7 月 2026 演示） ---------- */
  var DATE = {
    year: 2026, month: 7,
    firstDow: 3, // 2026-07-01 是周三（0=周日）
    days: 31,
    today: 14
  };
  var pickerEl = null;

  function buildPicker(onPick) {
    var h = '<div class="c-mask is-show" id="pickerMask" style="z-index:65;"></div>';
    h += '<div class="c-sheet is-show" id="pickerSheet" style="z-index:75;">';
    h += '<div class="c-sheet__grab"></div>';
    h += '<div class="c-sheet__title">选择日期 · ' + DATE.year + ' 年 ' + DATE.month + ' 月</div>';
    h += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-size:11px;color:var(--c-ink-3);padding:2px 6px;">';
    ['日', '一', '二', '三', '四', '五', '六'].forEach(function (w) { h += '<div>' + w + '</div>'; });
    h += '</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;padding:8px 6px 12px;">';
    for (var i = 0; i < DATE.firstDow; i++) h += '<div></div>';
    for (var d = 1; d <= DATE.days; d++) {
      h += '<button data-d="' + d + '" class="dp-day' + (d === DATE.today ? ' dp-today' : '') + '">' + d + '</button>';
    }
    h += '</div><button class="c-btn c-btn--soft c-btn--block" id="pickerCancel">取消</button></div>';

    var wrap = document.createElement('div');
    wrap.innerHTML = h;
    wrap.style.cssText = 'position:absolute;inset:0;z-index:60;';
    document.querySelector('.phone').appendChild(wrap);
    pickerEl = wrap;

    wrap.querySelectorAll('.dp-day').forEach(function (b) {
      b.style.cssText = 'height:34px;border-radius:8px;font-size:13px;font-family:var(--f-num);color:var(--c-ink);transition:all .15s;';
      b.addEventListener('mouseenter', function () { b.style.background = 'var(--c-brand-soft)'; });
      b.addEventListener('mouseleave', function () { b.style.background = ''; });
      b.addEventListener('click', function () {
        var day = Number(b.getAttribute('data-d'));
        var pad = function (x) { return (x < 10 ? '0' : '') + x; };
        var val = DATE.year + '-' + pad(DATE.month) + '-' + pad(day);
        onPick(val);
        hidePicker();
      });
    });
    var today = wrap.querySelector('.dp-today');
    if (today) { today.style.background = 'var(--c-brand)'; today.style.color = '#fff'; }
    wrap.querySelector('#pickerCancel').addEventListener('click', hidePicker);
    wrap.querySelector('#pickerMask').addEventListener('click', hidePicker);
  }
  function hidePicker() {
    if (pickerEl) { pickerEl.parentNode && pickerEl.parentNode.removeChild(pickerEl); pickerEl = null; }
  }
  window.DatePicker = {
    show: function (init, cb) {
      hidePicker();
      buildPicker(function (v) { cb && cb(v); });
    },
    hide: hidePicker
  };
})();

/* ============================================================
   算得清 · 子页模块（本文件交付）
   模块 1 · 记一笔 form        —— data-screen="form"（navTitle：记一笔）
   模块 2 · 菜品成本 product   —— data-screen="product"
   - 注册：App.register({ id, mount, demount })；mount 整页渲染 + App.on 绑定交互
   - 数据：DB（mock.js）· 接口：api（api.js，各调用点保留接后端替换注释）
   - 全局辅助：fmtMoney / fmtMoney0 / fmtPct / catDot / icTag / esc / skel / fillBox / DatePicker
   样式：仅使用 styles.css 冻结组件类 + 设计令牌变量，无新增颜色/类名/emoji。
   ============================================================ */
(function () {
  'use strict';

  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* 运行时补全 'info' 图标（若 icons.js 未内置，保证 icTag('info') 可渲染；内置后此分支不生效） */
  if (window.ICONS && !window.ICONS.info) {
    window.ICONS.info = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';
  }

  /* 按压反馈：为没有内置 :active 的胶囊/卡片补充按下态（仅复用既有令牌变量） */
  function pressFx(el) {
    App.on(el, 'pointerdown', function () { el.style.background = 'var(--c-card-2)'; });
    App.on(el, 'pointerup', function () { el.style.background = ''; });
    App.on(el, 'pointerleave', function () { el.style.background = ''; });
  }

  /* ============================================================
     模块 1 · 记一笔（form）
  ============================================================ */
  var formState = {
    type: '支出', date: '2026-07-14', cat: '食材采购',
    merchant: '', note: '', attach: false, saving: false
  };

  function mountForm() {
    var ctx = App.ctx || {};
    var edit = ctx.formEdit || null;
    var preset = ctx.formPreset || 'expense';

    formState.type = edit ? (edit.type === '收入' ? '收入' : '支出')
                         : (preset === 'income' ? '收入' : '支出');
    formState.date = edit ? edit.date : '2026-07-14';
    formState.cat = edit ? edit.cat : '食材采购';
    formState.merchant = edit ? (edit.merchant || '') : '';
    formState.note = edit ? (edit.note || '') : '';
    formState.attach = edit ? !!edit.attach : false;
    formState.saving = false;

    // 编辑态：标题旁追加「编辑中」徽标（navSide 胶囊）
    if (edit) App.setNavSide('<span class="pill">编辑中</span>');
    else App.clearNavSide();

    var sec = App.$('.screen[data-screen="form"]');
    sec.innerHTML = buildFormHtml();
    App.scheduleInject(sec);

    // 编辑态预填全部字段
    if (edit) {
      var amt = App.$('#formAmount'); if (amt) amt.value = edit.amount;
      var m = App.$('#formMerchant'); if (m) m.value = edit.merchant || '';
      var n = App.$('#formNote'); if (n) n.value = edit.note || '';
    }

    renderFormCat();
    renderReceipt();
    bindForm();
  }

  function buildFormHtml() {
    var h = '<div style="padding-bottom:48px;">';

    // 记账小贴士提示条
    h += '<div class="c-card c-card--flat" style="padding:10px 12px;font-size:12px;color:var(--c-ink-2);display:flex;align-items:center;gap:8px;margin-bottom:14px;">' +
      icTag('info', 15) + '<span>先选分类再输入金额，保存后自动归集到月度成本构成。</span></div>';

    h += '<div class="c-card" style="padding:16px;">';

    // 类型切换：支出 / 收入
    h += '<div class="c-seg" id="formTypeSeg" style="margin-bottom:18px;">' +
      '<button data-t="支出" class="' + (formState.type === '支出' ? 'is-active' : '') + '">支出</button>' +
      '<button data-t="收入" class="' + (formState.type === '收入' ? 'is-active' : '') + '">收入</button></div>';

    // 金额输入（大号，¥ 前缀）
    h += '<div class="c-field">' +
      '<div class="c-field__label"><span id="formAmountLabel">' + (formState.type === '支出' ? '支出金额' : '收入金额') + '</span><span class="req">*</span></div>' +
      '<div style="display:flex;align-items:center;background:var(--c-card);border:1px solid var(--c-line);border-radius:var(--r-md);">' +
      '<span style="font-size:22px;font-weight:800;color:var(--c-ink-2);font-family:var(--f-num);padding-left:18px;flex:none;line-height:1;">¥</span>' +
      '<input class="c-input c-input--amount" id="formAmount" inputmode="decimal" placeholder="0.00" style="border:none;background:transparent;text-align:left;padding-left:10px;">' +
      '</div></div>';

    // 分类 chips（支出显示 DB.categories，收入固定「其他」）
    h += '<div class="c-field" id="formCatWrap"></div>';

    // 日期选择
    h += '<div class="c-field">' +
      '<div class="c-field__label">记账日期</div>' +
      '<div class="c-cell" id="formDateRow" style="border:none;padding:10px 14px;background:var(--c-card);border:1px solid var(--c-line);border-radius:var(--r-md);">' +
      '<div style="width:22px;height:22px;color:var(--c-ink-3);display:flex;align-items:center;justify-content:center;">' + icTag('calendar', 16) + '</div>' +
      '<div style="flex:1;font-size:14px;" id="formDateText">' + formState.date + '</div>' +
      '<div style="color:var(--c-ink-3);">' + icTag('chevron-right', 16) + '</div></div></div>';

    // 商户名称
    h += '<div class="c-field">' +
      '<div class="c-field__label">商户名称</div>' +
      '<input class="c-input" id="formMerchant" placeholder="如：川味食材批发" value="">' +
      '</div>';

    // 备注
    h += '<div class="c-field" style="margin-bottom:0;">' +
      '<div class="c-field__label">备注</div>' +
      '<textarea class="c-textarea" id="formNote" placeholder="补充说明（如：牛肉 40kg 周结算）"></textarea>' +
      '</div>';

    h += '</div>';

    // 凭证区
    h += '<div class="c-card" style="margin-top:12px;padding:14px 16px;" id="formReceiptBox"></div>';

    // 保存
    h += '<button class="c-btn c-btn--primary c-btn--block" id="formSave" style="margin-top:16px;height:46px;font-size:15px;">' + icTag('check', 16) + '保存</button>';

    h += '</div>';
    return h;
  }

  function renderFormCat() {
    var wrap = App.$('#formCatWrap');
    if (!wrap) return;
    var h = '';
    if (formState.type === '收入') {
      h += '<div class="c-field__label">收入分类</div><div class="chips">' +
        '<button class="c-chip is-active" data-c="其他">' + catDot('其他') + '其他</button></div>';
    } else {
      h += '<div class="c-field__label">成本分类</div><div class="chips">';
      DB.categories.forEach(function (c) {
        h += '<button class="c-chip' + (formState.cat === c.name ? ' is-active' : '') + '" data-c="' + esc(c.name) + '">' +
          catDot(c.name) + esc(c.name) + '</button>';
      });
      h += '</div>';
    }
    wrap.innerHTML = h;
    App.scheduleInject(wrap);
    $all('#formCatWrap .c-chip').forEach(function (b) {
      pressFx(b);
      App.on(b, 'click', function () {
        formState.cat = b.getAttribute('data-c');
        renderFormCat();
      });
    });
  }

  function renderReceipt() {
    var box = App.$('#formReceiptBox');
    if (!box) return;
    var h = '<div class="c-field__label" style="margin-bottom:8px;">凭证</div>';
    if (formState.attach) {
      h += '<div style="display:flex;align-items:center;gap:12px;">' +
        '<div class="receipt-thumb receipt-thumb--img" style="width:54px;height:54px;flex-direction:column;gap:3px;">' +
        icTag('image-plus', 18) + '<span style="font-size:10px;font-weight:700;color:var(--c-brand);">凭证 1 张</span></div>' +
        '<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:600;">凭证已添加</div>' +
        '<div style="font-size:11px;color:var(--c-ink-3);margin-top:1px;">保存后随记录归档</div></div>' +
        '<button class="c-btn c-btn--sm" id="formReceiptDel" style="background:var(--c-danger-soft);color:var(--c-danger);">' + icTag('trash-2', 13) + '删除</button></div>';
    } else {
      h += '<button class="c-btn c-btn--soft c-btn--block" id="formReceiptAdd" style="border:1px dashed var(--c-brand);background:var(--c-brand-soft);">' +
        icTag('image-plus', 16) + '添加凭证</button>';
    }
    box.innerHTML = h;
    App.scheduleInject(box);
    if (formState.attach) {
      var del = App.$('#formReceiptDel');
      if (del) App.on(del, 'click', function () { formState.attach = false; renderReceipt(); });
    } else {
      var add = App.$('#formReceiptAdd');
      if (add) App.on(add, 'click', function () { openReceiptSheet(); });
    }
  }

  // 凭证动作面板：拍照 / 相册 → 生成假缩略图；查看模板 → 提示
  function openReceiptSheet() {
    App.sheet([
      { icon: 'camera', label: '拍照上传', onClick: function () { formState.attach = true; renderReceipt(); } },
      { icon: 'image-plus', label: '从相册选择', onClick: function () { formState.attach = true; renderReceipt(); } },
      { icon: 'info', label: '查看模板', onClick: function () { App.toast('凭证需包含商户名与金额（演示）'); } }
    ], '添加凭证');
  }

  function bindForm() {
    var segBtns = $all('#formTypeSeg button');
    segBtns.forEach(function (b) {
      pressFx(b);
      App.on(b, 'click', function () {
        if (formState.saving) return;
        formState.type = b.getAttribute('data-t');
        segBtns.forEach(function (x) { x.classList.toggle('is-active', x === b); });
        var lbl = App.$('#formAmountLabel');
        if (lbl) lbl.textContent = formState.type === '支出' ? '支出金额' : '收入金额';
        formState.cat = formState.type === '收入' ? '其他' : '食材采购';
        renderFormCat();
      });
    });

    // 金额输入：焦点态还原 .c-input:focus 效果（边框在包裹层上）
    var amtInput = App.$('#formAmount');
    if (amtInput) {
      App.on(amtInput, 'focus', function () {
        amtInput.parentNode.style.borderColor = 'var(--c-brand)';
        amtInput.parentNode.style.boxShadow = '0 0 0 3px rgba(13,114,97,.12)';
      });
      App.on(amtInput, 'blur', function () {
        amtInput.parentNode.style.borderColor = '';
        amtInput.parentNode.style.boxShadow = '';
      });
    }

    // 日期选择：弹出 DatePicker，选择后更新显示
    var dateRow = App.$('#formDateRow');
    if (dateRow) {
      App.on(dateRow, 'click', function () {
        DatePicker.show(formState.date, function (v) {
          formState.date = v;
          var t = App.$('#formDateText');
          if (t) t.textContent = v;
        });
      });
    }

    var save = App.$('#formSave');
    if (save) App.on(save, 'click', function () { doSave(save); });
  }

  // 保存记录：TODO 接后端时替换为 POST /api/records（真实上传凭证 + 持久化），此处仅走 api 桩
  function doSave(btn) {
    if (formState.saving) return;
    var amtInput = App.$('#formAmount');
    var amount = Number((amtInput ? amtInput.value : '').trim());
    if (!isFinite(amount) || amount <= 0) { App.toast('请输入正确的金额'); return; }

    formState.saving = true;
    btn.disabled = true;
    btn.innerHTML = '保存中…';

    var merchant = ((App.$('#formMerchant') || {}).value || '').trim();
    var note = ((App.$('#formNote') || {}).value || '').trim();
    var isEdit = !!(App.ctx && App.ctx.formEdit);

    var rec = {
      date: formState.date,
      type: formState.type,
      cat: formState.type === '收入' ? '其他' : formState.cat,
      amount: Math.round(amount * 100) / 100,
      merchant: merchant,
      note: note,
      status: '已核算',
      attach: formState.attach
    };

    api.saveRecord(rec).then(function () {
      formState.saving = false;
      App.ctx.formEdit = null;
      if (isEdit) App.toast('已更新');
      else { App.ctx.formPreset = 'expense'; App.toast('已保存'); }
      App.go('record'); // 记账 Tab reload 自动刷新列表与顶部统计
    }).catch(function () {
      formState.saving = false;
      btn.disabled = false;
      btn.innerHTML = icTag('check', 16) + '保存';
      App.toast('保存失败，请重试');
    });
  }

  function demountForm() {
    App.clearNavSide();
    App.ctx.formEdit = null;
    App.ctx.formPreset = 'expense';
  }

  /* ============================================================
     模块 2 · 菜品成本（product）
  ============================================================ */
  var pState = { cat: '全部', keyword: '' };

  function mountProduct() {
    // 先填充骨架，再请求数据渲染整页
    var sec = App.$('.screen[data-screen="product"]');
    sec.innerHTML = '<div style="padding-bottom:8px;">' + skel('list') + '</div>';
    loadProducts(true);
  }

  function demountProduct() {
    // 本模块不占用 App.ctx 临时状态；筛选状态保留在模块内，返回时维持上次视图
  }

  // 加载菜品列表：TODO 接后端时替换为 GET /api/products?cat=&keyword= → { list, avgRatio, overCount }
  function loadProducts(full) {
    if (!full) fillBox('prodListBox', skel('list'));
    api.getProducts({ cat: pState.cat, keyword: pState.keyword }).then(function (res) {
      var d = res.data;
      if (full) {
        renderProductPage(d);
      } else {
        var avg = App.$('#prodAvg'); if (avg) avg.textContent = fmtPct(d.avgRatio) + '%';
        var over = App.$('#prodOver'); if (over) over.textContent = d.overCount;
        renderProductList(d.list);
      }
    });
  }

  function renderProductPage(d) {
    var sec = App.$('.screen[data-screen="product"]');
    sec.innerHTML = buildProductShell(d);
    App.scheduleInject(sec);
    bindProductShell();
    renderProductList(d.list);
  }

  function buildProductShell(d) {
    var cats = [];
    DB.products.forEach(function (p) { if (cats.indexOf(p.cat) < 0) cats.push(p.cat); });

    var h = '<div style="padding-bottom:8px;">';

    // 顶部统计卡：3 列 KPI（菜品总数 / 平均成本率 / 超支菜品）
    h += '<div class="c-card c-card--hero" style="padding:15px 10px;margin-bottom:12px;display:flex;align-items:center;">' +
      '<div style="flex:1;text-align:center;"><div style="font-size:11px;opacity:.82;">菜品总数</div>' +
      '<div class="t-num" style="font-size:21px;font-weight:800;margin-top:3px;">' + DB.products.length + '</div></div>' +
      '<div style="width:1px;height:32px;background:rgba(255,255,255,.22);flex:none;"></div>' +
      '<div style="flex:1;text-align:center;"><div style="font-size:11px;opacity:.82;">平均成本率</div>' +
      '<div class="t-num" style="font-size:21px;font-weight:800;margin-top:3px;">' + fmtPct(d.avgRatio) + '%</div></div>' +
      '<div style="width:1px;height:32px;background:rgba(255,255,255,.22);flex:none;"></div>' +
      '<div style="flex:1;text-align:center;"><div style="font-size:11px;opacity:.82;">超支菜品</div>' +
      '<div style="margin-top:4px;"><span class="c-tag c-tag--danger" style="padding:3px 10px;">' + d.overCount + '</span></div></div></div>';

    // 搜索 + 分类筛选 chips（cat 值去重）
    h += '<div class="c-search" style="margin-bottom:10px;">' + icTag('search', 16) +
      '<input id="prodSearch" placeholder="搜索菜品名称" value="' + esc(pState.keyword) + '"></div>';
    h += '<div class="chips" style="margin-bottom:12px;" id="prodCatChips">' +
      '<button class="c-chip' + (pState.cat === '全部' ? ' is-active' : '') + '" data-c="全部">全部</button>';
    cats.forEach(function (c) {
      h += '<button class="c-chip' + (pState.cat === c ? ' is-active' : '') + '" data-c="' + esc(c) + '">' + esc(c) + '</button>';
    });
    h += '</div>';

    h += '<div id="prodListBox"></div>';
    h += '</div>';
    return h;
  }

  function bindProductShell() {
    var search = App.$('#prodSearch');
    var timer = null;
    // 搜索防抖 260ms
    App.on(search, 'input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        pState.keyword = search.value.trim();
        loadProducts(false);
      }, 260);
    });
    $all('#prodCatChips .c-chip').forEach(function (b) {
      pressFx(b);
      App.on(b, 'click', function () {
        pState.cat = b.getAttribute('data-c');
        $all('#prodCatChips .c-chip').forEach(function (x) { x.classList.toggle('is-active', x === b); });
        loadProducts(false);
      });
    });
  }

  function renderProductList(list) {
    var box = App.$('#prodListBox');
    if (!box) return;
    if (!list.length) {
      box.innerHTML = '<div class="c-empty">' + icTag('utensils', 44) +
        '<p>没有符合条件的菜品</p><div class="sub">换个分类或关键词试试</div></div>';
      App.scheduleInject(box);
      return;
    }
    var h = '';
    list.forEach(function (p) {
      var over = p.status === '超支';
      var ratioColor = p.ratio <= 60 ? 'var(--c-brand)' : (p.ratio >= 66 ? 'var(--c-danger)' : 'var(--c-amber)');
      h += '<div class="c-card" style="padding:13px 15px;margin-bottom:10px;display:flex;align-items:center;gap:12px;cursor:pointer;" data-id="' + p.id + '">' +
        '<div style="width:40px;height:40px;flex:none;border-radius:12px;background:var(--c-brand-soft);color:var(--c-brand);display:flex;align-items:center;justify-content:center;">' + icTag('utensils', 20) + '</div>' +
        '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:14px;font-weight:600;">' + esc(p.name) + '</div>' +
        '<div style="font-size:11.5px;color:var(--c-ink-3);margin-top:2px;">售价 ¥' + fmtMoney0(p.price) + ' · 成本 ¥' + fmtMoney(p.cost) + '</div></div>' +
        '<div style="text-align:right;flex:none;">' +
        '<div class="t-num" style="font-size:17px;font-weight:800;color:' + ratioColor + ';">' + fmtPct(p.ratio) + '%</div>' +
        '<div style="margin-top:3px;"><span class="c-tag ' + (over ? 'c-tag--danger' : 'c-tag--ok') + '">' + (over ? '超支' : '达标') + '</span></div></div>' +
        '</div>';
    });
    box.innerHTML = h;
    App.scheduleInject(box);
    $all('#prodListBox .c-card').forEach(function (row) {
      pressFx(row);
      App.on(row, 'click', function () {
        var id = row.getAttribute('data-id');
        var p = null;
        DB.products.forEach(function (x) { if (x.id === id) p = x; });
        if (!p) return;
        App.go('product-detail', { productId: p.id });
      });
    });
  }

  /* ---------- 注册模块 ---------- */
  App.register({ id: 'form', mount: mountForm, demount: demountForm });
  App.register({ id: 'product', mount: mountProduct, demount: demountProduct });

  /* ============================================================
     代码已完成：sub-form-product.js（记一笔 form + 菜品成本 product）
     两个模块均已通过 App.register 注册，mount/demount 生命周期就绪。
  ============================================================ */
})();

/* ============================================================
   算得清 · 子页模块：菜品成本详情 / 成本报表 / 报表详情
   全局可用：App / DB / api / fmtMoney / fmtMoney0 / fmtPct / catColor / catDot / icTag / esc / skel / fillBox
   接口替换点：api.getProduct / api.addBomItem / api.getReports / api.getReport
   （替换为真实 fetch 时签名与返回结构保持不变）
   ============================================================ */
(function () {
  'use strict';

  var $ = App.$;
  var on = App.on;
  var fill = App.fill;

  function qa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function round2(n) { return Math.round(n * 100) / 100; }

  /* 子页 section 初始为空，此处建唯一容器后用 App.fill 填充（App.fill 会自动注入图标） */
  function sec(name, id) {
    var s = App.$('.screen[data-screen="' + name + '"]');
    if (!s) return null;
    if (!s.querySelector('#' + id)) s.innerHTML = '<div id="' + id + '"></div>';
    return s;
  }

  function findProduct(id) {
    var p = null;
    DB.products.forEach(function (x) { if (x.id === id) p = x; });
    return p;
  }

  /* ============================================================
     模块 1 · product-detail 菜品成本详情（App.ctx.productId）
  ============================================================ */
  var pdBody = 'pdBody';
  var addModalEl = null; // 自定义"添加用料"弹层

  function closeAddModal() {
    if (addModalEl) {
      addModalEl.parentNode && addModalEl.parentNode.removeChild(addModalEl);
      addModalEl = null;
    }
  }

  function mountProductDetail() {
    closeAddModal();
    sec('product-detail', pdBody);
    fill(pdBody, skel('kpi'));
    var pid = App.ctx && App.ctx.productId;
    // API 替换点：GET /api/products/:id
    api.getProduct(pid).then(function (res) {
      var p = res.data.product;
      if (!p) { App.toast('菜品不存在'); App.back(); return; }
      renderProductDetail(p);
    });
  }

  function renderProductDetail(p) {
    var h = '';

    /* 超支警示条 */
    if (p.status === '超支') {
      h += '<div class="c-card c-card--flat" style="background:var(--c-danger-soft);display:flex;align-items:center;gap:9px;padding:12px 14px;margin-bottom:12px;">' +
        '<span style="color:var(--c-danger);display:inline-flex;flex:none;">' + icTag('alert-triangle', 16) + '</span>' +
        '<span style="font-size:12.5px;color:var(--c-danger);font-weight:500;line-height:1.5;">该菜品成本率超出目标 5%，建议调整配方或售价。</span></div>';
    }

    /* 顶部毛利环 */
    var ratio = Math.max(0, Math.min(100, Number(p.ratio) || 0));
    var ringColor = ratio < 30 ? 'var(--c-danger)' : (ratio < 40 ? 'var(--c-amber)' : 'var(--c-brand)');
    var ringDash = (ratio * 2.512).toFixed(1); // 毛利率% * 251.2
    h += '<div class="c-card">' +
      '<div style="display:flex;justify-content:center;">' +
      '<div class="donut">' +
      '<svg class="ring" width="108" height="108" viewBox="0 0 96 96">' +
      '<circle class="bg" cx="48" cy="48" r="40"></circle>' +
      '<circle class="fg" cx="48" cy="48" r="40" stroke="' + ringColor + '" style="stroke-dasharray:0 251.2;stroke-dashoffset:251.2;transition:stroke-dashoffset 1s var(--ease),stroke-dasharray 1s var(--ease);"></circle></svg>' +
      '<div class="center"><span class="v t-num" style="font-weight:800;">' + fmtPct(ratio) + '%</span><span class="t">毛利率</span></div></div></div>';
    h += '<div style="display:flex;justify-content:space-between;margin-top:16px;padding:0 6px;">' +
      '<div style="text-align:center;flex:1;"><div style="font-size:11px;color:var(--c-ink-3);">售价</div>' +
      '<div class="t-num" style="font-size:15px;font-weight:800;margin-top:4px;">¥' + fmtMoney0(p.price) + '</div></div>' +
      '<div style="width:1px;background:var(--c-line);margin:4px 0;"></div>' +
      '<div style="text-align:center;flex:1;"><div style="font-size:11px;color:var(--c-ink-3);">单位成本</div>' +
      '<div class="t-num" style="font-size:15px;font-weight:800;margin-top:4px;">¥' + fmtMoney(p.cost) + '</div></div>' +
      '<div style="width:1px;background:var(--c-line);margin:4px 0;"></div>' +
      '<div style="text-align:center;flex:1;"><div style="font-size:11px;color:var(--c-ink-3);">目标成本率</div>' +
      '<div style="margin-top:4px;"><span class="c-tag c-tag--outline">65%</span></div></div></div></div>';

    /* 成本构成三栏（以显示数据为准） */
    h += '<div class="c-card" style="padding:15px 6px;">' +
      '<div style="display:flex;">' +
      '<div style="flex:1;text-align:center;padding:4px 2px;"><div style="font-size:11px;color:var(--c-ink-3);">食材 BOM 合计</div>' +
      '<div class="t-num" style="font-size:16px;font-weight:800;color:var(--c-brand);margin-top:5px;">¥' + fmtMoney(p.bomTotal) + '</div></div>' +
      '<div style="flex:1;text-align:center;padding:4px 2px;"><div style="font-size:11px;color:var(--c-ink-3);">人工</div>' +
      '<div class="t-num" style="font-size:16px;font-weight:800;color:var(--c-brand);margin-top:5px;">¥' + fmtMoney(p.labor) + '</div></div>' +
      '<div style="flex:1;text-align:center;padding:4px 2px;"><div style="font-size:11px;color:var(--c-ink-3);">水电房租分摊</div>' +
      '<div class="t-num" style="font-size:16px;font-weight:800;color:var(--c-brand);margin-top:5px;">¥' + fmtMoney(p.overhead) + '</div></div></div></div>';

    /* 用料配方 BOM */
    var bomTotal = 0;
    p.items.forEach(function (it) { bomTotal += Number(it.amount) || 0; });
    h += '<div class="c-card">' +
      '<div class="sec-title" style="margin-top:0;"><span>用料配方</span>' +
      '<button class="c-btn c-btn--sm c-btn--soft" id="addBomBtn">' + icTag('plus') + ' 添加用料</button></div>';
    p.items.forEach(function (it, i) {
      var parts = [];
      if (it.spec) parts.push(esc(it.spec));
      if (it.qty) parts.push(esc(it.qty));
      h += '<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--c-line);">' +
        '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:13.5px;font-weight:600;">' + esc(it.name) + '</div>' +
        '<div style="font-size:11px;color:var(--c-ink-3);margin-top:1px;">' + (parts.length ? parts.join(' · ') : '—') + '</div></div>' +
        '<div class="t-num" style="font-size:13px;font-weight:700;">¥' + fmtMoney(it.amount) + '</div>' +
        '<button class="bom-del" data-del="' + i + '" style="width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;color:var(--c-ink-3);flex:none;">' + icTag('trash-2', 14) + '</button></div>';
    });
    h += '<div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--c-line);">' +
      '<span style="font-size:12px;color:var(--c-ink-2);">材料合计</span>' +
      '<span class="t-num" style="font-size:14px;font-weight:800;">¥' + fmtMoney(bomTotal) + '</span></div></div>';

    /* 近 6 月单位成本趋势 */
    var hist = p.history || [];
    var maxH = 0;
    hist.forEach(function (v) { maxH = Math.max(maxH, Number(v) || 0); });
    h += '<div class="c-card"><div class="sec-title" style="margin-top:0;"><span>单位成本趋势</span>' +
      '<span style="font-size:11px;color:var(--c-ink-3);font-weight:400;">近 6 月</span></div>' +
      '<div class="c-bars" style="height:104px;">';
    hist.forEach(function (v, i) {
      var hgt = maxH ? Math.round(v / maxH * 100) : 0;
      h += '<div class="c-bars__col">' +
        '<div class="bar bar--cost" style="height:' + hgt + '%;animation-delay:' + (i * 0.06) + 's;max-width:14px;width:12px;"></div>' +
        '<div class="lbl">' + (i + 2) + '月</div></div>';
    });
    h += '</div></div>';

    /* 底部操作条 */
    h += '<div style="display:flex;gap:10px;margin-top:16px;">' +
      '<button class="c-btn c-btn--soft c-btn--block" id="editBomBtn">' + icTag('pencil') + ' 编辑配方</button>' +
      '<button class="c-btn c-btn--ghost c-btn--block" id="alertBtn">' + icTag('bell') + ' 设为超支提醒</button></div>';

    fill(pdBody, h);

    /* 交互绑定 */
    qa('#' + pdBody + ' .bom-del').forEach(function (b) {
      on(b, 'click', function () { deleteBom(Number(b.getAttribute('data-del'))); });
    });
    on($('#addBomBtn'), 'click', openAddModal);
    on($('#editBomBtn'), 'click', function () { App.toast('编辑配方：跳转供应链页（演示）'); });
    on($('#alertBtn'), 'click', function () { App.toast('已开启该菜品成本预警'); });

    /* 毛利环填充动画：dashoffset 由 251.2 过渡到 0 */
    setTimeout(function () {
      var fg = $('#' + pdBody + ' .ring .fg');
      if (fg) { fg.style.strokeDasharray = ringDash + ' 251.2'; fg.style.strokeDashoffset = '0'; }
    }, 100);
  }

  /* 删除用料：演示数据操作，直接改 DB 并重算成本，与 api.addBomItem 口径一致 */
  function deleteBom(i) {
    var p = findProduct(App.ctx && App.ctx.productId);
    if (!p || !p.items[i]) return;
    var it = p.items[i];
    var descName = it.name + (it.spec ? '（' + it.spec + '）' : '');
    App.confirm({
      title: '删除这条用料？',
      desc: '「' + descName + ' · ¥' + fmtMoney(it.amount) + '」将从配方中移除。',
      danger: true,
      onOk: function () {
        p.items.splice(i, 1);
        var total = 0;
        p.items.forEach(function (x) { total += Number(x.amount) || 0; });
        p.bomTotal = round2(total);
        p.cost = round2(p.bomTotal + p.labor + p.overhead);
        p.ratio = Math.round((1 - p.cost / p.price) * 1000) / 10;
        p.status = p.ratio < 60 ? '超支' : '达标';
        App.toast('已删除');
        renderProductDetail(p);
      }
    });
  }

  /* 自定义"添加用料"弹层（遮罩 + 弹窗，复用 .c-mask / .c-dialog） */
  function openAddModal() {
    var p = findProduct(App.ctx && App.ctx.productId);
    if (!p) return;
    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;inset:0;z-index:60;';
    wrap.innerHTML =
      '<div class="c-mask is-show"></div>' +
      '<div class="c-dialog is-show" style="width:320px;text-align:left;">' +
      '<div class="c-dialog__title" style="text-align:center;font-size:15px;">添加用料</div>' +
      '<div style="margin-top:14px;">' +
      '<div class="c-field"><div class="c-field__label">名称<span class="req">*</span></div>' +
      '<input class="c-input" id="bomName" placeholder="如：鲜牛肉"></div>' +
      '<div class="c-field"><div class="c-field__label">规格<span class="c-field__tip">选填</span></div>' +
      '<input class="c-input" id="bomSpec" placeholder="如：500g"></div>' +
      '<div class="c-field"><div class="c-field__label">数量<span class="c-field__tip">选填</span></div>' +
      '<input class="c-input" id="bomQty" placeholder="如：1 份"></div>' +
      '<div class="c-field" style="margin-bottom:4px;"><div class="c-field__label">单价<span class="req">*</span></div>' +
      '<input class="c-input t-num" id="bomPrice" type="number" min="0" step="0.01" placeholder="金额，如 15.5"></div></div>' +
      '<div class="c-dialog__btns">' +
      '<button class="c-btn c-btn--ghost" id="bomCancel">取消</button>' +
      '<button class="c-btn c-btn--primary" id="bomOk">确认添加</button></div></div>';
    document.querySelector('.phone').appendChild(wrap);
    addModalEl = wrap;
    App.scheduleInject(wrap);
    on(wrap.querySelector('.c-mask'), 'click', closeAddModal);
    on(wrap.querySelector('#bomCancel'), 'click', closeAddModal);
    on(wrap.querySelector('#bomOk'), 'click', submitBom);
  }

  function submitBom() {
    if (!addModalEl) return;
    var name = (addModalEl.querySelector('#bomName').value || '').trim();
    var spec = (addModalEl.querySelector('#bomSpec').value || '').trim();
    var qty = (addModalEl.querySelector('#bomQty').value || '').trim();
    var price = round2(parseFloat(addModalEl.querySelector('#bomPrice').value));
    if (!name) { App.toast('请填写用料名称'); return; }
    if (!(price > 0)) { App.toast('请填写正确的单价'); return; }
    // 演示简化：amount = 单价
    var item = { name: name, spec: spec, qty: qty, price: price, amount: price };
    closeAddModal();
    // API 替换点：POST /api/products/:id/bom
    api.addBomItem(App.ctx.productId, item).then(function (res) {
      App.toast('已更新配方');
      renderProductDetail(res.data.product || findProduct(App.ctx.productId));
    });
  }

  /* ============================================================
     模块 2 · reports 成本报表列表
  ============================================================ */
  function mountReports() {
    sec('reports', 'rpBody');
    fill('rpBody', skel('list'));
    // API 替换点：GET /api/reports
    api.getReports().then(function (res) {
      renderReports(res.data.list);
    });
  }

  function renderReports(list) {
    var h = '';

    /* 顶部统计条 */
    var avg = 0;
    list.forEach(function (r) { avg += Number(r.ratio) || 0; });
    avg = avg / Math.max(list.length, 1);
    h += '<div class="c-card c-card--hero" style="display:flex;align-items:center;justify-content:space-between;padding:15px 18px;margin-bottom:12px;">' +
      '<span style="font-size:13px;opacity:.95;">累计生成报表 <b class="t-num">' + list.length + '</b> 期</span>' +
      '<span style="font-size:13px;opacity:.95;">平均成本率 <b class="t-num">' + fmtPct(avg) + '</b>%</span></div>';

    /* 报表列表 */
    list.forEach(function (r) {
      h += '<div class="c-card rp-card" data-rid="' + r.id + '" style="display:flex;align-items:center;gap:12px;padding:14px 15px;cursor:pointer;">' +
        '<div style="width:44px;height:44px;border-radius:12px;background:var(--c-brand-soft);color:var(--c-brand);display:flex;align-items:center;justify-content:center;flex:none;">' + icTag('file-text', 20) + '</div>' +
        '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:15px;font-weight:700;">' + esc(r.label) + '</div>' +
        '<div style="font-size:12px;color:var(--c-ink-3);margin-top:2px;">总成本 ¥' + fmtMoney0(r.totalCost) + ' · 成本率 ' + fmtPct(r.ratio) + '%</div></div>' +
        '<div style="display:flex;align-items:center;gap:8px;flex:none;">' +
        '<span class="c-tag c-tag--ok">' + esc(r.status || '已生成') + '</span>' +
        '<span style="color:var(--c-ink-3);display:inline-flex;">' + icTag('chevron-right') + '</span></div></div>';
    });

    /* 底部提示 */
    h += '<div class="c-card c-card--flat" style="text-align:center;padding:12px 14px;font-size:12px;color:var(--c-ink-2);margin-top:12px;">每月 1 日自动生成上月成本报表，也可手动生成（演示）</div>';

    fill('rpBody', h);
    qa('#rpBody .rp-card').forEach(function (card) {
      on(card, 'click', function () {
        App.go('report-detail', { reportId: card.getAttribute('data-rid') });
      });
    });
  }

  /* ============================================================
     模块 3 · report-detail 月度报表详情（App.ctx.reportId）
  ============================================================ */
  function mountReportDetail() {
    App.setNavSide('<button class="c-btn c-btn--sm c-btn--soft" id="exportBtn">' + icTag('download') + ' 导出</button>');
    var exportBtn = $('#exportBtn');
    if (exportBtn) on(exportBtn, 'click', function () { App.toast('已生成导出任务，可在电脑端下载（演示）'); });

    sec('report-detail', 'rdBody');
    fill('rdBody', skel('kpi'));
    var rid = App.ctx && App.ctx.reportId;
    // API 替换点：GET /api/reports/:id
    api.getReport(rid).then(function (res) {
      var r = res.data.report;
      if (!r) { App.toast('报表不存在'); App.back(); return; }
      renderReportDetail(r);
    });
  }

  function renderReportDetail(r) {
    var h = '';

    /* 顶部 KPI */
    h += '<div class="c-card c-card--hero" style="padding:18px;">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;">' +
      '<div><div style="font-size:12px;opacity:.85;">总成本</div>' +
      '<div class="t-num" style="font-size:27px;font-weight:800;margin-top:4px;">¥' + fmtMoney0(r.totalCost) + '</div>' +
      '<div style="font-size:11.5px;opacity:.82;margin-top:7px;">收入 ¥' + fmtMoney0(r.revenue) + ' · 毛利 ¥' + fmtMoney0(r.margin) + '</div></div>' +
      '<span class="c-tag" style="background:#fff;color:var(--c-brand);">成本率 ' + fmtPct(r.ratio) + '%</span></div></div>';

    /* 环比提示条（与上一期相邻差值，无上一期不显示） */
    h += ratioDeltaBar(r);

    /* 成本明细表 */
    h += '<div class="c-card"><div class="sec-title" style="margin-top:0;"><span>成本明细</span></div>';
    h += '<table class="c-table"><thead><tr><th>分类</th><th>金额</th><th>占比</th><th>环比</th></tr></thead><tbody>';
    var sumAmt = 0;
    var sumPct = 0;
    r.items.forEach(function (it) {
      sumAmt += Number(it.amount) || 0;
      sumPct += Number(it.pct) || 0;
      h += '<tr>' +
        '<td style="font-family:var(--f-body);">' + catDot(it.cat) + '<span style="vertical-align:middle;">' + esc(it.cat) + '</span></td>' +
        '<td>¥' + fmtMoney0(it.amount) + '</td>' +
        '<td>' + fmtPct(it.pct) + '%</td>' +
        '<td>' + deltaCell(it.delta) + '</td></tr>';
    });
    h += '<tr>' +
      '<td class="num" style="font-family:var(--f-body);">合计</td>' +
      '<td class="num">¥' + fmtMoney0(sumAmt) + '</td>' +
      '<td class="num">' + fmtPct(sumPct) + '%</td>' +
      '<td></td></tr>';
    h += '</tbody></table></div>';

    /* 毛利统计表 */
    var gm = 100 - (Number(r.ratio) || 0);
    h += '<div class="c-card"><div class="sec-title" style="margin-top:0;"><span>毛利统计</span></div>';
    h += '<table class="c-table"><tbody>' +
      '<tr><td style="font-family:var(--f-body);">营业收入</td><td>¥' + fmtMoney0(r.revenue) + '</td></tr>' +
      '<tr><td style="font-family:var(--f-body);">成本合计</td><td>¥' + fmtMoney0(r.totalCost) + '</td></tr>' +
      '<tr><td style="font-family:var(--f-body);font-weight:700;color:var(--c-brand);">毛利</td><td style="color:var(--c-brand);font-weight:800;">¥' + fmtMoney0(r.margin) + '</td></tr>' +
      '<tr><td style="font-family:var(--f-body);">毛利率</td><td>' + fmtPct(gm) + '%</td></tr>' +
      '</tbody></table></div>';

    /* 分享 */
    h += '<button class="c-btn c-btn--primary c-btn--block" id="shareBtn" style="margin-top:16px;">分享报表</button>';

    fill('rdBody', h);
    on($('#shareBtn'), 'click', function () { App.toast('已复制分享链接（演示）'); });
  }

  function ratioDeltaBar(r) {
    var idx = -1;
    for (var i = 0; i < DB.reports.length; i++) { if (DB.reports[i].id === r.id) { idx = i; break; } }
    if (idx < 0) return '';
    var prev = DB.reports[idx + 1]; // 列表按月倒序，下一项即上一期
    if (!prev) return '';
    var diff = Math.round((Number(r.ratio) - Number(prev.ratio)) * 10) / 10;
    var up = diff > 0;
    var icon = up ? 'trending-up' : 'trending-down';
    var color = up ? 'var(--c-danger)' : 'var(--c-brand)';
    var m = Number(String(prev.month).slice(5));
    return '<div class="c-card c-card--flat" style="display:flex;align-items:center;gap:8px;padding:11px 13px;margin-top:12px;">' +
      '<span style="color:' + color + ';display:inline-flex;flex:none;">' + icTag(icon, 15) + '</span>' +
      '<span style="font-size:12.5px;color:var(--c-ink-2);">成本率环比 ' + m + ' 月</span>' +
      '<span class="c-tag c-tag--warn" style="margin-left:auto;">' + (diff > 0 ? '+' : '') + diff.toFixed(1) + ' 个百分点</span></div>';
  }

  function deltaCell(d) {
    d = Number(d) || 0;
    if (d > 0) {
      return '<span style="display:inline-flex;align-items:center;gap:3px;color:var(--c-danger);font-weight:600;">' + icTag('trending-up', 11) + '+' + d.toFixed(1) + 'pp</span>';
    }
    if (d < 0) {
      return '<span style="display:inline-flex;align-items:center;gap:3px;color:var(--c-brand);font-weight:600;">' + icTag('trending-down', 11) + d.toFixed(1) + 'pp</span>';
    }
    return '<span style="color:var(--c-ink-3);">持平</span>';
  }

  /* ---------- 注册 ---------- */
  App.register({
    id: 'product-detail',
    mount: mountProductDetail,
    demount: function () { closeAddModal(); App.clearNavSide(); }
  });
  App.register({
    id: 'reports',
    mount: mountReports,
    demount: function () { App.clearNavSide(); }
  });
  App.register({
    id: 'report-detail',
    mount: mountReportDetail,
    demount: function () { App.clearNavSide(); }
  });
})();
// 代码已完成

/* ============================================================
   算得清 · 子页面模块：供应商管理（suppliers）/ 成本分类管理（categories）
   依赖：App / DB / api / icTag / esc / fmtMoney0 / fmtPct / skel
   两个模块均用 IIFE 包裹并通过 App.register 注册。
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     模块 1 · 供应商管理 suppliers
     - 顶部统计卡：本月应付合计（DB.suppliers spend 求和）
     - 搜索（防抖 260ms）+ 新增按钮
     - 列表按 食材类 / 平台类 分组，行点击弹出动作面板
     - 新增 / 编辑自建模态，删除二次确认
  ============================================================ */
  var FOOD_CATS = ['食材', '粮油', '蔬菜', '肉禽', '物流'];
  var SUP_CATS = ['食材', '粮油', '蔬菜', '肉禽', '物流', '平台'];
  var supState = { keyword: '' };

  function findSup(id) {
    var r = null;
    DB.suppliers.forEach(function (s) { if (s.id === id) r = s; });
    return r;
  }

  function maskPhone(p) {
    p = String(p || '');
    if (p.length < 7) return '138****6622';
    return p.slice(0, 3) + '****' + p.slice(-4);
  }

  function supHeroHtml() {
    var total = 0, orders = 0;
    DB.suppliers.forEach(function (s) { total += s.spend; orders += s.orders; });
    return '<div class="c-card c-card--hero" id="supHero" style="padding:16px 18px;">' +
      '<div style="font-size:12px;opacity:.85;">本月应付合计</div>' +
      '<div class="t-num" style="font-size:26px;font-weight:800;line-height:1;margin-top:5px;">¥' + fmtMoney0(total) + '</div>' +
      '<div style="font-size:11.5px;opacity:.82;margin-top:9px;">共 ' + DB.suppliers.length + ' 家供应商 · 本月 ' + orders + ' 笔采购订单</div></div>';
  }

  function mountSuppliers() {
    // 每次进入重建容器，保证返回再进入时刷新（App.on 由 demount 统一解绑，避免重复绑定）
    var sec = App.$('.screen[data-screen="suppliers"]');
    sec.innerHTML = '<div id="supRoot"></div>';
    renderSupShell();
    loadSuppliers();
  }

  function renderSupShell() {
    var h = supHeroHtml();
    h += '<div class="filterbar" style="margin-top:12px;align-items:center;">' +
      '<div class="c-search">' + icTag('search') + '<input id="supSearch" placeholder="搜索供应商名称" value="' + esc(supState.keyword) + '"></div>' +
      '<button class="c-btn c-btn--sm c-btn--soft" id="supAddBtn">' + icTag('plus') + ' 新增</button></div>';
    h += '<div id="supListBox"></div>';
    App.fill('supRoot', h);

    var input = App.$('#supSearch');
    var deb = null;
    App.on(input, 'input', function () {
      clearTimeout(deb);
      deb = setTimeout(function () {
        supState.keyword = input.value.trim();
        loadSuppliers();
      }, 260);
    });
    App.on(App.$('#supAddBtn'), 'click', function () { openSupModal(null); });
  }

  function updateSupHero() {
    var el = App.$('#supHero');
    if (el) { el.outerHTML = supHeroHtml(); }
  }

  function loadSuppliers() {
    var box = App.$('#supListBox');
    box.innerHTML = '<div style="padding:8px 0;">' + skel('list') + '</div>';
    // TODO: replace with GET /api/suppliers?keyword= → { list, total }
    api.getSuppliers({ keyword: supState.keyword }).then(function (res) {
      var list = res.data.list;
      if (!list.length) {
        box.innerHTML = '<div class="c-empty">' + icTag('truck') + '<p>没有找到相关供应商</p><div class="sub">换个名称试试</div></div>';
        return;
      }
      renderSupList(box, list);
    });
  }

  function supRowHtml(s) {
    var up = s.trend === 'up';
    var trendHtml = '<span style="display:inline-flex;align-items:center;color:' + (up ? 'var(--c-brand)' : 'var(--c-danger)') + ';">' +
      icTag(up ? 'trending-up' : 'trending-down', 12) + '</span>';
    return '<div class="c-cell" data-id="' + s.id + '">' +
      '<div style="width:38px;height:38px;border-radius:12px;background:var(--c-brand-soft);color:var(--c-brand);font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center;flex:none;">' + esc(s.initial) + '</div>' +
      '<div style="flex:1;min-width:0;">' +
      '<div style="font-size:14px;font-weight:600;">' + esc(s.name) + '</div>' +
      '<div style="font-size:12px;color:var(--c-ink-3);margin-top:1px;">联系人 ' + esc(s.contact) + ' · ' + s.orders + ' 笔订单</div></div>' +
      '<div style="text-align:right;flex:none;">' +
      '<div class="t-num" style="font-size:13px;font-weight:700;">¥' + fmtMoney0(s.spend) + '</div>' +
      '<div style="margin-top:3px;">' + trendHtml + '</div></div></div>';
  }

  function renderSupList(box, list) {
    var food = [], plat = [];
    list.forEach(function (s) { (FOOD_CATS.indexOf(s.cat) >= 0 ? food : plat).push(s); });
    var h = '<div class="c-group" style="margin-top:12px;">';
    if (food.length) {
      h += '<div class="g-title">食材类</div><div class="c-card" style="padding:4px 15px;">' + food.map(supRowHtml).join('') + '</div>';
    }
    if (plat.length) {
      h += '<div class="g-title" style="margin-top:12px;">平台类</div><div class="c-card" style="padding:4px 15px;">' + plat.map(supRowHtml).join('') + '</div>';
    }
    h += '</div>';
    box.innerHTML = h;
    box.querySelectorAll('.c-cell').forEach(function (row) {
      App.on(row, 'click', function () {
        var sup = findSup(row.getAttribute('data-id'));
        if (!sup) return;
        App.sheet([
          { icon: 'phone', label: '拨打电话', onClick: function () { App.toast('正在呼叫 ' + sup.contact + ' ' + maskPhone(sup.phone) + '（演示）'); } },
          { icon: 'pencil', label: '编辑供应商', onClick: function () { openSupModal(sup); } },
          { icon: 'trash-2', label: '删除', danger: true, onClick: function () { removeSup(sup); } }
        ], sup.name);
      });
    });
  }

  function removeSup(sup) {
    App.confirm({
      title: '删除这家供应商？',
      desc: '「' + sup.name + '」删除后不可恢复。',
      danger: true,
      onOk: function () {
        // TODO: replace with DELETE /api/suppliers/:id → { ok }
        api.deleteSupplier(sup.id).then(function () {
          App.toast('已删除');
          updateSupHero();
          loadSuppliers();
        });
      }
    });
  }

  /* 新增 / 编辑供应商：自建绝对定位弹层 */
  function openSupModal(sup) {
    var isEdit = !!sup;
    var selCat = sup ? sup.cat : SUP_CATS[0];
    var wrap = document.createElement('div');
    var h = '';
    h += '<div class="c-mask is-show" style="z-index:63;"></div>';
    h += '<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:88%;max-height:78%;overflow-y:auto;background:var(--c-card);border-radius:20px;padding:18px;z-index:64;box-shadow:var(--sh-lg);">';
    h += '<div style="font-size:16px;font-weight:700;margin-bottom:14px;">' + (isEdit ? '编辑供应商' : '新增供应商') + '</div>';
    h += '<div class="c-field"><div class="c-field__label">供应商名称<span class="req">*</span></div>' +
      '<input class="c-input" id="supName" placeholder="如：川味食材批发" value="' + (sup ? esc(sup.name) : '') + '"></div>';
    h += '<div class="c-field"><div class="c-field__label">联系人</div>' +
      '<input class="c-input" id="supContact" placeholder="对接人称呼" value="' + (sup ? esc(sup.contact || '') : '') + '"></div>';
    h += '<div class="c-field"><div class="c-field__label">联系电话</div>' +
      '<input class="c-input c-input-phone" id="supPhone" inputmode="tel" placeholder="手机号" value="' + (sup ? esc(sup.phone || '') : '') + '"></div>';
    h += '<div class="c-field"><div class="c-field__label">供货品类</div><div class="chips" id="supCats">';
    SUP_CATS.forEach(function (c) {
      h += '<button class="c-chip' + (c === selCat ? ' is-active' : '') + '" data-cat="' + c + '">' + c + '</button>';
    });
    h += '</div></div>';
    h += '<div class="c-field"><div class="c-field__label">备注</div>' +
      '<textarea class="c-textarea" id="supNote" placeholder="选填，如结算方式、账期等">' + (sup ? esc(sup.note || '') : '') + '</textarea></div>';
    h += '<div style="display:flex;gap:10px;margin-top:18px;">' +
      '<button class="c-btn c-btn--ghost" id="supCancel" style="flex:1;">取消</button>' +
      '<button class="c-btn c-btn--primary c-btn--block" id="supSave" style="flex:1;">保存</button></div>';
    h += '</div>';
    wrap.innerHTML = h;
    wrap.style.cssText = 'position:absolute;inset:0;z-index:62;';
    App.$('.phone').appendChild(wrap);
    App.scheduleInject(wrap);

    App.$('#supCats').querySelectorAll('.c-chip').forEach(function (b) {
      App.on(b, 'click', function () {
        selCat = b.getAttribute('data-cat');
        App.$('#supCats').querySelectorAll('.c-chip').forEach(function (x) { x.classList.remove('is-active'); });
        b.classList.add('is-active');
      });
    });
    var close = function () {
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    };
    App.on(wrap.querySelector('.c-mask'), 'click', close);
    App.on(App.$('#supCancel'), 'click', close);
    App.on(App.$('#supSave'), 'click', function () {
      var name = App.$('#supName').value.trim();
      if (!name) { App.toast('请输入供应商名称'); return; }
      var payload = {
        id: isEdit ? sup.id : null,
        name: name,
        contact: App.$('#supContact').value.trim(),
        phone: App.$('#supPhone').value.trim(),
        cat: selCat,
        note: App.$('#supNote').value.trim()
      };
      // TODO: replace with POST /api/suppliers / PUT /api/suppliers/:id → { id }
      api.saveSupplier(payload).then(function () {
        close();
        App.toast('已保存');
        updateSupHero();
        loadSuppliers();
      });
    });
  }
  /* ============================================================
     模块 2 · 成本分类管理 categories
     - 顶部说明卡 + 分类列表（色点 / 本月金额 / 占比）
     - 编辑模态（名称 + 6 色单选）、删除二次确认
     - 底部新增分类按钮，空列表显示空状态
  ============================================================ */
  var PRESET_COLORS = ['#0D7261', '#3E6FA8', '#B97A12', '#8A5FA8', '#C24A38', '#5B7C6B'];

  function findCat(id) {
    var r = null;
    DB.categories.forEach(function (c) { if (c.id === id) r = c; });
    return r;
  }

  function findShare(name) {
    var r = null;
    DB.share.forEach(function (s) { if (s.cat === name) r = s; });
    return r;
  }

  function mountCategories() {
    var sec = App.$('.screen[data-screen="categories"]');
    if (!sec.firstChild) sec.innerHTML = '<div id="catRoot"></div>';
    renderCatShell();
    loadCategories();
  }

  function renderCatShell() {
    var h = '<div class="c-card c-card--flat" style="padding:12px 14px;display:flex;align-items:flex-start;gap:8px;">' +
      '<span style="color:var(--c-brand);flex:none;margin-top:1px;">' + icTag('info', 14) + '</span>' +
      '<div style="font-size:12px;color:var(--c-ink-2);line-height:1.7;">分类用于归集每笔成本，记账时可选；删除分类前需先处理其下记录。</div></div>';
    h += '<div id="catListBox"></div>';
    h += '<button class="c-btn c-btn--soft c-btn--block" id="catAddBtn" style="margin-top:12px;">' + icTag('plus') + ' 新增分类</button>';
    App.fill('catRoot', h);
    App.on(App.$('#catAddBtn'), 'click', function () { openCatModal(null); });
  }

  function loadCategories() {
    var box = App.$('#catListBox');
    box.innerHTML = '<div style="padding:8px 0;">' + skel('list') + '</div>';
    // TODO: replace with GET /api/categories → { list }
    api.getCategories().then(function (res) {
      var list = res.data.list;
      if (!list.length) {
        box.innerHTML = '<div class="c-empty">' + icTag('folder-open') + '<p>还没有成本分类</p><div class="sub">点击下方按钮创建第一个分类</div></div>';
        return;
      }
      var h = '<div class="c-card" style="margin-top:12px;padding:4px 15px;">';
      h += '<div style="font-size:13px;font-weight:700;padding:12px 2px 8px;border-bottom:1px solid var(--c-line);">成本分类</div>';
      list.forEach(function (c) {
        var share = findShare(c.name);
        var subHtml = share
          ? '本月 ¥' + fmtMoney0(share.amount) + ' · 占比 ' + fmtPct(share.pct) + '%'
          : '暂无本月记录';
        h += '<div class="c-cell">' +
          '<span style="width:8px;height:8px;border-radius:3px;background:' + c.color + ';flex:none;"></span>' +
          '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:14px;font-weight:600;">' + esc(c.name) + '</div>' +
          '<div style="font-size:12px;color:var(--c-ink-3);margin-top:1px;">' + subHtml + '</div></div>' +
          '<button data-act="edit" data-id="' + c.id + '" style="padding:8px;color:var(--c-ink-3);">' + icTag('pencil', 14) + '</button>' +
          '<button data-act="del" data-id="' + c.id + '" style="padding:8px;color:var(--c-ink-3);">' + icTag('trash-2', 14) + '</button></div>';
      });
      h += '</div>';
      box.innerHTML = h;
      box.querySelectorAll('[data-act]').forEach(function (b) {
        App.on(b, 'click', function () {
          var cat = findCat(b.getAttribute('data-id'));
          if (!cat) return;
          if (b.getAttribute('data-act') === 'edit') openCatModal(cat);
          else removeCat(cat);
        });
      });
    });
  }

  function removeCat(cat) {
    App.confirm({
      title: '删除这个分类？',
      desc: '「' + cat.name + '」删除后不可恢复，请先处理其下记录。',
      danger: true,
      onOk: function () {
        // TODO: replace with DELETE /api/categories/:id → { ok }
        api.deleteCategory(cat.id).then(function (res) {
          var d = res.data;
          if (d.ok === false) { App.toast(d.reason); return; }
          App.toast('已删除');
          loadCategories();
        });
      }
    });
  }

  /* 新增 / 编辑分类：自建绝对定位弹层（含颜色选择） */
  function openCatModal(cat) {
    var isEdit = !!cat;
    var selColor = cat ? cat.color : PRESET_COLORS[0];
    var wrap = document.createElement('div');
    var h = '';
    h += '<div class="c-mask is-show" style="z-index:63;"></div>';
    h += '<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:88%;max-height:78%;overflow-y:auto;background:var(--c-card);border-radius:20px;padding:18px;z-index:64;box-shadow:var(--sh-lg);">';
    h += '<div style="font-size:16px;font-weight:700;margin-bottom:14px;">' + (isEdit ? '编辑分类' : '新增分类') + '</div>';
    h += '<div class="c-field"><div class="c-field__label">分类名称<span class="req">*</span></div>' +
      '<input class="c-input" id="catName" placeholder="如：食材采购" value="' + (cat ? esc(cat.name) : '') + '"></div>';
    h += '<div class="c-field"><div class="c-field__label">分类颜色</div><div style="display:flex;gap:10px;" id="catColors">';
    PRESET_COLORS.forEach(function (col) {
      h += '<button data-color="' + col + '" style="width:32px;height:32px;border-radius:50%;background:' + col + ';display:flex;align-items:center;justify-content:center;color:#fff;flex:none;">' +
        (col === selColor ? icTag('check', 15) : '') + '</button>';
    });
    h += '</div></div>';
    h += '<div style="display:flex;gap:10px;margin-top:18px;">' +
      '<button class="c-btn c-btn--ghost" id="catCancel" style="flex:1;">取消</button>' +
      '<button class="c-btn c-btn--primary c-btn--block" id="catSave" style="flex:1;">保存</button></div>';
    h += '</div>';
    wrap.innerHTML = h;
    wrap.style.cssText = 'position:absolute;inset:0;z-index:62;';
    App.$('.phone').appendChild(wrap);
    App.scheduleInject(wrap);

    App.$('#catColors').querySelectorAll('[data-color]').forEach(function (b) {
      App.on(b, 'click', function () {
        selColor = b.getAttribute('data-color');
        App.$('#catColors').querySelectorAll('[data-color]').forEach(function (x) {
          x.innerHTML = x.getAttribute('data-color') === selColor ? icTag('check', 15) : '';
        });
        App.scheduleInject(App.$('#catColors'));
      });
    });
    var close = function () {
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    };
    App.on(wrap.querySelector('.c-mask'), 'click', close);
    App.on(App.$('#catCancel'), 'click', close);
    App.on(App.$('#catSave'), 'click', function () {
      var name = App.$('#catName').value.trim();
      if (!name) { App.toast('请输入分类名称'); return; }
      var payload = { id: isEdit ? cat.id : null, name: name, color: selColor };
      // TODO: replace with POST /api/categories / PUT /api/categories/:id → { id }
      api.saveCategory(payload).then(function () {
        close();
        App.toast('已保存');
        loadCategories();
      });
    });
  }

  /* ---------- 注册模块 ---------- */
  App.register({ id: 'suppliers', mount: mountSuppliers, demount: function () { } });
  App.register({ id: 'categories', mount: mountCategories, demount: function () { } });
})();

// 代码已完成

// 算得清 · 子页面模块（form / product / product-detail / reports / report-detail / suppliers / categories）
