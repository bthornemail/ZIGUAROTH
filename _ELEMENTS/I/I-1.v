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
// Written in Verilog-1995 (ports declared in the body, one assign a line), and with its arithmetic made of gates:
// GPL Cver 2.12a, as built for this 64-bit host, evaluates the bitwise operators but gives x for + and - on byte
// vectors, so a byte sum is built here as the breadboard builds it, from XOR and AND (add8: the sum without carries
// is a XOR b, the carries (a AND b) shifted up, repeated eight times), and a difference as the sum with the
// complement and one (sub8). Icarus Verilog runs the same file.
module add8(a, b, y);
  input  [7:0] a, b;
  output [7:0] y;
  wire [7:0] s0, k0, s1, k1, s2, k2, s3, k3, s4, k4, s5, k5, s6, k6, s7, k7;
  assign s0 = a ^ b;     assign k0 = (a & b) << 1;
  assign s1 = s0 ^ k0;   assign k1 = (s0 & k0) << 1;
  assign s2 = s1 ^ k1;   assign k2 = (s1 & k1) << 1;
  assign s3 = s2 ^ k2;   assign k3 = (s2 & k2) << 1;
  assign s4 = s3 ^ k3;   assign k4 = (s3 & k3) << 1;
  assign s5 = s4 ^ k4;   assign k5 = (s4 & k4) << 1;
  assign s6 = s5 ^ k5;   assign k6 = (s5 & k5) << 1;
  assign s7 = s6 ^ k6;   assign k7 = (s6 & k6) << 1;
  assign y = s7 ^ k7;    // after eight stages the carries have left the byte
endmodule

module sub8(a, b, y);    // a - b = a + NOT b + 1, modulo 256
  input  [7:0] a, b;
  output [7:0] y;
  wire [7:0] nb, t;
  assign nb = ~b;
  add8 u0(a, nb, t);
  add8 u1(t, 8'b00000001, y);
endmodule

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
