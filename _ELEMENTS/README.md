# _ELEMENTS

Euclid's Elements as Verilog, one proposition a file, each checked through VPI by C (`vpi/omi_check.c`) and run
under two simulators that must agree: GPL Cver (the author's minimum basis) and Icarus Verilog.

    sh run.sh I/I-1

A point is one 16-bit word, one of the 65,536: two signed bytes, the Eisenstein integer a + b w on the triangular
grid, where turning by a sixth of a turn is a whole-number map and lengths are compared squared by the norm
a^2 - a b + b^2, so a value is read only at the incidence. Heath's numbering: 465 propositions in thirteen books.

| Proposition | File | Check |
|---|---|---|
| I.1, on a given finite straight line to construct an equilateral triangle | `I/I-1.v`, `I/I-1.tb.v` | 28,392 pairs of points in -6..6: both meeting points equilateral, apart in every pair; the third-of-a-turn point never (both simulators) |

GPL Cver 2.12a on this 64-bit host prints no string literals, compares integers unsigned, mishandles negative
integers stored in a byte, and gives x for + and - on byte vectors; the files are written in Verilog-1995 with
their arithmetic built from XOR and AND gates, so both simulators evaluate them alike.
