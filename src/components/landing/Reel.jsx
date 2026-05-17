/**
 * Reel — the cinematic 4-act scroll experience.
 * Mounts at the root of the landing page after the intro screen.
 *
 * Each act is a self-contained component that owns its own ScrollTrigger.
 * The Reel itself just lays them out vertically and renders a small outro
 * link to /featured beneath the four acts.
 */
import Act1Viewfinder  from './Act1Viewfinder';
import Act2Journey     from './Act2Journey';
import Act3Work        from './Act3Work';
import Act4Destination from './Act4Destination';
import { Link } from 'react-router-dom';

export default function Reel() {
  return (
    <main className="reel">
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
      </section>
    </main>
  );
}
