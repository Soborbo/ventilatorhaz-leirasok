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
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'review'>('input');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleExtract = async () => {
    if (!formData.termekNev || !formData.gyarto || !formData.kategoria) {
      setError('Töltsd ki a kötelező mezőket (terméknév, gyártó, kategória)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Real API call to Claude
      // For now, simulate extraction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockExtracted: ExtractedData[] = [
        { field: 'termek_nev', value: formData.termekNev, status: 'biztos' },
        { field: 'gyarto', value: formData.gyarto, status: 'biztos' },
        { field: 'kategoria', value: formData.kategoria, status: 'biztos' },
        { field: 'zajszint_db', value: 32, status: 'biztos', source: 'Adatlap 2. oldal' },
        { field: 'legszallitas_m3h', value: 97, status: 'biztos', source: 'Adatlap 2. oldal' },
        { field: 'nyomas_pa', value: 159, status: 'biztos', source: 'Adatlap 2. oldal' },
        { field: 'teljesitmeny_w', value: 8, status: 'biztos', source: 'Adatlap 2. oldal' },
        { field: 'ip_vedelem', value: 'IPX4', status: 'biztos', source: 'Adatlap 1. oldal' },
        { field: 'csapagy_tipus', value: 'golyóscsapágy', status: 'kovetkeztetett', source: '"Long Life csapágy" - feltételezhetően golyóscsapágy' },
        { field: 'visszacsapo_szelep', value: true, status: 'biztos', source: 'Adatlap 3. oldal' },
        { field: 'elettartam_ora', value: 30000, status: 'biztos', source: 'Adatlap 1. oldal' },
        { field: 'csoatmero_mm', value: 100, status: 'biztos', source: 'Terméknévből' },
      ];

      if (formData.arFt) {
        mockExtracted.push({ field: 'ar_ft', value: parseInt(formData.arFt), status: 'biztos', source: 'Felhasználói input' });
      }

      setExtractedData(mockExtracted);
      setStep('review');
    } catch (err) {
      setError('Hiba történt az adat kinyerés során. Próbáld újra.');
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
      
      // Parse value based on field type
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
    // Filter out non-biztos data and proceed to next phase
    const validData = extractedData.filter(d => d.status === 'biztos');
    
    // Store in localStorage for next phase
    localStorage.setItem('ventilatorhaz_extracted', JSON.stringify(validData));
    localStorage.setItem('ventilatorhaz_phase', '2');
    
    // Navigate to position phase
    window.location.href = '/position';
  };

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
              placeholder="pl. Elicent Elix 100"
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
        
        <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
          <label className="form-label">PDF adatlap URL</label>
          <input
            type="url"
            name="pdfUrl"
            className="form-input"
            placeholder="https://..."
            value={formData.pdfUrl}
            onChange={handleInputChange}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-xs)' }}>
            Add meg a gyártói adatlap URL-jét, vagy hagyd üresen és töltsd fel manuálisan az adatokat.
          </p>
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
                🔍 Adatok kinyerése
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
