/**
 * Reel — the cinematic 4-act scroll experience.
 * Mounts at the root of the landing page after the intro screen.
 *
 * Each act is a self-contained component that owns its own ScrollTrigger.
 * The Reel itself just lays them out vertically and provides:
 *   - the `M` keyboard shortcut to toggle HUD opacity mode
 *   - persistence of that toggle via localStorage
 *   - a small outro link to /featured beneath the four acts
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Act1Viewfinder  from './Act1Viewfinder';
import Act2Journey     from './Act2Journey';
import Act3Work        from './Act3Work';
import Act4Destination from './Act4Destination';

const HUD_KEY = 'reel_hud_mode'; // 'subtle' | 'full'

export default function Reel() {
  const [hudMode, setHudMode] = useState(() =>
    localStorage.getItem(HUD_KEY) === 'full' ? 'full' : 'subtle'
  );

  // `M` toggles HUD mode globally
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'm' || e.key === 'M') {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        setHudMode((m) => {
          const next = m === 'full' ? 'subtle' : 'full';
          localStorage.setItem(HUD_KEY, next);
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <main className={`reel reel--hud-${hudMode}`}>
      <Act1Viewfinder />
      <Act2Journey />
      <Act3Work />
      <Act4Destination />

      {/* Outro: tiny link to the moved Destinations / Featured Carousel page */}
      <section className="reel__outro">
        <Link to="/featured" className="reel__outro-link">
          <span>Featured Reel</span>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor"
               strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10h12M11 5l5 5-5 5" />
          </svg>
        </Link>
        <p className="reel__outro-hint">
          Press <kbd>M</kbd> to toggle camera HUD
        </p>
      </section>
    </main>
  );
}
