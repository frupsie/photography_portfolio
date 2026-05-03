import { useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { feature } from 'topojson-client';

export const R = 2.5;

export function ll2xyz(lat, lon, radius) {
  const phi   = (90 - lat)   * (Math.PI / 180);
  const theta = (lon + 180)  * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

export function rotYForLon(lon) {
  return -(90 + lon) * (Math.PI / 180);
}

const TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

function inAsia([minLon, minLat, maxLon, maxLat]) {
  return maxLon > 55 && minLon < 160 && maxLat > -15 && minLat < 75;
}

function getFeatureBBox(f) {
  let x0 = 180, y0 = 90, x1 = -180, y1 = -90;
  const visit = (c) => {
    if (c[0] < x0) x0 = c[0]; if (c[0] > x1) x1 = c[0];
    if (c[1] < y0) y0 = c[1]; if (c[1] > y1) y1 = c[1];
  };
  const { type, coordinates } = f.geometry;
  const flat = (ring) => ring.forEach(visit);
  if (type === 'Polygon') coordinates.forEach(flat);
  else if (type === 'MultiPolygon') coordinates.forEach(p => p.forEach(flat));
  return [x0, y0, x1, y1];
}

function ringToLine(ring, r) {
  const pts = [];
  for (const [lon, lat] of ring) {
    const v = ll2xyz(lat, lon, r);
    pts.push(v.x, v.y, v.z);
  }
  return new Float32Array(pts);
}

export default function EarthMesh() {
  const [borders, setBorders] = useState([]);

  useEffect(() => {
    fetch(TOPO_URL)
      .then(r => r.json())
      .then(world => {
        const countries = feature(world, world.objects.countries).features;
        const lines = [];
        for (const f of countries) {
          if (!f.geometry) continue;
          const bbox = getFeatureBBox(f);
          if (!inAsia(bbox)) continue;
          const { type, coordinates } = f.geometry;
          const rings = type === 'Polygon' ? coordinates : coordinates.flat(1);
          for (const ring of rings) {
            if (ring.length < 3) continue;
            lines.push(ringToLine(ring, R + 0.012));
          }
        }
        setBorders(lines);
      })
      .catch(() => {});
  }, []);

  return (
    <group>
      <Starfield />

      {/* Dark matte sphere — no texture, pure graphic */}
      <mesh>
        <sphereGeometry args={[R, 64, 64]} />
        <meshStandardMaterial
          color="#0a0a0c"
          roughness={0.85}
          metalness={0.08}
        />
      </mesh>

      {/* Country borders */}
      {borders.map((pts, i) => (
        <BorderLine key={i} pts={pts} />
      ))}
    </group>
  );
}

function BorderLine({ pts }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    return g;
  }, [pts]);

  return (
    <>
      {/* Primary white border */}
      <line>
        <primitive object={geo} attach="geometry" />
        <lineBasicMaterial color="#e8e8f0" transparent opacity={0.75} depthWrite={false} />
      </line>
      {/* Additive glow pass — same geometry, bright additive overlay */}
      <line>
        <primitive object={geo} attach="geometry" />
        <lineBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.22}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </line>
    </>
  );
}

function Starfield() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 2500;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 50 + Math.random() * 20;
      pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = r * Math.cos(phi);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#ffffff" size={0.042} sizeAttenuation transparent opacity={0.55} />
    </points>
  );
}
