/* omi_check.c — the check a Verilog proposition calls, through VPI (IEEE 1364-2001, the interface that replaced
 * PLI 1's tf_ routines). One source for both simulators the author named and the one beside it: GPL Cver loads it
 * with +loadvpi=omi_check.so:omi_check_register; Icarus Verilog's vvp loads it by vlog_startup_routines.
 *
 * $omi_equilateral(A, B, C) returns 1 when the three points are the corners of an equilateral triangle, else 0.
 * A point is one 16-bit word, two signed bytes: the high byte a and the low byte b of the Eisenstein integer
 * a + b w (w a primitive cube root of unity), the triangular grid, where an equilateral triangle has whole
 * corners (on the square grid it has none). Lengths are compared squared, as whole numbers, by the norm
 * N(x, y) = x^2 - x y + y^2: the value read only at the incidence, never a root.
 */
#include <stdio.h>
#include "vpi_user.h"

static int sbyte(unsigned v) { v &= 0xff; return v < 0x80 ? (int)v : (int)v - 0x100; }
static long norm(int x, int y) { return (long)x * x - (long)x * y + (long)y * y; }

static int point(vpiHandle arg, int *a, int *b) {
  s_vpi_value v;
  v.format = vpiIntVal;
  vpi_get_value(arg, &v);
  *a = sbyte((unsigned)v.value.integer >> 8);
  *b = sbyte((unsigned)v.value.integer);
  return 0;
}

static PLI_INT32 equilateral_calltf(PLI_BYTE8 *data) {
  vpiHandle self = vpi_handle(vpiSysTfCall, NULL), it = vpi_iterate(vpiArgument, self);
  int ax, ay, bx, by, cx, cy;
  s_vpi_value out;
  (void)data;
  point(vpi_scan(it), &ax, &ay);
  point(vpi_scan(it), &bx, &by);
  point(vpi_scan(it), &cx, &cy);
  vpi_free_object(it);
  {
    long ab = norm(bx - ax, by - ay), ac = norm(cx - ax, cy - ay), bc = norm(cx - bx, cy - by);
    out.format = vpiIntVal;
    out.value.integer = (ab > 0 && ab == ac && ac == bc) ? 1 : 0;
  }
  vpi_put_value(self, &out, NULL, vpiNoDelay);
  return 0;
}

static PLI_INT32 equilateral_sizetf(PLI_BYTE8 *data) { (void)data; return 32; }

/* $omi_equal_length(A, L, B, C) returns 1 when AL and BC have the same length and are not points: N(L - A) = N(C - B) > 0. */
static PLI_INT32 equal_length_calltf(PLI_BYTE8 *data) {
  vpiHandle self = vpi_handle(vpiSysTfCall, NULL), it = vpi_iterate(vpiArgument, self);
  int ax, ay, lx, ly, bx, by, cx, cy;
  s_vpi_value out;
  (void)data;
  point(vpi_scan(it), &ax, &ay);
  point(vpi_scan(it), &lx, &ly);
  point(vpi_scan(it), &bx, &by);
  point(vpi_scan(it), &cx, &cy);
  vpi_free_object(it);
  {
    long al = norm(lx - ax, ly - ay), bc = norm(cx - bx, cy - by);
    out.format = vpiIntVal;
    out.value.integer = (bc > 0 && al == bc) ? 1 : 0;
  }
  vpi_put_value(self, &out, NULL, vpiNoDelay);
  return 0;
}


/* ── I.3: the continued fraction of sqrt(n), its whole-number recurrence checked step by step, and the period
   certified by Pell's equation. Arguments are read as whole numbers (bytes). ── */
static long intarg(vpiHandle arg) { s_vpi_value v; v.format = vpiIntVal; vpi_get_value(arg, &v); return (long)(v.value.integer & 0xffff); }
static void ret_int(vpiHandle self, long x) { s_vpi_value out; out.format = vpiIntVal; out.value.integer = (PLI_INT32)x; vpi_put_value(self, &out, NULL, vpiNoDelay); }

/* $omi_cf_step(n, a0, m, d, a, m2, d2, a2): 1 when (m2, d2, a2) is the true next state:
   m2 = d a - m, d2 = (n - m2^2) / d, a2 = floor((a0 + m2) / d2) */
static PLI_INT32 cf_step_calltf(PLI_BYTE8 *data) {
  vpiHandle self = vpi_handle(vpiSysTfCall, NULL), it = vpi_iterate(vpiArgument, self);
  long n = intarg(vpi_scan(it)), a0 = intarg(vpi_scan(it)), m = intarg(vpi_scan(it)), d = intarg(vpi_scan(it)), a = intarg(vpi_scan(it));
  long m2 = intarg(vpi_scan(it)), d2 = intarg(vpi_scan(it)), a2 = intarg(vpi_scan(it));
  long tm, td, ta;
  (void)data;
  vpi_free_object(it);
  tm = d * a - m;
  if (d == 0 || (n - tm * tm) % d != 0) { ret_int(self, 0); return 0; }
  td = (n - tm * tm) / d;
  if (td <= 0) { ret_int(self, 0); return 0; }
  ta = (a0 + tm) / td;
  ret_int(self, (tm == m2 && td == d2 && ta == a2) ? 1 : 0);
  return 0;
}

/* the convergents of the terms fed: $omi_cf_start(n) resets, $omi_cf_feed(a) adds a term, and $omi_cf_pell(flip)
   returns 1 when the last convergent p/q, with L the terms fed after a0, satisfies p^2 - n q^2 = (-1)^L
   (flip = 0), or the opposite sign (flip = 1, the falsifier) */
static long cf_n, cf_count;
static __int128 cf_p, cf_q, cf_pp, cf_qq;
static PLI_INT32 cf_start_calltf(PLI_BYTE8 *data) {
  vpiHandle self = vpi_handle(vpiSysTfCall, NULL), it = vpi_iterate(vpiArgument, self);
  (void)data;
  cf_n = intarg(vpi_scan(it)); vpi_free_object(it);
  cf_count = -1; cf_p = 1; cf_q = 0; cf_pp = 0; cf_qq = 1;   /* p_{-1} = 1, q_{-1} = 0; p_{-2} = 0, q_{-2} = 1 */
  ret_int(self, 1); return 0;
}
static PLI_INT32 cf_feed_calltf(PLI_BYTE8 *data) {
  vpiHandle self = vpi_handle(vpiSysTfCall, NULL), it = vpi_iterate(vpiArgument, self);
  long a; __int128 np, nq;
  (void)data;
  a = intarg(vpi_scan(it)); vpi_free_object(it);
  np = a * cf_p + cf_pp; nq = a * cf_q + cf_qq;
  cf_pp = cf_p; cf_qq = cf_q; cf_p = np; cf_q = nq; cf_count++;
  ret_int(self, 1); return 0;
}
static PLI_INT32 cf_pell_calltf(PLI_BYTE8 *data) {
  vpiHandle self = vpi_handle(vpiSysTfCall, NULL), it = vpi_iterate(vpiArgument, self);
  long flip; __int128 v, want;
  (void)data;
  flip = intarg(vpi_scan(it)); vpi_free_object(it);
  v = cf_p * cf_p - (__int128)cf_n * cf_q * cf_q;
  want = ((cf_count + 1) % 2 == 0) ? 1 : -1;   /* the period L = terms fed after a0, plus the closing 2 a0 */
  if (flip) want = -want;
  ret_int(self, v == want ? 1 : 0); return 0;
}

void omi_check_register(void) {
  s_vpi_systf_data tf;
  tf.type = vpiSysFunc;
  tf.sysfunctype = vpiSizedFunc;	/* 32 bits, by sizetf */
  tf.tfname = "$omi_equilateral";
  tf.calltf = equilateral_calltf;
  tf.compiletf = NULL;
  tf.sizetf = equilateral_sizetf;
  tf.user_data = NULL;
  vpi_register_systf(&tf);
  tf.tfname = "$omi_equal_length";
  tf.calltf = equal_length_calltf;
  vpi_register_systf(&tf);
  tf.tfname = "$omi_cf_step";   tf.calltf = cf_step_calltf;  vpi_register_systf(&tf);
  tf.tfname = "$omi_cf_start";  tf.calltf = cf_start_calltf; vpi_register_systf(&tf);
  tf.tfname = "$omi_cf_feed";   tf.calltf = cf_feed_calltf;  vpi_register_systf(&tf);
  tf.tfname = "$omi_cf_pell";   tf.calltf = cf_pell_calltf;  vpi_register_systf(&tf);
}

void (*vlog_startup_routines[])(void) = { omi_check_register, 0 };
