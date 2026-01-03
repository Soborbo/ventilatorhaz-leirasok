# Ventilátorház Termékleírás Generátor

## Áttekintés

Ez a csomag tartalmazza a Nemes Ventilátorház webshop termékleírás generáló rendszerének összes komponensét.

## Mappastruktúra

```
ventilatorhaz_complete/
├── README.md                    # Ez a fájl
├── data/                        # Adatfájlok (JSON)
│   ├── benchmark.json           # Kategória benchmark táblázatok
│   ├── usp-library.json         # USP könyvtár feltételekkel
│   ├── gyartok.json             # Gyártó karakterlapok
│   └── style-rules.json         # Stílus szabályok
├── templates/                   # HTML skeleton-ok
│   ├── skeleton-lakossagi.json  # Fürdőszoba/kishelyiség sablon
│   └── skeleton-ipari.json      # Ipari/csőventilátor sablon
├── lib/                         # TypeScript/JavaScript kód
│   └── html-renderer.ts         # HTML generáló függvények
└── project_knowledge/           # Claude Project Knowledge fájlok
    ├── MASTER_WORKFLOW.md       # Fő workflow prompt
    ├── BENCHMARK.md             # Benchmark táblázatok (olvasható)
    ├── USP_KONYVTAR.md          # USP könyvtár (olvasható)
    ├── STILUSSZABALYOK.md       # Stílus szabályok (olvasható)
    ├── HTML_SABLON.md           # HTML sablon dokumentáció
    └── GYORS_REFERENCIA.md      # Gyors referencia kártya
```

## Használat

### 1. Chat-alapú workflow (Claude.ai Project)

1. Hozz létre új Claude Project-et
2. Töltsd fel a `project_knowledge/` mappa összes fájlját
3. Használd a MASTER_WORKFLOW.md szerinti promptokat

### 2. App fejlesztés (Astro + Claude API)

1. A `data/` mappából töltsd be a JSON fájlokat
2. Használd a `lib/html-renderer.ts` függvényeket
3. A `templates/` skeleton-ok alapján építsd fel a UI-t

## Workflow fázisok

### Fázis 1: Adat extrakció
- PDF feltöltés/URL megadás
- AI kiszedi a műszaki adatokat
- Státusz: ✓ BIZTOS / ⚠️ KÖVETKEZTETETT / ❌ HIÁNYZIK

### Fázis 2: Relatív pozicionálás
- Összehasonlítás a benchmark táblázattal
- Kategória meghatározás (halk/átlagos/zajos, stb.)
- Kiemelkedő tulajdonságok azonosítása

### Fázis 3: USP kiválasztás
- Automatikus USP matching feltételek alapján
- Manuális felülírás lehetősége
- Állítás-ellenőrzés

### Fázis 4: Szöveg generálás
- Rövid leírás (2-3 mondat)
- HTML leírás (whitespace nélkül!)
- FAQ + Schema markup (ipari termékekhez)

## Sablon típusok

### Lakossági (skeleton-lakossagi.json)
- Fürdőszoba, WC, kishelyiség ventilátorok
- Egyszerűbb struktúra
- USP-fókuszú

### Ipari (skeleton-ipari.json)
- Csőventilátorok, radiális, ipari
- Műszaki adatok táblázat (több változat)
- Jelleggörbék szekció
- FAQ + Schema markup

## Fontos szabályok

### TILOS
- Általános marketingfrázisok ("kiváló választás", "prémium minőség")
- Abszolút állítások ("halk", "energiatakarékos") számok nélkül
- Kitalált adatok
- "valószínűleg", "általában", "tipikusan"

### KÖTELEZŐ
- Relatív pozicionálás (X%-kal jobb az átlagnál)
- Számadatok kontextusban
- Terméknév 4-6x említése
- Whitespace-mentes HTML output

## API költség becslés

~400 termékre:
- Claude API: ~$20-40
- Átlag: $0.05-0.10 / termék

## Kapcsolat

Nemes Ventilátorház
- Web: nemesventilatorhaz.hu
- Tel: +36-70-369-9944
- Cím: 1182 Budapest, Királyhágó utca 30.
