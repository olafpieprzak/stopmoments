# StopMoments — strona gotowa do wgrania

## Co to jest

Kompletna, działająca strona. Nie wymaga żadnego programu, bazy danych ani instalacji —
to zwykłe pliki HTML, które działają od razu po wgraniu na serwer albo GitHub Pages.

---

## Struktura — co gdzie leży

```
stopmoments/
│
├── index.html                  ← STRONA GŁÓWNA
│
├── chrzty.html                 ← podstrony ofertowe
├── sluby.html
├── sesje-rodzinne.html
├── sesje-noworodkowe.html
├── sesje-narzeczenskie.html
├── sesje-kobiece.html
├── sesje-swiateczne.html
├── wieczor-panienski.html
├── komunie.html
├── przyjecia.html
│
├── blog.html                   ← lista wpisów
├── wpis-reportaz-z-chrztu-jak-sie-przygotowac.html
├── wpis-sesja-noworodkowa-kiedy-i-jak.html
├── wpis-wieczor-panienski-z-fotografem.html
│
├── cennik-stopmoments-2026.pdf ← cennik do pobrania ze strony
│
├── assets/
│   ├── style.css               ← wygląd całej strony (kolory, układ, czcionki)
│   └── app.js                  ← menu, powiększanie zdjęć, karuzela opinii
│
├── img/                        ← wszystkie zdjęcia
│   ├── chrzciny/
│   ├── wesela/
│   ├── rodzina/
│   ├── noworodki/
│   ├── milosne/
│   ├── panienski/
│   ├── komunia/
│   ├── kobieca/
│   ├── swiateczne/
│   ├── studniowki/
│   ├── kafle/                  ← miniatury kategorii na stronie głównej
│   ├── hero/                   ← duże zdjęcia w nagłówkach
│   ├── omnie/                  ← Twoje zdjęcie portretowe
│   ├── instagram/              ← zdjęcia zapasowe paska Instagrama
│   └── druga-marka/            ← zdjęcie w pasie o fotografii biznesowej
│
├── sitemap.xml                 ← mapa strony dla Google
├── robots.txt                  ← zgoda dla wyszukiwarek na indeksowanie
└── .nojekyll                   ← wymagany przez GitHub Pages (plik pusty)
```

**Najważniejsze: wgrywasz CAŁY folder z zachowaniem tej struktury.**
Nie rozdzielaj plików, nie zmieniaj nazw folderów — strona odwołuje się do nich po nazwach.

---

## Jak wgrać na GitHub

### Wariant A — przez stronę GitHub (najprostszy)

1. Wejdź na github.com → **New repository**
2. Nazwa np. `stopmoments`, ustaw **Public**, zatwierdź
3. W nowym repozytorium kliknij **Add file → Upload files**
4. Przeciągnij **całą zawartość** rozpakowanego folderu `stopmoments`
   (czyli: `index.html`, pozostałe pliki `.html`, oraz foldery `assets` i `img`)
5. Na dole kliknij **Commit changes**
6. Zakładka **Settings → Pages** → w polu *Source* wybierz gałąź `main`, folder `/ (root)` → **Save**
7. Po kilku minutach strona działa pod adresem
   `https://TWOJANAZWA.github.io/stopmoments/`

> **Uwaga:** GitHub przyjmuje maksymalnie 100 plików na raz przez przeglądarkę.
> W `img/` jest ich znacznie więcej, więc wgrywaj **folder po folderze**
> (najpierw `img/chrzciny`, potem `img/wesela` itd.) albo użyj wariantu B.

### Wariant B — przez program GitHub Desktop (szybszy przy tylu plikach)

1. Zainstaluj **GitHub Desktop**
2. **File → New repository**, nazwa `stopmoments`
3. Skopiuj do utworzonego folderu całą zawartość paczki
4. W programie pojawi się lista zmian → wpisz opis → **Commit to main**
5. Kliknij **Publish repository**
6. Dalej jak w wariancie A, punkt 6

---

## Podpięcie własnej domeny (monikaadamczyk.pl)

1. W repozytorium: **Settings → Pages → Custom domain** → wpisz adres → **Save**
2. U operatora domeny dodaj wpisy DNS wskazane przez GitHub na tej samej stronie
3. Zaznacz **Enforce HTTPS** (pojawia się po kilkunastu minutach)

---

## Co jeszcze wymaga Twojego działania

### 1. Instagram — pasek na dole strony
Teraz pokazuje zdjęcia zapasowe. Żeby pobierał posty automatycznie:

1. Załóż darmowe konto na **behold.so**
2. Podłącz konto `@stopmoments.foto`
   (musi być typu **Firmowe** lub **Twórcy** — zmiana w ustawieniach Instagrama, darmowa)
3. Utwórz **JSON feed**, skopiuj jego adres
4. Otwórz `assets/app.js`, znajdź linijkę:
   ```
   const BEHOLD_FEED = 'https://feeds.behold.so/TWOJ_ID_FEEDU';
   ```
   i wklej swój adres w miejsce `TWOJ_ID_FEEDU`
5. Darmowy plan pokazuje 6 postów — wtedy zmień też `IG_COUNT = 10` na `6`

### 2. Link do strony biznesowej
W stopce i w pasie „Fotografia biznesowa" jest odnośnik `/`.
Zadziała, gdy pod głównym adresem stanie strona biznesowa.
Do tego czasu prowadzi do strony głównej serwisu.

### 3. Adresy w mapie strony
`sitemap.xml` zawiera adresy `monikaadamczyk.pl/stopmoments/`.
Jeśli strona stanie pod innym adresem — popraw je w tym pliku.

---

## Jak wprowadzać drobne zmiany samodzielnie

| Co chcesz zmienić | Gdzie |
|---|---|
| Cenę, opis pakietu, tekst | odpowiedni plik `.html`, np. `chrzty.html` |
| Kolory, odstępy, wielkość liter | `assets/style.css` |
| Adres feedu Instagrama | `assets/app.js` |
| Zdjęcie w galerii | podmień plik w `img/kategoria/` zachowując nazwę |

**Ważne przy podmianie zdjęcia:** każde zdjęcie ma cztery wersje —
`nazwa.jpg`, `nazwa-640.webp`, `nazwa-1000.webp`, `nazwa-1600.webp`.
Podmiana samego `.jpg` nie wystarczy, bo przeglądarki i tak wezmą wersje `.webp`.
Przy takich zmianach lepiej napisz do mnie — przygotuję komplet.

---

## Co strona już ma

- Działa poprawnie na telefonie, tablecie i komputerze
- Zdjęcia dobierają się do wielkości ekranu (telefon pobiera lekkie wersje)
- Strona ślubna z 44 zdjęciami waży na telefonie ok. 1,2 MB
- Opisy zdjęć i strony dla wyszukiwarek
- Dane strukturalne przy wpisach blogowych
- Wymuszony jasny motyw (nie psuje się przy trybie ciemnym w telefonie)
- Zapasowe wersje zdjęć dla starszych przeglądarek
