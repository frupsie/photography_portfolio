// ─── Act 3 photo pool (home page "The Frames") ───────────────────────────────
// NOTE: unrelated to the retired /featured page — this file is Act 3's source
// of photos and is very much in use. Don't remove it during a cleanup sweep.
// Curated pool. Act 3 picks 7 random entries per page load (wallpaper shuffle).
// Order does NOT matter — entries are shuffled at runtime.
// Grow this list freely as you take photos worth showing on the home page.
//
// To add a photo:
//   1. Make sure it exists at /public/photos-web/<city>/<file>.JPG (imported)
//   2. Append an entry below with photo / city / country / year
//
// photo: path relative to /public (same convention as heroImage in cities.js)
// ─────────────────────────────────────────────────────────────────────────────

export const featured = [
  { photo: '/photos-web/hong-kong/_MG_3601.JPG',  city: 'Hong Kong', country: 'China',       year: '2023' },
  { photo: '/photos-web/seoul/_MG_3836.JPG',       city: 'Seoul',     country: 'South Korea', year: '2024' },
  { photo: '/photos-web/hainan/IMG_9696.JPG',      city: 'Hainan',    country: 'China',       year: '2025' },
  { photo: '/photos-web/kyoto/IMG_0486.JPG',       city: 'Kyoto',     country: 'Japan',       year: '2025' },
  { photo: '/photos-web/macau/DSCF6879.JPG',       city: 'Macau',     country: 'China',       year: '2025' },
  { photo: '/photos-web/nikko/IMG_1474.JPG',       city: 'Nikko',     country: 'Japan',       year: '2025' },
  { photo: '/photos-web/hakone/IMG_1173.JPG',      city: 'Hakone',    country: 'Japan',       year: '2025' },
  { photo: '/photos-web/shenzhen/DSCF6768.jpg',    city: 'Shenzhen',  country: 'China',       year: '2025' },
  { photo: '/photos-web/guangzhou/IMG_5735.JPG',   city: 'Guangzhou', country: 'China',       year: '2025' },
];
