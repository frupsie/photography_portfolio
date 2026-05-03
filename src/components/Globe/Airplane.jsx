import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Airplane({ curve, progress }) {
  const groupRef = useRef();

  useFrame(() => {
    if (!groupRef.current || !curve) return;

    const t = Math.min(progress, 0.999);
    const pos = curve.getPointAt(t);
    const ahead = curve.getPointAt(Math.min(t + 0.01, 0.999));

    groupRef.current.position.copy(pos);
    groupRef.current.lookAt(ahead);
  });

  return (
    <group ref={groupRef} scale={[0.08, 0.08, 0.08]}>
      <PlaneModel />
    </group>
  );
}

// Simple procedural plane model built from Three.js primitives
function PlaneModel() {
  return (
    <group>
      {/* Fuselage */}
      <mesh>
        <cylinderGeometry args={[0.15, 0.1, 2.0, 8]} />
        <meshStandardMaterial color="#ddeeff" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Nose cone */}
      <mesh position={[0, 1.1, 0]}>
        <coneGeometry args={[0.15, 0.5, 8]} />
        <meshStandardMaterial color="#ddeeff" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Main wings */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.08, 2.2, 0.6]} />
        <meshStandardMaterial color="#bbccee" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Tail fin vertical */}
      <mesh position={[0, -0.7, -0.3]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.06, 0.6, 0.5]} />
        <meshStandardMaterial color="#bbccee" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Tail wings horizontal */}
      <mesh position={[0, -0.8, -0.1]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.06, 1.0, 0.35]} />
        <meshStandardMaterial color="#bbccee" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Engine glow */}
      <pointLight color="#88aaff" intensity={3} distance={1.5} />
    </group>
  );
}
