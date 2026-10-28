// views.js — the views that resolve a _CODE folder, checked against the folder and printed side by side.
//
//   node _ARCHIVE/Expressions/views.js [_ARCHIVE/Configurations/VIEWS.yaml]
//
// Reads VIEWS.yaml (block mappings of double-quoted strings, two spaces per level) and checks:
// every folder exists under _CODE/U; its name is its literal (a code point, or a two-digit block);
// every view states its basis and source; every view resolves every folder; and no view is named
// "literal", so none replaces the folder (rules V1 to V4). No view is taken as the reference.
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const file = process.argv[2] || path.join(ROOT, "_ARCHIVE/Configurations/VIEWS.yaml");

function parse(text) {
  const root = {}, stack = [{ indent: -1, node: root }];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const m = line.match(/^( *)("(?:[^"\\]|\\.)*"|[^:]+):(?: (.*))?$/);
    if (!m) throw new Error(`not a mapping line: ${line}`);
    const indent = m[1].length, key = m[2].startsWith('"') ? JSON.parse(m[2]) : m[2];
    while (stack[stack.length - 1].indent >= indent) stack.pop();
    const parent = stack[stack.length - 1].node;
    if (m[3] === undefined) stack.push({ indent, node: (parent[key] = {}) });
    else parent[key] = JSON.parse(m[3]);
  }
  return root;
}

const { views, folders } = parse(fs.readFileSync(file, "utf8")).VIEWS;
const fail = [];
for (const [name, v] of Object.entries(views)) {
  if (!/^[A-Z0-9]{1,8}$/.test(name)) fail.push(`view ${name}: not a tag`);
  if (name === "literal") fail.push("a view is named literal (V1)");
  if (!v.basis || !v.source) fail.push(`view ${name}: no basis or source (V2)`);
}
for (const [folder, f] of Object.entries(folders)) {
  if (!fs.statSync(path.join(ROOT, "_CODE/U", folder), { throwIfNoEntry: false })?.isDirectory())
    fail.push(`${folder}: no _CODE/U/${folder}`);
  const cp = parseInt(folder, 16), block = folder.length === 2;
  const head = block ? `U+${folder}00` : `U+${folder}`;
  if (!(cp >= 0 && cp <= 0x10ffff) || !f.literal?.includes(head)) fail.push(`${folder}: literal does not name ${head} (V1)`);
  for (const name of Object.keys(views)) if (!f[name]) fail.push(`${folder}: not resolved by ${name} (V4)`);
  for (const key of Object.keys(f)) if (key !== "literal" && !views[key]) fail.push(`${folder}: ${key} is not a declared view (V2)`);
}
if (fail.length) {
  for (const f of fail) console.error(`FAIL: ${f}`);
  process.exit(1);
}

for (const [folder, f] of Object.entries(folders)) {
  const glyph = folder.length === 2 ? String.fromCodePoint(parseInt(folder + "00", 16)) : String.fromCodePoint(parseInt(folder, 16));
  console.log(`_CODE/U/${folder}  ${glyph}  ${f.literal}`);
  for (const name of Object.keys(views)) console.log(`  ${name.padEnd(8)} ${f[name]}`);
}
console.log(`PASS: ${Object.keys(folders).length} folders, ${Object.keys(views).length} views, each folder resolved by each view, no literal renamed`);
