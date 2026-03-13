'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Unique "Digital Terrain" effect - not the typical particle cloud
function DigitalTerrain() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(12, 8, 48, 32);
    const positions = geo.attributes.position;
    
    // Create terrain-like wave patterns
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      
      // Multiple wave layers for organic feel
      const wave1 = Math.sin(x * 0.8 + y * 0.3) * 0.15;
      const wave2 = Math.cos(x * 1.2 - y * 0.5) * 0.1;
      const wave3 = Math.sin(x * 2.1 + y * 1.8) * 0.05;
      const noise = (Math.random() - 0.5) * 0.02;
      
      positions.setZ(i, wave1 + wave2 + wave3 + noise);
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color('#0a0a0a') },
        uColor2: { value: new THREE.Color('#1a1a2e') },
        uAccent: { value: new THREE.Color('#33ff33') },
      },
      vertexShader: `
        varying float vElevation;
        varying vec2 vUv;
        uniform float uTime;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Animated wave displacement
          float wave = sin(pos.x * 2.0 + uTime * 0.5) * 0.08;
          wave += cos(pos.y * 1.5 + uTime * 0.3) * 0.06;
          wave += sin((pos.x + pos.y) * 3.0 + uTime) * 0.03;
          
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
        uniform vec3 uAccent;
        
        void main() {
          // Base gradient
          float mixStrength = (vElevation + 0.2) * 2.0;
          vec3 color = mix(uColor1, uColor2, mixStrength);
          
          // Grid lines effect
          float gridX = step(0.97, fract(vUv.x * 24.0));
          float gridY = step(0.97, fract(vUv.y * 16.0));
          float grid = max(gridX, gridY);
          
          // Accent glow at peaks
          float accent = smoothstep(0.15, 0.25, vElevation) * 0.15;
          
          color = mix(color, uAccent, grid * 0.3 + accent);
          
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
      meshRef.current.rotation.x = -0.3;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  );
}

// Floating code symbols effect
function FloatingSymbols() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const { positions, symbols } = useMemo(() => {
    const count = 80;
    const pos = new Float32Array(count * 3);
    const sym = new Array(count).fill(0).map(() => Math.random());
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    
    return { positions: pos, symbols: sym };
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
      const time = clock.getElapsedTime();
      
      for (let i = 0; i < posArray.length / 3; i++) {
        // Floating upward motion
        posArray[i * 3 + 1] += Math.sin(time + i) * 0.001;
        
        // Wrap around
        if (posArray[i * 3 + 1] > 3) {
          posArray[i * 3 + 1] = -3;
        }
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
        size={0.04}
        color="#444466"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Scanline overlay effect
function Scanlines() {
  return (
    <mesh rotation={[0, 0, 0]} position={[0, 0, 0.1]}>
      <planeGeometry args={[20, 20]} />
      <shaderMaterial
        transparent
        uniforms={{}}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          void main() {
            float scanline = sin(vUv.y * 200.0) * 0.02;
            float vignette = 1.0 - length(vUv - 0.5) * 0.5;
            gl_FragColor = vec4(0.0, 0.0, 0.0, scanline * 0.3 + (1.0 - vignette) * 0.15);
          }
        `}
      />
    </mesh>
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
        camera={{ position: [0, 0, 4], fov: 45 }} 
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#030306']} />
        <fog attach="fog" args={['#030306', 3, 10]} />
        
        <ambientLight intensity={0.2} />
        
        <DigitalTerrain />
        <FloatingSymbols />
        <Scanlines />
      </Canvas>
    </div>
  );
}
