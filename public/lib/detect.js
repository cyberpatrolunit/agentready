import { parseTomlLite, parseGoMod, parseRequirements } from './parsers.js';

// Framework detection tables: dependency name -> framework id.
const NODE_FRAMEWORKS = {
  next: 'next',
  nuxt: 'nuxt',
  astro: 'astro',
  '@remix-run/react': 'remix',
  '@sveltejs/kit': 'sveltekit',
  svelte: 'svelte',
  vue: 'vue',
  react: 'react',
  'react-native': 'react-native',
  expo: 'expo',
  express: 'express',
  fastify: 'fastify',
  hono: 'hono',
  koa: 'koa',
  '@nestjs/core': 'nest',
  electron: 'electron',
  vite: 'vite',
};

const PY_FRAMEWORKS = {
  django: 'django',
  fastapi: 'fastapi',
  flask: 'flask',
  streamlit: 'streamlit',
  pandas: 'data-science',
  numpy: 'data-science',
  torch: 'ml',
  tensorflow: 'ml',
  langchain: 'llm',
  anthropic: 'llm',
  openai: 'llm',
};

const RUST_FRAMEWORKS = {
  axum: 'axum',
  'actix-web': 'actix',
  rocket: 'rocket',
  tauri: 'tauri',
  bevy: 'bevy',
  tokio: 'tokio',
};

const GO_FRAMEWORKS = [
  ['github.com/gin-gonic/gin', 'gin'],
  ['github.com/labstack/echo', 'echo'],
  ['github.com/go-chi/chi', 'chi'],
  ['github.com/gofiber/fiber', 'fiber'],
  ['github.com/spf13/cobra', 'cobra'],
];

function emptyProfile() {
  return {
    projectName: null,
    languages: [],
    frameworks: [],
    packageManager: null,
    pythonManager: null,
    testRunner: null,
    linter: null,
    formatter: null,
    typescript: false,
    monorepo: false,
    importedRules: null,
    scripts: {},
    commands: {},
    notes: [],
  };
}

function add(arr, v) {
  if (v && !arr.includes(v)) arr.push(v);
}

export function detect(files) {
  const p = emptyProfile();
  const names = files.map((f) => f.name.toLowerCase());

  // Lockfiles / config files that carry signal by name alone.
  const lockPm = names.includes('pnpm-lock.yaml')
    ? 'pnpm'
    : names.includes('bun.lockb') || names.includes('bun.lock')
      ? 'bun'
      : names.includes('yarn.lock')
        ? 'yarn'
        : names.includes('package-lock.json')
          ? 'npm'
          : null;
  if (names.includes('uv.lock')) p.pythonManager = 'uv';
  if (names.includes('poetry.lock')) p.pythonManager = 'poetry';

  for (const f of files) {
    const name = f.name.toLowerCase();
    try {
      if (name === 'package.json') detectNode(p, f.content, lockPm);
      else if (name === 'pyproject.toml') detectPyproject(p, f.content);
      else if (name === 'requirements.txt') detectRequirements(p, f.content);
      else if (name === 'cargo.toml') detectCargo(p, f.content);
      else if (name === 'go.mod') detectGo(p, f.content);
      else if (name === 'composer.json') detectComposer(p, f.content);
      else if (name === 'gemfile') detectGemfile(p, f.content);
      else if (name === '.cursorrules' || name.endsWith('.mdc')) detectCursorRules(p, f.content);
    } catch {
      p.notes.push(`\`${f.name}\` could not be parsed; used sensible defaults for its ecosystem.`);
      fallbackLanguage(p, name);
    }
  }

  return p;
}

function fallbackLanguage(p, name) {
  if (name === 'package.json') add(p.languages, 'javascript');
  if (name === 'pyproject.toml' || name === 'requirements.txt') add(p.languages, 'python');
  if (name === 'cargo.toml') add(p.languages, 'rust');
  if (name === 'go.mod') add(p.languages, 'go');
}

function detectNode(p, content, lockPm) {
  let pkg;
  try {
    pkg = JSON.parse(content);
  } catch {
    p.notes.push('`package.json` could not be parsed; used sensible defaults for its ecosystem.');
    add(p.languages, 'javascript');
    return;
  }
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

  p.projectName = p.projectName || pkg.name || null;
  p.typescript = p.typescript || 'typescript' in deps || !!pkg.types;
  add(p.languages, p.typescript ? 'typescript' : 'javascript');

  const pmField = typeof pkg.packageManager === 'string' ? pkg.packageManager.split('@')[0] : null;
  p.packageManager = pmField || lockPm || p.packageManager || 'npm';

  for (const [dep, fw] of Object.entries(NODE_FRAMEWORKS)) {
    if (dep in deps) add(p.frameworks, fw);
  }
  // react is implied by next/remix/expo — drop the generic entry when a meta-framework is present.
  if (p.frameworks.includes('next') || p.frameworks.includes('remix')) {
    p.frameworks = p.frameworks.filter((f) => f !== 'react' && f !== 'vite');
  }
  if (p.frameworks.includes('sveltekit')) p.frameworks = p.frameworks.filter((f) => f !== 'svelte');
  if (p.frameworks.includes('nuxt')) p.frameworks = p.frameworks.filter((f) => f !== 'vue');

  p.testRunner =
    p.testRunner ||
    ('vitest' in deps ? 'vitest' : 'jest' in deps ? 'jest' : '@playwright/test' in deps ? 'playwright' : 'mocha' in deps ? 'mocha' : null);
  p.linter = p.linter || ('@biomejs/biome' in deps ? 'biome' : 'eslint' in deps ? 'eslint' : 'oxlint' in deps ? 'oxlint' : null);
  p.formatter = p.formatter || ('@biomejs/biome' in deps ? 'biome' : 'prettier' in deps ? 'prettier' : null);
  p.monorepo = p.monorepo || Array.isArray(pkg.workspaces) || !!pkg.workspaces;

  p.scripts = { ...p.scripts, ...(pkg.scripts || {}) };
  const run = (s) => (p.packageManager === 'npm' ? `npm run ${s}` : `${p.packageManager} ${s}`);
  const scripts = pkg.scripts || {};
  const cmd = p.commands;
  cmd.install = `${p.packageManager} install`;
  if (scripts.dev) cmd.dev = run('dev');
  else if (scripts.start) cmd.dev = run('start');
  if (scripts.build) cmd.build = run('build');
  if (scripts.test) cmd.test = p.packageManager === 'npm' ? 'npm test' : `${p.packageManager} test`;
  if (scripts.lint) cmd.lint = run('lint');
  if (scripts.format) cmd.format = run('format');
  if (scripts.typecheck) cmd.typecheck = run('typecheck');
  else if (p.typescript) cmd.typecheck = 'npx tsc --noEmit';

  // Normalize npm's `npm run dev` vs pnpm/yarn/bun short form used above.
  if (p.packageManager !== 'npm') {
    for (const k of ['dev', 'build', 'lint', 'format', 'typecheck']) {
      if (cmd[k] && cmd[k].startsWith(`${p.packageManager} `)) continue;
    }
  }
}

function detectPyproject(p, content) {
  const toml = parseTomlLite(content);
  add(p.languages, 'python');
  const project = toml.project || {};
  p.projectName = p.projectName || project.name || (toml.tool && toml.tool.poetry && toml.tool.poetry.name) || null;

  const depStrings = []
    .concat(Array.isArray(project.dependencies) ? project.dependencies : [])
    .concat(
      Object.values(project['optional-dependencies'] || {}).flat(),
      Object.values(toml['dependency-groups'] || {}).flat()
    );
  if (toml.tool && toml.tool.poetry) {
    p.pythonManager = p.pythonManager || 'poetry';
    depStrings.push(...Object.keys(toml.tool.poetry.dependencies || {}));
    for (const g of Object.values(toml.tool.poetry.group || {})) {
      depStrings.push(...Object.keys(g.dependencies || {}));
    }
  }
  if (toml['dependency-groups'] && !p.pythonManager) p.pythonManager = 'uv';
  const deps = depStrings
    .filter((d) => typeof d === 'string')
    .map((d) => d.split(/[<>=!~\[;\s]/)[0].toLowerCase());

  for (const [dep, fw] of Object.entries(PY_FRAMEWORKS)) {
    if (deps.includes(dep)) add(p.frameworks, fw);
  }
  if (deps.includes('pytest') || (toml.tool && toml.tool.pytest)) p.testRunner = p.testRunner || 'pytest';
  if (deps.includes('ruff') || (toml.tool && toml.tool.ruff)) {
    p.linter = p.linter || 'ruff';
    p.formatter = p.formatter || 'ruff';
  }
  if (deps.includes('black') || (toml.tool && toml.tool.black)) p.formatter = p.formatter === 'ruff' ? p.formatter : 'black';
  if (deps.includes('mypy') || (toml.tool && toml.tool.mypy)) p.commands.typecheck = pyRun(p, 'mypy .');
  if (deps.includes('pyright')) p.commands.typecheck = pyRun(p, 'pyright');

  const mgr = p.pythonManager;
  p.commands.install = mgr === 'uv' ? 'uv sync' : mgr === 'poetry' ? 'poetry install' : 'pip install -e ".[dev]"';
  if (p.testRunner === 'pytest') p.commands.test = pyRun(p, 'pytest');
  if (p.linter === 'ruff') {
    p.commands.lint = pyRun(p, 'ruff check .');
    p.commands.format = pyRun(p, 'ruff format .');
  }
}

function pyRun(p, cmd) {
  if (p.pythonManager === 'uv') return `uv run ${cmd}`;
  if (p.pythonManager === 'poetry') return `poetry run ${cmd}`;
  return cmd;
}

function detectRequirements(p, content) {
  add(p.languages, 'python');
  const deps = parseRequirements(content);
  for (const [dep, fw] of Object.entries(PY_FRAMEWORKS)) {
    if (deps.includes(dep)) add(p.frameworks, fw);
  }
  if (deps.includes('pytest')) {
    p.testRunner = p.testRunner || 'pytest';
    p.commands.test = p.commands.test || 'pytest';
  }
  p.commands.install = p.commands.install || 'pip install -r requirements.txt';
}

function detectCargo(p, content) {
  const toml = parseTomlLite(content);
  add(p.languages, 'rust');
  p.projectName = p.projectName || (toml.package && toml.package.name) || null;
  const deps = Object.keys(toml.dependencies || {});
  for (const [dep, fw] of Object.entries(RUST_FRAMEWORKS)) {
    if (deps.includes(dep)) add(p.frameworks, fw);
  }
  // tokio alone is a runtime, not an app framework — drop it when a web framework is present.
  if (p.frameworks.some((f) => ['axum', 'actix', 'rocket'].includes(f))) {
    p.frameworks = p.frameworks.filter((f) => f !== 'tokio');
  }
  p.testRunner = p.testRunner || 'cargo-test';
  p.linter = p.linter || 'clippy';
  p.formatter = p.formatter || 'rustfmt';
  Object.assign(p.commands, {
    install: p.commands.install || 'cargo build',
    build: p.commands.build || 'cargo build --release',
    test: p.commands.test || 'cargo test',
    lint: p.commands.lint || 'cargo clippy -- -D warnings',
    format: p.commands.format || 'cargo fmt',
  });
}

function detectGo(p, content) {
  const mod = parseGoMod(content);
  add(p.languages, 'go');
  if (mod.module) p.projectName = p.projectName || mod.module.split('/').pop();
  for (const [dep, fw] of GO_FRAMEWORKS) {
    if (mod.requires.some((r) => r.startsWith(dep))) add(p.frameworks, fw);
  }
  p.testRunner = p.testRunner || 'go-test';
  p.formatter = p.formatter || 'gofmt';
  Object.assign(p.commands, {
    build: p.commands.build || 'go build ./...',
    test: p.commands.test || 'go test ./...',
    lint: p.commands.lint || 'go vet ./...',
    format: p.commands.format || 'gofmt -w .',
  });
}

// .cursorrules / Cursor .mdc rule files: carry the rules over verbatim
// (minus any MDC frontmatter) so nothing is lost in the migration.
function detectCursorRules(p, content) {
  let text = content.trim();
  const fm = text.match(/^---\n[\s\S]*?\n---\n?/);
  if (fm) text = text.slice(fm[0].length).trim();
  if (!text) return;
  p.importedRules = p.importedRules ? p.importedRules + '\n\n' + text : text;
}

function detectComposer(p, content) {
  const pkg = JSON.parse(content);
  add(p.languages, 'php');
  p.projectName = p.projectName || (pkg.name ? pkg.name.split('/').pop() : null);
  const deps = { ...(pkg.require || {}), ...(pkg['require-dev'] || {}) };
  if ('laravel/framework' in deps) add(p.frameworks, 'laravel');
  if ('symfony/framework-bundle' in deps) add(p.frameworks, 'symfony');
  if ('phpunit/phpunit' in deps) {
    p.testRunner = 'phpunit';
    p.commands.test = 'vendor/bin/phpunit';
  }
  if ('pestphp/pest' in deps) {
    p.testRunner = 'pest';
    p.commands.test = 'vendor/bin/pest';
  }
  p.commands.install = 'composer install';
}

function detectGemfile(p, content) {
  add(p.languages, 'ruby');
  if (/gem ['"]rails['"]/.test(content)) add(p.frameworks, 'rails');
  if (/gem ['"]rspec/.test(content)) {
    p.testRunner = 'rspec';
    p.commands.test = 'bundle exec rspec';
  }
  p.commands.install = 'bundle install';
  if (p.frameworks.includes('rails')) {
    p.commands.dev = 'bin/rails server';
    p.commands.test = p.commands.test || 'bin/rails test';
  }
}
