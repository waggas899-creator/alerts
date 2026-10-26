/* Shared alert renderer + player. Used by the control panel (edit mode) and the overlays (show mode). */
(function () {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Math.round(n || 0).toLocaleString('en-US');
  const BASE = { boards: { w: 760 }, gift: { w: 640, h: 640 }, tap: { w: 640, h: 620 }, vip: { w: 1000, h: 700 }, honor: { w: 600, h: 760 } };
  const ALERTS = [
    { id: 'boards', name: 'ملوك الدعم وجيش التكبيس', ic: 'military_tech', kind: 'board' },
    { id: 'gift', name: 'أليرت الهدايا', ic: 'redeem', kind: 'pop' },
    { id: 'tap', name: 'أليرت التكبيس', ic: 'touch_app', kind: 'pop' },
    { id: 'vip', name: 'الدخول المميز', ic: 'meeting_room', kind: 'pop' },
    { id: 'honor', name: 'درع التكريم', ic: 'shield', kind: 'pop' }];
  const A = id => ALERTS.find(a => a.id === id);
  const FRAMES = [['royal', 'ملكي'], ['rosette', 'نجمة عربية'], ['sun', 'شمس'], ['gear', 'ترس'], ['laurel', 'غار'], ['electric', 'صاعقة'], ['pearl', 'لؤلؤ'], ['hex', 'سداسي']];
  const VSTYLES = [['sweep', 'ذهبي دوّار', 'autorenew'], ['orn', 'زخرفة معدنية', 'star'], ['double', 'إطار مزدوج', 'crop_square']];
  const SHAPES = [['shield', 'درع', 'shield'], ['medal', 'وسام', 'military_tech']];
  let uid = 0;

  /* ---------- frames ---------- */
  function hue(n) { let h = 0; for (const c of String(n || '?')) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }
  function star(cx, cy, R, r, n) { const p = []; for (let i = 0; i < n * 2; i++) { const a = Math.PI * i / n - Math.PI / 2, q = i % 2 ? r : R; p.push((cx + q * Math.cos(a)).toFixed(1) + ',' + (cy + q * Math.sin(a)).toFixed(1)); } return p.join(' '); }
  function poly(cx, cy, n, rs, off = 0) { const p = []; for (let i = 0; i < n; i++) { const a = (i * 360 / n + off - 90) * Math.PI / 180, r = rs[i % rs.length]; p.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); } return p.join(' '); }
  function around(n, fn, off = 0) { let s = ''; for (let i = 0; i < n; i++) s += `<g transform="rotate(${(i * 360 / n + off).toFixed(2)} 100 100)">${fn(i)}</g>`; return s; }
  const ICON = {
    crown: `<path d="M10 64 6 22 30 42 50 10 70 42 94 22 90 64Z"/><rect x="9" y="58" width="82" height="12" rx="4"/><circle cx="6" cy="20" r="6"/><circle cx="50" cy="9" r="7"/><circle cx="94" cy="20" r="6"/><circle class="gem" cx="50" cy="46" r="6"/>`,
    bolt: `<path d="M60 0 24 40h24l-9 32 38-44H55z"/>`,
    storm: `<rect x="6" y="2" width="88" height="12" rx="6"/><rect x="20" y="20" width="66" height="12" rx="6"/><rect x="32" y="38" width="46" height="12" rx="6"/><rect x="42" y="56" width="24" height="12" rx="6"/>`,
    blast: `<polygon points="${star(50, 36, 36, 16, 10)}"/><circle class="gem" cx="50" cy="36" r="9"/>`
  };
  function frameSVG(f, icon) {
    const u = ++uid, g = `url(#mg${u})`;
    const ring = (r, w, ex = '') => `<circle cx="100" cy="100" r="${r}" fill="none" stroke="${g}" stroke-width="${w}" ${ex}/>`;
    const edge = `<circle cx="100" cy="100" r="59.5" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="1.5"/>`;
    const base = ring(65, 11) + edge;
    let b = '';
    if (f === 'rosette') b = `<g class="sp"><rect x="32" y="32" width="136" height="136" fill="none" stroke="${g}" stroke-width="5"/><rect x="32" y="32" width="136" height="136" fill="none" stroke="${g}" stroke-width="5" transform="rotate(45 100 100)"/>${around(8, () => `<circle cx="100" cy="4" r="5" fill="${g}"/>`, 22.5)}</g><g class="sp r">${around(16, () => `<rect x="98" y="24" width="4" height="9" rx="2" fill="${g}"/>`)}</g>` + base;
    else if (f === 'sun') b = `<g class="sp">${around(32, i => `<path d="M100 ${i % 2 ? 16 : 3} L104.5 31 L95.5 31Z" fill="${g}"/>`)}</g>` + ring(74, 2.5) + base;
    else if (f === 'gear') b = `<g class="sp">${around(18, () => `<rect x="93" y="7" width="14" height="17" rx="3" fill="${g}" stroke="rgba(0,0,0,.3)" stroke-width="1"/>`)}${ring(80, 11)}${around(18, () => `<circle cx="100" cy="20" r="2.2" fill="rgba(0,0,0,.4)"/>`, 10)}</g>` + base;
    else if (f === 'laurel') {
      const leaf = t => `<ellipse cx="100" cy="15" rx="5.5" ry="12.5" transform="rotate(${t} 100 15)" fill="${g}" stroke="rgba(0,0,0,.3)" stroke-width="1"/>`;
      let L = ''; for (let i = 0; i < 9; i++) L += `<g transform="rotate(${200 + i * 17} 100 100)">${leaf(-38)}</g><g transform="rotate(${160 - i * 17} 100 100)">${leaf(38)}</g>`;
      b = `<g class="pl">${L}<path d="M86 190 L100 178 L114 190 L106 196 L100 188 L94 196Z" fill="${g}"/></g>` + base;
    }
    else if (f === 'electric') b = `<g class="sp fast"><polygon points="${poly(100, 100, 36, [80, 96])}" fill="none" stroke="${g}" stroke-width="4.5" stroke-linejoin="round"/></g><g class="sp r"><polygon points="${poly(100, 100, 24, [74, 86], 7)}" fill="none" stroke="${g}" stroke-width="2.5" opacity=".75"/></g>` + base;
    else if (f === 'pearl') b = `<g class="sp">${around(20, () => `<circle cx="100" cy="21" r="7.5" fill="url(#pp${u})"/>`)}</g>` + ring(93, 2, 'stroke-dasharray="3 5"') + ring(65, 8) + edge;
    else if (f === 'hex') b = `<g class="sp"><polygon points="${poly(100, 100, 6, [96])}" fill="none" stroke="${g}" stroke-width="5" stroke-linejoin="round"/></g><g class="sp r"><polygon points="${poly(100, 100, 6, [96], 30)}" fill="none" stroke="${g}" stroke-width="5" stroke-linejoin="round"/>${around(6, () => `<circle cx="100" cy="4" r="5" fill="${g}"/>`, 30)}</g>` + base;
    else b = `<g class="sp">${around(24, () => `<circle cx="100" cy="22" r="4.4" fill="${g}"/>`)}</g><g class="sp r">${around(8, () => `<path d="M100 1 L107 11 L100 19 L93 11Z" fill="${g}" stroke="rgba(0,0,0,.35)" stroke-width="1"/>`, 7.5)}</g>` + base;
    const ic = icon ? `<g transform="translate(62 -50) scale(.76)"><g class="bob">${ICON[icon].replace(/<(path|rect|circle|polygon)(?![^>]*class="gem")/g, `<$1 fill="${g}" stroke="rgba(0,0,0,.4)" stroke-width="2.5" stroke-linejoin="round"`).replace(/class="gem"/g, 'fill="#fff" opacity=".9"')}</g></g>` : '';
    return `<svg class="fr-svg" viewBox="0 0 200 200" aria-hidden="true"><defs>
 <linearGradient id="mg${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb,var(--m) 50%,#000)"/><stop offset=".22" style="stop-color:color-mix(in srgb,var(--m) 30%,#fff)"/><stop offset=".42" style="stop-color:var(--m)"/><stop offset=".58" style="stop-color:color-mix(in srgb,var(--m) 55%,#000)"/><stop offset=".78" style="stop-color:color-mix(in srgb,var(--m) 25%,#fff)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--m) 50%,#000)"/><animateTransform attributeName="gradientTransform" type="rotate" from="0 .5 .5" to="360 .5 .5" dur="7s" repeatCount="indefinite"/></linearGradient>
 <radialGradient id="pp${u}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".5" style="stop-color:color-mix(in srgb,var(--m) 25%,#fff)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--m) 60%,#000)"/></radialGradient></defs>${b}${ic}</svg>`;
  }
  function avatar(name, pic) {
    if (!name) return `<div class="av empty">؟</div>`;
    return `<div class="av" style="--h:${hue(name)}">${esc([...name][0])}${pic ? `<img src="${esc(pic)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}</div>`;
  }
  const frame = (f, name, pic, icon) => `<div class="fr">${avatar(name, pic)}${frameSVG(f, icon)}</div>`;
  const txt = c => { const t = c.text || { color: '#ffffff', fx: 'none' }; return { cls: 'fx-' + (t.fx || 'none'), st: `--tc:${t.color || '#ffffff'}` }; };

  /* ---------- state ---------- */
  let S = null, B = { gifters: [], tappers: [] }, activeB = 'gifters', rotT = null, rotKey = '';
  let stage = null, opts = { edit: false, only: null }, orient = 'v', sel = null;
  const Q = { gift: [], tap: [], vip: [], honor: [] }, playing = {}, timers = {};
  const wEl = id => stage && stage.querySelector(`.w[data-id="${id}"]`);

  /* ---------- boards ---------- */
  const ICONS = { gifters: ['crown', 'crown', 'crown'], tappers: ['bolt', 'storm', 'blast'] };
  const DEFP = () => ({ title: { s: 100, o: 100, fx: 'inherit' }, panel: { w: 100, h: 100, o: 100, fx: 'sweep' }, avatar: { s: 100, o: 100, fx: 'spin' }, rank: { s: 100, o: 100, fx: 'inherit' }, name: { s: 100, o: 100, fx: 'inherit' }, points: { s: 100, o: 100, fx: 'inherit' }, deco: { o: 100, show: true } });
  const tp = (shape, ov) => { const p = DEFP(); for (const k in ov || {}) Object.assign(p[k], ov[k]); return { shape, parts: p }; };
  const TEMPLATES = {
    plaques: [
      { id: 'royal', name: 'ملكي مثمّن', ic: 'hexagon', ...tp('octa') },
      { id: 'arch', name: 'قوس فخم', ic: 'door_front', ...tp('arch', { panel: { fx: 'both' }, avatar: { fx: 'glow' } }) },
      { id: 'round', name: 'لوح دائري', ic: 'rounded_corner', ...tp('round', { panel: { fx: 'glow' } }) },
      { id: 'step', name: 'زوايا مدرّجة', ic: 'crop_free', ...tp('step') },
      { id: 'glass', name: 'زجاجي شفاف', ic: 'blur_on', ...tp('glass', { panel: { o: 80, fx: 'glow' }, avatar: { fx: 'glow' } }) },
      { id: 'compact', name: 'مختصر', ic: 'compress', ...tp('octa', { panel: { h: 75 }, avatar: { s: 82 }, name: { s: 88 }, points: { s: 88 }, title: { s: 88 } }) }
    ],
    rows: [
      { id: 'pill', name: 'شريط لامع', ic: 'view_agenda', ...tp('pill') },
      { id: 'skew', name: 'شريط مائل', ic: 'texture', ...tp('skew', { panel: { fx: 'both' } }) },
      { id: 'glass', name: 'كبسولة زجاجية', ic: 'blur_on', ...tp('glass', { panel: { o: 80, fx: 'glow' }, avatar: { fx: 'glow' } }) },
      { id: 'card', name: 'بطاقة مزدوجة', ic: 'crop_16_9', ...tp('card', { panel: { fx: 'none' } }) },
      { id: 'slim', name: 'رفيع بصورة كبيرة', ic: 'horizontal_rule', ...tp('slim', { panel: { h: 75 }, avatar: { s: 125 }, name: { s: 90 } }) }
    ]
  };
  function boardParts(C) { const p = DEFP(), src = C.parts || {}; for (const k in p) Object.assign(p[k], src[k] || {}); return p; }
  function renderBoards() {
    const C = S.cfg.boards, t = txt(C), P = boardParts(C);
    const style = C.style === 'rows' ? 'rows' : 'plaques';
    const shape = style === 'rows' ? (C.rowShape || 'pill') : (C.plaqueShape || 'octa');
    const pf = k => (P[k].fx && P[k].fx !== 'inherit') ? ' fx-' + P[k].fx : '';
    const v = (n) => n / 100;
    const vars = `--title-s:${v(P.title.s)};--title-o:${v(P.title.o)};--panel-w:${v(P.panel.w)};--panel-h:${v(P.panel.h)};--panel-o:${v(P.panel.o)};--av-s:${v(P.avatar.s)};--av-o:${v(P.avatar.o)};--rank-s:${v(P.rank.s)};--rank-o:${v(P.rank.o)};--name-s:${v(P.name.s)};--name-o:${v(P.name.o)};--pts-s:${v(P.points.s)};--pts-o:${v(P.points.o)};--deco-o:${v(P.deco.o)}`;
    const cls = `bwrap st-${style} sh-${shape} pfx-${P.panel.fx} afx-${P.avatar.fx}${P.deco.show ? '' : ' no-deco'} ${t.cls}`;
    return `<div class="${cls}" style="--wf:'${esc(C.font)}';${t.st};--m:${C.gifters.metal};${vars}"><div class="bstack">` + ['gifters', 'tappers'].map(b => {
      const c = C[b], d = B[b] || [], unit = b === 'gifters' ? 'نقطة' : 'تكبيسة';
      const metals = [c.metal, c.metal2 || c.metal, c.metal3 || c.metal];
      return `<div class="board k-${b}${activeB === b ? ' on' : ''}" data-b="${b}" style="--l:${c.lead};--b:${c.base};--m:${c.metal}"><div class="b-title"><span class="tx${pf('title')}">${esc(c.title)}</span></div>` +
        [0, 1, 2].map(i => {
          const u = d[i], fr = frame(c.frame, u && u.name, u && u.pic, ICONS[b][i]);
          const name = `<div class="b-name tx${pf('name')}">${u ? esc(u.name) : 'بانتظار البطل'}</div>`;
          const pts = `<div class="b-pts"><b class="tx${pf('points')}">${u ? fmt(u.v) : 0}</b><small class="tx${pf('points')}">${unit}</small></div>`;
          const rank = `<div class="b-rank"><span class="tx${pf('rank')}">${esc(c.labels[i])}</span></div>`;
          const chain = style === 'plaques' && i > 0 ? `<div class="chains" style="--m:${metals[i - 1]}"><i></i><i></i></div>` : '';
          if (style === 'plaques') return `${chain}<div class="b-row pq r${i + 1}" data-u="${u ? esc(u.id + '|' + u.name + '|' + (u.pic || '')) : ''}" style="--m:${metals[i]}">
   <div class="pq-bg"><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i></div><i class="gem gl"></i><i class="gem gr"></i><i class="gem gb"></i>
   ${rank}<div class="pq-av">${fr}</div>${name}${pts}</div>`;
          return `<div class="b-row rw r${i + 1}" data-u="${u ? esc(u.id + '|' + u.name + '|' + (u.pic || '')) : ''}" style="--m:${metals[i]}"><i class="rbg"></i>${fr}
   <div class="b-info">${rank}${name}</div>${pts}</div>`;
        }).join('') + `</div>`;
    }).join('') + `</div></div>`;
  }
  function updateBoards() {
    const el = wEl('boards'); if (!el || !S) return;
    for (const b of ['gifters', 'tappers']) {
      const bd = el.querySelector(`.board[data-b="${b}"]`); if (!bd) continue;
      const d = B[b] || [], c = S.cfg.boards[b];
      bd.querySelectorAll('.b-row').forEach((row, i) => {
        const u = d[i];
        const id = u ? u.id + '|' + u.name + '|' + (u.pic || '') : '';
        if (row.dataset.u !== id) {
          row.dataset.u = id;
          row.querySelector('.fr').outerHTML = frame(c.frame, u && u.name, u && u.pic, ICONS[b][i]);
          row.querySelector('.b-name').textContent = u ? u.name : 'بانتظار البطل';
          if (u) { row.classList.remove('swap'); void row.offsetWidth; row.classList.add('swap'); setTimeout(() => row.classList.remove('swap'), 850); }
        } else if (u) row.querySelector('.b-name').textContent = u.name;
        const p = row.querySelector('.b-pts b'), t = u ? fmt(u.v) : '0';
        if (p.textContent !== t) { p.textContent = t; if (u) { p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); } }
      });
    }
  }
  function showB(b) { activeB = b; if (stage) stage.querySelectorAll('.w[data-id="boards"] .board').forEach(el => el.classList.toggle('on', el.dataset.b === b)); }
  function setRot(force) {
    const c = S.cfg.boards, key = c.pin + ':' + c.interval;
    if (!force && key === rotKey) return;
    rotKey = key; clearInterval(rotT);
    if (c.pin !== 'auto') { showB(c.pin); return; }
    rotT = setInterval(() => showB(activeB === 'gifters' ? 'tappers' : 'gifters'), Math.max(3, c.interval || 15) * 1000);
  }

  /* ---------- pops ---------- */
  function parts(n, col) { let h = ''; for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, r = 220 + Math.random() * 200; h += `<i class="pt" style="--pc:${i % 3 ? col : '#fff'};--dx:${(Math.cos(a) * r).toFixed(0)}px;--dy:${(Math.sin(a) * r).toFixed(0)}px;--d:${(.25 + Math.random() * .3).toFixed(2)}s"></i>`; } return h; }
  const SH_OUT = 'M300 18C390 58 480 70 566 72C570 380 500 590 300 742C100 590 30 380 34 72C120 70 210 58 300 18Z';
  const SH_IN = 'M300 54C382 88 462 100 532 104C532 372 472 556 300 696C128 556 68 372 68 104C138 100 218 88 300 54Z';
  const vidTf = m => `transform:translate(${m.ox || 0}%,${m.oy || 0}%) scale(${(m.zoom || 100) / 100})`;
  function vipDeco(st) {
    if (st === 'orn') {
      const ro = `<svg viewBox="0 0 100 100"><g style="transform-origin:50px 50px;animation:rot 12s linear infinite"><polygon points="${star(50, 50, 48, 22, 8)}" style="fill:var(--m)" stroke="rgba(0,0,0,.4)" stroke-width="2"/></g><circle cx="50" cy="50" r="14" style="fill:color-mix(in srgb,var(--m) 30%,#fff)" stroke="rgba(0,0,0,.4)" stroke-width="2"/></svg>`;
      return [[-28, -28], [932, -28], [-28, 512], [932, 512]].map(([x, y]) => `<div class="v-ro" style="left:${x}px;top:${y}px">${ro}</div>`).join('');
    }
    if (st === 'double') return [[5, 5], [485, 5], [965, 5], [5, 275], [965, 275], [5, 545], [485, 545], [965, 545]].map(([x, y]) => `<i class="v-dm" style="left:${x}px;top:${y}px"></i>`).join('');
    return `<i class="v-cn a"></i><i class="v-cn b"></i><i class="v-cn c"></i><i class="v-cn d"></i>`;
  }
  function vipMember(d) {
    const ms = S.cfg.vip.members || [];
    return ms.find(m => (m.user || '').toLowerCase() === String(d.user || '').toLowerCase()) || { name: d.name || 'عضو مميز', user: d.user || '', zoom: 100, ox: 0, oy: 0 };
  }
  function renderPop(id, d, live) {
    const c = S.cfg[id], t = txt(c), L = live ? ' live' : '';
    const st = `style="--m:${c.metal};--g:${c.glow};--wf:'${esc(c.font)}';--sp:${Math.max(.3, (c.speed || 100) / 100)};${t.st}"`;
    const cls = `pop ${t.cls}${L}${live ? ' in-' + (c.anim || 'flip3d') : ''}`;
    if (id === 'gift') return `<div class="${cls} gpop" ${st}><div class="g-rays"></div><div class="g-card">
  <div class="g-3d">${frame(c.frame, d.name, d.pic)}</div>
  <div class="g-name tx">${esc(d.name)}</div><div class="g-msg glossy"><span class="tx">${esc(c.prefix)} <b>${esc(d.gift)}</b>${d.count > 1 ? ` ×${d.count}` : ''}</span>${d.giftPic ? `<img src="${esc(d.giftPic)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}</div></div>${live ? parts(22, c.metal) : ''}</div>`;
    if (id === 'tap') {
      const step = Math.max(1, c.step || 200), cur = Math.max(1, Math.round(d.total / step)); let s = ''; const from = Math.max(1, cur - 2);
      for (let m = from; m <= from + 3; m++) s += `<span class="tx ${m < cur ? 'on' : m === cur ? 'now' : ''}">${fmt(m * step)}</span>`;
      const bolt = `<svg viewBox="0 0 100 72">${ICON.bolt}</svg>`;
      return `<div class="${cls} tpop" ${st}><div class="t-glow"></div><div class="t-card">
  <div class="t-bolt l">${bolt}</div><div class="t-bolt r">${bolt}</div>${frame(c.frame, d.name, d.pic)}
  <div class="t-name tx">${esc(d.name)}</div><div class="t-count"><b class="tx">${fmt(d.total)}</b><small class="tx">تكبيسة</small></div><div class="t-steps">${s}</div></div>${live ? parts(16, c.metal) : ''}</div>`;
    }
    if (id === 'vip') {
      const m = vipMember(d);
      return `<div class="${cls} vpop" ${st}><div class="v-frame vf-${c.style}"><div class="v-video">${m.video ? `<video src="${esc((window.MEDIA_BASE && m.video.startsWith('/') ? window.MEDIA_BASE : '') + m.video)}" ${live ? '' : 'muted '}loop playsinline autoplay style="${vidTf(m)}"></video>` : `<div class="v-ph" style="${vidTf(m)}"><span class="ms">movie</span>فيديو ${esc(m.name)} (16:9)</div>`}</div></div>
  ${vipDeco(c.style)}<div class="v-cap glossy"><span class="v-pre tx">${esc(c.prefix)}</span><span class="v-name tx">${esc(m.name)}</span><span class="v-post tx">${esc(c.post)}</span></div></div>`;
    }
    if (id === 'honor') {
      const u = ++uid, defs = `<defs><linearGradient id="hm${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb,var(--m) 50%,#000)"/><stop offset=".22" style="stop-color:color-mix(in srgb,var(--m) 30%,#fff)"/><stop offset=".42" style="stop-color:var(--m)"/><stop offset=".58" style="stop-color:color-mix(in srgb,var(--m) 55%,#000)"/><stop offset=".78" style="stop-color:color-mix(in srgb,var(--m) 25%,#fff)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--m) 50%,#000)"/><animateTransform attributeName="gradientTransform" type="rotate" from="0 .5 .5" to="360 .5 .5" dur="9s" repeatCount="indefinite"/></linearGradient>
  <radialGradient id="hf${u}" cx=".5" cy=".3" r=".85"><stop offset="0" style="stop-color:color-mix(in srgb,var(--g) 70%,#fff)"/><stop offset=".55" style="stop-color:var(--g)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--g) 55%,#000)"/></radialGradient>
  <linearGradient id="hg${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".42" stop-color="#fff" stop-opacity=".05"/><stop offset=".46" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
      const M = `url(#hm${u})`, F = `url(#hf${u})`; let svg, clip, box;
      if (c.shape === 'medal') {
        const rib = `<polygon points="215,500 160,748 212,716 248,752 290,530" fill="${F}" stroke="${M}" stroke-width="6"/><polygon points="385,500 440,748 388,716 352,752 310,530" fill="${F}" stroke="${M}" stroke-width="6"/>`;
        let sc = ''; for (let i = 0; i < 28; i++) sc += `<circle cx="300" cy="94" r="24" fill="${M}" transform="rotate(${i * 360 / 28} 300 330)"/>`;
        svg = `${rib}${sc}<circle cx="300" cy="330" r="238" fill="${M}"/><circle cx="300" cy="330" r="216" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="3"/><circle cx="300" cy="330" r="206" fill="${F}" stroke="${M}" stroke-width="6"/><circle cx="300" cy="330" r="206" fill="url(#hg${u})"/><polygon points="${star(300, 176, 30, 13, 5)}" fill="${M}" stroke="rgba(0,0,0,.3)" stroke-width="2"/>`;
        clip = 'circle(240px at 300px 330px)'; box = 'left:150px;right:150px;top:215px;height:250px';
      } else {
        svg = `<path d="${SH_OUT}" fill="${M}"/><path d="${SH_IN}" fill="${F}" stroke="rgba(0,0,0,.35)" stroke-width="3"/><path d="${SH_IN}" fill="url(#hg${u})"/><path d="${SH_IN}" fill="none" stroke="${M}" stroke-width="4" transform="translate(300 380) scale(.92) translate(-300 -380)"/><polygon points="${star(300, 150, 36, 15, 5)}" fill="${M}" stroke="rgba(0,0,0,.3)" stroke-width="2"/><polygon points="${star(196, 580, 11, 4, 4)}" fill="${M}"/><polygon points="${star(404, 580, 11, 4, 4)}" fill="${M}"/><polygon points="${star(300, 628, 13, 5, 4)}" fill="${M}"/>`;
        clip = `path('${SH_OUT}')`; box = 'left:105px;right:105px;top:205px;bottom:200px';
      }
      return `<div class="${cls} hpop" ${st}><div class="h-sh"><svg class="h-svg" viewBox="0 0 600 760">${defs}${svg}</svg><div class="h-sheen" style="clip-path:${clip}"></div>
  <div class="h-text" style="${box}"><div class="h-kick tx">${esc(c.kicker)}</div><div class="h-name tx">${esc(d.name)}</div><div class="h-line"></div><div class="h-msg tx">${esc(d.message)}</div></div></div>${live ? parts(20, c.metal) : ''}</div>`;
    }
    return '';
  }
  function sample(id) {
    const c = S.cfg[id];
    if (id === 'gift') return { name: (B.gifters[0] && B.gifters[0].name) || 'سارة النيل', pic: B.gifters[0] && B.gifters[0].pic, gift: 'أسد', count: 1 };
    if (id === 'tap') return { name: (B.tappers[0] && B.tappers[0].name) || 'ود الخرطوم', pic: B.tappers[0] && B.tappers[0].pic, total: (c.step || 200) * 2 };
    if (id === 'vip') { const m = c.members[c.active] || c.members[0]; return { user: m ? m.user : '', name: 'عضو مميز' }; }
    return { name: c.name || 'اسم المكرَّم', message: c.message };
  }

  /* ---------- stage ---------- */
  function build() {
    const list = opts.only ? ALERTS.filter(a => a.id === opts.only) : ALERTS;
    stage.querySelectorAll('.w').forEach(n => n.remove());
    stage.insertAdjacentHTML('beforeend', list.map(a => `<div class="w" data-id="${a.id}" data-kind="${a.kind}"><div class="base"></div><div class="live-slot"></div>${opts.edit ? '<div class="w-tag"></div><div class="rh"></div>' : ''}</div>`).join(''));
    list.forEach(a => { const el = wEl(a.id); if (a.kind === 'pop') { el.style.setProperty('--bw', BASE[a.id].w + 'px'); el.style.setProperty('--bh', BASE[a.id].h + 'px'); } });
  }
  function renderWidget(id) {
    const el = wEl(id); if (!el || !S) return;
    const a = A(id), base = el.querySelector('.base');
    if (a.kind === 'board') base.innerHTML = renderBoards();
    else base.innerHTML = !opts.edit ? '' : sel === id ? renderPop(id, sample(id), false) : `<div class="ghost-box"><span class="ms">${a.ic}</span>${a.name}</div>`;
    place(id);
  }
  function place(id) {
    const el = wEl(id); if (!el || !S) return;
    const lk = !!S.locked[id];
    if (opts.only) { el.style.left = '0px'; el.style.top = '0px'; el.style.setProperty('--s', 1); }
    else { const L = S.layout[orient][id]; el.style.left = L.x + 'px'; el.style.top = L.y + 'px'; el.style.setProperty('--s', L.s); }
    el.classList.toggle('locked', lk); el.classList.toggle('sel', sel === id); el.classList.toggle('hid', !!S.hidden[id]);
    const tag = el.querySelector('.w-tag');
    if (tag) tag.innerHTML = `<span class="ms">${lk ? 'lock' : 'lock_open'}</span>${A(id).name}${S.hidden[id] ? ' · مخفي' : ''}`;
  }
  function renderAll() { (opts.only ? [opts.only] : ALERTS.map(a => a.id)).forEach(renderWidget); }

  /* ---------- queue ---------- */
  function enqueue(id, d) {
    if (!wEl(id) || (S.hidden[id] && !d.test)) return;
    if (Q[id].length >= 6) Q[id].shift();
    Q[id].push(d); if (!playing[id]) next(id);
  }
  function next(id) {
    const el = wEl(id); if (!el) return;
    const slot = el.querySelector('.live-slot'), d = Q[id].shift(); clearTimeout(timers[id]);
    if (!d) { playing[id] = false; slot.innerHTML = ''; el.classList.remove('playing'); return; }
    playing[id] = true; el.classList.add('playing'); slot.innerHTML = renderPop(id, d, true);
    const v = slot.querySelector('video');
    if (v) { v.currentTime = 0; v.play().catch(() => { v.muted = true; v.play().catch(() => { }); }); }
    const dur = Number(S.cfg[id].dur); if (id === 'honor' && !dur) return;
    timers[id] = setTimeout(() => hidePop(id), Math.max(1, dur || 5) * 1000);
  }
  function hidePop(id) {
    const el = wEl(id); if (!el) return;
    const p = el.querySelector('.live-slot .pop'); clearTimeout(timers[id]);
    if (!p) { playing[id] = false; el.classList.remove('playing'); return; }
    const sp = Math.max(.3, (S.cfg[id].speed || 100) / 100);
    p.classList.add('out', 'out-' + (S.cfg[id].animOut || 'fade')); timers[id] = setTimeout(() => next(id), 720 / sp);
  }

  window.W = {
    esc, fmt, BASE, ALERTS, A, FRAMES, VSTYLES, SHAPES, TEMPLATES, DEFP, frame, frameSVG, hue, vidTf,
    init(el, o) { stage = el; opts = Object.assign({ edit: false, only: null }, o || {}); },
    setSettings(s, full) { const first = !S; S = s; if (first || full) { build(); renderAll(); } else renderAll(); setRot(first); },
    setOrient(o) { orient = o; if (S) (opts.only ? [opts.only] : ALERTS.map(a => a.id)).forEach(place); },
    setBoards(b) { B = b || B; updateBoards(); },
    alert(id, d) { if (S) enqueue(id, d); },
    hide(id) { Q[id] = []; hidePop(id); },
    clearQueue(id) { Q[id] = []; },
    flip() { showB(activeB === 'gifters' ? 'tappers' : 'gifters'); },
    get sel() { return sel; }, set sel(v) { sel = v; },
    renderWidget, place, renderAll, get S() { return S; }
  };
})();
