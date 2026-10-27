// Portfolio: loader, clock, scroll storytelling, 3D "wrong number", SQL console
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = typeof gsap !== 'undefined';
if (reduceMotion || !hasGsap) document.documentElement.classList.add('reduce');

/* ---------- live UK clock and date widget ---------- */
function tick() {
  const now = new Date();
  const opts = { timeZone: 'Europe/London' };
  const date = now.toLocaleDateString('en-GB', { ...opts, day: 'numeric', month: 'short' });
  const time = now.toLocaleTimeString('en-GB', { ...opts, hour: '2-digit', minute: '2-digit' });
  document.getElementById('clock').textContent = `${date} — ${time}`;
  document.getElementById('dw-day').textContent = now.toLocaleDateString('en-GB', { ...opts, weekday: 'short' }).toUpperCase();
  document.getElementById('dw-num').textContent = now.toLocaleDateString('en-GB', { ...opts, day: 'numeric' });
}
tick(); setInterval(tick, 30000);

/* ---------- split focus-text into words for the blur-to-sharp reveal ---------- */
document.querySelectorAll('.focus-text').forEach(p => {
  p.innerHTML = p.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
});

/* ---------- 3D: a city of sales bars with one wrong number ---------- */
const fixState = { v: 0 };
(function bars3d() {
  const canvas = document.getElementById('bars');
  if (typeof THREE === 'undefined' || !canvas) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0e1116, 18, 40);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  scene.add(new THREE.AmbientLight(0x8aa4c8, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(6, 12, 8); scene.add(key);
  const rim = new THREE.PointLight(0x58a6ff, 1.3, 40); rim.position.set(-8, 6, -6); scene.add(rim);

  const group = new THREE.Group(); scene.add(group);
  const cols = 9, rows = 6, gap = 1.25;
  const geo = new THREE.BoxGeometry(0.8, 1, 0.8); geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x1f6feb, roughness: 0.35, metalness: 0.25 });
  const bars = [];
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const h = 1.2 + 2.2 * (0.5 + 0.5 * Math.sin(i * 0.7) * Math.cos(j * 0.9)) + (i + j) * 0.12;
    const m = new THREE.Mesh(geo, mat);
    m.position.set((i - (cols - 1) / 2) * gap, 0, (j - (rows - 1) / 2) * gap);
    m.scale.y = h; m.userData.h = h; group.add(m); bars.push(m);
  }
  const wrong = bars[Math.floor(cols / 2) * rows + (rows - 1)]; // front row, centre
  const target = wrong.userData.h;
  const gMat = new THREE.MeshStandardMaterial({ color: 0xe3a321, emissive: 0xe3a321, emissiveIntensity: 0.4, roughness: 0.3 });
  wrong.material = gMat;
  const grid = new THREE.GridHelper(30, 30, 0x262c36, 0x1a2029); grid.position.y = -0.01; scene.add(grid);

  const mouse = { x: 0 };
  addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth - 0.5; });
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    const narrow = w < 600;
    camera.position.set(narrow ? 7 : 9, narrow ? 10 : 8, narrow ? 18 : 15);
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  const blue = new THREE.Color(0x1f6feb), gold = new THREE.Color(0xe3a321);
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    if (!visible) return;
    const t = clock.getElapsedTime();
    if (!reduceMotion) {
      group.rotation.y = -0.35 + t * 0.05 + mouse.x * 0.3;
      bars.forEach((b, n) => { if (b !== wrong) b.scale.y = b.userData.h * (1 + 0.04 * Math.sin(t * 1.2 + n)); });
    }
    wrong.scale.y = 0.35 + (target - 0.35) * fixState.v;
    gMat.color.copy(gold).lerp(blue, fixState.v);
    gMat.emissive.copy(gold).lerp(blue, fixState.v);
    gMat.emissiveIntensity = 0.4 * (1 - fixState.v) + 0.05;
    camera.lookAt(0, 1.6, 0);
    renderer.render(scene, camera);
  })();
})();

/* ---------- SQL console ---------- */
const Q = [
  { sql: `<span class="kw">SELECT</span> category, <span class="fn">ROUND</span>(<span class="fn">AVG</span>(is_cancelled)*100, 1) <span class="kw">AS</span> cancel_rate\n<span class="kw">FROM</span> orders <span class="kw">GROUP BY</span> category\n<span class="kw">ORDER BY</span> cancel_rate <span class="kw">DESC LIMIT</span> 1;`,
    out: `category          | cancel_rate\n------------------+------------\n<span class="hl">Health &amp; Beauty   | 10.0%</span>\n\n<span class="ok">✔ Insight:</span> overall 7.5% (1 in 13 orders). Health &amp; Beauty is the outlier.\n<span class="ok">✔ Action:</span> fix stock accuracy there first.` },
  { sql: `<span class="kw">SELECT</span> is_loyalty_member, <span class="fn">AVG</span>(order_value) <span class="kw">AS</span> avg_basket\n<span class="kw">FROM</span> orders <span class="kw">GROUP BY</span> is_loyalty_member;`,
    out: `is_loyalty_member | avg_basket\n------------------+-----------\nfalse             | baseline\n<span class="hl">true              | +8%</span>\n\n<span class="ok">✔ Insight:</span> loyalty-card members spend 8% more per order.\n<span class="ok">✔ Action:</span> target sign-ups at the till.` },
  { sql: `<span class="kw">SELECT</span> month, revenue / <span class="fn">AVG</span>(revenue) <span class="kw">OVER</span> () - 1 <span class="kw">AS</span> vs_avg\n<span class="kw">FROM</span> monthly_sales\n<span class="kw">ORDER BY</span> vs_avg <span class="kw">DESC LIMIT</span> 1;`,
    out: `month | vs_avg\n------+-------\n<span class="hl">Dec   | +21%</span>\n\n<span class="ok">✔ Insight:</span> December trades 21% above the monthly average.\n<span class="ok">✔ Action:</span> build stock and time promotions before the peak.` },
  { sql: `<span class="kw">SELECT</span> * <span class="kw">FROM</span> analysts <span class="kw">WHERE</span> name = 'Praneet Sivakumar';`,
    out: `role         | Data Analyst (retail &amp; FMCG)\neducation    | MSc Data Science, <span class="hl">Distinction</span>\nexperience   | Atheon Analytics · Tesco · M&amp;S · ByVal\ntools        | SQL, Power BI, Python, Excel\nsuperpower   | <span class="hl">finds the wrong number before it reaches the report</span>\nstatus       | <span class="ok">open_to_work = TRUE</span>\n\n1 row returned.` }
];
const out = document.getElementById('console-out');
let typing = null;
document.querySelectorAll('.console-q button').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.console-q button').forEach(b => b.classList.toggle('on', b === btn));
  const q = Q[+btn.dataset.q];
  clearInterval(typing);
  const plain = q.sql.replace(/<[^>]+>/g, '');
  if (reduceMotion) { out.innerHTML = `> ${q.sql}\n\n${q.out}`; return; }
  let i = 0;
  typing = setInterval(() => {
    i += 3;
    out.textContent = '> ' + plain.slice(0, i);
    if (i >= plain.length) {
      clearInterval(typing);
      out.innerHTML = `> ${q.sql}\n\n<span class="muted">running… 15,042 rows scanned</span>`;
      setTimeout(() => { out.innerHTML = `> ${q.sql}\n\n${q.out}`; }, 500);
    }
  }, 16);
}));

/* ---------- contact form → Google Sheet + Gmail notification ---------- */
// Paste your Apps Script web app URL here after deploying (see portfolio_setup/SETUP.md)
const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwX-G4t8gguP0--PAd-2rb8nE5cFa9UDh4u54SzJUAVAMgcGUqTfrH6PqNyhgDO3KxV4w/exec';
const cform = document.getElementById('cform');
cform.addEventListener('submit', async e => {
  e.preventDefault();
  const status = document.getElementById('cform-status'), msg = document.getElementById('cform-msg');
  const f = cform.elements;
  const checks = [[f.name, v => v.trim().length > 0], [f.email, v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)], [f.message, v => v.trim().length >= 5]];
  let ok = true;
  checks.forEach(([el, test]) => { const good = test(el.value); el.classList.toggle('invalid', !good); ok = ok && good; });
  if (!ok) { status.textContent = 'error'; status.className = 'cform-status err'; msg.textContent = 'Please add your name, a valid email and a short message.'; return; }

  const body = new URLSearchParams(new FormData(cform));
  if (!FORM_ENDPOINT) {
    // Not connected yet: fall back to the visitor's email app
    const subject = encodeURIComponent(`[Portfolio] ${f.reason.value} from ${f.name.value}`);
    const text = encodeURIComponent(`${f.message.value}\n\n${f.name.value}\n${f.email.value}\n${f.company.value}`);
    location.href = `mailto:praneetsivakumar@hotmail.com?subject=${subject}&body=${text}`;
    return;
  }
  const btn = cform.querySelector('button');
  btn.disabled = true; status.textContent = 'inserting…'; status.className = 'cform-status';
  try {
    await fetch(FORM_ENDPOINT, { method: 'POST', mode: 'no-cors', body });
    status.textContent = '1 row inserted'; status.className = 'cform-status ok';
    msg.textContent = `Thanks ${f.name.value.split(' ')[0]}, your message is in. I'll reply within 24 hours.`;
    cform.reset();
  } catch (err) {
    status.textContent = 'error'; status.className = 'cform-status err';
    msg.innerHTML = 'Something went wrong. Please email me at <a href="mailto:praneetsivakumar@hotmail.com">praneetsivakumar@hotmail.com</a>.';
  } finally { btn.disabled = false; }
});

/* ---------- scroll storytelling ---------- */
const hint = document.getElementById('wrong-hint');
function setFix(v) {
  fixState.v = v;
  const done = v > 0.95;
  hint.classList.toggle('fixed', done);
  hint.innerHTML = done ? '<i></i> Fixed. <b>That\'s what I do.</b>' : '<i></i> One bar is wrong. <b>Keep scrolling to fix it.</b>';
}

window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (!hasGsap || reduceMotion) { loader.remove(); setFix(1); return; }
  gsap.registerPlugin(ScrollTrigger);

  // intro: loader out, wordmark slides up, photo reveals
  const tl = gsap.timeline();
  tl.to(loader, { yPercent: -100, duration: 0.8, ease: 'power4.inOut', delay: 0.6, onComplete: () => loader.remove() })
    .from('.wm', { yPercent: 110, duration: 1.1, stagger: 0.12, ease: 'power4.out' }, '-=0.3')
    .from('.hero-line, .hero-side', { opacity: 0, y: 30, duration: 0.8, stagger: 0.1 }, '-=0.6')
    .from('.hero-photo', { clipPath: 'inset(100% 0 0 0)', duration: 1.1, ease: 'power3.out' }, '-=0.9');

  // hero photo zoom-out + wordmark drift
  const heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('.hero-photo img', { scale: 1, ease: 'none', scrollTrigger: heroST });
  const drift = innerWidth < 700 ? 2 : 6; // small drift on phones so the surname never clips
  gsap.to('.wm-line:first-child .wm', { xPercent: -drift, ease: 'none', scrollTrigger: { ...heroST } });
  gsap.to('.wm-line:nth-child(2) .wm', { xPercent: drift, ease: 'none', scrollTrigger: { ...heroST } });

  // words come into focus as you read
  document.querySelectorAll('.focus-text').forEach(p => {
    gsap.to(p.querySelectorAll('.w'), { opacity: 1, filter: 'blur(0px)', stagger: 0.05, ease: 'none',
      scrollTrigger: { trigger: p, start: 'top 85%', end: 'bottom 55%', scrub: true } });
  });

  gsap.utils.toArray('.ch-photo img').forEach(img => {
    gsap.to(img, { scale: 1, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // receipt prints line by line
  gsap.from('.r-row, .r-cut', { opacity: 0, x: -14, stagger: 0.12, duration: 0.4, scrollTrigger: { trigger: '.receipt', start: 'top 75%' } });

  // the wrong number gets fixed as you scroll through chapter 3
  ScrollTrigger.create({ trigger: '#wrong', start: 'top 60%', end: 'bottom 70%', scrub: true, onUpdate: s => setFix(s.progress) });

  // statement lines slide in from opposite sides
  const stST = { trigger: '.statement', start: 'top bottom', end: 'center center', scrub: true };
  gsap.from('.big-1', { xPercent: -40, ease: 'none', scrollTrigger: stST });
  gsap.from('.big-2', { xPercent: 40, ease: 'none', scrollTrigger: { ...stST } });

  // cards and desk items rise in
  gsap.utils.toArray('.job, .widget, .folder, .app, .case, .console, .lede, .contact > *:not(.cform), .cform').forEach(el => {
    gsap.from(el, { opacity: 0, y: 40, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  gsap.from('.bar i', { width: 0, duration: 1.4, ease: 'power2.out', scrollTrigger: { trigger: '.bar', start: 'top 90%' } });

});
