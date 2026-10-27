// Chapter 02: the receipt prints as you scroll, tears at the dotted line, and hides one wrong line.
(function () {
  const rc = document.getElementById('receipt');
  if (!rc) return;

  /* ---------- the game: find the line that is wrong ---------- */
  const msg = document.getElementById('r-msg');
  const items = rc.querySelectorAll('.r-item');
  let wrong = 0, solved = false;

  function say(text, ok) { msg.textContent = text; msg.classList.toggle('ok', !!ok); }

  items.forEach(btn => btn.addEventListener('click', () => {
    if (solved) return;
    if (btn.dataset.dup) {
      solved = true;
      rc.classList.add('solved');
      document.getElementById('r-total').textContent = '9.35';
      document.getElementById('r-charged').textContent = '3';
      items.forEach(b => { b.disabled = true; });
      say('Found it. The same shampoo was scanned twice at 17:04:11, so 3.20 was charged twice and 4 items were charged for 3 in the bag. The correct total is 9.35. Duplicates are the first thing I check for.', true);
    } else {
      wrong++;
      btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake');
      say(wrong > 1 ? 'That one adds up too. Look for a line that appears twice.' : 'That one adds up.');
    }
  }));

  /* ---------- the print and tear animation ---------- */
  const root = document.documentElement;
  if (root.classList.contains('reduce') || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  window.addEventListener('load', () => {
    const lines = rc.querySelectorAll('.r-top .r-row');
    const items4 = rc.querySelectorAll('.r-item');
    const counts = rc.querySelectorAll('.r-count, .r-total');
    const dataRows = rc.querySelectorAll('.r-bottom .r-row');
    const cancel = document.getElementById('r-cancel');
    const words = document.querySelectorAll('#receipt-ch .focus-text .w');
    const body = document.querySelector('#receipt-ch .body');
    const counter = { v: 0 };

    // start state: only the header is printed
    gsap.set([...items4, ...counts, ...dataRows, '.r-cut'], { autoAlpha: 0, y: -16 });
    gsap.set(body, { opacity: 0.25 });
    cancel.textContent = '0.0%';

    function build() {
      const tl = gsap.timeline({ defaults: { ease: 'none' } });
      tl.to(words, { opacity: 1, filter: 'blur(0px)', stagger: 0.012, duration: 0.2 }, 0)
        .to(items4, { autoAlpha: 1, y: 0, stagger: 0.05, duration: 0.08 }, 0.05)
        .to(counts, { autoAlpha: 1, y: 0, stagger: 0.05, duration: 0.08 }, 0.3)
        .to('.r-cut', { autoAlpha: 1, y: 0, duration: 0.06 }, 0.48)
        .add(() => rc.classList.add('glow'), 0.5)
        .to(rc, { '--tear': 1, duration: 0.1 }, 0.55)
        .to('.r-bottom', { x: 24, rotation: 1.5, duration: 0.15 }, 0.55)
        .to(dataRows, { autoAlpha: 1, y: 0, stagger: 0.04, duration: 0.08 }, 0.75)
        .to(counter, { v: 7.5, duration: 0.2, onUpdate: () => { cancel.textContent = counter.v.toFixed(1) + '%'; } }, 0.78)
        .to(body, { opacity: 1, duration: 0.15 }, 0.8);
      // the glow class has to switch off again when scrolling back up
      tl.eventCallback('onReverseComplete', () => rc.classList.remove('glow'));
      return tl;
    }

    const mm = gsap.matchMedia();

    // desktop: pinned and scrubbed, about 120% of a screen of scrolling
    mm.add('(min-width: 961px) and (min-height: 700px)', () => {
      const tl = build();
      ScrollTrigger.create({
        trigger: '#receipt-ch .ch-grid', start: 'center center', end: '+=120%',
        pin: true, scrub: 0.4, animation: tl, anticipatePin: 1,
        onUpdate: s => rc.classList.toggle('glow', s.progress > 0.5 && s.progress < 0.9)
      });
    });

    // phones, tablets and short screens: no pinning, it prints once when it comes into view
    mm.add('(max-width: 960px), (max-height: 699px)', () => {
      const tl = build().pause();
      tl.duration(3.4);
      ScrollTrigger.create({ trigger: rc, start: 'top 70%', once: true, onEnter: () => tl.play() });
    });
  });
})();
