// I-3.tb.v — the check of I-3.v: for every n from 2 to 255 that is not a square (240 of them), the module's a0 and its
// recurrence are run from (0, 1, a0) until a term equals 2 a0, the end of the period; each step is checked in C
// ($omi_cf_step), and the terms are fed to C, which certifies the period by Pell's equation: the last convergent p/q
// before 2 a0 satisfies p^2 - n q^2 = (-1)^L ($omi_cf_pell(0)); the falsifier, the opposite sign ($omi_cf_pell(1)),
// never holds. Prints: non-squares, those whose every step held, those certified by Pell, the falsifier.
// As in I-1.tb.v: the testbench only counts, copies values into bytes, and compares bytes for equality.
module tb;
  reg  [7:0] rn, m, d, a, a0r;
  wire [7:0] a0, sq, two, m2, d2, a2;
  integer i, steps, ok, cases, allok, pell, wrong, guard, z;
  isqrt8 q0(rn, a0);
  mul8 q1(a0, a0, sq);
  add8 q2(a0, a0, two);
  euclid_I_3 dut(rn, a0r, m, d, a, m2, d2, a2);
  initial begin
    cases = 0; allok = 0; pell = 0; wrong = 0;
    for (i = 2; i < 256; i = i + 1) begin
      rn = i; #1;
      if (sq != rn) begin
        cases = cases + 1;
        a0r = a0; m = 0; d = 1; a = a0;
        z = $omi_cf_start(rn);
        z = $omi_cf_feed(a0);
        ok = 1; steps = 0; guard = 0;
        #1;
        while (a2 != two && guard < 64) begin
          if (!$omi_cf_step(rn, a0r, m, d, a, m2, d2, a2)) ok = 0;
          z = $omi_cf_feed(a2);
          m = m2; d = d2; a = a2; steps = steps + 1; guard = guard + 1;
          #1;
        end
        if (!$omi_cf_step(rn, a0r, m, d, a, m2, d2, a2)) ok = 0;   // the closing step, to 2 a0
        if (guard == 64) ok = 0;
        if (ok) allok = allok + 1;
        if ($omi_cf_pell(0)) pell = pell + 1;
        if ($omi_cf_pell(1)) wrong = wrong + 1;
      end
    end
    $display(cases, allok, pell, wrong);
    $finish;
  end
endmodule
