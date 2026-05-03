import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Html } from '@react-three/drei';
import { ll2xyz, R } from './Globe/EarthMesh';
import { useGlobeStore } from '../store/globeStore';

const CARD_R = R + 0.42;

export default function FloatingCard({ city }) {
  const navigate = useNavigate();
  const { setHoveredCity, scheduleHoverClear } = useGlobeStore();

  const pos = ll2xyz(city.lat, city.lon, CARD_R);

  return (
    <Html position={pos} center zIndexRange={[200, 300]} distanceFactor={5}>
      <motion.div
        className="floating-card"
        initial={{ opacity: 0, scale: 0.85, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ type: 'spring', stiffness: 340, damping: 24 }}
        onMouseEnter={() => setHoveredCity(city)}
        onMouseLeave={() => scheduleHoverClear()}
      >
        <div
          className="floating-card__hero"
          style={{ backgroundImage: `url(${city.heroImage})` }}
        />
        <div className="floating-card__body">
          <h3 className="floating-card__name">{city.name}</h3>
          <p className="floating-card__country">{city.country}</p>
          <button
            className="floating-card__btn"
            onClick={(e) => { e.stopPropagation(); navigate(`/city/${city.slug}`); }}
          >
            Explore →
          </button>
        </div>
      </motion.div>
    </Html>
  );
}
