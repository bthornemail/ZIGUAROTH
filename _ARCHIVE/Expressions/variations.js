// variations.js — the Name's variations written into the codex in its own form, then checked by codex.js.
//
//   node _ARCHIVE/Expressions/variations.js <witness dir>      (the dir holding aleppo-mam/ and leningrad/, kept private)
//   node _ARCHIVE/Expressions/variations.js <witness dir> -n   (write nothing; print what would be written)
//
// The author, 2026-11-03: "the variations are arealdy YAH YAHWEH YHWH ADONAI ADAM EVE EARTH FIRE YOD GOD IS WORD
// GOD OF WORD GOD WAS WORD WORD IS GOD WORD OF GOD WORD WAS GOD ... these words produce invariants"; then "now we
// can procceed to converge the constants over the codices", the codex first. YHWH is in the codex already.
//
// A Hebrew term is its pointed form as it stands in a verse (cantillation, meteg, paseq and sof pasuq dropped):
//   - the LENINGRAD section at Leningrad's first occurrence, in book order (as ELOHIM's Genesis 1:1);
//   - the ALEPPO section, when there is one, at the first verse both witnesses hold where the two words align and
//     agree in their consonants (as YHWH's Deuteronomy 29:1);
// each with its literal, its verse, and its XOR and XNOR lines against YHWH, YAHWEH, GOD IS WORD and GOD OF WORD.
// The exact pointed form is required: Deuteronomy 29:22's אַדְמָה is Admah, the city, not אֲדָמָה, the ground, and
// Joshua 5:14's אֲדֹנִי is "my lord", not אֲדֹנָי. YOD is the letter itself, and YAHWEH and the six lines are their
// Latin letters; these carry no witness and are written as EULER is, Braille and Aegean lines alone.
// The falsifier: the writer, given YHWH's and ELOHIM's literals and verses, writes their files byte for byte as they are.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert");

const ROOT = path.resolve(__dirname, "../..");
const [WIT, flag] = process.argv.slice(2);
if (!WIT) { console.error("usage: node variations.js <witness dir> [-n]"); process.exit(2); }
const DRY = flag === "-n", CELL = 0x2800, SIGN = 0x10107, ch = String.fromCodePoint;
const BOOKS = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "I_Samuel", "II_Samuel", "I_Kings", "II_Kings", "Isaiah", "Jeremiah", "Ezekiel", "Jonah", "I_Chronicles"];

const HEBREW = [
  ["YAH", "יָהּ"], ["ADONAI", "אֲדֹנָי"], ["ADAM", "אָדָם"], ["EVE", "חַוָּה"], ["EARTH", "אֲדָמָה"], ["FIRE", "אֵשׁ"],
].map(([tag, form]) => ({ tag, form: form.normalize("NFC") }));
const PLAIN = [["YOD", "י"], ["YAHWEH", "YAHWEH"], ["GODISWORD", "GOD IS WORD"], ["GODOFWORD", "GOD OF WORD"], ["GODWASWORD", "GOD WAS WORD"],
  ["WORDISGOD", "WORD IS GOD"], ["WORDOFGOD", "WORD OF GOD"], ["WORDWASGOD", "WORD WAS GOD"]];
const KEYS = [["YHWH", "YHWH"], ["YAHWEH", "YAHWEH"], ["GODISWORD", "GOD IS WORD"], ["GODOFWORD", "GOD OF WORD"]];

// ── the witnesses ──
const DROP = /[֑-ֽ֯׀׃]/gu;
const wordsOf = (s) => s.replace(/<[^>]+>/g, "").replace(/\{[^}]*\}/g, "").replace(/&[a-z]+;/g, "")
  .split(/[\s־]+/u).map((w) => w.replace(DROP, "").normalize("NFC")).filter((w) => /[א-ת]/u.test(w));
const consonants = (w) => w.replace(/[^א-ת]/gu, "");
const textOf = (f) => JSON.parse(fs.readFileSync(f, "utf8")).versions[0].text;
const order = (fs_) => fs_.filter((f) => f.endsWith(".json")).map((f) => { const [book, chap] = f.slice(0, -5).split("."); assert.ok(BOOKS.includes(book), `${book} in the book order`); return { f, book, chap: +chap }; })
  .sort((a, b) => BOOKS.indexOf(a.book) - BOOKS.indexOf(b.book) || a.chap - b.chap);
const ref = (c, v) => `${c.book.replace(/_/g, " ")} ${c.chap}:${v + 1}`;
const len = order(fs.readdirSync(path.join(WIT, "leningrad")));
const shared = order(fs.readdirSync(path.join(WIT, "aleppo-mam")).filter((f) => fs.existsSync(path.join(WIT, "leningrad", f))));

function witness(form) {
  let leningrad = null, aleppo = null;
  for (const c of len) { if (leningrad) break; textOf(path.join(WIT, "leningrad", c.f)).forEach((s, v) => { if (!leningrad && wordsOf(s).includes(form)) leningrad = { literal: form, at: ref(c, v) }; }); }
  for (const c of shared) {
    if (aleppo) break;
    const a = textOf(path.join(WIT, "aleppo-mam", c.f)), l = textOf(path.join(WIT, "leningrad", c.f));
    a.forEach((va, v) => {
      if (aleppo) return;
      const wa = wordsOf(va), wl = wordsOf(l[v] ?? "");
      if (wa.length !== wl.length) return;
      wl.forEach((y, i) => { if (!aleppo && y === form && consonants(wa[i]) === consonants(y)) aleppo = { literal: wa[i], at: ref(c, v) }; });
    });
  }
  return { aleppo, leningrad };
}

// ── the codex's form (as codex.js reads it) ──
const cellsOf = (cp) => [...Buffer.from(ch(cp), "utf8")].map((b) => ch(CELL + b)).join("");
const numeralOf = (n) => { let s = ""; for (let p = 4; p >= 0; p--) { const d = Math.floor(n / 10 ** p) % 10; if (d) s += ch(SIGN + 9 * p + d - 1); } return s; };
const braille = (s) => [...s].map((c) => cellsOf(c.codePointAt(0))).join(" ");
const aegean = (s) => [...s].map((c) => numeralOf(c.codePointAt(0))).join(" ");
const xorLine = (lit, key, xnor) => { const k = Buffer.from(key, "ascii"); return [...Buffer.from(lit, "utf8")].map((b, i) => ch(CELL + ((b ^ (k[i] ?? 0)) ^ (xnor ? 0xff : 0)))).join(""); };
const where = (tag) => [path.join("_CODEX", tag[0] + tag[0], tag), path.join("_CODICES", tag[0].repeat(4), tag)];

function witnessed(tag, w) {	// w: { aleppo?, leningrad? }, each { literal, at }
  const S = [["ALEPPO", w.aleppo], ["ROSETTA", null], ["BEHISTUN", null], ["LENINGRAD", w.leningrad]];
  const head = `${tag} = ${S.map(([n, x]) => (x ? n : "OPTWHITESPACE")).join(" ")} .\nOPTWHITESPACE = { " " } .\n`;
  let codex = "", beside = head, codices = head;
  S.forEach(([n, x], i) => { codex += `[${i}] ${n}\n` + (x ? `${braille(x.literal)}\n${aegean(x.literal)}\n` : "\n"); });
  for (const [n, x] of S) {
    if (!x) continue;
    beside += `${n} = ${n}BRAILLE ${n}AEGEAN .\n${n}BRAILLE = "${braille(x.literal)}" .\n${n}AEGEAN = "${aegean(x.literal)}" .\n`;
    const names = KEYS.flatMap(([k]) => [`${n}XOR${k}`, `${n}XNOR${k}`]);
    codices += `${n} = ${n}LITERAL ${n}AT ${names.join(" ")} .\n${n}LITERAL = "${x.literal}" .\n${n}AT = "${x.at}" .\n`;
    for (const [k, key] of KEYS) codices += `${n}XOR${k} = "${xorLine(x.literal, key, false)}" .\n${n}XNOR${k} = "${xorLine(x.literal, key, true)}" .\n`;
  }
  const [cx, cc] = where(tag), low = tag.toLowerCase();
  return [[path.join(cx, low), codex], [path.join(cx, low + ".wsn"), beside], [path.join(cc, low + ".wsn"), codices]];
}
function plain(tag, literal) {
  const [cx] = where(tag), low = tag.toLowerCase();
  return [[path.join(cx, low), `${braille(literal)}\n${aegean(literal)}\n`],
    [path.join(cx, low + ".wsn"), `${tag} = BRAILLE AEGEAN .\nBRAILLE = "${braille(literal)}" .\nAEGEAN = "${aegean(literal)}" .\n`]];
}

// ── the falsifier: the existing entries, written again from their literals and verses ──
const lit = (rel, n) => new RegExp(`^${n} = "((?:[^"]|"")*)" \\.$`, "mu").exec(fs.readFileSync(path.join(ROOT, rel), "utf8"))[1];
const again = (tag, rel, sections) => witnessed(tag, Object.fromEntries(sections.map((s) => [s.toLowerCase(), { literal: lit(rel, `${s}LITERAL`), at: lit(rel, `${s}AT`) }])));
for (const [rel, text] of [...again("YHWH", "_CODICES/YYYY/YHWH/yhwh.wsn", ["ALEPPO", "LENINGRAD"]), ...again("ELOHIM", "_CODICES/EEEE/ELOHIM/elohim.wsn", ["LENINGRAD"])])
  assert.equal(text, fs.readFileSync(path.join(ROOT, rel), "utf8"), `${rel}: written again byte for byte`);

// ── the variations ──
const out = [], report = [];
for (const { tag, form } of HEBREW) {
  const w = witness(form);
  assert.ok(w.leningrad, `${tag}: ${form} stands in Leningrad`);
  out.push(...witnessed(tag, w));
  report.push(`  ${tag.padEnd(10)} ${form}  Leningrad ${w.leningrad.at}` + (w.aleppo ? `; Aleppo ${w.aleppo.literal} ${w.aleppo.at}` : "; no aligned Aleppo verse"));
}
for (const [tag, literal] of PLAIN) { out.push(...plain(tag, literal)); report.push(`  ${tag.padEnd(10)} ${literal}  (no witness)`); }

let written = 0;
for (const [rel, text] of out) {
  const p = path.join(ROOT, rel);
  if (fs.existsSync(p)) { assert.equal(fs.readFileSync(p, "utf8"), text, `${rel}: already there, and the same`); continue; }
  if (!DRY) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); }
  written++;
}
console.log(`variations.js: YHWH and ELOHIM written again byte for byte; ${HEBREW.length} Hebrew terms from the witnesses, ${PLAIN.length} without:`);
console.log(report.join("\n"));
console.log(`${DRY ? "would write" : "wrote"} ${written} files`);
