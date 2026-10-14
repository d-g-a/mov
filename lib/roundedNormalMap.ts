import * as THREE from "three";

/**
 * Builds a normal map that makes the flat faces of the extruded logo read as
 * rounded, pillowed metal.
 *
 * The logo is rasterized, a distance field gives each point's distance to the
 * nearest outline edge, and that distance becomes a rounded height profile:
 * steepest at the edge, levelling off across a shoulder of width `radius`.
 * The field is then smoothed so thin strokes round over without a crease
 * along their middle; the wide ends of the ring get a soft dome.
 *
 * The texture is mapped in SVG units, which is what ExtrudeGeometry's default
 * UVs use for the front and back caps.
 */

export interface RoundedNormalMapOptions {
  /** SVG-unit bounds of the logo: [minX, minY, maxX, maxY]. */
  bounds: [number, number, number, number];
  /** Texels per SVG unit. */
  resolution?: number;
  /** Width of the rounded shoulder, in SVG units. */
  radius?: number;
  /** Height of the shoulder, in SVG units. Higher = more pronounced curvature. */
  height?: number;
  /** Smoothing radius applied to the height field, in SVG units. */
  blur?: number;
  /** Per-path multiplier on `height` (0–2), by the path's order in the SVG. Defaults to 1. */
  heightScale?: (pathIndex: number) => number;
}

export function createRoundedNormalMap(svgText: string, options: RoundedNormalMapOptions): THREE.DataTexture {
  const { resolution = 4, radius = 24, height = 9, blur = 3 } = options;
  const pad = 2;
  const [minX, minY, maxX, maxY] = options.bounds;
  const x0 = minX - pad;
  const y0 = minY - pad;
  const w = maxX - minX + pad * 2;
  const h = maxY - minY + pad * 2;
  const W = Math.ceil(w * resolution);
  const H = Math.ceil(h * resolution);

  // 1. Rasterize the logo (fill rule matches the SVG: nonzero).
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.setTransform(resolution, 0, 0, resolution, -x0 * resolution, -y0 * resolution);
  // Red channel carries each path's height scale (0–2 mapped to 0–255).
  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  doc.querySelectorAll("path").forEach((p, i) => {
    const scale = Math.min(Math.max(options.heightScale?.(i) ?? 1, 0), 2);
    ctx.fillStyle = `rgb(${Math.round((scale / 2) * 255)}, 0, 0)`;
    ctx.fill(new Path2D(p.getAttribute("d") ?? ""));
  });
  const pixels = ctx.getImageData(0, 0, W, H).data;

  // 2. Distance (in texels) from each inside texel to the nearest outside texel.
  const INF = 1e20;
  const dist = new Float64Array(W * H);
  for (let i = 0; i < W * H; i++) dist[i] = pixels[i * 4 + 3] > 127 ? INF : 0;
  edt(dist, W, H);

  // 3. Height profile from distance (parabolic shoulder).
  const field = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    if (dist[i] === 0) continue;
    const t = Math.min(Math.sqrt(dist[i]) / resolution / radius, 1);
    const scale = (pixels[i * 4] / 255) * 2;
    field[i] = scale * height * (1 - (1 - t) * (1 - t));
  }
  const r = Math.max(1, Math.round(blur * resolution));
  boxBlur(field, W, H, r);
  boxBlur(field, W, H, r);

  // 4. Normals from the height gradient (tangent space: +x = +u, +y = +v).
  const data = new Uint16Array(W * H * 4);
  const step = 2 / resolution; // central difference spans two texels
  for (let y = 0; y < H; y++) {
    const ym = Math.max(y - 1, 0) * W;
    const yp = Math.min(y + 1, H - 1) * W;
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const dx = (field[y * W + Math.min(x + 1, W - 1)] - field[y * W + Math.max(x - 1, 0)]) / step;
      const dy = (field[yp + x] - field[ym + x]) / step;
      const len = Math.hypot(dx, dy, 1);
      data[i * 4 + 0] = THREE.DataUtils.toHalfFloat((-dx / len) * 0.5 + 0.5);
      data[i * 4 + 1] = THREE.DataUtils.toHalfFloat((-dy / len) * 0.5 + 0.5);
      data[i * 4 + 2] = THREE.DataUtils.toHalfFloat((1 / len) * 0.5 + 0.5);
      data[i * 4 + 3] = THREE.DataUtils.toHalfFloat(1);
    }
  }

  // Half-float keeps the gradients free of 8-bit banding, which chrome shows clearly.
  const texture = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.HalfFloatType);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  // Map SVG-unit UVs onto the texture.
  texture.repeat.set(1 / w, 1 / h);
  texture.offset.set(-x0 / w, -y0 / h);
  texture.needsUpdate = true;
  return texture;
}

/** In-place squared Euclidean distance transform (Felzenszwalb & Huttenlocher). */
function edt(grid: Float64Array, W: number, H: number) {
  const n = Math.max(W, H);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) f[y] = grid[y * W + x];
    edt1d(f, d, v, z, H);
    for (let y = 0; y < H; y++) grid[y * W + x] = d[y];
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) f[x] = grid[y * W + x];
    edt1d(f, d, v, z, W);
    for (let x = 0; x < W; x++) grid[y * W + x] = d[x];
  }
}

function edt1d(f: Float64Array, d: Float64Array, v: Int32Array, z: Float64Array, n: number) {
  let k = 0;
  v[0] = 0;
  z[0] = -Infinity;
  z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
}

/** In-place separable box blur. */
function boxBlur(a: Float32Array, W: number, H: number, r: number) {
  const tmp = new Float32Array(Math.max(W, H));
  const span = 2 * r + 1;
  for (let y = 0; y < H; y++) {
    const row = y * W;
    let sum = 0;
    for (let x = -r; x <= r; x++) sum += a[row + Math.min(Math.max(x, 0), W - 1)];
    for (let x = 0; x < W; x++) {
      tmp[x] = sum / span;
      sum += a[row + Math.min(x + r + 1, W - 1)] - a[row + Math.max(x - r, 0)];
    }
    a.set(tmp.subarray(0, W), row);
  }
  for (let x = 0; x < W; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) sum += a[Math.min(Math.max(y, 0), H - 1) * W + x];
    for (let y = 0; y < H; y++) {
      tmp[y] = sum / span;
      sum += a[Math.min(y + r + 1, H - 1) * W + x] - a[Math.max(y - r, 0) * W + x];
    }
    for (let y = 0; y < H; y++) a[y * W + x] = tmp[y];
  }
}
