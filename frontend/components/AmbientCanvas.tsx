'use client';

import { useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function AtmospherePoints() {
  const points = useMemo(() => {
    const values = new Float32Array(900);
    for (let index = 0; index < values.length; index += 3) {
      values[index] = (Math.random() - 0.5) * 11;
      values[index + 1] = (Math.random() - 0.5) * 7;
      values[index + 2] = (Math.random() - 0.5) * 5;
    }
    return values;
  }, []);

  useFrame((state) => {
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, state.mouse.x * 0.18, 0.03);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, state.mouse.y * 0.14, 0.03);
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <group rotation={[0.25, 0, 0]}>
      <Points positions={points} stride={3} frustumCulled>
        <PointMaterial transparent color="#f5f5f5" size={0.018} sizeAttenuation depthWrite={false} opacity={0.28} />
      </Points>
    </group>
  );
}

export function AmbientCanvas({ className = '' }: { className?: string }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lowPower = (navigator.hardwareConcurrency || 8) <= 4;
    setEnabled(!reducedMotion && !lowPower);
  }, []);

  if (!enabled) {
    return <div className={`absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_32%)] ${className}`} data-testid="ambient-fallback-layer" />;
  }

  return (
    <div className={`absolute inset-0 ${className}`} data-testid="ambient-canvas-layer">
      <Canvas camera={{ position: [0, 0, 3.2], fov: 50 }} dpr={[1, 1.5]}>
        <color attach="background" args={['#020202']} />
        <fog attach="fog" args={['#020202', 2.8, 8]} />
        <ambientLight intensity={0.25} />
        <AtmospherePoints />
      </Canvas>
    </div>
  );
}