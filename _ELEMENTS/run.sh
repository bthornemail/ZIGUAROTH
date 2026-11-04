#!/bin/sh
# run.sh — compile the VPI check once for each simulator and run a proposition's testbench under both: GPL Cver
# (the author's minimum basis) and Icarus Verilog. Each prints one line of numbers; the two lines must be the same
# numbers, and for I-1 they must read: pairs, all pairs held, all pairs apart, no third-of-a-turn point equilateral.
#   sh run.sh I/I-1        (runs I/I-1.v with I/I-1.tb.v, then coqc on I/I-1.coq.v)
set -eu
HERE=$(cd "$(dirname "$0")" && pwd)
P=${1:-I/I-1}
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT
cc -fPIC -shared -I/usr/include/cver -o "$OUT/omi_check.so" "$HERE/vpi/omi_check.c"
cc -fPIC -shared -I/usr/include/iverilog -o "$OUT/omi_check.vpi" "$HERE/vpi/omi_check.c"
nums() { grep -E '^[ 0-9]+$' | tail -1 | tr -s ' ' | sed 's/^ //'; }
(cd "$OUT" && cver -q +loadvpi="$OUT/omi_check.so:omi_check_register" "$HERE/$P.v" "$HERE/$P.tb.v" 2>&1) | nums > "$OUT/cver.txt"
iverilog -o "$OUT/sim" "$HERE/$P.v" "$HERE/$P.tb.v"
vvp -M "$OUT" -m omi_check "$OUT/sim" | nums > "$OUT/icarus.txt"
printf 'cver:   %s\n' "$(cat "$OUT/cver.txt")"
printf 'icarus: %s\n' "$(cat "$OUT/icarus.txt")"
[ -s "$OUT/cver.txt" ] && cmp -s "$OUT/cver.txt" "$OUT/icarus.txt" || { echo 'FAIL: the two simulators disagree'; exit 1; }
set -- $(cat "$OUT/cver.txt")
[ "$#" -eq 4 ] && [ "$1" -gt 0 ] && [ "$2" -eq "$1" ] && [ "$3" -eq "$1" ] && [ "$4" -eq 0 ] || { echo "FAIL: $*"; exit 1; }
echo "PASS: $1 pairs; both meeting points equilateral in all $2, apart in all $3; the third-of-a-turn point in $4"
# the general statement, for every A and B: the Coq file beside the Verilog, if there is one, must check with no axioms
if [ -f "$HERE/$P.coq.v" ]; then
  cp "$HERE/$P.coq.v" "$OUT/statement.v"
  T=$(grep -o '^Theorem [A-Za-z0-9_]*' "$HERE/$P.coq.v" | cut -d' ' -f2)
  for t in $T; do printf '\nPrint Assumptions %s.\n' "$t" >> "$OUT/statement.v"; done
  (cd "$OUT" && coqc statement.v > coq.txt 2>&1) || { cat "$OUT/coq.txt"; echo 'FAIL: coqc'; exit 1; }
  n=$(echo $T | wc -w); c=$(grep -c 'Closed under the global context' "$OUT/coq.txt")
  [ "$c" -eq "$n" ] || { echo "FAIL: $c of $n theorems closed"; exit 1; }
  echo "PASS: coqc, $n theorems for every A and B, each closed under the global context (no axioms)"
fi
