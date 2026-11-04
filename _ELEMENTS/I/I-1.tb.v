// I-1.tb.v — the check of I-1.v: for every pair of distinct points A, B with coordinates in -6..6 (169 x 168 pairs),
// both constructed points, C and C', make an equilateral triangle with A and B ($omi_equilateral, vpi/omi_check.c);
// and the falsifiers: C and C' differ in every pair (two poles, not one), and the point a third of a turn round A,
// A + AB w, which lies on the circle about A but not on the circle about B, never makes one.
//
// Written for GPL Cver 2.12a as it runs on this 64-bit host, whose integer and byte arithmetic gives x erratically
// (+ and - on bytes always; * on integers; some integer sums, depending on the expression): the testbench does no
// arithmetic but count its loops and copy each count into a byte; every coordinate (the count less 6, as +250) and
// the falsifier's point are built by lib/arith.v's gates, as the module's are. It prints four numbers on one line,
// read by run.sh: pairs, pairs where both meeting points hold, pairs where they differ, pairs where the
// third-of-a-turn point holds.
module tb;
  reg  [7:0] K;            // the offset held in a register: Cver crashes on a constant wired to a port
  reg  [7:0] ri, rj, rk, rl;
  wire [7:0] ax, ay, bx, by, dx, dy, t, tx, ty;
  wire [15:0] A, B, C, C2, T;
  integer i, j, k, l, pairs, held, poles, third;
  add8 oa(ri, K, ax);   // -6 + count
  add8 ob(rj, K, ay);
  add8 oc(rk, K, bx);
  add8 od(rl, K, by);
  assign A = { ax, ay };
  assign B = { bx, by };
  sub8 e0(bx, ax, dx);       // AB
  sub8 e1(by, ay, dy);
  sub8 f0(ax, dy, tx);       // the falsifier: A + AB w = (ax - dy, ay + (dx - dy))
  sub8 f1(dx, dy, t);
  add8 f2(ay, t, ty);
  assign T = { tx, ty };
  euclid_I_1 dut(.A(A), .B(B), .C(C), .C2(C2));
  initial begin
    K = 250;
    pairs = 0; held = 0; poles = 0; third = 0;
    for (i = 0; i < 13; i = i + 1)
      for (j = 0; j < 13; j = j + 1)
        for (k = 0; k < 13; k = k + 1)
          for (l = 0; l < 13; l = l + 1)
            if (i != k || j != l) begin
              ri = i; rj = j; rk = k; rl = l;
              #1;
              pairs = pairs + 1;
              if ($omi_equilateral(A, B, C) && $omi_equilateral(A, B, C2)) held = held + 1;
              if (C != C2) poles = poles + 1;
              if ($omi_equilateral(A, B, T)) third = third + 1;
            end
    $display(pairs, held, poles, third);
    $finish;
  end
endmodule
