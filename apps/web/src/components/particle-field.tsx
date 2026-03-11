'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const MAX_PARTICLES = 350;
const SPAWN_RATE = 5;
const MAX_LIFE = 3.0;
const LINK_DIST = 1.6;
const LINK_DIST_SQ = LINK_DIST * LINK_DIST;
const MAX_LINKS = 2500;

interface Particle {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number;
  maxLife: number;
  hue: number;
  alive: boolean;
}

function turbulence(x: number, y: number, z: number): number {
  return Math.sin(x * 1.7 + y * 3.1 + z * 0.7) *
    Math.cos(y * 2.3 - z * 1.3 + x * 0.9) *
    Math.sin(z * 3.7 - x * 2.1 + y * 1.1);
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360 / 360;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return [f(0), f(8), f(4)];
}

function createGlowTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;
  const g = ctx.createRadialGradient(c, c, 0, c, c, c);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.12, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.15)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export function ParticleField() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const pointer = new THREE.Vector2(9999, 9999);
    const raycaster = new THREE.Raycaster();
    const castPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const cursorWorld = new THREE.Vector3(0, 0, 0);
    const prevCursor = new THREE.Vector3(0, 0, 0);
    let mouseActive = false;

    const particles: Particle[] = Array.from({ length: MAX_PARTICLES }, () => ({
      x: 9999, y: 9999, z: 9999,
      vx: 0, vy: 0, vz: 0,
      life: -1, maxLife: MAX_LIFE, hue: 0, alive: false,
    }));
    let spawnIdx = 0;
    let hueOffset = 30;

    const glowTex = createGlowTexture();

    const pPos = new Float32Array(MAX_PARTICLES * 3);
    const pCol = new Float32Array(MAX_PARTICLES * 3);
    const pointGeo = new THREE.BufferGeometry();
    pointGeo.setAttribute('position', new THREE.Float32BufferAttribute(pPos, 3));
    pointGeo.setAttribute('color', new THREE.Float32BufferAttribute(pCol, 3));

    const pointMat = new THREE.PointsMaterial({
      size: 0.18,
      map: glowTex,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
    });
    scene.add(new THREE.Points(pointGeo, pointMat));

    const lPos = new Float32Array(MAX_LINKS * 6);
    const lCol = new Float32Array(MAX_LINKS * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lPos, 3));
    lineGeo.setAttribute('color', new THREE.Float32BufferAttribute(lCol, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      opacity: 0.7,
    });
    const linesMesh = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(linesMesh);

    const clock = new THREE.Clock();
    let animId = 0;

    function spawn() {
      const p = particles[spawnIdx % MAX_PARTICLES];
      spawnIdx++;
      const t = Math.random();
      p.x = prevCursor.x + (cursorWorld.x - prevCursor.x) * t + (Math.random() - 0.5) * 0.05;
      p.y = prevCursor.y + (cursorWorld.y - prevCursor.y) * t + (Math.random() - 0.5) * 0.05;
      p.z = (Math.random() - 0.5) * 0.3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const spd = 0.8 + Math.random() * 2.5;
      p.vx = Math.sin(theta) * Math.cos(phi) * spd;
      p.vy = Math.sin(theta) * Math.sin(phi) * spd;
      p.vz = Math.cos(theta) * spd * 0.3;
      p.life = 1.0;
      p.maxLife = MAX_LIFE + Math.random() * 1.5;
      p.hue = hueOffset + Math.random() * 50;
      p.alive = true;
    }

    function animate() {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;

      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(castPlane, cursorWorld);

      if (mouseActive) {
        for (let i = 0; i < SPAWN_RATE; i++) spawn();
      }

      hueOffset = 25 + Math.sin(elapsed * 0.15) * 15;

      for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = particles[i];
        if (!p.alive) {
          pPos[i * 3] = 9999;
          pPos[i * 3 + 1] = 9999;
          pPos[i * 3 + 2] = 9999;
          pCol[i * 3] = pCol[i * 3 + 1] = pCol[i * 3 + 2] = 0;
          continue;
        }

        const nx = turbulence(p.x * 0.4, p.y * 0.4, elapsed * 0.25);
        const ny = turbulence(p.y * 0.4 + 73, p.z * 0.4, elapsed * 0.25);
        const nz = turbulence(p.z * 0.4 + 137, p.x * 0.4, elapsed * 0.25);
        p.vx += nx * 0.4 * p.life;
        p.vy += ny * 0.4 * p.life;
        p.vz += nz * 0.15 * p.life;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.vz *= 0.97;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.life -= dt / p.maxLife;

        if (p.life <= 0) {
          p.alive = false;
          continue;
        }

        pPos[i * 3] = p.x;
        pPos[i * 3 + 1] = p.y;
        pPos[i * 3 + 2] = p.z;

        const alpha = Math.pow(p.life, 0.7);
        const pulse = (Math.sin(elapsed * 2.5 + i * 0.37) * 0.3 + 0.7);
        const b = alpha * pulse * 1.8;
        const [r, g, bl] = hslToRgb(p.hue, 0.75, 0.55);
        pCol[i * 3] = r * b;
        pCol[i * 3 + 1] = g * b;
        pCol[i * 3 + 2] = bl * b;
      }

      (pointGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (pointGeo.attributes.color as THREE.BufferAttribute).needsUpdate = true;

      let lc = 0;
      for (let i = 0; i < MAX_PARTICLES && lc < MAX_LINKS; i++) {
        const a = particles[i];
        if (!a.alive) continue;
        for (let j = i + 1; j < MAX_PARTICLES && lc < MAX_LINKS; j++) {
          const b = particles[j];
          if (!b.alive) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dz = a.z - b.z;
          const dsq = dx * dx + dy * dy + dz * dz;
          if (dsq >= LINK_DIST_SQ) continue;

          const d = Math.sqrt(dsq);
          const strength = (1 - d / LINK_DIST) * Math.min(a.life, b.life) * 0.65;
          const avgH = (a.hue + b.hue) / 2;
          const [cr, cg, cb] = hslToRgb(avgH, 0.6, 0.4);
          const idx = lc * 6;
          lPos[idx] = a.x; lPos[idx + 1] = a.y; lPos[idx + 2] = a.z;
          lPos[idx + 3] = b.x; lPos[idx + 4] = b.y; lPos[idx + 5] = b.z;
          lCol[idx] = cr * strength; lCol[idx + 1] = cg * strength; lCol[idx + 2] = cb * strength;
          lCol[idx + 3] = cr * strength; lCol[idx + 4] = cg * strength; lCol[idx + 5] = cb * strength;
          lc++;
        }
      }

      for (let i = lc * 6; i < MAX_LINKS * 6; i++) {
        lPos[i] = 0;
        lCol[i] = 0;
      }
      lineGeo.setDrawRange(0, lc * 2);
      (lineGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (lineGeo.attributes.color as THREE.BufferAttribute).needsUpdate = true;

      prevCursor.copy(cursorWorld);
      renderer.render(scene, camera);
    }

    function onPointerMove(e: MouseEvent) {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseActive = true;
    }

    function onPointerLeave() { mouseActive = false; }

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('resize', onResize);
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', onResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      glowTex.dispose();
      pointGeo.dispose();
      pointMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
