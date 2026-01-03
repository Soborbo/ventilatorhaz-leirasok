import { useState, useEffect } from 'react';
import type { ExtractedData, PositionedData } from '../lib/types';
import benchmarkData from '../data/benchmark.json';

export default function PositioningView() {
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [positioning, setPositioning] = useState<PositionedData['positioning'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load extracted data from localStorage
    const stored = localStorage.getItem('ventilatorhaz_extracted');
    if (stored) {
      const data = JSON.parse(stored) as ExtractedData[];
      setExtractedData(data);
      calculatePositioning(data);
    }
    setIsLoading(false);
  }, []);

  const getValue = (field: string): unknown => {
    const item = extractedData.find(d => d.field === field);
    return item?.value;
  };

  const calculatePositioning = (data: ExtractedData[]) => {
    const kategoria = data.find(d => d.field === 'kategoria')?.value as string;
    const zajszint = data.find(d => d.field === 'zajszint_db')?.value as number;
    const legszallitas = data.find(d => d.field === 'legszallitas_m3h')?.value as number;
    const teljesitmeny = data.find(d => d.field === 'teljesitmeny_w')?.value as number;
    const ar = data.find(d => d.field === 'ar_ft')?.value as number;

    const categoryBenchmark = (benchmarkData.categories as Record<string, any>)[kategoria];
    if (!categoryBenchmark) {
      setPositioning({ kiemelkedo_tulajdonsagok: [] });
      return;
    }

    const result: PositionedData['positioning'] = {
      kiemelkedo_tulajdonsagok: []
    };

    // Zajszint pozicionálás
    if (zajszint && categoryBenchmark.zajszint_db) {
      const zajBenchmark = categoryBenchmark.zajszint_db;
      const atlag = categoryBenchmark.zajszint_atlag;
      
      if (zajszint < (zajBenchmark.ultra_halk?.max || 0)) {
        result.zajszint_kategoria = 'ultra_halk';
        result.kiemelkedo_tulajdonsagok.push('Ultra halk működés');
      } else if (zajszint < (zajBenchmark.halk?.max || 0)) {
        result.zajszint_kategoria = 'halk';
        result.kiemelkedo_tulajdonsagok.push('Halk működés');
      } else if (zajszint < (zajBenchmark.atlagos?.max || 999)) {
        result.zajszint_kategoria = 'atlagos';
      } else {
        result.zajszint_kategoria = 'zajos';
      }
      
      if (atlag && zajszint < atlag) {
        result.zajszint_diff_percent = Math.round(((atlag - zajszint) / atlag) * 100);
      }
    }

    // Légszállítás pozicionálás
    if (legszallitas && categoryBenchmark.legszallitas_m3h) {
      const legBenchmark = categoryBenchmark.legszallitas_m3h;
      
      if (legszallitas < (legBenchmark.alacsony?.max || legBenchmark.kis?.max || 0)) {
        result.legszallitas_kategoria = 'alacsony';
      } else if (legszallitas < (legBenchmark.kozepes?.max || 999)) {
        result.legszallitas_kategoria = 'kozepes';
      } else if (legszallitas < (legBenchmark.magas?.max || legBenchmark.nagy?.max || 9999)) {
        result.legszallitas_kategoria = 'magas';
        result.kiemelkedo_tulajdonsagok.push('Magas légszállítás');
      } else {
        result.legszallitas_kategoria = 'nagyon_magas';
        result.kiemelkedo_tulajdonsagok.push('Kiemelkedő légszállítás');
      }
    }

    // Teljesítmény pozicionálás
    if (teljesitmeny && categoryBenchmark.teljesitmeny_w) {
      const telBenchmark = categoryBenchmark.teljesitmeny_w;
      
      if (teljesitmeny < (telBenchmark.takarekos?.max || 0)) {
        result.teljesitmeny_kategoria = 'takarekos';
        result.kiemelkedo_tulajdonsagok.push('Alacsony fogyasztás');
      } else if (teljesitmeny < (telBenchmark.atlagos?.max || 999)) {
        result.teljesitmeny_kategoria = 'atlagos';
      } else {
        result.teljesitmeny_kategoria = 'magas';
      }
    }

    // Ár pozicionálás
    if (ar && categoryBenchmark.ar_ft) {
      const arBenchmark = categoryBenchmark.ar_ft;
      
      if (ar < (arBenchmark.belepo?.max || 0)) {
        result.ar_kategoria = 'belepo';
      } else if (ar < (arBenchmark.kozep?.max || 0)) {
        result.ar_kategoria = 'kozep';
      } else if (ar < (arBenchmark.premium?.max || 0)) {
        result.ar_kategoria = 'premium';
      } else {
        result.ar_kategoria = 'luxus';
      }
    }

    // Additional features check
    const ipVedelem = data.find(d => d.field === 'ip_vedelem')?.value;
    if (ipVedelem === 'IPX4' || ipVedelem === 'IP44') {
      result.kiemelkedo_tulajdonsagok.push('Vízvédett (IPX4)');
    } else if (ipVedelem === 'IPX5' || ipVedelem === 'IP65') {
      result.kiemelkedo_tulajdonsagok.push('Sugár víz ellen védett (IPX5)');
    }

    const csapagy = data.find(d => d.field === 'csapagy_tipus')?.value;
    if (csapagy === 'golyóscsapágy') {
      result.kiemelkedo_tulajdonsagok.push('Golyóscsapágyas');
    }

    const visszacsapo = data.find(d => d.field === 'visszacsapo_szelep')?.value;
    if (visszacsapo) {
      result.kiemelkedo_tulajdonsagok.push('Visszacsapó szeleppel');
    }

    setPositioning(result);
  };

  const getCategoryLabel = (kategoria: string, type: string): { label: string; color: string } => {
    const labels: Record<string, Record<string, { label: string; color: string }>> = {
      zajszint: {
        ultra_halk: { label: 'Ultra halk', color: 'var(--color-success)' },
        halk: { label: 'Halk', color: '#22c55e' },
        atlagos: { label: 'Átlagos', color: 'var(--color-warning)' },
        zajos: { label: 'Zajos', color: 'var(--color-error)' },
      },
      legszallitas: {
        alacsony: { label: 'Alacsony', color: 'var(--color-text-muted)' },
        kozepes: { label: 'Közepes', color: 'var(--color-warning)' },
        magas: { label: 'Magas', color: '#22c55e' },
        nagyon_magas: { label: 'Nagyon magas', color: 'var(--color-success)' },
      },
      teljesitmeny: {
        takarekos: { label: 'Takarékos', color: 'var(--color-success)' },
        atlagos: { label: 'Átlagos', color: 'var(--color-warning)' },
        magas: { label: 'Magas', color: 'var(--color-error)' },
      },
      ar: {
        belepo: { label: 'Belépő', color: 'var(--color-success)' },
        kozep: { label: 'Közép', color: 'var(--color-warning)' },
        premium: { label: 'Prémium', color: '#a855f7' },
        luxus: { label: 'Luxus', color: '#ec4899' },
      },
    };
    
    return labels[type]?.[kategoria] || { label: kategoria, color: 'var(--color-text-muted)' };
  };

  const handleProceed = () => {
    localStorage.setItem('ventilatorhaz_positioning', JSON.stringify(positioning));
    localStorage.setItem('ventilatorhaz_phase', '3');
    window.location.href = '/usp';
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2xl)' }}>
        <span className="spinner" style={{ width: 40, height: 40 }}></span>
      </div>
    );
  }

  if (extractedData.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
          Nincs kinyert adat. Először végezd el az adat extrakciót.
        </p>
        <a href="/" className="btn btn-primary">← Vissza az elejére</a>
      </div>
    );
  }

  const termekNev = getValue('termek_nev') as string;
  const kategoria = getValue('kategoria') as string;
  const zajszint = getValue('zajszint_db') as number;
  const legszallitas = getValue('legszallitas_m3h') as number;
  const teljesitmeny = getValue('teljesitmeny_w') as number;
  const ar = getValue('ar_ft') as number;

  const categoryBenchmark = (benchmarkData.categories as Record<string, any>)[kategoria];

  return (
    <div>
      {/* Product summary */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div style={{ 
            width: 60, 
            height: 60, 
            background: 'var(--color-primary)', 
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem'
          }}>
            🌀
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{termekNev}</h2>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              {getValue('gyarto')} • {categoryBenchmark?.name || kategoria}
            </p>
          </div>
        </div>
      </div>

      {/* Positioning cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        {/* Zajszint */}
        {zajszint && positioning?.zajszint_kategoria && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Zajszint
              </div>
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: '9999px', 
                fontSize: '0.75rem',
                background: getCategoryLabel(positioning.zajszint_kategoria, 'zajszint').color,
                color: 'white'
              }}>
                {getCategoryLabel(positioning.zajszint_kategoria, 'zajszint').label}
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 'var(--space-xs)' }}>
              {zajszint} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>dB</span>
            </div>
            {positioning.zajszint_diff_percent && positioning.zajszint_diff_percent > 0 && (
              <div style={{ fontSize: '0.875rem', color: 'var(--color-success)' }}>
                ↓ {positioning.zajszint_diff_percent}% az átlag alatt ({categoryBenchmark?.zajszint_atlag} dB)
              </div>
            )}
          </div>
        )}

        {/* Légszállítás */}
        {legszallitas && positioning?.legszallitas_kategoria && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Légszállítás
              </div>
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: '9999px', 
                fontSize: '0.75rem',
                background: getCategoryLabel(positioning.legszallitas_kategoria, 'legszallitas').color,
                color: 'white'
              }}>
                {getCategoryLabel(positioning.legszallitas_kategoria, 'legszallitas').label}
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 'var(--space-xs)' }}>
              {legszallitas} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>m³/h</span>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Kategória átlag: {categoryBenchmark?.legszallitas_atlag} m³/h
            </div>
          </div>
        )}

        {/* Teljesítmény */}
        {teljesitmeny && positioning?.teljesitmeny_kategoria && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Fogyasztás
              </div>
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: '9999px', 
                fontSize: '0.75rem',
                background: getCategoryLabel(positioning.teljesitmeny_kategoria, 'teljesitmeny').color,
                color: 'white'
              }}>
                {getCategoryLabel(positioning.teljesitmeny_kategoria, 'teljesitmeny').label}
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 'var(--space-xs)' }}>
              {teljesitmeny} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>W</span>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Kategória átlag: {categoryBenchmark?.teljesitmeny_atlag} W
            </div>
          </div>
        )}

        {/* Ár */}
        {ar && positioning?.ar_kategoria && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Ár kategória
              </div>
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: '9999px', 
                fontSize: '0.75rem',
                background: getCategoryLabel(positioning.ar_kategoria, 'ar').color,
                color: 'white'
              }}>
                {getCategoryLabel(positioning.ar_kategoria, 'ar').label}
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 'var(--space-xs)' }}>
              {ar.toLocaleString('hu-HU')} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>Ft</span>
            </div>
          </div>
        )}
      </div>

      {/* Kiemelkedő tulajdonságok */}
      {positioning?.kiemelkedo_tulajdonsagok && positioning.kiemelkedo_tulajdonsagok.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <h3 style={{ margin: '0 0 var(--space-md)', fontSize: '1rem' }}>
            🌟 Kiemelkedő tulajdonságok
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
            {positioning.kiemelkedo_tulajdonsagok.map((prop, i) => (
              <span 
                key={i}
                style={{ 
                  padding: 'var(--space-sm) var(--space-md)', 
                  background: 'rgba(37, 99, 235, 0.2)', 
                  color: 'var(--color-primary-light)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem'
                }}
              >
                {prop}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'space-between' }}>
        <a href="/" className="btn btn-secondary">← Vissza</a>
        <button className="btn btn-success" onClick={handleProceed}>
          Tovább az USP kiválasztáshoz →
        </button>
      </div>
    </div>
  );
}
