// Chapter 04: "Ask my data". Two datasets, each question shows the SQL, the answer, a mini chart and why it matters.
// Answers are pre-computed (nothing is queried live). Spending numbers come from the Real Price notebook and are SIMULATED data.
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const kw = s => `<span class="kw">${s}</span>`, fn = s => `<span class="fn">${s}</span>`;
  const hl = s => `<span class="hl">${s}</span>`, ok = s => `<span class="ok">${s}</span>`;

  const SETS = {
    retail: {
      file: 'praneet@analytics: ~/retail_orders.sql',
      scanned: '15,042 rows scanned',
      note: 'Sample retail dataset, 15,000+ rows. Answers are pre-computed from my project notebook.',
      qs: [
        { q: 'Why are orders cancelled?',
          sql: `${kw('SELECT')} category, ${fn('ROUND')}(${fn('AVG')}(is_cancelled)*100, 1) ${kw('AS')} cancel_rate\n${kw('FROM')} orders ${kw('GROUP BY')} category\n${kw('ORDER BY')} cancel_rate ${kw('DESC LIMIT')} 1;`,
          out: `category          | cancel_rate\n------------------+------------\n${hl('Health &amp; Beauty   | 10.0%')}\n\n${ok('✔ Insight:')} overall 7.5% (1 in 13 orders). Health &amp; Beauty is the outlier.\n${ok('✔ Action:')} fix stock accuracy there first.`,
          why: 'Fixing stock in the worst category saves the most orders, so that is where I would start.',
          chart: { fmt: v => v.toFixed(1) + '%', rows: [['All orders', 7.5], ['Health & Beauty', 10.0, 1]] } },
        { q: 'Do loyalty members spend more?',
          sql: `${kw('SELECT')} is_loyalty_member, ${fn('AVG')}(order_value) ${kw('AS')} avg_basket\n${kw('FROM')} orders ${kw('GROUP BY')} is_loyalty_member;`,
          out: `is_loyalty_member | avg_basket\n------------------+-----------\nfalse             | baseline\n${hl('true              | +8%')}\n\n${ok('✔ Insight:')} loyalty-card members spend 8% more per order.\n${ok('✔ Action:')} target sign-ups at the till.`,
          why: 'A sign-up at the till has a measurable return, so it is worth a conversation with every customer.',
          chart: { fmt: v => String(v), rows: [['Non-members (index)', 100], ['Loyalty members (index)', 108, 1]] } },
        { q: 'When is the peak?',
          sql: `${kw('SELECT')} month, revenue / ${fn('AVG')}(revenue) ${kw('OVER')} () - 1 ${kw('AS')} vs_avg\n${kw('FROM')} monthly_sales\n${kw('ORDER BY')} vs_avg ${kw('DESC LIMIT')} 1;`,
          out: `month | vs_avg\n------+-------\n${hl('Dec   | +21%')}\n\n${ok('✔ Insight:')} December trades 21% above the monthly average.\n${ok('✔ Action:')} build stock and time promotions before the peak.`,
          why: 'Stock and promotions have to be ready before December, not during it.',
          chart: { fmt: v => String(v), rows: [['Average month (index)', 100], ['December (index)', 121, 1]] } },
        { q: 'Who is Praneet?',
          sql: `${kw('SELECT')} * ${kw('FROM')} analysts ${kw('WHERE')} name = 'Praneet Sivakumar';`,
          out: `role         | Data Analyst (retail &amp; FMCG)\neducation    | MSc Data Science, ${hl('Distinction')}\nexperience   | Atheon Analytics · Tesco · M&amp;S · ByVal\ntools        | SQL, Power BI, Python, Excel\nsuperpower   | ${hl('finds the wrong number before it reaches the report')}\nstatus       | ${ok('open_to_work = TRUE')}\n\n1 row returned.`,
          why: 'Looking for a junior data analyst role in retail or FMCG.' }
      ]
    },
    spend: {
      file: 'praneet@analytics: ~/the_real_price.sql',
      scanned: '707 transactions scanned',
      note: 'The Real Price: my own spending, 1 Jan to 25 Oct 2026. The transactions are SIMULATED; the method and code are real (see Case 02). Answers are pre-computed from the project notebook.',
      qs: [
        { q: 'Where does my money go?',
          sql: `${kw('SELECT')} spend_type, ${fn('COUNT')}(*) ${kw('AS')} transactions,\n       ${fn('ROUND')}(${fn('SUM')}(amount_gbp), 2) ${kw('AS')} spend_gbp,\n       ${fn('ROUND')}(100.0 * ${fn('SUM')}(amount_gbp) / ${fn('SUM')}(${fn('SUM')}(amount_gbp)) ${kw('OVER')} (), 1) ${kw('AS')} pct\n${kw('FROM')} transactions ${kw('WHERE')} direction = 'Debit'\n${kw('GROUP BY')} spend_type ${kw('ORDER BY')} spend_gbp ${kw('DESC')};`,
          out: `spend_type | transactions | spend_gbp | pct\n-----------+--------------+-----------+-----\nEssential  |          146 |  9,665.26 | 52.5\nLifestyle  |          437 |  6,528.26 | 35.5\n${hl('Leakage    |           76 |  1,452.65 |  7.9')}\nInvestment |           26 |    756.83 |  4.1\n\n${ok('✔ Insight:')} £18,246 in total. At £12.71 an hour that is 1,436 hours of work.`,
          why: 'Leakage is only 8% of what I spend, but it is the 8% that gives nothing back.',
          chart: { fmt: v => '£' + Math.round(v).toLocaleString('en-GB'), rows: [['Essential', 9665.26], ['Lifestyle', 6528.26], ['Leakage', 1452.65, 1], ['Investment', 756.83]] } },
        { q: 'When do I overspend?',
          sql: `${kw('SELECT')} payday_window, ${fn('COUNT')}(*) ${kw('AS')} calendar_days,\n       ${fn('ROUND')}(${fn('AVG')}(${fn('COALESCE')}(spend, 0)), 2) ${kw('AS')} avg_discretionary_per_day\n${kw('FROM')} day_bucket ${kw('LEFT JOIN')} daily ${kw('ON')} daily.date = day_bucket.d\n${kw('GROUP BY')} payday_window;\n${'<span class="muted">-- simplified from sql/06_why_payday_effect.sql (the full file builds the calendar with a recursive CTE)</span>'}`,
          out: `payday_window         | calendar_days | avg_per_day\n----------------------+---------------+------------\n${hl('0-3 days after payday |            62 |      £34.90')}\n4-10 days             |            85 |      £21.67\n11+ days              |           143 |      £21.45\n\n${ok('✔ Insight:')} 1.6x more per day just after payday. A permutation test says the chance this is luck is 0.08%.`,
          why: 'It is an association, not proof of cause, but it tells me exactly when to put a guard rail up.',
          chart: { fmt: v => '£' + v.toFixed(2), rows: [['0-3 days after payday', 34.90, 1], ['4-10 days', 21.67], ['11+ days', 21.45]] } },
        { q: 'Do shift days trigger takeaways?',
          sql: `${kw('SELECT')} ${kw('CASE WHEN')} shift_day = 'True' ${kw('THEN')} 'Shift day' ${kw('ELSE')} 'Non-shift day' ${kw('END')} ${kw('AS')} day_type,\n       ${fn('COUNT')}(*) ${kw('AS')} takeaway_orders,\n       ${fn('ROUND')}(${fn('SUM')}(amount_gbp), 2) ${kw('AS')} takeaway_spend_gbp,\n       ${fn('SUM')}(${kw('CASE WHEN')} hour >= 21 ${kw('OR')} hour < 5 ${kw('THEN')} 1 ${kw('ELSE')} 0 ${kw('END')}) ${kw('AS')} orders_after_9pm\n${kw('FROM')} transactions ${kw('WHERE')} subcategory = 'Takeaway delivery'\n${kw('GROUP BY')} day_type;`,
          out: `day_type      | takeaway_orders | takeaway_spend_gbp | orders_after_9pm\n--------------+-----------------+--------------------+-----------------\nNon-shift day |              24 |             546.07 |                5\n${hl('Shift day     |              39 |             902.92 |               39')}\n\n${ok('✔ Insight:')} every one of the 39 shift-day takeaways came after 9pm. £902.92 is 71 hours of work, about 9.5 shifts.`,
          why: 'I was working shifts to pay for being too tired to cook, so the fix is meal prep on shift days, not willpower.',
          chart: { fmt: v => String(v), rows: [['Non-shift days', 5], ['Shift days', 39, 1]], caption: 'Takeaways ordered after 9pm' } },
        { q: 'What would I change?',
          sql: `${kw('SELECT')} merchant, months_charged, monthly_price_gbp,\n       ${fn('ROUND')}(monthly_price_gbp * 12, 2) ${kw('AS')} cost_per_year_gbp,\n       ${kw('CASE WHEN')} spend_type = 'Leakage' ${kw('THEN')} 'CANCEL' ${kw('ELSE')} 'keep / review' ${kw('END')} ${kw('AS')} action\n${kw('FROM')} recurring ${kw('ORDER BY')} action, cost_per_year_gbp ${kw('DESC')};\n${'<span class="muted">-- rule 1 of 5 (sql/10_solution_zombie_subscriptions.sql); the other four rules are modelled in the notebook</span>'}`,
          out: `merchant   | months | monthly | per_year | action\n-----------+--------+---------+----------+-------\n${hl('Disney+    |     10 |    5.99 |    71.88 | CANCEL')}\n${hl('Google One |     10 |    1.99 |    23.88 | CANCEL')}\n\n${ok('✔ Insight:')} five rules save £1,665 a year (131 hours of work).\n${ok('✔ Result:')} the date my savings run out moves from 15 Mar 2027 to 21 May 2027.`,
          why: 'Five small rules buy me about ten extra weeks, and the biggest one is a meal-prep habit, not a spreadsheet.',
          chart: { fmt: v => '£' + Math.round(v).toLocaleString('en-GB'), rows: [['Shift-day meals', 1002.81, 1], ['Late-night basket rule', 289.21], ['Top-up trips', 145.68], ['Bulk protein', 131.11], ['Cancel zombie subs', 95.76]], caption: 'Saving per year, by rule' } }
      ]
    }
  };

  const out = document.getElementById('console-out');
  if (!out) return;
  const qBox = document.getElementById('console-q'), chart = document.getElementById('console-chart');
  const why = document.getElementById('console-why'), note = document.getElementById('console-note');
  const file = document.getElementById('console-file');
  const setBtns = document.querySelectorAll('.console-sets button');
  let typing = null, runTimer = null, current = 'retail';

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function clearOutput() {
    clearInterval(typing); clearTimeout(runTimer);
    out.innerHTML = '<span class="muted">-- pick a question above to run a query</span>';
    chart.innerHTML = ''; why.textContent = '';
  }

  function renderSet(name) {
    current = name;
    const s = SETS[name];
    file.textContent = s.file;
    note.textContent = s.note;
    setBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.set === name)));
    qBox.innerHTML = '';
    s.qs.forEach((item, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = item.q; b.dataset.i = i;
      b.addEventListener('click', () => run(i));
      qBox.appendChild(b);
    });
    clearOutput();
  }

  function drawChart(c) {
    chart.innerHTML = '';
    if (!c) return;
    const max = Math.max(...c.rows.map(r => r[1]));
    if (c.caption) { const cap = document.createElement('div'); cap.className = 'cc-row'; cap.style.display = 'block'; cap.textContent = c.caption; chart.appendChild(cap); }
    c.rows.forEach(([label, v, hi]) => {
      const row = document.createElement('div');
      row.className = 'cc-row' + (hi ? ' hl' : '');
      row.innerHTML = `<span>${esc(label)}</span><span class="cc-bar"><i></i></span><b>${esc(c.fmt(v))}</b>`;
      chart.appendChild(row);
      const bar = row.querySelector('i');
      if (reduceMotion) bar.style.width = (v / max * 100) + '%';
      else setTimeout(() => { bar.style.width = (v / max * 100) + '%'; }, 40);
    });
  }

  function finish(item) {
    out.innerHTML = `> ${item.sql}\n\n${item.out}`;
    drawChart(item.chart);
    why.innerHTML = `<b>Why it matters:</b> ${item.why}`;
  }

  function run(i) {
    const s = SETS[current], item = s.qs[i];
    qBox.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.i === i));
    clearInterval(typing); clearTimeout(runTimer);
    chart.innerHTML = ''; why.textContent = '';
    if (reduceMotion) { finish(item); return; }
    const plain = item.sql.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
    let n = 0;
    typing = setInterval(() => {
      n += 3;
      out.textContent = '> ' + plain.slice(0, n);
      if (n >= plain.length) {
        clearInterval(typing);
        out.innerHTML = `> ${item.sql}\n\n<span class="muted">running… ${s.scanned}</span>`;
        runTimer = setTimeout(() => finish(item), 500);
      }
    }, 16);
  }

  setBtns.forEach(b => b.addEventListener('click', () => { if (b.dataset.set !== current) renderSet(b.dataset.set); }));
  renderSet('retail');
})();
