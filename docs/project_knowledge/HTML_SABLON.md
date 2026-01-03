# HTML Sablon

Ez a végleges HTML struktúra a termékleírásokhoz.
**FONTOS:** A HTML-t EGYETLEN SORBAN add vissza, WHITESPACE NÉLKÜL!

---

## A sablon felépítése

### 1. Intro szekció (videó + bevezető)
### 2. Gyári adatlap szekció (PDF + méretrajz)
### 3. "Tudta?" blokk
### 4. Ventilátorház bemutatkozó (fix, nem változik)
### 5. TrustIndex widget (fix)
### 6. "Miért ajánljuk?" fejléc
### 7. USP blokkok (feature-row)

---

## Teljes sablon

```html
<div class="termekoldal-container">
    <div class="intro-video-section">
        <div class="intro-video-col">
            <div class="video-wrapper">
                <iframe src="[YOUTUBE_EMBED_LINK]" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen=""></iframe>
            </div>
        </div>
        <div class="intro-text-col">
            <h3>[FIGYELEMFELKELTŐ CÍM A TERMÉK NEVÉVEL]</h3>
            <p>[ELSŐ BEKEZDÉS - PROBLEM-AWARE BEVEZETŐ, MI A TERMÉK, MIRE JÓ]</p>
            <p>[MÁSODIK BEKEZDÉS - FŐ ELŐNYÖK, 2-3 KIEMELÉS]</p>
        </div>
    </div>
    <div class="gyariadatlap-container">
        <div class="gyariadatlap-box">
            <div class="gyariadatlap-left">
                <h2>Gyári adatlap</h2>
                <p>A ventilátor hivatalos, gyártói adatlapja tartalmazza az összes fontos műszaki adatot – teljesítmény-, nyomás- és zajszinteket, méreteket, valamint szerelési információkat. Hasznos segítség villanyszerelőknek, építészeknek vagy bárkinek, aki pontos technikai információt szeretne a beszereléshez.</p>
                <a href="[ADATLAP_PDF_LINK]" class="gyariadatlap-btn" target="_blank">A gyári adatlap letöltése</a>
            </div>
            <div class="gyariadatlap-right">
                <img src="[MERETRAJZ_KEP_LINK]" alt="[TERMÉK NÉV] méretrajz">
            </div>
        </div>
    </div>
    <div class="tudta">
        <div class="tudta-ikon">i</div>
        <div class="tudta-tartalom">
            <p><strong>Tudta?</strong> [ÉRDEKES TÉNY A GYÁRTÓRÓL VAGY TERMÉKRŐL]</p>
        </div>
    </div>
    <div class="ventilatorhaz-bemutatkozo">
        <div class="ventilatorhaz-bemutatkozo-kep">
            <img src="https://shop.unas.hu/shop_ordered/55564/pic/nemesventilatorhaz-csapata.webp" alt="A Nemes Ventilátorház csapata">
        </div>
        <div class="ventilatorhaz-bemutatkozo-szoveg">
            <h2>Vásároljon Magyarország egyik legmegbízhatóbb légtechnikai áruházából</h2>
            <p>A Ventilátorház a Budapest 18. kerületében, a Királyhágó utca 30. található. Sokszoros díjnyertes cég vagyunk, több évtizedes tapasztalattal és hibátlan véleményekkel. Ha kérdése van, hívja munkatársainkat bizalommal a <strong>+36-70-369-9944</strong> telefonszámon!</p>
            <div class="ventilatorhaz-gombok">
                <a href="https://www.nemesventilatorhaz.hu/visszahivaskero" class="ventilatorhaz-btn ventilatorhaz-btn-callback">Ingyenes tanácsadást kérek</a>
                <a href="tel:+36703699944" class="ventilatorhaz-btn ventilatorhaz-btn-call">Felhívom most</a>
            </div>
        </div>
    </div>
    <script defer async src='https://cdn.trustindex.io/loader.js?cbff376529ad876c29862863c17'></script>
    <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #333; margin-bottom: 20px;">
        <h1 style="margin: 0;">Miért ajánljuk?</h1>
    </div>
    <div class="feature-row">
        <div class="feature-col feature-image">
            <img src="[USP1_KEP_LINK]" alt="[USP1_ALT]" style="width: 100%; display: block; border-radius: 8px;">
        </div>
        <div class="feature-col feature-text">
            <h3>[USP1_CÍM]</h3>
            <p>[USP1_ELSŐ_BEKEZDÉS]</p>
            <p>[USP1_MÁSODIK_BEKEZDÉS - OPCIONÁLIS]</p>
        </div>
    </div>
    <div class="feature-row">
        <div class="feature-col feature-image">
            <img src="[USP2_KEP_LINK]" alt="[USP2_ALT]" style="width: 100%; display: block; border-radius: 8px;">
        </div>
        <div class="feature-col feature-text">
            <h3>[USP2_CÍM]</h3>
            <p>[USP2_ELSŐ_BEKEZDÉS]</p>
            <p>[USP2_MÁSODIK_BEKEZDÉS - OPCIONÁLIS]</p>
        </div>
    </div>
    <!-- TOVÁBBI USP BLOKKOK ISMÉTLÉSE -->
    <!-- AZ UTOLSÓ FEATURE-ROW KAPJON style="border-bottom: none;" ATTRIBÚTUMOT -->
    <div class="feature-row" style="border-bottom: none;">
        <div class="feature-col feature-image">
            <img src="[UTOLSO_USP_KEP_LINK]" alt="[UTOLSO_USP_ALT]" style="width: 100%; display: block; border-radius: 8px;">
        </div>
        <div class="feature-col feature-text">
            <h3>[UTOLSO_USP_CÍM]</h3>
            <p>[UTOLSO_USP_SZÖVEG]</p>
        </div>
    </div>
</div>
```

---

## Változó elemek (amiket ki kell tölteni)

| Placeholder | Leírás | Példa |
|-------------|--------|-------|
| `[YOUTUBE_EMBED_LINK]` | YouTube embed URL | https://www.youtube.com/embed/xxxxx |
| `[FIGYELEMFELKELTŐ CÍM]` | H3 cím a termék nevével | "ELICENT ELIX 100: A modern szellőztetés mestere" |
| `[ADATLAP_PDF_LINK]` | Gyári adatlap PDF URL | https://shop.unas.hu/.../adatlap.pdf |
| `[MERETRAJZ_KEP_LINK]` | Méretrajz kép URL | https://www.nemesventilatorhaz.hu/.../meret.png |
| `[TERMÉK NÉV]` | A termék neve | Elicent Elix 100 |
| `[TUDTA TÉNY]` | Érdekes tény | "Az Elicent 1955 óta van a piacon..." |
| `[USP_KEP_LINK]` | USP illusztráció URL | https://www.nemesventilatorhaz.hu/.../kep.jpg |
| `[USP_CÍM]` | USP H3 címsor | "Fröccsenő víz ellen védett (IPX4)" |
| `[USP_SZÖVEG]` | USP leírás | "Az IPX4 védettségi besorolásnak..." |

---

## Fix elemek (NE változtasd!)

### Ventilátorház bemutatkozó
Ez a blokk minden terméknél UGYANAZ marad:
- Kép: `https://shop.unas.hu/shop_ordered/55564/pic/nemesventilatorhaz-csapata.webp`
- Szöveg: A Ventilátorház bemutatkozása
- Gombok: Visszahívás + Telefon

### TrustIndex script
Ez a sor minden terméknél UGYANAZ:
```html
<script defer async src='https://cdn.trustindex.io/loader.js?cbff376529ad876c29862863c17'></script>
```

### "Miért ajánljuk?" fejléc
Ez a div minden terméknél UGYANAZ:
```html
<div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #333; margin-bottom: 20px;">
    <h1 style="margin: 0;">Miért ajánljuk?</h1>
</div>
```

---

## Szabályok

### Whitespace kezelés
**KRITIKUS:** Az Unas érzékeny a whitespace-re!
- A végső HTML-t EGYETLEN SORBAN add vissza
- Nincs sortörés a tagek között
- Nincs behúzás (indentation)
- Nincs extra szóköz

### USP blokkok száma
- Minimum: 5 db feature-row
- Maximum: 10 db feature-row
- Ajánlott: 6-8 db

### Utolsó USP blokk
Az utolsó `feature-row` div-nek kell kapnia:
```html
style="border-bottom: none;"
```

### Képek
- Használj HTTPS linkeket
- Ellenőrizd, hogy a kép létezik
- Az alt szöveg legyen leíró

---

## Példa: Egyetlen soros output

Így kell kinéznie a végső HTML-nek (egy sor, whitespace nélkül):

```
<div class="termekoldal-container"><div class="intro-video-section"><div class="intro-video-col"><div class="video-wrapper"><iframe src="https://www.youtube.com/embed/HFyhblnB97c" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen=""></iframe></div></div><div class="intro-text-col"><h3>ELICENT ELIX 100: A modern szellőztetés mestere</h3><p>Az ismert olasz gyártó...</p></div></div>...</div>
```

---

## Ipari termékekhez: Műszaki táblázat kiegészítés

Ha ipari ventilátor vagy több változat van, add hozzá a gyári adatlap után:

```html
<div id="bcs-muszaki-adatok">
    <div class="table-scroll">
        <table class="ventilator-table">
            <thead>
                <tr class="header-row">
                    <th colspan="2"></th>
                    <th>[MODELL-1]</th>
                    <th>[MODELL-2]</th>
                    <th>[MODELL-3]</th>
                </tr>
            </thead>
            <tbody>
                <tr><th class="left">Csőátmérő</th><th>mm</th><td>[X]</td><td>[X]</td><td>[X]</td></tr>
                <tr><th class="left">Feszültség</th><th>V / Hz</th><td colspan="3">230 / 50</td></tr>
                <tr><th class="left">Max. teljesítmény</th><th>W</th><td>[X]</td><td>[X]</td><td>[X]</td></tr>
                <tr><th class="left">Max. légszállítás</th><th>m³/h</th><td>[X]</td><td>[X]</td><td>[X]</td></tr>
                <tr><th class="left">Zajszint</th><th>dB(A)</th><td>[X]</td><td>[X]</td><td>[X]</td></tr>
            </tbody>
        </table>
    </div>
</div>
```

---

## Jelleggörbék szekció (ha van)

```html
<div id="bcs-jelleggorbek">
    <h2 class="jelleggorbe-cim">A [TERMÉK NÉV] változatainak jelleggörbéi</h2>
    <p class="jelleggorbe-alcim">(kattintson a képre a nagyításhoz)</p>
    <div class="jelleggorbe-galeria">
        <div class="jelleggorbe-kep-container">
            <a href="[JELLEGGÖRBE_LINK]" data-lightbox="jelleggorbek" data-title="[MODELL] jelleggörbéje" class="jelleggorbe-kep-link">
                <img src="[JELLEGGÖRBE_LINK]" alt="[MODELL] ventilátor jelleggörbe" class="jelleggorbe-kep" />
            </a>
            <p class="jelleggorbe-kep-leiras">[MODELL] jelleggörbéje</p>
        </div>
    </div>
</div>
```
