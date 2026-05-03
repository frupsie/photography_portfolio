import { Html } from '@react-three/drei';
import { ll2xyz, R } from './EarthMesh';
import { useGlobeStore } from '../../store/globeStore';

const LABEL_R = R + 0.35; // float just outside the surface

export default function CityLabel({ city }) {
  const pos = ll2xyz(city.lat, city.lon, LABEL_R);
  const { hoveredCity, selectedCity, setHoveredCity, scheduleHoverClear, isAnimating, selectCity } =
    useGlobeStore();
  const isAct =
    hoveredCity?.slug === city.slug || selectedCity?.slug === city.slug;

  return (
    <Html
      position={pos}
      center
      distanceFactor={6}
      occlude={false}
      zIndexRange={[5, 50]}
      style={{ pointerEvents: 'none' }}
    >
      <div
        className={`city-label-arc${isAct ? ' city-label-arc--active' : ''}`}
        style={{ pointerEvents: 'none' }}
      >
        {city.name}
      </div>
    </Html>
  );
}
