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

export default function UspSelector() {
  const [availableUsps, setAvailableUsps] = useState<UspBlock[]>([]);
  const [selectedUsps, setSelectedUsps] = useState<UspBlock[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [positioning, setPositioning] = useState<PositionedData['positioning'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load data from localStorage
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
    // First check extracted data
    const item = extractedData.find(d => d.field === field);
    if (item) return item.value;
    
    // Then check positioning
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
    // Replace variables in text with actual values
    return text.replace(/\{(\w+)\}/g, (match, varName) => {
      const value = getValue(varName);
      if (value !== undefined) {
        return String(value);
      }
      // Check positioning
      if (positioning) {
        const posValue = (positioning as Record<string, unknown>)[varName];
        if (posValue !== undefined) return String(posValue);
      }
      return match; // Keep original if not found
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
            selected: true, // Auto-select matched USPs
            order: order++,
          });
        }
      }
    }

    // Auto-select first 8 matched USPs
    const autoSelected = matched.slice(0, 8).map((usp, i) => ({ ...usp, selected: true, order: i }));
    const remaining = matched.slice(8).map(usp => ({ ...usp, selected: false }));
    
    setSelectedUsps(autoSelected);
    setAvailableUsps(remaining);
  };

  const toggleUsp = (usp: UspBlock, fromSelected: boolean) => {
    if (fromSelected) {
      // Remove from selected
      setSelectedUsps(prev => prev.filter(u => u.id !== usp.id));
      setAvailableUsps(prev => [...prev, { ...usp, selected: false }]);
    } else {
      // Add to selected
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
                        background: 'var(--color-success)', 
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

      {/* Warning if too few or too many */}
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

      {/* Navigation */}
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
