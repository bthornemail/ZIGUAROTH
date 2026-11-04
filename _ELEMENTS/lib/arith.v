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
