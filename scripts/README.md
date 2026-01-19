# Product Link Collector 🔗

Automatikusan gyűjt **3 linket minden termékhez** a gyártói oldalról Gemini API segítségével.

## 🎯 Mit csinál?

Minden termékhez megkeresi:
1. **PDF adatlap** (datasheet/műszaki dokumentáció)
2. **Termékoldal** a gyártó weboldalán
3. **További releváns link** (pl. installation guide, katalógus)

Mind a 3 link a **gyártó hivatalos weboldaláról** származik, angol vagy magyar nyelven.

---

## 🚀 Használat

### 1. API kulcs beállítása

A script **Gemini API-t** használ Google kereséssel. API kulcs szükséges!

```bash
export GEMINI_API_KEY="your-api-key-here"
```

**API kulcs beszerzése:**
1. Menj a https://aistudio.google.com/apikey oldalra
2. Hozz létre egy új API kulcsot (ingyenes)
3. Állítsd be a környezeti változót

### 2. Terméklista készítése

Szerkeszd a `products.txt` fájlt:

```
ELIX 100 | Elicent
ER 100 | Maico
AERO 100 | Blauberg
...
```

**Formátum:** `Termék Név | Gyártó` (soronként egy termék)

### 3. Futtatás

```bash
cd scripts/

# Alapértelmezett: products.txt -> product-links.json
npx ts-node collect-product-links.ts

# Saját fájlokkal
npx ts-node collect-product-links.ts my-products.txt my-output.json
```

### 4. Eredmény

```json
{
  "totalProducts": 20,
  "successCount": 19,
  "failureCount": 1,
  "products": [
    {
      "product": "ELIX 100",
      "manufacturer": "Elicent",
      "links": [
        {
          "url": "https://www.elicent.it/content/uploads/2023/ELIX-100.pdf",
          "title": "ELIX 100 Datasheet",
          "type": "pdf"
        },
        {
          "url": "https://www.elicent.it/en/products/elix-100/",
          "title": "ELIX 100 Product Page",
          "type": "page"
        },
        {
          "url": "https://www.elicent.it/en/catalog-2023/",
          "title": "Elicent Catalog 2023",
          "type": "page"
        }
      ],
      "timestamp": "2026-01-19T12:00:00.000Z"
    }
  ],
  "generatedAt": "2026-01-19T12:05:00.000Z"
}
```

---

## 📊 Példa futtatás

```
🚀 Product Link Collector
=========================

✅ GEMINI_API_KEY megtalálva

📋 20 termék betöltve a products.txt fájlból

[1/20]
🔍 Keresés: Elicent ELIX 100
  📡 Gemini API keresés (3 link gyártói oldalról)...
  ✅ Találat: 3 link
     📄 https://www.elicent.it/content/uploads/2023/ELIX-100.pdf
     🔗 https://www.elicent.it/en/products/elix-100/
     🔗 https://www.elicent.it/en/downloads/

[2/20]
🔍 Keresés: Maico ER 100
  📡 Gemini API keresés (3 link gyártói oldalról)...
  ✅ Találat: 3 link
     📄 https://www.maico-ventilatoren.com/media/pdf/er-100.pdf
     🔗 https://www.maico-ventilatoren.com/en/products/er-100/
     🔗 https://www.maico-ventilatoren.com/en/catalog/

...

📊 Összegzés
============
Összes termék: 20
Sikeres:      19 (95%)
Sikertelen:   1

💾 Eredmény mentve: product-links.json
```

---

## ⚙️ Hogyan működik?

1. **Beolvassa** a terméklistát a text fájlból
2. **Egyesével** feldolgozza a termékeket (20 termék = 1 futtatás!)
3. Minden terméknél:
   - Gemini API-t hív Google Search Grounding-gal
   - Megkeresi a 3 legfontosabb linket a gyártó oldaláról
   - Prioritás: PDF adatlap > termékoldal > egyéb dok
4. **Összes eredményt** egy JSON fájlba menti

**Rate limiting:** 1 másodperc várakozás minden keresés között (API védelem)

---

## 🛠️ Telepítés

Ha még nincs `ts-node`:

```bash
npm install --save-dev ts-node @types/node
```

---

## 🎯 Tippek

✅ **Pontos terméknév:** Minél pontosabb, annál jobb a találat
✅ **Hivatalos gyártó név:** Használd a gyártó hivatalos nevét
✅ **20 termék egyszerre:** Egy futtatással mind feldolgozva
✅ **Angol/magyar:** A script mindkét nyelvet preferálja

---

## 🐛 Hibaelhárítás

**"GEMINI_API_KEY nincs beállítva"**
```bash
export GEMINI_API_KEY="your-key-here"
```

**"Hibás sor (hiányzó gyártó?)"**
- Formátum: `Termék Név | Gyártó`
- Vigyázz a `|` karakter helyére

**"Gemini API hiba"**
- Ellenőrizd az API kulcs érvényességét
- Rate limit: max 60 kérés/perc (a script automatikusan vár)

**"Nincs találat"**
- Lehet hogy a termék nem létezik
- Vagy nem található a gyártó oldalán
- Próbáld pontosabb terméknévvel

---

## 📄 Fájlok

```
scripts/
├── collect-product-links.ts  # Fő script (csak Gemini API)
├── products.txt              # Input (20 termék példa)
├── product-links.json        # Output (generálva)
└── README.md                 # Ez a fájl
```

---

## ✨ Újdonságok ebben a verzióban

- ✅ **Csak Gemini API** - nincs fallback URL pattern mód
- ✅ **Pontosan 3 link/termék** - mindig gyártói forrásból
- ✅ **Angol/magyar** nyelv preferencia
- ✅ **Egyszerűbb kimenet** - egyetlen `links` tömb
- ✅ **PDF prioritás** - adatlapok elsőbbséget kapnak

---

**Kérdés vagy probléma?** Nézd meg a script kódját vagy nyiss issue-t!
