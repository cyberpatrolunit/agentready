import { describe, it, expect } from 'vitest';
import { detect } from './detect.js';
import { generate } from './generate.js';

const nextPkg = JSON.stringify({
  name: 'acme-web',
  packageManager: 'pnpm@9.1.0',
  scripts: { dev: 'next dev', build: 'next build', test: 'vitest run', lint: 'eslint .' },
  dependencies: { next: '15.1.0', react: '19.0.0' },
  devDependencies: { typescript: '^5.6.0', vitest: '^3.0.0', eslint: '^9.0.0' },
});

describe('generate: next.js project', () => {
  const profile = detect([{ name: 'package.json', content: nextPkg }]);
  const { claudeMd, agentsMd } = generate(profile, {});

  it('includes resolved commands', () => {
    expect(claudeMd).toContain('pnpm install');
    expect(claudeMd).toContain('pnpm dev');
    expect(claudeMd).toContain('pnpm build');
  });

  it('includes a single-test command for vitest', () => {
    expect(claudeMd).toMatch(/vitest run .*-t/);
  });

  it('includes next.js specific guidance', () => {
    expect(claudeMd.toLowerCase()).toContain('app router');
    expect(claudeMd.toLowerCase()).toContain('server component');
  });

  it('produces an AGENTS.md that is tool-agnostic', () => {
    expect(agentsMd).toContain('# AGENTS.md');
    expect(agentsMd).not.toMatch(/claude/i);
    expect(agentsMd).toContain('pnpm install');
  });

  it('mentions the project name', () => {
    expect(claudeMd).toContain('acme-web');
  });
});

describe('generate: python fastapi', () => {
  const pyproject = `
[project]
name = "acme-api"
dependencies = ["fastapi>=0.115", "uvicorn>=0.30"]

[dependency-groups]
dev = ["pytest>=8.0", "ruff>=0.6"]
`;
  const profile = detect([{ name: 'pyproject.toml', content: pyproject }]);
  const { claudeMd } = generate(profile, {});

  it('uses uv-prefixed commands and pytest single-test form', () => {
    expect(claudeMd).toContain('uv sync');
    expect(claudeMd).toMatch(/pytest .*::/);
  });

  it('includes fastapi guidance', () => {
    expect(claudeMd.toLowerCase()).toContain('pydantic');
  });
});

describe('generate: empty profile degrades gracefully', () => {
  const profile = detect([]);
  const { claudeMd, agentsMd } = generate(profile, {});

  it('still produces a usable skeleton', () => {
    expect(claudeMd).toContain('# CLAUDE.md');
    expect(claudeMd.length).toBeGreaterThan(400);
    expect(agentsMd).toContain('# AGENTS.md');
  });

  it('contains no unresolved template placeholders', () => {
    expect(claudeMd).not.toMatch(/undefined|\[object Object\]|\{\{/);
    expect(agentsMd).not.toMatch(/undefined|\[object Object\]|\{\{/);
  });
});

describe('generate: user description is woven in', () => {
  const profile = detect([{ name: 'package.json', content: nextPkg }]);
  const { claudeMd } = generate(profile, { description: 'A marketplace for vintage synthesizers.' });

  it('includes the description', () => {
    expect(claudeMd).toContain('vintage synthesizers');
  });
});
