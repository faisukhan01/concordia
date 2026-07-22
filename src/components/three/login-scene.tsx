'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Premium login background — a calm, flowing field of golden knowledge
 * particles drifting upward, with a few soft glowing orbs. No objects,
 * no geometry — just elegant light. Minimal and refined.
 */
export function LoginScene({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const group = new THREE.Group();
    scene.add(group);

    // ===== FLOWING PARTICLE STREAM (golden, drifting upward) =====
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const speeds: number[] = [];
    const baseX: number[] = [];
    const phase: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 16;
      const z = (Math.random() - 0.5) * 8 - 1;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      baseX.push(x);
      phase.push(Math.random() * Math.PI * 2);

      const isGold = Math.random() > 0.3;
      const c = new THREE.Color(isGold ? 0xf5b544 : 0x8fa9ff);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      sizes[i] = 0.04 + Math.random() * 0.08;
      speeds.push(0.3 + Math.random() * 0.5);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMat = new THREE.PointsMaterial({
      size: 0.07, vertexColors: true, transparent: true, opacity: 0.65,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ===== SOFT GLOWING ORBS (3-4, floating gently) =====
    const orbs: { mesh: THREE.Mesh; baseY: number; speed: number; phase: number; baseX: number }[] = [];
    const orbConfigs = [
      { x: -3.5, y: 1.5, color: 0xf5b544, size: 0.18 },
      { x: 3.2, y: -1.2, color: 0x8fa9ff, size: 0.15 },
      { x: -2.8, y: -2.0, color: 0xf5b544, size: 0.12 },
      { x: 3.8, y: 2.2, color: 0x6ee7b7, size: 0.14 },
    ];
    orbConfigs.forEach((c, i) => {
      const orbGeo = new THREE.SphereGeometry(c.size, 24, 24);
      const orbMat = new THREE.MeshBasicMaterial({
        color: c.color, transparent: true, opacity: 0.8,
      });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(c.x, c.y, -0.5);
      orbs.push({ mesh: orb, baseY: c.y, baseX: c.x, speed: 0.2 + i * 0.08, phase: i * 1.5 });
      group.add(orb);

      // Soft halo
      const haloGeo = new THREE.SphereGeometry(c.size * 2.5, 20, 20);
      const haloMat = new THREE.MeshBasicMaterial({
        color: c.color, transparent: true, opacity: 0.06,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      orb.add(halo);
      // Outer halo
      const halo2Geo = new THREE.SphereGeometry(c.size * 4, 16, 16);
      const halo2 = new THREE.Mesh(halo2Geo, haloMat);
      orb.add(halo2);
    });

    // ===== Central soft radial glow (behind everything) =====
    const glowGeo = new THREE.SphereGeometry(4, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x1a2a4a, transparent: true, opacity: 0.4, side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.z = -3;
    scene.add(glow);

    // Mouse parallax
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: MouseEvent) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove);

    let raf = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      mouse.x += (mouse.tx - mouse.x) * 0.03;
      mouse.y += (mouse.ty - mouse.y) * 0.03;

      // Particles — drift upward with gentle horizontal sway, wrap around
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        const yIdx = i * 3 + 1;
        let y = posAttr.array[yIdx] as number;
        y += speeds[i] * 0.005;
        if (y > 8) y = -8;
        posAttr.array[yIdx] = y;
        // gentle horizontal sway
        const xIdx = i * 3;
        posAttr.array[xIdx] = baseX[i] + Math.sin(t * 0.5 + phase[i]) * 0.3;
      }
      posAttr.needsUpdate = true;

      // Orbs — gentle float
      orbs.forEach((o) => {
        o.mesh.position.y = o.baseY + Math.sin(t * o.speed + o.phase) * 0.4;
        o.mesh.position.x = o.baseX + Math.cos(t * o.speed * 0.7 + o.phase) * 0.2;
        const pulse = 1 + Math.sin(t * 0.6 + o.phase) * 0.12;
        o.mesh.scale.setScalar(pulse);
      });

      // Central glow pulse
      glow.scale.setScalar(1 + Math.sin(t * 0.5) * 0.05);

      // Gentle camera parallax
      group.rotation.y = mouse.x * 0.1;
      camera.position.x += (mouse.x * 0.4 - camera.position.x) * 0.025;
      camera.position.y += (-mouse.y * 0.3 - camera.position.y) * 0.025;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else (obj.material as THREE.Material)?.dispose();
        }
      });
      particleGeo.dispose();
      particleMat.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}
