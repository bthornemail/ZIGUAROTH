// transliterate.js — map a template's code points through a static mapping, nothing else.
//
//   node _ARCHIVE/Expressions/transliterate.js <template> <mapping.yaml> [output]
//
// The mapping is a flat YAML map of quoted code points, one per line:
//   "U+2800": "U+28FF"
// A template's ASCII (U+0000 to U+007F) is its syntax and is never mapped; a mapping that
// names an ASCII code point on either side is refused. Every other code point in the
// template is copied as it is unless the mapping names it. Writes to [output], or stdout.
import { readFileSync, writeFileSync } from "node:fs";

const [template, mappingFile, output] = process.argv.slice(2);
if (!template || !mappingFile) {
  console.error("usage: node transliterate.js <template> <mapping.yaml> [output]");
  process.exit(2);
}

const CP = /^U\+([0-9A-F]{4,6})$/;
const map = new Map();
readFileSync(mappingFile, "utf8").split("\n").forEach((line, i) => {
  if (!line.trim() || line.trimStart().startsWith("#")) return;
  const m = line.match(/^"([^"]+)":\s*"([^"]+)"\s*$/);
  if (!m || !CP.test(m[1]) || !CP.test(m[2])) throw new Error(`${mappingFile}:${i + 1}: not "U+XXXX": "U+XXXX"`);
  const from = parseInt(m[1].slice(2), 16), to = parseInt(m[2].slice(2), 16);
  if (from < 0x80 || to < 0x80) throw new Error(`${mappingFile}:${i + 1}: ASCII is the template's syntax and is never mapped`);
  if (from > 0x10ffff || to > 0x10ffff || (to >= 0xd800 && to <= 0xdfff)) throw new Error(`${mappingFile}:${i + 1}: not a code point`);
  if (map.has(from)) throw new Error(`${mappingFile}:${i + 1}: U+${m[1].slice(2)} is mapped twice`);
  map.set(from, to);
});

const src = [...readFileSync(template, "utf8")];
const out = src.map((c) => String.fromCodePoint(map.get(c.codePointAt(0)) ?? c.codePointAt(0)));

// The check: same length in code points, ASCII untouched, and every change is a mapped one.
let changed = 0;
src.forEach((c, i) => {
  if (c === out[i]) return;
  if (c.codePointAt(0) < 0x80 || map.get(c.codePointAt(0)) !== out[i].codePointAt(0)) throw new Error(`position ${i}: an unmapped change`);
  changed++;
});

const text = out.join("");
if (output) writeFileSync(output, text); else process.stdout.write(text);
console.error(`${template}: ${src.length} code points, ${changed} mapped (${map.size} in the mapping), ASCII untouched`);
