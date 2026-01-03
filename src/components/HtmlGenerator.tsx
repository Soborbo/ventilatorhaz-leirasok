import { useState, useEffect } from 'react';
import type { UspBlock, ExtractedData, PositionedData } from '../lib/types';

export default function HtmlGenerator() {
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [positioning, setPositioning] = useState<PositionedData['positioning'] | null>(null);
  const [selectedUsps, setSelectedUsps] = useState<UspBlock[]>([]);
  const [rovidLeiras, setRovidLeiras] = useState('');
  const [htmlLeiras, setHtmlLeiras] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const storedExtracted = localStorage.getItem('ventilatorhaz_extracted');
    const storedPositioning = localStorage.getItem('ventilatorhaz_positioning');
    const storedUsps = localStorage.getItem('ventilatorhaz_usps');
    
    if (storedExtracted) setExtractedData(JSON.parse(storedExtracted));
    if (storedPositioning) setPositioning(JSON.parse(storedPositioning));
    if (storedUsps) setSelectedUsps(JSON.parse(storedUsps));
  }, []);

  const getValue = (field: string): unknown => {
    const item = extractedData.find(d => d.field === field);
    return item?.value;
  };

  const generateHtml = async () => {
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const termekNev = getValue('termek_nev') as string;
      const gyarto = getValue('gyarto') as string;
      
      // Generate short description
      const shortDesc = `A ${termekNev} ${gyarto} ventilátor ${positioning?.zajszint_kategoria === 'halk' || positioning?.zajszint_kategoria === 'ultra_halk' ? 'kiemelkedően halk működésével' : 'megbízható teljesítményével'} ideális választás fürdőszobák és mellékhelyiségek szellőztetésére.`;
      
      setRovidLeiras(shortDesc);
      
      // Generate full HTML
      const html = buildFullHtml(termekNev, gyarto);
      setHtmlLeiras(html);
      
    } catch (err) {
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const buildFullHtml = (termekNev: string, gyarto: string): string => {
    const parts: string[] = [];
    
    // Start container
    parts.push('<div class="termekoldal-container">');
    
    // Intro section
    parts.push('<div class="intro-video-section">');
    parts.push('<div class="intro-text-col">');
    parts.push(`<h3>${termekNev}: Megbízható ${gyarto} minőség</h3>`);
    parts.push(`<p>A ${termekNev} kiválóan alkalmas fürdőszobák párátlanítására, kisebb helyiségek szellőztetésére.</p>`);
    parts.push(`<p>Kompakt kialakításának köszönhetően könnyen felszerelhető és hosszú éveken át megbízhatóan működik.</p>`);
    parts.push('</div></div>');
    
    // Gyári adatlap
    parts.push('<div class="gyariadatlap-container"><div class="gyariadatlap-box">');
    parts.push('<div class="gyariadatlap-left"><h2>Gyári adatlap</h2>');
    parts.push('<p>A ventilátor hivatalos, gyártói adatlapja tartalmazza az összes fontos műszaki adatot – teljesítmény-, nyomás- és zajszinteket, méreteket, valamint szerelési információkat.</p>');
    parts.push('<a href="[ADATLAP_PDF_LINK]" class="gyariadatlap-btn" target="_blank">A gyári adatlap letöltése</a></div>');
    parts.push(`<div class="gyariadatlap-right"><img src="[MERETRAJZ_LINK]" alt="${termekNev} méretrajz"></div>`);
    parts.push('</div>');
    
    // Tudta
    parts.push('<div class="tudta"><div class="tudta-ikon">i</div><div class="tudta-tartalom">');
    parts.push(`<p><strong>Tudta?</strong> A ${gyarto} az egyik legmegbízhatóbb európai légtechnikai gyártó.</p>`);
    parts.push('</div></div></div>');
    
    // Ventilátorház bemutatkozó (fixed)
    parts.push('<div class="ventilatorhaz-bemutatkozo"><div class="ventilatorhaz-bemutatkozo-kep"><img src="https://shop.unas.hu/shop_ordered/55564/pic/nemesventilatorhaz-csapata.webp" alt="A Nemes Ventilátorház csapata"></div><div class="ventilatorhaz-bemutatkozo-szoveg"><h2>Vásároljon Magyarország egyik legmegbízhatóbb légtechnikai áruházából</h2><p>A Ventilátorház a Budapest 18. kerületében, a Királyhágó utca 30. található. Sokszoros díjnyertes cég vagyunk, több évtizedes tapasztalattal és hibátlan véleményekkel. Ha kérdése van, hívja munkatársainkat bizalommal a <strong>+36-70-369-9944</strong> telefonszámon!</p><div class="ventilatorhaz-gombok"><a href="https://www.nemesventilatorhaz.hu/visszahivaskero" class="ventilatorhaz-btn ventilatorhaz-btn-callback">Ingyenes tanácsadást kérek</a><a href="tel:+36703699944" class="ventilatorhaz-btn ventilatorhaz-btn-call">Felhívom most</a></div></div></div>');
    
    // TrustIndex
    parts.push("<script defer async src='https://cdn.trustindex.io/loader.js?cbff376529ad876c29862863c17'></script>");
    
    // Miért ajánljuk header
    parts.push('<div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #333; margin-bottom: 20px;"><h1 style="margin: 0;">Miért ajánljuk?</h1></div>');
    
    // USP blocks
    selectedUsps.forEach((usp, index) => {
      const isLast = index === selectedUsps.length - 1;
      const style = isLast ? ' style="border-bottom: none;"' : '';
      
      parts.push(`<div class="feature-row"${style}>`);
      parts.push(`<div class="feature-col feature-image"><img src="${usp.image_url}" alt="${usp.image_alt}" style="width: 100%; display: block; border-radius: 8px;"></div>`);
      parts.push(`<div class="feature-col feature-text"><h3>${usp.title}</h3><p>${usp.paragraph_1}</p>`);
      if (usp.paragraph_2) {
        parts.push(`<p>${usp.paragraph_2}</p>`);
      }
      parts.push('</div></div>');
    });
    
    // Close container
    parts.push('</div>');
    
    // Return minified (single line, no extra whitespace)
    return parts.join('');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const hasData = extractedData.length > 0 && selectedUsps.length > 0;

  if (!hasData) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
          Nincs elegendő adat. Végezd el az előző lépéseket.
        </p>
        <a href="/" className="btn btn-primary">← Vissza az elejére</a>
      </div>
    );
  }

  const termekNev = getValue('termek_nev') as string;

  return (
    <div>
      {/* Product info */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{termekNev}</h2>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              {String(getValue('gyarto'))} • {selectedUsps.length} USP kiválasztva
            </p>
          </div>
          {!htmlLeiras && (
            <button 
              className="btn btn-primary"
              onClick={generateHtml}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="spinner"></span>
                  Generálás...
                </>
              ) : (
                <>🚀 HTML generálása</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Generated content */}
      {htmlLeiras && (
        <>
          {/* Short description */}
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Rövid leírás</h3>
              <button 
                className={`btn btn-secondary copy-btn ${copied ? 'copied' : ''}`}
                onClick={() => copyToClipboard(rovidLeiras)}
              >
                📋 Másolás
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>{rovidLeiras}</p>
          </div>

          {/* HTML Preview */}
          <div className="html-preview">
            <div className="html-preview-header">
              <div className="html-preview-tabs">
                <button 
                  className={`html-preview-tab ${activeTab === 'preview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('preview')}
                >
                  👁️ Előnézet
                </button>
                <button 
                  className={`html-preview-tab ${activeTab === 'code' ? 'active' : ''}`}
                  onClick={() => setActiveTab('code')}
                >
                  {'</>'} Kód
                </button>
              </div>
              <button 
                className={`btn btn-success copy-btn ${copied ? 'copied' : ''}`}
                onClick={() => copyToClipboard(htmlLeiras)}
              >
                📋 HTML másolása
              </button>
            </div>
            
            <div className="html-preview-content">
              {activeTab === 'preview' ? (
                <div 
                  style={{ 
                    background: 'white', 
                    color: '#333', 
                    padding: 'var(--space-md)', 
                    borderRadius: 'var(--radius-md)',
                    maxHeight: '500px',
                    overflow: 'auto'
                  }}
                  dangerouslySetInnerHTML={{ __html: htmlLeiras }}
                />
              ) : (
                <pre className="html-preview-code">{htmlLeiras}</pre>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ 
            marginTop: 'var(--space-lg)', 
            padding: 'var(--space-lg)', 
            background: 'rgba(16, 185, 129, 0.1)', 
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-success)'
          }}>
            <h3 style={{ margin: '0 0 var(--space-sm)', color: 'var(--color-success)' }}>
              ✓ HTML kész!
            </h3>
            <p style={{ margin: '0 0 var(--space-md)', fontSize: '0.875rem' }}>
              Másold ki a HTML kódot és illeszd be az Unas termékleírás mezőjébe.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button 
                className="btn btn-success"
                onClick={() => copyToClipboard(htmlLeiras)}
              >
                📋 HTML másolása az Unas-ba
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
              >
                🔄 Új termék
              </button>
            </div>
          </div>
        </>
      )}

      {/* Navigation */}
      {!htmlLeiras && (
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-start', marginTop: 'var(--space-xl)' }}>
          <a href="/usp" className="btn btn-secondary">← Vissza</a>
        </div>
      )}
    </div>
  );
}
