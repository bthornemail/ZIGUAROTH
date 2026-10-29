// views.js — the views that resolve a _CODE folder, checked against the folder and printed side by side.
//
//   node _ARCHIVE/Expressions/views.js [_ARCHIVE/Configurations/VIEWS.wsn]
//
// Reads VIEWS.wsn (Wirth syntax notation: a production names its children, each child's
// identifier its parent's followed by its key in capitals, digits spelled out, 10100 as
// ONEZEROONEZEROZERO; a value is a literal, "" for a quote inside) and checks:
// every folder exists under _CODE/U; its name is its literal (a code point, or a two-digit block);
// every view states its basis and source; every view resolves every folder; and no view is named
// LITERAL, so none replaces the folder (rules V1 to V4). No view is taken as the reference.
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const file = process.argv[2] || path.join(ROOT, "_ARCHIVE/Configurations/VIEWS.wsn");
const DIGITS = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];

/** A key from its identifier's part: spelled digits back to digits, else the capitals as they are. */
function key(part) {
  let rest = part, out = "";
  while (rest) {
    const d = DIGITS.findIndex((w) => rest.startsWith(w));
    if (d < 0) return part;
    out += d;
    rest = rest.slice(DIGITS[d].length);
  }
  return out;
}

function parse(text) {
  const prod = new Map();
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const m = line.match(/^([A-Z]+) = (.*) \.$/);
    if (!m) throw new Error(`not a production: ${line}`);
    prod.set(m[1], m[2]);
  }
  const node = (name) => {
    const rhs = prod.get(name);
    if (rhs.startsWith('"')) return rhs.slice(1, -1).replace(/""/g, '"');
    const o = {};
    for (const child of rhs.split(" ")) o[key(child.slice(name.length))] = node(child);
    return o;
  };
  const top = text.match(/^([A-Z]+) =/)[1];
  return { [top]: node(top) };
}

const { VIEWS: views, FOLDERS: folders } = parse(fs.readFileSync(file, "utf8")).VIEWS;
const fail = [];
for (const [name, v] of Object.entries(views)) {
  if (!/^[A-Z0-9]{1,8}$/.test(name)) fail.push(`view ${name}: not a tag`);
  if (name === "LITERAL") fail.push("a view is named LITERAL (V1)");
  if (!v.BASIS || !v.SOURCE) fail.push(`view ${name}: no basis or source (V2)`);
}
for (const [folder, f] of Object.entries(folders)) {
  if (!fs.statSync(path.join(ROOT, "_CODE/U", folder), { throwIfNoEntry: false })?.isDirectory())
    fail.push(`${folder}: no _CODE/U/${folder}`);
  const cp = parseInt(folder, 16), block = folder.length === 2;
  const head = block ? `U+${folder}00` : `U+${folder}`;
  if (!(cp >= 0 && cp <= 0x10ffff) || !f.LITERAL?.includes(head)) fail.push(`${folder}: literal does not name ${head} (V1)`);
  for (const name of Object.keys(views)) if (!f[name]) fail.push(`${folder}: not resolved by ${name} (V4)`);
  for (const key of Object.keys(f)) if (key !== "LITERAL" && !views[key]) fail.push(`${folder}: ${key} is not a declared view (V2)`);
}
if (fail.length) {
  for (const f of fail) console.error(`FAIL: ${f}`);
  process.exit(1);
}

for (const [folder, f] of Object.entries(folders)) {
  const glyph = folder.length === 2 ? String.fromCodePoint(parseInt(folder + "00", 16)) : String.fromCodePoint(parseInt(folder, 16));
  console.log(`_CODE/U/${folder}  ${glyph}  ${f.LITERAL}`);
  for (const name of Object.keys(views)) console.log(`  ${name.padEnd(8)} ${f[name]}`);
}
console.log(`PASS: ${Object.keys(folders).length} folders, ${Object.keys(views).length} views, each folder resolved by each view, no literal renamed`);
