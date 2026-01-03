import { useState, useEffect } from 'react';

interface BenchmarkData {
  categories: Record<string, any>;
  ip_vedelem: Record<string, any>;
  csapagy_tipus: Record<string, any>;
}

export default function BenchmarkEditor() {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load from localStorage or fetch default
    const stored = localStorage.getItem('ventilatorhaz_benchmark');
    if (stored) {
      setData(JSON.parse(stored));
      setJsonText(JSON.stringify(JSON.parse(stored), null, 2));
    } else {
      // Fetch default data
      fetch('/api/benchmark')
        .then(res => res.json())
        .then(d => {
          setData(d);
          setJsonText(JSON.stringify(d, null, 2));
        })
        .catch(() => {
          // Use inline default if fetch fails
          import('../data/benchmark.json').then(module => {
            const d = module.default as BenchmarkData;
            setData(d);
            setJsonText(JSON.stringify(d, null, 2));
          });
        });
    }
  }, []);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setData(parsed);
      localStorage.setItem('ventilatorhaz_benchmark', jsonText);
      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError('Hibás JSON formátum: ' + (e as Error).message);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('ventilatorhaz_benchmark');
    import('../data/benchmark.json').then(module => {
      const d = module.default as BenchmarkData;
      setData(d);
      setJsonText(JSON.stringify(d, null, 2));
      setError(null);
    });
  };

  const handleExport = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'benchmark.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        try {
          JSON.parse(text); // Validate
          setJsonText(text);
          setError(null);
        } catch (err) {
          setError('Hibás JSON fájl');
        }
      };
      reader.readAsText(file);
    }
  };

  if (!data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2xl)' }}>
        <span className="spinner" style={{ width: 40, height: 40 }}></span>
      </div>
    );
  }

  return (
    <div>
      {/* Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
        <button className="btn btn-success" onClick={handleSave}>
          {saved ? '✓ Mentve!' : '💾 Mentés'}
        </button>
        <button className="btn btn-secondary" onClick={handleReset}>
          🔄 Alapértelmezett visszaállítás
        </button>
        <button className="btn btn-secondary" onClick={handleExport}>
          📥 Exportálás
        </button>
        <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
          📤 Importálás
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {error && (
        <div style={{
          padding: 'var(--space-md)',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-error)',
          marginBottom: 'var(--space-lg)',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      {/* JSON Editor */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0, fontSize: '1rem' }}>JSON Szerkesztő</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Közvetlen szerkesztés
          </span>
        </div>
        <textarea
          className="form-textarea"
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            minHeight: '500px',
            lineHeight: 1.5
          }}
          spellCheck={false}
        />
      </div>

      {/* Quick reference */}
      <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
        <h3 style={{ margin: '0 0 var(--space-md)', fontSize: '1rem' }}>Struktúra referencia</h3>
        <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
          <p><strong>categories.</strong>[kategoria_id]</p>
          <ul style={{ margin: 'var(--space-xs) 0', paddingLeft: 'var(--space-lg)' }}>
            <li>name: "Megjelenítendő név"</li>
            <li>zajszint_db: {'{'}ultra_halk, halk, atlagos, zajos{'}'}</li>
            <li>zajszint_atlag: szám (dB)</li>
            <li>legszallitas_m3h: {'{'}alacsony, kozepes, magas, nagyon_magas{'}'}</li>
            <li>teljesitmeny_w: {'{'}takarekos, atlagos, magas{'}'}</li>
            <li>ar_ft: {'{'}belepo, kozep, premium, luxus{'}'}</li>
          </ul>
          <p style={{ marginTop: 'var(--space-md)' }}><strong>ip_vedelem.</strong>[IP_kod]</p>
          <ul style={{ margin: 'var(--space-xs) 0', paddingLeft: 'var(--space-lg)' }}>
            <li>jelentes: "Mit jelent"</li>
            <li>hasznalhato: "Hol használható"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
