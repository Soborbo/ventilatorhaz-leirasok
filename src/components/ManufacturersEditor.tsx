import { useState, useEffect } from 'react';

interface Gyarto {
  nev: string;
  orszag: string;
  alapitas: number | null;
  leiras: string;
  erossegek: string[];
  gyengesegek: string[];
  hangsulyos_temak: string[];
  kerulendo: string[];
  specialis_technologia: string | null;
  tudta_facts: string[];
}

interface GyartokData {
  gyartok: Record<string, Gyarto>;
}

export default function ManufacturersEditor() {
  const [data, setData] = useState<GyartokData | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [viewMode, setViewMode] = useState<'json' | 'visual'>('visual');
  const [expandedGyarto, setExpandedGyarto] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('ventilatorhaz_gyartok');
    if (stored) {
      setData(JSON.parse(stored));
      setJsonText(JSON.stringify(JSON.parse(stored), null, 2));
    } else {
      import('../data/gyartok.json').then(module => {
        const d = module.default as GyartokData;
        setData(d);
        setJsonText(JSON.stringify(d, null, 2));
      });
    }
  }, []);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setData(parsed);
      localStorage.setItem('ventilatorhaz_gyartok', jsonText);
      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError('Hibás JSON formátum: ' + (e as Error).message);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('ventilatorhaz_gyartok');
    import('../data/gyartok.json').then(module => {
      const d = module.default as GyartokData;
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
    a.download = 'gyartok.json';
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

  const updateGyarto = (gyartoKey: string, field: string, value: any) => {
    if (!data) return;
    const newData = JSON.parse(JSON.stringify(data));
    newData.gyartok[gyartoKey][field] = value;
    setData(newData);
    setJsonText(JSON.stringify(newData, null, 2));
  };

  const updateArrayField = (gyartoKey: string, field: string, index: number, value: string) => {
    if (!data) return;
    const newData = JSON.parse(JSON.stringify(data));
    newData.gyartok[gyartoKey][field][index] = value;
    setData(newData);
    setJsonText(JSON.stringify(newData, null, 2));
  };

  const addArrayItem = (gyartoKey: string, field: string) => {
    if (!data) return;
    const newData = JSON.parse(JSON.stringify(data));
    if (!newData.gyartok[gyartoKey][field]) {
      newData.gyartok[gyartoKey][field] = [];
    }
    newData.gyartok[gyartoKey][field].push('');
    setData(newData);
    setJsonText(JSON.stringify(newData, null, 2));
  };

  const removeArrayItem = (gyartoKey: string, field: string, index: number) => {
    if (!data) return;
    const newData = JSON.parse(JSON.stringify(data));
    newData.gyartok[gyartoKey][field].splice(index, 1);
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

  const gyartok = data.gyartok;

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
          {Object.entries(gyartok).map(([key, gyarto]: [string, any]) => (
            <div key={key} className="card">
              <div
                className="card-header"
                style={{ cursor: 'pointer' }}
                onClick={() => setExpandedGyarto(expandedGyarto === key ? null : key)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{gyarto.nev}</h3>
                  <span className="badge badge-success">{gyarto.orszag}</span>
                  {gyarto.alapitas && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Alapítva: {gyarto.alapitas}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '1.25rem' }}>
                  {expandedGyarto === key ? '▼' : '▶'}
                </span>
              </div>

              {expandedGyarto === key && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', paddingTop: 'var(--space-md)' }}>
                  {/* Alap adatok */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Név</label>
                      <input
                        type="text"
                        className="form-input"
                        value={gyarto.nev}
                        onChange={(e) => updateGyarto(key, 'nev', e.target.value)}
                        style={{ fontSize: '0.875rem' }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Ország</label>
                      <input
                        type="text"
                        className="form-input"
                        value={gyarto.orszag}
                        onChange={(e) => updateGyarto(key, 'orszag', e.target.value)}
                        style={{ fontSize: '0.875rem' }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Alapítás éve</label>
                      <input
                        type="number"
                        className="form-input"
                        value={gyarto.alapitas || ''}
                        onChange={(e) => updateGyarto(key, 'alapitas', e.target.value ? parseInt(e.target.value) : null)}
                        style={{ fontSize: '0.875rem' }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Leírás</label>
                    <textarea
                      className="form-textarea"
                      value={gyarto.leiras}
                      onChange={(e) => updateGyarto(key, 'leiras', e.target.value)}
                      style={{ fontSize: '0.875rem', minHeight: '60px' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Speciális technológia</label>
                    <input
                      type="text"
                      className="form-input"
                      value={gyarto.specialis_technologia || ''}
                      onChange={(e) => updateGyarto(key, 'specialis_technologia', e.target.value || null)}
                      style={{ fontSize: '0.875rem' }}
                    />
                  </div>

                  {/* Array mezők */}
                  {[
                    { field: 'erossegek', label: 'Erősségek', color: 'var(--color-success)' },
                    { field: 'gyengesegek', label: 'Gyengeségek', color: 'var(--color-warning)' },
                    { field: 'hangsulyos_temak', label: 'Hangsúlyos témák', color: 'var(--color-primary)' },
                    { field: 'kerulendo', label: 'Kerülendő', color: 'var(--color-error)' },
                    { field: 'tudta_facts', label: 'Tudta? tények', color: 'var(--color-text-muted)' }
                  ].map(({ field, label, color }) => (
                    <div key={field} style={{
                      background: 'var(--color-bg-tertiary)',
                      padding: 'var(--space-md)',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: `3px solid ${color}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                        <label className="form-label" style={{ fontSize: '0.7rem', margin: 0, color }}>{label}</label>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                          onClick={() => addArrayItem(key, field)}
                        >
                          + Hozzáad
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                        {(gyarto[field] || []).map((item: string, index: number) => (
                          <div key={index} style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                            <input
                              type="text"
                              className="form-input"
                              value={item}
                              onChange={(e) => updateArrayField(key, field, index, e.target.value)}
                              style={{ fontSize: '0.8rem', flex: 1 }}
                            />
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--color-error)' }}
                              onClick={() => removeArrayItem(key, field, index)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        {(!gyarto[field] || gyarto[field].length === 0) && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                            Nincs elem
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
