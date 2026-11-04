// I-1.tb.v — the check of I-1.v: for every pair of distinct points A, B with coordinates in -6..6 (169 x 168 pairs),
// both constructed points, C and C', make an equilateral triangle with A and B ($omi_equilateral, vpi/omi_check.c);
// and the falsifiers: C and C' differ in every pair (two poles, not one), and the point a third of a turn round A,
// A + AB w, which lies on the circle about A but not on the circle about B, never makes one.
//
// Written for GPL Cver 2.12a as it runs on this 64-bit host, which prints no string literals, compares integers
// unsigned, mishandles a negative integer stored in a byte, and gives x for + and - on bytes (I-1.v builds its sums
// from gates): the loops count 0..12, every coordinate is reckoned in positive integers (-6 as +250, the same byte),
// and the result is four numbers on one line, read by run.sh: pairs, pairs where both meeting points hold, pairs
// where they differ, pairs where the third-of-a-turn point holds.
module tb;
  reg  [15:0] A, B;
  reg  [7:0] ax, ay, bx, by, tx, ty;
  reg  [15:0] T;
  wire [15:0] C, C2;
  integer i, j, k, l, pairs, held, poles, third;
  euclid_I_1 dut(.A(A), .B(B), .C(C), .C2(C2));
  initial begin
    pairs = 0; held = 0; poles = 0; third = 0;
    for (i = 0; i < 13; i = i + 1)
      for (j = 0; j < 13; j = j + 1)
        for (k = 0; k < 13; k = k + 1)
          for (l = 0; l < 13; l = l + 1)
            if (i != k || j != l) begin
              ax = i + 250; ay = j + 250; bx = k + 250; by = l + 250;   // -6 as +250: the same byte, no negative integer
              A = { ax, ay };
              B = { bx, by };
              #1;
              pairs = pairs + 1;
              if ($omi_equilateral(A, B, C) && $omi_equilateral(A, B, C2)) held = held + 1;
              if (C != C2) poles = poles + 1;
              tx = i + j + 506 - l; ty = j + j + k + 506 - i - l; T = { tx, ty };   // A + AB w in positive integers, then a byte
              if ($omi_equilateral(A, B, T)) third = third + 1;
            end
    $display(pairs, held, poles, third);
    $finish;
  end
endmodule
