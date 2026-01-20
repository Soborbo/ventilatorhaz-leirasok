import { useState } from 'react';

interface BatchSearchRequest {
  products: Array<{
    name: string;
    manufacturer: string;
  }>;
}

interface ProductLinkResult {
  productName: string;
  manufacturer: string;
  productLine: string;
  links: Array<{
    url: string;
    title: string;
    domain: string;
    type: 'pdf' | 'page';
  }>;
  success: boolean;
  error?: string;
}

interface BatchSearchResponse {
  totalProducts: number;
  successCount: number;
  failureCount: number;
  results: ProductLinkResult[];
  error?: string;
}

export default function BatchLinkCollector() {
  const [productsText, setProductsText] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<BatchSearchResponse | null>(null);

  const handleSearch = async () => {
    if (!productsText.trim()) {
      setError('Add meg a termékeket!');
      return;
    }

    // Parse products from text
    const lines = productsText.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
    const products: BatchSearchRequest['products'] = [];

    for (const line of lines) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 2) {
        products.push({
          name: parts[0],
          manufacturer: parts[1],
        });
      }
    }

    if (products.length === 0) {
      setError('Nincs érvényes termék! Formátum: Terméknév | Gyártó');
      return;
    }

    setIsSearching(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/batch-search-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      });

      const result: BatchSearchResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'API hiba');
      }

      setResults(result);
    } catch (err) {
      console.error('Batch search error:', err);
      setError(err instanceof Error ? err.message : 'Hiba történt a keresés során.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setResults(null);
    setProductsText('');
    setError(null);
  };

  if (results) {
    return (
      <div>
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="card-header">
            <h2 style={{ margin: 0, fontSize: '1.125rem' }}>
              Batch keresés eredmények
            </h2>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <span className="badge badge-success">
                ✅ {results.successCount} sikeres
              </span>
              {results.failureCount > 0 && (
                <span className="badge badge-error">
                  ❌ {results.failureCount} sikertelen
                </span>
              )}
            </div>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>
            {results.totalProducts} termék feldolgozva. Product line adatlapok megjelenítve.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: '150px' }}>Termék</th>
                  <th style={{ minWidth: '100px' }}>Gyártó</th>
                  <th style={{ minWidth: '120px' }}>Product Line</th>
                  <th style={{ minWidth: '400px' }}>Linkek</th>
                  <th style={{ textAlign: 'center' }}>Státusz</th>
                </tr>
              </thead>
              <tbody>
                {results.results.map((result, index) => (
                  <tr key={index} style={{ verticalAlign: 'top' }}>
                    <td style={{ fontWeight: 500 }}>{result.productName}</td>
                    <td>{result.manufacturer}</td>
                    <td>
                      <code style={{
                        background: 'var(--color-bg-secondary)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}>
                        {result.productLine}
                      </code>
                    </td>
                    <td>
                      {result.links.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                          {result.links.map((link, linkIndex) => (
                            <div key={linkIndex} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--space-xs)',
                              padding: 'var(--space-xs)',
                              background: 'var(--color-bg-secondary)',
                              borderRadius: 'var(--radius-sm)',
                            }}>
                              <span style={{
                                fontSize: '1rem',
                                flexShrink: 0,
                              }}>
                                {link.type === 'pdf' ? '📄' : '🔗'}
                              </span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    color: 'var(--color-primary)',
                                    textDecoration: 'none',
                                    fontSize: '0.8rem',
                                    display: 'block',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title={link.url}
                                >
                                  {link.title}
                                </a>
                                <div style={{
                                  fontSize: '0.7rem',
                                  color: 'var(--color-text-muted)',
                                  marginTop: '2px'
                                }}>
                                  {link.domain}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                          {result.error || 'Nincs találat'}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {result.success ? (
                        <span className="badge badge-success">✓</span>
                      ) : (
                        <span className="badge badge-error">✗</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button
            className="btn btn-secondary"
            onClick={handleClear}
          >
            ← Új keresés
          </button>

          <button
            className="btn btn-success"
            onClick={() => {
              // Export to JSON
              const dataStr = JSON.stringify(results, null, 2);
              const dataBlob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'product-links.json';
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            💾 Exportálás JSON-ba
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 style={{ margin: 0, fontSize: '1.125rem' }}>
          Batch Link Gyűjtés
          <span className="badge badge-info" style={{ marginLeft: 'var(--space-sm)', fontSize: '0.7rem' }}>
            Product Line adatlapok
          </span>
        </h2>
      </div>

      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
        Gyűjts linkeket akár 20 termékhez egyszerre! A script automatikusan megkeresi minden termékhez a <strong>product line adatlapot</strong> (nem az egyedi termék adatlapját).
      </p>

      <div className="form-group">
        <label className="form-label">
          Termékek lista
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 'normal', marginLeft: 'var(--space-xs)' }}>
            (Formátum: Terméknév | Gyártó, soronként)
          </span>
        </label>
        <textarea
          className="form-input"
          style={{
            minHeight: '300px',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            lineHeight: '1.5'
          }}
          placeholder={`ELIX 100 | Elicent
ER 100 | Maico
AERO 100 | Blauberg
SILEO 100 | Blauberg
100 LD | Vents
...

# Kommentek #-el kezdhetők
# Maximum 20 termék ajánlott`}
          value={productsText}
          onChange={(e) => setProductsText(e.target.value)}
        />
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          marginTop: 'var(--space-xs)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-xs)'
        }}>
          <span>💡</span>
          <span>
            Product line példa: "ELIX 100" → "ELIX" sorozat adatlap (több modellt tartalmaz)
          </span>
        </div>
      </div>

      {error && (
        <div style={{
          padding: 'var(--space-md)',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-error)',
          marginTop: 'var(--space-md)',
          fontSize: '0.875rem',
          border: '1px solid var(--color-error)'
        }}>
          {error}
        </div>
      )}

      <div style={{
        padding: 'var(--space-md)',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 'var(--radius-md)',
        marginTop: 'var(--space-md)',
        fontSize: '0.875rem',
        color: 'var(--color-info)',
        border: '1px solid var(--color-info)'
      }}>
        <strong>ℹ️ Fontos:</strong>
        <ul style={{ margin: 'var(--space-xs) 0 0 var(--space-md)', padding: 0 }}>
          <li>Gemini API kulcs szükséges a batch kereséshez</li>
          <li>1 keresés másodpercenként (rate limit védelem)</li>
          <li>Minden termékhez 3 link: PDF adatlap, termékoldal, dokumentáció</li>
          <li>Mind a 3 link a gyártó hivatalos oldaláról származik</li>
        </ul>
      </div>

      <div style={{ marginTop: 'var(--space-lg)' }}>
        <button
          className="btn btn-primary"
          onClick={handleSearch}
          disabled={isSearching || !productsText.trim()}
        >
          {isSearching ? (
            <>
              <span className="spinner"></span>
              Keresés... ({Math.ceil(productsText.split('\n').filter(l => l.trim() && !l.trim().startsWith('#')).length * 1)} mp várható)
            </>
          ) : (
            <>
              🔎 Linkek keresése
            </>
          )}
        </button>
      </div>
    </div>
  );
}
