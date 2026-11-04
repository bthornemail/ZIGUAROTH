(* I-3.coq.v — Euclid, Elements I.3: "Given two unequal straight lines, to cut off from the greater a straight line
   equal to the less." (Heath.) The general statement beside I-3.v and I-3.tb.v (the continued fraction's recurrence in
   both simulators) and omi-axioms js/catalog/I-256.ts.

   The cut point is E = A + lam (B - A) with lam^2 = N(CD) / N(AB): a root, so the statement is over the reals. The
   norm N(x, y) = x^2 - x y + y^2 is that of I-1.coq.v; it is homogeneous of degree two, so the cut has exactly the
   length of CD, and lies on AB between A and B when CD is the less. The falsifier: the ratio without its root,
   lam = N(CD) / N(AB), gives the length N(CD)^2 / N(AB), which is N(CD) only when the two lines are equal. *)
From Coq Require Import Reals Lra.
Open Scope R_scope.

Definition N (x y : R) : R := x * x - x * y + y * y.

Lemma N_homogeneous : forall lam x y, N (lam * x) (lam * y) = lam * lam * N x y.
Proof. intros. unfold N. ring. Qed.

(* Euclid I.3: the cut has the length of the less line *)
Theorem euclid_I_3 : forall dx dy nc lam,
  N dx dy > 0 -> lam * lam = nc / N dx dy ->
  N (lam * dx) (lam * dy) = nc.
Proof.
  intros dx dy nc lam Hpos Hlam. rewrite N_homogeneous, Hlam.
  field. lra.
Qed.

(* and it lies between A and B: 0 <= lam < 1 when 0 <= nc < N(AB) *)
Theorem cut_inside : forall na nc lam,
  0 < na -> 0 <= nc < na -> 0 <= lam -> lam * lam = nc / na -> lam < 1.
Proof.
  intros na nc lam Hna Hnc Hl Hlam.
  assert (Hq : nc / na < 1).
  { apply (Rmult_lt_reg_r na); [lra |]. unfold Rdiv. rewrite Rmult_assoc, Rinv_l by lra. lra. }
  destruct (Rlt_or_le lam 1) as [H | H]; [assumption |].
  exfalso. assert (1 <= lam * lam) by nra. lra.
Qed.

(* the falsifier: without the root, the length is nc^2 / N(AB), not nc, when the lines are unequal *)
Theorem no_root_wrong : forall dx dy nc,
  N dx dy > 0 -> nc > 0 -> nc <> N dx dy ->
  N ((nc / N dx dy) * dx) ((nc / N dx dy) * dy) <> nc.
Proof.
  intros dx dy nc Hpos Hnc Hne H. rewrite N_homogeneous in H.
  apply Hne.
  assert (Hk : nc / N dx dy * (nc / N dx dy) * N dx dy = nc * (nc / N dx dy)) by (field; lra).
  rewrite Hk in H.
  assert (Hr : nc / N dx dy = 1) by (apply (Rmult_eq_reg_l nc); lra).
  apply (Rmult_eq_reg_r (/ N dx dy)); [| apply Rinv_neq_0_compat; lra].
  rewrite Rinv_r by lra. unfold Rdiv in Hr. lra.
Qed.
