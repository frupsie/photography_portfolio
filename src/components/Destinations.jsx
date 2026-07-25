import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cities } from '../data/cities';
import { thumbSrc } from '../utils/thumb';

// ─── Group cities by country ──────────────────────────────────────────────────
function groupByCountry(cityList) {
  const map = {};
  cityList.forEach(city => {
    if (!map[city.country]) {
      map[city.country] = {
        country:   city.country,
        cities:    [],
        heroImage: null,
      };
    }
    map[city.country].cities.push(city);
    // First real hero image wins
    if (
      !map[city.country].heroImage &&
      city.heroImage &&
      !city.heroImage.includes('placeholder')
    ) {
      map[city.country].heroImage = city.heroImage;
    }
  });
  return Object.values(map);
}

// ─── Section ──────────────────────────────────────────────────────────────────
export default function Destinations() {
  const navigate = useNavigate();
  const groups   = useMemo(() => groupByCountry(cities), []);

  return (
    <section className="destinations">
      <div className="destinations__header">
        <h2 className="destinations__heading">Destinations</h2>
        <p className="destinations__sub">
          {cities.length} cities · {groups.length} countries
        </p>
      </div>

      <div className="destinations__grid">
        {groups.map((group, i) => (
          <DestCard
            key={group.country}
            group={group}
            index={i}
            onNavigate={navigate}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Country card ─────────────────────────────────────────────────────────────
function DestCard({ group, index, onNavigate }) {
  const cityCount = group.cities.length;

  return (
    <motion.div
      className="dest-card"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94], delay: index * 0.08 }}
      onClick={() => onNavigate('/gallery', { state: { country: group.country } })}
    >
      {/* Hero image */}
      <div className="dest-card__photo">
        {group.heroImage ? (
          <img src={thumbSrc(group.heroImage)} alt={group.country} loading="lazy" decoding="async" />
        ) : (
          <div className="dest-card__placeholder" />
        )}
      </div>

      {/* Gradient overlay */}
      <div className="dest-card__overlay" />

      {/* Text + arrow */}
      <div className="dest-card__content">
        <div>
          <p className="dest-card__meta">
            {cityCount} {cityCount === 1 ? 'city' : 'cities'}
          </p>
          <h3 className="dest-card__name">{group.country}</h3>
          {/* City name pills */}
          <ul className="dest-card__cities">
            {group.cities.map(c => (
              <li key={c.slug} className="dest-card__city-pill">{c.name}</li>
            ))}
          </ul>
        </div>
        <span className="dest-card__arrow">→</span>
      </div>
    </motion.div>
  );
}
