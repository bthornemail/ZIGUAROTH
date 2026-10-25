// buffer.js — frame a body as a buffer, or check one: a 12-byte head, MIME fields, a 4-byte tail.
//
//   node _ARCHIVE/Expressions/buffer.js wrap <body> <path> <content-type> <description> > out
//   node _ARCHIVE/Expressions/buffer.js check <buffer>
//
// A buffer begins with the 12 bytes "ZIGUA-ROTH: " and its path of provenance, carries the
// MIME fields of rule B3, ends its header with CR LF CR LF, and holds the body byte for byte.
// The header is ASCII; a non-ASCII code point in a field value is written as U+XXXX (B2).
import { readFileSync } from "node:fs";

const HEAD = Buffer.from("ZIGUA-ROTH: ", "ascii");   // 12 bytes
const TAIL = Buffer.from("\r\n\r\n", "ascii");        // 4 bytes
const asciiField = (s) => [...s].map((c) => c.codePointAt(0) < 0x80 ? c
  : "U+" + c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")).join("");

function wrap(body, path, type, description) {
  const fields = [
    "MIME-Version: 1.0",
    `Content-Type: ${type}`,
    "Content-Transfer-Encoding: binary",
    `Content-Length: ${body.length}`,
    `Content-Description: ${asciiField(description)}`,
  ];
  const head = Buffer.from(asciiField(path) + "\r\n" + fields.join("\r\n"), "ascii");
  return Buffer.concat([HEAD, head, TAIL, body]);
}

function check(buf) {
  if (!buf.subarray(0, 12).equals(HEAD)) throw new Error("B1: the first 12 bytes are not ZIGUA-ROTH: ");
  const end = buf.indexOf(TAIL);
  if (end < 0) throw new Error("B4: no CR LF CR LF ends the header");
  const header = buf.subarray(0, end);
  if (header.some((b) => b > 0x7f)) throw new Error("B2: the header is not ASCII");
  const lines = header.toString("ascii").split("\r\n");
  const path = lines[0].slice(12);
  const field = {};
  for (const line of lines.slice(1)) {
    const i = line.indexOf(": ");
    if (i < 1) throw new Error(`B3: not a field: ${JSON.stringify(line)}`);
    field[line.slice(0, i).toLowerCase()] = line.slice(i + 2);
  }
  for (const name of ["mime-version", "content-type", "content-transfer-encoding", "content-length", "content-description"])
    if (!(name in field)) throw new Error(`B3: no ${name} field`);
  if (field["content-transfer-encoding"] !== "binary") throw new Error("B3: the transfer encoding is not binary");
  const body = buf.subarray(end + 4);
  if (String(body.length) !== field["content-length"])
    throw new Error(`B6: the body is ${body.length} bytes, the header says ${field["content-length"]}`);
  return { path, field, body };
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "wrap" && args.length === 4) {
  process.stdout.write(wrap(readFileSync(args[0]), args[1], args[2], args[3]));
} else if (cmd === "check" && args.length === 1) {
  const { path, field, body } = check(readFileSync(args[0]));
  console.log(`${args[0]}: a buffer; path ${path}; ${field["content-type"]}; body ${body.length} bytes`);
} else {
  console.error("usage: buffer.js wrap <body> <path> <content-type> <description> | buffer.js check <buffer>");
  process.exit(2);
}
