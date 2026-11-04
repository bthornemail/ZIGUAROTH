(* I-2.coq.v — Euclid, Elements I.2, on the triangular grid, for every A, B and C: "To place at a given point (as an
   extremity) a straight line equal to a given straight line." (Heath.) The general statement beside I-2.v and
   I-2.tb.v (both simulators) and omi-axioms js/catalog/I-255.ts.

   Points and the norm as in I-1.coq.v: (a, b) is a + b w, N(a, b) = a^2 - a b + b^2. With d = C - B, the line BC
   placed at A ends at L = A + d u for any of the six units u of the grid (1, 1 + w, w, -1, -1 - w, -w), the norm of
   each being 1, so N(L - A) = N(d). In Coq, A is (px, py), B is (qx, qy), C is (rx, ry). *)
From Coq Require Import ZArith Lia.
Open Scope Z_scope.

Definition N (x y : Z) : Z := x * x - x * y + y * y.

(* multiplying (x, y) by u = (s, t), w^2 = -1 - w: (x + y w)(s + t w) = (x s - y t) + (x t + y s - y t) w *)
Definition mul (x y s t : Z) : Z * Z := (x * s - y * t, x * t + y * s - y * t).

(* the norm is multiplicative *)
Lemma N_mul : forall x y s t, N (fst (mul x y s t)) (snd (mul x y s t)) = N x y * N s t.
Proof. intros. unfold mul, N. cbn [fst snd]. ring. Qed.

(* the six units, each of norm 1 *)
Theorem six_units : N 1 0 = 1 /\ N 1 1 = 1 /\ N 0 1 = 1 /\ N (-1) 0 = 1 /\ N (-1) (-1) = 1 /\ N 0 (-1) = 1.
Proof. unfold N. repeat split; reflexivity. Qed.

(* Euclid I.2: the line BC carried to A, turned by any unit, keeps its length *)
Theorem euclid_I_2 : forall px py qx qy rx ry s t : Z, N s t = 1 ->
  N (fst (mul (rx - qx) (ry - qy) s t)) (snd (mul (rx - qx) (ry - qy) s t)) = N (rx - qx) (ry - qy).
Proof. intros px py qx qy rx ry s t Hu. rewrite N_mul, Hu. ring. Qed.

(* the module's two outputs: L = A + d and L6 = A + d (1 + w) *)
Theorem module_outputs : forall px py qx qy rx ry,
  N ((px + (rx - qx)) - px) ((py + (ry - qy)) - py) = N (rx - qx) (ry - qy) /\
  N ((px + ((rx - qx) - (ry - qy))) - px) ((py + (rx - qx)) - py) = N (rx - qx) (ry - qy).
Proof. intros. unfold N. split; ring. Qed.

(* N is zero only at the origin, as in I-1.coq.v *)
Lemma N_zero : forall x y, N x y = 0 -> x = 0 /\ y = 0.
Proof. intros x y H. unfold N in H. nia. Qed.

(* the falsifier: A + 2 d is twice as long, its norm four times, never equal for B <> C *)
Theorem twice_not_equal : forall qx qy rx ry, (rx, ry) <> (qx, qy) ->
  N (2 * (rx - qx)) (2 * (ry - qy)) <> N (rx - qx) (ry - qy).
Proof.
  intros qx qy rx ry Hne H.
  assert (Hz : N (rx - qx) (ry - qy) = 0) by (unfold N in *; nia).
  apply N_zero in Hz. destruct Hz as [Hx Hy].
  apply Hne. f_equal; lia.
Qed.
