# _ELEMENTS

Euclid's Elements as Verilog, one proposition a file, each checked through VPI by C (`vpi/omi_check.c`) and run
under two simulators that must agree: GPL Cver (the author's minimum basis) and Icarus Verilog.

    sh run.sh I/I-1     (one proposition)
    sh run.sh           (all of them)

A point is one 16-bit word, one of the 65,536: two signed bytes, the Eisenstein integer a + b w on the triangular
grid, where turning by a sixth of a turn is a whole-number map and lengths are compared squared by the norm
a^2 - a b + b^2, so a value is read only at the incidence. Heath's numbering: 465 propositions in thirteen books.

| Proposition | File | Check |
|---|---|---|
| I.1, on a given finite straight line to construct an equilateral triangle | `I/I-1.v`, `I/I-1.tb.v`, `I/I-1.coq.v` | 28,392 pairs of points in -6..6: both meeting points equilateral, apart in every pair; the third-of-a-turn point never (both simulators); for every A and B in Coq (coqc, no axioms); the same in JavaScript, omi-axioms I-254 |
| I.2, to place at a given point a straight line equal to a given straight line | `I/I-2.v`, `I/I-2.tb.v`, `I/I-2.coq.v` | 115,248 cases in -3..3: L = A + BC and L6 = A + BC(1 + w) equal to BC in all, A + 2 BC in none (both simulators); the six units of norm 1 keep any length, for every A, B, C in Coq (four theorems, no axioms); omi-axioms I-255 |
| I.3, given two unequal straight lines, to cut off from the greater a straight line equal to the less | `I/I-3.v`, `I/I-3.tb.v`, `I/I-3.coq.v` | the cut is a root, sqrt(N(CD)/N(AB)), a grid point only when rational; its continued fraction repeats (Lagrange): the recurrence m' = d a - m, d' = (n - m'^2)/d, a' = floor((a0 + m')/d') in gates (lib/arith.v mul8, div8, ge8) for all 240 non-squares in 2..255, every step checked and every period certified by Pell's equation in C, the opposite sign never (both simulators: 240 240 240 0); the cut exact over the reals in Coq (three theorems, on the standard axioms of Coq's reals only); omi-axioms I-256 |

GPL Cver 2.12a (1991-2007) was written for 32-bit machines and is not 64-bit clean (a Fedora packager's review, 2016);
this host is x86-64 with the LP64 data model (int 4 bytes, long and pointers 8), and Ubuntu's package is built 64-bit.
Here it prints no string literals, gives x for + and - on byte vectors, for * on integers and for some integer sums
depending on the expression, and crashes on a constant wired straight into a module port and on a sized decimal constant from 8'd127 up (constants are written in binary). So: Verilog-1995 throughout,
sums and differences from XOR and AND gates (`lib/arith.v`), testbenches that only count their loops and copy each
count into a byte (every coordinate and falsifier built by the gates), constants held in registers, and results
printed as numbers that `run.sh` reads. Icarus Verilog runs the same files; each falsifier is also tried on a mutant
module, which both simulators fail alike.

Parity: the Verilog checks a finite box in two simulators, the JavaScript record (omi-axioms `js/catalog/I-254.ts`) the
same box the same way and a wider one, and the Coq file the general statement for every A and B. The Coq file stands
here, not in omi-axioms' `coq/` registry, which its AGENTS.md closes to new files.
