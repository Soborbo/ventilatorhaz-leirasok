import { useState, useEffect } from 'react';

interface UspLibrary {
  usp_categories: Record<string, any>;
}

export default function UspEditor() {
  const [data, setData] = useState<UspLibrary | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [viewMode, setViewMode] = useState<'json' | 'visual'>('visual');

  useEffect(() => {
    const stored = localStorage.getItem('ventilatorhaz_usp');
    if (stored) {
      setData(JSON.parse(stored));
      setJsonText(JSON.stringify(JSON.parse(stored), null, 2));
    } else {
      import('../data/usp-library.json').then(module => {
        const d = module.default as UspLibrary;
        setData(d);
        setJsonText(JSON.stringify(d, null, 2));
      });
    }
  }, []);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setData(parsed);
      localStorage.setItem('ventilatorhaz_usp', jsonText);
      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError('Hibás JSON formátum: ' + (e as Error).message);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('ventilatorhaz_usp');
    import('../data/usp-library.json').then(module => {
      const d = module.default as UspLibrary;
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
    a.download = 'usp-library.json';
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
          const parsed = JSON.parse(text);
          setJsonText(JSON.stringify(parsed, null, 2));
          setData(parsed);
          setError(null);
        } catch (err) {
          setError('Hibás JSON fájl');
        }
      };
      reader.readAsText(file);
    }
  };

  const updateUsp = (categoryKey: string, uspIndex: number, field: string, value: string) => {
    if (!data) return;
    const newData = JSON.parse(JSON.stringify(data));
    newData.usp_categories[categoryKey].usps[uspIndex][field] = value;
    setData(newData);
    setJsonText(JSON.stringify(newData, null, 2));
  };

  if (!data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2xl)' }}>
        <span className="spinner" style={{ width: 40, height: 40 }}></span>
      </div>
    );
  }

  const categories = data.usp_categories;

  return (
    <div>
      {/* Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-success" onClick={handleSave}>
          {saved ? '✓ Mentve!' : '💾 Mentés'}
        </button>
        <button className="btn btn-secondary" onClick={handleReset}>
          🔄 Alapértelmezett
        </button>
        <button className="btn btn-secondary" onClick={handleExport}>
          📥 Exportálás
        </button>
        <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
          📤 Importálás
          <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        </label>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-xs)' }}>
          <button
            className={viewMode === 'visual' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setViewMode('visual')}
          >
            Vizuális
          </button>
          <button
            className={viewMode === 'json' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setViewMode('json')}
          >
            JSON
          </button>
        </div>
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

      {viewMode === 'json' ? (
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '1rem' }}>JSON Szerkesztő</h3>
          </div>
          <textarea
            className="form-textarea"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              minHeight: '600px',
              lineHeight: 1.5
            }}
            spellCheck={false}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {Object.entries(categories).map(([categoryKey, category]: [string, any]) => (
            <div key={categoryKey} className="card">
              <div className="card-header">
                <h3 style={{ margin: 0, fontSize: '1rem' }}>{category.name}</h3>
                <span className="badge badge-success">{category.usps.length} USP</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {category.usps.map((usp: any, index: number) => (
                  <div
                    key={usp.id}
                    style={{
                      background: 'var(--color-bg-tertiary)',
                      padding: 'var(--space-md)',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: '3px solid var(--color-primary)'
                    }}
                  >
                    <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
                      <code style={{
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        background: 'var(--color-bg)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-text-muted)'
                      }}>
                        {usp.id}
                      </code>
                      <code style={{
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        background: 'var(--color-bg)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-warning)'
                      }}>
                        {usp.condition.field} {usp.condition.operator} {JSON.stringify(usp.condition.value)}
                      </code>
                    </div>

                    <div className="form-group" style={{ marginBottom: 'var(--space-sm)' }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Cím</label>
                      <input
                        type="text"
                        className="form-input"
                        value={usp.title}
                        onChange={(e) => updateUsp(categoryKey, index, 'title', e.target.value)}
                        style={{ fontSize: '0.875rem' }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 'var(--space-sm)' }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>1. bekezdés</label>
                      <textarea
                        className="form-textarea"
                        value={usp.paragraph_1}
                        onChange={(e) => updateUsp(categoryKey, index, 'paragraph_1', e.target.value)}
                        style={{ fontSize: '0.875rem', minHeight: '60px' }}
                      />
                    </div>

                    {usp.paragraph_2 !== undefined && (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>2. bekezdés</label>
                        <textarea
                          className="form-textarea"
                          value={usp.paragraph_2 || ''}
                          onChange={(e) => updateUsp(categoryKey, index, 'paragraph_2', e.target.value)}
                          style={{ fontSize: '0.875rem', minHeight: '60px' }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
