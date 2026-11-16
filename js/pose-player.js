/*
 * Treino Certo — Tutorial animado (personagem em silhueta, quadro a quadro).
 * JavaScript puro, sem dependências. Usado pelo site (Next.js) e pela versão offline.
 *
 * Uso: <div data-pose='{"focus":[...],"props":[...],"frames":[...]}' data-name="Hip thrust"></div>
 *      window.TCPose.mount(elemento)     → player completo (play/pausa, quadros, câmera lenta, deslizar)
 *      data-thumb="1"                     → só a imagem estática (último quadro), para cards
 * Na versão offline (html[data-root]) monta tudo automaticamente.
 */
(function () {
  'use strict';
  if (window.TCPose) return;

  var L = { trunk: 50, neck: 7, head: 10, thigh: 44, shin: 42, foot: 13, upper: 29, fore: 27 };
  var C = {
    body: '#D4A5F2',
    far: 'rgba(212,165,242,0.42)',
    focus: '#6D35A2',
    focusFar: 'rgba(109,53,162,0.55)',
    prop: 'rgba(247,240,250,0.34)',
    propFill: 'rgba(247,240,250,0.06)',
    iron: '#EFE2F6',
    band: '#F7F0FA',
    floor: 'rgba(212,165,242,0.28)',
  };
  var SIDE = [
    [-0.1, 8, 10],
    [0.06, 11, 15],
    [0.4, 9, 8],
    [0.72, 12, 9],
    [1, 8, 8],
    [1.1, 4, 4],
  ];
  var FRONT = [
    [-0.06, 14, 14],
    [0.08, 16, 16],
    [0.42, 11, 11],
    [0.74, 14, 14],
    [1, 15, 15],
    [1.12, 5, 5],
  ];

  var rad = function (d) {
    return (d * Math.PI) / 180;
  };
  var pt = function (p, a, l) {
    return [p[0] + Math.cos(rad(a)) * l, p[1] + Math.sin(rad(a)) * l];
  };
  var f1 = function (n) {
    return Math.round(n * 10) / 10;
  };
  var lerp = function (a, b, t) {
    return a + (b - a) * t;
  };
  var ease = function (t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  };

  function lerpPose(a, b, t) {
    if (typeof a === 'number') return lerp(a, typeof b === 'number' ? b : a, t);
    if (Array.isArray(a))
      return a.map(function (v, i) {
        return lerpPose(v, b ? b[i] : v, t);
      });
    if (a && typeof a === 'object') {
      var o = {};
      for (var k in a) o[k] = b && k in b ? lerpPose(a[k], b[k], t) : a[k];
      return o;
    }
    return t < 0.5 ? a : b;
  }

  /* ---------- cinemática direta ---------- */
  function fk(p) {
    var front = p.view === 'front';
    var J = {};
    var t = p.trunk;
    var ts = p.ts == null ? 1 : p.ts;
    var hip = [0, 0];
    var sh = pt(hip, t, L.trunk * ts);
    J.hip = hip;
    J.sh = sh;
    J.head = pt(sh, t, L.neck + L.head);
    var ho = front ? 9 : 0;
    var so = front ? 15 : 0;
    J.hipN = pt(hip, t + 90, ho);
    J.hipF = pt(hip, t + 90, -ho);
    J.shN = pt(sh, t + 90, so);
    J.shF = pt(sh, t + 90, -so);
    var lsN = p.lsN || [1, 1];
    var lsF = p.lsF || [1, 1];
    var fs = front ? 0.5 : 1;
    J.kneeN = pt(J.hipN, p.ln[0], L.thigh * lsN[0]);
    J.ankleN = pt(J.kneeN, p.ln[1], L.shin * lsN[1]);
    J.toeN = pt(J.ankleN, p.ln[2], L.foot * fs);
    J.kneeF = pt(J.hipF, p.lf[0], L.thigh * lsF[0]);
    J.ankleF = pt(J.kneeF, p.lf[1], L.shin * lsF[1]);
    J.toeF = pt(J.ankleF, p.lf[2], L.foot * fs);
    J.elbowN = pt(J.shN, p.an[0], L.upper);
    J.handN = pt(J.elbowN, p.an[1], L.fore);
    J.elbowF = pt(J.shF, p.af[0], L.upper);
    J.handF = pt(J.elbowF, p.af[1], L.fore);
    var a = p.anchor || { j: 'hip', at: [120, 100] };
    var cur = J[a.j] || hip;
    var dx = a.at[0] - cur[0];
    var dy = a.at[1] - cur[1];
    for (var k in J) J[k] = [J[k][0] + dx, J[k][1] + dy];
    return J;
  }

  /* ---------- desenho ---------- */
  function smooth(pts) {
    // Catmull-Rom fechado → curvas de Bézier
    var n = pts.length;
    var d = 'M' + f1(pts[0][0]) + ' ' + f1(pts[0][1]);
    for (var i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n],
        p1 = pts[i],
        p2 = pts[(i + 1) % n],
        p3 = pts[(i + 2) % n];
      var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      var c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += 'C' + f1(c1[0]) + ' ' + f1(c1[1]) + ' ' + f1(c2[0]) + ' ' + f1(c2[1]) + ' ' + f1(p2[0]) + ' ' + f1(p2[1]);
    }
    return d + 'Z';
  }
  function line(a, b, w, color, extra) {
    return (
      '<line x1="' +
      f1(a[0]) +
      '" y1="' +
      f1(a[1]) +
      '" x2="' +
      f1(b[0]) +
      '" y2="' +
      f1(b[1]) +
      '" stroke="' +
      color +
      '" stroke-width="' +
      w +
      '" stroke-linecap="round"' +
      (extra || '') +
      '/>'
    );
  }
  function circle(c, r, fill, stroke, sw) {
    return (
      '<circle cx="' +
      f1(c[0]) +
      '" cy="' +
      f1(c[1]) +
      '" r="' +
      r +
      '" fill="' +
      fill +
      '"' +
      (stroke ? ' stroke="' + stroke + '" stroke-width="' + (sw || 2) + '"' : '') +
      '/>'
    );
  }
  function ellipse(c, rx, ry, rot, fill) {
    return (
      '<ellipse cx="' +
      f1(c[0]) +
      '" cy="' +
      f1(c[1]) +
      '" rx="' +
      f1(rx) +
      '" ry="' +
      f1(ry) +
      '" transform="rotate(' +
      f1(rot) +
      ' ' +
      f1(c[0]) +
      ' ' +
      f1(c[1]) +
      ')" fill="' +
      fill +
      '"/>'
    );
  }
  var ang = function (a, b) {
    return (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  };
  var mid = function (a, b, t) {
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  };

  function leg(J, s, color) {
    return (
      line(J['hip' + s], J['knee' + s], 14, color) +
      line(J['knee' + s], J['ankle' + s], 10.5, color) +
      line(J['ankle' + s], J['toe' + s], 6, color)
    );
  }
  function arm(J, s, color) {
    return (
      line(J['sh' + s], J['elbow' + s], 8.5, color) +
      line(J['elbow' + s], J['hand' + s], 7, color) +
      circle(J['hand' + s], 4, color)
    );
  }
  function torso(J, p) {
    var t = p.trunk;
    var len = L.trunk * (p.ts == null ? 1 : p.ts);
    var prof = p.view === 'front' ? FRONT : SIDE;
    var fr = [],
      bk = [];
    prof.forEach(function (r) {
      var c = pt(J.hip, t, len * r[0]);
      fr.push(pt(c, t + 90, r[1]));
      bk.push(pt(c, t - 90, r[2]));
    });
    return '<path d="' + smooth(fr.concat(bk.reverse())) + '" fill="' + C.body + '"/>';
  }
  function head(J, p) {
    var t = p.trunk;
    var s = circle(J.head, L.head, C.body);
    if (p.view === 'front') return s + circle(pt(J.head, t, 10), 5, C.body);
    var a = pt(pt(J.head, t - 90, 7), t, 4);
    var b = pt(pt(J.head, t - 90, 15), t, -2);
    var c = pt(pt(J.head, t - 90, 17), t, -9);
    return (
      s +
      '<path d="M' +
      f1(a[0]) +
      ' ' +
      f1(a[1]) +
      'Q' +
      f1(b[0]) +
      ' ' +
      f1(b[1]) +
      ' ' +
      f1(c[0]) +
      ' ' +
      f1(c[1]) +
      '" stroke="' +
      C.body +
      '" stroke-width="5.5" fill="none" stroke-linecap="round"/>'
    );
  }

  function focusShapes(J, p, focus) {
    var out = '';
    var t = p.trunk;
    var front = p.view === 'front';
    (focus || []).forEach(function (f) {
      if (f === 'glute' && !front) {
        out += ellipse(pt(pt(J.hip, t - 90, 7.5), t, 2), 9, 7.5, t, C.focus);
      } else if (f === 'abd' && front) {
        out += ellipse(pt(pt(J.hip, t + 90, 15), t, 7), 4.5, 8, t, C.focus);
        out += ellipse(pt(pt(J.hip, t - 90, 15), t, 7), 4.5, 8, t, C.focus);
      } else if (f === 'quad' || f === 'ham' || f === 'add') {
        ['N', 'F'].forEach(function (s) {
          if (!front && s === 'F') return;
          var h = J['hip' + s],
            k = J['knee' + s];
          var a = ang(h, k);
          var len = Math.hypot(k[0] - h[0], k[1] - h[1]);
          var off = 0;
          if (!front) off = f === 'quad' ? -3 : 3;
          else if (f === 'add') off = s === 'N' ? 3 : -3;
          var c = pt(mid(h, k, 0.55), a + 90, off);
          var ry = front && f === 'quad' ? 4.5 : 3.6;
          out += ellipse(c, Math.max(4, len * 0.36), ry, a, C.focus);
        });
      }
    });
    return out;
  }

  function P(v, J) {
    if (typeof v === 'string') return J[v];
    if (Array.isArray(v)) return v;
    if (v && v.seg) {
      var a = J[v.seg[0]],
        b = J[v.seg[1]];
      return pt(mid(a, b, v.t), ang(a, b) + 90, v.off || 0);
    }
    if (v && v.j) {
      var c = J[v.j];
      return [c[0] + (v.dx || 0), c[1] + (v.dy || 0)];
    }
    return [0, 0];
  }
  function prop(pr, J) {
    switch (pr.k) {
      case 'rect':
        return (
          '<rect x="' +
          pr.x +
          '" y="' +
          pr.y +
          '" width="' +
          pr.w +
          '" height="' +
          pr.h +
          '" rx="' +
          (pr.r || 1) +
          '" fill="' +
          C.propFill +
          '" stroke="' +
          C.prop +
          '" stroke-width="2"/>'
        );
      case 'line':
        return pr.band
          ? line(P(pr.a, J), P(pr.b, J), 3, C.band, ' opacity="0.9"')
          : line(P(pr.a, J), P(pr.b, J), pr.w || 3, C.prop);
      case 'circle':
        return circle(P(pr.c, J), pr.r, C.propFill, C.prop, 2);
      case 'bar': {
        var c = P(pr.c, J);
        var h = (pr.len || 30) / 2;
        return line(pt(c, pr.ang, -h), pt(c, pr.ang, h), pr.w || 5, C.prop);
      }
      case 'db': {
        var d = P(pr.c, J);
        var a = pr.ang || 0;
        return (
          line(pt(d, a, -8), pt(d, a, 8), 3, C.iron) +
          line(pt(d, a, -8), pt(d, a, -4), 9, C.iron, ' stroke-linecap="butt"') +
          line(pt(d, a, 4), pt(d, a, 8), 9, C.iron, ' stroke-linecap="butt"')
        );
      }
      case 'plate': {
        var q = P(pr.c, J);
        return circle(q, pr.r || 15, 'rgba(239,226,246,0.12)', C.iron, 2.5) + circle(q, 3, C.iron);
      }
      case 'loop':
        return circle(P(pr.c, J), pr.r || 7, 'none', C.band, 2.5);
    }
    return '';
  }

  /* Zoom vai no próprio <g class="pose-g"> (não num <g> aninhado), para o desenho ser uma lista simples de formas */
  function zoomAttr(anim) {
    var z = anim.zoom || 1;
    return z === 1 ? '' : 'translate(120 190) scale(' + z + ') translate(-120 -190)';
  }
  function drawPose(anim, p) {
    var z = zoomAttr(anim);
    return z ? '<g transform="' + z + '">' + drawInner(anim, p) + '</g>' : drawInner(anim, p);
  }
  function drawInner(anim, p) {
    var J = fk(p);
    var front = p.view === 'front';
    var props = anim.props || [];
    var back = '',
      fore = '';
    props.forEach(function (pr) {
      if (pr.front) fore += prop(pr, J);
      else back += prop(pr, J);
    });
    var farColor = front ? C.body : C.far;
    var s = '<line x1="0" y1="190" x2="240" y2="190" stroke="' + C.floor + '" stroke-width="2"/>';
    s += back;
    s += leg(J, 'F', farColor) + arm(J, 'F', farColor);
    if (!front) s += focusShapesFar(J, p, anim.focus);
    s += torso(J, p) + head(J, p);
    s += leg(J, 'N', C.body);
    s += focusShapes(J, p, anim.focus);
    s += arm(J, 'N', C.body);
    s += fore;
    return s;
  }

  /*
   * Atualiza o desenho SEM recriar elementos: lê a lista de formas gerada (todas são tags simples "<tag ... />")
   * e só troca os atributos que mudaram. Recriar o SVG inteiro a cada quadro era o que mais pesava no celular.
   */
  var TAG_RE = /<(\w+)((?:\s+[\w:-]+="[^"]*")*)\s*\/>/g;
  var ATTR_RE = /([\w:-]+)="([^"]*)"/g;
  function parseShapes(markup) {
    var list = [], m, a;
    TAG_RE.lastIndex = 0;
    while ((m = TAG_RE.exec(markup))) {
      var attrs = {};
      ATTR_RE.lastIndex = 0;
      while ((a = ATTR_RE.exec(m[2]))) attrs[a[1]] = a[2];
      list.push({ t: m[1], a: attrs });
    }
    return list;
  }
  function patch(g, markup) {
    var shapes = parseShapes(markup);
    var kids = g.children;
    var same = kids.length === shapes.length;
    for (var i = 0; same && i < shapes.length; i++) if (kids[i].tagName !== shapes[i].t) same = false;
    if (!same) {
      g.innerHTML = markup;
      return;
    }
    for (var k = 0; k < shapes.length; k++) {
      var el = kids[k], at = shapes[k].a;
      for (var name in at) if (el.getAttribute(name) !== at[name]) el.setAttribute(name, at[name]);
    }
  }
  function focusShapesFar(J, p, focus) {
    // destaque suave na perna de trás (vista de perfil)
    var out = '';
    (focus || []).forEach(function (f) {
      if (f !== 'quad' && f !== 'ham') return;
      var h = J.hipF,
        k = J.kneeF;
      var a = ang(h, k);
      var len = Math.hypot(k[0] - h[0], k[1] - h[1]);
      out += ellipse(pt(mid(h, k, 0.55), a + 90, f === 'quad' ? -3 : 3), Math.max(4, len * 0.36), 3.4, a, C.focusFar);
    });
    return out;
  }

  function svg(anim, pose, label) {
    return (
      '<svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' +
      (label || 'Demonstração do exercício') +
      '">' +
      '<g class="pose-g"' +
      (zoomAttr(anim) ? ' transform="' + zoomAttr(anim) + '"' : '') +
      '>' +
      drawInner(anim, pose) +
      '</g></svg>'
    );
  }

  /* ---------- ícones ---------- */
  var ICON = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>',
    pause:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  var escAttr = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };

  /* ---------- player ---------- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mount(el) {
    if (!el || el.__tcpose) return;
    var anim;
    try {
      anim = JSON.parse(el.getAttribute('data-pose'));
    } catch (e) {
      return;
    }
    if (!anim || !anim.frames || !anim.frames.length) return;
    var name = el.getAttribute('data-name') || 'exercício';
    var frames = anim.frames;
    var n = frames.length;

    if (el.hasAttribute('data-thumb')) {
      el.innerHTML = svg(anim, frames[n - 1].pose, 'Ilustração: ' + escAttr(name));
      el.__tcpose = { stop: function () {} };
      return;
    }

    var chips = frames
      .map(function (f, i) {
        return (
          '<button type="button" class="pose-chip" data-frame="' +
          i +
          '" aria-pressed="false">' +
          (i + 1) +
          '. ' +
          escAttr(f.label) +
          '</button>'
        );
      })
      .join('');
    el.innerHTML =
      '<div class="pose-player">' +
      '<div class="pose-stage" tabindex="0" aria-label="Demonstração animada: ' +
      escAttr(name) +
      '. Toque para pausar; deslize para trocar o quadro.">' +
      svg(anim, frames[0].pose, 'Demonstração: ' + escAttr(name)) +
      '<span class="pose-badge" aria-hidden="true"></span></div>' +
      '<div class="pose-bar">' +
      '<button type="button" class="pose-btn" data-act="prev" aria-label="Quadro anterior">' +
      ICON.prev +
      '</button>' +
      '<button type="button" class="pose-btn pose-main" data-act="play" aria-label="Pausar">' +
      ICON.pause +
      '</button>' +
      '<button type="button" class="pose-btn" data-act="next" aria-label="Próximo quadro">' +
      ICON.next +
      '</button>' +
      '<button type="button" class="pose-speed" data-act="speed" aria-pressed="false" title="Câmera lenta">0,5×</button>' +
      '</div>' +
      '<div class="pose-frames" role="group" aria-label="Quadros do movimento">' +
      chips +
      '</div>' +
      '<p class="pose-cue"></p>' +
      '<p class="pose-legend"><i aria-hidden="true"></i>Músculo-alvo em destaque</p>' +
      '</div>';

    if (el.hasAttribute('data-bare')) el.firstChild.classList.add('pose-bare'); // só a animação, sem controles
    var g = el.querySelector('.pose-g');
    var badge = el.querySelector('.pose-badge');
    var cue = el.querySelector('.pose-cue');
    var playBtn = el.querySelector('[data-act="play"]');
    var speedBtn = el.querySelector('[data-act="speed"]');
    var stage = el.querySelector('.pose-stage');

    // sequência ida e volta: 0,1,..,n-1,..,1
    var seq = [];
    for (var i = 0; i < n; i++) seq.push(i);
    for (var j = n - 2; j > 0; j--) seq.push(j);
    var HOLD = 650,
      MOVE = 950;
    var slow = false;
    var playing = !reduce;
    var visible = true;
    var clock = 0,
      last = 0,
      raf = 0,
      lastPaint = 0;
    var shown = -1;
    var manual = null; // {from, to, t0}
    var current = 0;

    function setFrameUI(i) {
      if (i === shown) return;
      shown = i;
      badge.textContent = 'Quadro ' + (i + 1) + '/' + n + ' · ' + frames[i].label;
      cue.textContent = frames[i].cue;
      el.querySelectorAll('.pose-chip').forEach(function (c) {
        c.setAttribute('aria-pressed', String(Number(c.getAttribute('data-frame')) === i));
      });
    }
    function paint(pose) {
      patch(g, drawInner(anim, pose));
    }

    function tick(now) {
      raf = 0;
      if (!el.isConnected) return;
      // 30 quadros por segundo bastam para a silhueta e aliviam muito o celular
      if (lastPaint && now - lastPaint < 32 && !manual) {
        schedule();
        return;
      }
      lastPaint = now;
      var dt = last ? now - last : 0;
      last = now;
      if (manual) {
        var k = Math.min(1, (now - manual.t0) / 420);
        paint(lerpPose(frames[manual.from].pose, frames[manual.to].pose, ease(k)));
        if (k >= 1) manual = null;
        else schedule();
        return;
      }
      if (playing && visible) {
        clock += dt * (slow ? 0.5 : 1);
        var cyc = HOLD + MOVE;
        var total = seq.length * cyc;
        var tt = clock % total;
        var idx = Math.floor(tt / cyc);
        var local = tt - idx * cyc;
        var a = seq[idx],
          b = seq[(idx + 1) % seq.length];
        if (local < HOLD) {
          paint(frames[a].pose);
          setFrameUI(a);
          current = a;
        } else {
          var p = ease((local - HOLD) / MOVE);
          paint(lerpPose(frames[a].pose, frames[b].pose, p));
          if (p > 0.5) {
            setFrameUI(b);
            current = b;
          }
        }
        schedule();
      }
    }
    function schedule() {
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function setPlaying(v) {
      playing = v;
      playBtn.innerHTML = v ? ICON.pause : ICON.play;
      playBtn.setAttribute('aria-label', v ? 'Pausar' : 'Reproduzir');
      cue.setAttribute('aria-live', v ? 'off' : 'polite');
      if (v) {
        // retoma a partir do quadro atual
        var idx = seq.indexOf(current);
        clock = idx * (HOLD + MOVE);
        last = 0;
        schedule();
      }
    }
    function goTo(i) {
      i = (i + n) % n;
      setPlaying(false);
      manual = { from: current, to: i, t0: performance.now() };
      current = i;
      setFrameUI(i);
      last = 0;
      schedule();
    }

    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act],[data-frame]');
      if (!b) return;
      if (b.hasAttribute('data-frame')) return goTo(Number(b.getAttribute('data-frame')));
      var act = b.getAttribute('data-act');
      if (act === 'play') setPlaying(!playing);
      if (act === 'prev') goTo(current - 1);
      if (act === 'next') goTo(current + 1);
      if (act === 'speed') {
        slow = !slow;
        b.setAttribute('aria-pressed', String(slow));
      }
    });
    // toque no palco pausa/retoma; deslizar troca o quadro
    var sx = null,
      sy = null;
    stage.addEventListener('pointerdown', function (e) {
      sx = e.clientX;
      sy = e.clientY;
    });
    stage.addEventListener('pointerup', function (e) {
      if (sx == null) return;
      var dx = e.clientX - sx,
        dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) goTo(current + (dx < 0 ? 1 : -1));
      else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) setPlaying(!playing);
    });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goTo(current + 1);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goTo(current - 1);
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setPlaying(!playing);
      }
    });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) {
          last = 0;
          schedule();
        }
      });
      io.observe(el);
    }

    setFrameUI(0);
    setPlaying(playing);
    if (!playing) paint(frames[0].pose);
    el.__tcpose = {
      stop: function () {
        playing = false;
        if (raf) cancelAnimationFrame(raf);
        if (io) io.disconnect();
      },
    };
  }

  function unmount(el) {
    if (el && el.__tcpose) {
      el.__tcpose.stop();
      el.__tcpose = null;
      el.innerHTML = '';
    }
  }
  function mountAll(root) {
    (root || document).querySelectorAll('[data-pose]').forEach(mount);
  }

  window.TCPose = {
    mount: mount,
    unmount: unmount,
    mountAll: mountAll,
    svg: svg,
    drawPose: drawPose,
    lerpPose: lerpPose,
  };

  // Versão offline: monta automaticamente
  if (document.documentElement.hasAttribute('data-root')) {
    if (document.readyState === 'loading')
      document.addEventListener('DOMContentLoaded', function () {
        mountAll();
      });
    else mountAll();
  }
})();
