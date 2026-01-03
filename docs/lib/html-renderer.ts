/**
 * Ventilátorház HTML Renderer
 * 
 * Generates final HTML from skeleton templates + product data
 * Output is minified (no whitespace) for Unas compatibility
 */

// ============================================
// LAKOSSÁGI TEMPLATE RENDERER
// ============================================

export function renderLakossagi(data: LakossagiData): string {
  const parts: string[] = [];

  // Container start
  parts.push('<div class="termekoldal-container">');

  // INTRO SECTION
  parts.push('<div class="intro-video-section">');
  
  // Video column (if video exists)
  if (data.intro.youtube_embed_url) {
    parts.push(`<div class="intro-video-col"><div class="video-wrapper"><iframe src="${data.intro.youtube_embed_url}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen=""></iframe></div></div>`);
  }
  
  // Text column
  parts.push(`<div class="intro-text-col"><h3>${escapeHtml(data.intro.headline)}</h3><p>${data.intro.intro_paragraph_1}</p><p>${data.intro.intro_paragraph_2}</p></div>`);
  parts.push('</div>');

  // GYÁRI ADATLAP SECTION
  parts.push('<div class="gyariadatlap-container"><div class="gyariadatlap-box">');
  parts.push('<div class="gyariadatlap-left"><h2>Gyári adatlap</h2><p>A ventilátor hivatalos, gyártói adatlapja tartalmazza az összes fontos műszaki adatot – teljesítmény-, nyomás- és zajszinteket, méreteket, valamint szerelési információkat. Hasznos segítség villanyszerelőknek, építészeknek vagy bárkinek, aki pontos technikai információt szeretne a beszereléshez.</p>');
  parts.push(`<a href="${data.gyari_adatlap.pdf_url}" class="gyariadatlap-btn" target="_blank">A gyári adatlap letöltése</a></div>`);
  parts.push(`<div class="gyariadatlap-right"><img src="${data.gyari_adatlap.meretrajz_url}" alt="${escapeHtml(data.gyari_adatlap.meretrajz_alt)}"></div>`);
  parts.push('</div>');

  // TUDTA SECTION
  parts.push(`<div class="tudta"><div class="tudta-ikon">i</div><div class="tudta-tartalom"><p><strong>Tudta?</strong> ${escapeHtml(data.tudta.tudta_text)}</p></div></div>`);
  parts.push('</div>');

  // VENTILÁTORHÁZ BEMUTATKOZÓ (fixed)
  parts.push(FIXED_VENTILATORHAZ_BEMUTATKOZO);

  // TRUSTINDEX (fixed)
  parts.push(FIXED_TRUSTINDEX);

  // MIÉRT AJÁNLJUK HEADER (fixed)
  parts.push(FIXED_MIERT_AJANJUK_HEADER);

  // USP BLOCKS
  data.usp_blocks.forEach((usp, index) => {
    const isLast = index === data.usp_blocks.length - 1;
    const style = isLast ? ' style="border-bottom: none;"' : '';
    
    parts.push(`<div class="feature-row"${style}>`);
    parts.push(`<div class="feature-col feature-image"><img src="${usp.image_url}" alt="${escapeHtml(usp.image_alt)}" style="width: 100%; display: block; border-radius: 8px;"></div>`);
    parts.push(`<div class="feature-col feature-text"><h3>${escapeHtml(usp.title)}</h3><p>${usp.paragraph_1}</p>`);
    if (usp.paragraph_2) {
      parts.push(`<p>${usp.paragraph_2}</p>`);
    }
    parts.push('</div></div>');
  });

  // Container end
  parts.push('</div>');

  return parts.join('');
}


// ============================================
// IPARI TEMPLATE RENDERER
// ============================================

export function renderIpari(data: IpariData): string {
  const parts: string[] = [];

  // Container start
  parts.push('<div class="termekoldal-container">');

  // INTRO SECTION
  parts.push('<div class="intro-video-section">');
  
  if (data.intro.youtube_embed_url) {
    parts.push(`<div class="intro-video-col"><div class="video-wrapper"><iframe src="${data.intro.youtube_embed_url}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen=""></iframe></div></div>`);
  }
  
  parts.push(`<div class="intro-text-col"><h3>${escapeHtml(data.intro.headline)}</h3><p>${data.intro.intro_paragraph_1}</p><p>${data.intro.intro_paragraph_2}</p></div>`);
  parts.push('</div>');

  // GYÁRI ADATLAP SECTION
  parts.push('<div class="gyariadatlap-container"><div class="gyariadatlap-box">');
  parts.push(`<div class="gyariadatlap-left"><h2>Gyári adatlap</h2><p>A ${escapeHtml(data.gyari_adatlap.termek_nev)} hivatalos, gyártói adatlapja tartalmazza az összes fontos műszaki adatot – teljesítmény-, nyomás- és zajszinteket, méreteket, valamint szerelési információkat. Hasznos segítség villanyszerelőknek, építészeknek vagy bárkinek, aki pontos technikai információt szeretne a beszereléshez.</p>`);
  parts.push(`<a href="${data.gyari_adatlap.pdf_url}" class="gyariadatlap-btn" target="_blank">A gyári adatlap letöltése</a></div>`);
  parts.push(`<div class="gyariadatlap-right"><img src="${data.gyari_adatlap.meretrajz_url}" alt="${escapeHtml(data.gyari_adatlap.meretrajz_alt)}"></div>`);
  parts.push('</div>');

  // TUDTA SECTION
  parts.push(`<div class="tudta"><div class="tudta-ikon">i</div><div class="tudta-tartalom"><p><strong>Tudta?</strong> ${escapeHtml(data.tudta.tudta_text)}</p></div></div>`);
  parts.push('</div>');

  // MŰSZAKI ADATOK TÁBLÁZAT
  if (data.muszaki_adatok) {
    parts.push(renderMuszakiAdatokTable(data.muszaki_adatok));
  }

  // JELLEGGÖRBÉK
  if (data.jelleggorbek && data.jelleggorbek.curves.length > 0) {
    parts.push(renderJelleggorbek(data.jelleggorbek));
  }

  // VENTILÁTORHÁZ BEMUTATKOZÓ (fixed)
  parts.push(FIXED_VENTILATORHAZ_BEMUTATKOZO);

  // TRUSTINDEX (fixed)
  parts.push(FIXED_TRUSTINDEX);

  // MIÉRT AJÁNLJUK HEADER (fixed)
  parts.push(FIXED_MIERT_AJANJUK_HEADER);

  // USP BLOCKS
  data.usp_blocks.forEach((usp, index) => {
    const isLast = index === data.usp_blocks.length - 1;
    const style = isLast ? ' style="border-bottom: none;"' : '';
    
    parts.push(`<div class="feature-row"${style}>`);
    parts.push(`<div class="feature-col feature-image"><img src="${usp.image_url}" alt="${escapeHtml(usp.image_alt)}" style="width: 100%; display: block; border-radius: 8px;"></div>`);
    parts.push(`<div class="feature-col feature-text"><h3>${escapeHtml(usp.title)}</h3><p>${usp.paragraph_1}</p>`);
    if (usp.paragraph_2) {
      parts.push(`<p>${usp.paragraph_2}</p>`);
    }
    parts.push('</div></div>');
  });

  // FAQ SECTION
  if (data.faq && data.faq.questions.length > 0) {
    parts.push(renderFaq(data.faq));
  }

  // Container end
  parts.push('</div>');

  return parts.join('');
}


// ============================================
// HELPER RENDERERS
// ============================================

function renderMuszakiAdatokTable(data: MuszakiAdatok): string {
  const parts: string[] = [];
  
  parts.push(`<div class="ventilator-table-section" id="muszaki-adatok">`);
  parts.push(`<h2 class="section-title">${escapeHtml(data.table_title || 'Műszaki adatok')}</h2>`);
  parts.push(`<p class="section-subtitle">${escapeHtml(data.table_subtitle || 'Az összes változat részletes specifikációja')}</p>`);
  parts.push('<div class="ventilator-table-scroll"><table class="ventilator-data-table">');
  
  // Header row
  parts.push('<thead><tr><th colspan="2">Paraméter</th>');
  data.variants.forEach(variant => {
    parts.push(`<th>${escapeHtml(variant)}</th>`);
  });
  parts.push('</tr></thead>');
  
  // Body rows
  parts.push('<tbody>');
  data.rows.forEach(row => {
    const rowClass = row.highlight ? ' class="highlight-row"' : '';
    parts.push(`<tr${rowClass}><th>${escapeHtml(row.name)}</th><td class="unit">${escapeHtml(row.unit)}</td>`);
    
    if (row.common_value) {
      // Colspan for common values
      parts.push(`<td colspan="${data.variants.length}">${escapeHtml(row.common_value)}</td>`);
    } else {
      // Per-variant values
      row.values.forEach(value => {
        parts.push(`<td>${escapeHtml(String(value))}</td>`);
      });
    }
    parts.push('</tr>');
  });
  parts.push('</tbody>');
  
  // Dimension rows (if any)
  if (data.dimension_rows && data.dimension_rows.length > 0) {
    parts.push('<tbody class="dimension-rows">');
    data.dimension_rows.forEach(row => {
      parts.push(`<tr><th>${escapeHtml(row.name)}</th><td class="unit">${escapeHtml(row.unit)}</td>`);
      row.values.forEach(value => {
        parts.push(`<td>${escapeHtml(String(value))}</td>`);
      });
      parts.push('</tr>');
    });
    parts.push('</tbody>');
  }
  
  parts.push('</table></div></div>');
  
  return parts.join('');
}

function renderJelleggorbek(data: Jelleggorbek): string {
  const parts: string[] = [];
  
  parts.push('<div class="jelleggorbe-section" id="jelleggorbek">');
  parts.push(`<h2 class="section-title">${escapeHtml(data.section_title || 'Jelleggörbék')}</h2>`);
  parts.push(`<p class="section-subtitle">${escapeHtml(data.section_subtitle || 'Kattintson a képre a nagyításhoz')}</p>`);
  parts.push('<div class="jelleggorbe-galeria">');
  
  data.curves.forEach(curve => {
    parts.push('<div class="jelleggorbe-kep-container">');
    parts.push(`<a href="${curve.image_url}" data-lightbox="jelleggorbek" data-title="${escapeHtml(curve.title)}" class="jelleggorbe-kep-link">`);
    parts.push(`<img src="${curve.image_url}" alt="${escapeHtml(curve.alt)}" class="jelleggorbe-kep" /></a>`);
    parts.push(`<p class="jelleggorbe-kep-leiras">${escapeHtml(curve.title)}</p>`);
    parts.push('</div>');
  });
  
  parts.push('</div></div>');
  
  return parts.join('');
}

function renderFaq(data: FaqData): string {
  const parts: string[] = [];
  
  // FAQ HTML
  parts.push('<div class="termekgyik">');
  parts.push(`<h2 class="termekgyik-cim">${escapeHtml(data.section_title || 'Gyakran Ismételt Kérdések')}</h2>`);
  
  data.questions.forEach(q => {
    parts.push('<div class="termekgyik-item">');
    parts.push(`<button type="button" class="termekgyik-kerdes" aria-expanded="false" onclick="event.preventDefault(); document.querySelectorAll('.termekgyik-kerdes').forEach(b => { if(b !== this) b.setAttribute('aria-expanded', 'false'); }); this.setAttribute('aria-expanded', this.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');">`);
    parts.push(`<span>${escapeHtml(q.question)}</span>`);
    parts.push('<svg class="termekgyik-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>');
    parts.push('</button>');
    parts.push(`<div class="termekgyik-valasz"><p>${escapeHtml(q.answer)}</p></div>`);
    parts.push('</div>');
  });
  
  parts.push('</div>');
  
  // FAQ Schema markup
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": data.questions.map(q => ({
      "@type": "Question",
      "name": q.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.answer
      }
    }))
  };
  
  parts.push(`<script type="application/ld+json">${JSON.stringify(schemaData)}</script>`);
  
  return parts.join('');
}


// ============================================
// FIXED SECTIONS
// ============================================

const FIXED_VENTILATORHAZ_BEMUTATKOZO = `<div class="ventilatorhaz-bemutatkozo"><div class="ventilatorhaz-bemutatkozo-kep"><img src="https://shop.unas.hu/shop_ordered/55564/pic/nemesventilatorhaz-csapata.webp" alt="A Nemes Ventilátorház csapata"></div><div class="ventilatorhaz-bemutatkozo-szoveg"><h2>Vásároljon Magyarország egyik legmegbízhatóbb légtechnikai áruházából</h2><p>A Ventilátorház a Budapest 18. kerületében, a Királyhágó utca 30. található. Sokszoros díjnyertes cég vagyunk, több évtizedes tapasztalattal és hibátlan véleményekkel. Ha kérdése van, hívja munkatársainkat bizalommal a <strong>+36-70-369-9944</strong> telefonszámon!</p><div class="ventilatorhaz-gombok"><a href="https://www.nemesventilatorhaz.hu/visszahivaskero" class="ventilatorhaz-btn ventilatorhaz-btn-callback">Ingyenes tanácsadást kérek</a><a href="tel:+36703699944" class="ventilatorhaz-btn ventilatorhaz-btn-call">Felhívom most</a></div></div></div>`;

const FIXED_TRUSTINDEX = `<script defer async src='https://cdn.trustindex.io/loader.js?cbff376529ad876c29862863c17'></script>`;

const FIXED_MIERT_AJANJUK_HEADER = `<div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #333; margin-bottom: 20px;"><h1 style="margin: 0;">Miért ajánljuk?</h1></div>`;


// ============================================
// UTILITIES
// ============================================

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}


// ============================================
// TYPE DEFINITIONS
// ============================================

export interface LakossagiData {
  intro: {
    youtube_embed_url?: string;
    headline: string;
    intro_paragraph_1: string;
    intro_paragraph_2: string;
  };
  gyari_adatlap: {
    pdf_url: string;
    meretrajz_url: string;
    meretrajz_alt: string;
  };
  tudta: {
    tudta_text: string;
  };
  usp_blocks: UspBlock[];
}

export interface IpariData {
  intro: {
    youtube_embed_url?: string;
    headline: string;
    intro_paragraph_1: string;
    intro_paragraph_2: string;
  };
  gyari_adatlap: {
    termek_nev: string;
    pdf_url: string;
    meretrajz_url: string;
    meretrajz_alt: string;
  };
  tudta: {
    tudta_text: string;
  };
  muszaki_adatok?: MuszakiAdatok;
  jelleggorbek?: Jelleggorbek;
  usp_blocks: UspBlock[];
  faq?: FaqData;
}

export interface UspBlock {
  image_url: string;
  image_alt: string;
  title: string;
  paragraph_1: string;
  paragraph_2?: string;
}

export interface MuszakiAdatok {
  table_title?: string;
  table_subtitle?: string;
  variants: string[];
  rows: TableRow[];
  dimension_rows?: TableRow[];
}

export interface TableRow {
  name: string;
  unit: string;
  highlight?: boolean;
  common_value?: string;
  values: (string | number)[];
}

export interface Jelleggorbek {
  section_title?: string;
  section_subtitle?: string;
  curves: {
    image_url: string;
    title: string;
    alt: string;
  }[];
}

export interface FaqData {
  section_title?: string;
  questions: {
    question: string;
    answer: string;
  }[];
}
