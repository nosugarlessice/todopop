/* Tubby on todopop.app: the desk pet from the app, living on the website too.
   It sits fixed on the screen like the bubbles, leans on the big logo when you land, and moves from
   section to section as you scroll, acting out what each one is about. Also runs the calendar demo
   (How it works) and the demos on the Tubby page. It only animates while something is happening. */
(() => {
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs, parent){ const e = document.createElementNS(NS, tag); for(const k in attrs) e.setAttribute(k, attrs[k]); if(parent) parent.appendChild(e); return e; }
let uid = 0;
class Tubby{ // the desk pet; energy (0..1) scales its idle sway, so it can settle into a still pose
  constructor(host, mood, opts = {}){
    this.id = ++uid; this.mood = mood; this.t = Math.random()*10; this.fx = []; this.gaze = {x:0, y:0}; this.gazeTo = {x:0, y:0};
    this.nextBlink = Infinity; this.energy = 1; this.blink = 0; this.emitT = 0; this.swap = 0; this.lift = 0;
    const s = this.svg = el('svg', {viewBox:'0 0 160 160', class:'pet-art', 'aria-hidden':'true'});
    host.appendChild(s);
    const defs = el('defs', {}, s);
    const cp = el('clipPath', {id:'in' + this.id}, defs); el('rect', {x:58, y:50, width:44, height:90, rx:11}, cp);
    this.shadow = el('ellipse', {cx:80, cy:146, rx:26, ry:3.2, class:'fi', 'fill-opacity':.12}, s);
    this.body = el('g', {}, s);
    el('rect', {x:56, y:48, width:48, height:94, rx:13, class:'fw'}, this.body);
    const inner = el('g', {'clip-path':`url(#in${this.id})`}, this.body);
    this.liquid = el('path', {class:'fl'}, inner);
    this.fizz = el('g', {}, inner);
    this.wand = el('g', {}, inner);
    el('path', {d:'M80 92 L80 113', class:'ln'}, this.wand); el('ellipse', {cx:80, cy:124, rx:9, ry:11, class:'ln'}, this.wand);
    el('rect', {x:56, y:48, width:48, height:94, rx:13, class:'ol'}, this.body);
    // faces
    this.faces = {};
    const F = (k, html) => { const g = el('g', {class:'face'}, this.body); g.innerHTML = html; this.faces[k] = g; return g; };
    const eyes = (r, y=74) => `<g class="eyes"><circle cx="69" cy="${y}" r="${r}" class="fi"/><circle cx="91" cy="${y}" r="${r}" class="fi"/></g>`;
    F('watching', eyes(3.2) + '<path d="M76.6 83.3 L83.4 83.3" class="ln"/>');
    F('ontask', '<path d="M65.1 74.8 Q69 70.2 72.8 74.8" class="ln"/><path d="M87.2 74.8 Q91 70.2 94.9 74.8" class="ln"/><path d="M75.8 81.7 Q80 85 84.2 81.7" class="ln"/>');
    F('cheering', eyes(3.9, 73.2) + '<path d="M74 80 Q80 90.2 86 80 Z" class="fi ln"/>');
    F('suspicious', '<path d="M64.2 72.4 L73.8 72.4" class="ln"/><path d="M86.2 72.4 L95.8 72.4" class="ln"/><g class="eyes"><circle cx="69" cy="75" r="2.5" class="fi"/><circle cx="91" cy="75" r="2.5" class="fi"/></g><path class="brow ln" d="M86 65.6 L96.1 63"/><path d="M75.8 83.3 L80.8 82.5 L85.1 84.2" class="ln"/>');
    F('nudging', eyes(3.1, 74.8) + '<path d="M63.9 68.9 L72.4 66.3" class="ln"/><path d="M87.6 66.3 L96.1 68.9" class="ln"/><path d="M75.8 85 Q80 80.8 84.2 85" class="ln"/>');
    F('sleepy', '<path d="M65.1 74 Q69 77.4 72.8 74" class="ln"/><path d="M87.2 74 Q91 77.4 94.9 74" class="ln"/><circle class="snore ln" cx="80" cy="83.3" r="1.9"/>');
    // the cap, a little hat
    this.cap = el('g', {}, this.body);
    el('rect', {x:58, y:28, width:44, height:22, rx:6, class:'fw'}, this.cap);
    el('rect', {x:58, y:28, width:44, height:22, rx:6, class:'fl'}, this.cap);
    el('rect', {x:58, y:28, width:44, height:22, rx:6, class:'ol'}, this.cap);
    for(const x of [67, 75, 85, 93]) el('path', {d:`M${x} 32 L${x} 46`, class:'ln'}, this.cap);
    // things around it
    this.fxg = el('g', {}, s);
    this.q = el('g', {}, s); this.q.innerHTML = '<path d="M118 37 Q118 31 123 31 Q128 31 127 36 Q126 39 122 41 L122 44" class="ln"/><circle cx="122" cy="49" r="1.8" class="fi"/>';
    this.drop = el('path', {d:'M0 -6 Q4.5 1 0 4 Q-4.5 1 0 -6 Z', class:'fl ln'}, s);
    this.setMood(mood, true);
  }
  setMood(m, now){
    if(m === this.mood && !now) return;
    this.mood = m; this.swap = now ? 0 : 1; // a quick squash as it changes face
    for(const k in this.faces) this.faces[k].style.opacity = k === m ? 1 : 0;
    this.fx.forEach(f => f.e.remove()); this.fx = []; this.emitT = 0;
  }
  // little things that float off it
  bubble(x, y, r, vx, vy, inside){
    const g = el('g', {}, inside ? this.fizz : this.fxg);
    const c = el('circle', {cx:0, cy:0, r, class: inside ? 'ln' : 'fw ln'}, g);
    if(!inside && r > 3.5) el('path', {d:`M${-r*.55} ${-r*.1} A${r*.6} ${r*.6} 0 0 1 ${-r*.1} ${-r*.55}`, class:'ln'}, g);
    this.fx.push({e:g, kind:'bubble', x, y, r, vx, vy, age:0, life: inside ? 1.6 : 1.5 + Math.random()*.6, ph:Math.random()*6, inside});
  }
  zz(){ const g = el('g', {}, this.fxg); el('path', {d:'M-3.5 -3.5 L3.5 -3.5 L-3.5 3.5 L3.5 3.5', class:'ln'}, g);
    this.fx.push({e:g, kind:'z', x:110, y:44, age:0, life:2.6, ph:Math.random()*6}); }
  spark(){ const g = el('g', {}, this.fxg); el('path', {d:'M0 -6 L0 6 M-6 0 L6 0', class:'ln'}, g);
    const side = Math.random() < .5 ? -1 : 1;
    this.fx.push({e:g, kind:'spark', x:80 + side*(36 + Math.random()*14), y:40 + Math.random()*60, age:0, life:.8}); }
  tick(dt, look){ // look: where it should look, as a direction ({x, y}, about -1..1), or nothing
    const t = (this.t += dt), m = this.mood, E = this.energy;
    let tilt = 0, dx = 0, dy = 0, sx = 1, sy = 1, level = 98, amp = 1, wv = 1.6, capDy = 0, capRot = 0, wandDy = 0;
    // body language
    if(m === 'watching'){ tilt = 2*Math.sin(t*.9)*E; sy = 1 + .012*Math.sin(t*1.8)*E; sx = 2 - sy; amp = .3 + .7*E; }
    else if(m === 'ontask'){ const b = (.5 + .5*Math.sin(t*2.1))*E; dy = -2*b; sy = 1 + .02*b; sx = 1 - .012*b; level = 95; amp = .3 + E; }
    else if(m === 'cheering'){
      const P = .62, p = (t % P)/P, h = Math.sin(Math.PI*p);
      dy = -15*h; tilt = 9*Math.sin(t*Math.PI*2/(P*2));
      if(p < .1 || p > .92){ sy = .88; sx = 1.08; } else { sy = 1 + .06*h; sx = 1 - .03*h; }
      capDy = -7*h*h; capRot = -10*h*Math.sign(Math.sin(t*Math.PI*2/(P*2))); level = 92; amp = 3.2; wv = 3.4; wandDy = -3*h;
    }
    else if(m === 'suspicious'){ tilt = 1.2*Math.sin(t*.7)*E; // the bottle stays put; only its eyes go where you are
      level = 98; amp = .5; wv = .8; capRot = -6; }
    else if(m === 'nudging'){
      const c = t % 1.7, on = c < .5, k = on ? Math.sin(c/.5*Math.PI) : 0;
      tilt = 5*Math.sin(t*38)*k; dx = 2.2*Math.sin(t*38)*k; sy = .94; sx = 1.03; level = 104; amp = .7 + 2*k; wv = 2.5;
    }
    else if(m === 'sleepy'){ const b = (.5 + .5*Math.sin(t*Math.PI*2/3.6))*E; tilt = 7; sy = 1 - .04*b; sx = 1 + .025*b; level = 101; amp = .4; wv = .6; capRot = 13; capDy = 2; }
    if(this.swap > 0){ this.swap = Math.max(0, this.swap - dt*4); const k = Math.sin(this.swap*Math.PI); sy *= 1 - .1*k; sx *= 1 + .07*k; }
    if(REDUCED){ tilt *= .3; dy *= .3; dx *= .3; amp *= .5; }
    this.body.setAttribute('transform', `translate(${80 + dx} ${142 + dy}) rotate(${tilt.toFixed(2)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-80 -142)`);
    const sh = 1 + dy/40; this.shadow.setAttribute('rx', (26*sh).toFixed(1)); this.shadow.setAttribute('fill-opacity', (.12*sh).toFixed(3));
    this.cap.setAttribute('transform', `translate(0 ${capDy.toFixed(2)}) rotate(${capRot.toFixed(2)} 80 50)`);
    this.wand.setAttribute('transform', `translate(0 ${(wandDy + 1.2*Math.sin(t*1.4)).toFixed(2)})`);
    // the liquid: a soft wave that sloshes with the mood
    let d = `M54 160 L54 ${level}`;
    for(let x = 54; x <= 106; x += 4){ const y = level + amp*Math.sin(x*.16 + t*wv*2) + amp*.5*Math.sin(x*.07 - t*wv*1.3) + tilt*.18*(x - 80)/24*-1; d += ` L${x} ${y.toFixed(2)}`; }
    this.liquid.setAttribute('d', d + ' L106 160 Z');
    // eyes: blink, and look around
    const face = this.faces[m], eyes = face.querySelector('.eyes');
    if((m === 'watching' || m === 'suspicious') && look){ const k = m === 'suspicious' ? 3.2 : 2.8; this.gazeTo.x = Math.max(-k, Math.min(k, look.x*k)); this.gazeTo.y = Math.max(-1.8, Math.min(1.8, look.y*1.8));
      if(m === 'suspicious' && Math.sin(t*.9) > .93) this.gazeTo.x *= -.4; } // a quick glance back at you, then straight back to the screen
    else if(m === 'watching'){ this.gazeTo.x = 2.2*Math.sin(t*.45); this.gazeTo.y = 0; }
    else if(m === 'suspicious' && !look){ const s = Math.sin(t*1.25); this.gazeTo.x = Math.abs(s) > .35 ? 2.8*Math.sign(s) : 0; this.gazeTo.y = 0; }
    else { this.gazeTo.x = 0; this.gazeTo.y = 0; }
    this.gaze.x += (this.gazeTo.x - this.gaze.x)*Math.min(1, dt*9); this.gaze.y += (this.gazeTo.y - this.gaze.y)*Math.min(1, dt*9);
    if((this.nextBlink -= dt) <= 0){ this.blink = .16; this.nextBlink = 2.4 + Math.random()*2.6; }
    let bs = 1; if(this.blink > 0){ this.blink -= dt; bs = Math.max(.1, Math.abs(this.blink - .08)/.08); }
    if(eyes) eyes.setAttribute('transform', `translate(${this.gaze.x.toFixed(2)} ${this.gaze.y.toFixed(2)}) translate(0 74) scale(1 ${m === 'suspicious' ? 1 : bs.toFixed(2)}) translate(0 -74)`);
    if(m === 'suspicious') face.querySelector('.brow').setAttribute('transform', `translate(0 ${(-1.2*(.5 + .5*Math.sin(t*2.4))).toFixed(2)})`);
    if(m === 'sleepy'){ const sn = face.querySelector('.snore'); sn.setAttribute('r', (1.6 + .9*(.5 + .5*Math.sin(t*Math.PI*2/3.6))).toFixed(2)); }
    // question mark and sweat drop
    this.q.style.opacity = m === 'suspicious' ? 1 : 0;
    if(m === 'suspicious') this.q.setAttribute('transform', `translate(0 ${(2*Math.sin(t*2.2)).toFixed(2)}) rotate(${(8*Math.sin(t*1.3)).toFixed(1)} 122 40)`);
    if(m === 'nudging'){ const c = (t % 1.7)/1.7, y = 56 + 22*c*c, o = c < .15 ? c/.15 : c > .8 ? (1 - c)/.2 : 1;
      this.drop.style.opacity = o; this.drop.setAttribute('transform', `translate(${110 + dx} ${y})`); }
    else this.drop.style.opacity = 0;
    // emitters
    this.emitT -= dt;
    if(this.emitT <= 0 && !REDUCED && (E > .9 || m === 'cheering')){ // only while lively: a resting Tubby makes nothing that needs drawing
      if(m === 'cheering'){ this.bubble(80 + (Math.random() - .5)*20, 26 + dy, 3 + Math.random()*5, (Math.random() - .5)*30, -40 - Math.random()*25); if(Math.random() < .55) this.spark(); this.emitT = .28; }
      else if(m === 'ontask'){ this.bubble(64 + Math.random()*32, 136, 1.6 + Math.random()*1.2, 0, -26, true); this.emitT = .7 + Math.random()*.6; }
      else if(m === 'sleepy'){ this.zz(); this.emitT = 1.3; }
      else if(m === 'watching'){ if(Math.random() < .5) this.bubble(64 + Math.random()*32, 136, 1.5, 0, -18, true); this.emitT = 2.2; }
      else this.emitT = 1;
    }
    for(let i = this.fx.length - 1; i >= 0; i--){
      const f = this.fx[i]; f.age += dt; const a = f.age/f.life;
      if(a >= 1){ f.e.remove(); this.fx.splice(i, 1); continue; }
      if(f.kind === 'bubble'){
        f.x += (f.vx + 8*Math.sin(f.age*5 + f.ph))*dt; f.y += f.vy*dt; f.vx *= .98;
        if(f.inside && f.y < level + 1){ f.e.remove(); this.fx.splice(i, 1); continue; } // fizz reaches the surface
        const pop = !f.inside && a > .85, sc = pop ? 1 + (a - .85)/.15*.8 : Math.min(1, a*6);
        f.e.setAttribute('transform', `translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) scale(${sc.toFixed(2)})`);
        f.e.style.opacity = pop ? (1 - a)/.15 : 1;
      } else if(f.kind === 'z'){
        const x = f.x + 18*a + 3*Math.sin(f.age*3 + f.ph), y = f.y - 34*a, sc = .7 + .7*a;
        f.e.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sc.toFixed(2)})`); f.e.style.opacity = a < .2 ? a/.2 : 1 - (a - .2)/.8;
      } else if(f.kind === 'spark'){
        const sc = Math.sin(a*Math.PI); f.e.setAttribute('transform', `translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${(a*90).toFixed(0)}) scale(${sc.toFixed(2)})`);
      }
    }
  }
}

const T = s => window.I18N ? window.I18N.T(s) : s;
const $ = s => document.querySelector(s);
const page = (document.body.className.match(/page-(\w+)/) || [])[1] || 'home';

/* a small driver for any Tubby: runs frames only while it's lively, then rests still */
function driver(pet, look){
  let raf = 0, last = 0, busyUntil = 0, cheerUntil = 0, odd = false;
  const d = {pet, look,
    busy(ms){ busyUntil = Math.max(busyUntil, performance.now() + ms); d.run(); },
    cheer(ms = 2200, back = null){ cheerUntil = performance.now() + ms; pet.setMood('cheering'); d.busy(ms + 400);
      clearTimeout(d.cheerT); d.cheerT = setTimeout(() => { pet.setMood(back || d.mood || 'watching'); d.busy(2500); }, ms); },
    mood: 'watching',
    setMood(m){ d.mood = m; if(performance.now() < cheerUntil) return; if(pet.mood !== m){ pet.setMood(m); d.busy(4000); } },
    run(){ if(!raf){ last = performance.now(); raf = requestAnimationFrame(loop); } },
    extra: null};
  function loop(now){
    raf = 0; odd = !odd;
    if(odd && !d.extra){ raf = requestAnimationFrame(loop); return; } // about 30 frames a second is plenty
    const dt = Math.min(.05, (now - last)/1000); last = now;
    pet.energy = now < cheerUntil ? 1 : Math.max(0, Math.min(1, (busyUntil - now)/1500));
    const moving = d.extra ? d.extra(dt) : false;
    pet.tick(dt, d.look ? d.look() : null);
    if(moving || now < busyUntil || now < cheerUntil || pet.fx.length || pet.swap > 0 || pet.blink > 0) raf = requestAnimationFrame(loop);
  }
  (function blink(){ setTimeout(() => { if(!document.hidden && pet.mood !== 'sleepy' && pet.mood !== 'ontask'){ pet.blink = .16; d.run(); } blink(); }, 3200 + Math.random()*3200); })();
  d.busy(1500);
  return d;
}
const lookAt = (box, get) => () => { const p = get(); if(!p) return null; const r = box.getBoundingClientRect(), k = Math.max(160, innerWidth*.3);
  return {x:Math.max(-1, Math.min(1, (p.x - r.left - r.width/2)/k)), y:Math.max(-1, Math.min(1, (p.y - r.top - r.height*.45)/k))}; };
let mouse = null;
addEventListener('pointermove', e => { mouse = {x:e.clientX, y:e.clientY, t:performance.now()}; }, {passive:true});

/* ---------- the roaming Tubby ---------- */
if(page !== 'tubby'){
  const box = document.createElement('div'); box.className = 'site-pet'; box.setAttribute('aria-hidden', 'true');
  const hit = document.createElement('button'); hit.type = 'button'; hit.className = 'site-pet-hit'; hit.setAttribute('aria-label', 'Tubby, the desk pet');
  box.appendChild(hit); document.body.appendChild(box);
  const tip = document.createElement('div'); tip.className = 'site-pet-tip'; tip.setAttribute('role', 'status'); tip.hidden = true; document.body.appendChild(tip);
  const pet = new Tubby(box, 'watching');
  const D = driver(pet, null);
  let S = 96, cur = null, tgt = {x:0, y:0, r:0}, station = null, ducked = false, override = null, dragging = false;
  const size = () => { // leaning on the big logo it matches the logo; elsewhere it's desk-pet sized
    let s = innerWidth < 700 ? 64 : Math.round(Math.max(84, Math.min(124, innerHeight*.11)));
    const lg = $('#big .logo');
    if(spot === leanSpot && lg){ const h = lg.getBoundingClientRect().height; if(h > 10) s = Math.round(Math.max(s, Math.min(200, h*1.2))); }
    if(s !== S){ S = s; box.style.width = box.style.height = S + 'px'; } };
  const wrapL = () => { const w = $('main .wrap'); return w ? w.getBoundingClientRect().left : 24; };
  const wrapR = () => { const w = $('main .wrap'); return w ? w.getBoundingClientRect().right : innerWidth - 24; };
  // where Tubby goes beside the content: in the margin when there's room, otherwise in a bottom corner
  const side = (which, yf = .52) => () => {
    const narrow = innerWidth < 700, room = which === 'left' ? wrapL() : innerWidth - wrapR();
    if(narrow || room < S*.62) return {x: which === 'left' ? 6 : innerWidth - S - 6, y: innerHeight - S - 8, r: 0};
    return {x: which === 'left' ? Math.max(4, room/2 - S/2) : innerWidth - room/2 - S/2, y: innerHeight*yf - S/2, r: which === 'left' ? -6 : 6};
  };
  const lean = sel => () => { const e = $(sel); if(!e) return null; const r = e.getBoundingClientRect(); // leaning on the right end, like on the app's panel
    return {x: r.right - S*.44, y: r.bottom - S*.86, r: 15}; };
  const STATIONS = {
    home: [
      {sel:'.hero', at: lean('#big .logo'), mood:'watching', tip:'Hi, I’m Tubby. I live on your desktop too.'},
      {sel:'#features', at: side('left'), mood:'watching', tip:'These three are why TODOPOP works.'},
      {sel:'#download', at: side('right', .5), mood:'cheering', tip:'Download, and I’ll keep you company.'}],
    how: [
      {sel:'#how', at: side('right', .45), mood:'sleepy', tip:'Ignoring deadlines? I know the feeling.'},
      {sel:'#focus', at: side('left'), mood:'watching', tip:'Get in a bubble: I’ll keep watch.'},
      {sel:'#cal', at: side('right'), mood:'watching', tip:'When a time block starts, I call you in.'},
      {sel:'#more', at: side('left'), mood:'watching', tip:'More things bubbles can do.'},
      {sel:'#privacy', at: side('right'), mood:'ontask', tip:'Your list stays with you. So do I.'}],
    phone: [{sel:'#phone', at: side('right', .42), mood:'watching', tip:'Pop tasks from your phone, and I’ll still cheer.'}],
  }[page] || [];
  const pick = () => { let s = STATIONS[0]; for(const st of STATIONS){ const e = $(st.sel); if(e && e.getBoundingClientRect().top < innerHeight*.55) s = st; } return s; };
  /* where it sits: it wanders to a new spot on its own every 30 to 60 seconds or so, not as you scroll,
     so a quick scroll doesn't send it zipping around. On the landing page it starts leaning on the big logo. */
  const leanSpot = lean('#big .logo');
  const logoVisible = () => { const e = $('#big .logo'); if(!e) return false; const r = e.getBoundingClientRect(); return r.bottom > 90 && r.top < innerHeight - 40; };
  const SPOTS = [side('left', .5), side('right', .5), side('right', .3), side('left', .72),
    () => ({x: innerWidth - S - 10, y: innerHeight - S - 10, r: 4}), () => ({x: 10, y: innerHeight - S - 10, r: -4})];
  let spot = logoVisible() ? leanSpot : SPOTS[1], wanderT = null;
  function wander(){
    const options = SPOTS.filter(f => f !== spot);
    spot = logoVisible() && spot !== leanSpot && Math.random() < .5 ? leanSpot : options[Math.floor(Math.random()*options.length)];
    size(); hideTip(); D.busy(2500);
    clearTimeout(wanderT); wanderT = setTimeout(wander, 30000 + Math.random()*30000); // somewhere between half a minute and a minute
  }
  wanderT = setTimeout(wander, 30000 + Math.random()*30000);
  function target(){
    if(spot === leanSpot && !override && !logoVisible()) wander(); // the logo scrolled away: it hops off to a new spot
    let t = override ? override() : spot();
    if(!t) return null;
    t.x = Math.max(4, Math.min(innerWidth - S - 4, t.x)); t.y = Math.max(70, Math.min(innerHeight - S - 4, t.y));
    if(ducked) t.y = innerHeight - S*.38; // the calendar demo's meeting: ducking down to the edge
    return t;
  }
  function place(x, y, r){ box.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${r.toFixed(1)}deg)`; }
  D.extra = dt => {
    const t = target(); if(!t) return false;
    if(!cur){ cur = {...t}; place(cur.x, cur.y, cur.r); return false; }
    const k = REDUCED ? 1 : 1 - Math.pow(.0015, dt); // a quick, springy glide
    const dx = t.x - cur.x, dy = t.y - cur.y;
    cur.x += dx*k; cur.y += dy*k; cur.r += (t.r + Math.max(-12, Math.min(12, dx*.06)) - cur.r)*k;
    place(cur.x, cur.y, cur.r); placeTip();
    return Math.abs(dx) > .4 || Math.abs(dy) > .4 || Math.abs(t.r - cur.r) > .3;
  };
  D.look = lookAt(box, () => mouse && performance.now() - mouse.t < 3000 ? mouse : null);
  // its mood still follows what you're reading, once you've stayed on a section for a moment
  let moodT = null, seenSection = null;
  function update(){
    const s = pick();
    if(s !== seenSection){ seenSection = s; clearTimeout(moodT);
      moodT = setTimeout(() => { const first = !station; station = s; if(s){ if(s.mood === 'cheering' && !first) D.cheer(2400, 'watching'); else D.setMood(s.mood === 'cheering' ? 'watching' : s.mood); } }, station ? 1200 : 0); }
    D.run();
  }
  let ticking = false;
  addEventListener('scroll', () => { if(!ticking){ ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } }, {passive:true});
  addEventListener('resize', () => { size(); update(); });
  addEventListener('pointermove', e => { const r = box.getBoundingClientRect(); if(Math.hypot(e.clientX - r.left - r.width/2, e.clientY - r.top - r.height/2) < 380) D.busy(600); }, {passive:true});
  // say hi when clicked
  function placeTip(){ if(tip.hidden || !cur) return; const w = tip.offsetWidth, h = tip.offsetHeight;
    const left = Math.max(8, Math.min(innerWidth - w - 8, cur.x + S/2 - w/2)), above = cur.y - h - 6 > 70;
    tip.style.left = left + 'px'; tip.style.top = (above ? cur.y + S*.08 - h - 6 : cur.y + S*.95) + 'px'; }
  function hideTip(){ tip.hidden = true; clearTimeout(hideTip.t); }
  hit.addEventListener('click', () => {
    D.cheer(1800);
    tip.innerHTML = `<span>${T(station ? station.tip : 'Hi, I’m Tubby.')}</span> <a href="tubby.html">${T('Meet Tubby')}</a>`;
    tip.hidden = false; placeTip(); clearTimeout(hideTip.t); hideTip.t = setTimeout(hideTip, 4200);
    try{ window.TPSound?.pop?.(40); }catch(e){}
  });
  // react to what happens on the page
  const seen = new Set();
  const io = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting && !seen.has(e.target)){ seen.add(e.target); D.cheer(e.target.id === 'feat3' ? 2200 : 900); } }), {threshold:.6});
  ['#feat1', '#feat2', '#feat3'].forEach(s => { const e = $(s); if(e) io.observe(e); });
  const scr = $('#screen');
  if(scr) new MutationObserver(() => { if(station && station.sel === '#focus') D.setMood(scr.classList.contains('in-focus') ? 'ontask' : 'watching'); }).observe(scr, {attributes:true, attributeFilter:['class']});
  addEventListener('tp-cal', e => {
    if(e.detail === 'block') D.cheer(1600);
    const c = $('#cal-demo'), r = c && c.getBoundingClientRect(); ducked = e.detail === 'meet' && !!r && r.bottom > 0 && r.top < innerHeight; D.busy(1500);
  });
  addEventListener('tp-pop', () => D.cheer(1600)); // a bubble burst
  // the landing page: Tubby reacts to whatever you try
  let oT = null;
  addEventListener('tp-o', e => { clearTimeout(oT); const i = e.detail; // one of the filled O's
    if(i === 0) D.cheer(700, 'watching');                                        // making a task: a little hop
    else if(i === 1) D.setMood('ontask');                                         // your progress: content
    else if(i === 2){ D.setMood('suspicious'); oT = setTimeout(() => D.setMood(station ? station.mood.replace('cheering', 'watching') : 'watching'), 2600); } // customize: curious
    else D.setMood(station ? station.mood.replace('cheering', 'watching') : 'watching');
    D.busy(2500); });
  addEventListener('tp-blow', () => D.cheer(2200));                                // a new bubble
  addEventListener('tp-tint', () => { clearTimeout(oT); D.cheer(900, 'suspicious'); oT = setTimeout(() => D.setMood('watching'), 2400); }); // a new color, admired
  addEventListener('tp-drag', e => { dragging = e.detail === 'start'; if(dragging) D.setMood('watching'); D.busy(1500); }); // its eyes follow the bubble
  addEventListener('pointermove', () => { if(dragging) D.busy(600); }, {passive:true});
  let fT = null;
  addEventListener('tp-focus', e => { clearTimeout(fT); // you got into a bubble: Tubby keeps watch from a corner, then settles in
    if(e.detail){ override = () => ({x: 12, y: innerHeight - S - (innerWidth < 700 ? 90 : 24), r: -4}); D.setMood('watching'); fT = setTimeout(() => D.setMood('ontask'), 6000); }
    else { override = null; D.setMood(station ? station.mood.replace('cheering', 'watching') : 'watching'); }
    hideTip(); D.busy(2000); });
  window.TPPet = {cheer: ms => D.cheer(ms)};
  size(); update();
}

/* ---------- the calendar demo (How it works) ---------- */
const cal = $('#cal-demo');
if(cal){
  const mini = new Tubby($('#cal-pet'), 'watching');
  const M = driver(mini, null);
  const clock = $('#cal-clock'), card = $('#cal-card'), note = $('#cal-note'), scr = $('#cal-scr'), now = $('#cal-now'), essay = $('#cal-essay');
  const steps = [ // the day, scaled: minutes from 1:30 PM
    {at:28, fn:() => set('before')}, {at:30, fn:() => set('block')}, {at:58, fn:() => set('focus')},
    {at:90, fn:() => set('meet')}, {at:120, fn:() => set('after')}];
  let m = 20, playing = false, last = 0, raf = 0, phase = '';
  const fmt = m => { const t = 13*60 + 30 + Math.round(m), h = Math.floor(t/60), mm = t % 60; return `${h > 12 ? h - 12 : h}:${String(mm).padStart(2, '0')} PM`; };
  function set(p){
    if(p === phase) return; phase = p;
    cal.dataset.phase = p;
    card.hidden = p !== 'block'; note.hidden = p !== 'meet';
    scr.classList.toggle('quiet', p === 'meet'); essay.classList.toggle('swell', p === 'block'); scr.classList.toggle('focusing', p === 'focus');
    if(p === 'block'){ M.cheer(1500); dispatchEvent(new CustomEvent('tp-cal', {detail:'block'})); }
    if(p === 'meet'){ M.setMood('sleepy'); dispatchEvent(new CustomEvent('tp-cal', {detail:'meet'})); }
    if(p === 'after' || p === 'before'){ M.setMood('watching'); dispatchEvent(new CustomEvent('tp-cal', {detail:'end'})); }
    if(p === 'focus'){ M.setMood('ontask'); }
    document.querySelectorAll('#cal-jump [data-m]').forEach(b => b.setAttribute('aria-pressed', b.dataset.p === p));
  }
  function show(){ clock.textContent = fmt(m); now.style.top = (m/150*100) + '%';
    let p = 'before'; for(const s of steps) if(m >= s.at) p = {28:'before', 30:'block', 58:'focus', 90:'meet', 120:'after'}[s.at]; set(p); }
  function loop(t){ raf = 0; if(!playing) return; const dt = Math.min(.1, (t - last)/1000); last = t;
    m += dt*(phase === 'block' || phase === 'meet' ? 4 : 9); if(m > 140) m = 20; show(); raf = requestAnimationFrame(loop); }
  function play(on){ playing = on && !REDUCED; if(playing && !raf){ last = performance.now(); raf = requestAnimationFrame(loop); } }
  new IntersectionObserver(es => es.forEach(e => play(e.isIntersecting && !cal.dataset.held)), {threshold:.35}).observe(cal);
  document.querySelectorAll('#cal-jump [data-m]').forEach(b => b.addEventListener('click', () => { m = +b.dataset.m; cal.dataset.held = '1'; play(false); show();
    clearTimeout(play.t); play.t = setTimeout(() => { delete cal.dataset.held; play(true); }, 6000); }));
  $('#cal-getin').addEventListener('click', () => { m = 58; show(); });
  $('#cal-later').addEventListener('click', () => { card.hidden = true; });
  $('#cal-show').addEventListener('click', () => { scr.classList.remove('quiet'); note.hidden = true; });
  show();
}

/* ---------- the Tubby page ---------- */
if(page === 'tubby'){
  // the big one, leaning on its logo; click it for a cheer
  const heroBox = $('#pet-hero-tubby');
  if(heroBox){
    const big = new Tubby(heroBox, 'watching'); const H = driver(big, null);
    H.look = lookAt(heroBox, () => mouse && performance.now() - mouse.t < 3000 ? mouse : null);
    addEventListener('pointermove', () => H.busy(500), {passive:true});
    heroBox.addEventListener('click', () => H.cheer(2000));
    const stage = $('.pet-stage'), logo = $('.pet-logo');
    const placeHero = () => { const L = logo.getBoundingClientRect(), st = stage.getBoundingClientRect(), s = heroBox.offsetWidth;
      heroBox.style.left = (L.right - st.left - s*.44) + 'px'; heroBox.style.top = (L.bottom - st.top - s*.86) + 'px'; };
    new ResizeObserver(placeHero).observe(stage); addEventListener('resize', placeHero); placeHero();
  }
  // the moods, each acting its part when it comes into view
  document.querySelectorAll('[data-pet-mood]').forEach(host => {
    const m = host.dataset.petMood, t = new Tubby(host, m), d = driver(t, null);
    let tm = null;
    new IntersectionObserver(es => es.forEach(e => { clearInterval(tm); if(e.isIntersecting){ d.busy(6000); tm = setInterval(() => d.busy(6000), 5000); } }), {threshold:.4}).observe(host);
  });
  // where it lives: a small screen; click Tubby to open or tuck the panel, drag it to give it a spot
  const ws = $('#where-screen');
  if(ws){
    const tb = $('#where-tubby'), pill = $('#where-pill'), keys = $('#where-keys');
    const t = new Tubby(tb, 'watching'), d = driver(t, null);
    let open = true, spot = {x:.9, y:.84}, drag = null;
    function layout(){
      const W = ws.clientWidth, H = ws.clientHeight, s = tb.offsetWidth;
      if(open){ const p = pill.getBoundingClientRect(), r = ws.getBoundingClientRect(); tb.style.left = (p.right - r.left - s*.44) + 'px'; tb.style.top = (p.bottom - r.top - s*.86) + 'px'; tb.classList.add('lean'); }
      else { tb.style.left = (spot.x*W - s/2) + 'px'; tb.style.top = (spot.y*H - s/2) + 'px'; tb.classList.remove('lean'); }
      pill.classList.toggle('off', !open); keys.classList.toggle('off', open);
      keys.style.left = (spot.x*W - keys.offsetWidth/2) + 'px'; keys.style.top = (spot.y*H - s*.36 - keys.offsetHeight - 6) + 'px';
      $('#where-state').textContent = T(open ? 'Panel open: Tubby leans on it.' : 'Tucked away: Tubby is the button. Click it, or drag it somewhere new.');
    }
    tb.addEventListener('pointerdown', e => { e.preventDefault(); tb.setPointerCapture(e.pointerId); drag = {x:e.clientX, y:e.clientY, moved:false}; });
    tb.addEventListener('pointermove', e => { if(!drag) return; if(!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 5) return;
      drag.moved = true; tb.classList.add('drag'); tb.classList.remove('lean'); const r = ws.getBoundingClientRect(), s = tb.offsetWidth;
      tb.style.left = (e.clientX - r.left - s/2) + 'px'; tb.style.top = (e.clientY - r.top - s/2) + 'px'; d.busy(400); });
    const up = () => { if(!drag) return; const was = drag; drag = null; tb.classList.remove('drag');
      if(was.moved){ const r = ws.getBoundingClientRect(), b = tb.getBoundingClientRect();
        spot = {x:Math.max(.08, Math.min(.92, (b.left + b.width/2 - r.left)/r.width)), y:Math.max(.2, Math.min(.86, (b.top + b.height/2 - r.top)/r.height))}; }
      else { open = !open; d.cheer(900); }
      layout(); };
    tb.addEventListener('pointerup', up); tb.addEventListener('pointercancel', up);
    tb.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open = !open; d.cheer(900); layout(); } });
    d.look = lookAt(tb, () => mouse && performance.now() - mouse.t < 3000 ? mouse : null);
    ws.addEventListener('pointermove', () => d.busy(500));
    addEventListener('resize', layout); new ResizeObserver(layout).observe(ws); layout();
    window.I18N && I18N.onChange(layout);
  }
}
})();
