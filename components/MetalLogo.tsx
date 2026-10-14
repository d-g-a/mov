"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { LOGO_SVG } from "@/lib/logo";
import { createRoundedNormalMap } from "@/lib/roundedNormalMap";

/**
 * Chrome-extruded LA MOVIDA logo on a black stage.
 *
 * Interaction
 * - Mouse hover: the logo turns to face the cursor and a light follows it,
 *   so the highlights sweep across the bevels.
 * - Drag (mouse or touch): flick to spin; it coasts with inertia, then
 *   settles back facing front.
 * - Click / tap: a short pulse and light flash.
 * - Idle: slow float and sway.
 */

const TILT_Y = 0.55; // max yaw toward pointer (radians)
const TILT_X = 0.35; // max pitch toward pointer
const SPIN_PER_PX = 0.012; // drag sensitivity
const FRICTION = 2.2; // spin velocity decay per second
const IDLE_AFTER = 3; // seconds without input before idle sway
const WARM_TINT = 0xffd6e4; // pale pink: reflected room lights + key light
const CURSOR_TINT = 0xffbcd6; // a touch stronger: cursor light + click flash
const ROUNDING = { radius: 14, height: 3.5 }; // rounded profile of the faces, in SVG units
const LETTER_ROUNDING = 0.45; // letters' rounding relative to the ring (1 = same)

export default function MetalLogo() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---------- Renderer / scene ----------
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch {
      mount.dataset.nowebgl = "true";
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    // Tint the room's light panels so the chrome reflects a warm pink glow
    const room = new RoomEnvironment();
    room.traverse((o) => {
      const m = (o as THREE.Mesh).material;
      if (m instanceof THREE.MeshLambertMaterial) m.emissive.set(WARM_TINT);
    });
    // 512 (default 256) so large mirror-like areas don't show blocky reflections
    const envTex = pmrem.fromScene(room, 0.04, 0.1, 100, { size: 512 }).texture;
    room.dispose();
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(32, 1, 1, 6000);

    // ---------- Lights ----------
    const key = new THREE.DirectionalLight(WARM_TINT, 1.2);
    key.position.set(400, 600, 800);
    const rimWarm = new THREE.DirectionalLight(0xff5a4a, 0.9);
    rimWarm.position.set(-700, -200, -400);
    const rimCool = new THREE.DirectionalLight(0x5aa8ff, 0.6);
    rimCool.position.set(700, -300, -300);
    const cursorLight = new THREE.PointLight(CURSOR_TINT, 0, 0, 0); // intensity driven by pointer
    cursorLight.position.set(0, 0, 420);
    scene.add(key, rimWarm, rimCool, cursorLight);

    // ---------- Material ----------
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xf2f3f6,
      metalness: 1,
      roughness: 0.07,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.25,
    });
    // Front/back faces get a normal map that makes them read as rounded metal
    const capMaterial = material.clone();

    // ---------- Geometry from SVG ----------
    const svg = new SVGLoader().parse(LOGO_SVG);
    const depth = 14;
    const extrude: THREE.ExtrudeGeometryOptions = {
      depth,
      bevelEnabled: true,
      bevelThickness: 3,
      bevelSize: 1.6,
      bevelSegments: 5,
      curveSegments: 48,
    };
    const logo = new THREE.Group();
    const geometries: THREE.BufferGeometry[] = [];
    for (const path of svg.paths) {
      for (const shape of path.toShapes()) {
        const g = new THREE.ExtrudeGeometry(shape, extrude);
        smoothSides(g);
        geometries.push(g);
        logo.add(new THREE.Mesh(g, [capMaterial, material])); // groups: 0 = faces, 1 = sides
      }
    }
    const box = new THREE.Box3().setFromObject(logo);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const normalMap = createRoundedNormalMap(LOGO_SVG, {
      bounds: [box.min.x, box.min.y, box.max.x, box.max.y],
      ...ROUNDING,
      heightScale: (i) => (i === 0 ? 1 : LETTER_ROUNDING), // path 0 is the ring
    });
    capMaterial.normalMap = normalMap;
    for (const g of geometries) g.translate(-center.x, -center.y, -depth / 2);
    logo.scale.set(1, -1, 1); // SVG y axis points down

    const pivot = new THREE.Group();
    pivot.add(logo);
    scene.add(pivot);

    // ---------- Sizing ----------
    const fitCamera = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const byWidth = size.x / 2 / 0.8 / (tanHalf * camera.aspect); // logo fills ~80% of width
      const byHeight = size.y / 2 / 0.45 / tanHalf; // and at most ~45% of height
      camera.position.set(0, 0, Math.max(byWidth, byHeight));
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    };
    fitCamera();
    const ro = new ResizeObserver(fitCamera);
    ro.observe(mount);

    // ---------- Interaction state ----------
    const pointer = { x: 0, y: 0, active: false }; // normalized -1..1, y down
    let lastInput = -Infinity;
    let dragging = false;
    let dragId: number | null = null;
    let lastDragX = 0;
    let lastDragT = 0;
    let spin = 0; // extra yaw from dragging
    let spinVel = 0;
    let pulse = 0; // 0..1 tap pulse energy
    let pulseVel = 0;
    let flash = 0;

    const tilt = { x: 0, y: 0 };
    // Simple frame clock (seconds)
    const clock = {
      elapsedTime: 0,
      last: performance.now(),
      getDelta() {
        const now = performance.now();
        const d = (now - this.last) / 1000;
        this.last = now;
        this.elapsedTime += Math.min(d, 1 / 20);
        return d;
      },
    };

    const setPointer = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
      lastInput = clock.elapsedTime;
    };

    const onMove = (e: PointerEvent) => {
      setPointer(e);
      pointer.active = e.pointerType === "mouse" || dragging;
      if (dragging && e.pointerId === dragId) {
        const now = performance.now();
        const dx = e.clientX - lastDragX;
        const dt = Math.max((now - lastDragT) / 1000, 1 / 240);
        spin += dx * SPIN_PER_PX;
        spinVel = THREE.MathUtils.lerp(spinVel, (dx * SPIN_PER_PX) / dt, 0.5);
        lastDragX = e.clientX;
        lastDragT = now;
      }
    };

    const onDown = (e: PointerEvent) => {
      setPointer(e);
      dragging = true;
      dragId = e.pointerId;
      pointer.active = true;
      lastDragX = e.clientX;
      lastDragT = performance.now();
      spinVel = 0;
      mount.setPointerCapture(e.pointerId);
      // tap pulse
      pulseVel += 4.5;
      flash = 1;
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== dragId) return;
      dragging = false;
      dragId = null;
      if (e.pointerType !== "mouse") pointer.active = false;
      if (performance.now() - lastDragT > 80) spinVel = 0; // held still before release
    };

    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && !dragging) pointer.active = false;
    };

    mount.addEventListener("pointermove", onMove);
    mount.addEventListener("pointerdown", onDown);
    mount.addEventListener("pointerup", onUp);
    mount.addEventListener("pointercancel", onUp);
    mount.addEventListener("pointerleave", onLeave);

    // ---------- Loop ----------
    const damp = (cur: number, target: number, lambda: number, dt: number) =>
      THREE.MathUtils.damp(cur, target, lambda, dt);

    const lightTarget = new THREE.Vector3();

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 1 / 20);
      const t = clock.elapsedTime;
      const idle = t - lastInput > IDLE_AFTER && !dragging;
      const motion = reduceMotion ? 0.4 : 1;

      // Tilt toward pointer, or idle sway
      let tx = 0;
      let ty = 0;
      if (pointer.active && !idle) {
        ty = pointer.x * TILT_Y * motion;
        tx = pointer.y * TILT_X * motion;
      } else if (!reduceMotion) {
        ty = Math.sin(t * 0.45) * 0.4;
        tx = Math.sin(t * 0.3) * 0.08 - 0.04;
      }
      tilt.x = damp(tilt.x, tx, 4, dt);
      tilt.y = damp(tilt.y, ty, 4, dt);

      // Spin inertia, then settle to nearest full turn
      if (!dragging) {
        spin += spinVel * dt;
        spinVel *= Math.exp(-FRICTION * dt);
        if (Math.abs(spinVel) < 1.2) {
          const rest = Math.round(spin / (Math.PI * 2)) * Math.PI * 2;
          spinVel += (rest - spin) * 18 * dt; // spring
          spinVel *= Math.exp(-6 * dt); // damping
        }
      }

      // Tap pulse spring
      pulseVel += -pulse * 120 * dt;
      pulseVel *= Math.exp(-10 * dt);
      pulse += pulseVel * dt;
      flash = damp(flash, 0, 5, dt);

      pivot.rotation.set(tilt.x, tilt.y + spin, 0);
      pivot.position.y = reduceMotion ? 0 : Math.sin(t * 0.9) * 6;
      const s = 1 + pulse * 0.08;
      pivot.scale.setScalar(s);

      // Cursor light: sits in front of the logo where the pointer is
      const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - 420);
      const halfW = halfH * camera.aspect;
      lightTarget.set(pointer.x * halfW, -pointer.y * halfH, 420);
      cursorLight.position.lerp(lightTarget, 1 - Math.exp(-10 * dt));
      const wantIntensity = (pointer.active && !idle ? 2.2 : 0) + flash * 6;
      cursorLight.intensity = damp(cursorLight.intensity, wantIntensity, 8, dt);

      renderer.render(scene, camera);
    };
    renderer.setAnimationLoop(tick);

    // Pause rendering while the tab is hidden
    const onVisibility = () => {
      renderer.setAnimationLoop(document.hidden ? null : tick);
      clock.getDelta();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // ---------- Cleanup ----------
    return () => {
      renderer.setAnimationLoop(null);
      document.removeEventListener("visibilitychange", onVisibility);
      mount.removeEventListener("pointermove", onMove);
      mount.removeEventListener("pointerdown", onDown);
      mount.removeEventListener("pointerup", onUp);
      mount.removeEventListener("pointercancel", onUp);
      mount.removeEventListener("pointerleave", onLeave);
      ro.disconnect();
      geometries.forEach((g) => g.dispose());
      material.dispose();
      capMaterial.dispose();
      normalMap.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      role="img"
      aria-label="LA MOVIDA logo in chrome. Move, drag or tap to play with it."
      style={{ position: "absolute", inset: 0, touchAction: "none", cursor: "grab" }}
    />
  );
}

/**
 * Smooth the shading across the bevel and side-wall segments so they read as
 * one continuous curve instead of visible facets. Sharp corners (over 35°)
 * stay crisp. The flat faces keep their own normals, because their triangles
 * span the whole shape and would pick up a tilt from the edges.
 */
function smoothSides(geometry: THREE.BufferGeometry) {
  const normal = geometry.getAttribute("normal") as THREE.BufferAttribute;
  const faces = geometry.groups[0];
  const faceNormals = normal.array.slice(faces.start * 3, (faces.start + faces.count) * 3);
  toCreasedNormals(geometry, THREE.MathUtils.degToRad(35));
  const smoothed = geometry.getAttribute("normal") as THREE.BufferAttribute;
  (smoothed.array as Float32Array).set(faceNormals, faces.start * 3);
  smoothed.needsUpdate = true;
}
