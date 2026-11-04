#!/bin/sh
# run.sh — run one proposition three ways: its testbench under GPL Cver (the author's minimum basis) and Icarus
# Verilog, through the VPI checks in vpi/omi_check.c, and its Coq statement (if there is one) under coqc.
#   sh run.sh I/I-1        (lib/arith.v, I/I-1.v, I/I-1.tb.v; then coqc on I/I-1.coq.v)
#   sh run.sh              (every proposition that has a testbench)
# A testbench prints one line of numbers. The two simulators must print the same line, and it must read: every number
# but the last equal to the first (the cases, and each property held in all of them), the last 0 (the falsifier, held
# in none).
set -eu
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT
cc -fPIC -shared -I/usr/include/cver -o "$OUT/omi_check.so" "$HERE/vpi/omi_check.c"
cc -fPIC -shared -I/usr/include/iverilog -o "$OUT/omi_check.vpi" "$HERE/vpi/omi_check.c"
nums() { grep -E '^[ 0-9]+$' | tail -1 | tr -s ' ' | sed 's/^ //'; }

one() {
  P=$1
  echo "== $P"
  (cd "$OUT" && cver -q +loadvpi="$OUT/omi_check.so:omi_check_register" "$HERE/lib/arith.v" "$HERE/$P.v" "$HERE/$P.tb.v" 2>&1) | nums > "$OUT/cver.txt"
  iverilog -o "$OUT/sim" "$HERE/lib/arith.v" "$HERE/$P.v" "$HERE/$P.tb.v"
  vvp -M "$OUT" -m omi_check "$OUT/sim" | nums > "$OUT/icarus.txt"
  printf 'cver:   %s\nicarus: %s\n' "$(cat "$OUT/cver.txt")" "$(cat "$OUT/icarus.txt")"
  [ -s "$OUT/cver.txt" ] && cmp -s "$OUT/cver.txt" "$OUT/icarus.txt" || { echo 'FAIL: the two simulators disagree'; return 1; }
  set -- $(cat "$OUT/cver.txt")
  first=$1; n=$#; i=1
  [ "$n" -ge 2 ] && [ "$first" -gt 0 ] || { echo "FAIL: $*"; return 1; }
  for v in "$@"; do
    if [ "$i" -eq "$n" ]; then [ "$v" -eq 0 ] || { echo "FAIL: the falsifier held in $v"; return 1; }
    else [ "$v" -eq "$first" ] || { echo "FAIL: a property held in $v of $first"; return 1; }; fi
    i=$((i + 1))
  done
  echo "PASS: $first cases, every property in all, the falsifier in none (both simulators)"
  if [ -f "$HERE/$P.coq.v" ]; then
    cp "$HERE/$P.coq.v" "$OUT/statement.v"
    T=$(grep -o '^Theorem [A-Za-z0-9_]*' "$HERE/$P.coq.v" | cut -d' ' -f2)
    for t in $T; do printf '\nPrint Assumptions %s.\n' "$t" >> "$OUT/statement.v"; done
    (cd "$OUT" && coqc statement.v > coq.txt 2>&1) || { cat "$OUT/coq.txt"; echo 'FAIL: coqc'; return 1; }
    # every theorem closed (no axioms), or resting only on the standard axioms beneath Coq's real numbers
    k=$(echo $T | wc -w); c=$(grep -c 'Closed under the global context' "$OUT/coq.txt" || true)
    AX=$(grep -oE '^[A-Z][A-Za-z0-9_]*\.[A-Za-z0-9_.]+' "$OUT/coq.txt" | sort -u || true)
    REALS="ClassicalDedekindReals.sig_forall_dec FunctionalExtensionality.functional_extensionality_dep"
    for a in $AX; do case " $REALS " in *" $a "*) ;; *) echo "FAIL: axiom $a"; return 1 ;; esac; done
    if [ "$c" -eq "$k" ]; then echo "PASS: coqc, $k theorems, each closed under the global context (no axioms)"
    else echo "PASS: coqc, $k theorems, $c closed, the rest on the standard axioms of Coq's reals only: $(echo $AX)"; fi
  fi
}

if [ $# -gt 0 ]; then one "$1"
else for tb in "$HERE"/*/*.tb.v; do p=${tb#"$HERE"/}; one "${p%.tb.v}" || exit 1; done; fi
