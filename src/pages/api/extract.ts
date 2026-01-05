import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import type { ExtractedData, ProductData } from '../../lib/types';

export const prerender = false;

const client = new Anthropic();

interface ExtractRequest {
  termekNev: string;
  gyarto: string;
  kategoria: ProductData['kategoria'];
  pdfUrl?: string;
  arFt?: number;
}

const EXTRACTION_PROMPT = `Te egy szakértő termékadatlap elemző vagy. A feladatod, hogy kinyerd a ventilátor termék műszaki adatait az adatlapból.

A következő mezőket keresd:

KÖTELEZŐ (próbáld megtalálni):
- zajszint_db: Zajszint decibelben (dB vagy dB(A))
- legszallitas_m3h: Légszállítás m³/h-ban
- teljesitmeny_w: Teljesítményfelvétel wattban
- ip_vedelem: IP védettségi besorolás (pl. IP44, IPX4, IP65)
- csoatmero_mm: Csőátmérő mm-ben (gyakran a terméknévben van, pl. "100" a 100mm-es csőhöz)

OPCIONÁLIS (ha megtalálod):
- nyomas_pa: Nyomás Pascal-ban (Pa)
- csapagy_tipus: "golyóscsapágy" vagy "siklócsapágy" (keress: ball bearing, golyóscsapágy, hosszú élettartam csapágy)
- visszacsapo_szelep: true/false (van-e visszacsapó szelep)
- elettartam_ora: Élettartam órában
- aramfelvetel_a: Áramfelvétel amperban
- fordulatszam_rpm: Fordulatszám RPM-ben
- funkciok: tömb ezekből: "alapjárat", "időrelé", "páraérzékelő", "mozgásérzékelő", "légminőség-érzékelő"
- konnyu_tisztitas: true ha említik a könnyű tisztíthatóságot
- antisztatikus: true ha antisztatikus műanyag
- fedett_lapat: true ha fedett/takarólapátos kialakítás
- min_uzemi_homerseklet: Minimum üzemi hőmérséklet °C
- max_uzemi_homerseklet: Maximum üzemi hőmérséklet °C

Minden mezőhöz add meg:
1. A kinyert értéket
2. A státuszt:
   - "biztos": Az érték explicit szerepel az adatlapon
   - "kovetkeztetett": Az értéket logikailag következtetted (pl. "Long Life csapágy" → golyóscsapágy)
   - "hianyzo": Nem található az adatlapon
3. A forrást: Hol találtad (pl. "Műszaki adatok táblázat", "1. oldal fejléc")

VÁLASZOLJ KIZÁRÓLAG VALID JSON FORMÁTUMBAN, semmilyen más szöveget ne írj:
{
  "extracted": [
    { "field": "zajszint_db", "value": 32, "status": "biztos", "source": "Műszaki adatok táblázat" },
    ...
  ],
  "warnings": ["opcionális figyelmeztetések, ha vannak"]
}`;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: ExtractRequest = await request.json();
    const { termekNev, gyarto, kategoria, pdfUrl, arFt } = body;

    if (!termekNev || !gyarto || !kategoria) {
      return new Response(JSON.stringify({
        error: 'Hiányzó kötelező mezők: termekNev, gyarto, kategoria'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Alapadatok, amiket mindig hozzáadunk
    const baseData: ExtractedData[] = [
      { field: 'termek_nev', value: termekNev, status: 'biztos' },
      { field: 'gyarto', value: gyarto, status: 'biztos' },
      { field: 'kategoria', value: kategoria, status: 'biztos' },
    ];

    if (arFt) {
      baseData.push({ field: 'ar_ft', value: arFt, status: 'biztos', source: 'Felhasználói input' });
    }

    // Ha nincs PDF URL, csak az alapadatokat adjuk vissza
    if (!pdfUrl) {
      return new Response(JSON.stringify({
        extracted_data: baseData,
        warnings: ['Nincs PDF URL megadva - csak az alapadatok kerültek mentésre. Add meg a műszaki adatokat manuálisan.']
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // URL tartalom lekérése
    try {
      const pdfResponse = await fetch(pdfUrl);
      if (!pdfResponse.ok) {
        throw new Error(`Adatlap letöltés sikertelen: ${pdfResponse.status}`);
      }

      const contentType = pdfResponse.headers.get('content-type') || '';
      const isPdf = contentType.includes('application/pdf') || pdfUrl.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        // PDF feldolgozás base64 kódolással
        const pdfBuffer = await pdfResponse.arrayBuffer();
        const uint8Array = new Uint8Array(pdfBuffer);
        let binary = '';
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        const base64Pdf = btoa(binary);

        const message = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'document',
                  source: {
                    type: 'base64',
                    media_type: 'application/pdf',
                    data: base64Pdf,
                  },
                } as any,
                {
                  type: 'text',
                  text: `${EXTRACTION_PROMPT}\n\nTermék: ${termekNev}\nGyártó: ${gyarto}\nKategória: ${kategoria}`
                }
              ],
            }
          ],
        });

        const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Nem sikerült JSON-t kinyerni a válaszból');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        const extractedFromPdf: ExtractedData[] = parsed.extracted || [];

        return new Response(JSON.stringify({
          extracted_data: [...baseData, ...extractedFromPdf],
          warnings: parsed.warnings || []
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      } else {
        // HTML vagy más szöveges formátum
        const pageContent = await pdfResponse.text();

        // Claude API hívás
        const message = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: `${EXTRACTION_PROMPT}\n\nTermék: ${termekNev}\nGyártó: ${gyarto}\nKategória: ${kategoria}\n\nAdatlap tartalma:\n${pageContent.substring(0, 15000)}`
            }
          ],
        });

        const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

        // JSON parse
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Nem sikerült JSON-t kinyerni a válaszból');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        const extractedFromPdf: ExtractedData[] = parsed.extracted || [];

        return new Response(JSON.stringify({
          extracted_data: [...baseData, ...extractedFromPdf],
          warnings: parsed.warnings || []
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

    } catch (fetchError) {
      console.error('Feldolgozási hiba:', fetchError);
      return new Response(JSON.stringify({
        extracted_data: baseData,
        warnings: [`Feldolgozás sikertelen: ${fetchError instanceof Error ? fetchError.message : 'Ismeretlen hiba'}. Add meg az adatokat manuálisan.`]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('API hiba:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Ismeretlen hiba történt'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
