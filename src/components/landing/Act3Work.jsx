/**
 * Act 3 - "The Frames" - Cinematic Flow
 *
 * Each frame fades in from below, drifts continuously upward as you scroll
 * (scroll-linked / scrubbed), then fades out as the next arrives. Only 1-2
 * frames share the screen at any moment, so frames can be large and never
 * overlap, while the constant scroll-linked drift keeps it immersive -
 * like a film sequence of photographs.
 *
 * Each frame has its own scrubbed timeline spanning its slice of the
 * 450vh section. Windows overlap ~30% so transitions show 2 frames briefly,
 * always in opposite vertical zones (one leaving the top, one entering the
 * bottom) at different horizontal positions - no collisions.
 */
import { useEffect, useRef, useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { featured as frames } from '../../data/featured';
import ExifCard from './ExifCard';
import PhotoLightbox from './PhotoLightbox';

gsap.registerPlugin(ScrollTrigger);

// Anchor positions — alternating left / right / centre so consecutive
// frames (the only pairs that ever coexist) are at different horizontal
// positions. Sized generously so future cities don't need manual updates.
const POSITIONS = [
  { top: '34%', left: '10%' },
  { top: '30%', left: '48%' },
  { top: '40%', left: '26%' },
  { top: '28%', left: '50%' },
  { top: '38%', left: '6%'  },
  { top: '32%', left: '44%' },
  { top: '42%', left: '20%' },
  { top: '30%', left: '50%' },
  { top: '36%', left: '28%' },
  { top: '34%', left: '46%' },
  { top: '40%', left: '12%' },
  { top: '30%', left: '36%' },
  { top: '38%', left: '52%' },
  { top: '42%', left: '18%' },
  { top: '32%', left: '42%' },
];

export default function Act3Work() {
  const sectionRef = useRef(null);
  const photoRefs  = useRef([]);
  const headRef    = useRef(null);
  const [lbIndex, setLbIndex] = useState(null);

  // Normalize frames for the lightbox
  const lbPhotos = useMemo(
    () => frames.map((f) => ({ src: f.photo, city: f.city, country: f.country })),
    []
  );

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      const N = photoRefs.current.length;

      // ONE master timeline tied to the section scroll. start 'top top' /
      // end 'bottom bottom' maps progress 0->1 onto exactly the pin's stuck
      // range, so every frame's window stays within the sticky stage.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end:   'bottom bottom',
          scrub: 1,
        },
      });

      // Heading: fades in at the very start, out before the first frame.
      tl.fromTo(headRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.03 }, 0);
      tl.to(headRef.current, { opacity: 0, y: -10, duration: 0.04 }, 0.07);

      // Each frame occupies a window [winStart, winStart+winLen] in the
      // normalized 0..1 timeline. Windows overlap (~30%) so transitions show
      // 2 frames briefly. The LAST frame holds at centre (no fade out) so it
      // stays clearly visible when the user reaches the bottom.
      // Every frame gets an EQUAL-length window. Windows are evenly stepped
      // so the first starts at 0 and the last ends exactly at 1.0 (= pin
      // release). Modest overlap so only a short crossfade, not constant churn.
      const winLen = 1.25 / N;
      const step   = (1 - winLen) / (N - 1);

      // Each window is split: fade-in (0–22%), HOLD at full opacity
      // (22–62%, picture is clearly readable), fade-out (62–100%).
      photoRefs.current.forEach((el, i) => {
        if (!el) return;
        const winStart = i * step;

        // Fade IN + scale + initial rise.
        tl.fromTo(el,
          { autoAlpha: 0, y: '12vh', scale: 0.95 },
          { autoAlpha: 1, y: '4vh', scale: 1.0, ease: 'sine.out', duration: winLen * 0.22 },
          winStart);

        // Continuous, gentle LINEAR drift through the rest of the window.
        tl.to(el, { y: '-12vh', ease: 'none', duration: winLen * 0.78 }, winStart + winLen * 0.22);

        // Fade OUT only over the back 38% — leaving a clear ~40% HOLD at full
        // opacity in the middle where the photo is fully visible & still.
        tl.to(el, { autoAlpha: 0, ease: 'sine.in', duration: winLen * 0.38 }, winStart + winLen * 0.62);
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
          {frames.map((item, i) => (
            <article
              key={item.photo}
              ref={(el) => (photoRefs.current[i] = el)}
              className="reel__pframe"
              style={POSITIONS[i]}
              onClick={() => setLbIndex(i)}
            >
              <div className="reel__pframe-card">
                <div className="reel__pframe-photo">
                  <img src={item.photo} alt={`${item.city}, ${item.country}`}
                       loading="lazy" draggable="false" />
                </div>
                <ExifCard photo={item.photo} compact className="reel__pframe-exif" />
              </div>
            </article>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {lbIndex !== null && (
          <PhotoLightbox
            photos={lbPhotos}
            index={lbIndex}
            onClose={() => setLbIndex(null)}
            onPrev={() => setLbIndex((i) => (i - 1 + lbPhotos.length) % lbPhotos.length)}
            onNext={() => setLbIndex((i) => (i + 1) % lbPhotos.length)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
