/* 算得清 · 登录注册 + 行业引导向导
   - 登录屏（data-screen="login"）：手机号 + 验证码（演示：任意 6 位）
   - 引导屏（data-screen="onboarding"）：3 步向导
     Step1 选择行业 → Step2 门店信息 → Step3 分类模板预览
   - 完成结果持久化 localStorage('sqd-ob')，下次启动直接进入工作台
   - 应用配置：按行业模板初始化 DB.categories / DB.store */
(function () {
  'use strict';

  var OB_KEY = 'sqd-ob';
  var SCALES = ['档口', '单店', '多店'];

  /* 模块内选择器（App 未导出 $all，勿用 App.$all） */
  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* ---------- 持久化 ---------- */
  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(OB_KEY));
      if (v && v.done) return v;
    } catch (e) { /* ignore */ }
    return null;
  }
  function save(obj) {
    try { localStorage.setItem(OB_KEY, JSON.stringify(obj)); } catch (e) { /* ignore */ }
  }
  function clear() {
    try { localStorage.removeItem(OB_KEY); } catch (e) { /* ignore */ }
  }

  /* 应用行业配置到 DB（登录态与分类/店铺信息） */
  function apply(ob) {
    if (!ob || !ob.industry) return;
    var tpl = DB.industryTemplates[ob.industry];
    if (tpl && tpl.categories) {
      DB.categories = tpl.categories.map(function (c) { return { id: c.id, name: c.name, color: c.color }; });
    }
    if (ob.storeName) DB.store.name = ob.storeName;
    DB.store.type = (tpl ? tpl.name : '商户') + ' · ' + (ob.scale || '单店');
    if (ob.budget) DB.store.budget = Number(ob.budget);
  }

  /* ============================================================
     登录屏
  ============================================================ */
  var loginTimer = null;

  function mountLogin() {
    var sec = App.$('.screen[data-screen="login"]');
    sec.innerHTML = buildLoginHtml();
    App.scheduleInject(sec);
    bindLogin();
  }
  function demountLogin() {
    clearInterval(loginTimer);
    loginTimer = null;
  }

  function buildLoginHtml() {
    var h = '<div style="padding:8px 0 40px;">';

    /* 品牌 hero */
    h += '<div class="lock-hero">' +
      '<div class="brand">' + icTag('notebook-pen', 26) + '算得清</div>' +
      '<div class="slogan">让每一笔成本都算得清 · 面向中小商家的成本管家</div>' +
      '<div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;">' +
      '<span class="c-tag" style="background:rgba(255,255,255,.16);color:#fff;">' + icTag('wallet') + ' 精细记账</span>' +
      '<span class="c-tag" style="background:rgba(255,255,255,.16);color:#fff;">' + icTag('utensils') + ' 成本核算</span>' +
      '<span class="c-tag" style="background:rgba(255,255,255,.16);color:#fff;">' + icTag('file-text') + ' 月度报表</span></div>' +
      '<div class="price-note">新用户注册即享 14 天专业版 · 支持多行业模板</div></div>';

    /* 手机号 */
    h += '<div class="c-field"><div class="c-field__label">手机号<span class="req">*</span></div>' +
      '<input class="c-input c-input-phone" id="lgPhone" inputmode="numeric" maxlength="11" placeholder="请输入 11 位手机号"></div>';

    /* 验证码 */
    h += '<div class="c-field"><div class="c-field__label">验证码<span class="req">*</span><span class="c-field__tip">演示环境任意 6 位即可</span></div>' +
      '<div style="display:flex;gap:10px;">' +
      '<input class="c-input c-input-phone" id="lgCode" inputmode="numeric" maxlength="6" placeholder="6 位验证码" style="flex:1;">' +
      '<button class="c-btn c-btn--soft c-btn--md" id="lgSend" style="flex:none;width:112px;">获取验证码</button></div></div>';

    /* 协议 */
    h += '<div style="display:flex;align-items:center;gap:8px;padding:2px 2px 18px;font-size:12px;color:var(--c-ink-2);">' +
      '<button id="lgAgree" class="c-btn" style="width:20px;height:20px;border-radius:6px;border:1.5px solid var(--c-brand);background:var(--c-brand);display:inline-flex;align-items:center;justify-content:center;padding:0;">' + icTag('check', 13) + '</button>' +
      '<span>我已阅读并同意<span style="color:var(--c-brand);">《用户协议》</span>与<span style="color:var(--c-brand);">《隐私政策》</span></span></div>';

    /* 登录 */
    h += '<button class="c-btn c-btn--primary c-btn--block" id="lgSubmit" style="height:46px;font-size:15px;">登录 / 注册</button>';

    /* 演示入口 */
    h += '<div style="text-align:center;margin-top:18px;">' +
      '<button class="c-btn" id="lgDemo" style="font-size:12px;color:var(--c-ink-3);padding:6px 10px;">直接体验演示数据 ></button></div>';

    h += '</div>';
    return h;
  }

  function bindLogin() {
    var agreed = false;

    App.on(App.$('#lgAgree'), 'click', function () {
      agreed = !agreed;
      var el = App.$('#lgAgree');
      if (agreed) {
        el.style.background = 'var(--c-brand)';
        el.style.borderColor = 'var(--c-brand)';
        el.style.color = '#fff';
      } else {
        el.style.background = 'transparent';
        el.style.borderColor = 'var(--c-line)';
        el.style.color = 'transparent';
      }
    });

    /* 获取验证码（模拟，60s 倒计时） */
    App.on(App.$('#lgSend'), 'click', function () {
      var phone = App.$('#lgPhone').value.trim();
      if (!/^1\d{10}$/.test(phone)) { App.toast('请输入正确的手机号'); return; }
      var btn = App.$('#lgSend');
      var left = 60;
      btn.disabled = true;
      btn.textContent = left + 's 后重发';
      clearInterval(loginTimer);
      loginTimer = setInterval(function () {
        left--;
        if (left <= 0) {
          clearInterval(loginTimer);
          loginTimer = null;
          btn.disabled = false;
          btn.textContent = '获取验证码';
        } else {
          btn.textContent = left + 's 后重发';
        }
      }, 1000);
      App.toast('验证码已发送（演示：任意 6 位）');
    });

    /* 登录 */
    App.on(App.$('#lgSubmit'), 'click', function () {
      var phone = App.$('#lgPhone').value.trim();
      var code = App.$('#lgCode').value.trim();
      if (!/^1\d{10}$/.test(phone)) { App.toast('请输入正确的手机号'); return; }
      if (!/^\d{6}$/.test(code)) { App.toast('请输入 6 位验证码'); return; }
      if (!agreed) { App.toast('请先阅读并同意用户协议'); return; }
      var btn = App.$('#lgSubmit');
      btn.disabled = true;
      btn.innerHTML = icTag('check', 16) + '登录中…';
      setTimeout(function () {
        btn.disabled = false;
        btn.innerHTML = icTag('check', 16) + '登录 / 注册';
        /* 登录态：存手机号，引导完成时一并持久化 */
        obState.phone = phone;
        App.toast('登录成功，开始配置你的行业');
        App.go('onboarding');
      }, 650);
    });

    /* 直接体验演示数据 */
    App.on(App.$('#lgDemo'), 'click', function () {
      save({ done: true, industry: 'canteen', storeName: '老街小馆 · 川菜', scale: '单店', budget: 160000 });
      apply(read());
      App.resetTo('home');
    });
  }

  /* ============================================================
     行业引导向导
  ============================================================ */
  var obState = { step: 1, industry: null, storeName: '', scale: '单店', budget: '', phone: '' };

  function mountOnboarding() {
    obState.step = 1;
    obState.industry = null;
    obState.storeName = '';
    obState.scale = '单店';
    obState.budget = '';
    /* 保留登录时的手机号 */
    var pre = read();
    if (pre && pre.phone && !obState.phone) obState.phone = pre.phone;
    renderObStep();
  }
  function demountOnboarding() { /* 无临时状态 */ }

  var OB_TITLES = { 1: '选择你的行业', 2: '完善门店信息', 3: '分类模板已生成' };
  var OB_SUBS = {
    1: '我们将按行业生成匹配的成本分类，开箱即用',
    2: '用于计算预算与生成报表',
    3: '以下分类已自动配置，可随时在「分类管理」中调整'
  };

  function renderObStep() {
    var sec = App.$('.screen[data-screen="onboarding"]');
    if (!sec) return;
    var h = '<div style="padding-bottom:96px;">';

    /* 进度指示 */
    h += '<div style="display:flex;align-items:center;gap:8px;margin:10px 2px 26px;">';
    for (var i = 1; i <= 3; i++) {
      var done = i < obState.step;
      var cur = i === obState.step;
      h += '<div class="ob-dot' + (done ? ' is-done' : '') + (cur ? ' is-cur' : '') + '">' +
        (done ? icTag('check', 12) : '<span>' + i + '</span>') + '</div>';
      if (i < 3) h += '<div class="ob-line' + (done ? ' is-done' : '') + '"></div>';
    }
    h += '</div>';

    h += '<div class="ob-title">' + OB_TITLES[obState.step] + '</div>';
    h += '<div class="ob-sub">' + OB_SUBS[obState.step] + '</div>';

    if (obState.step === 1) {
      h += buildStep1();
    } else if (obState.step === 2) {
      h += buildStep2();
    } else {
      h += buildStep3();
    }

    /* 底部操作区 */
    h += '<div style="position:absolute;left:0;right:0;bottom:0;padding:14px 16px calc(16px + env(safe-area-inset-bottom));background:rgba(245,243,238,.92);backdrop-filter:blur(10px);border-top:1px solid var(--c-line);display:flex;gap:10px;">';
    if (obState.step > 1) {
      h += '<button class="c-btn c-btn--ghost" id="obPrev" style="flex:1;height:46px;">上一步</button>';
    }
    var nextLabel = obState.step === 3 ? '开始使用' : '下一步';
    h += '<button class="c-btn c-btn--primary" id="obNext" style="flex:2;height:46px;font-size:15px;">' +
      (obState.step === 3 ? icTag('check', 16) : '') + nextLabel + '</button></div>';

    sec.innerHTML = h;
    App.scheduleInject(sec);
    bindObStep();
  }

  function buildStep1() {
    var h = '<div class="ob-grid">';
    var keys = ['canteen', 'retail', 'fresh', 'beauty', 'factory', 'stall', 'service'];
    keys.forEach(function (k) {
      var t = DB.industryTemplates[k];
      if (!t) return;
      var active = obState.industry === k;
      h += '<button class="ob-card' + (active ? ' is-active' : '') + '" data-ind="' + k + '">' +
        '<span class="ob-card__icon">' + icTag(t.icon, 22) + '</span>' +
        '<span class="ob-card__name">' + t.name + '</span>' +
        '<span class="ob-card__desc">' + t.desc + '</span></button>';
    });
    h += '</div>';
    return h;
  }

  function buildStep2() {
    var h = '<div style="margin-top:22px;">';

    h += '<div class="c-field"><div class="c-field__label">门店名称<span class="req">*</span></div>' +
      '<input class="c-input" id="obName" placeholder="如：幸福便利店" value="' + esc(obState.storeName) + '"></div>';

    h += '<div class="c-field"><div class="c-field__label">经营规模</div>' +
      '<div class="c-seg" id="obScale">';
    SCALES.forEach(function (s) {
      h += '<button data-s="' + s + '" class="' + (obState.scale === s ? 'is-active' : '') + '">' + s + '</button>';
    });
    h += '</div></div>';

    h += '<div class="c-field"><div class="c-field__label">月成本预算<span class="req">*</span><span class="c-field__tip">用于预算进度与超支提醒</span></div>' +
      '<div style="position:relative;"><span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:14px;font-weight:600;color:var(--c-ink-2);">¥</span>' +
      '<input class="c-input c-input-phone" id="obBudget" inputmode="numeric" placeholder="如：80000" value="' + esc(obState.budget) + '" style="padding-left:32px;"></div></div>';

    h += '<div class="c-card c-card--flat" style="display:flex;align-items:flex-start;gap:8px;margin-top:6px;">' +
      '<span style="color:var(--c-brand);flex:none;margin-top:1px;">' + icTag('info', 14) + '</span>' +
      '<div style="font-size:12px;color:var(--c-ink-2);line-height:1.7;">预算设置后可在「我的 → 店铺设置」中随时修改，成本率超 75% 会收到预警。</div></div>';

    h += '</div>';
    return h;
  }

  function buildStep3() {
    var t = DB.industryTemplates[obState.industry];
    var name = t ? t.name : '';
    var h = '<div style="margin-top:22px;">';

    h += '<div class="c-card c-card--hero" style="padding:16px 18px;display:flex;align-items:center;gap:12px;">' +
      '<div style="width:44px;height:44px;border-radius:13px;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;">' + icTag(t ? t.icon : 'store', 22) + '</div>' +
      '<div><div style="font-size:15px;font-weight:800;">' + esc(obState.storeName || '我的门店') + '</div>' +
      '<div style="font-size:11.5px;opacity:.85;margin-top:2px;">' + name + ' · ' + obState.scale + ' · 月预算 ¥' + fmtMoney0(Number(obState.budget) || 0) + '</div></div></div>';

    h += '<div class="sec-title" style="margin-top:22px;"><span>已生成成本分类</span><span style="font-size:11px;color:var(--c-ink-3);font-weight:400;">' + (t ? t.categories.length : 0) + ' 个</span></div>';
    h += '<div class="chips">';
    (t ? t.categories : []).forEach(function (c) {
      h += '<span class="c-chip is-active" style="cursor:default;">' +
        '<span style="width:7px;height:7px;border-radius:2px;background:' + c.color + ';display:inline-block;"></span>' +
        esc(c.name) + '</span>';
    });
    h += '</div>';

    h += '<div class="c-card c-card--flat" style="display:flex;align-items:flex-start;gap:8px;margin-top:20px;">' +
      '<span style="color:var(--c-brand);flex:none;margin-top:1px;">' + icTag('check', 14) + '</span>' +
      '<div style="font-size:12px;color:var(--c-ink-2);line-height:1.7;">分类仅影响记账时的归集选项，可在「我的 → 分类管理」中增删改，随时切换行业模板。</div></div>';

    h += '</div>';
    return h;
  }

  function bindObStep() {
    /* 行业选择 */
    var cards = $all('.ob-card');
    cards.forEach(function (c) {
      App.on(c, 'click', function () {
        obState.industry = c.getAttribute('data-ind');
        cards.forEach(function (x) { x.classList.toggle('is-active', x === c); });
      });
    });

    /* Step2 输入 */
    if (obState.step === 2) {
      var nameEl = App.$('#obName');
      if (nameEl) App.on(nameEl, 'input', function () { obState.storeName = nameEl.value.trim(); });
      var budgetEl = App.$('#obBudget');
      if (budgetEl) App.on(budgetEl, 'input', function () {
        budgetEl.value = budgetEl.value.replace(/[^\d]/g, '');
        obState.budget = budgetEl.value;
      });
      var segBtns = $all('#obScale button');
      segBtns.forEach(function (b) {
        App.on(b, 'click', function () {
          obState.scale = b.getAttribute('data-s');
          segBtns.forEach(function (x) { x.classList.toggle('is-active', x === b); });
        });
      });
    }

    /* 上一步 */
    var prev = App.$('#obPrev');
    if (prev) App.on(prev, 'click', function () { obState.step--; renderObStep(); });

    /* 下一步 / 完成 */
    var next = App.$('#obNext');
    if (next) App.on(next, 'click', function () {
      if (obState.step === 1) {
        if (!obState.industry) { App.toast('请先选择你的行业'); return; }
        obState.step = 2;
        renderObStep();
      } else if (obState.step === 2) {
        if (!obState.storeName) { App.toast('请输入门店名称'); return; }
        if (!/^\d+$/.test(obState.budget) || Number(obState.budget) <= 0) { App.toast('请输入正确的月成本预算'); return; }
        obState.step = 3;
        renderObStep();
      } else {
        /* 完成：持久化并应用 */
        save({
          done: true,
          industry: obState.industry,
          storeName: obState.storeName,
          scale: obState.scale,
          budget: Number(obState.budget),
          phone: obState.phone
        });
        apply(read());
        App.toast('配置完成，开始记账吧');
        App.resetTo('home');
      }
    });
  }

  /* ---------- 注册 ---------- */
  App.register({ id: 'login', mount: mountLogin, demount: demountLogin });
  App.register({ id: 'onboarding', mount: mountOnboarding, demount: demountOnboarding });

  /* 导出给 app.js 启动逻辑 */
  window.Onboarding = {
    read: read,
    save: save,
    clear: clear,
    apply: apply,
    OB_KEY: OB_KEY
  };
})();
