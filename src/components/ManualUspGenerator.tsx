import { useState } from 'react';

interface ManualUsp {
  id: string;
  title: string;
  paragraph_1: string;
  paragraph_2: string;
  image_url: string;
  image_alt: string;
}

interface IntroMedia {
  type: 'video' | 'image';
  video_url: string;
  image_url: string;
  image_alt: string;
}

interface IntroText {
  title: string;
  paragraph_1: string;
  paragraph_2: string;
  tudta: string;
}

interface ProductInfo {
  termek_nev: string;
  gyarto: string;
  pdf_url: string;
  meretrajz_url: string;
}

const createEmptyUsp = (): ManualUsp => ({
  id: crypto.randomUUID(),
  title: '',
  paragraph_1: '',
  paragraph_2: '',
  image_url: '',
  image_alt: '',
});

export default function ManualUspGenerator() {
  const [productInfo, setProductInfo] = useState<ProductInfo>({
    termek_nev: '',
    gyarto: '',
    pdf_url: '',
    meretrajz_url: '',
  });

  const [introMedia, setIntroMedia] = useState<IntroMedia>({
    type: 'video',
    video_url: '',
    image_url: '',
    image_alt: '',
  });

  const [introText, setIntroText] = useState<IntroText>({
    title: '',
    paragraph_1: '',
    paragraph_2: '',
    tudta: '',
  });

  const [usps, setUsps] = useState<ManualUsp[]>([
    createEmptyUsp(),
    createEmptyUsp(),
    createEmptyUsp(),
  ]);

  const [htmlOutput, setHtmlOutput] = useState('');
  const [rovidLeiras, setRovidLeiras] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  const addUsp = () => {
    if (usps.length < 7) {
      setUsps([...usps, createEmptyUsp()]);
    }
  };

  const removeUsp = (index: number) => {
    if (usps.length > 3) {
      setUsps(usps.filter((_, i) => i !== index));
    }
  };

  const updateUsp = (index: number, field: keyof ManualUsp, value: string) => {
    const newUsps = [...usps];
    newUsps[index] = { ...newUsps[index], [field]: value };
    setUsps(newUsps);
  };

  const moveUsp = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newUsps = [...usps];
      [newUsps[index - 1], newUsps[index]] = [newUsps[index], newUsps[index - 1]];
      setUsps(newUsps);
    } else if (direction === 'down' && index < usps.length - 1) {
      const newUsps = [...usps];
      [newUsps[index], newUsps[index + 1]] = [newUsps[index + 1], newUsps[index]];
      setUsps(newUsps);
    }
  };

  const isFormValid = (): boolean => {
    if (!productInfo.termek_nev.trim() || !productInfo.gyarto.trim()) {
      return false;
    }

    const filledUsps = usps.filter(usp =>
      usp.title.trim() &&
      usp.paragraph_1.trim() &&
      usp.image_url.trim() &&
      usp.image_alt.trim()
    );

    return filledUsps.length >= 3;
  };

  const generateHtml = () => {
    const { termek_nev, gyarto, pdf_url, meretrajz_url } = productInfo;

    // Generate short description
    const shortDesc = `A ${termek_nev} ${gyarto} ventilátor megbízható teljesítményével ideális választás fürdőszobák és mellékhelyiségek szellőztetésére.`;
    setRovidLeiras(shortDesc);

    // Build full HTML
    const parts: string[] = [];

    // Start container
    parts.push('<div class="termekoldal-container">');

    // Intro section
    parts.push('<div class="intro-video-section">');

    // Media column (video or image)
    if (introMedia.type === 'video' && introMedia.video_url.trim()) {
      parts.push('<div class="intro-video-col">');
      parts.push('<div class="video-wrapper">');
      parts.push(`<iframe src="${introMedia.video_url}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen=""></iframe>`);
      parts.push('</div></div>');
    } else if (introMedia.type === 'image' && introMedia.image_url.trim()) {
      parts.push('<div class="intro-video-col">');
      parts.push(`<img src="${introMedia.image_url}" alt="${introMedia.image_alt || termek_nev}" style="width: 100%; height: auto; border-radius: 8px;">`);
      parts.push('</div>');
    }

    // Text column
    parts.push('<div class="intro-text-col">');
    const introTitle = introText.title.trim() || `${termek_nev}: Megbízható ${gyarto} minőség`;
    const introPara1 = introText.paragraph_1.trim() || `A ${termek_nev} kiválóan alkalmas fürdőszobák párátlanítására, kisebb helyiségek szellőztetésére.`;
    const introPara2 = introText.paragraph_2.trim() || `Kompakt kialakításának köszönhetően könnyen felszerelhető és hosszú éveken át megbízhatóan működik.`;

    parts.push(`<h3>${introTitle}</h3>`);
    parts.push(`<p>${introPara1}</p>`);
    parts.push(`<p>${introPara2}</p>`);
    parts.push('</div></div>');

    // Gyári adatlap
    const pdfLink = pdf_url.trim() || '[ADATLAP_PDF_LINK]';
    const meretrajzLink = meretrajz_url.trim() || '[MERETRAJZ_LINK]';

    parts.push('<div class="gyariadatlap-container"><div class="gyariadatlap-box">');
    parts.push('<div class="gyariadatlap-left"><h2>Gyári adatlap</h2>');
    parts.push('<p>A ventilátor hivatalos, gyártói adatlapja tartalmazza az összes fontos műszaki adatot – teljesítmény-, nyomás- és zajszinteket, méreteket, valamint szerelési információkat.</p>');
    parts.push(`<a href="${pdfLink}" class="gyariadatlap-btn" target="_blank">A gyári adatlap letöltése</a></div>`);
    parts.push(`<div class="gyariadatlap-right"><img src="${meretrajzLink}" alt="${termek_nev} méretrajz"></div>`);
    parts.push('</div>');

    // Tudta
    const tudtaText = introText.tudta.trim() || `A ${gyarto} az egyik legmegbízhatóbb európai légtechnikai gyártó.`;
    parts.push('<div class="tudta"><div class="tudta-ikon">i</div><div class="tudta-tartalom">');
    parts.push(`<p><strong>Tudta?</strong> ${tudtaText}</p>`);
    parts.push('</div></div></div>');

    // Ventilátorház bemutatkozó (fixed)
    parts.push('<div class="ventilatorhaz-bemutatkozo"><div class="ventilatorhaz-bemutatkozo-kep"><img src="https://shop.unas.hu/shop_ordered/55564/pic/nemesventilatorhaz-csapata.webp" alt="A Nemes Ventilátorház csapata"></div><div class="ventilatorhaz-bemutatkozo-szoveg"><h2>Vásároljon Magyarország egyik legmegbízhatóbb légtechnikai áruházából</h2><p>A Ventilátorház a Budapest 18. kerületében, a Királyhágó utca 30. található. Sokszoros díjnyertes cég vagyunk, több évtizedes tapasztalattal és hibátlan véleményekkel. Ha kérdése van, hívja munkatársainkat bizalommal a <strong>+36-70-369-9944</strong> telefonszámon!</p><div class="ventilatorhaz-gombok"><a href="https://www.nemesventilatorhaz.hu/visszahivaskero" class="ventilatorhaz-btn ventilatorhaz-btn-callback">Ingyenes tanácsadást kérek</a><a href="tel:+36703699944" class="ventilatorhaz-btn ventilatorhaz-btn-call">Felhívom most</a></div></div></div>');

    // TrustIndex
    parts.push("<script defer async src='https://cdn.trustindex.io/loader.js?cbff376529ad876c29862863c17'></script>");

    // Miért ajánljuk header
    parts.push('<div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #333; margin-bottom: 20px;"><h1 style="margin: 0;">Miért ajánljuk?</h1></div>');

    // USP blocks - only include filled ones
    const filledUsps = usps.filter(usp =>
      usp.title.trim() &&
      usp.paragraph_1.trim() &&
      usp.image_url.trim() &&
      usp.image_alt.trim()
    );

    filledUsps.forEach((usp, index) => {
      const isLast = index === filledUsps.length - 1;
      const style = isLast ? ' style="border-bottom: none;"' : '';

      parts.push(`<div class="feature-row"${style}>`);
      parts.push(`<div class="feature-col feature-image"><img src="${usp.image_url}" alt="${usp.image_alt}" style="width: 100%; display: block; border-radius: 8px;"></div>`);
      parts.push(`<div class="feature-col feature-text"><h3>${usp.title}</h3><p>${usp.paragraph_1}</p>`);
      if (usp.paragraph_2.trim()) {
        parts.push(`<p>${usp.paragraph_2}</p>`);
      }
      parts.push('</div></div>');
    });

    // Close container
    parts.push('</div>');

    setHtmlOutput(parts.join(''));
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

  const resetForm = () => {
    setProductInfo({
      termek_nev: '',
      gyarto: '',
      pdf_url: '',
      meretrajz_url: '',
    });
    setIntroMedia({
      type: 'video',
      video_url: '',
      image_url: '',
      image_alt: '',
    });
    setIntroText({
      title: '',
      paragraph_1: '',
      paragraph_2: '',
      tudta: '',
    });
    setUsps([createEmptyUsp(), createEmptyUsp(), createEmptyUsp()]);
    setHtmlOutput('');
    setRovidLeiras('');
  };

  const filledUspCount = usps.filter(usp =>
    usp.title.trim() && usp.paragraph_1.trim()
  ).length;

  return (
    <div>
      {/* Product Info Card */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <h2 style={{ margin: '0 0 var(--space-md)', fontSize: '1.25rem' }}>Termék adatok</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label">Termék neve *</label>
            <input
              type="text"
              className="form-input"
              value={productInfo.termek_nev}
              onChange={(e) => setProductInfo({ ...productInfo, termek_nev: e.target.value })}
              placeholder="pl. Elicent E-Style 100 PRO"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Gyártó *</label>
            <input
              type="text"
              className="form-input"
              value={productInfo.gyarto}
              onChange={(e) => setProductInfo({ ...productInfo, gyarto: e.target.value })}
              placeholder="pl. Elicent"
            />
          </div>

          <div className="form-group">
            <label className="form-label">PDF adatlap URL (opcionális)</label>
            <input
              type="url"
              className="form-input"
              value={productInfo.pdf_url}
              onChange={(e) => setProductInfo({ ...productInfo, pdf_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Méretrajz URL (opcionális)</label>
            <input
              type="url"
              className="form-input"
              value={productInfo.meretrajz_url}
              onChange={(e) => setProductInfo({ ...productInfo, meretrajz_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Intro Section Card */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <h2 style={{ margin: '0 0 var(--space-md)', fontSize: '1.25rem' }}>Bevezető szekció</h2>

        {/* Media Type Toggle */}
        <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
          <label className="form-label">Média típusa</label>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              type="button"
              className={`btn ${introMedia.type === 'video' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setIntroMedia({ ...introMedia, type: 'video' })}
              style={{ flex: 1 }}
            >
              Videó
            </button>
            <button
              type="button"
              className={`btn ${introMedia.type === 'image' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setIntroMedia({ ...introMedia, type: 'image' })}
              style={{ flex: 1 }}
            >
              Kép
            </button>
          </div>
        </div>

        {/* Media Input */}
        {introMedia.type === 'video' ? (
          <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
            <label className="form-label">YouTube embed URL (opcionális)</label>
            <input
              type="url"
              className="form-input"
              value={introMedia.video_url}
              onChange={(e) => setIntroMedia({ ...introMedia, video_url: e.target.value })}
              placeholder="https://www.youtube.com/embed/xxxxx"
            />
            <p style={{ margin: 'var(--space-xs) 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Használd az embed formátumot: youtube.com/embed/VIDEO_ID
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">Kép URL (opcionális)</label>
              <input
                type="url"
                className="form-input"
                value={introMedia.image_url}
                onChange={(e) => setIntroMedia({ ...introMedia, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Kép alt szöveg</label>
              <input
                type="text"
                className="form-input"
                value={introMedia.image_alt}
                onChange={(e) => setIntroMedia({ ...introMedia, image_alt: e.target.value })}
                placeholder="pl. Elicent E-Style ventilátor"
              />
            </div>
          </div>
        )}

        {/* Intro Text */}
        <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label">Bevezető cím (opcionális)</label>
            <input
              type="text"
              className="form-input"
              value={introText.title}
              onChange={(e) => setIntroText({ ...introText, title: e.target.value })}
              placeholder={`Alapértelmezett: "${productInfo.termek_nev || '[Termék neve]'}: Megbízható ${productInfo.gyarto || '[Gyártó]'} minőség"`}
            />
          </div>

          <div className="form-group">
            <label className="form-label">1. bekezdés (opcionális)</label>
            <textarea
              className="form-input"
              value={introText.paragraph_1}
              onChange={(e) => setIntroText({ ...introText, paragraph_1: e.target.value })}
              placeholder="Alapértelmezett: A [termék] kiválóan alkalmas fürdőszobák párátlanítására..."
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">2. bekezdés (opcionális)</label>
            <textarea
              className="form-input"
              value={introText.paragraph_2}
              onChange={(e) => setIntroText({ ...introText, paragraph_2: e.target.value })}
              placeholder="Alapértelmezett: Kompakt kialakításának köszönhetően..."
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">"Tudta?" szöveg (opcionális)</label>
            <textarea
              className="form-input"
              value={introText.tudta}
              onChange={(e) => setIntroText({ ...introText, tudta: e.target.value })}
              placeholder={`Alapértelmezett: "A ${productInfo.gyarto || '[Gyártó]'} az egyik legmegbízhatóbb európai légtechnikai gyártó."`}
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>
      </div>

      {/* USP Input Cards */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
            USP-k ({filledUspCount}/7)
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Min. 3, max. 7
            </span>
            {usps.length < 7 && (
              <button className="btn btn-secondary" onClick={addUsp}>
                + USP hozzáadása
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {usps.map((usp, index) => (
            <div
              key={usp.id}
              style={{
                padding: 'var(--space-md)',
                background: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>USP #{index + 1}</h3>
                <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => moveUsp(index, 'up')}
                    disabled={index === 0}
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  >
                    ↑
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => moveUsp(index, 'down')}
                    disabled={index === usps.length - 1}
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  >
                    ↓
                  </button>
                  {usps.length > 3 && (
                    <button
                      className="btn btn-danger"
                      onClick={() => removeUsp(index)}
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Cím *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={usp.title}
                    onChange={(e) => updateUsp(index, 'title', e.target.value)}
                    placeholder="pl. Ultrahalk működés"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">1. bekezdés *</label>
                  <textarea
                    className="form-input"
                    value={usp.paragraph_1}
                    onChange={(e) => updateUsp(index, 'paragraph_1', e.target.value)}
                    placeholder="Az első bekezdés szövege..."
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">2. bekezdés (opcionális)</label>
                  <textarea
                    className="form-input"
                    value={usp.paragraph_2}
                    onChange={(e) => updateUsp(index, 'paragraph_2', e.target.value)}
                    placeholder="A második bekezdés szövege..."
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kép URL *</label>
                  <input
                    type="url"
                    className="form-input"
                    value={usp.image_url}
                    onChange={(e) => updateUsp(index, 'image_url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kép alt szöveg *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={usp.image_alt}
                    onChange={(e) => updateUsp(index, 'image_alt', e.target.value)}
                    placeholder="pl. Halk ventilátor működés közben"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      {!htmlOutput && (
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <button
            className="btn btn-primary"
            onClick={generateHtml}
            disabled={!isFormValid()}
            style={{ width: '100%' }}
          >
            HTML generálása
          </button>
          {!isFormValid() && (
            <p style={{ margin: 'var(--space-sm) 0 0', fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              Töltsd ki a termék nevét, gyártót és legalább 3 USP-t
            </p>
          )}
        </div>
      )}

      {/* Output */}
      {htmlOutput && (
        <>
          {/* Short description */}
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Rövid leírás</h3>
              <button
                className={`btn btn-secondary copy-btn ${copied ? 'copied' : ''}`}
                onClick={() => copyToClipboard(rovidLeiras)}
              >
                Másolás
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
                  Előnézet
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
                onClick={() => copyToClipboard(htmlOutput)}
              >
                HTML másolása
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
                  dangerouslySetInnerHTML={{ __html: htmlOutput }}
                />
              ) : (
                <pre className="html-preview-code">{htmlOutput}</pre>
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
              HTML kész!
            </h3>
            <p style={{ margin: '0 0 var(--space-md)', fontSize: '0.875rem' }}>
              Másold ki a HTML kódot és illeszd be az Unas termékleírás mezőjébe.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button
                className="btn btn-success"
                onClick={() => copyToClipboard(htmlOutput)}
              >
                HTML másolása az Unas-ba
              </button>
              <button
                className="btn btn-secondary"
                onClick={resetForm}
              >
                Új termék
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
