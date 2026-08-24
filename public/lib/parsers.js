// Minimal parsers for the manifest formats we read. These are intentionally
// forgiving: they extract the handful of fields detection needs and never throw.

// Parses a small, common subset of TOML: tables, string/number/bool/array
// values, and multi-line arrays. Enough for pyproject.toml / Cargo.toml
// dependency and tool sections.
export function parseTomlLite(text) {
  const root = {};
  let current = root;
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    let line = lines[i].trim();
    i++;
    if (!line || line.startsWith('#')) continue;

    const table = line.match(/^\[+([^\]]+)\]+$/);
    if (table) {
      const path = table[1].trim().split('.').map((s) => s.trim().replace(/^"|"$/g, ''));
      current = root;
      for (const key of path) {
        current[key] = current[key] || {};
        current = current[key];
      }
      continue;
    }

    const kv = line.match(/^([A-Za-z0-9_."'-]+)\s*=\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1].replace(/^["']|["']$/g, '');
    let raw = kv[2];

    // Multi-line array: keep consuming until brackets balance.
    if (raw.startsWith('[') && !balanced(raw)) {
      while (i < lines.length && !balanced(raw)) {
        raw += '\n' + lines[i];
        i++;
      }
    }
    current[key] = parseTomlValue(raw.trim());
  }
  return root;
}

function balanced(s) {
  let depth = 0;
  let inStr = false;
  for (const ch of s) {
    if (ch === '"') inStr = !inStr;
    if (inStr) continue;
    if (ch === '[') depth++;
    if (ch === ']') depth--;
  }
  return depth <= 0;
}

function parseTomlValue(raw) {
  if (raw.startsWith('"""')) return raw.replace(/^"""|"""$/g, '');
  if (raw.startsWith('"')) return raw.replace(/^"|"[^"]*$/g, '').replace(/"$/, '');
  if (raw.startsWith("'")) return raw.replace(/^'|'[^']*$/g, '').replace(/'$/, '');
  if (raw.startsWith('[')) {
    const inner = raw.replace(/^\[|\]$/g, '');
    return splitTopLevel(inner)
      .map((s) => s.trim())
      .filter(Boolean)
      .map(parseTomlValue);
  }
  if (raw.startsWith('{')) {
    // Inline table: return raw keys we can find, e.g. { version = "1", features = [...] }
    const obj = {};
    const m = raw.matchAll(/([A-Za-z0-9_-]+)\s*=\s*("[^"]*"|\[[^\]]*\]|[^,}]+)/g);
    for (const g of m) obj[g[1]] = parseTomlValue(g[2].trim());
    return obj;
  }
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  const num = Number(raw.replace(/#.*$/, '').trim());
  if (!Number.isNaN(num) && raw !== '') return num;
  return raw.replace(/#.*$/, '').trim();
}

function splitTopLevel(s) {
  const out = [];
  let depth = 0;
  let inStr = false;
  let cur = '';
  for (const ch of s) {
    if (ch === '"') inStr = !inStr;
    if (!inStr) {
      if (ch === '[' || ch === '{') depth++;
      if (ch === ']' || ch === '}') depth--;
      if (ch === ',' && depth === 0) {
        out.push(cur);
        cur = '';
        continue;
      }
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

// go.mod: module path, go version, require blocks.
export function parseGoMod(text) {
  const mod = { module: null, go: null, requires: [] };
  const lines = text.split(/\r?\n/);
  let inRequire = false;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('module ')) mod.module = line.slice(7).trim();
    else if (line.startsWith('go ')) mod.go = line.slice(3).trim();
    else if (line.startsWith('require (')) inRequire = true;
    else if (inRequire && line === ')') inRequire = false;
    else if (inRequire || line.startsWith('require ')) {
      const m = line.replace(/^require\s+/, '').match(/^([^\s]+)\s+v?[\d.]/);
      if (m) mod.requires.push(m[1]);
    }
  }
  return mod;
}

// requirements.txt: bare package names.
export function parseRequirements(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('-'))
    .map((l) => l.split(/[<>=!~\[;\s]/)[0].toLowerCase())
    .filter(Boolean);
}
