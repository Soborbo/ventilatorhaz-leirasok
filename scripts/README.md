# Product Link Collector 🔗

Egyszerű script, ami terméklistából automatikusan gyűjti össze:
- PDF adatlapok (datasheet) linkjeit
- Gyártói termékoldal linkjeit

## 🚀 Gyors használat

### 1. Készítsd el a terméklistát

Hozz létre egy `products.txt` fájlt a `scripts/` mappában:

```
ELIX 100 | Elicent
ER 100 | Maico
AERO 100 | Blauberg
...
```

**Formátum:** `Termék Név | Gyártó` (soronként egy termék)

### 2. Futtasd a scriptet

```bash
cd scripts/

# TypeScript közvetlenül (ts-node szükséges)
npx ts-node collect-product-links.ts

# Vagy saját input/output fájlokkal
npx ts-node collect-product-links.ts my-products.txt my-output.json
```

### 3. Eredmény

A script létrehoz egy `product-links.json` fájlt:

```json
{
  "totalProducts": 20,
  "successCount": 18,
  "failureCount": 2,
  "products": [
    {
      "product": "ELIX 100",
      "manufacturer": "Elicent",
      "pdfLinks": [
        "https://www.elicent.it/content/uploads/2023/ELIX-100.pdf"
      ],
      "manufacturerPageLinks": [
        "https://www.elicent.it/en/products/elix-100/"
      ],
      "timestamp": "2026-01-19T12:00:00.000Z"
    },
    ...
  ],
  "generatedAt": "2026-01-19T12:05:00.000Z"
}
```

## 🔑 Gemini API használata (opcionális, de ajánlott)

A script **két módban** működik:

### 1. **Gemini API mód** (ajánlott) - Valós Google keresés

Ha beállítasz egy Gemini API kulcsot, a script valós Google kereséssel találja meg a linkeket.

```bash
export GEMINI_API_KEY="your-api-key-here"
npx ts-node collect-product-links.ts
```

**Előnyök:**
- ✅ Valódi, létező linkeket talál
- ✅ Pontosabb találatok
- ✅ Több gyártót támogat (nem csak a beépített pattern-eket)

**API kulcs beszerzése:**
1. Menj a https://aistudio.google.com/apikey oldalra
2. Hozz létre egy új API kulcsot
3. Állítsd be: `export GEMINI_API_KEY="..."`

### 2. **Pattern mód** (fallback) - URL pattern alapú

Ha nincs API kulcs, a script URL pattern-ek alapján generál lehetséges linkeket.

**Figyelem:**
- ⚠️ Ezek NEM ellenőrzött linkek
- ⚠️ Lehet, hogy a linkek nem léteznek
- ⚠️ Manuálisan kell ellenőrizni őket

## 📋 Támogatott gyártók

A script a következő gyártókat ismeri (pattern mód):

- **Elicent** (elicent.it)
- **Maico** (maico-ventilatoren.com)
- **Blauberg** (blaubergvento.de)
- **Vents** (ventilation-system.com)
- **Awenta** (awenta.pl)
- **Helios** (heliosventilatoren.de)
- **Vortice** (vortice.com)

**Gemini API móddal** bármilyen gyártó működik!

## 🛠️ Telepítés

Ha a projektben még nincs `ts-node`:

```bash
npm install --save-dev ts-node @types/node
```

## 📝 Példa kimenet

```
🚀 Product Link Collector
=========================

📋 20 termék betöltve a products.txt fájlból

✅ GEMINI_API_KEY megtalálva - Google keresés engedélyezve

[1/20]
🔍 Keresés: Elicent ELIX 100
  📡 Gemini API keresés...
  ✅ Találat: 2 PDF, 1 oldal

[2/20]
🔍 Keresés: Maico ER 100
  📡 Gemini API keresés...
  ✅ Találat: 1 PDF, 1 oldal

...

📊 Összegzés
============
Összes termék: 20
Sikeres:      18 (90%)
Sikertelen:   2

💾 Eredmény mentve: product-links.json
```

## 🎯 Tippek

1. **Legyen pontos a terméknév:** Minél pontosabb a terméknév, annál jobb a találat
2. **Gyártó neve:** Használd a hivatalos gyártó nevet (pl. "Elicent", nem "elicent spa")
3. **API kulcs:** Gemini API-val sokkal jobb eredményeket kapsz
4. **Rate limiting:** A script 1 másodpercet vár minden keresés között (API limit védelem)

## 🐛 Hibaelhárítás

**"GEMINI_API_KEY nincs beállítva"**
- Állítsd be a környezeti változót: `export GEMINI_API_KEY="..."`

**"Nincs pattern X gyártóhoz"**
- Használj Gemini API-t, az minden gyártóval működik
- Vagy add hozzá a gyártót a `MANUFACTURER_PATTERNS`-hez

**"Hibás sor (hiányzó gyártó?)"**
- Ellenőrizd a formátumot: `Termék Név | Gyártó`
- Vigyázz a `|` karakter helyére

## 📄 Fájlok

```
scripts/
├── collect-product-links.ts  # Fő script
├── products.txt              # Input példa (20 termék)
├── product-links.json        # Output (generálva)
└── README.md                 # Ez a fájl
```

## 🔄 Workflow

1. Szerkeszd a `products.txt` fájlt (add hozzá a termékeket)
2. Futtasd: `npx ts-node collect-product-links.ts`
3. Nézd meg az eredményt: `product-links.json`
4. Használd fel a linkeket (pl. másold be táblázatba, stb.)

---

**Kérdés?** Nézd meg a script kódját vagy futtasd `--help` opcióval (soon™).
