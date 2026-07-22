'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * eSM Hero Scene — an elegant "knowledge network" constellation.
 * Golden nodes connected by soft lines, slowly rotating, with gentle
 * pulses traveling along the connections. Represents the connected
 * ecosystem of a modern school. Premium, abstract, clean.
 */
export function HeroScene({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Warm lighting
    scene.add(new THREE.AmbientLight(0xfff0d4, 0.6));
    const keyLight = new THREE.DirectionalLight(0xffd97a, 0.8);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);

    const group = new THREE.Group();
    scene.add(group);

    // ===== NODE POSITIONS (distributed on a sphere) =====
    const nodeCount = 28;
    const radius = 2.8;
    const nodes: THREE.Vector3[] = [];
    const nodeMeshes: { mesh: THREE.Mesh; baseScale: number; phase: number }[] = [];

    const nodeGeo = new THREE.SphereGeometry(0.08, 20, 20);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf5b544, roughness: 0.2, metalness: 0.8,
      emissive: 0xf5b544, emissiveIntensity: 0.4,
    });
    const emeraldMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, roughness: 0.2, metalness: 0.8,
      emissive: 0x10b981, emissiveIntensity: 0.4,
    });

    for (let i = 0; i < nodeCount; i++) {
      // Fibonacci sphere distribution for even spread
      const phi = Math.acos(1 - 2 * (i + 0.5) / nodeCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      nodes.push(new THREE.Vector3(x, y, z));

      const mat = i % 3 === 0 ? emeraldMat : goldMat;
      const node = new THREE.Mesh(nodeGeo, mat);
      node.position.set(x, y, z);
      const baseScale = 0.7 + Math.random() * 0.8;
      node.scale.setScalar(baseScale);
      nodeMeshes.push({ mesh: node, baseScale, phase: Math.random() * Math.PI * 2 });
      group.add(node);
    }

    // ===== CONNECTION LINES (connect nearby nodes) =====
    const linePositions: number[] = [];
    const connections: { a: number; b: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = nodes[i].distanceTo(nodes[j]);
        if (dist < 2.2) {
          linePositions.push(nodes[i].x, nodes[i].y, nodes[i].z);
          linePositions.push(nodes[j].x, nodes[j].y, nodes[j].z);
          connections.push({ a: i, b: j });
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xf5b544, transparent: true, opacity: 0.18,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    group.add(lines);

    // ===== CENTRAL GLOW =====
    const glowGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xf5b544, transparent: true, opacity: 0.08, side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);

    // Outer aura
    const auraGeo = new THREE.SphereGeometry(3.5, 32, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x10b981, transparent: true, opacity: 0.03, side: THREE.BackSide,
    });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    group.add(aura);

    // ===== FLOATING PARTICLES (fine dust) =====
    const dustCount = 120;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      const r = 3 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      dustPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      dustPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      dustPos[i * 3 + 2] = r * Math.cos(phi);
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.04, color: 0xffd97a, transparent: true, opacity: 0.5,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // Mouse parallax
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouse.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouse.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove);

    let raf = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;

      // Slow rotation of the whole network
      group.rotation.y = t * 0.12;
      group.rotation.x = Math.sin(t * 0.15) * 0.1;

      // Node pulsing
      nodeMeshes.forEach((n) => {
        const pulse = n.baseScale * (1 + Math.sin(t * 1.5 + n.phase) * 0.2);
        n.mesh.scale.setScalar(pulse);
      });

      // Line opacity pulsing (subtle)
      lineMat.opacity = 0.15 + Math.sin(t * 0.8) * 0.05;

      // Glow pulse
      glow.scale.setScalar(1 + Math.sin(t * 0.6) * 0.08);
      aura.scale.setScalar(1 + Math.sin(t * 0.4) * 0.04);

      // Dust slow rotation
      dust.rotation.y = t * 0.02;
      dust.rotation.x = t * 0.01;

      // Camera parallax
      camera.position.x += (mouse.x * 0.8 - camera.position.x) * 0.03;
      camera.position.y += (-mouse.y * 0.5 - camera.position.y) * 0.03;
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
      nodeGeo.dispose();
      goldMat.dispose();
      emeraldMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      auraGeo.dispose();
      auraMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}
