/**
 * Minimal column-major 4×4 matrix helpers (WebGL convention).
 * Same math as the "drawImage" example on webglfundamentals.org.
 *
 * A matrix is a flat `Float32Array` of 16 numbers, column-major, so it can be
 * handed straight to `gl.uniformMatrix4fv(loc, false, matrix)`.
 */

export type Mat4 = Float32Array;

/** Orthographic projection — maps the given box to clip space (-1..1). */
export function createOrthographicProjectionMatrix(
  left: number,
  right: number,
  bottom: number,
  top: number,
  near: number,
  far: number
): Mat4 {
  // prettier-ignore
  return new Float32Array([
    2 / (right - left), 0, 0, 0,
    0, 2 / (top - bottom), 0, 0,
    0, 0, 2 / (near - far), 0,
    (left + right) / (left - right),
    (bottom + top) / (bottom - top),
    (near + far) / (near - far),
    1,
  ]);
}

/** Translation matrix. */
export function createTranslationMatrix(tx: number, ty: number, tz: number): Mat4 {
  // prettier-ignore
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    tx, ty, tz, 1,
  ]);
}

/** Scaling matrix. */
export function createScalingMatrix(sx: number, sy: number, sz: number): Mat4 {
  // prettier-ignore
  return new Float32Array([
    sx, 0, 0, 0,
    0, sy, 0, 0,
    0, 0, sz, 0,
    0, 0, 0, 1,
  ]);
}

/** Returns the product `a · b` (apply `b` first, then `a`). */
export function multiplyMatrix(a: Mat4, b: Mat4): Mat4 {
  const out = new Float32Array(16);

  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[k * 4 + row] * b[col * 4 + k];
      }
      out[col * 4 + row] = sum;
    }
  }

  return out;
}
