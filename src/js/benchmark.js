'use strict';

// Размеры выборок
const SIZES = [1000, 10000];
// Коэффициент t для уровня надёжности 95% (нормальное приближение, n >= 30)
const T_95 = 1.96;

const sandbox = document.getElementById('sandbox');
const statusEl = document.getElementById('status');
const tbody = document.querySelector('#results tbody');

// Заранее подготовленные HTML-строки, чтобы не создавать их внутри замера
const htmlCache = {};
function getHtml(n) {
  if (!htmlCache[n]) {
    let s = '';
    for (let i = 0; i < n; i++) s += '<div class="item">Элемент ' + i + '</div>';
    htmlCache[n] = s;
  }
  return htmlCache[n];
}

/* ---------- Методы добавления ---------- */
const addMethods = {
  appendChild(container, n) {
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'item';
      el.textContent = 'Элемент ' + i;
      container.appendChild(el);
    }
  },
  DocumentFragment(container, n) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'item';
      el.textContent = 'Элемент ' + i;
      frag.appendChild(el);
    }
    container.appendChild(frag);
  },
  innerHTML(container, n) {
    container.innerHTML = getHtml(n);
  },
  insertAdjacentHTML(container, n) {
    container.insertAdjacentHTML('beforeend', getHtml(n));
  },
  'append(...nodes)'(container, n) {
    const nodes = new Array(n);
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'item';
      el.textContent = 'Элемент ' + i;
      nodes[i] = el;
    }
    container.append(...nodes);
  },
  'cloneNode(template)'(container, n) {
    const tpl = document.createElement('div');
    tpl.className = 'item';
    tpl.textContent = 'Элемент';
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) frag.appendChild(tpl.cloneNode(true));
    container.appendChild(frag);
  },
};

/* ---------- Методы удаления ---------- */
const removeMethods = {
  "innerHTML = ''"(container) {
    container.innerHTML = '';
  },
  'removeChild (цикл)'(container) {
    while (container.firstChild) container.removeChild(container.firstChild);
  },
  'replaceChildren()'(container) {
    container.replaceChildren();
  },
  'textContent = ""'(container) {
    container.textContent = '';
  },
  'lastChild.remove() (цикл)'(container) {
    while (container.lastChild) container.lastChild.remove();
  },
};

/* ---------- Статистика ---------- */
function stats(samples) {
  const n = samples.length;
  const mean = samples.reduce((a, b) => a + b, 0) / n;
  const variance = samples.reduce((a, x) => a + (x - mean) ** 2, 0) / (n - 1);
  const sd = Math.sqrt(variance);
  const delta = (T_95 * sd) / Math.sqrt(n);
  return { n, mean, sd, low: mean - delta, high: mean + delta };
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// Каждая итерация — в новом изолированном контейнере
function freshContainer() {
  sandbox.replaceChildren();
  const c = document.createElement('div');
  sandbox.appendChild(c);
  return c;
}

async function benchAdd(fn, n, iterations, warmup) {
  const samples = [];
  for (let i = 0; i < warmup + iterations; i++) {
    const c = freshContainer();
    const t0 = performance.now();
    fn(c, n);
    const t1 = performance.now();
    if (i >= warmup) samples.push(t1 - t0);
    sandbox.replaceChildren();
    if (i % 5 === 0) await pause(0);
  }
  return samples;
}

async function benchRemove(fn, n, iterations, warmup) {
  const samples = [];
  for (let i = 0; i < warmup + iterations; i++) {
    const c = freshContainer();
    addMethods.DocumentFragment(c, n); // подготовка вне замера
    const t0 = performance.now();
    fn(c);
    const t1 = performance.now();
    if (i >= warmup) samples.push(t1 - t0);
    if (i % 5 === 0) await pause(0);
  }
  return samples;
}

const fmt = (x) => x.toFixed(4);

function addRow(r) {
  const tr = document.createElement('tr');
  [r.op, r.method, r.size, r.n, fmt(r.mean), fmt(r.sd), `[${fmt(r.low)}; ${fmt(r.high)}]`].forEach((v) => {
    const td = document.createElement('td');
    td.textContent = v;
    tr.appendChild(td);
  });
  tbody.appendChild(tr);
}

function toMarkdown(results) {
  let md = '| Операция | Метод | N элементов | Повторений | Среднее, мс | σ, мс | ДИ 95%, мс |\n';
  md += '|---|---|---:|---:|---:|---:|---|\n';
  for (const r of results) {
    md += `| ${r.op} | \`${r.method}\` | ${r.size} | ${r.n} | ${fmt(r.mean)} | ${fmt(r.sd)} | [${fmt(r.low)}; ${fmt(r.high)}] |\n`;
  }
  return md;
}

async function runAll(iterations = 30, warmup = 5) {
  const results = [];
  tbody.replaceChildren();
  for (const size of SIZES) {
    for (const [name, fn] of Object.entries(addMethods)) {
      statusEl.textContent = `Добавление: ${name}, N = ${size}...`;
      await pause(50);
      const r = { op: 'Добавление', method: name, size, ...stats(await benchAdd(fn, size, iterations, warmup)) };
      results.push(r);
      addRow(r);
    }
    for (const [name, fn] of Object.entries(removeMethods)) {
      statusEl.textContent = `Удаление: ${name}, N = ${size}...`;
      await pause(50);
      const r = { op: 'Удаление', method: name, size, ...stats(await benchRemove(fn, size, iterations, warmup)) };
      results.push(r);
      addRow(r);
    }
  }
  sandbox.replaceChildren();
  statusEl.textContent = 'Тестирование завершено.';
  window.benchResults = results;
  window.benchMarkdown = toMarkdown(results);
  return results;
}

window.runAll = runAll;

document.getElementById('run').addEventListener('click', async (e) => {
  e.target.disabled = true;
  const it = Math.max(30, +document.getElementById('iterations').value || 30);
  const wu = Math.max(0, +document.getElementById('warmup').value || 0);
  await runAll(it, wu);
  e.target.disabled = false;
  document.getElementById('copy').disabled = false;
});

document.getElementById('copy').addEventListener('click', () => {
  navigator.clipboard.writeText(window.benchMarkdown);
});
