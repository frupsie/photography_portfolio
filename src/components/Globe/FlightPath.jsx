import { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { useGlobeStore } from '../../store/globeStore';
import { SINGAPORE } from '../../data/cities';
import { ll2xyz, R } from './EarthMesh';
import Airplane from './Airplane';

const ARC_H      = 1.3;
const FLIGHT_SEC = 2.6;

function buildArc(a, b) {
  const from = ll2xyz(a.lat, a.lon, R + 0.05);
  const to   = ll2xyz(b.lat, b.lon, R + 0.05);
  const mid  = from.clone().add(to).normalize().multiplyScalar(R + ARC_H);
  return new THREE.QuadraticBezierCurve3(from, mid, to);
}

/* Smoothstep easing — acceleration out, deceleration in */
function smoothstep(p) {
  return p * p * (3 - 2 * p);
}

export default function FlightPath() {
  const { selectedCity, isAnimating, finishAnimation, clearSelected } = useGlobeStore();
  const navigate    = useNavigate();
  const progRef     = useRef(0);
  const activeRef   = useRef(false);
  const doneRef     = useRef(false);
  const [prog, setProg] = useState(0);

  const curve = useMemo(
    () => (selectedCity ? buildArc(SINGAPORE, selectedCity) : null),
    [selectedCity]
  );

  useEffect(() => {
    if (isAnimating && selectedCity) {
      progRef.current = 0;
      doneRef.current = false;
      activeRef.current = true;
      setProg(0);
    }
  }, [isAnimating, selectedCity]);

  useFrame((_, delta) => {
    if (!activeRef.current || !curve) return;
    progRef.current = Math.min(progRef.current + delta / FLIGHT_SEC, 1);
    setProg(progRef.current);
    if (progRef.current >= 1 && !doneRef.current) {
      doneRef.current = true;
      activeRef.current = false;
      finishAnimation();
      const slug = selectedCity.slug;
      setTimeout(() => { clearSelected(); navigate(`/city/${slug}`); }, 380);
    }
  });

  if (!curve || !selectedCity) return null;

  const easedProg = smoothstep(prog);
  const pts = curve.getPoints(Math.max(2, Math.floor(easedProg * 128)));

  return (
    <group>
      <ArcLine pts={pts} />
      {prog < 0.97 && <Airplane curve={curve} progress={easedProg} />}
      <OriginDot />
    </group>
  );
}

function ArcLine({ pts }) {
  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(pts), [pts]);
  return (
    <>
      {/* Core white arc */}
      <line>
        <primitive object={geo} attach="geometry" />
        <lineBasicMaterial color="#ffffff" transparent opacity={0.95} />
      </line>
      {/* Warm gold glow pass */}
      <line>
        <primitive object={geo} attach="geometry" />
        <lineBasicMaterial
          color="#ffe8a0"
          transparent
          opacity={0.30}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </line>
    </>
  );
}

function OriginDot() {
  const pos = ll2xyz(SINGAPORE.lat, SINGAPORE.lon, R + 0.04);
  return (
    <mesh position={pos}>
      <sphereGeometry args={[0.044, 12, 12]} />
      <meshStandardMaterial color="#e8b84b" emissive="#b08000" emissiveIntensity={3} />
    </mesh>
  );
}
