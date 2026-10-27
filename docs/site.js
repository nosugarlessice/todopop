/* todopop.app: everything on the page besides the bubbles themselves (those are engine.js) */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const root = document.documentElement, REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const TP = window.TP || {};

  /* ---------- downloads: the right one first ---------- */
  const ua = navigator.userAgent, ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua)), android = /Android/i.test(ua), mobile = ios || android;
  const mac = /Mac/i.test(navigator.userAgentData?.platform || navigator.platform || ua);
  if(!mobile) $$('.btns').forEach(g => { // the computer you're on gets the solid button
    const w = g.querySelector('[data-os=win]'), m = g.querySelector('[data-os=mac]'); if(!w || !m) return;
    const [mine, other] = mac ? [m, w] : [w, m]; mine.classList.add('solid'); other.classList.remove('solid');
  });
  if(mobile){
    const g = $('#hero-btns'), a = document.createElement('a'); a.className = 'btn solid';
    if(android){ a.href = 'https://github.com/nosugarlessice/todopop/releases/latest/download/TODOPOP-android.apk'; a.innerHTML = 'Get the Android app <small>.apk</small>'; }
    else { a.href = 'app/'; a.textContent = 'Get on iPhone'; }
    g.querySelectorAll('[data-os]').forEach(b => b.classList.remove('solid')); g.prepend(a);
    $('#hero-meta').textContent = 'Free · No Sign-up · No ads · The bubbles float on your computer; your phone is the remote.';
  }

  /* ---------- reveal things as you scroll to them ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }), {rootMargin:'0px 0px -8% 0px', threshold:.12});
  $$('.rv, .pop-in, .arrows').forEach(el => REDUCED ? el.classList.add('in') : io.observe(el));

  /* ---------- the giant logo: its three O's work like the app's sticker panel ---------- */
  const big = $('#big'), pop = $('#tp-pop'), notes = $$('.o-note');
  function placeNotes(){ // each label sits right above its O
    const box = $('#o-notes').getBoundingClientRect();
    notes.forEach(n => { const o = big.querySelectorAll('.o')[+n.dataset.o].getBoundingClientRect(); n.style.left = (o.left + o.width/2 - box.left) + 'px'; });
  }
  addEventListener('resize', placeNotes); document.fonts?.ready.then(placeNotes); placeNotes();

  let openO = null;
  const SHORT = {1:'REMIND', 2:'SOON', 3:'TODAY', 4:'NOW!'};
  const LEVEL_NAME = {1:'Just a reminder', 2:'Soon', 3:'Today', 4:'Super urgent'};
  const GROUPS = ['School', 'Work', 'Home', 'Health'];
  const popped = []; // what you've popped on this page
  TP.onPop = (b, secs) => { popped.unshift({name:b.name, level:b.level, group:b.group || null, focus:secs || b.focusSecs || 0, at:Date.now()}); if(openO === 1){ selDay = null; renderProgress(); } };

  // the app's tints: hue + saturation, drawn at a lightness that always reads on white
  const hslToRgb = (h, s, l) => { const a = s*Math.min(l, 1-l), f = n => { const k = (n + h/30) % 12; return l - a*Math.max(-1, Math.min(k-3, 9-k, 1)); }; return [f(0), f(8), f(4)].map(v => Math.round(v*255)); };
  const inkL = (h, s) => s < .08 ? .16 : .36 - .14*Math.max(0, 1 - Math.abs(h-140)/80);
  const PRESETS = [[222,.72],[354.9,.771],[178,.9],[95,.55],[268,.55],[24,.85],[0,0]];
  let tint = 0;
  const hex = rgb => '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  function setTint(i){
    tint = i; const [h, s] = PRESETS[i], rgb = hslToRgb(h, s, inkL(h, s));
    root.style.setProperty('--ink', hex(rgb)); document.querySelector('meta[name=theme-color]')?.setAttribute('content', hex(rgb)); TP.setTint?.(rgb);
    if(openO === 2) renderCustomize();
  }

  function stopsHTML(cur){ return `<div class="stops" role="group" aria-label="Urgency">${[1,2,3,4].map(l => `<button type="button" data-l="${l}" aria-pressed="${l === cur}">${SHORT[l]}</button>`).join('')}</div>`; }
  function wireStops(box, onPick){ box.querySelector('.stops').addEventListener('click', e => { const b = e.target.closest('[data-l]'); if(!b) return; box.querySelectorAll('.stops button').forEach(x => x.setAttribute('aria-pressed', x === b)); onPick(+b.dataset.l); }); }

  function renderCreate(){
    let level = 2, group = null;
    pop.innerHTML = `<div class="row"><h3>Blow a bubble</h3><button type="button" class="x" aria-label="Close">×</button></div>
      <label class="lbl" for="tp-name">Task name</label><input class="tin" id="tp-name" maxlength="40" placeholder="e.g. Send the team the Figma link" autocomplete="off">
      <span class="lbl">Urgency · <span id="tp-lv">${LEVEL_NAME[level]}</span></span>${stopsHTML(level)}
      <span class="lbl">Group</span><div class="chips" id="tp-g"><button type="button" data-g="" aria-pressed="true"><i></i>No group</button>${GROUPS.map(g => `<button type="button" data-g="${g}" aria-pressed="false"><i style="background:${TP.groupColor?.(g)}"></i>${g}</button>`).join('')}</div>
      <button type="button" class="btn solid" id="tp-blow" style="justify-content:center">Blow it</button>`;
    wireStops(pop, l => { level = l; $('#tp-lv').textContent = LEVEL_NAME[l]; });
    $('#tp-g').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if(!b) return; group = b.dataset.g || null; $$('#tp-g button').forEach(x => x.setAttribute('aria-pressed', x === b)); });
    const blow = () => { const name = $('#tp-name').value.trim(); if(!name){ $('#tp-name').focus(); return; }
      const r = big.getBoundingClientRect(); TP.add?.({name, level, group, at:{x:r.left + r.width*(.2 + Math.random()*.6), y:Math.min(innerHeight - 80, r.bottom + 160)}}); setO(null); };
    $('#tp-blow').addEventListener('click', blow); $('#tp-name').addEventListener('keydown', e => { if(e.key === 'Enter') blow(); });
    setTimeout(() => $('#tp-name')?.focus({preventScroll:true}), 60);
  }
  /* Popped: the app's week and month views. Today is what you've really popped on this page;
     the days before it are a made-up history, so you can see what a few weeks of using it looks like. */
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayKey = d => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const SAMPLE_TASKS = [['Problem set 3','School',4,52],['Reading response','School',3,38],['Email TA','School',2,0],['Studio crit prep','School',4,95],['Print posters','School',2,0],
    ['Reply to emails','Work',3,14],['Figma critique','Work',3,41],['Send invoice','Work',2,0],['Update portfolio','Work',2,63],
    ['Laundry','Home',2,0],['Groceries','Home',2,0],['Pay rent','Home',3,0],['Water the pothos','Home',1,0],['Clean desk','Home',1,0],
    ['Gym','Health',2,0],['Book dentist','Health',2,0],['Call mom',null,1,0],['Return library book',null,1,0]];
  const sample = (() => { // the same history every visit
    let seed = 7; const rnd = () => (seed = (seed*16807) % 2147483647) / 2147483647;
    const m = {}, today = new Date(); today.setHours(12, 0, 0, 0);
    for(let i = 1; i < 75; i++){ const d = new Date(today); d.setDate(d.getDate() - i); const wk = d.getDay() === 0 || d.getDay() === 6;
      const n = Math.max(0, Math.round(rnd()*(wk ? 3 : 6) - (rnd() < .18 ? 9 : 0)));
      m[dayKey(d)] = Array.from({length:n}, () => { const [name, group, level, focus] = SAMPLE_TASKS[Math.floor(rnd()*SAMPLE_TASKS.length)]; return {name, group, level, focus:focus ? Math.round(focus*(.6 + rnd()*.8)) : 0}; }); }
    return m; })();
  let archMode = 'week', archOffset = 0, selDay = null;
  const dur = mins => mins >= 60 ? `${Math.floor(mins/60)} h ${mins%60} min` : `${mins} min`;
  function dayList(k){ return k === dayKey(new Date()) ? popped.map(p => ({name:p.name, group:p.group, level:p.level, focus:Math.round((p.focus || 0)/60)})) : (sample[k] || []); }
  function renderProgress(){
    const today = new Date(); today.setHours(12, 0, 0, 0); const tk = dayKey(today);
    let days = [], cal = '', range = '';
    if(archMode === 'week'){
      const start = new Date(today); start.setDate(start.getDate() - 6 + archOffset*7);
      for(let i = 0; i < 7; i++){ const d = new Date(start); d.setDate(d.getDate() + i); days.push(d); }
      const e = days[6]; range = `${MON[start.getMonth()]} ${start.getDate()} – ${start.getMonth() !== e.getMonth() ? MON[e.getMonth()] + ' ' : ''}${e.getDate()}, ${e.getFullYear()}`;
      cal = `<div class="week">` + days.map(d => { const k = dayKey(d), L = d > today ? [] : dayList(k);
        return `<button type="button" class="wday${k === tk ? ' today' : ''}${k === selDay ? ' sel' : ''}" data-k="${k}" aria-label="${MON[d.getMonth()]} ${d.getDate()}: ${L.length} popped">
          <span class="pips">${L.slice(0, 8).map((a, j) => `<i class="pip${a.group ? ' g' : ''}" style="--k:${j}${a.group ? `; --gc:${TP.groupColor?.(a.group)}` : ''}"></i>`).join('')}</span>
          <span class="n">${L.length}</span><span class="d">${'MTWTFSS'[(d.getDay() + 6) % 7]} ${d.getDate()}</span></button>`; }).join('') + `</div>`;
    } else {
      const m = new Date(today.getFullYear(), today.getMonth() + archOffset, 1, 12); range = `${MONTHS[m.getMonth()]} ${m.getFullYear()}`;
      const lead = (m.getDay() + 6) % 7, dim = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
      cal = `<div class="month">` + 'MTWTFSS'.split('').map(c => `<span class="h">${c}</span>`).join('') + '<span class="mday out"></span>'.repeat(lead);
      for(let i = 1; i <= dim; i++){ const d = new Date(m.getFullYear(), m.getMonth(), i, 12); days.push(d); const k = dayKey(d), n = d > today ? 0 : dayList(k).length, sz = n ? 30 + Math.min(n, 7)*10 : 0;
        cal += `<button type="button" class="mday${n ? '' : ' zero'}${k === tk ? ' today' : ''}${k === selDay ? ' sel' : ''}" data-k="${k}" aria-label="${MON[d.getMonth()]} ${i}: ${n} popped">${n ? `<span class="c" style="width:${sz}%; height:${sz}%; --k:${i}"></span>` : ''}<span class="num">${i}</span></button>`; }
      cal += `</div>`;
    }
    const inRange = days.filter(d => d <= today).map(d => ({d, list:dayList(dayKey(d))}));
    const total = inRange.reduce((s, x) => s + x.list.length, 0), best = inRange.reduce((a, x) => x.list.length > (a?.list.length || 0) ? x : a, null);
    const focus = inRange.reduce((s, x) => s + x.list.reduce((t, a) => t + a.focus, 0), 0);
    if(selDay === null){ const last = [...inRange].reverse().find(x => x.list.length); selDay = last ? dayKey(last.d) : ''; }
    const sel = days.find(d => dayKey(d) === selDay), L = sel ? dayList(selDay) : [];
    pop.innerHTML = `<div class="row"><h3>Popped</h3><button type="button" class="x" aria-label="Close">×</button></div>` +
      (popped.length ? '' : `<p class="empty">Nothing popped on this page yet. Press and hold a bubble until it bursts, and it lands in today.</p>`) +
      `<div class="arch-bar"><div class="seg${archMode === 'month' ? ' on-month' : ''}" role="group" aria-label="View"><button type="button" data-m="week" class="${archMode === 'week' ? 'on' : ''}">Week</button><button type="button" data-m="month" class="${archMode === 'month' ? 'on' : ''}">Month</button></div>
        <div class="arch-nav"><button type="button" data-nav="-1" aria-label="Earlier">‹</button><button type="button" data-nav="1" aria-label="Later"${archOffset >= 0 ? ' disabled' : ''}>›</button></div></div>
      <div class="range">${range}</div>${cal}
      <p class="arch-sum">${total ? `<b>${total}</b> popped this ${archMode}. Best day <b>${MON[best.d.getMonth()]} ${best.d.getDate()}</b> with ${best.list.length}.${focus >= 1 ? ` <b>${dur(focus)}</b> in focus mode.` : ''}` : `Nothing popped this ${archMode}.`}</p>` +
      (L.length ? `<ul class="day-list"><li class="ttl">${MON[sel.getMonth()]} ${sel.getDate()}</li>${L.map(a => `<li><i style="--gc:${a.group ? TP.groupColor?.(a.group) : 'transparent'}"></i><span>${esc(a.name)}</span><small>${a.focus ? dur(a.focus) + ' · ' : ''}${SHORT[a.level]}</small></li>`).join('')}</ul>` : '') +
      `<p class="note">Days before today are a sample history, to show what a few weeks of popping looks like.</p>`;
  }
  pop.addEventListener('click', e => {
    if(openO !== 1) return; const m = e.target.closest('[data-m]'), nav = e.target.closest('[data-nav]'), day = e.target.closest('[data-k]');
    if(m && m.dataset.m !== archMode){ archMode = m.dataset.m; archOffset = 0; selDay = null; renderProgress(); }
    else if(nav && !nav.disabled){ archOffset = Math.min(0, archOffset + +nav.dataset.nav); selDay = null; renderProgress(); }
    else if(day){ selDay = selDay === day.dataset.k ? '' : day.dataset.k; renderProgress(); }
    placePop();
  });
  function renderCustomize(){
    pop.innerHTML = `<div class="row"><h3>Your color</h3><button type="button" class="x" aria-label="Close">×</button></div>
      <div class="swatches" role="group" aria-label="Tint">${PRESETS.map(([h, s], i) => `<button type="button" data-t="${i}" aria-pressed="${i === tint}" aria-label="Color ${i + 1}" style="background:${hex(hslToRgb(h, s, inkL(h, s)))}"></button>`).join('')}</div>
      <p class="note">The whole page and every bubble follow your color. In the app you can pick any color at all, and your groups' colors shift to match it.</p>`;
    pop.querySelector('.swatches').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if(b) setTint(+b.dataset.t); });
  }
  function setO(i){
    openO = (i === openO) ? null : i;
    big.querySelectorAll('.o').forEach((o, k) => { o.classList.toggle('on', k === openO); o.setAttribute('aria-expanded', k === openO); });
    if(openO === null){ pop.hidden = true; notes.forEach(n => n.classList.remove('lift')); return; }
    pop.hidden = false; pop.classList.toggle('wide', openO === 1); if(openO === 1){ archMode = 'week'; archOffset = 0; selDay = null; }
    [renderCreate, renderProgress, renderCustomize][openO](); placePop();
    pop.style.animation = 'none'; void pop.offsetWidth; pop.style.animation = '';
    notes.forEach(n => n.classList.toggle('lift', +n.dataset.o === openO));
  }
  function placePop(){ // floats over the page, hanging from the O you pressed; nothing underneath moves
    if(openO === null || pop.hidden) return;
    const o = big.querySelectorAll('.o')[openO].getBoundingClientRect(), wr = pop.parentElement.getBoundingClientRect(), b = big.getBoundingClientRect(), w = pop.offsetWidth;
    const cx = o.left + o.width/2 - wr.left, left = Math.max(Math.min(0, (wr.width - w)/2), Math.min(Math.max(wr.width - w, (wr.width - w)/2), cx - w/2));
    pop.style.left = left + 'px'; pop.style.top = (b.bottom - wr.top + 16) + 'px';
    pop.style.setProperty('--ox', Math.max(8, Math.min(w - 8, cx - left)) + 'px');
  }
  addEventListener('resize', placePop);
  big.addEventListener('click', e => { const o = e.target.closest('.o'); if(o) setO(+o.dataset.o); });
  pop.addEventListener('click', e => { if(e.target.closest('.x')) setO(null); });
  addEventListener('pointerdown', e => { if(openO !== null && !e.target.closest('#tp-pop, #big')) setO(null); });
  // the first time you see it, the O's show what they do
  if(!REDUCED){ setTimeout(() => { big.classList.add('hint'); setTimeout(() => big.classList.remove('hint'), 1800); }, 1400); }

  /* ---------- right-click a bubble to edit it ---------- */
  let editPop = null;
  function closeEdit(){ editPop?.remove(); editPop = null; }
  TP.onEdit = (b, x, y) => {
    closeEdit(); let level = b.level;
    editPop = document.createElement('div'); editPop.className = 'tp-pop edit-pop'; editPop.setAttribute('role', 'dialog'); editPop.setAttribute('aria-label', 'Edit bubble');
    editPop.innerHTML = `<div class="row"><span class="lbl">Edit bubble</span><button type="button" class="x" aria-label="Close">×</button></div>
      <label class="lbl" for="ed-name">Task name</label><input class="tin" id="ed-name" maxlength="40" value="${esc(b.name)}">
      <span class="lbl">Urgency</span>${stopsHTML(level)}
      <button type="button" class="btn" id="ed-in" style="justify-content:center">Get in the bubble</button>
      <div class="acts"><button type="button" class="link" id="ed-del">Delete</button><button type="button" class="btn small" id="ed-cancel">Cancel</button><button type="button" class="btn small solid" id="ed-save">Save</button></div>
      <button type="button" class="shrink" id="ed-shrink">Shrink back to starting size</button>`;
    document.body.appendChild(editPop);
    const w = editPop.offsetWidth, h = editPop.offsetHeight;
    editPop.style.left = Math.max(12, Math.min(innerWidth - w - 12, x + 14)) + 'px'; editPop.style.top = Math.max(12, Math.min(innerHeight - h - 12, y - 20)) + 'px';
    wireStops(editPop, l => level = l);
    const save = () => { const n = $('#ed-name').value.trim(); if(n) TP.rename?.(b, n, level); closeEdit(); };
    editPop.addEventListener('click', e => {
      const id = e.target.closest('button')?.id;
      if(e.target.closest('.x') || id === 'ed-cancel') closeEdit(); else if(id === 'ed-save') save();
      else if(id === 'ed-del'){ closeEdit(); TP.pop?.(b, true); } else if(id === 'ed-shrink'){ TP.shrink?.(b); closeEdit(); }
      else if(id === 'ed-in'){ closeEdit(); enterFocus(b); }
    });
    $('#ed-name').addEventListener('keydown', e => { if(e.key === 'Enter') save(); });
    setTimeout(() => { $('#ed-name')?.focus(); $('#ed-name')?.select(); }, 30);
  };
  addEventListener('pointerdown', e => { if(editPop && !editPop.contains(e.target)) closeEdit(); }, true);

  /* ---------- focus mode, for real, on this page ---------- */
  const bar = $('#focus-bar'); bar.hidden = false; bar.inert = true;
  let inside = null, started = 0, tick = 0;
  function enterFocus(b){
    if(!b) return; inside = b; started = Date.now(); closeEdit(); setO(null);
    $('#fb-name').textContent = b.name; $('#fb-time').textContent = '0:00';
    root.classList.add('focusing'); bar.inert = false; TP.hide?.(true);
    clearInterval(tick); tick = setInterval(() => { const s = Math.floor((Date.now() - started)/1000); $('#fb-time').textContent = `${Math.floor(s/60)}:${String(s%60).padStart(2, '0')}`; }, 1000);
  }
  function leaveFocus(popIt){
    if(!inside) return; const b = inside; inside = null; clearInterval(tick);
    root.classList.remove('focusing'); bar.inert = true; TP.hide?.(false);
    b.focusSecs = (b.focusSecs || 0) + (Date.now() - started)/1000;
    if(popIt) setTimeout(() => TP.pop?.(b), 350); // back out, then it bursts
  }
  TP.onClick = b => enterFocus(b);
  $('#fb-exit').addEventListener('click', () => leaveFocus(false));
  $('#fb-done').addEventListener('click', () => leaveFocus(true));
  addEventListener('keydown', e => { if(e.key !== 'Escape') return; if(editPop) closeEdit(); else if(inside) leaveFocus(false); else if(openO !== null) setO(null); });
  $('#get-in').addEventListener('click', () => { // try it: the biggest bubble on screen
    const list = (TP.list?.() || []).filter(b => b.x > 0 && b.x < innerWidth && b.y > 0 && b.y < innerHeight).sort((a, c) => c.R - a.R);
    const b = list[0] || TP.add?.({name:'Essay draft', level:4}); if(b) enterFocus(b);
  });

  /* ---------- the hand-drawn arrows in the creation story ---------- */
  const svg = $('#arrows');
  function drawArrows(){
    if(!svg || innerWidth < 860){ if(svg) svg.innerHTML = ''; return; }
    const base = svg.getBoundingClientRect(), r = id => { const q = $('#' + id).getBoundingClientRect(); return {l:q.left - base.left, r:q.right - base.left, t:q.top - base.top, b:q.bottom - base.top, cx:(q.left + q.right)/2 - base.left}; };
    const w1 = r('why1'), w2 = r('why2'), w3 = r('why3'), s = r('solves'), f1 = r('feat1'), f2 = r('feat2'), f3 = r('feat3');
    const head = (x, y) => { const k = 9; return `M${x-k} ${y-k} L${x} ${y} L${x+k} ${y-k}`; };
    // each reason leads down to the bubble behaviour that answers it
    const y1 = f1.t - 34, y2 = f2.t - 34, y3 = f3.t - 34;
    const paths = [
      [`M${w1.l + 30} ${w1.b + 4} C ${w1.l - 40} ${w1.b + 120}, ${w1.l - 40} ${y1 - 120}, ${w1.l + 34} ${y1}`, head(w1.l + 34, y1)],
      [`M${w2.cx} ${w2.b + 4} C ${w2.cx + 40} ${s.t - 30}, ${s.r + 70} ${s.t}, ${s.r + 40} ${(s.t + s.b)/2} S ${f2.cx + 20} ${y2 - 50}, ${f2.cx} ${y2}`, head(f2.cx, y2)],
      [`M${w3.r - 34} ${w3.b + 4} C ${w3.r + 40} ${w3.b + 120}, ${w3.r + 40} ${y3 - 120}, ${w3.r - 34} ${y3}`, head(w3.r - 34, y3)],
    ];
    svg.innerHTML = paths.map(([d, h]) => `<g><path d="${d}"/>${h ? `<path class="head" d="${h}"/>` : ''}</g>`).join('');
  }
  addEventListener('resize', drawArrows); document.fonts?.ready.then(drawArrows); setTimeout(drawArrows, 300);

  /* ---------- the focus-mode demo screen: a little film, played whenever it's on screen ---------- */
  const screen = $('#screen'), holder = $('#scr-bubbles'), cursor = $('#cursor');
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let playing = false, alive = false;
  const pos = (el, x, y) => { el.style.left = x + '%'; el.style.top = y + '%'; };
  function mkBubble(name, sub, x, y, w, cls = ''){ const b = document.createElement('span'); b.className = 'sb ' + cls; b.innerHTML = `<span>${esc(name)}${sub ? `<small>${sub}</small>` : ''}</span>`;
    b.style.width = w + '%'; b.style.aspectRatio = '1'; pos(b, x, y); holder.appendChild(b); return b; }
  function at(el){ const s = screen.getBoundingClientRect(), r = el.getBoundingClientRect(); return [(r.left + r.width/2 - s.left)/s.width*100, (r.top + r.height/2 - s.top)/s.height*100]; }
  async function moveTo(x, y, ms = 950){ pos(cursor, x - 1, y - 1.5); await sleep(ms); }
  async function click(x, y){ cursor.classList.add('down'); const rp = document.createElement('span'); rp.className = 'ripple'; pos(rp, x, y); screen.appendChild(rp); setTimeout(() => rp.remove(), 520); await sleep(160); cursor.classList.remove('down'); }
  function burst(x, y, n = 12){ for(let k = 0; k < n; k++){ const d = document.createElement('span'); d.className = 'drip'; pos(d, x, y); screen.appendChild(d); const a = Math.random()*6.283, dist = 30 + Math.random()*60;
    d.animate([{transform:'translate(-50%,-50%)', opacity:1}, {transform:`translate(calc(-50% + ${Math.cos(a)*dist}px), calc(-50% + ${Math.sin(a)*dist + 14}px)) scale(.4)`, opacity:0}], {duration:600 + Math.random()*300, easing:'cubic-bezier(.15,.7,.3,1)'}).onfinish = () => d.remove(); } }
  async function film(){
    while(alive){
      holder.innerHTML = ''; screen.classList.remove('in-focus'); $('#scr-t').textContent = '0:00'; pos(cursor, 88, 86);
      const essay = mkBubble('Essay draft', 'NOW!', 26, 34, 15), mail = mkBubble('Reply to emails', 'TODAY', 74, 28, 12), wash = mkBubble('Laundry', 'SOON', 68, 72, 10), read = mkBubble('Read ch. 7', 'TODAY', 18, 76, 11);
      const others = [mail, wash, read];
      await sleep(900); if(!alive) break;
      // grows a little while you ignore it
      essay.style.width = '18%'; await sleep(900);
      await moveTo(26, 34); await click(26, 34);
      // in you go: the others leave, the edge takes your colour, the timer starts
      others.forEach(o => o.style.opacity = 0); essay.style.transform = 'translate(-50%,-50%) scale(9)'; essay.style.opacity = 0;
      screen.classList.add('in-focus');
      let secs = 0; const t = setInterval(() => { secs += 7; $('#scr-t').textContent = `${Math.floor(secs/60)}:${String(secs%60).padStart(2, '0')}`; }, 260);
      await sleep(1100); if(!alive){ clearInterval(t); break; }
      // break it into steps
      const stepAt = [[30, 30], [58, 24], [44, 56]], names = ['Outline', 'Find 3 sources', 'Draft intro'], steps = [];
      for(let k = 0; k < 3; k++){ const [sx, sy] = at($('#scr-step')); await moveTo(sx, sy, k ? 600 : 900); await click(sx, sy); steps.push(mkBubble(names[k], '', stepAt[k][0], stepAt[k][1], 12, 'step')); await sleep(450); }
      // press and hold a step until it pops
      await moveTo(30, 30); cursor.classList.add('down'); steps[0].classList.add('squeeze'); await sleep(800); steps[0].classList.add('gone'); burst(30, 30); cursor.classList.remove('down'); await sleep(700);
      // done: pop the whole task
      const [dx, dy] = at($('#scr-done')); await moveTo(dx, dy); await click(dx, dy); clearInterval(t);
      steps.forEach(s => s.classList.add('gone')); screen.classList.remove('in-focus'); burst(50, 46, 22);
      await sleep(500); others.forEach(o => o.style.opacity = 1); await moveTo(88, 86, 900); await sleep(1600);
    }
    playing = false;
  }
  if(screen){
    if(REDUCED){ mkBubble('Essay draft', 'NOW!', 26, 34, 16); mkBubble('Reply to emails', 'TODAY', 74, 28, 12); mkBubble('Laundry', 'SOON', 68, 72, 10); }
    else new IntersectionObserver(([e]) => { alive = e.isIntersecting; if(alive && !playing){ playing = true; film(); } }, {threshold:.35}).observe(screen);
  }

  /* ---------- the phone: it leans toward your cursor, its shadow falls away from it ---------- */
  const dev = $('#device');
  if(dev && !REDUCED && matchMedia('(pointer: fine)').matches){
    let raf = 0, mx = innerWidth/2, my = innerHeight/3;
    const apply = () => { raf = 0; const r = dev.getBoundingClientRect(); if(r.bottom < 0 || r.top > innerHeight) return;
      const cx = r.left + r.width/2, cy = r.top + r.height/2, dx = (mx - cx)/innerWidth, dy = (my - cy)/innerHeight, d = Math.min(1, Math.hypot(dx, dy)*1.6);
      dev.style.setProperty('--ry', (dx*14).toFixed(2) + 'deg'); dev.style.setProperty('--rx', (-dy*10).toFixed(2) + 'deg');
      dev.style.setProperty('--sx', (-dx*90).toFixed(1) + 'px'); dev.style.setProperty('--sy', (30 - dy*70).toFixed(1) + 'px'); dev.style.setProperty('--sa', (.48 - d*.22).toFixed(2));
      dev.style.setProperty('--gx', ((mx - r.left)/r.width*100).toFixed(1) + '%'); dev.style.setProperty('--gy', ((my - r.top)/r.height*100).toFixed(1) + '%'); };
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; if(!raf) raf = requestAnimationFrame(apply); }, {passive:true});
    addEventListener('scroll', () => { if(!raf) raf = requestAnimationFrame(apply); }, {passive:true});
  }
})();
