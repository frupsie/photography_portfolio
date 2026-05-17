/**
 * Act 4 — "The Destination"
 *
 * Three CTA tiles arranged horizontally. Acts as the navigational pay-off
 * after the cinematic sequence: visitors land on a clear choice of door.
 *
 * Scroll behaviour: the tiles slide up into place as the user enters the act,
 * and a brief "scale settle" finalises the composition.
 */
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TILES = [
  {
    to:    '/gallery',
    label: 'Gallery',
    sub:   'Every frame, every city',
    photo: '/photos-web/seoul/hero-web.jpg',
  },
  {
    to:    '/about',
    label: 'About',
    sub:   'The photographer & the kit',
    photo: '/photos-web/macau/hero-web.jpg',
  },
  {
    to:    '/contact',
    label: 'Contact',
    sub:   'Let’s make something',
    photo: '/photos-web/nikko/hero-web.jpg',
  },
];

export default function Act4Destination() {
  const sectionRef = useRef(null);
  const tileRefs   = useRef([]);
  const headRef    = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.set(tileRefs.current, { y: 60, opacity: 0 });
      gsap.set(headRef.current,  { opacity: 0, y: 20 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end:   'bottom bottom',
          scrub: 1,
        },
      });

      tl.to(headRef.current,  { opacity: 1, y: 0, duration: 0.15 }, 0.05)
        .to(tileRefs.current, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' }, 0.15);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="reel__act reel__act--4">
      <div className="reel__pin reel__pin--centred">
        <div ref={headRef} className="reel__act4-head">
          <span className="reel__act4-eyebrow">Step inside</span>
          <h2 className="reel__act4-heading">Where to next?</h2>
        </div>

        <div className="reel__tiles">
          {TILES.map((tile, i) => (
            <div
              key={tile.to}
              ref={(el) => (tileRefs.current[i] = el)}
              className="reel__tile-wrap"
            >
              <Link to={tile.to} className="cta-tile">
                <div
                  className="cta-tile__bg"
                  style={{ backgroundImage: `url(${tile.photo})` }}
                />
                <div className="cta-tile__shade" />
                <div className="cta-tile__body">
                  <span className="cta-tile__label">{tile.label}</span>
                  <span className="cta-tile__sub">{tile.sub}</span>
                  <svg className="cta-tile__arrow" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor"
                       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
