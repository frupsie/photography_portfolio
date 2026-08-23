// ─── Homepage favourites pool ────────────────────────────────────────────────
// Source for the homepage's horizontal frame strip ("Nine favourites from N
// photographs"). Every entry here appears; the strip is not shuffled or
// sampled, so this list is the running order.
//
// Curated by hand. Add a photograph only when it earns a place; the strip
// grows with the list, and its length sets how long the pinned pan holds the
// reader.
//
// To add a photo:
//   1. Make sure it exists at /public/photos-web/<city>/<file>.JPG (imported)
//   2. Append an entry below with photo / city / country / year
//
// photo: path relative to /public (same convention as heroImage in cities.js)
// city:  must match a `name` in cities.js; the link target is derived from it
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
