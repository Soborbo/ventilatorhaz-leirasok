# USP Könyvtár

Újrahasználható USP blokkok termékleírásokhoz.
**SZABÁLY:** Csak akkor használj egy USP-t, ha a FELTÉTEL teljesül!

---

## Használati útmutató

Minden USP tartalmazza:
- **ID:** Egyedi azonosító
- **Feltétel:** Mikor használható
- **Cím:** H3 címsor (benefit-orientált)
- **Szöveg:** 2-3 bekezdés
- **Kép javaslat:** Milyen kép illene hozzá

A `{változó}` helyekre a konkrét termék adatai kerülnek.

---

## VÍZVÉDELEM

### USP_IPX4
**Feltétel:** ip_vedelem = "IPX4" VAGY "IP44" VAGY "IP34"
**Cím:** Fröccsenő víz ellen védett (IPX4)
**Szöveg:**
Az IPX4 védettségi besorolásnak köszönhetően a készülék biztonságosan használható párás és nedves helyiségekben.

A fürdőszobai zónák közül a 2. és 3. zónában szerelhető fel, tehát a zuhanytól vagy kádtól legalább 60 cm távolságra.
**Kép:** schema_zona_IP-44.jpg

### USP_IPX5
**Feltétel:** ip_vedelem = "IPX5" VAGY "IP65"
**Cím:** Sugár víz ellen is védett (IPX5)
**Szöveg:**
Az IPX5 védettség azt jelenti, hogy a készülék még az erősebb vízsugaraknak is ellenáll – nem csak a párának vagy fröccsenő víznek.

Ez lehetővé teszi az 1. zónában való felszerelést is, közvetlenül a zuhanyzó vagy kád fölé. Mosodákban, uszodáknál vagy ipari környezetben is ideális választás.
**Kép:** ipx5.jpg

---

## ZAJSZINT

### USP_ULTRA_HALK
**Feltétel:** zajszint_db < 26 ÉS kategoria = "fürdőszoba"
**Cím:** Ultra halk működés – akár alvás közben is
**Szöveg:**
Mindössze {zajszint_db} dB zajszinttel ez a ventilátor a legcsendesebb kategóriába tartozik – ez halkabb, mint a suttogás.

Ideális választás hálószobához közeli fürdőkhöz vagy éjszakai használathoz, ahol a zaj zavaró lehet.
**Kép:** halk-ventilator.jpg

### USP_HALK_RELATIV
**Feltétel:** zajszint_kategoria = "HALK"
**Cím:** {diff}%-kal halkabb a kategória átlagánál
**Szöveg:**
{zajszint_db} dB zajszintjével ez a ventilátor a {kategoria} kategória átlaga ({atlag_zajszint} dB) alatt teljesít.

A gyakorlatban ez azt jelenti, hogy a működése nem zavaró – nyugodtan bekapcsolhatod este is anélkül, hogy felébresztené a háztartás többi tagját.
**Kép:** halk-ventilator.jpg

---

## CSAPÁGY ÉS ÉLETTARTAM

### USP_GOLYOSCSAPAGY
**Feltétel:** csapagy_tipus = "golyóscsapágy"
**Cím:** Golyóscsapágy a hosszú élettartamért
**Szöveg:**
A golyóscsapágyas kialakítás több előnnyel jár a hagyományos siklócsapágyhoz képest: hosszabb élettartam, csendesebb működés, és ami fontos – mennyezetre is szerelhető.

A siklócsapágyas ventilátorokat csak vízszintesen (falra) szabad szerelni, különben hamar tönkremennek. A golyóscsapágyasnál nincs ilyen megkötés.
**Kép:** golyoscsapagy.jpg

### USP_ELETTARTAM
**Feltétel:** elettartam_ora > 0 (explicit adat van)
**Cím:** {elettartam_ora} üzemóra élettartam
**Szöveg:**
A gyártó tesztjei alapján a motor akár {elettartam_ora} üzemóra élettartamot is biztosíthat.

Napi 8 órás használat mellett ez körülbelül {elettartam_ev} év folyamatos működést jelent.
**Kép:** hosszu-elettartam.jpg

---

## SZERELHETŐSÉG

### USP_FAL_MENNYEZET
**Feltétel:** szereles = "fal és mennyezet" VAGY csapagy = "golyóscsapágy"
**Cím:** Falra és mennyezetre egyaránt szerelhető
**Szöveg:**
A ventilátor falra és mennyezetre is felszerelhető, így rugalmasan illeszkedik bármilyen fürdőszoba kialakításhoz.

Ez különösen hasznos, ha a fal nem alkalmas a szerelésre (pl. csempe mögött vezetékek), vagy ha a mennyezeti elszívás esztétikailag jobban illik a térhez.
**Kép:** fal-mennyezet-szereles.jpg

### USP_EGYSZERU_SZERELES
**Feltétel:** (általánosan használható, ha nincs speciális szerelési igény)
**Cím:** Egyszerű, gyors felszerelés
**Szöveg:**
A szabványos {csoatmero} mm-es csőátmérő és a praktikus rögzítési pontok lehetővé teszik a gyors, problémamentes telepítést.

Egy gyakorlott szerelő 15-20 perc alatt felszereli – de a mellékelt útmutató alapján barkácsolók is megbirkóznak vele.
**Kép:** egyszeru-szereles.jpg

---

## VISSZACSAPÓ SZELEP

### USP_VISSZACSAPO
**Feltétel:** visszacsapo_szelep = "igen"
**Cím:** Visszacsapó szelep a kellemetlen szagok ellen
**Szöveg:**
A beépített visszacsapó szelep megakadályozza, hogy a szomszédos lakásokból vagy a szellőzőrendszerből visszaáramoljanak a kellemetlen szagok.

Amikor a ventilátor nem üzemel, a szelep automatikusan lezár, így a hideg levegőt és a külső szagokat is kint tartja.
**Kép:** visszacsapo-szelep.jpg

---

## TISZTÍTÁS ÉS KARBANTARTÁS

### USP_KONNYU_TISZTITAS
**Feltétel:** (használható, ha az előlap sima/levehető)
**Cím:** Egyszerű tisztítás, kevés karbantartás
**Szöveg:**
A sima előlap és a levehető burkolat egyszerűvé teszi a rendszeres tisztítást – elég egy nedves törlőkendővel áttörölni.

A szűrő (ha van) pillanatok alatt kivehető és vízzel átmosható.
**Kép:** konnyu-tisztitas.jpg

### USP_ANTISZTATIKUS
**Feltétel:** antisztatikus = "igen"
**Cím:** Antisztatikus ház – kevesebb por
**Szöveg:**
Az antisztatikus műanyag ház csökkenti a por lerakódását a készülék felületén.

Ez nem csak esztétikai előny: kevesebb por = ritkább tisztítás és hosszabb élettartam.
**Kép:** antisztatikus.jpg

---

## VEZÉRLÉS ÉS FUNKCIÓK

### USP_IDORELE
**Feltétel:** funkcio TARTALMAZZA "időrelé"
**Cím:** Időrelé – utánfutás a teljes párátlanításért
**Szöveg:**
Az időrelés változat a világítás kikapcsolása után még beállítható ideig (általában 2-30 perc) tovább működik.

Így a fürdés után keletkezett pára is teljesen eltávozik, még ha el is felejtjük manuálisan kikapcsolni.
**Kép:** idorele.jpg

### USP_PARAERZEKELO
**Feltétel:** funkcio TARTALMAZZA "páraérzékelő"
**Cím:** Páraérzékelő – automatikus bekapcsolás
**Szöveg:**
A beépített páraérzékelő figyeli a levegő nedvességtartalmát, és automatikusan bekapcsolja a ventilátort, amikor a páratartalom emelkedik.

Nem kell kapcsolóval bajlódni, és sosem felejted el bekapcsolni – a ventilátor magától intézkedik.
**Kép:** paraerzekelo.jpg

### USP_MOZGASERZEKELO
**Feltétel:** funkcio TARTALMAZZA "mozgásérzékelő"
**Cím:** Mozgásérzékelő – belépsz, beindul
**Szöveg:**
A mozgásérzékelős változat automatikusan bekapcsol, amikor valaki belép a helyiségbe.

Ideális WC-kbe, ahol rövid tartózkodás alatt is fontos a gyors légcsere.
**Kép:** mozgaserzekelo.jpg

---

## ENERGIA

### USP_ALACSONY_FOGYASZTAS
**Feltétel:** teljesitmeny_w < 10 ÉS kategoria = "fürdőszoba"
**Cím:** Mindössze {teljesitmeny_w}W fogyasztás
**Szöveg:**
A {teljesitmeny_w} wattos teljesítményfelvétel kifejezetten alacsony ebben a kategóriában.

Napi 4 órás használattal éves szinten körülbelül {eves_fogyasztas} kWh-t fogyaszt, ami mai árakon {eves_koltseg} Ft villanyköltséget jelent.
**Kép:** energiatakarekos.jpg

---

## DIZÁJN

### USP_MODERN_DIZAJN
**Feltétel:** (használható, ha a termék design-orientált)
**Cím:** Modern, letisztult megjelenés
**Szöveg:**
A minimalista dizájn bármilyen fürdőszoba enteriőrbe illeszkedik. Nem tűnik "technikainak" – inkább a helyiség természetes részének hat.

Fehér színben kapható, de sok gyártónál választható színes vagy üveg előlap is.
**Kép:** modern-dizajn.jpg

### USP_FEDETT_LAPAT
**Feltétel:** fedett_lapat = "igen"
**Cím:** Fedett lapát – esztétikus és praktikus
**Szöveg:**
A fedett ventilátorlapátnak köszönhetően a por lerakódása nem látszik kívülről, így a készülék évek múltán is ápolt marad.

Ez nem csak esztétikai előny: a fedett kialakítás a légáramlást is egyenletesebbé teszi.
**Kép:** fedett-lapat.jpg

---

## SPECIÁLIS (gyártó-specifikus)

### USP_PEREMELSZIVAS_ELICENT
**Feltétel:** gyarto = "Elicent" ÉS termekcsalad = "Elix"
**Cím:** Peremelszívás – egyenletesebb légáramlás
**Szöveg:**
A hagyományos ventilátorok a levegőt középen szívják be, ami turbulenciát okoz. Az Elicent szabadalmaztatott peremelszívásos technológiája a teljes felületen egyenletesen szívja be a levegőt.

Az eredmény: hatékonyabb párátlanítás és csendesebb működés.
**Kép:** peremelszivas.jpg

### USP_UV_ALLO_BLAUBERG
**Feltétel:** gyarto = "Blauberg"
**Cím:** UV-álló műanyag – nem sárgul meg
**Szöveg:**
A Blauberg UV-álló ABS műanyag házat használ, amely ellenáll a napsugárzásnak és nem sárgul meg az évek során.

Különösen fontos ablak melletti felszerelésnél, ahol a közvetlen napfény más műanyagokat gyorsan elszínez.
**Kép:** uv-allo.jpg

---

## GARANCIA ÉS MEGBÍZHATÓSÁG

### USP_GYARTO_TAPASZTALAT
**Feltétel:** (mindig használható, de szabd testre)
**Cím:** {gyarto_ev} év tapasztalat a légtechnikában
**Szöveg:**
A {gyarto} {gyarto_alapitas} óta gyárt ventilátorokat – ez {gyarto_ev} év tapasztalatot jelent.

Nem egy újonnan piacra lépő márkáról van szó, hanem egy bevált gyártóról, akinek a termékei évtizedek óta bizonyítanak.
**Kép:** gyarto-logo.jpg
