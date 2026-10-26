// mask.js — the pixel mask of difference between witnesses, per layer, never resolved.
//
//   node _ARCHIVE/Expressions/mask.js LENINGRAD=יְהוָה ALEPPO=יְהֹוָה ...
//
// Each witness is NFC-normalized and cut into cells, one per letter (a Hebrew letter,
// U+05D0 to U+05EA, with the marks that follow it). For every pair of witnesses it prints two
// masks, one bit per cell: the letter layer and the mark layer, 1 where the pair differs.
// A witness given as NAME= (empty) lacks the passage: the empty base mirrors only another
// empty, so against a reading every cell differs. No witness is taken as the reference.
const witnesses = process.argv.slice(2).map((arg) => {
  const i = arg.indexOf("=");
  if (i < 1) throw new Error(`not NAME=literal: ${arg}`);
  return { name: arg.slice(0, i), text: arg.slice(i + 1).normalize("NFC") };
});
if (witnesses.length < 2) {
  console.error("usage: mask.js NAME=literal NAME=literal [...]");
  process.exit(2);
}

const isLetter = (c) => c >= "א" && c <= "ת";
function cells(text) {
  const out = [];
  for (const c of text) {
    if (isLetter(c) || out.length === 0) out.push({ letter: c, marks: "" });
    else out[out.length - 1].marks += c;
  }
  return out;
}

const hex = (bits) => bits.length ? "0x" + parseInt(bits, 2).toString(16).toUpperCase() : "-";
const all = witnesses.map((w) => ({ ...w, cells: cells(w.text) }));
for (let i = 0; i < all.length; i++) {
  for (let j = i + 1; j < all.length; j++) {
    const a = all[i], b = all[j], n = Math.max(a.cells.length, b.cells.length);
    let letters = "", marks = "";
    for (let k = 0; k < n; k++) {
      const x = a.cells[k], y = b.cells[k];
      letters += x && y && x.letter === y.letter ? "0" : "1";
      marks += x && y && x.marks === y.marks ? "0" : "1";
    }
    console.log(`${a.name} ${b.name}: letters ${letters || "(empty)"} ${hex(letters)}  marks ${marks || "(empty)"} ${hex(marks)}`);
  }
}
