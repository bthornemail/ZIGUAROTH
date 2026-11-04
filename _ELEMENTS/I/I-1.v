// I-1.v — Euclid, Elements I.1, in Heath's words: "On a given finite straight line to construct an equilateral
// triangle." (Heath, The Thirteen Books of Euclid's Elements, 1908, public domain.)
//
// The author, 2026-11-04: "i want to convert to euclids elements into verilog files as the point being the 65536 or
// the YHWH and YAHWEH dialectic", with GPL Cver "for a minimum basis". The minimum basis is this one proposition.
//
// A point is one 16-bit word, one of the 65,536: two bytes, a and b, the Eisenstein integer a + b w on the
// triangular grid (vpi/omi_check.c). Euclid draws the circle about A through B and the circle about B through A;
// they meet in two points, one on each side of AB. Here each is reached by turning AB about A by a sixth of a turn,
// a whole-number map with no compass and no root: multiplying by 1 + w sends (a, b) to (a - b, a) (the turn one
// way), and multiplying by -w sends it to (b, b - a) (the turn the other way). Byte arithmetic wraps modulo 256,
// so the corners are exact while the coordinates stay within a signed byte.
//
// Kept as the author's reading: that the two meeting points, C and C', are the YHWH and YAHWEH of the dialectic,
// one construction's two poles (the record's 0-sphere, I-252).
// Written in Verilog-1995 (ports declared in the body, one assign a line); its sums and differences are lib/arith.v's
// add8 and sub8, built from XOR and AND, which both simulators evaluate alike.
module euclid_I_1(A, B, C, C2);
  input  [15:0] A, B;
  output [15:0] C, C2;
  wire [7:0] ax, ay, bx, by, dx, dy, t1, t2, cx, cy, ex, ey;
  assign ax = A[15:8];
  assign ay = A[7:0];
  assign bx = B[15:8];
  assign by = B[7:0];
  sub8 d0(bx, ax, dx);   // AB
  sub8 d1(by, ay, dy);
  sub8 d2(dx, dy, t1);
  add8 c0(ax, t1, cx);   // A + AB (1 + w): one meeting point
  add8 c1(ay, dx, cy);
  add8 e0(ax, dy, ex);   // A + AB (-w): the other
  sub8 d3(dy, dx, t2);
  add8 e1(ay, t2, ey);
  assign C  = { cx, cy };
  assign C2 = { ex, ey };
endmodule
