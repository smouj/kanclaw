'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Enhanced Digital Terrain with RGB grid lines
function DigitalTerrain() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(14, 10, 64, 48);
    const positions = geo.attributes.position;
    
    // Subtle wave patterns
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      
      // Gentle wave
      const wave = Math.sin(x * 0.6 + y * 0.2) * 0.08 
                 + Math.cos(x * 0.9 - y * 0.4) * 0.05
                 + Math.sin(x * 1.5 + y * 1.2) * 0.03;
      
      positions.setZ(i, wave);
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color('#050508') },
        uColor2: { value: new THREE.Color('#0a0a15') },
      },
      vertexShader: `
        varying float vElevation;
        varying vec2 vUv;
        uniform float uTime;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Subtle animated wave
          float wave = sin(pos.x * 1.2 + uTime * 0.4) * 0.06;
          wave += cos(pos.y * 0.8 + uTime * 0.3) * 0.04;
          wave += sin((pos.x + pos.y) * 2.0 + uTime * 0.6) * 0.02;
          
          pos.z += wave;
          vElevation = pos.z;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying float vElevation;
        varying vec2 vUv;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        
        // RGB colors
        vec3 red = vec3(1.0, 0.2, 0.2);
        vec3 green = vec3(0.2, 1.0, 0.2);
        vec3 blue = vec3(0.2, 0.4, 1.0);
        
        void main() {
          // Base gradient
          float mixStrength = (vElevation + 0.15) * 3.0;
          vec3 color = mix(uColor1, uColor2, mixStrength);
          
          // Fine grid lines - smaller squares
          float gridX = step(0.97, fract(vUv.x * 48.0));
          float gridY = step(0.97, fract(vUv.y * 48.0));
          float grid = max(gridX, gridY);
          
          // RGB color cycling based on position and time
          float colorShift = sin(vUv.x * 6.28 + vUv.y * 3.14) * 0.5 + 0.5;
          vec3 rgbColor = mix(red, green, colorShift);
          rgbColor = mix(rgbColor, blue, sin(colorShift * 3.14) * 0.5 + 0.5);
          
          // Accent glow at peaks - subtle
          float accent = smoothstep(0.08, 0.15, vElevation) * 0.4;
          
          // Apply grid and accent
          color = mix(color, rgbColor, grid * 0.25 + accent);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
      wireframe: false,
    });
  }, []);

  useFrame(({ clock }) => {
    if (material.uniforms) {
      material.uniforms.uTime.value = clock.getElapsedTime();
    }
    if (meshRef.current) {
      meshRef.current.rotation.x = -0.25;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  );
}

// Subtle floating particles
function FloatingParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const { positions } = useMemo(() => {
    const count = 60;
    const pos = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    
    return { positions: pos };
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
      const time = clock.getElapsedTime();
      
      for (let i = 0; i < posArray.length / 3; i++) {
        // Gentle floating
        posArray[i * 3 + 1] += Math.sin(time * 0.3 + i * 0.5) * 0.0008;
        
        // Wrap around
        if (posArray[i * 3 + 1] > 4) posArray[i * 3 + 1] = -4;
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#334455"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
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
    return (
      <div 
        className={`absolute inset-0 bg-gradient-to-br from-[#050508] via-[#0a0a12] to-[#030306] ${className}`}
        data-testid="ambient-fallback-layer" 
      />
    );
  }

  return (
    <div 
      className={`absolute inset-0 ${className}`}
      data-testid="ambient-canvas-layer"
    >
      <Canvas 
        camera={{ position: [0, 0, 4.5], fov: 40 }} 
        dpr={[1, 1.25]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#030305']} />
        <fog attach="fog" args={['#030305', 3.5, 12]} />
        
        <ambientLight intensity={0.15} />
        
        <DigitalTerrain />
        <FloatingParticles />
      </Canvas>
    </div>
  );
}
