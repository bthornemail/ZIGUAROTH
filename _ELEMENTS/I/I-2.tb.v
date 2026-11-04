// I-2.tb.v — the check of I-2.v: for every point A and every pair of distinct points B, C, coordinates in -3..3
// (49 x 49 x 48 = 115,248 cases), AL and AL6 are each equal to BC ($omi_equal_length); the falsifier, A + 2 BC, which
// is twice as long, never is. Prints: cases, L equal, L6 equal, the falsifier equal.
// As in I-1.tb.v, the testbench only counts and copies counts into bytes; coordinates (the count less 3, as +253) and
// the falsifier are built by lib/arith.v's gates.
module tb;
  reg  [7:0] K;            // the offset held in a register: Cver crashes on a constant wired to a port
  reg  [7:0] ri, rj, rk, rl, rm, rn;
  wire [7:0] ax, ay, bx, by, cx, cy, dx, dy, ex, ey, fx, fy;
  wire [15:0] A, B, C, F, L, L6;
  integer i, j, k, l, m, n, cases, eq, eq6, twice;
  add8 oa(ri, K, ax);
  add8 ob(rj, K, ay);
  add8 oc(rk, K, bx);
  add8 od(rl, K, by);
  add8 oe(rm, K, cx);
  add8 og(rn, K, cy);
  assign A = { ax, ay };
  assign B = { bx, by };
  assign C = { cx, cy };
  sub8 g0(cx, bx, dx);       // BC
  sub8 g1(cy, by, dy);
  add8 g2(dx, dx, ex);       // 2 BC
  add8 g3(dy, dy, ey);
  add8 g4(ax, ex, fx);       // the falsifier: A + 2 BC
  add8 g5(ay, ey, fy);
  assign F = { fx, fy };
  euclid_I_2 dut(.A(A), .B(B), .C(C), .L(L), .L6(L6));
  initial begin
    K = 253;
    cases = 0; eq = 0; eq6 = 0; twice = 0;
    for (i = 0; i < 7; i = i + 1) for (j = 0; j < 7; j = j + 1)
      for (k = 0; k < 7; k = k + 1) for (l = 0; l < 7; l = l + 1)
        for (m = 0; m < 7; m = m + 1) for (n = 0; n < 7; n = n + 1)
          if (k != m || l != n) begin
            ri = i; rj = j; rk = k; rl = l; rm = m; rn = n;
            #1;
            cases = cases + 1;
            if ($omi_equal_length(A, L, B, C)) eq = eq + 1;
            if ($omi_equal_length(A, L6, B, C)) eq6 = eq6 + 1;
            if ($omi_equal_length(A, F, B, C)) twice = twice + 1;
          end
    $display(cases, eq, eq6, twice);
    $finish;
  end
endmodule
