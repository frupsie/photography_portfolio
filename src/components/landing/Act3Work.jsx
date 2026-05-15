/**
 * Act 3 — "The Work"
 *
 * Plunges into a parallax photo gallery. 6 photos drift past on 3 layers,
 * each at a different scroll speed. Hovering a photo reveals its EXIF card
 * at full opacity (subtle by default to keep the recruiter view clean).
 *
 * Three layer speeds — foreground travels fastest, background slowest,
 * producing a 3D-feeling depth-of-field.
 */
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { featured } from '../../data/featured';
import ExifCard from './ExifCard';

gsap.registerPlugin(ScrollTrigger);

// Assign each photo a depth layer (0 = back, 2 = front).
// Spreading across layers keeps the parallax visually balanced.
const LAYERS = [1, 0, 2, 1, 0, 2];

// Pixel speed multipliers per layer. Higher = travels faster.
const SPEEDS = [0.35, 0.6, 1.0]; // back, mid, front

// Pre-computed positions so the 6 photos don't visually collide
// Each entry: { top, left } as percent strings. Tuned by eye.
const POSITIONS = [
  { top: '8%',  left: '4%'  },
  { top: '18%', left: '52%' },
  { top: '40%', left: '18%' },
  { top: '50%', left: '64%' },
  { top: '72%', left: '8%'  },
  { top: '80%', left: '58%' },
];

export default function Act3Work() {
  const sectionRef  = useRef(null);
  const photoRefs   = useRef([]);
  const headRef     = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end:   'bottom bottom',
          scrub: 1,
          invalidateOnRefresh: true,
        },
        defaults: { ease: 'none' },
      });

      // Heading fades in / out
      tl.fromTo(headRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.10 }, 0);
      tl.to(headRef.current, { opacity: 0, y: -10, duration: 0.15 }, 0.82);

      // Each photo drifts upward. fromTo guarantees a fixed range regardless
      // of GSAP's internal state. All photos share the same scroll window so
      // they're "in the air" together — depth-of-field via the layer scales.
      photoRefs.current.forEach((el, i) => {
        if (!el) return;
        const speed = SPEEDS[LAYERS[i]];
        tl.fromTo(el,
          { y: `${50 * speed}vh`, opacity: 0 },
          { y: `${-90 * speed}vh`, opacity: 1, duration: 1 }, 0);
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="reel__act reel__act--3">
      <div className="reel__pin">
        <div ref={headRef} className="reel__act3-head">
          <span className="reel__act3-eyebrow">Selected work</span>
          <h2 className="reel__act3-heading">The Frames</h2>
          <p className="reel__act3-hint">Hover any frame for camera details</p>
        </div>

        <div className="reel__parallax">
          {featured.map((item, i) => (
            <article
              key={item.photo}
              ref={(el) => (photoRefs.current[i] = el)}
              className={`reel__pframe reel__pframe--layer-${LAYERS[i]}`}
              style={POSITIONS[i]}
            >
              <div className="reel__pframe-photo">
                <img src={item.photo} alt={`${item.city}, ${item.country}`}
                     loading="lazy" draggable="false" />
              </div>
              <ExifCard photo={item.photo} compact className="reel__pframe-exif" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
