(* I-1.coq.v — Euclid, Elements I.1, on the triangular grid, for every A and B: the general statement beside the
   finite one checked in Verilog (I-1.v, I-1.tb.v) and in JavaScript (omi-axioms js/catalog/I-254.ts).

   The author, 2026-11-04: "this is binding and testing physical containment virtually we just need parity with the
   coq proof an the i-series proofs in js". omi-axioms' coq/ registry is closed to new files (its AGENTS.md), so this
   stands here, checked by coqc, outside that registry.

   A point (a, b) is the Eisenstein integer a + b w, w a primitive cube root of unity (w^2 = -1 - w); its squared
   length is the norm N(a, b) = a^2 - a b + b^2. With d = B - A, the two meeting points of Euclid's circles are
   C = A + d (1 + w) and C' = A + d (-w); multiplying (x, y) by 1 + w gives (x - y, x), by -w gives (y, y - x), and
   by w gives (-y, x - y). In Coq, A is (px, py) and B is (qx, qy) ("by" is a reserved word). *)
From Coq Require Import ZArith Lia.
Open Scope Z_scope.

Definition N (x y : Z) : Z := x * x - x * y + y * y.

(* the turns, as the Verilog module computes them *)
Definition sixth (x y : Z) : Z * Z := (x - y, x).        (* times 1 + w *)
Definition sixth' (x y : Z) : Z * Z := (y, y - x).       (* times -w *)
Definition third (x y : Z) : Z * Z := (- y, x - y).      (* times w *)

Definition equilateral (px py qx qy cx cy : Z) : Prop :=
  N (qx - px) (qy - py) <> 0 /\
  N (cx - px) (cy - py) = N (qx - px) (qy - py) /\
  N (cx - qx) (cy - qy) = N (qx - px) (qy - py).

(* N is zero only at the origin: x^2 - x y + y^2 = ((2x - y)^2 + 3 y^2) / 4 *)
Lemma N_zero : forall x y, N x y = 0 -> x = 0 /\ y = 0.
Proof. intros x y H. unfold N in H. nia. Qed.

Lemma N_nonzero : forall x y, (x, y) <> (0, 0) -> N x y <> 0.
Proof. intros x y Hne H. apply N_zero in H. destruct H; subst. contradiction. Qed.

(* Euclid I.1: both meeting points make an equilateral triangle on AB, for every A <> B *)
Theorem euclid_I_1 : forall px py qx qy,
  (qx, qy) <> (px, py) ->
  let '(sx, sy) := sixth (qx - px) (qy - py) in
  let '(tx, ty) := sixth' (qx - px) (qy - py) in
  equilateral px py qx qy (px + sx) (py + sy) /\ equilateral px py qx qy (px + tx) (py + ty).
Proof.
  intros px py qx qy Hne. unfold sixth, sixth'. cbn [fst snd].
  assert (Hd : N (qx - px) (qy - py) <> 0).
  { apply N_nonzero. intro H. inversion H. apply Hne. f_equal; lia. }
  unfold equilateral, N in *. split; repeat split; try assumption; ring.
Qed.

(* the two meeting points are apart: C = C' only when A = B *)
Theorem meeting_points_apart : forall px py qx qy,
  (qx, qy) <> (px, py) ->
  (px + (qx - px - (qy - py)), py + (qx - px)) <> (px + (qy - py), py + (qy - py - (qx - px))).
Proof. intros px py qx qy Hne H. inversion H. apply Hne. f_equal; lia. Qed.

(* the falsifier: the point a third of a turn round A lies on A's circle, and B is three times as far from it *)
Theorem third_on_A_circle : forall x y, N (fst (third x y)) (snd (third x y)) = N x y.
Proof. intros x y. unfold third, N. cbn [fst snd]. ring. Qed.

Theorem third_not_on_B_circle : forall x y, N (fst (third x y) - x) (snd (third x y) - y) = 3 * N x y.
Proof. intros x y. unfold third, N. cbn [fst snd]. ring. Qed.

Theorem third_not_equilateral : forall px py qx qy,
  (qx, qy) <> (px, py) ->
  let '(u, v) := third (qx - px) (qy - py) in ~ equilateral px py qx qy (px + u) (py + v).
Proof.
  intros px py qx qy Hne. unfold third. cbn [fst snd]. intros [Hd [_ HB]].
  apply Hd. unfold N in *. nia.
Qed.
