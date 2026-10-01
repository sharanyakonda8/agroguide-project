import { useState } from 'react';
import cropProfiles from './data/crops';

const FIELD_META = [
  { key: 'nitrogen', label: 'Nitrogen', unit: 'kg/ha', description: 'Plant leaf & stem growth' },
  { key: 'phosphorus', label: 'Phosphorus', unit: 'kg/ha', description: 'Roots & early development' },
  { key: 'potassium', label: 'Potassium', unit: 'kg/ha', description: 'Strength & disease resilience' },
  { key: 'ph', label: 'Soil pH', unit: 'pH', description: 'Nutrient availability' },
  { key: 'temp', label: 'Temperature', unit: '°C', description: 'Average growing temperature' },
  { key: 'humidity', label: 'Humidity', unit: '%', description: 'Relative humidity' },
  { key: 'rainfall', label: 'Rainfall', unit: 'mm', description: 'Seasonal rainfall' },
];

const sampleProfiles = {
  'Paddy lowland': {
    nitrogen: 86,
    phosphorus: 32,
    potassium: 160,
    ph: 6.1,
    temp: 28,
    humidity: 81,
    rainfall: 1750,
  },
  'Cotton belt': {
    nitrogen: 74,
    phosphorus: 26,
    potassium: 180,
    ph: 6.4,
    temp: 26,
    humidity: 54,
    rainfall: 760,
  },
  'Hilly coffee': {
    nitrogen: 94,
    phosphorus: 24,
    potassium: 150,
    ph: 5.6,
    temp: 21,
    humidity: 82,
    rainfall: 1450,
  },
  'Alluvial wheat': {
    nitrogen: 98,
    phosphorus: 34,
    potassium: 170,
    ph: 6.6,
    temp: 18,
    humidity: 59,
    rainfall: 680,
  },
};

const defaultField = {
  nitrogen: 92,
  phosphorus: 28,
  potassium: 165,
  ph: 6.3,
  temp: 24,
  humidity: 68,
  rainfall: 1050,
};

const toPercent = (value) => Math.round(value * 100);

const valueFit = (actual, { min, max }) => {
  if (!Number.isFinite(actual)) return 0;
  if (actual >= min && actual <= max) return 1;

  const nearest = Math.min(Math.abs(actual - min), Math.abs(actual - max));
  const spread = Math.max(max - min, 1);
  return Math.max(0, 1 - nearest / spread);
};

const calculateRecommendations = (field) => {
  const ranked = cropProfiles
    .map((crop) => {
      const scoreParts = FIELD_META.map(({ key }) => {
        const stat = crop[key];
        if (!stat || !stat.min || !stat.max) return 0;
        return valueFit(field[key], stat);
      });

      const average = scoreParts.reduce((sum, item) => sum + item, 0) / scoreParts.length;

      return {
        ...crop,
        score: average,
        breakdown: FIELD_META.map(({ key }) => ({
          key,
          match: valueFit(field[key], crop[key]),
          label: key,
        })),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return ranked.map((item) => ({
    ...item,
    scorePercent: toPercent(item.score),
  }));
};

function App() {
  const [field, setField] = useState(defaultField);
  const [results, setResults] = useState(() => calculateRecommendations(defaultField));

  const updateField = (key, value) => {
    setField((current) => ({
      ...current,
      [key]: Number(value),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setResults(calculateRecommendations(field));
  };

  const loadPreset = (presetName) => {
    const preset = sampleProfiles[presetName];
    if (!preset) return;
    setField(preset);
    setResults(calculateRecommendations(preset));
  };

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">✦</div>
          <div>
            <p className="brand-title">AgroGuide</p>
            <p className="brand-subtitle">Smart crop system</p>
          </div>
        </div>
        <div className="status-pill">Local engine active</div>
      </header>

      <main className="content-wrap">
        <section className="hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">Field intelligence, simplified</p>
            <h1>Grow what your soil is ready for.</h1>
            <p className="hero-text">
              Turn a soil test or seven simple measurements into clear, explainable crop recommendations for your next growing season.
            </p>
          </div>

          <div className="stats-row">
            <div className="stat-item"><strong>7</strong> field signals</div>
            <div className="stat-item"><strong>22</strong> crop profiles</div>
            <div className="stat-item"><strong>Top 5</strong> matches</div>
          </div>
        </section>

        <section className="form-layout">
          <div className="panel input-panel">
            <div className="panel-header">
              <div>
                <p className="micro-label">01 / Build your field profile</p>
                <h2>What do you have on hand?</h2>
              </div>
            </div>

            <p className="helper-text">
              Use a report image for a head start, or enter the readings directly. You will review every value before we calculate.
            </p>

            <div className="tabs" aria-label="Field profile mode">
              <button type="button" className="tab active">Manual input</button>
              <button type="button" className="tab">Upload report</button>
            </div>

            <form onSubmit={handleSubmit} className="field-form">
              <div className="form-title-row">
                <h3>Soil + environment</h3>
              </div>

              <div className="field-grid">
                {FIELD_META.map(({ key, label, unit, description }) => (
                  <label className="field-row" key={key}>
                    <div className="field-header">
                      <span className="field-name">{label}</span>
                      <span className="field-unit">{unit}</span>
                    </div>
                    <input
                      type="number"
                      aria-label={`${label} ${unit}`}
                      value={field[key]}
                      onChange={(event) => updateField(key, event.target.value)}
                    />
                    <small>{description}</small>
                  </label>
                ))}
              </div>

              <div className="submit-row">
                <span className="check-badge">Values are checked before processing</span>
                <button type="submit" className="primary-button">Get crop recommendations</button>
              </div>
            </form>
          </div>

          <aside className="panel side-panel">
            <div className="sidebar-card">
              <div className="sidebar-header">
                <span className="mini-icon">⚑</span>
                <h3>Try a field profile</h3>
              </div>
              <p>Load a realistic starting point to explore the engine, then adjust any reading.</p>
              <div className="preset-list">
                {Object.keys(sampleProfiles).map((name) => (
                  <button type="button" key={name} className="preset-card" onClick={() => loadPreset(name)}>
                    <span className="preset-title">{name}</span>
                    <span className="preset-tag">{name === 'Paddy lowland' ? 'Warm, wet soil' : name === 'Cotton belt' ? 'Sunny & moderate rain' : name === 'Hilly coffee' ? 'Acidic, humid slopes' : 'Balanced fertile soil'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="sidebar-card explain-card">
              <div className="sidebar-header">
                <span className="mini-icon">✦</span>
                <h3>How the match works</h3>
              </div>
              <p>
                A normalized range-fit score compares all seven readings with each crop’s preferred conditions. No black box, and no invented report values.
              </p>
              <div className="dataset-tag">Local sample dataset · 22 profiles</div>
            </div>
          </aside>
        </section>

        <section className="results-panel">
          <div className="results-header">
            <div>
              <p className="micro-label">Recommendation engine</p>
              <h3>Top crop matches</h3>
            </div>
            <button type="button" className="link-button" onClick={() => setResults(calculateRecommendations(field))}>Refresh</button>
          </div>

          <div className="match-grid">
            {results.map((crop, index) => (
              <article className="match-card" key={crop.id}>
                <div className="match-rank">#{index + 1}</div>
                <div className="match-topline">
                  <div>
                    <h4>{crop.name}</h4>
                    <p>{crop.region}</p>
                  </div>
                  <span className="match-score">{crop.scorePercent}%</span>
                </div>
                <p className="match-description">{crop.description}</p>
                <div className="match-breakdown">
                  {FIELD_META.map(({ key, label }) => (
                    <div key={key} className="mini-stat">
                      <span className="mini-key">{label}</span>
                      <span className="mini-value">{crop.breakdown.find((item) => item.key === key)?.match.toFixed(2) ?? '0.00'}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
