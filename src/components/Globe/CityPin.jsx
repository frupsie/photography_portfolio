import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useGlobeStore } from '../../store/globeStore';
import { ll2xyz, R } from './EarthMesh';

export default function CityPin({ city }) {
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const phase1   = useRef(0);
  const phase2   = useRef(0.5); // offset so rings alternate

  const { selectCity, setHoveredCity, scheduleHoverClear, isAnimating, hoveredCity, selectedCity } =
    useGlobeStore();

  const isHov = hoveredCity?.slug  === city.slug;
  const isSel = selectedCity?.slug === city.slug;
  const isAct = isHov || isSel;

  const pos = ll2xyz(city.lat, city.lon, R + 0.03);

  useFrame((_, delta) => {
    if (isAct) {
      phase1.current = (phase1.current + delta / 0.9) % 1;
      phase2.current = (phase2.current + delta / 0.9) % 1;
    }

    if (ring1Ref.current) {
      const p = phase1.current;
      const s = 0.3 + p * 1.4;
      ring1Ref.current.scale.set(s, s, s);
      ring1Ref.current.material.opacity = isAct ? (1 - p) * 0.65 : 0;
    }

    if (ring2Ref.current) {
      const p = phase2.current;
      const s = 0.3 + p * 1.4;
      ring2Ref.current.scale.set(s, s, s);
      ring2Ref.current.material.opacity = isAct ? (1 - p) * 0.65 : 0;
    }
  });

  return (
    <group position={pos}>
      {/* Invisible large hit area for reliable pointer detection */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          setHoveredCity(city);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'default';
          scheduleHoverClear();
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isAnimating) return;
          selectCity(city);
        }}
      >
        <sphereGeometry args={[0.10, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Visible dot — small, white at rest, gold when selected */}
      <mesh>
        <sphereGeometry args={[0.034, 12, 12]} />
        <meshStandardMaterial
          color={isSel ? '#e8b84b' : '#e8e8f0'}
          emissive={isSel ? '#b08000' : '#c8c8e0'}
          emissiveIntensity={isSel ? 3.0 : 1.2}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>

      {/* Billboard rings — always face camera, only appear on hover/select */}
      <Billboard>
        <mesh ref={ring1Ref}>
          <ringGeometry args={[0.05, 0.085, 28]} />
          <meshBasicMaterial
            color="#e8b84b"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <mesh ref={ring2Ref}>
          <ringGeometry args={[0.05, 0.085, 28]} />
          <meshBasicMaterial
            color="#e8b84b"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </Billboard>
    </group>
  );
}
