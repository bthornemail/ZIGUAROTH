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
}

void (*vlog_startup_routines[])(void) = { omi_check_register, 0 };
