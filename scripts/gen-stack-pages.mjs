// Generates /claude-md-for-<stack>/ landing pages from the detection engine.
import { detect } from '../public/lib/detect.js';
import { generate } from '../public/lib/generate.js';
import { writeFileSync, mkdirSync } from 'node:fs';

const STACKS = {
  nextjs: { label: 'Next.js', file: ['package.json', JSON.stringify({ name: 'example-next-app', packageManager: 'pnpm@9.0.0', scripts: { dev: 'next dev', build: 'next build', start: 'next start', test: 'vitest run', lint: 'eslint .', typecheck: 'tsc --noEmit' }, dependencies: { next: '15.1.0', react: '19.0.0', 'react-dom': '19.0.0' }, devDependencies: { typescript: '^5.6.0', vitest: '^3.0.0', eslint: '^9.0.0', prettier: '^3.3.0' } }, null, 2)], blurb: 'Server Components vs client components, App Router structure, and env-var prefixes are exactly where agents go wrong in Next.js — a good CLAUDE.md names all three.' },
  'react-vite': { label: 'React + Vite', file: ['package.json', JSON.stringify({ name: 'example-vite-app', scripts: { dev: 'vite', build: 'vite build', test: 'vitest run', lint: 'eslint .' }, dependencies: { react: '19.0.0' }, devDependencies: { vite: '^6.0.0', vitest: '^3.0.0', typescript: '^5.6.0', eslint: '^9.0.0' } }, null, 2)], blurb: 'The VITE_ env prefix and effect-driven render loops are the classic agent mistakes in Vite SPAs.' },
  fastapi: { label: 'FastAPI', file: ['pyproject.toml', '[project]\nname = "example-api"\ndependencies = ["fastapi>=0.115", "uvicorn>=0.30", "pydantic>=2.8"]\n\n[dependency-groups]\ndev = ["pytest>=8.0", "ruff>=0.6", "mypy>=1.11"]\n\n[tool.ruff]\nline-length = 100'], blurb: "Blocking calls inside async routes freeze FastAPI's event loop — the single most common agent-introduced performance bug in this stack." },
  django: { label: 'Django', file: ['requirements.txt', 'django>=5.0\npytest\npytest-django\nruff'], blurb: 'Migrations discipline and N+1 querysets are where agents need explicit rules in Django projects.' },
  express: { label: 'Express', file: ['package.json', JSON.stringify({ name: 'example-express-api', scripts: { dev: 'nodemon src/index.js', start: 'node src/index.js', test: 'jest', lint: 'eslint .' }, dependencies: { express: '^4.19.0' }, devDependencies: { jest: '^29.0.0', eslint: '^9.0.0' } }, null, 2)], blurb: 'Swallowed async handler errors are the classic Express failure mode — the CLAUDE.md should say how errors flow.' },
  'spring-boot': { label: 'Spring Boot', file: ['pom.xml', '<?xml version="1.0"?>\n<project>\n  <artifactId>example-service</artifactId>\n  <parent><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-parent</artifactId></parent>\n  <dependencies>\n    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency>\n  </dependencies>\n</project>'], blurb: 'Component scanning boundaries and @Transactional proxy semantics are the two Spring facts every coding agent needs written down.' },
  rust: { label: 'Rust (Axum)', file: ['Cargo.toml', '[package]\nname = "example-server"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\naxum = "0.7"\ntokio = { version = "1", features = ["full"] }\nserde = { version = "1", features = ["derive"] }'], blurb: 'Extractor ordering and Send bounds produce Axum compile errors that send agents in circles without guidance.' },
  go: { label: 'Go', file: ['go.mod', 'module github.com/example/svc\n\ngo 1.23\n\nrequire (\n\tgithub.com/gin-gonic/gin v1.10.0\n)'], blurb: 'go test ./... and gofmt are simple — which is exactly why a CLAUDE.md matters: agents otherwise invent Makefile targets that do not exist.' },
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

for (const [slug, cfg] of Object.entries(STACKS)) {
  const profile = detect([{ name: cfg.file[0], content: cfg.file[1] }]);
  const { claudeMd } = generate(profile, {});
  const dir = `public/claude-md-for-${slug}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/index.html`, `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CLAUDE.md for ${cfg.label}: complete example + free generator</title>
<meta name="description" content="A complete CLAUDE.md example for ${cfg.label} projects — exact commands, conventions, and gotchas — plus a free generator that tailors it to your actual repo.">
<link rel="canonical" href="https://getagentready.dev/claude-md-for-${slug}/">
<meta property="og:image" content="https://getagentready.dev/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://getagentready.dev/og.png">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23101826'/%3E%3Cpath d='M9 21l4-10h2l4 10h-2.2l-.8-2.2h-4l-.8 2.2H9zm5-8l-1.5 4h3L14 13z' fill='%233fb950'/%3E%3Cpath d='M21 11h2v10h-2z' fill='%23e6edf3'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
<style>
  .article { max-width: 760px; margin: 40px auto 0; padding: 0 24px; }
  .article h1 { font-family: var(--display); font-weight: 800; font-size: clamp(1.8rem, 4.5vw, 2.4rem); letter-spacing: -0.02em; line-height: 1.1; margin-bottom: 14px; }
  .article h2 { font-family: var(--display); font-weight: 700; font-size: 1.3rem; margin: 32px 0 10px; }
  .article p { color: var(--muted); }
  .article pre { background: var(--pane); color: var(--pane-text); border: 1px solid var(--pane-line); border-radius: 10px; padding: 16px; overflow-x: auto; font-family: var(--mono); font-size: 0.76rem; line-height: 1.55; }
  .cta-band { margin: 36px 0; padding: 20px 22px; border: 1px solid var(--line); border-radius: 12px; display: flex; gap: 16px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
  .cta-band a { background: var(--accent); color: #fff; text-decoration: none; font-weight: 700; padding: 10px 18px; border-radius: 8px; }
  @media (prefers-color-scheme: dark) { .cta-band a { color: #08110a; } }
</style>
</head>
<body>
<nav class="nav">
  <a class="brand" href="/"><span class="brand-mark">A|</span> AgentReady</a>
  <div class="nav-links"><a href="/#tool">Generator</a><a href="/#pro" class="nav-pro">Pro Pack</a></div>
</nav>
<article class="article">
<h1>CLAUDE.md for ${cfg.label}</h1>
<p>${esc(cfg.blurb)} Below is a complete, committable example for a typical ${cfg.label} project. To get one tailored to <em>your</em> dependencies and scripts, paste your manifest into the <a href="/#tool">free generator</a> (client-side, nothing uploaded) or run <code>npx getagentready</code> in your repo.</p>
<h2>Complete example</h2>
<pre>${esc(claudeMd)}</pre>
<h2>Going further</h2>
<p>This is the generated baseline. The <a href="/#pro">Agent-Ready Pro Pack</a> includes a hand-tuned, deeper ${cfg.label} configuration — architecture guidance, testing strategy, common-task recipes — plus 12 workflow skills and enforcement hooks. See also the <a href="/claude-md-guide/">CLAUDE.md guide</a> and <a href="/agents-md-guide/">AGENTS.md guide</a>.</p>
<div class="cta-band">
  <span><strong>Generate yours in 30 seconds</strong> — tailored to your actual ${cfg.label} repo.</span>
  <a href="/#tool">Generate mine →</a>
</div>
</article>
<footer class="footer">
  <span>© 2026 AgentReady · <a href="mailto:hello@getagentready.dev">hello@getagentready.dev</a> · <a href="/claude-md-guide/">CLAUDE.md guide</a></span>
  <span class="footer-note">Runs in your browser. Your code stays yours.</span>
</footer>
</body>
</html>
`);
  console.log(`generated /claude-md-for-${slug}/`);
}
