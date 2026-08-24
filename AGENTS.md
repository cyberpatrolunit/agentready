# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

**getagentready** — Stack: JavaScript, npm, Vitest.

## Setup and commands

- Install dependencies: `npm install`
- Run dev server: `npm run dev`
- Run all tests: `npm test`
- Run a single test: `npx vitest run path/to/file.test.ts -t "test name"`

## Testing

Tests use Vitest. Write or update tests alongside behavior changes; run the single-test command during iteration and the full suite before finishing.

## Code style and conventions

- Prefer small, focused changes; do not refactor unrelated code in the same change.
- Match the existing code style of the file you are editing over any global preference.
- Never commit secrets. `.env*` files are local-only.
- After making changes, run the test and lint commands above before considering work done.

## Pull requests

- Keep PRs focused on one change; describe what and why, not how.
- Ensure tests and lint pass before opening a PR.

<!-- generated with https://getagentready.dev -->
