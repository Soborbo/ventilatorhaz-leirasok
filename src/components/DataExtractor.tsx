import { useState } from 'react';
import type { ExtractedData, ProductData, DataStatus } from '../lib/types';

const CATEGORIES = [
  { value: 'furdoszoba_axialis', label: 'Fürdőszoba (axiális)' },
  { value: 'furdoszoba_radialis', label: 'Fürdőszoba (radiális)' },
  { value: 'csoventilator', label: 'Csőventilátor' },
  { value: 'ipari', label: 'Ipari ventilátor' },
  { value: 'hovisszanyero', label: 'Hővisszanyerő' },
] as const;

const GYARTOK = [
  'Elicent', 'Maico', 'Blauberg', 'Awenta', 'Vents', 'Helios', 'Vortice', 'Reventon', 'Egyéb'
];

interface FormData {
  termekNev: string;
  gyarto: string;
  kategoria: ProductData['kategoria'] | '';
  pdfUrl: string;
  arFt: string;
}

interface PdfSearchResult {
  url: string;
  title: string;
  source: string;
}

interface PdfSearchResponse {
  found: boolean;
  results: PdfSearchResult[];
  search_suggestions?: string[];
  warning?: string;
  error?: string;
}

export default function DataExtractor() {
  const [formData, setFormData] = useState<FormData>({
    termekNev: '',
    gyarto: '',
    kategoria: '',
    pdfUrl: '',
    arFt: '',
  });

  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'pdf-results' | 'review'>('input');
  const [pdfResults, setPdfResults] = useState<PdfSearchResult[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [pdfWarning, setPdfWarning] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // PDF keresés
  const handleSearchPdf = async () => {
    if (!formData.termekNev || !formData.gyarto) {
      setError('Add meg a terméknevet és gyártót a PDF kereséshez');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch('/api/search-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termekNev: formData.termekNev,
          gyarto: formData.gyarto,
        }),
      });

      const result: PdfSearchResponse = await response.json();

      if (result.found && result.results.length > 0) {
        setPdfResults(result.results);
        setPdfWarning(result.warning || null);
        setSearchSuggestions(result.search_suggestions || []);
        setStep('pdf-results');
      } else {
        setPdfResults([]);
        setPdfWarning(null);
        setSearchSuggestions(result.search_suggestions || []);
        setError('Nem találtam PDF-et automatikusan. Add meg manuálisan az URL-t, vagy próbáld a javasolt keresésekkel.');
      }
    } catch (err) {
      console.error('PDF search error:', err);
      setError('Hiba történt a keresés során.');
    } finally {
      setIsSearching(false);
    }
  };

  // PDF kiválasztása
  const handleSelectPdf = (url: string) => {
    setFormData(prev => ({ ...prev, pdfUrl: url }));
    setStep('input');
  };

  const handleExtract = async () => {
    if (!formData.termekNev || !formData.gyarto || !formData.kategoria) {
      setError('Töltsd ki a kötelező mezőket (terméknév, gyártó, kategória)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          termekNev: formData.termekNev,
          gyarto: formData.gyarto,
          kategoria: formData.kategoria,
          pdfUrl: formData.pdfUrl || undefined,
          arFt: formData.arFt ? parseInt(formData.arFt) : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'API hiba történt');
      }

      if (result.warnings && result.warnings.length > 0) {
        console.log('Figyelmeztetések:', result.warnings);
      }

      setExtractedData(result.extracted_data as ExtractedData[]);
      setStep('review');
    } catch (err) {
      console.error('Extraction error:', err);
      setError(err instanceof Error ? err.message : 'Hiba történt az adat kinyerés során. Próbáld újra.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: DataStatus) => {
    const configs = {
      biztos: { label: '✓ Biztos', class: 'badge-success' },
      kovetkeztetett: { label: '⚠️ Következtetett', class: 'badge-warning' },
      hianyzo: { label: '❌ Hiányzó', class: 'badge-error' },
    };
    const config = configs[status];
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      termek_nev: 'Terméknév',
      gyarto: 'Gyártó',
      kategoria: 'Kategória',
      zajszint_db: 'Zajszint (dB)',
      legszallitas_m3h: 'Légszállítás (m³/h)',
      nyomas_pa: 'Nyomás (Pa)',
      teljesitmeny_w: 'Teljesítmény (W)',
      ip_vedelem: 'IP védelem',
      csapagy_tipus: 'Csapágy típus',
      visszacsapo_szelep: 'Visszacsapó szelep',
      elettartam_ora: 'Élettartam (óra)',
      csoatmero_mm: 'Csőátmérő (mm)',
      ar_ft: 'Ár (Ft)',
    };
    return labels[field] || field;
  };

  const formatValue = (field: string, value: unknown): string => {
    if (typeof value === 'boolean') return value ? 'Igen' : 'Nem';
    if (field === 'kategoria') {
      const cat = CATEGORIES.find(c => c.value === value);
      return cat?.label || String(value);
    }
    return String(value);
  };

  const handleStatusChange = (index: number, newStatus: DataStatus) => {
    setExtractedData(prev => prev.map((item, i) =>
      i === index ? { ...item, status: newStatus } : item
    ));
  };

  const handleValueChange = (index: number, newValue: string) => {
    setExtractedData(prev => prev.map((item, i) => {
      if (i !== index) return item;

      let parsedValue: unknown = newValue;
      if (['zajszint_db', 'legszallitas_m3h', 'nyomas_pa', 'teljesitmeny_w', 'elettartam_ora', 'csoatmero_mm', 'ar_ft'].includes(item.field)) {
        parsedValue = parseInt(newValue) || 0;
      } else if (item.field === 'visszacsapo_szelep') {
        parsedValue = newValue.toLowerCase() === 'igen';
      }

      return { ...item, value: parsedValue };
    }));
  };

  const handleProceed = () => {
    const validData = extractedData.filter(d => d.status === 'biztos');
    localStorage.setItem('ventilatorhaz_extracted', JSON.stringify(validData));
    localStorage.setItem('ventilatorhaz_phase', '2');
    window.location.href = '/position';
  };

  // PDF Results step
  if (step === 'pdf-results') {
    return (
      <div className="card">
        <div className="card-header">
          <h2 style={{ margin: 0, fontSize: '1.125rem' }}>Talált PDF adatlapok</h2>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
          Válaszd ki a megfelelő adatlapot, vagy add meg manuálisan az URL-t.
        </p>

        {pdfWarning && (
          <div style={{
            padding: 'var(--space-md)',
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-md)',
            fontSize: '0.875rem',
            color: 'var(--color-warning)',
            border: '1px solid var(--color-warning)'
          }}>
            {pdfWarning}
          </div>
        )}

        {searchSuggestions.length > 0 && (
          <div style={{
            padding: 'var(--space-sm)',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--space-md)',
            fontSize: '0.8rem'
          }}>
            <strong>Keresési javaslatok:</strong>
            <ul style={{ margin: 'var(--space-xs) 0 0 var(--space-md)', padding: 0 }}>
              {searchSuggestions.map((suggestion, i) => (
                <li key={i}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        {pdfResults.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {pdfResults.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: 'var(--space-md)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 'var(--space-md)'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, marginBottom: 'var(--space-xs)' }}>
                    {result.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {result.source}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.875rem', padding: 'var(--space-xs) var(--space-sm)' }}
                  >
                    Megtekintés
                  </a>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '0.875rem', padding: 'var(--space-xs) var(--space-sm)' }}
                    onClick={() => handleSelectPdf(result.url)}
                  >
                    Kiválasztás
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>Nincs találat.</p>
        )}

        <div style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-md)' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setStep('input')}
          >
            ← Vissza
          </button>
        </div>
      </div>
    );
  }

  if (step === 'input') {
    return (
      <div className="card">
        <div className="card-header">
          <h2 style={{ margin: 0, fontSize: '1.125rem' }}>Új termék</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label">Terméknév *</label>
            <input
              type="text"
              name="termekNev"
              className="form-input"
              placeholder="pl. Elix 100"
              value={formData.termekNev}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Gyártó *</label>
            <select
              name="gyarto"
              className="form-select"
              value={formData.gyarto}
              onChange={handleInputChange}
            >
              <option value="">Válassz gyártót...</option>
              {GYARTOK.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Kategória *</label>
            <select
              name="kategoria"
              className="form-select"
              value={formData.kategoria}
              onChange={handleInputChange}
            >
              <option value="">Válassz kategóriát...</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Ár (Ft)</label>
            <input
              type="number"
              name="arFt"
              className="form-input"
              placeholder="pl. 12500"
              value={formData.arFt}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* PDF keresés szekció */}
        <div className="form-group" style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            PDF adatlap
            {formData.pdfUrl && (
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>URL megadva</span>
            )}
          </label>

          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <button
              className="btn btn-secondary"
              onClick={handleSearchPdf}
              disabled={isSearching || !formData.termekNev || !formData.gyarto}
              style={{ flex: '0 0 auto' }}
            >
              {isSearching ? (
                <>
                  <span className="spinner"></span>
                  Keresés...
                </>
              ) : (
                '🔎 PDF keresése automatikusan'
              )}
            </button>

            {formData.pdfUrl && (
              <a
                href={formData.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                Megnyitás
              </a>
            )}
          </div>

          <input
            type="url"
            name="pdfUrl"
            className="form-input"
            placeholder="...vagy írd be manuálisan: https://..."
            value={formData.pdfUrl}
            onChange={handleInputChange}
          />

          {searchSuggestions.length > 0 && (
            <div style={{ marginTop: 'var(--space-sm)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Keresési javaslat: {searchSuggestions.join(', ')}
            </div>
          )}
        </div>

        {error && (
          <div style={{
            padding: 'var(--space-md)',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-error)',
            marginTop: 'var(--space-md)',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-md)' }}>
          <button
            className="btn btn-primary"
            onClick={handleExtract}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Feldolgozás...
              </>
            ) : (
              <>
                🚀 Adatok kinyerése
              </>
            )}
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setStep('review')}
          >
            Manuális kitöltés
          </button>
        </div>
      </div>
    );
  }

  // Review step
  return (
    <div>
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="card-header">
          <h2 style={{ margin: 0, fontSize: '1.125rem' }}>Kinyert adatok ellenőrzése</h2>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <span className="badge badge-success">✓ {extractedData.filter(d => d.status === 'biztos').length} biztos</span>
            <span className="badge badge-warning">⚠️ {extractedData.filter(d => d.status === 'kovetkeztetett').length} következtetett</span>
          </div>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
          Ellenőrizd és szükség esetén módosítsd az adatokat. Csak a <strong>✓ Biztos</strong> státuszú adatok kerülnek a szövegbe!
        </p>

        <table className="data-table">
          <thead>
            <tr>
              <th>Adat</th>
              <th>Érték</th>
              <th>Státusz</th>
              <th>Forrás</th>
            </tr>
          </thead>
          <tbody>
            {extractedData.map((item, index) => (
              <tr key={item.field}>
                <td style={{ fontWeight: 500 }}>{getFieldLabel(item.field)}</td>
                <td>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.875rem' }}
                    value={formatValue(item.field, item.value)}
                    onChange={(e) => handleValueChange(index, e.target.value)}
                  />
                </td>
                <td>
                  <select
                    className="form-select"
                    style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem', width: 'auto' }}
                    value={item.status}
                    onChange={(e) => handleStatusChange(index, e.target.value as DataStatus)}
                  >
                    <option value="biztos">✓ Biztos</option>
                    <option value="kovetkeztetett">⚠️ Következtetett</option>
                    <option value="hianyzo">❌ Hiányzó</option>
                  </select>
                </td>
                <td style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {item.source || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'space-between' }}>
        <button
          className="btn btn-secondary"
          onClick={() => setStep('input')}
        >
          ← Vissza
        </button>

        <button
          className="btn btn-success"
          onClick={handleProceed}
        >
          Tovább a pozicionáláshoz →
        </button>
      </div>
    </div>
  );
}
