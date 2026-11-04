// codex.js — the codex's two readings reconciled: every _CODEX term's Braille and Aegean, checked against each other,
// against the WSN beside it, against the literal in _CODICES, and against I-251's transcription.
//
//   node _ARCHIVE/Expressions/codex.js
//
// The author, 2026-11-03, choosing to "Reconcile them" (the codex's own form and boxedPINE's I-251) and to build
// "From what's in place". The codex's form, read from its files: a term's Braille line is each code point's UTF-8
// bytes, one 8-dot cell a byte (U+2800 + byte), a space between code points; its Aegean line is each code point's
// value in decimal, in additive Aegean numerals (U+10107 + 9 x place + digit - 1, highest place first, a zero
// digit absent), a space between. Checked:
//   1. each Braille line and its Aegean line name the same code points, one for one;
//   2. each line is a sentence of the form's grammar in Wirth syntax notation (CELLS: UTF-8's shapes over the 256
//      cells; NUMERAL: one sign at most a place, five places); the grammar is written here and read by a WSN reader;
//   3. the .wsn beside a term holds its lines as literals, the same lines;
//   4. a term in _CODICES: its LITERAL is the code points the _CODEX lines name, and each XOR line is the literal's
//      UTF-8 bytes XOR the key's (the key then zeros), each XNOR line that complemented;
//   5. I-251's transcription of the same code points reads back to them: the two forms carry the same code points;
//   6. the limit: an additive Aegean numeral reaches 99,999; any code point past it is named.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert");

const ROOT = path.resolve(__dirname, "../..");
const CELL = 0x2800, SIGN = 0x10107, SECTIONS = ["ALEPPO", "ROSETTA", "BEHISTUN", "LENINGRAD"];
const ch = String.fromCodePoint;

// ── the codex's form ──
const cellsOf = (cp) => [...Buffer.from(ch(cp), "utf8")].map((b) => ch(CELL + b)).join("");
const numeralOf = (n) => { let s = ""; for (let place = 4; place >= 0; place--) { const d = Math.floor(n / 10 ** place) % 10; if (d) s += ch(SIGN + 9 * place + d - 1); } if (n > 99999) throw new Error(`${n} past 99,999`); return s; };
const readCells = (w) => { const bytes = [...w].map((c) => c.codePointAt(0) - CELL); const s = Buffer.from(bytes).toString("utf8"); assert.equal([...s].length, 1, `${w}: one code point`); assert.deepEqual([...Buffer.from(s, "utf8")], bytes, `${w}: well-formed UTF-8`); return s.codePointAt(0); };
const readNumeral = (w) => [...w].reduce((n, c) => { const k = c.codePointAt(0) - SIGN; return n + ((k % 9) + 1) * 10 ** Math.floor(k / 9); }, 0);

// ── its grammar, in Wirth syntax notation ──
const alt = (a, n) => [...Array(n).keys()].map((i) => `"${ch(a + i)}"`).join(" | ");
const GRAMMAR = [
  `CELLS = CODEPOINT { " " CODEPOINT } .`,
  `CODEPOINT = ONE | LEADTWO CONT | LEADTHREE CONT CONT | LEADFOUR CONT CONT CONT .`,
  `ONE = ${alt(CELL, 0x80)} .`,
  `CONT = ${alt(CELL + 0x80, 0x40)} .`,
  `LEADTWO = ${alt(CELL + 0xc2, 30)} .`,
  `LEADTHREE = ${alt(CELL + 0xe0, 16)} .`,
  `LEADFOUR = ${alt(CELL + 0xf0, 5)} .`,
  `NUMERALS = NUMERAL { " " NUMERAL } .`,
  `NUMERAL = [ TENTHOUSANDS ] [ THOUSANDS ] [ HUNDREDS ] [ TENS ] [ UNITS ] .`,
  `UNITS = ${alt(SIGN, 9)} .`, `TENS = ${alt(SIGN + 9, 9)} .`, `HUNDREDS = ${alt(SIGN + 18, 9)} .`,
  `THOUSANDS = ${alt(SIGN + 27, 9)} .`, `TENTHOUSANDS = ${alt(SIGN + 36, 9)} .`,
].join("\n");
function wsnToRegExp(text, start) {	// Wirth's SYNTAX = { PRODUCTION } ., read to a regular expression (no recursion here)
  const toks = [...text.matchAll(/"((?:[^"]|"")*)"|([A-Za-z]+)|([=|.\[\](){}])|\s+/gu)].filter((m) => !/^\s+$/.test(m[0]));
  const prods = new Map();
  for (let i = 0; i < toks.length;) { const name = toks[i][2]; let j = i + 2; while (toks[j][3] !== ".") j++; prods.set(name, toks.slice(i + 2, j)); i = j + 1; }
  const esc = (x) => x.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
  const expr = (ts, seen) => {
    let i = 0;
    const exp = () => { const t = [term()]; while (ts[i]?.[3] === "|") { i++; t.push(term()); } return t.length > 1 ? `(?:${t.join("|")})` : t[0]; };
    const term = () => { let f = ""; while (i < ts.length && !["|", "]", ")", "}"].includes(ts[i][3] ?? "")) f += factor(); return f; };
    const factor = () => {
      const t = ts[i++];
      if (t[1] !== undefined) return esc(t[1].replace(/""/g, '"'));
      if (t[2] !== undefined) { if (seen.includes(t[2])) throw new Error(`recursion through ${t[2]}`); return `(?:${expr(prods.get(t[2]), [...seen, t[2]])})`; }
      const inner = exp(); i++;
      return t[3] === "[" ? `(?:${inner})?` : t[3] === "{" ? `(?:${inner})*` : `(?:${inner})`;
    };
    return exp();
  };
  return new RegExp(`^${expr(prods.get(start), [start])}$`, "u");
}
const CELLS = wsnToRegExp(GRAMMAR, "CELLS"), NUMERALS = wsnToRegExp(GRAMMAR, "NUMERALS");

// ── I-251's transcription (boxedPINE proofs/js/catalog/I-251.ts), its cast and its reading, for the same code points ──
const BA = " A1B'K2L@CIF/MSP\"E3H9O6R^DJG>NTQ,*5<-U8V.%[$+X!&;:4\\0Z7(_?W]#Y)=", VOWEL = 0x10000, PLANE = 0x10107;
const BLOCKS = [[0x300, 0x36f], [0x1ab0, 0x1aff], [0x1dc0, 0x1dff], [0x20d0, 0x20ff], [0xfe20, 0xfe2f]];
const upper = (c) => c >= 0x41 && c <= 0x5a;
function cast251(c) {
  if (c >= 0x61 && c <= 0x7a) return [CELL + BA.indexOf(ch(c - 0x20))];
  if (upper(c)) return [CELL + BA.indexOf(ch(c)) + 0x40];
  if (c >= 0x20 && c <= 0x5f) return [CELL + BA.indexOf(ch(c))];
  const k = BLOCKS.findIndex(([a, b]) => c >= a && c <= b);
  if (k >= 0 && /^\p{Mn}$/u.test(ch(c))) return [VOWEL + k, CELL + c - BLOCKS[k][0]];
  return [PLANE + (c >> 16), CELL + ((c >> 8) & 255), CELL + (c & 255)];
}
function read251(g) {
  const out = [];
  for (let i = 0; i < g.length; i++) {
    const x = g[i];
    if (x >= PLANE && x <= PLANE + 16) { out.push(((x - PLANE) << 16) | ((g[i + 1] - CELL) << 8) | (g[i + 2] - CELL)); i += 2; }
    else if (x >= VOWEL && x <= VOWEL + 4) { out.push(BLOCKS[x - VOWEL][0] + g[++i] - CELL); }
    else { const v = x - CELL; const c = v < 64 ? BA.codePointAt(v) : BA.codePointAt(v - 0x40); out.push(v < 64 ? (upper(c) ? c + 0x20 : c) : c); }
  }
  return out;
}

// ── the terms ──
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const terms = walk(path.join(ROOT, "_CODEX")).filter((f) => !path.extname(f));
let pairs = 0, codepoints = 0, sentences = 0, wsnLines = 0, xors = 0, past = [];
const seen = new Set();
for (const file of terms) {
  const rel = path.relative(ROOT, file), lines = fs.readFileSync(file, "utf8").split("\n");
  const sections = new Map();	// section -> [braille, aegean] pairs
  let at = "";
  for (const l of lines) { const m = /^\[(\d)\] ([A-Z]+)$/.exec(l); if (m) { at = m[2]; sections.set(at, []); continue; } if (l.trim()) { if (!sections.has(at)) sections.set(at, []); sections.get(at).push(l); } }
  for (const [section, ls] of sections) {
    assert.equal(ls.length % 2, 0, `${rel} ${section}: lines in pairs, Braille then Aegean`);
    for (let i = 0; i < ls.length; i += 2) {
      const [b, a] = [ls[i], ls[i + 1]];
      assert.ok(CELLS.test(b), `${rel} ${section}: its Braille a sentence of CELLS`);
      assert.ok(NUMERALS.test(a), `${rel} ${section}: its Aegean a sentence of NUMERALS`);
      sentences += 2;
      const cb = b.split(" ").map(readCells), ca = a.split(" ").map(readNumeral);
      assert.deepEqual(cb, ca, `${rel} ${section}: the Braille and the Aegean name the same code points`);
      assert.equal(b, cb.map(cellsOf).join(" "), `${rel}: the Braille written back`);
      assert.equal(a, cb.map(numeralOf).join(" "), `${rel}: the Aegean written back`);
      assert.deepEqual(read251(cb.flatMap(cast251)), cb, `${rel} ${section}: I-251's transcription reads back the same code points`);
      for (const c of cb) { seen.add(c); if (c > 99999) past.push(c); }
      pairs++; codepoints += cb.length;
    }
    // the term's literal in _CODICES
    if (section && ls.length === 2) {
      const lit = String.fromCodePoint(...ls[0].split(" ").map(readCells));
      const wsn = file.replace(/_CODEX\/[A-Z]{2}\//, (m) => "_CODICES/" + m.slice(7, 9).repeat(2) + "/") + ".wsn";
      if (fs.existsSync(wsn)) {
        const text = fs.readFileSync(wsn, "utf8"), get = (n) => new RegExp(`^${n} = "((?:[^"]|"")*)" \\.$`, "mu").exec(text)?.[1]?.replace(/""/g, '"');
        const literal = get(`${section}LITERAL`);
        if (literal !== undefined) {
          assert.equal(lit, literal, `${rel} ${section}: the literal in _CODICES`);
          for (const m of text.matchAll(new RegExp(`^${section}(XOR|XNOR)([A-Z]+) = "((?:[^"]|"")*)" \\.$`, "gmu"))) {
            const keyName = m[2], cells = [...m[3]].map((c) => c.codePointAt(0) - CELL);
            const keyText = { YHWH: "YHWH", YAHWEH: "YAHWEH", GODISWORD: "GOD IS WORD", GODOFWORD: "GOD OF WORD", GODWASWORD: "GOD WAS WORD", WORDISGOD: "WORD IS GOD", WORDOFGOD: "WORD OF GOD", WORDWASGOD: "WORD WAS GOD" }[keyName];
            if (!keyText) continue;
            const bytes = [...Buffer.from(literal, "utf8")], key = [...Buffer.from(keyText, "ascii")];
            const want = bytes.map((x, i) => (x ^ (key[i] ?? 0)) ^ (m[1] === "XNOR" ? 0xff : 0));
            assert.deepEqual(cells, want, `${rel} ${section}: ${m[1]} ${keyText}, the literal's bytes against the key's`);
            xors++;
          }
        }
      }
    }
  }
  const beside = file + ".wsn";
  if (fs.existsSync(beside) && sections.size && [...sections.keys()].some((s) => s)) {
    const text = fs.readFileSync(beside, "utf8");
    for (const [section, ls] of sections) if (ls.length === 2) {
      assert.ok(text.includes(`${section}BRAILLE = "${ls[0]}" .`) && text.includes(`${section}AEGEAN = "${ls[1]}" .`), `${rel}.wsn: ${section}'s lines as its literals`);
      wsnLines += 2;
    }
  }
}
// the falsifier: one cell changed breaks the agreement with the Aegean
assert.throws(() => assert.deepEqual([readCells("⣗⢙")], [readNumeral("𐄢𐄜𐄘𐄌")]), "yod's cells against 1496: they disagree");
console.log(`codex.js: ${terms.length} terms, ${pairs} Braille and Aegean pairs, ${codepoints} code points (${seen.size} distinct), ${sentences} lines sentences of the form's WSN, ${wsnLines} lines held in their .wsn, ${xors} XOR and XNOR lines from their literals, I-251 reading back the same code points in every pair; past 99,999: ${past.length ? past.map((c) => "U+" + c.toString(16)).join(" ") : "none"}`);
