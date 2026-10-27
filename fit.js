// Job-fit checker. Runs entirely in the browser: the pasted text is never sent anywhere or stored.
// It counts mentions of skills from a small dictionary and sorts them into three honest buckets.
(function () {
  const box = document.getElementById('fit-text');
  if (!box) return;

  // bucket: strong (evidence on my CV or site), learning (in progress or not used on real work), gap (not yet)
  // w: weight of one mention (tools count double)
  const S = [
    { id: 'sql', label: 'SQL', w: 2, b: 'strong', t: ['sql', 'postgres', 'postgresql', 't-sql', 'tsql', 'mysql', 'sql server', 'sqlite', 'plsql', 'pl/sql'],
      ev: 'Wrote SQL on a live database at Atheon (ETL with checks at every step); optimised SQL on 100,000+ records at ByVal; 10 queries in The Real Price.', link: '#work' },
    { id: 'powerbi', label: 'Power BI', w: 2, b: 'strong', t: ['power bi', 'powerbi', 'dax', 'power query'],
      ev: 'Helped turn a manual report into a live Power BI dashboard at Atheon (about 30% less reporting time).', link: '#work' },
    { id: 'excel', label: 'Excel', w: 2, b: 'strong', t: ['excel', 'spreadsheet', 'spreadsheets', 'pivot table', 'pivot tables', 'xlookup', 'vlookup', 'google sheets'],
      ev: 'Pivot tables and XLOOKUP in daily use; a what-if workbook with live formulas in The Real Price.', link: '#case2' },
    { id: 'python', label: 'Python', w: 2, b: 'strong', t: ['python', 'pandas', 'numpy', 'jupyter'],
      ev: 'Pandas scripts to merge sources and flag bad data at Atheon; Python automation at ByVal (about 25% less manual work).', link: '#work' },
    { id: 'tableau', label: 'Tableau', w: 2, b: 'strong', t: ['tableau'],
      ev: 'Built a 5-view Tableau dashboard in my retail order cancellation project.', link: '#case1' },
    { id: 'etl', label: 'ETL and data pipelines', w: 1, b: 'strong', t: ['etl', 'data pipeline', 'data pipelines', 'pipelines', 'data integration', 'api ingestion', 'data ingestion'],
      ev: 'Extract, clean and load with validation at Atheon; pipelines and API ingestion at ByVal.', link: '#work' },
    { id: 'dq', label: 'Data quality and reconciliation', w: 1, b: 'strong', t: ['data quality', 'reconciliation', 'reconcile', 'reconciling', 'data cleaning', 'data cleansing', 'data validation', 'data integrity', 'root cause', 'root-cause'],
      ev: 'Reconciled sales, revenue and cost figures and traced every mismatch to its source at Atheon.', link: '#work' },
    { id: 'viz', label: 'Dashboards and reporting', w: 1, b: 'strong', t: ['dashboard', 'dashboards', 'reporting', 'visualisation', 'visualization', 'visualisations', 'visualizations', 'kpi', 'kpis'],
      ev: 'Live dashboard at Atheon; interactive dashboard and Spending Wrapped story in The Real Price.', link: '#case2' },
    { id: 'comms', label: 'Explaining data to stakeholders', w: 1, b: 'strong', t: ['stakeholder', 'stakeholders', 'storytelling', 'data storytelling', 'presentation', 'presentations', 'presenting', 'non-technical', 'communication skills'],
      ev: 'Presented findings to managers and non-technical colleagues in plain English, ending with a recommendation.', link: '#work' },
    { id: 'retail', label: 'Retail and FMCG', w: 1, b: 'strong', t: ['retail', 'fmcg', 'grocery', 'supermarket', 'consumer goods', 'cpg', 'in-store', 'merchandising'],
      ev: 'Two years of shifts at Tesco and now M&S: I see where retail data is created.', link: '#work' },
    { id: 'stats', label: 'Statistics and forecasting', w: 1, b: 'strong', t: ['statistics', 'statistical', 'hypothesis testing', 'forecasting', 'forecast', 'regression', 'statistical significance'],
      ev: 'Permutation test for the payday effect in The Real Price; forecasting in Python.', link: '#case2' },
    { id: 'git', label: 'Git and GitHub', w: 1, b: 'strong', t: ['git', 'github', 'version control'],
      ev: 'Projects published on GitHub with READMEs and reproducible code.', link: 'https://github.com/Prani8', ext: true },

    { id: 'dbt', label: 'dbt', w: 2, b: 'learning', t: ['dbt', 'data build tool'],
      ev: 'Learning it now as part of a move towards analytics engineering. Not used on live work yet.' },
    { id: 'ml', label: 'Machine learning', w: 1, b: 'learning', t: ['machine learning', 'scikit-learn', 'sklearn', 'predictive modelling', 'predictive modeling', 'predictive analytics'],
      ev: 'Used scikit-learn in my MSc dissertation (predicting client behaviour). Not used in a job yet.' },
    { id: 'ab', label: 'A/B testing', w: 1, b: 'learning', t: ['a/b test', 'a/b testing', 'ab testing', 'experimentation', 'experiment design'],
      ev: 'I have run a permutation test on my own data; I have not run live experiments.' },
    { id: 'aws', label: 'AWS', w: 2, b: 'learning', t: ['aws', 'amazon web services', 'redshift', 's3'],
      ev: 'AWS Certified Solutions Architect – Associate. I have not used AWS for data work on a live project.' },

    { id: 'snowflake', label: 'Snowflake', w: 2, b: 'gap', t: ['snowflake'], ev: 'Not yet.' },
    { id: 'bigquery', label: 'BigQuery and Google Cloud', w: 2, b: 'gap', t: ['bigquery', 'google cloud', 'gcp'], ev: 'Not yet.' },
    { id: 'azure', label: 'Azure and Synapse', w: 2, b: 'gap', t: ['azure', 'synapse', 'data factory'], ev: 'Not yet.' },
    { id: 'databricks', label: 'Databricks and Spark', w: 2, b: 'gap', t: ['databricks', 'spark', 'pyspark', 'hadoop'], ev: 'Not yet.' },
    { id: 'airflow', label: 'Airflow and orchestration', w: 2, b: 'gap', t: ['airflow', 'dagster', 'prefect', 'orchestration'], ev: 'Not yet.' },
    { id: 'looker', label: 'Looker and LookML', w: 2, b: 'gap', t: ['looker', 'lookml'], ev: 'Not yet.' },
    { id: 'qlik', label: 'Qlik', w: 2, b: 'gap', t: ['qlik', 'qlikview', 'qlik sense'], ev: 'Not yet.' },
    { id: 'alteryx', label: 'Alteryx', w: 2, b: 'gap', t: ['alteryx'], ev: 'Not yet.' },
    { id: 'sas', label: 'SAS and SPSS', w: 2, b: 'gap', t: ['sas', 'spss'], ev: 'Not yet.' },
    { id: 'r', label: 'R', w: 2, b: 'gap', t: ['rstudio', 'r programming', 'r language', 'tidyverse'], ev: 'Not yet.' },
    { id: 'msbi', label: 'SSIS, SSRS and SSAS', w: 2, b: 'gap', t: ['ssis', 'ssrs', 'ssas'], ev: 'Not yet.' },
    { id: 'oracle', label: 'Oracle', w: 2, b: 'gap', t: ['oracle'], ev: 'Not yet.' }
  ];

  const esc = t => t.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
  S.forEach(s => { s.re = new RegExp('(^|[^a-z0-9+#])(' + s.t.map(esc).join('|') + ')(?![a-z0-9+#])', 'gi'); });

  const EXAMPLE = 'Junior Data Analyst, Retail Insights\n\nWe are looking for a Junior Data Analyst to join our commercial insights team. You will use SQL and Power BI to build dashboards and weekly reporting for category managers, clean and reconcile data from several systems, and present findings to non-technical stakeholders. Python or Excel for ad hoc analysis is expected. Experience in retail or FMCG is a plus, as is exposure to Snowflake or dbt. You will report to the Head of Insights and work closely with stakeholders across the business.';

  const out = document.getElementById('fit-out'), msg = document.getElementById('fit-msg');
  const role = document.getElementById('fit-role');
  let last = null;

  function analyse(text) {
    const found = [];
    S.forEach(s => { const n = (text.match(s.re) || []).length; if (n) found.push({ s, n, w: s.w * Math.min(n, 5) }); });
    const sum = b => found.filter(f => f.s.b === b).reduce((a, f) => a + f.w, 0);
    const st = sum('strong'), le = sum('learning'), ga = sum('gap'), total = st + le + ga;
    const pct = total ? Math.round(100 * (st + 0.4 * le) / total) : null;
    const senior = /\b(senior|principal|staff|lead)\s+(data|business|bi|analytics|insight|insights|analyst|engineer|scientist)/i.test(text) || /\b([4-9]|1\d)\s*\+?\s*years?[^.]{0,40}experience/i.test(text) || /experience[^.]{0,40}\b([4-9]|1\d)\s*\+?\s*years?/i.test(text);
    return { found, st, le, ga, total, pct, senior };
  }

  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function bucket(title, cls, items) {
    const col = el('section', 'fit-col ' + cls);
    col.appendChild(el('h4', null, title + ' (' + items.length + ')'));
    if (!items.length) { col.appendChild(el('p', 'fit-none', 'Nothing in this ad.')); return col; }
    items.sort((a, b) => b.w - a.w).forEach(f => {
      const row = el('div', 'fit-item');
      const top = el('div', 'fit-name');
      top.appendChild(el('b', null, f.s.label));
      top.appendChild(el('span', null, f.n > 1 ? 'mentioned ' + f.n + '×' : 'mentioned once'));
      row.appendChild(top);
      row.appendChild(el('p', null, f.s.ev));
      if (f.s.link) {
        const a = el('a', null, f.s.ext ? 'See my GitHub →' : 'See the evidence →');
        a.href = f.s.link; if (f.s.ext) { a.target = '_blank'; a.rel = 'noopener'; }
        row.appendChild(a);
      }
      col.appendChild(row);
    });
    return col;
  }

  function summaryText(r, title) {
    const L = [];
    const list = (b, head) => { const it = r.found.filter(f => f.s.b === b).sort((a, c) => c.w - a.w); L.push('', head); if (!it.length) L.push('- none in this ad'); it.forEach(f => L.push('- ' + f.s.label + ' (mentioned ' + f.n + 'x): ' + f.s.ev)); };
    L.push('Praneet Sivakumar · Data Analyst', 'Fit summary for: ' + (title || 'this role'), 'Keyword match: ' + r.pct + '% (a keyword match, not a hiring decision)');
    list('strong', 'STRONG, WITH EVIDENCE'); list('learning', 'LEARNING'); list('gap', 'NOT YET');
    L.push('', 'ABOUT ME', 'MSc Data Science with Distinction (University of Hertfordshire). Six-month Data Analyst internship at Atheon Analytics: SQL ETL on a live database, a live Power BI dashboard (about 30% less reporting time), and reconciliation of sales, revenue and cost figures. Two years in retail at Tesco and now M&S.',
      '', 'CONTACT', 'praneetsivakumar@hotmail.com · linkedin.com/in/praneetsivakumar · www.praneetsivakumar.com',
      '', 'Made in the visitor\'s browser at praneetsivakumar.com. The job description was not uploaded or stored.');
    return L.join('\n');
  }

  function render(r) {
    out.innerHTML = '';
    if (!r.total) {
      out.appendChild(el('p', 'fit-empty', 'I could not find any skills from my list in that text. Paste the full job description, including the requirements section.'));
      return;
    }
    const verdict = r.pct >= 70 ? 'Strong keyword match' : r.pct >= 45 ? 'Partial keyword match' : 'Stretch on keywords';
    const head = el('div', 'fit-head');
    const big = el('div', 'fit-score'); big.appendChild(el('b', null, r.pct + '%')); big.appendChild(el('span', null, verdict));
    head.appendChild(big);
    const bar = el('div', 'fit-bar'); const fill = el('i'); bar.appendChild(fill); head.appendChild(bar);
    out.appendChild(head);
    setTimeout(() => { fill.style.width = r.pct + '%'; }, 40);
    if (r.senior) out.appendChild(el('p', 'fit-warn', 'Heads up: this ad mentions seniority or several years of experience. I am early in my career (a six-month data internship plus two years in retail), so this may be a stretch.'));
    const cols = el('div', 'fit-cols');
    cols.appendChild(bucket('Strong, with evidence', 'strong', r.found.filter(f => f.s.b === 'strong')));
    cols.appendChild(bucket('Learning', 'learning', r.found.filter(f => f.s.b === 'learning')));
    cols.appendChild(bucket('Not yet', 'gap', r.found.filter(f => f.s.b === 'gap')));
    out.appendChild(cols);

    const title = role.value.trim();
    const actions = el('div', 'fit-actions');
    const dl = el('button', 'btn', 'Download my fit summary'); dl.type = 'button';
    dl.addEventListener('click', () => {
      const blob = new Blob([summaryText(r, title)], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'Praneet_Sivakumar_fit_summary.txt';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    const mail = el('a', 'btn ghost', 'Email Praneet about this role');
    const subject = 'About your ' + (title || 'data analyst') + ' role';
    const body = 'Hi Praneet,\n\nI used your fit checker (' + r.pct + '% keyword match) for ' + (title || 'a role') + '. I would like to talk about it.\n\n';
    mail.href = 'mailto:praneetsivakumar@hotmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    actions.appendChild(dl); actions.appendChild(mail);
    out.appendChild(actions);

    const how = el('details', 'fit-how');
    how.appendChild(el('summary', null, 'How this is calculated'));
    how.appendChild(el('p', null, 'I count how often each skill from a small list of about 35 appears in the text (mentions are capped at 5 per skill, and tools like SQL count double). Strong skills score in full, learning skills score 40%, and gaps score nothing. The percentage is that score divided by everything I found in the ad. Words that are not in my list are ignored, so a short list of tools will swing the number a lot.'));
    out.appendChild(how);
    out.appendChild(el('p', 'fit-foot', 'This is a keyword match, not a hiring decision. It runs in your browser: your text is not sent anywhere or stored.'));
    last = r;
    msg.textContent = 'Result: ' + r.pct + '% keyword match. ' + r.found.filter(f => f.s.b === 'strong').length + ' strong, ' + r.found.filter(f => f.s.b === 'learning').length + ' learning, ' + r.found.filter(f => f.s.b === 'gap').length + ' not yet.';
  }

  document.getElementById('fit-run').addEventListener('click', () => {
    const t = box.value.trim();
    if (t.length < 150) { out.innerHTML = ''; out.appendChild(el('p', 'fit-empty', 'That is a bit short. Paste the whole job description (at least a few sentences) so the result means something.')); msg.textContent = ''; return; }
    render(analyse(t));
  });
  document.getElementById('fit-example').addEventListener('click', () => { box.value = EXAMPLE; role.value = 'Junior Data Analyst'; document.getElementById('fit-run').click(); });
  document.getElementById('fit-clear').addEventListener('click', () => { box.value = ''; role.value = ''; out.innerHTML = ''; msg.textContent = ''; box.focus(); });
})();
