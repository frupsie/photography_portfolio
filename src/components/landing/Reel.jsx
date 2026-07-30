/**
 * Reel — the cinematic 4-act scroll experience.
 * Mounts at the root of the landing page after the intro screen.
 *
 * Each act is a self-contained component that owns its own ScrollTrigger.
 * The Reel itself just lays them out vertically; Act 4's CTA tiles are the
 * closer, so there's nothing beneath them.
 */
import Act1Viewfinder  from './Act1Viewfinder';
import Act2Journey     from './Act2Journey';
import Act3Work        from './Act3Work';
import Act4Destination from './Act4Destination';

export default function Reel() {
  return (
    <main className="reel">
      <Act1Viewfinder />
      <Act2Journey />
      <Act3Work />
      <Act4Destination />
    </main>
  );
}
