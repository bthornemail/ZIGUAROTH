// I-3.v — Euclid, Elements I.3, in Heath's words: "Given two unequal straight lines, to cut off from the greater a
// straight line equal to the less." (Heath, 1908, public domain.)
//
// On the triangular grid the cut point E = A + (B - A) t, t = sqrt(N(CD) / N(AB)), is a grid point only when t is
// rational; otherwise t is a square root, sqrt(n) for n = N(CD) N(AB) up to a rational factor (I-3.coq.v proves the cut
// exact for any such t: N(E - A) = t^2 N(AB) = N(CD)). A square root has no repeating decimal, but its continued
// fraction repeats (Lagrange): sqrt(n) = [a0; a1, ..., aL] with aL = 2 a0, then a1 ... again. The author, 2026-11-04:
// "its more the natural variant of invaraint Repetend". This module is that period's engine: one step of the
// whole-number recurrence
//     m' = d a - m,   d' = (n - m'^2) / d,   a' = floor((a0 + m') / d')
// from (m, d, a) = (0, 1, a0), and a0 = floor(sqrt n) itself; all in bytes (for n < 256 every term stays below 32, and
// the one product that passes a byte, d a, wraps harmlessly because m' is small), with lib/arith.v's gates: mul8,
// div8, ge8, add8, sub8. The testbench runs it for every n from 2 to 255 that is not a square; the period is certified
// in C by Pell's equation (vpi/omi_check.c).
module isqrt8(n, r);              // floor(sqrt n) for a byte: how many of 1, 4, 9, ..., 225 are at most n
  input  [7:0] n;
  output [7:0] r;
  wire g1, g2, g3, g4, g5, g6, g7, g8, g9, g10, g11, g12, g13, g14, g15;
  ge8 c1(n, 8'b00000001, g1);   ge8 c2(n, 8'b00000100, g2);   ge8 c3(n, 8'b00001001, g3);
  ge8 c4(n, 8'b00010000, g4);   ge8 c5(n, 8'b00011001, g5);   ge8 c6(n, 8'b00100100, g6);
  ge8 c7(n, 8'b00110001, g7);   ge8 c8(n, 8'b01000000, g8);   ge8 c9(n, 8'b01010001, g9);
  ge8 c10(n, 8'b01100100, g10); ge8 c11(n, 8'b01111001, g11); ge8 c12(n, 8'b10010000, g12);
  ge8 c13(n, 8'b10101001, g13); ge8 c14(n, 8'b11000100, g14); ge8 c15(n, 8'b11100001, g15);
  wire [7:0] s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14;
  add8 a1({7'b0000000, g1}, {7'b0000000, g2}, s1);
  add8 a2(s1, {7'b0000000, g3}, s2);     add8 a3(s2, {7'b0000000, g4}, s3);
  add8 a4(s3, {7'b0000000, g5}, s4);     add8 a5(s4, {7'b0000000, g6}, s5);
  add8 a6(s5, {7'b0000000, g7}, s6);     add8 a7(s6, {7'b0000000, g8}, s7);
  add8 a8(s7, {7'b0000000, g9}, s8);     add8 a9(s8, {7'b0000000, g10}, s9);
  add8 a10(s9, {7'b0000000, g11}, s10);  add8 a11(s10, {7'b0000000, g12}, s11);
  add8 a12(s11, {7'b0000000, g13}, s12); add8 a13(s12, {7'b0000000, g14}, s13);
  add8 a14(s13, {7'b0000000, g15}, r);
endmodule

module euclid_I_3(n, a0, m, d, a, m2, d2, a2);
  input  [7:0] n, a0, m, d, a;
  output [7:0] m2, d2, a2;
  wire [7:0] da, sq, rest, r1, num, r2;
  mul8 p0(d, a, da);
  sub8 s0(da, m, m2);             // m' = d a - m
  mul8 p1(m2, m2, sq);
  sub8 s1(n, sq, rest);
  div8 v0(rest, d, d2, r1);       // d' = (n - m'^2) / d, exact
  add8 s2(a0, m2, num);
  div8 v1(num, d2, a2, r2);       // a' = floor((a0 + m') / d')
endmodule
