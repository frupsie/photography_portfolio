import { motion } from 'framer-motion';

const gear = [
  {
    category: 'Camera Body',
    items: [
      { name: 'Your Camera Body', note: 'Replace with your actual gear' },
    ],
  },
  {
    category: 'Lenses',
    items: [
      { name: 'Your Lenses', note: 'Replace with your actual lenses' },
    ],
  },
  {
    category: 'Accessories',
    items: [
      { name: 'Your Accessories', note: 'Replace with your accessories' },
    ],
  },
  {
    category: 'Post-Processing',
    items: [
      { name: 'Adobe Lightroom', note: 'Primary editing and cataloguing' },
      { name: 'Adobe Photoshop', note: 'Compositing and retouching' },
    ],
  },
];

export default function GearPage() {
  return (
    <motion.div
      className="content-page"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="content-page__inner">
        <span className="content-page__label">Tools of the trade</span>
        <h1 className="content-page__title">Gear & Process</h1>
        <p className="content-page__sub">
          The equipment and workflow behind every image.
        </p>

        <div className="gear-grid">
          {gear.map(({ category, items }, i) => (
            <motion.div
              key={category}
              className="gear-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <h3 className="gear-card__category">{category}</h3>
              <ul className="gear-card__list">
                {items.map(({ name, note }) => (
                  <li key={name} className="gear-card__item">
                    <span className="gear-card__name">{name}</span>
                    {note && <span className="gear-card__note">{note}</span>}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="process-section">
          <h2 className="process-section__title">Workflow</h2>
          <div className="process-steps">
            {['Shoot RAW', 'Cull in Lightroom', 'Edit & Grade', 'Export'].map(
              (step, i) => (
                <div key={step} className="process-step">
                  <span className="process-step__num">{i + 1}</span>
                  <span className="process-step__label">{step}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
