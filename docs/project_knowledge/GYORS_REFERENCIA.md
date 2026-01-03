# Gyors referencia kártya

Nyomtasd ki vagy tartsd nyitva munka közben!

---

## Indítás

```
Új termék: [TERMÉK NÉV]
Gyártó: [GYÁRTÓ]
Kategória: [fürdőszoba / ipari / csőventilátor / hővisszanyerő]
PDF: [LINK]
Ár: [X] Ft

Mód: TELJES / LÉPÉSENKÉNTI
```

---

## Adat státuszok

| Jelölés | Jelentés | Szövegbe kerülhet? |
|---------|----------|-------------------|
| ✓ | PDF-ben explicit szerepel | IGEN |
| ⚠️ | Következtetett | NEM (kérdezz rá) |
| ❌ | Hiányzik | NEM |

---

## Benchmark gyorsreferencia

### Fürdőszoba zajszint (dB)
| < 26 | 26-32 | 32-38 | > 38 |
|------|-------|-------|------|
| ULTRA HALK | HALK | ÁTLAGOS | ZAJOS |

**Átlag: 35 dB**

### Fürdőszoba légszállítás (m³/h)
| < 80 | 80-120 | 120-180 | > 180 |
|------|--------|---------|-------|
| ALACSONY | KÖZEPES | MAGAS | NAGYON MAGAS |

**Átlag: 100 m³/h**

---

## TILOS szavak

❌ "kiváló választás"
❌ "prémium minőség"  
❌ "tökéletes megoldás"
❌ "valószínűleg"
❌ "általában"
❌ Csőátmérő a szövegben

---

## Kötelező cserék

| NE ÍRD | ÍRD HELYETTE |
|--------|--------------|
| "halk" | "{X}%-kal halkabb az átlagnál ({Y} dB)" |
| "energiatakarékos" | "{X}W fogyasztás" |
| "tartós" | "{X} óra élettartam" vagy "golyóscsapágyas" |

---

## USP ellenőrzés

Minden USP előtt kérdezd meg:
1. Van adat rá? (✓)
2. A feltétel teljesül? (benchmark)
3. Relatív vagy abszolút? (legyen relatív)

---

## Végső ellenőrzés

- [ ] Terméknév 4-6x?
- [ ] Minden szám ✓ BIZTOS forrásból?
- [ ] Nincs TILOS szó?
- [ ] HTML egyetlen sorban?
- [ ] Utolsó USP: border-bottom: none?

---

## Gyors parancsok

| Parancs | Mit csinál |
|---------|------------|
| `TELJES` | Mind a 4 fázis egyben |
| `LÉPÉSENKÉNTI` | Fázisonként megállás |
| `CSAK ADAT` | Csak extrakció |
| `CSAK SZÖVEG` | Csak generálás |
| `ELLENŐRZÉS` | Meglévő szöveg review |

---

## Mikor válassz LÉPÉSENKÉNTI módot?

✓ Új gyártó (még nincs karakterlap)
✓ Drága termék (> 50.000 Ft)
✓ Új kategória
✓ Bizonytalan adatok a PDF-ben
✓ Speciális termék (ipari, hővisszanyerő)
