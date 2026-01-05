import { useState, useEffect } from 'react';
import type { UspBlock, ExtractedData, PositionedData } from '../lib/types';
import uspLibrary from '../data/usp-library.json';

interface UspFromLibrary {
  id: string;
  condition: {
    field: string;
    operator: string;
    value: unknown;
  };
  title: string;
  paragraph_1: string;
  paragraph_2?: string;
  image_suggestion?: string;
  variables?: string[];
}

interface UspSuggestion {
  id: string;
  title: string;
  paragraph_1: string;
  paragraph_2?: string;
  source: string;
  confidence: 'high' | 'medium' | 'low';
  seo_keywords?: string[];
}

interface CompetitorInsight {
  source: string;
  highlights: string[];
}

export default function UspSelector() {
  const [availableUsps, setAvailableUsps] = useState<UspBlock[]>([]);
  const [selectedUsps, setSelectedUsps] = useState<UspBlock[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [positioning, setPositioning] = useState<PositionedData['positioning'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Új state-ek a versenytárs elemzéshez
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<UspSuggestion[]>([]);
  const [competitorInsights, setCompetitorInsights] = useState<CompetitorInsight[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const storedExtracted = localStorage.getItem('ventilatorhaz_extracted');
    const storedPositioning = localStorage.getItem('ventilatorhaz_positioning');

    if (storedExtracted) {
      const data = JSON.parse(storedExtracted) as ExtractedData[];
      setExtractedData(data);
    }

    if (storedPositioning) {
      const pos = JSON.parse(storedPositioning) as PositionedData['positioning'];
      setPositioning(pos);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (extractedData.length > 0) {
      matchUsps();
    }
  }, [extractedData, positioning]);

  const getValue = (field: string): unknown => {
    const item = extractedData.find(d => d.field === field);
    if (item) return item.value;

    if (positioning && field in positioning) {
      return (positioning as Record<string, unknown>)[field];
    }

    return undefined;
  };

  const evaluateCondition = (condition: UspFromLibrary['condition']): boolean => {
    const { field, operator, value } = condition;
    const actualValue = getValue(field);

    if (actualValue === undefined) return false;

    switch (operator) {
      case 'eq':
        return actualValue === value;
      case 'in':
        return Array.isArray(value) && value.includes(actualValue);
      case 'gt':
        return typeof actualValue === 'number' && actualValue > (value as number);
      case 'gte':
        return typeof actualValue === 'number' && actualValue >= (value as number);
      case 'lt':
        return typeof actualValue === 'number' && actualValue < (value as number);
      case 'lte':
        return typeof actualValue === 'number' && actualValue <= (value as number);
      case 'contains':
        return Array.isArray(actualValue) && actualValue.includes(value);
      default:
        return false;
    }
  };

  const replaceVariables = (text: string): string => {
    return text.replace(/\{(\w+)\}/g, (match, varName) => {
      const value = getValue(varName);
      if (value !== undefined) {
        return String(value);
      }
      if (positioning) {
        const posValue = (positioning as Record<string, unknown>)[varName];
        if (posValue !== undefined) return String(posValue);
      }
      return match;
    });
  };

  const matchUsps = () => {
    const matched: UspBlock[] = [];
    const categories = uspLibrary.usp_categories as Record<string, { usps: UspFromLibrary[] }>;

    let order = 0;
    for (const categoryKey in categories) {
      const category = categories[categoryKey];
      for (const usp of category.usps) {
        if (evaluateCondition(usp.condition)) {
          matched.push({
            id: usp.id,
            title: replaceVariables(usp.title),
            paragraph_1: replaceVariables(usp.paragraph_1),
            paragraph_2: usp.paragraph_2 ? replaceVariables(usp.paragraph_2) : undefined,
            image_url: `/images/usps/${usp.image_suggestion || 'default.jpg'}`,
            image_alt: replaceVariables(usp.title),
            selected: true,
            order: order++,
          });
        }
      }
    }

    const autoSelected = matched.slice(0, 8).map((usp, i) => ({ ...usp, selected: true, order: i }));
    const remaining = matched.slice(8).map(usp => ({ ...usp, selected: false }));

    setSelectedUsps(autoSelected);
    setAvailableUsps(remaining);
  };

  // Versenytárs elemzés és USP javaslatok
  const handleAnalyzeCompetitors = async () => {
    const termekNev = getValue('termek_nev') as string;
    const gyarto = getValue('gyarto') as string;
    const kategoria = getValue('kategoria') as string;

    if (!termekNev || !gyarto) {
      alert('Nincs elegendő termék adat az elemzéshez');
      return;
    }

    setIsAnalyzing(true);

    try {
      const extractedObj: Record<string, unknown> = {};
      extractedData.forEach(d => { extractedObj[d.field] = d.value; });

      const response = await fetch('/api/analyze-competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termekNev,
          gyarto,
          kategoria,
          extractedData: extractedObj
        }),
      });

      const result = await response.json();

      if (result.suggestions) {
        setSuggestions(result.suggestions);
      }
      if (result.competitor_insights) {
        setCompetitorInsights(result.competitor_insights);
      }
      setShowSuggestions(true);
    } catch (err) {
      console.error('Elemzési hiba:', err);
      alert('Hiba történt az elemzés során');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // USP javaslat hozzáadása a kiválasztottakhoz
  const addSuggestionToSelected = (suggestion: UspSuggestion) => {
    if (selectedUsps.length >= 12) {
      alert('Maximum 12 USP-t választhatsz ki!');
      return;
    }

    const newUsp: UspBlock = {
      id: `SUGGESTED_${suggestion.id}`,
      title: suggestion.title,
      paragraph_1: suggestion.paragraph_1,
      paragraph_2: suggestion.paragraph_2,
      image_url: '/images/usps/default.jpg',
      image_alt: suggestion.title,
      selected: true,
      order: selectedUsps.length,
    };

    setSelectedUsps(prev => [...prev, newUsp]);
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  // USP mentése a könyvtárba (localStorage-ba egyelőre)
  const saveSuggestionToLibrary = (suggestion: UspSuggestion) => {
    const savedSuggestions = JSON.parse(localStorage.getItem('ventilatorhaz_custom_usps') || '[]');
    savedSuggestions.push({
      ...suggestion,
      savedAt: new Date().toISOString()
    });
    localStorage.setItem('ventilatorhaz_custom_usps', JSON.stringify(savedSuggestions));
    alert(`"${suggestion.title}" mentve a könyvtárba!`);
  };

  const toggleUsp = (usp: UspBlock, fromSelected: boolean) => {
    if (fromSelected) {
      setSelectedUsps(prev => prev.filter(u => u.id !== usp.id));
      setAvailableUsps(prev => [...prev, { ...usp, selected: false }]);
    } else {
      if (selectedUsps.length >= 12) {
        alert('Maximum 12 USP-t választhatsz ki!');
        return;
      }
      setAvailableUsps(prev => prev.filter(u => u.id !== usp.id));
      setSelectedUsps(prev => [...prev, { ...usp, selected: true, order: prev.length }]);
    }
  };

  const moveUsp = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedUsps.length) return;

    const newSelected = [...selectedUsps];
    [newSelected[index], newSelected[newIndex]] = [newSelected[newIndex], newSelected[index]];
    newSelected.forEach((usp, i) => usp.order = i);
    setSelectedUsps(newSelected);
  };

  const handleProceed = () => {
    localStorage.setItem('ventilatorhaz_usps', JSON.stringify(selectedUsps));
    localStorage.setItem('ventilatorhaz_phase', '4');
    window.location.href = '/generate';
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
          Nincs termék adat. Először végezd el az előző lépéseket.
        </p>
        <a href="/" className="btn btn-primary">← Vissza az elejére</a>
      </div>
    );
  }

  return (
    <div>
      {/* Versenytárs elemzés gomb */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)', background: 'linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, marginBottom: 'var(--space-xs)' }}>🔍 Versenytárs elemzés & USP javaslatok</h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              AI elemzés a versenytársak és a gyártó alapján
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleAnalyzeCompetitors}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <span className="spinner"></span>
                Elemzés...
              </>
            ) : (
              '🚀 Elemzés indítása'
            )}
          </button>
        </div>
      </div>

      {/* AI javaslatok szekció */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-lg)', border: '2px solid var(--color-primary)' }}>
          <div className="card-header">
            <h3 style={{ margin: 0 }}>✨ AI USP javaslatok ({suggestions.length})</h3>
            <button
              className="btn btn-secondary"
              onClick={() => setShowSuggestions(false)}
              style={{ fontSize: '0.75rem', padding: 'var(--space-xs) var(--space-sm)' }}
            >
              Bezárás
            </button>
          </div>

          {competitorInsights.length > 0 && (
            <div style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-sm)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
              <strong style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Versenytárs infók:</strong>
              {competitorInsights.map((insight, i) => (
                <div key={i} style={{ fontSize: '0.75rem', marginTop: 'var(--space-xs)' }}>
                  <strong>{insight.source}:</strong> {insight.highlights.join(', ')}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                style={{
                  padding: 'var(--space-md)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-primary)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 'var(--space-xs)' }}>{suggestion.title}</div>
                    <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                      <span className={`badge ${suggestion.confidence === 'high' ? 'badge-success' : suggestion.confidence === 'medium' ? 'badge-warning' : 'badge-error'}`} style={{ fontSize: '0.65rem' }}>
                        {suggestion.confidence === 'high' ? 'Magas' : suggestion.confidence === 'medium' ? 'Közepes' : 'Alacsony'} megbízhatóság
                      </span>
                      <span className="badge" style={{ fontSize: '0.65rem', background: 'var(--color-bg-tertiary)' }}>
                        {suggestion.source}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: '0.75rem', padding: 'var(--space-xs) var(--space-sm)' }}
                      onClick={() => addSuggestionToSelected(suggestion)}
                    >
                      + Hozzáadás
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: 'var(--space-xs) var(--space-sm)' }}
                      onClick={() => saveSuggestionToLibrary(suggestion)}
                    >
                      💾 Könyvtárba
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  {suggestion.paragraph_1}
                </p>
                {suggestion.paragraph_2 && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, marginTop: 'var(--space-xs)' }}>
                    {suggestion.paragraph_2}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-success)' }}>
            {selectedUsps.length}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Kiválasztott</div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
            {availableUsps.length}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Elérhető</div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>5-12</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Ajánlott</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
        {/* Selected USPs */}
        <div>
          <h3 style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span style={{ color: 'var(--color-success)' }}>✓</span> Kiválasztott USP-k
            <span style={{
              fontSize: '0.75rem',
              padding: '2px 8px',
              background: 'var(--color-bg-tertiary)',
              borderRadius: '9999px',
              color: 'var(--color-text-muted)'
            }}>
              {selectedUsps.length}/12
            </span>
          </h3>

          {selectedUsps.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Még nincs kiválasztott USP
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {selectedUsps.map((usp, index) => (
                <div
                  key={usp.id}
                  className="usp-card selected"
                  style={{ cursor: 'default' }}
                >
                  <div className="usp-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <span style={{
                        width: 24,
                        height: 24,
                        background: usp.id.startsWith('SUGGESTED_') ? 'var(--color-primary)' : 'var(--color-success)',
                        color: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {index + 1}
                      </span>
                      <span className="usp-card-title">{usp.title}</span>
                      {usp.id.startsWith('SUGGESTED_') && (
                        <span className="badge" style={{ fontSize: '0.6rem', background: 'var(--color-primary)', color: 'white' }}>AI</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                      <button
                        className="btn btn-icon btn-secondary"
                        onClick={() => moveUsp(index, 'up')}
                        disabled={index === 0}
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        ↑
                      </button>
                      <button
                        className="btn btn-icon btn-secondary"
                        onClick={() => moveUsp(index, 'down')}
                        disabled={index === selectedUsps.length - 1}
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        ↓
                      </button>
                      <button
                        className="btn btn-icon"
                        onClick={() => toggleUsp(usp, true)}
                        style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--color-error)' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
                    {usp.paragraph_1.substring(0, 100)}...
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available USPs */}
        <div>
          <h3 style={{ marginBottom: 'var(--space-md)' }}>
            📚 Elérhető USP-k
          </h3>

          {availableUsps.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Minden releváns USP ki van választva
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {availableUsps.map((usp) => (
                <div
                  key={usp.id}
                  className="usp-card"
                  onClick={() => toggleUsp(usp, false)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="usp-card-header">
                    <span className="usp-card-title">{usp.title}</span>
                    <button
                      className="btn btn-icon btn-primary"
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    >
                      +
                    </button>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
                    {usp.paragraph_1.substring(0, 100)}...
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedUsps.length < 5 && (
        <div style={{
          marginTop: 'var(--space-lg)',
          padding: 'var(--space-md)',
          background: 'rgba(245, 158, 11, 0.1)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-warning)',
          fontSize: '0.875rem'
        }}>
          ⚠️ Legalább 5 USP kiválasztása ajánlott a hatékony termékleíráshoz.
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'space-between', marginTop: 'var(--space-xl)' }}>
        <a href="/position" className="btn btn-secondary">← Vissza</a>
        <button
          className="btn btn-success"
          onClick={handleProceed}
          disabled={selectedUsps.length < 3}
        >
          Tovább a HTML generáláshoz →
        </button>
      </div>
    </div>
  );
}
