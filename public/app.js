import { detect } from '/lib/detect.js?v=3';
import { generate, stackSummary } from '/lib/generate.js?v=3';

// ---- config (filled in at launch) ----
const GUMROAD_URL = 'https://agentready.gumroad.com/l/getagentready';
const LAUNCH_DISCOUNT_ACTIVE = true; // flip when the LAUNCH29 code exists → link /LAUNCH29 and show $29
const PRICE_FULL = '$49';
const PRICE_NOW = '$29';

const $ = (s) => document.querySelector(s);
const input = $('#manifest-input');
const descInput = $('#description-input');
const outputCode = $('#output-code');
const chipsEl = $('#detected-chips');
const filenameEl = $('#input-filename');
const addedFilesEl = $('#added-files');

let extraFiles = []; // additional files beyond the textarea (from file picker / drop)
let activeTab = 'claude';
let lastResult = { claudeMd: '', agentsMd: '' };
let userTouched = false;

// ---- samples ----
const SAMPLES = {
  next: {
    filename: 'package.json',
    content: JSON.stringify(
      {
        name: 'acme-storefront',
        private: true,
        packageManager: 'pnpm@9.1.0',
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          test: 'vitest run',
          lint: 'eslint .',
          typecheck: 'tsc --noEmit',
        },
        dependencies: { next: '15.1.0', react: '19.0.0', 'react-dom': '19.0.0' },
        devDependencies: {
          typescript: '^5.6.0',
          vitest: '^3.0.0',
          eslint: '^9.0.0',
          prettier: '^3.3.0',
        },
      },
      null,
      2
    ),
  },
  fastapi: {
    filename: 'pyproject.toml',
    content: `[project]
name = "acme-api"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.30",
    "pydantic>=2.8",
    "sqlalchemy>=2.0",
]

[dependency-groups]
dev = ["pytest>=8.0", "ruff>=0.6", "mypy>=1.11"]

[tool.ruff]
line-length = 100

[tool.pytest.ini_options]
testpaths = ["tests"]`,
  },
  rust: {
    filename: 'Cargo.toml',
    content: `[package]
name = "acme-server"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
tracing = "0.1"`,
  },
  spring: {
    filename: 'pom.xml',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<project>
  <artifactId>acme-billing-service</artifactId>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.0</version>
  </parent>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
  </dependencies>
</project>`,
  },
  go: {
    filename: 'go.mod',
    content: `module github.com/acme/acme-svc

go 1.23

require (
\tgithub.com/gin-gonic/gin v1.10.0
\tgithub.com/stretchr/testify v1.9.0
)`,
  },
};

// ---- filename guessing for pasted content ----
function guessFilename(text) {
  const t = text.trim();
  if (!t) return 'package.json';
  if (t.startsWith('{')) {
    try {
      const j = JSON.parse(t);
      if (j.require || j['require-dev']) return 'composer.json';
    } catch { /* fall through */ }
    return 'package.json';
  }
  if (t.startsWith('<?xml') || /<project[\s>]/.test(t) && /<artifactId>/.test(t)) return 'pom.xml';
  if (/<Project Sdk=/.test(t)) return 'Example.csproj';
  if (/^plugins\s*\{/m.test(t) || /\b(implementation|testImplementation)\s*[('"]/.test(t)) return 'build.gradle';
  if (/^module\s+\S+/m.test(t)) return 'go.mod';
  if (/\[package\]/.test(t) && /edition\s*=/.test(t)) return 'Cargo.toml';
  if (/\[project\]|\[tool\./.test(t)) return 'pyproject.toml';
  if (/^gem ['"]/m.test(t)) return 'Gemfile';
  if (/^[A-Za-z0-9_.-]+[=<>!~]/m.test(t)) return 'requirements.txt';
  return 'package.json';
}

// ---- generation pipeline ----
function currentFiles() {
  const files = [...extraFiles];
  const text = input.value;
  if (text.trim()) files.unshift({ name: guessFilename(text), content: text });
  return files;
}

function regenerate() {
  const files = currentFiles();
  const profile = detect(files);
  lastResult = generate(profile, {
    description: descInput.value,
    attribution: $('#attribution-input').checked,
  });
  renderChips(profile);
  renderOutput();
  filenameEl.textContent = files.length ? files.map((f) => f.name).join(' + ') : 'paste a manifest';
}

let chipsSummary = null;
let suppressChips = false;

function renderChips(profile) {
  if (suppressChips) return;
  const summary = stackSummary(profile);
  if (summary === chipsSummary) return; // no churn when detection is unchanged
  chipsSummary = summary;
  chipsEl.innerHTML = '';
  if (!summary) return;
  for (const part of summary.split(', ').slice(0, 6)) {
    const el = document.createElement('span');
    el.className = 'chip';
    el.textContent = part;
    chipsEl.appendChild(el);
  }
}

function renderOutput() {
  outputCode.textContent = activeTab === 'claude' ? lastResult.claudeMd : lastResult.agentsMd;
}

// ---- events ----
input.addEventListener('input', () => {
  userTouched = true;
  regenerate();
});
descInput.addEventListener('input', regenerate);
$('#attribution-input').addEventListener('change', regenerate);

document.querySelectorAll('.samples button').forEach((btn) => {
  btn.addEventListener('click', () => {
    userTouched = true;
    extraFiles = [];
    renderAddedFiles();
    input.value = SAMPLES[btn.dataset.sample].content;
    regenerate();
  });
});

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    activeTab = tab.dataset.tab;
    document.querySelectorAll('.tab').forEach((t) => {
      t.classList.toggle('active', t === tab);
      t.setAttribute('aria-selected', String(t === tab));
    });
    renderOutput();
  });
});

$('#copy-btn').addEventListener('click', async () => {
  await navigator.clipboard.writeText(activeTab === 'claude' ? lastResult.claudeMd : lastResult.agentsMd);
  flash($('#copy-btn'), 'Copied ✓');
});

$('#download-btn').addEventListener('click', () => {
  const name = activeTab === 'claude' ? 'CLAUDE.md' : 'AGENTS.md';
  const text = activeTab === 'claude' ? lastResult.claudeMd : lastResult.agentsMd;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
});

function flash(btn, text) {
  const orig = btn.textContent;
  btn.textContent = text;
  setTimeout(() => (btn.textContent = orig), 1400);
}

// file picker + drag/drop for multi-file input
$('#file-input').addEventListener('change', async (e) => {
  await addFiles([...e.target.files]);
});
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', async (e) => {
  e.preventDefault();
  await addFiles([...e.dataTransfer.files]);
});

async function addFiles(files) {
  userTouched = true;
  for (const f of files.slice(0, 8)) {
    const content = f.size > 2_000_000 ? '' : await f.text();
    const existing = extraFiles.findIndex((x) => x.name === f.name);
    const entry = { name: f.name, content };
    if (existing >= 0) extraFiles[existing] = entry;
    else extraFiles.push(entry);
  }
  // If the textarea is empty, promote the first recognized manifest into it.
  if (!input.value.trim() && extraFiles.length) {
    const first = extraFiles.shift();
    input.value = first.content;
  }
  renderAddedFiles();
  regenerate();
}

function renderAddedFiles() {
  addedFilesEl.hidden = extraFiles.length === 0;
  addedFilesEl.textContent = extraFiles.length
    ? `also using: ${extraFiles.map((f) => f.name).join(', ')}`
    : '';
}

// ---- buy link ----
const buy = $('#buy-link');
if (LAUNCH_DISCOUNT_ACTIVE) {
  buy.href = GUMROAD_URL + '/LAUNCH29';
  $('#price-full').textContent = PRICE_FULL;
  $('#price-now').textContent = PRICE_NOW;
} else {
  buy.href = GUMROAD_URL;
  document.querySelector('.price').textContent = PRICE_FULL;
}

// ---- intro: type the Next.js sample on first load ----
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

async function intro() {
  const sample = SAMPLES.next.content;
  if (prefersReduced) {
    input.value = sample;
    regenerate();
    return;
  }
  const step = Math.max(8, Math.floor(sample.length / 90));
  suppressChips = true; // chips appear once, when the manifest is complete
  for (let i = 0; i <= sample.length; i += step) {
    if (userTouched) break; // user started doing their own thing — stop the demo
    input.value = sample.slice(0, i);
    if (i % (step * 6) === 0) regenerate();
    await new Promise((r) => setTimeout(r, 16));
  }
  suppressChips = false;
  if (!userTouched) input.value = sample;
  regenerate();
}

intro();
