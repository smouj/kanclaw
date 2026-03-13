'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Enhanced Digital Terrain with RGB grid - works for both themes
function DigitalTerrain({ isLight }: { isLight: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(14, 10, 64, 48);
    const positions = geo.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      
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
        uIsLight: { value: 0 },
      },
      vertexShader: `
        varying float vElevation;
        varying vec2 vUv;
        uniform float uTime;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
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
        uniform float uTime;
        uniform float uIsLight;
        
        void main() {
          // Dark theme colors
          vec3 darkBg1 = vec3(0.02, 0.02, 0.03);
          vec3 darkBg2 = vec3(0.04, 0.04, 0.08);
          
          // Light theme colors
          vec3 lightBg1 = vec3(0.98, 0.98, 0.98);
          vec3 lightBg2 = vec3(0.95, 0.95, 0.97);
          
          // Mix based on theme
          vec3 bg1 = mix(darkBg1, lightBg1, uIsLight);
          vec3 bg2 = mix(darkBg2, lightBg2, uIsLight);
          
          float mixStrength = (vElevation + 0.15) * 3.0;
          vec3 color = mix(bg1, bg2, mixStrength);
          
          // Fine grid
          float gridX = step(0.97, fract(vUv.x * 48.0));
          float gridY = step(0.97, fract(vUv.y * 48.0));
          float grid = max(gridX, gridY);
          
          // RGB colors
          float colorShift = sin(vUv.x * 6.28 + vUv.y * 3.14 + uTime * 0.2) * 0.5 + 0.5;
          vec3 rgb = vec3(
            sin(colorShift * 6.28) * 0.5 + 0.5,
            sin(colorShift * 6.28 + 2.09) * 0.5 + 0.5,
            sin(colorShift * 6.28 + 4.18) * 0.5 + 0.5
          );
          
          // For light theme, make grid darker
          vec3 gridColor = mix(rgb, vec3(0.3), uIsLight * 0.7);
          
          // Accent (reduced intensity for subtler background)
          float accent = smoothstep(0.08, 0.15, vElevation) * 0.12;
          
          color = mix(color, gridColor, grid * 0.08 + accent);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });
  }, []);

  useFrame(({ clock }) => {
    if (material.uniforms) {
      material.uniforms.uTime.value = clock.getElapsedTime();
      material.uniforms.uIsLight.value = isLight ? 1 : 0;
    }
    if (meshRef.current) {
      meshRef.current.rotation.x = -0.25;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  );
}

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
        posArray[i * 3 + 1] += Math.sin(time * 0.3 + i * 0.5) * 0.0008;
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
        size={0.02}
        color="#2a3340"
        transparent
        opacity={0.22}
        sizeAttenuation
      />
    </points>
  );
}

export function AmbientCanvas({ className = '' }: { className?: string }) {
  const [enabled, setEnabled] = useState(false);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lowPower = (navigator.hardwareConcurrency || 8) <= 4;
    setEnabled(!reducedMotion && !lowPower);
    
    // Detect theme
    const checkTheme = () => {
      setIsLight(document.documentElement.classList.contains('theme-light'));
    };
    
    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  if (!enabled) {
    return (
      <div 
        className={`absolute inset-0 ${isLight ? 'bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300' : 'bg-gradient-to-br from-[#010101] via-[#020202] to-[#000000]'} ${className}`}
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
        <color attach="background" args={[isLight ? '#e8e8e8' : '#010101']} />
        <fog attach="fog" args={[isLight ? '#e8e8e8' : '#010101', 5, 15]} />
        
        <ambientLight intensity={0.08} />
        
        <DigitalTerrain isLight={isLight} />
        <FloatingParticles />
      </Canvas>
    </div>
  );
}
