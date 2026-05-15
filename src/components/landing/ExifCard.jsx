/**
 * ExifCard — Canon-EVF-styled metadata card.
 * Subtle by default (--exif-opacity controls parent fade), brightens on hover.
 *
 * Renders nothing if neither real EXIF nor fallback data exists.
 */
import { useExif } from '../../hooks/useExif';

export default function ExifCard({ photo, compact = false, className = '' }) {
  const exif = useExif(photo);
  if (!exif) return null;

  const { camera, lens, shutter, aperture, iso, focal, location, date } = exif;
  const trio = [shutter, aperture, iso].filter(Boolean).join(' · ');

  return (
    <div className={`exif-card${compact ? ' exif-card--compact' : ''} ${className}`}>
      <div className="exif-card__row">
        <span className="exif-card__label">CAM</span>
        <span className="exif-card__val">{camera ?? '—'}</span>
      </div>
      {lens && (
        <div className="exif-card__row">
          <span className="exif-card__label">LNS</span>
          <span className="exif-card__val">{lens}</span>
        </div>
      )}
      <div className="exif-card__row exif-card__row--mono">
        <span className="exif-card__label">EXP</span>
        <span className="exif-card__val">
          {trio || '—'}{focal ? ` · ${focal}` : ''}
        </span>
      </div>
      {(location || date) && (
        <div className="exif-card__row exif-card__row--muted">
          {location && <span className="exif-card__loc">◉ {location}</span>}
          {date && <span className="exif-card__date">{date}</span>}
        </div>
      )}
    </div>
  );
}
