import { FRAMEWORK_KNOWLEDGE, SINGLE_TEST_COMMANDS } from './knowledge.js';

const LANG_LABELS = {
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  python: 'Python',
  rust: 'Rust',
  go: 'Go',
  php: 'PHP',
  ruby: 'Ruby',
  java: 'Java',
  kotlin: 'Kotlin',
  csharp: 'C#',
};

const TOOL_LABELS = {
  vitest: 'Vitest',
  jest: 'Jest',
  playwright: 'Playwright',
  mocha: 'Mocha',
  pytest: 'pytest',
  'cargo-test': 'cargo test',
  'go-test': 'go test',
  rspec: 'RSpec',
  phpunit: 'PHPUnit',
  pest: 'Pest',
  eslint: 'ESLint',
  biome: 'Biome',
  oxlint: 'oxlint',
  ruff: 'Ruff',
  clippy: 'Clippy',
  prettier: 'Prettier',
  black: 'Black',
  rustfmt: 'rustfmt',
  gofmt: 'gofmt',
};

function stackSummary(p) {
  const parts = [];
  for (const l of p.languages) parts.push(LANG_LABELS[l] || l);
  for (const f of p.frameworks) {
    const k = FRAMEWORK_KNOWLEDGE[f];
    parts.push(k ? k.label : f);
  }
  if (p.packageManager && p.languages.some((l) => l === 'typescript' || l === 'javascript')) {
    parts.push(p.packageManager);
  }
  if (p.pythonManager) parts.push(p.pythonManager);
  if (p.testRunner) parts.push(TOOL_LABELS[p.testRunner] || p.testRunner);
  if (p.linter) parts.push(TOOL_LABELS[p.linter] || p.linter);
  if (p.formatter && p.formatter !== p.linter) parts.push(TOOL_LABELS[p.formatter] || p.formatter);
  return parts.join(', ');
}

function commandLines(p) {
  const order = [
    ['install', 'Install dependencies'],
    ['dev', 'Run dev server'],
    ['build', 'Build'],
    ['test', 'Run all tests'],
    ['lint', 'Lint'],
    ['format', 'Format'],
    ['typecheck', 'Type-check'],
  ];
  const lines = [];
  for (const [key, label] of order) {
    if (p.commands[key]) lines.push(`- ${label}: \`${p.commands[key]}\``);
  }
  const single = singleTestLine(p);
  if (single) {
    // Place the single-test line right after "Run all tests".
    const idx = lines.findIndex((l) => l.startsWith('- Run all tests'));
    lines.splice(idx === -1 ? lines.length : idx + 1, 0, `- Run a single test: \`${single}\``);
  }
  return lines;
}

function singleTestLine(p) {
  const fn = SINGLE_TEST_COMMANDS[p.testRunner];
  if (!fn) return null;
  if (p.testRunner === 'pytest') {
    const prefix = p.pythonManager === 'uv' ? 'uv run' : p.pythonManager === 'poetry' ? 'poetry run' : '';
    return fn(prefix);
  }
  return fn(p.packageManager || 'npm');
}

function frameworkSections(p) {
  const conventions = [];
  const gotchas = [];
  for (const f of p.frameworks) {
    const k = FRAMEWORK_KNOWLEDGE[f];
    if (!k) continue;
    conventions.push(...k.conventions.map((c) => `- ${c}`));
    gotchas.push(...k.gotchas.map((g) => `- ${g}`));
  }
  return { conventions, gotchas };
}

const UNIVERSAL_RULES = [
  'Prefer small, focused changes; do not refactor unrelated code in the same change.',
  'Match the existing code style of the file you are editing over any global preference.',
  'Never commit secrets. `.env*` files are local-only.',
  'After making changes, run the test and lint commands above before considering work done.',
];

function overviewLine(p, options) {
  const name = options.projectName || p.projectName;
  const desc = options.description ? options.description.trim().replace(/\s+/g, ' ') : '';
  const stack = stackSummary(p);
  const bits = [];
  if (desc) bits.push(desc.endsWith('.') ? desc : desc + '.');
  if (stack) bits.push(`Stack: ${stack}.`);
  if (!bits.length) bits.push('Describe the project in one or two sentences here.');
  return { name, body: bits.join('\n\n') };
}

const ATTRIBUTION = '\n<!-- generated with https://getagentready.dev -->\n';

export function generate(profile, options = {}) {
  const p = profile;
  const credit = options.attribution === false ? '' : ATTRIBUTION;
  const { name, body } = overviewLine(p, options);
  const cmds = commandLines(p);
  const { conventions, gotchas } = frameworkSections(p);
  const notes = p.notes || [];

  const cmdBlock = cmds.length
    ? cmds.join('\n')
    : '- List your install / test / lint / build commands here — commands are the highest-value content in this file.';

  const structureHint = p.monorepo
    ? '\n## Repository structure\n\nThis is a monorepo (workspaces detected). Note here which package an agent should edit for which kind of change, e.g.:\n\n- `apps/web` — user-facing app\n- `packages/ui` — shared components\n'
    : '';

  const conventionsBlock = [
    ...conventions,
    ...UNIVERSAL_RULES.map((r) => `- ${r}`),
  ].join('\n');

  const gotchasBlock = gotchas.length
    ? `\n## Gotchas\n\n${gotchas.join('\n')}\n`
    : '';

  const notesBlock = notes.length ? `\n> Note: ${notes.join(' ')}\n` : '';

  const importedBlock = p.importedRules
    ? `\n## Project rules\n\nCarried over from this repo's existing agent rules (.cursorrules):\n\n${p.importedRules}\n`
    : '';

  const testingBlock = p.testRunner
    ? `Tests use ${TOOL_LABELS[p.testRunner] || p.testRunner}. Write or update tests alongside behavior changes; run the single-test command during iteration and the full suite before finishing.`
    : 'Add a test runner and record its commands here — agents work dramatically better when they can verify changes.';

  const claudeMd = `# CLAUDE.md

This file guides Claude Code when working in this repository.
${notesBlock}
## Project

${name ? `**${name}**` : 'This project'} — ${body}

## Commands

${cmdBlock}
${structureHint}
## Testing

${testingBlock}

## Conventions

${conventionsBlock}
${importedBlock}${gotchasBlock}${credit}`;

  const agentsMd = `# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

${name ? `**${name}**` : 'This project'} — ${body}

## Setup and commands

${cmdBlock}
${structureHint}
## Testing

${testingBlock}

## Code style and conventions

${conventionsBlock}
${importedBlock}${gotchasBlock}
## Pull requests

- Keep PRs focused on one change; describe what and why, not how.
- Ensure tests and lint pass before opening a PR.
${credit}`;

  return { claudeMd, agentsMd };
}

export { stackSummary };
