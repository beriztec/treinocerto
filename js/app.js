/*
 * Treino Certo — Landing page VSL
 * Relógio da oferta, pop-up do cupom, VSL animada, prévia do app, animação do glúteo, CTAs com UTM.
 * JavaScript puro, sem dependências. Configuração em js/config.js.
 */
(function () {
  'use strict';

  var CFG = window.TC_CONFIG || {};
  var DEMOS = window.TC_DEMOS || {};
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* armazenamento indisponível */ } },
    sget: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    sset: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* idem */ } },
  };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var setText = function (sel, txt) { $$(sel).forEach(function (el) { el.textContent = txt; }); };
  var money = function (s) { return parseFloat(String(s).replace(/[^\d,]/g, '').replace(',', '.')) || 0; };
  var fmtBRL = function (n) { return 'R$ ' + n.toFixed(2).replace('.', ','); };

  /* ═════════ 1. Dados da oferta no HTML ═════════ */
  var price = CFG.price || {};
  var coupon = CFG.coupon || {};
  function fillOffer() {
    if (price.from) setText('[data-price-from]', price.from);
    if (price.now) setText('[data-price-now]', price.now);
    setText('[data-price-note]', price.note || '');
    if (!price.note) $$('[data-price-note]').forEach(function (e) { e.hidden = true; });
    if (coupon.code) setText('[data-coupon-code]', coupon.code);
    if (CFG.guaranteeDays) setText('[data-guarantee]', String(CFG.guaranteeDays));
    var save = money(price.from) - money(price.now);
    if (save > 0) {
      setText('[data-savings]', fmtBRL(save));
      var pct = Math.round((save / money(price.from)) * 100) + '% OFF';
      $$('.offer-ribbon').forEach(function (e) { e.textContent = pct; });
    }
    var l = CFG.legal || {};
    var parts = ['© ' + new Date().getFullYear() + ' ' + (l.company || 'Treino Certo')];
    if (l.document) parts.push(l.document);
    if (l.responsible) parts.push('Responsável técnico: ' + l.responsible);
    if (l.email) parts.push(l.email);
    setText('[data-legal]', parts.join(' · '));
  }

  /* ═════════ 2. Relógio da oferta (real: ao zerar, o desconto acaba) ═════════ */
  var timer = CFG.timer || {};
  var deadline = (function () {
    if (timer.deadline) {
      var d = Date.parse(timer.deadline);
      if (!isNaN(d)) return d;
    }
    var KEY = 'tc-vsl-deadline';
    var saved = Number(store.get(KEY));
    if (saved && saved > 0) return saved;
    var dl = Date.now() + (timer.hours || 3) * 3600 * 1000;
    store.set(KEY, String(dl));
    return dl;
  })();
  var expired = false;
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tickClock() {
    var left = Math.max(0, deadline - Date.now());
    var s = Math.floor(left / 1000);
    setText('[data-countdown]', pad(Math.floor(s / 3600)) + ':' + pad(Math.floor((s % 3600) / 60)) + ':' + pad(s % 60));
    if (left <= 0 && !expired) expire();
  }
  function expire() {
    expired = true;
    $$('[data-active-only]').forEach(function (e) { e.hidden = true; });
    $('#topbar').hidden = true;
    $('#topbar-expired').hidden = false;
    if (timer.priceAfterExpire) setText('[data-price-now]', timer.priceAfterExpire);
    $$('.price-teaser').forEach(function (e) { e.textContent = 'A oferta de lançamento terminou.'; });
    $$('#sticky span').forEach(function (e) { e.textContent = 'acesso imediato'; });
    $$('[data-coupon-status]').forEach(function (e) { e.hidden = true; });
    closeModal();
    updateCheckoutLinks();
  }

  /* ═════════ 3. Botões de compra (UTMs + cupom) ═════════ */
  var PASS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'src', 'sck'];
  var couponApplied = store.get('tc-vsl-coupon') === '1';
  function checkoutHref() {
    if (!CFG.checkoutUrl) return '#oferta';
    try {
      var url = new URL(CFG.checkoutUrl);
      var here = new URLSearchParams(window.location.search);
      PASS.forEach(function (k) {
        var v = here.get(k);
        if (v && !url.searchParams.has(k)) url.searchParams.set(k, v);
      });
      // Enquanto a oferta vale, o cupom vai junto (o preço de R$ 29,90 depende dele)
      if (!expired && coupon.code && coupon.urlParam) url.searchParams.set(coupon.urlParam, coupon.code);
      return url.toString();
    } catch (e) {
      return CFG.checkoutUrl;
    }
  }
  function updateCheckoutLinks() {
    $$('[data-cta="checkout"]').forEach(function (a) { a.href = checkoutHref(); });
  }
  function showCouponApplied() {
    if (expired) return;
    $$('[data-coupon-status]').forEach(function (e) { e.hidden = false; });
  }

  /* ═════════ 4. Pop-up do cupom ═════════ */
  var modal = $('#coupon-modal');
  var lastFocus = null;
  function openModal() {
    if (!modal || expired || !modal.hidden || store.sget('tc-vsl-popup') === '1') return;
    store.sset('tc-vsl-popup', '1');
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    var first = $('[data-copy]', modal);
    if (first) first.focus();
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function initModal() {
    if (!modal) return;
    modal.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) closeModal();
      var copy = e.target.closest('[data-copy]');
      if (copy) {
        var code = coupon.code || '';
        var done = function () {
          var lab = $('[data-copy-label]', modal);
          if (lab) lab.textContent = 'Copiado! ✓';
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, done);
        else done();
      }
      if (e.target.closest('[data-apply]')) {
        // marca o cupom e deixa o link seguir direto para o checkout (já leva o cupom na URL)
        couponApplied = true;
        store.set('tc-vsl-coupon', '1');
        showCouponApplied();
        if (!CFG.checkoutUrl) closeModal();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (modal.hidden) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'Tab') {
        var f = $$('button, a[href]', modal).filter(function (x) { return x.offsetParent !== null; });
        if (!f.length) return;
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    // Quando aparece: após X segundos, ou quando o mouse sai pelo topo (intenção de sair, no computador)
    setTimeout(openModal, (coupon.popupAfterSeconds || 12) * 1000);
    document.addEventListener('mouseout', function (e) {
      if (!e.relatedTarget && e.clientY <= 0) openModal();
    });
  }

  /* ═════════ 5. Tutorial animado (pose-player.js) ═════════ */
  function mountPose(el) {
    var key = el.getAttribute('data-demo');
    if (!DEMOS[key] || !window.TCPose) return;
    el.setAttribute('data-pose', JSON.stringify(DEMOS[key]));
    if (el.getAttribute('data-thumb') === '1') el.classList.add('pose-thumb');
    window.TCPose.mount(el);
  }

  /* ═════════ 6. VSL: vídeo real ou VSL animada (stories) ═════════ */
  var SCENES = [
    { k: 'Você treina.', t: 'Sua, se dedica,<br>não falta um dia…', d: 'squat' },
    { k: 'Mas…', t: 'sente tudo <em>na coxa</em><br>e quase nada no glúteo?', d: 'legPress' },
    { k: 'A verdade', t: 'O problema quase nunca<br>é <em>falta de esforço</em>.', x: 'É o exercício, a execução e a falta de progressão.' },
    { k: 'Execução', t: 'Veja cada exercício<br><em>quadro a quadro</em>.', d: 'hipThrustDb' },
    { k: 'Foco', t: 'Saiba exatamente onde<br>você deve <em>sentir</em>.', x: 'O músculo-alvo aparece em destaque.', d: 'abdLean' },
    { k: 'Método', t: 'Programas prontos,<br><em>semana a semana</em>.', x: 'Séries, repetições, descanso e quando aumentar a carga.', d: 'bulgarian' },
    { k: 'Em menos de 1 mês', t: 'Sinta o glúteo<br><em>trabalhar de verdade</em>.', x: 'Mais ativação, mais força, mais firmeza.', d: 'bridgeBand' },
    { k: 'Treino Certo', t: 'Pare de treinar no escuro.<br><em>Comece a treinar certo.</em>', cta: true },
  ];
  function initVsl() {
    var box = $('#vsl');
    if (!box) return;
    var url = CFG.videoUrl || '';
    if (url) {
      var yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
      var vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      if (yt) box.innerHTML = '<iframe class="vsl-embed" src="https://www.youtube-nocookie.com/embed/' + yt[1] + '?rel=0&modestbranding=1&playsinline=1" title="Vídeo de apresentação" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
      else if (vm) box.innerHTML = '<iframe class="vsl-embed" src="https://player.vimeo.com/video/' + vm[1] + '?title=0&byline=0&portrait=0" title="Vídeo de apresentação" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
      else box.innerHTML = '<video class="vsl-embed" src="' + url + '" controls playsinline preload="metadata"></video>';
      return;
    }
    var n = SCENES.length;
    var DUR = 5200;
    box.innerHTML =
      '<div class="story" role="region" aria-roledescription="apresentação" aria-label="Apresentação do Treino Certo">' +
      '<div class="story-bars" aria-hidden="true">' + SCENES.map(function () { return '<i><b></b></i>'; }).join('') + '</div>' +
      '<div class="scene-holder" aria-live="polite"></div>' +
      '<button type="button" class="story-tap prev" aria-label="Cena anterior"></button>' +
      '<button type="button" class="story-tap next" aria-label="Próxima cena"></button>' +
      '<div class="story-ctrl"><button type="button" class="story-btn" aria-label="Pausar">❚❚</button><span class="story-count"></span></div>' +
      '</div>';
    var holder = $('.scene-holder', box);
    var bars = $$('.story-bars b', box);
    var btn = $('.story-btn', box);
    var count = $('.story-count', box);
    var i = 0, prog = 0, last = 0, paused = reduce, ended = false, raf = 0;

    function render() {
      var s = SCENES[i];
      if (holder.firstChild) $$('[data-pose]', holder).forEach(function (el) { window.TCPose && window.TCPose.unmount(el); });
      holder.innerHTML =
        '<div class="scene' + (s.d ? '' : ' solo') + '">' +
        '<span class="scene-kicker">' + s.k + '</span>' +
        '<p class="scene-title">' + s.t + '</p>' +
        (s.x ? '<p class="scene-text">' + s.x + '</p>' : '') +
        (s.cta ? '<div class="scene-cta"><a class="cta cta-lg" href="' + checkoutHref() + '" data-cta="checkout">EU QUERO!</a></div>' : '') +
        (s.d ? '<div class="scene-fig"><div class="pose" data-demo="' + s.d + '" data-bare="1" data-name="' + s.k + '"></div></div>' : '') +
        '</div>';
      var p = $('[data-demo]', holder);
      if (p) mountPose(p);
      count.textContent = i + 1 + '/' + n;
      bars.forEach(function (b, k) { b.style.transform = 'scaleX(' + (k < i ? 1 : k === i ? prog : 0) + ')'; });
    }
    function go(k) {
      i = Math.max(0, Math.min(n - 1, k));
      prog = 0; last = 0; ended = false;
      setBtn();
      render();
      loop();
    }
    function setBtn() {
      btn.textContent = ended ? '↺' : paused ? '▶' : '❚❚';
      btn.setAttribute('aria-label', ended ? 'Assistir de novo' : paused ? 'Continuar' : 'Pausar');
    }
    function frame(now) {
      raf = 0;
      if (paused || ended) return;
      var dt = last ? now - last : 0;
      last = now;
      prog += dt / DUR;
      if (prog >= 1) {
        if (i < n - 1) { go(i + 1); return; }
        prog = 1; ended = true; setBtn();
      }
      bars[i].style.transform = 'scaleX(' + prog + ')';
      if (!ended) loop();
    }
    function loop() { if (!raf && !paused && !ended) raf = requestAnimationFrame(frame); }

    $('.story-tap.prev', box).addEventListener('click', function () { go(i - 1); });
    $('.story-tap.next', box).addEventListener('click', function () { go(i + 1); });
    btn.addEventListener('click', function () {
      if (ended) { paused = false; go(0); return; }
      paused = !paused; last = 0; setBtn(); loop();
    });
    render();
    setBtn();
    loop();
  }

  /* ═════════ 7. Prévia do app (abas do celular) ═════════ */
  function initPhone() {
    var tabs = $$('.phone-tabs [data-tab]');
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        var id = t.getAttribute('data-tab');
        tabs.forEach(function (x) { x.setAttribute('aria-selected', String(x === t)); });
        $$('.phone-body').forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== id; });
      });
    });
    $$('.phone .pose[data-demo], #diferenca .pose[data-demo]').forEach(mountPose);
  }

  /* ═════════ 8. Animação do glúteo ganhando forma ═════════ */
  function glutePath(g) {
    var a = 58 - 22 * g; // ponto mais projetado do glúteo (quanto menor o x, mais volume)
    var ay = 132 + 4 * g;
    return (
      'M92 34 C 86 58, 82 78, ' + (78 - 6 * g) + ' 96 ' +
      'C ' + (66 - 14 * g) + ' 108, ' + a + ' ' + (ay - 16) + ', ' + a + ' ' + ay + ' ' +
      'C ' + a + ' ' + (ay + 26) + ', ' + (72 - 4 * g) + ' ' + (174 + 6 * g) + ', 88 ' + (182 + 4 * g) + ' ' +
      'C 91 208, 93 238, 97 272 L 141 272 C 145 240, 151 206, 151 176 ' +
      'C 151 146, 146 118, 140 92 C 136 70, 134 52, 132 34 Z'
    );
  }
  function initGlute() {
    var svg = $('#glute-anim');
    if (!svg) return;
    var NS = 'http://www.w3.org/2000/svg';
    svg.innerHTML =
      '<defs><clipPath id="shorts"><polygon points="0,0 220,0 220,204 0,180"/></clipPath>' +
      '<linearGradient id="fadeV" x1="0" y1="0" x2="0" y2="1"><stop offset="0.06" stop-color="#fff" stop-opacity="0"/><stop offset="0.2" stop-color="#fff"/><stop offset="0.8" stop-color="#fff"/><stop offset="0.98" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<mask id="fade"><rect width="220" height="280" fill="url(#fadeV)"/></mask>' +
      '<radialGradient id="shine" cx="0.35" cy="0.35" r="0.6"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse cx="112" cy="268" rx="60" ry="5" fill="rgba(212,165,242,0.14)"/>' +
      '<g mask="url(#fade)">' +
      '<path id="g-body" fill="#D4A5F2"/>' +
      '<path id="g-shorts" fill="#6D35A2" clip-path="url(#shorts)"/>' +
      '<path id="g-band" fill="none" stroke="#D4A5F2" stroke-width="5" stroke-linecap="round"/>' +
      '<path id="g-fold" fill="none" stroke="#1B0820" stroke-width="3" stroke-linecap="round" opacity="0.5"/>' +
      '<ellipse id="g-shine" fill="url(#shine)"/></g>' +
      '<g id="g-spark" fill="#F7F0FA" opacity="0">' +
      '<path d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2Z" transform="translate(40 96)"/>' +
      '<path d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5Z" transform="translate(26 150)"/>' +
      '<path d="M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2Z" transform="translate(60 196)"/></g>';
    var body = $('#g-body', svg), shorts = $('#g-shorts', svg), band = $('#g-band', svg), fold = $('#g-fold', svg), shine = $('#g-shine', svg), spark = $('#g-spark', svg);
    var meters = $$('[data-meter]');
    var tag = $('#grow-tag');
    function draw(g) {
      var d = glutePath(g);
      body.setAttribute('d', d);
      shorts.setAttribute('d', d);
      band.setAttribute('d', 'M' + (86 - 2 * g) + ' 62 Q 110 70 136 62');
      fold.setAttribute('d', 'M' + (84 - 2 * g) + ' ' + (178 + 5 * g) + ' Q 92 ' + (184 + 5 * g) + ' 102 ' + (183 + 4 * g));
      shine.setAttribute('cx', String(76 - 14 * g));
      shine.setAttribute('cy', String(124 + 2 * g));
      shine.setAttribute('rx', String(18 + 8 * g));
      shine.setAttribute('ry', String(24 + 8 * g));
      spark.setAttribute('opacity', String(Math.max(0, (g - 0.8) * 5)));
      meters.forEach(function (m, k) {
        var v = Math.max(0, Math.min(1, g * 1.15 - k * 0.08));
        m.style.width = 12 + 86 * v + '%';
      });
      if (tag) tag.textContent = g < 0.5 ? 'Hoje' : 'Treinando certo';
    }
    if (reduce) { draw(1); return; }
    var visible = true, t0 = 0, raf = 0, lastPaint = 0;
    var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    function frame(now) {
      raf = 0;
      if (!visible) return;
      if (!t0) t0 = now;
      if (now - lastPaint < 32) { raf = requestAnimationFrame(frame); return; } // 30 quadros/s bastam
      lastPaint = now;
      var t = ((now - t0) / 1000) % 6.4; // ciclo de 6,4 s
      var g = t < 0.9 ? 0 : t < 4 ? ease((t - 0.9) / 3.1) : t < 5.8 ? 1 : 1 - ease((t - 5.8) / 0.6);
      draw(g);
      raf = requestAnimationFrame(frame);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(frame);
      }).observe(svg);
    }
    draw(0);
    raf = requestAnimationFrame(frame);
    void NS;
  }

  /* ═════════ 9. Carrossel de depoimentos (só com depoimentos reais em js/depoimentos.js) ═════════ */
  function initTestimonials() {
    var list = window.TC_DEPOIMENTOS || [];
    var sec = $('#depoimentos');
    if (!sec || !list.length) return;
    var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var star = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';
    var track = $('.car-track', sec);
    track.innerHTML = list.map(function (d) {
      var n = Math.max(0, Math.min(5, Number(d.estrelas) || 0));
      return (
        '<figure class="testi">' +
        (n ? '<div class="testi-stars" aria-label="' + n + ' de 5 estrelas">' + new Array(n + 1).join(star) + '</div>' : '') +
        (d.texto ? '<blockquote>“' + esc(d.texto) + '”</blockquote>' : '') +
        (d.foto ? '<img src="' + esc(d.foto) + '" alt="Depoimento de ' + esc(d.nome) + '" loading="lazy" decoding="async">' : '') +
        '<figcaption><span class="testi-avatar" aria-hidden="true">' + esc(String(d.nome || '?').charAt(0)) + '</span>' +
        '<span><b>' + esc(d.nome) + '</b>' + (d.detalhe ? '<small>' + esc(d.detalhe) + '</small>' : '') + '</span></figcaption>' +
        '</figure>'
      );
    }).join('');
    sec.hidden = false;
    var dotsBox = $('.car-dots', sec);
    var cards = $$('.testi', track);
    dotsBox.innerHTML = cards.map(function () { return '<i></i>'; }).join('');
    var dots = $$('i', dotsBox);
    var step = function () { return cards[0].getBoundingClientRect().width + 16; };
    $('.car-prev', sec).addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    $('.car-next', sec).addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    var ticking = false;
    track.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var k = Math.round(track.scrollLeft / step());
        dots.forEach(function (d, j) { d.classList.toggle('on', j === k); });
        ticking = false;
      });
    }, { passive: true });
    if (dots[0]) dots[0].classList.add('on');
    // avança sozinho a cada 5 s enquanto visível e sem interação
    var paused = reduce, visible = false;
    ['pointerdown', 'focusin', 'mouseenter'].forEach(function (ev) { track.addEventListener(ev, function () { paused = true; }); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(track);
    setInterval(function () {
      if (paused || !visible || document.hidden) return;
      var end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      track.scrollTo({ left: end ? 0 : track.scrollLeft + step(), behavior: 'smooth' });
    }, 5000);
  }

  /* ═════════ 10. Barra fixa do celular ═════════ */
  function initSticky() {
    var sticky = $('#sticky');
    var hero = $('#topo');
    var offerEl = $('#oferta');
    if (!sticky || !hero || !('IntersectionObserver' in window)) return;
    var heroIn = true, offerIn = false;
    new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (e.target === hero) heroIn = e.isIntersecting;
        if (e.target === offerEl) offerIn = e.isIntersecting;
      });
      var show = !heroIn && !offerIn;
      sticky.classList.toggle('show', show);
      sticky.setAttribute('aria-hidden', String(!show));
      if (show) sticky.removeAttribute('inert');
      else sticky.setAttribute('inert', '');
    }).observe(hero);
    if (offerEl) {
      // mesmo observador não é reaproveitável aqui sem referência; cria um segundo
      new IntersectionObserver(function (en) {
        offerIn = en[0].isIntersecting;
        var show = !heroIn && !offerIn;
        sticky.classList.toggle('show', show);
        sticky.setAttribute('aria-hidden', String(!show));
        if (show) sticky.removeAttribute('inert');
        else sticky.setAttribute('inert', '');
      }).observe(offerEl);
    }
  }

  /* ═════════ início ═════════ */
  function init() {
    fillOffer();
    tickClock();
    setInterval(tickClock, 1000);
    updateCheckoutLinks();
    if (couponApplied) showCouponApplied();
    initModal();
    initVsl();
    initPhone();
    initTestimonials();
    initGlute();
    initSticky();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
