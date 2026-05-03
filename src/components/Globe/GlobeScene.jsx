import { Suspense, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import EarthMesh, { rotYForLon } from './EarthMesh';
import CityPin from './CityPin';
import CityLabel from './CityLabel';
import FlightPath from './FlightPath';
import FloatingCard from '../FloatingCard';
import { cities, SINGAPORE } from '../../data/cities';
import { useGlobeStore } from '../../store/globeStore';

export const BASE_ROT_Y = rotYForLon(118);
const BASE_ROT_X = 0.18;

function getMidRotY(city) {
  const midLon = (SINGAPORE.lon + city.lon) / 2;
  return rotYForLon(midLon);
}

export default function GlobeScene() {
  const groupRef   = useRef();
  const targetRotY = useRef(BASE_ROT_Y);
  const currRotY   = useRef(BASE_ROT_Y);

  const { hoveredCity, selectedCity } = useGlobeStore();
  const activeCity = hoveredCity || selectedCity;

  useEffect(() => {
    targetRotY.current = selectedCity ? getMidRotY(selectedCity) : BASE_ROT_Y;
  }, [selectedCity]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    currRotY.current = THREE.MathUtils.lerp(currRotY.current, targetRotY.current, delta * 2.8);
    groupRef.current.rotation.y = currRotY.current;
  });

  return (
    <>
      {/* Warm ambient to lift the dark side slightly */}
      <ambientLight intensity={0.4} color="#d0c8c0" />
      {/* Key directional light — gives the sphere visible depth/curvature */}
      <directionalLight position={[6, 4, 4]} intensity={1.4} color="#ffffff" />

      <Suspense fallback={null}>
        <group
          ref={groupRef}
          position={[0, -0.6, 0]}
          rotation={[BASE_ROT_X, BASE_ROT_Y, 0]}
        >
          <EarthMesh />

          {cities.map((city) => (
            <CityPin key={city.slug} city={city} />
          ))}

          {cities.map((city) => (
            <CityLabel key={`lbl-${city.slug}`} city={city} />
          ))}

          <FlightPath />

          {activeCity && <FloatingCard city={activeCity} />}
        </group>
      </Suspense>
    </>
  );
}
