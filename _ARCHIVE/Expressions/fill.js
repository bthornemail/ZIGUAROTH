// fill.js — the codex filled from its witnesses: each double-barrel form of the Name, Aleppo (MAM) against
// Leningrad, written as a term in the codex's own form (the _CODEX lines and their .wsn, the _CODICES literal with
// its verse and its XOR and XNOR lines), then checked by codex.js.
//
//   node _ARCHIVE/Expressions/fill.js <witness dir>      (the dir holding aleppo-mam/ and leningrad/, kept private)
//   node _ARCHIVE/Expressions/fill.js <witness dir> -n   (write nothing; print what would be written)
//
// The author, 2026-11-03: "the more we fill the codex the more double barrell terms will consolidate the convergence
// of terms over narrative and language inheritance", choosing the Name's forms first. Read from the witnesses: the
// chapters both hold, verse by verse where both have the same number of words, word by word; cantillation (U+0591 to
// U+05AF), meteg, paseq and sof pasuq dropped, the vowel points kept. A form is a pair (Aleppo's word, Leningrad's
// word) with the same consonants and other vowels; its verse is the first where the pair stands, in book order.
// The falsifier: YHWH, written by hand before this script, must come out byte for byte as it is.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert");

const ROOT = path.resolve(__dirname, "../..");
const [WIT, flag] = process.argv.slice(2);
if (!WIT) { console.error("usage: node fill.js <witness dir> [-n]"); process.exit(2); }
const DRY = flag === "-n", CELL = 0x2800, SIGN = 0x10107, ch = String.fromCodePoint;
const BOOKS = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "I_Samuel", "II_Samuel", "I_Kings", "II_Kings", "Isaiah"];

// The Name's forms, each with its tag; consonants as the tags already in the codex write them (YHWH).
const FORMS = [
  { tag: "YHWH", base: "יהוה" },
  { tag: "LYHWH", base: "ליהוה" },
  { tag: "BYHWH", base: "ביהוה" },
  { tag: "WYHWH", base: "ויהוה" },
  { tag: "MYHWH", base: "מיהוה" },
  { tag: "YEHOWIH", base: "יהוה", vowels: "ֱִֹ" },	// the Name read as Elohim: hataf segol, holam, hiriq
];
const KEYS = [["YHWH", "YHWH"], ["YAHWEH", "YAHWEH"], ["GODISWORD", "GOD IS WORD"], ["GODOFWORD", "GOD OF WORD"]];

// ── the witnesses ──
const DROP = /[֑-ֽ֯׀׃]/gu;
const wordsOf = (s) => s.replace(/<[^>]+>/g, "").replace(/\{[^}]*\}/g, "").replace(/&[a-z]+;/g, "")
  .split(/[\s־]+/u).map((w) => w.replace(DROP, "").normalize("NFC")).filter((w) => /[א-ת]/u.test(w));
const consonants = (w) => w.replace(/[^א-ת]/gu, "");
const textOf = (f) => JSON.parse(fs.readFileSync(f, "utf8")).versions[0].text;
const shared = fs.readdirSync(path.join(WIT, "aleppo-mam")).filter((f) => f.endsWith(".json") && fs.existsSync(path.join(WIT, "leningrad", f)))
  .map((f) => { const [book, chap] = f.replace(/\.json$/, "").split("."); return { f, book, chap: +chap }; })
  .sort((a, b) => BOOKS.indexOf(a.book) - BOOKS.indexOf(b.book) || a.chap - b.chap);
assert.ok(shared.every((s) => BOOKS.includes(s.book)), "every shared chapter's book is in the book order");
const pairs = new Map();	// "aleppo|leningrad" -> { aleppo, leningrad, at, count }
let words = 0, identical = 0, double = 0, qatan = 0;
for (const { f, book, chap } of shared) {
  const a = textOf(path.join(WIT, "aleppo-mam", f)), l = textOf(path.join(WIT, "leningrad", f));
  a.forEach((va, v) => {
    const wa = wordsOf(va), wl = wordsOf(l[v] ?? "");
    if (wa.length !== wl.length) return;
    wa.forEach((x, i) => {
      const y = wl[i]; words++;
      if (x === y) { identical++; return; }
      if (consonants(x) !== consonants(y)) return;
      if (x.replace(/\u05c7/gu, "\u05b8") === y) { qatan++; return; }	// MAM's qamatz qatan, an editorial mark, not a reading
      double++;
      const k = x + "|" + y, p = pairs.get(k) ?? { aleppo: x, leningrad: y, at: `${book.replace(/_/g, " ")} ${chap}:${v + 1}`, count: 0 };
      p.count++; pairs.set(k, p);
    });
  });
}

// ── the codex's form (as codex.js reads it) ──
const cellsOf = (cp) => [...Buffer.from(ch(cp), "utf8")].map((b) => ch(CELL + b)).join("");
const numeralOf = (n) => { let s = ""; for (let p = 4; p >= 0; p--) { const d = Math.floor(n / 10 ** p) % 10; if (d) s += ch(SIGN + 9 * p + d - 1); } return s; };
const braille = (s) => [...s].map((c) => cellsOf(c.codePointAt(0))).join(" ");
const aegean = (s) => [...s].map((c) => numeralOf(c.codePointAt(0))).join(" ");
const xorLine = (lit, key, xnor) => { const k = Buffer.from(key, "ascii"); return [...Buffer.from(lit, "utf8")].map((b, i) => ch(CELL + ((b ^ (k[i] ?? 0)) ^ (xnor ? 0xff : 0)))).join(""); };
const head = (tag) => `${tag} = ALEPPO OPTWHITESPACE OPTWHITESPACE LENINGRAD .\nOPTWHITESPACE = { " " } .\n`;

function files(tag, w) {
  const codex = `[0] ALEPPO\n${braille(w.aleppo)}\n${aegean(w.aleppo)}\n[1] ROSETTA\n\n[2] BEHISTUN\n\n[3] LENINGRAD\n${braille(w.leningrad)}\n${aegean(w.leningrad)}\n`;
  let beside = head(tag), codices = head(tag);
  for (const [S, lit] of [["ALEPPO", w.aleppo], ["LENINGRAD", w.leningrad]]) {
    beside += `${S} = ${S}BRAILLE ${S}AEGEAN .\n${S}BRAILLE = "${braille(lit)}" .\n${S}AEGEAN = "${aegean(lit)}" .\n`;
    const names = KEYS.flatMap(([n]) => [`${S}XOR${n}`, `${S}XNOR${n}`]);
    codices += `${S} = ${S}LITERAL ${S}AT ${names.join(" ")} .\n${S}LITERAL = "${lit}" .\n${S}AT = "${w.at}" .\n`;
    for (const [n, key] of KEYS) codices += `${S}XOR${n} = "${xorLine(lit, key, false)}" .\n${S}XNOR${n} = "${xorLine(lit, key, true)}" .\n`;
  }
  const L = tag[0], dir = path.join(L + L, tag), low = tag.toLowerCase();
  return [[path.join("_CODEX", dir, low), codex], [path.join("_CODEX", dir, low + ".wsn"), beside], [path.join("_CODICES", L.repeat(4), tag, low + ".wsn"), codices]];
}

// ── each form: its most frequent pair, the first verse it stands in ──
const out = [];
for (const F of FORMS) {
  const cands = [...pairs.values()].filter((p) => consonants(p.aleppo) === F.base && (!F.vowels || [...F.vowels].every((v) => p.aleppo.includes(v))) && (F.vowels || !p.aleppo.includes("ִ")));
  assert.ok(cands.length, `${F.tag}: a double-barrel pair in the witnesses`);
  const w = cands.sort((a, b) => b.count - a.count)[0];
  out.push({ F, w, others: cands.length - 1 });
}

// the falsifier: YHWH as written by hand
const yhwh = files("YHWH", out.find((o) => o.F.tag === "YHWH").w);
for (const [rel, text] of yhwh) assert.equal(text, fs.readFileSync(path.join(ROOT, rel), "utf8"), `${rel}: the hand-written YHWH comes out byte for byte`);

let written = 0;
for (const { F, w } of out) for (const [rel, text] of files(F.tag, w)) {
  const p = path.join(ROOT, rel);
  if (fs.existsSync(p)) { assert.equal(fs.readFileSync(p, "utf8"), text, `${rel}: already there, and the same`); continue; }
  if (!DRY) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); }
  written++;
}
const name = out.reduce((n, o) => n + o.w.count, 0);
console.log(`fill.js: ${shared.length} shared chapters, ${words} aligned words, ${identical} identical, ${qatan} differing only by MAM's qamatz qatan, ${double} double-barrel (same consonants, other vowels) in ${pairs.size} forms; the Name's ${out.length} forms, ${name} of the ${double} on the one base יהוה:`);
for (const { F, w, others } of out) console.log(`  ${F.tag.padEnd(8)} ${w.aleppo} | ${w.leningrad}  x${w.count}  first ${w.at}${others ? `  (${others} other pair${others > 1 ? "s" : ""} of this form)` : ""}`);
console.log(`${DRY ? "would write" : "wrote"} ${written} files; YHWH reproduced byte for byte`);
