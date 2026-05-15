/**
 * photo-meta.js — hand-curated EXIF fallback.
 * Used when a photo's EXIF was stripped on export. Real EXIF wins where present.
 * Keyed by photo path (must match the path used in <img src=...>).
 *
 * Values are pre-formatted strings to keep display components simple.
 * Edit/extend this as you publish more photos.
 */
export const photoMeta = {
  '/photos/hong-kong/hero-web.jpg': {
    camera: 'Canon EOS RP',
    lens: 'Sigma 24–105mm f/4 DG OS HSM Art',
    shutter: '1/500',
    aperture: 'f/4',
    iso: 'ISO 400',
    focal: '35mm',
    location: 'Hong Kong',
    date: '08 Dec 2024',
  },
  '/photos/seoul/hero-web.jpg': {
    camera: 'Canon EOS RP',
    lens: 'Sigma 24–105mm f/4 DG OS HSM Art',
    shutter: '1/250',
    aperture: 'f/4',
    iso: 'ISO 800',
    focal: '50mm',
    location: 'Seoul, South Korea',
    date: '22 Oct 2024',
  },
  '/photos/kyoto/hero-web.jpg': {
    camera: 'Canon EOS RP',
    lens: 'Canon RF 50mm f/1.8 STM',
    shutter: '1/320',
    aperture: 'f/2.8',
    iso: 'ISO 200',
    focal: '50mm',
    location: 'Kyoto, Japan',
    date: '14 Apr 2025',
  },
  '/photos/macau/hero-web.jpg': {
    camera: 'Canon EOS RP',
    lens: 'Sigma 24–105mm f/4 DG OS HSM Art',
    shutter: '1/160',
    aperture: 'f/5.6',
    iso: 'ISO 400',
    focal: '70mm',
    location: 'Macau',
    date: '03 Feb 2025',
  },
  '/photos/nikko/hero-web.jpg': {
    camera: 'Fujifilm X-T30 II',
    lens: 'Fujifilm XF 23mm f/2 R WR',
    shutter: '1/200',
    aperture: 'f/4',
    iso: 'ISO 320',
    focal: '23mm',
    location: 'Nikko, Japan',
    date: '18 Apr 2025',
  },
  '/photos/guangzhou/hero-web.jpg': {
    camera: 'Canon EOS RP',
    lens: 'Sigma 24–105mm f/4 DG OS HSM Art',
    shutter: '1/400',
    aperture: 'f/4',
    iso: 'ISO 500',
    focal: '85mm',
    location: 'Guangzhou, China',
    date: '21 May 2025',
  },
  '/photos/hainan/hero-web.jpg': {
    camera: 'Canon EOS RP',
    lens: 'Sigma 24–105mm f/4 DG OS HSM Art',
    shutter: '1/800',
    aperture: 'f/5.6',
    iso: 'ISO 200',
    focal: '24mm',
    location: 'Hainan, China',
    date: '11 Jun 2025',
  },
  '/photos/shenzhen/hero-web.jpg': {
    camera: 'Canon EOS RP',
    lens: 'Sigma 24–105mm f/4 DG OS HSM Art',
    shutter: '1/250',
    aperture: 'f/4',
    iso: 'ISO 640',
    focal: '40mm',
    location: 'Shenzhen, China',
    date: '09 May 2025',
  },
};
