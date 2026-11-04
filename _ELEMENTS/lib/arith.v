// arith.v — byte arithmetic from gates, shared by every proposition (run.sh compiles it first).
//
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

// Wider sums for comparison: add9 and add10 are add8's eight-fold XOR and AND, one stage a bit. (Cver 2.12a on this
// host also crashes on a sized decimal constant from 8'd127 up; constants here are written in binary.)
module add9(a, b, y);
  input  [8:0] a, b;
  output [8:0] y;
  wire [8:0] s0, k0, s1, k1, s2, k2, s3, k3, s4, k4, s5, k5, s6, k6, s7, k7, s8, k8;
  assign s0 = a ^ b;     assign k0 = (a & b) << 1;
  assign s1 = s0 ^ k0;   assign k1 = (s0 & k0) << 1;
  assign s2 = s1 ^ k1;   assign k2 = (s1 & k1) << 1;
  assign s3 = s2 ^ k2;   assign k3 = (s2 & k2) << 1;
  assign s4 = s3 ^ k3;   assign k4 = (s3 & k3) << 1;
  assign s5 = s4 ^ k4;   assign k5 = (s4 & k4) << 1;
  assign s6 = s5 ^ k5;   assign k6 = (s5 & k5) << 1;
  assign s7 = s6 ^ k6;   assign k7 = (s6 & k6) << 1;
  assign s8 = s7 ^ k7;   assign k8 = (s7 & k7) << 1;
  assign y = s8 ^ k8;
endmodule

// a >= b for bytes: a - b + 256 in nine bits keeps its top bit exactly when nothing is borrowed
module ge8(a, b, y);
  input  [7:0] a, b;
  output y;
  wire [8:0] t, u;
  add9 u0({1'b0, a}, {1'b0, ~b}, t);
  add9 u1(t, 9'b000000001, u);
  assign y = u[8];
endmodule

// a times b, the low byte: b's eight bits each select a shifted a, summed by add8
module mul8(a, b, y);
  input  [7:0] a, b;
  output [7:0] y;
  wire [7:0] p0, p1, p2, p3, p4, p5, p6, p7, s1, s2, s3, s4, s5, s6;
  assign p0 = {b[0],b[0],b[0],b[0],b[0],b[0],b[0],b[0]} & a;
  assign p1 = {b[1],b[1],b[1],b[1],b[1],b[1],b[1],b[1]} & (a << 1);
  assign p2 = {b[2],b[2],b[2],b[2],b[2],b[2],b[2],b[2]} & (a << 2);
  assign p3 = {b[3],b[3],b[3],b[3],b[3],b[3],b[3],b[3]} & (a << 3);
  assign p4 = {b[4],b[4],b[4],b[4],b[4],b[4],b[4],b[4]} & (a << 4);
  assign p5 = {b[5],b[5],b[5],b[5],b[5],b[5],b[5],b[5]} & (a << 5);
  assign p6 = {b[6],b[6],b[6],b[6],b[6],b[6],b[6],b[6]} & (a << 6);
  assign p7 = {b[7],b[7],b[7],b[7],b[7],b[7],b[7],b[7]} & (a << 7);
  add8 m1(p0, p1, s1);
  add8 m2(s1, p2, s2);
  add8 m3(s2, p3, s3);
  add8 m4(s3, p4, s4);
  add8 m5(s4, p5, s5);
  add8 m6(s5, p6, s6);
  add8 m7(s6, p7, y);
endmodule

// one step of restoring division: the remainder shifted with the next bit of the dividend, and d taken off if it fits
module divstep(r, bit, d, rout, q);
  input  [7:0] r, d;
  input  bit;
  output [7:0] rout;
  output q;
  wire [7:0] t, diff;
  wire top;
  assign top = r[7];                // the shifted-out bit: if set, t + 256 >= d for any byte d
  assign t = {r[6:0], bit};
  ge8 c0(t, d, q0);
  wire q0;
  assign q = top | q0;
  sub8 s0(t, d, diff);
  assign rout = ({q,q,q,q,q,q,q,q} & diff) | ({~q,~q,~q,~q,~q,~q,~q,~q} & t);
endmodule

// a divided by d, bytes, d > 0: quotient and remainder
module div8(a, d, q, r);
  input  [7:0] a, d;
  output [7:0] q, r;
  wire [7:0] r7, r6, r5, r4, r3, r2, r1;
  divstep d7(8'b00000000, a[7], d, r7, q[7]);
  divstep d6(r7, a[6], d, r6, q[6]);
  divstep d5(r6, a[5], d, r5, q[5]);
  divstep d4(r5, a[4], d, r4, q[4]);
  divstep d3(r4, a[3], d, r3, q[3]);
  divstep d2(r3, a[2], d, r2, q[2]);
  divstep d1(r2, a[1], d, r1, q[1]);
  divstep d0(r1, a[0], d, r, q[0]);
endmodule
