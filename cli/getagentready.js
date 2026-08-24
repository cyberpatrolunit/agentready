#!/usr/bin/env node
// getagentready — generate CLAUDE.md + AGENTS.md tailored to the repo in cwd.
// Usage: npx getagentready [--stdout] [--force] [--no-attribution] [--claude-only|--agents-only]

import { readFile, writeFile, access } from 'node:fs/promises';
import { detect } from '../public/lib/detect.js';
import { generate, stackSummary } from '../public/lib/generate.js';

const MANIFESTS = [
  'package.json',
  'pyproject.toml',
  'requirements.txt',
  'Cargo.toml',
  'go.mod',
  'composer.json',
  'Gemfile',
  '.cursorrules',
  'pnpm-lock.yaml',
  'yarn.lock',
  'package-lock.json',
  'bun.lock',
  'bun.lockb',
  'uv.lock',
  'poetry.lock',
];

const args = new Set(process.argv.slice(2));
if (args.has('--help') || args.has('-h')) {
  console.log(`getagentready — generate CLAUDE.md + AGENTS.md for the repo in the current directory

Options:
  --stdout           print to stdout instead of writing files
  --force            overwrite existing CLAUDE.md / AGENTS.md
  --no-attribution   omit the "generated with" credit line
  --claude-only      only CLAUDE.md
  --agents-only      only AGENTS.md

Web version (same engine, runs in your browser): https://getagentready.dev`);
  process.exit(0);
}

const files = [];
for (const name of MANIFESTS) {
  try {
    const content = await readFile(name, 'utf8');
    files.push({ name, content });
  } catch {
    /* not present */
  }
}

if (!files.length) {
  console.error(
    'No manifest found in the current directory.\nLooked for: ' +
      MANIFESTS.slice(0, 7).join(', ') +
      ' …\nRun this from your repo root.'
  );
  process.exit(1);
}

const profile = detect(files);
const { claudeMd, agentsMd } = generate(profile, {
  attribution: !args.has('--no-attribution'),
});

const summary = stackSummary(profile);
console.error(`Detected: ${summary || 'no specific stack (generic template)'}`);

const outputs = [];
if (!args.has('--agents-only')) outputs.push(['CLAUDE.md', claudeMd]);
if (!args.has('--claude-only')) outputs.push(['AGENTS.md', agentsMd]);

if (args.has('--stdout')) {
  for (const [name, text] of outputs) {
    console.log(`\n===== ${name} =====\n`);
    console.log(text);
  }
  process.exit(0);
}

for (const [name, text] of outputs) {
  const exists = await access(name).then(() => true, () => false);
  if (exists && !args.has('--force')) {
    console.error(`Skipped ${name} (already exists — use --force to overwrite).`);
    continue;
  }
  await writeFile(name, text);
  console.error(`Wrote ${name}`);
}
console.error('\nReview the files and fill in anything bracketed. Deeper per-stack configs: https://getagentready.dev/#pro');
