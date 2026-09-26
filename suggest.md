# WalkMe — analiza aplikacji i propozycje brakujących funkcji

_Stan na 2026-09-25. Analiza objęła `mobile/` (React Native), `server/` (Express + Prisma), `admin/` oraz system
designu zaszyty w kodzie (komponenty `mobile/src/ui`, `utils/theme`, komentarze „prototype” w ekranach)._

> **Uwaga o designie:** plik Claude Design („WalkMe Prototype v2”) nie był dostępny z tej sesji. Równoległa sesja
> wdrożyła już z niego odznakę schroniska (gradient, poświata, rozmiary) i kartę psa. Wnioski poniżej opierają się
> na tym, co jest w kodzie; warto zrobić pełne porównanie ekran-po-ekranie z prototypem.

---

## 1b. Weryfikacja przez kolejną sesję (2026-09-25, później tego samego dnia)

Ta sesja *miała* dostęp do paczki Claude Design (`chats/`, `project/WalkMe Prototype v2.dc.html`, `project/github.md`)
i w jej ramach zbudowała wcześniej: gradientową/świecącą odznakę schroniska, notatki o psach, ekran „Profil osoby”
dla schroniska (`PersonProfileScreen`) i kartę szczegółów psa (`DogDetailsCard`) — patrz historia commitów. Poniżej:
ponowne uruchomienie testów po scaleniu z pracą powyższej sesji, porównanie listy ekranów z `github.md` z tym, co
faktycznie jest w `mobile/src/screens`, i jeden znaleziony błąd.

**Stan po scaleniu obu sesji:** serwer 79/79 testów, mobile 6/6 testów, `tsc --noEmit` bez błędów na obu pakietach.
Zmiany z obu sesji nie kolidują — w szczególności nowa walidacja `chat:room:join` (`canJoinRoom`) poprawnie
rozpoznaje pokoje próśb do schroniska, więc wcześniejsza poprawka „pierwsza wiadomość do schroniska bez
powiadomienia” nadal działa (test regresyjny w `chat/socket.test.ts` przechodzi).

**Porównanie ekranów z `project/github.md`:** wszystkie 18 ekranów z mapy ekranów (splash, powitanie, dodawanie
psa, mapa, szczegóły spaceru, tworzenie spaceru, szczegóły/tworzenie wydarzenia, discover + match, wiadomości,
wątek DM/spaceru, profil + podekrany, krok „typ konta”, karta psa ze schroniska, prośby o spacer, czat o psa +
szczegóły, „psy pod opieką”/„psy do wyprowadzenia”, „weź psa” przy tworzeniu spaceru) ma odpowiadający ekran w
kodzie. Brakujące funkcje to więc rzeczywiście luki *funkcjonalne* wewnątrz istniejących ekranów (patrz sekcja 3),
nie brakujące ekrany.

**Błąd znaleziony i naprawiony:**

| # | Waga | Problem | Poprawka |
| --- | --- | --- | --- |
| 17 | Niski | `PersonProfileScreen` ustawiał stan (`setPerson`/`setFailed`/`setLoading`) po zakończeniu żądania bez sprawdzenia, czy ekran wciąż jest zamontowany — ostrzeżenie React przy szybkim cofnięciu z ekranu zanim `/users/:id` odpowie. Reszta aplikacji konsekwentnie używa flagi `alive` w takich `useEffect` (`CreateEventScreen`, `CreateWalkScreen`, `PickLocationScreen`, `DogRequestChatScreen`) — ten ekran był wyjątkiem. | Dodano flagę `alive` + `cleanup`, zgodnie z resztą kodu. |

Sprawdzone dodatkowo bez znalezienia błędu: `DogDetailsCard` (brak animacji zamknięcia — ale to zgodne z
istniejącym wzorcem `ConfirmDialog`, nie regresja), pozostałe ekrany z `.then(` w `useEffect` (już mają `alive`/
`cancelled`), serializacja `/users/:id` (poprawnie używa `toPublicUser`, `provider` przechodzi, `email`/`lat`/`lng`
nie).

---

## 1. Co jest już zrobione

| Obszar | Zakres |
| --- | --- |
| Logowanie | Google / Facebook / Apple, e-mail z kodem, konto osoby lub schroniska |
| Onboarding | Pies → rytm spacerów → lokalizacja |
| Discover | Swipe osób z psami + karty psów schroniskowych, dopasowania (match) |
| Czat | Grupowy czat spaceru, wiadomości prywatne po dopasowaniu, wątki ze schroniskiem, „pisze…” |
| Spacery | Tworzenie, dołączanie z wybranym psem, statusy (upcoming/live/ended), mapa, podgląd |
| Wydarzenia | Tworzenie, dołączanie, szczegóły |
| Miejsca | Parki/kawiarnie/weterynarze na mapie, „zaplanuj spacer tutaj” |
| Profil | Psy (z notatką), statystyki, język (EN/ES/DE/PL), ustawienia powiadomień |
| Powiadomienia | Centrum powiadomień w aplikacji + granularne zgody (6 kategorii), real-time przez Socket.io |
| Schroniska | Prośby o spacer z psem, akceptacja/odrzucenie, czat per pies |
| Admin | Użytkownicy (zawieszanie/ban), spacery, wydarzenia, wiadomości, uploady, audyt |

---

## 2. Błędy znalezione i naprawione w tej sesji

Każda poprawka ma test, który najpierw odtwarzał błąd. Serwer: **79/79 testów** po scaleniu z main (przed audytem było 55), mobile: **6 nowych testów**,
`tsc` mobile: **0 błędów** (było 5), bundle Androida buduje się poprawnie.

| # | Waga | Problem | Poprawka |
| --- | --- | --- | --- |
| 1 | Krytyczny | Aplikacja mobilna **nie budowała się** ze świeżego repo — `@walkme/shared` wskazywał na nieistniejący `dist/` | Pole `react-native` w `shared/package.json` + mapowanie ścieżki w `tsconfig` |
| 2 | Krytyczny (bezpieczeństwo) | `GET/POST /chat/:roomId/messages` bez kontroli członkostwa — każdy mógł czytać i pisać w dowolnym czacie, **także prywatnych DM** | Tylko uczestnicy spaceru; DM i wątki schronisk mają własne, chronione trasy |
| 3 | Krytyczny (bezpieczeństwo) | Socket `chat:room:join` pozwalał dołączyć do dowolnego pokoju, w tym **osobistego pokoju powiadomień innego użytkownika** | Dołączenie tylko do własnych spacerów / dopasowań / wątków |
| 4 | Krytyczny (stabilność) | Błędny payload `chat:message:send` powodował nieobsłużony wyjątek — w Node 22 to **zabicie całego serwera** | Walidacja + przechwytywanie błędów w każdym handlerze |
| 5 | Wysoki | Zawieszenie / ban w panelu admina **nic nie robiło** — użytkownik działał dalej | Blokada logowania, odświeżania tokenu i każdego żądania (także socket); unieważnienie refresh tokenów |
| 6 | Wysoki (prywatność) | API zwracało **e-mail i dokładne współrzędne domu** innych użytkowników (uczestnicy spacerów, dopasowania, Discover), wbrew obietnicy z onboardingu | Osobny serializer dla „siebie” i „innych”; dystans liczony po stronie serwera |
| 7 | Wysoki | Token dostępu wygasał po 2 h, a aplikacja **nie używała refresh tokenu** i zostawała w stanie „zalogowany” z niedziałającymi żądaniami | Ciche odświeżanie (jedno wspólne dla równoległych żądań), wylogowanie tylko gdy serwer odrzuci token (nie przy braku sieci), socket bierze aktualny token |
| 8 | Wysoki (bezpieczeństwo) | Upload zachowywał rozszerzenie klienta — plik `x.html` opisany jako `image/png` był serwowany jako HTML (XSS) | Rozszerzenie z białej listy MIME, bez SVG, nagłówek `nosniff` |
| 9 | Średni | Klient mógł wysłać wiadomość typu `system` (podszywanie się pod komunikaty aplikacji) | Tylko `text` / `image` z API |
| 10 | Średni | Ponowne dołączenie do spaceru/wydarzenia i ponowny swipe/like **dublowały powiadomienia** | Powiadomienie tylko przy faktycznie nowym dołączeniu / dopasowaniu / prośbie |
| 11 | Średni | Uczestnik pełnego spaceru nie mógł zmienić psa (409), można było dołączyć do zakończonego spaceru | Poprawione reguły pojemności i statusu |
| 12 | Średni | Gospodarz mógł „opuścić” własny spacer, organizator własne wydarzenie (osierocone wydarzenia) | Blokada po stronie serwera; przycisk „Nie dam rady” ukryty dla organizatora |
| 13 | Wysoki | Discover pokazywał zawsze **50 najstarszych kont** — po przekroczeniu 50 użytkowników nowi ludzie nie pojawiali się nikomu, a bliskość nie miała znaczenia | Najpierw osoby w promieniu użytkownika (od najbliższych), potem najnowsze konta |
| 14 | Niski | Swipe na nieistniejącego użytkownika zapisywał osierocony rekord | 404 |
| 15 | Niski | Lista na mapie nie odświeżała tłumaczeń po zmianie języka | Brakująca zależność `t` w `useMemo` |
| 16 | Niski | Relay lokalizacji: niezgodny format danych i rozsyłanie do wszystkich pokojów (także DM) | Tylko do wskazanego spaceru, oba formaty współrzędnych |

---

## 3. Propozycje brakujących funkcji

Priorytety: **P0** — blokuje publikację / bezpieczeństwo, **P1** — rdzeń produktu, **P2** — rozwój.
Rozmiar: S (≤1 dzień), M (2–4 dni), L (tydzień+).

### P0 — wymagane przed publikacją

**3.1 Usuwanie konta w aplikacji** · M
App Store (wytyczna 5.1.1(v)) i Google Play wymagają, by aplikacja z zakładaniem konta pozwalała je usunąć w
aplikacji. Dziś może to zrobić tylko admin.
- Serwer: `DELETE /users/me` (kaskada: psy, uczestnictwa, dopasowania, wiadomości → anonimizacja „Usunięty
  użytkownik” zamiast twardego kasowania w czatach grupowych), unieważnienie tokenów.
- Mobile: Profil → „Prywatność i bezpieczeństwo” → „Usuń konto” z `ConfirmDialog tone="danger"`.
  (Pozycja „Privacy & safety” już istnieje i dziś pokazuje tylko „w następnej rundzie”.)

**3.2 Blokowanie i zgłaszanie użytkowników** · M
Aplikacja umawia obcych ludzi na spotkania — to podstawowy mechanizm bezpieczeństwa i wymóg sklepów dla treści
tworzonych przez użytkowników (UGC).
- Model `Block(blockerId, blockedId)` i `Report(reporterId, targetType, targetId, reason, status)`.
- Zablokowany znika z Discover, nie może pisać, nie widzi spacerów blokującego.
- „Zgłoś” w menu profilu, wiadomości, spaceru; kolejka zgłoszeń w panelu admina (panel ma już
  zawieszanie — brakuje tylko wejścia).

**3.3 Push notifications (FCM / APNs)** · M
Endpoint `POST /users/me/fcm-token` jest dziś pustą atrapą, a powiadomienia działają tylko przy otwartej aplikacji.
Cała infrastruktura jest gotowa: `notify()` to jedyny punkt wysyłki i już respektuje zgody użytkownika.
- Zapis tokenów urządzeń (`DeviceToken`), wysyłka z `notify()`, usuwanie nieważnych tokenów.
- Mobile: prośba o zgodę **w kontekście** (np. po pierwszym dołączeniu do spaceru), nie przy starcie.
- Godziny ciszy (np. 22:00–7:00) w ekranie ustawień powiadomień.

**3.4 Limity żądań (rate limiting)** · S
Poza kodem e-mail brak limitów — można spamować swipe, wiadomości, uploady. `express-rate-limit` per użytkownik
+ osobne, ostrzejsze limity dla `/auth/*` i `/storage/upload`.

### P1 — rdzeń produktu

**3.5 Edycja i odwoływanie spacerów oraz wydarzeń** · M
Dziś można tylko zmienić status. Brakuje: edycji godziny/miejsca/limitu, odwołania z powodem, powiadomienia
uczestników o zmianie („Spacer przeniesiony na 18:30”) i nowej kategorii powiadomień „zmiany w moich planach”.

**3.6 Przypomnienia przed spacerem** · S–M
Push 1 h (i opcjonalnie 24 h) przed startem, z przyciskiem „Nadal idę / Nie dam rady”. Najskuteczniejszy sposób na
ograniczenie „no-show” w aplikacjach spotkaniowych.

**3.7 Udostępnianie lokalizacji na żywo podczas spaceru** · M
Serwer ma już zabezpieczony kanał `location:update` (po tej sesji: tylko do uczestników danego spaceru), a mobile go
nie używa. Propozycja: w trakcie spaceru `live` przycisk „Pokaż, gdzie jestem” (opt-in, wyłącza się po zakończeniu),
pinezki uczestników na mapie. Pomaga się odnaleźć na miejscu zbiórki.

**3.8 Śledzenie spaceru i prawdziwe statystyki** · M–L
Statystyka „km razem” jest dziś **szacowana** (4 km na godzinę spaceru). Zapis trasy/dystansu/czasu dla spacerów
`live` → prawdziwe km, historia spacerów psa, odznaki (ikony `medal`/`trophy` są już w systemie ikon).

**3.9 Oceny i opinie po spacerze** · M
Po zakończeniu spaceru: ocena spotkania i „czy poszedłbyś znowu z …” (prywatne). Buduje zaufanie, zasila jakość
Discover, a dla schronisk daje informację zwrotną o wolontariuszach.

**3.10 Cofnięcie dopasowania (unmatch)** · S
Brak możliwości zakończenia kontaktu poza blokadą. Unmatch usuwa wątek u obu stron.

**3.11 Zdjęcia w czacie** · S–M
Serwer akceptuje typ `image`, upload istnieje — brakuje tylko przycisku w `ThreadView` i renderowania.
Naturalne dla aplikacji o psach („zobacz, jaki był zmęczony po spacerze”).

**3.12 Filtry w Discover** · M
Wielkość psa, energia, wiek, dystans, „tylko schroniska”. Dane (energy, ageGroup, personality) już są w modelu psa;
brakuje panelu filtrów (ikona `sliders-horizontal` jest już w systemie ikon).

### P2 — rozwój

**3.13 Profil schroniska i „wolontariat”** · L
Publiczna strona schroniska (adres, godziny, wszystkie psy), kalendarz dostępności psów do spacerów, raport po
spacerze dla schroniska („zjadł, bawił się z innymi psami”), licznik spacerów per pies — argument dla adopcji.

**3.14 Zdrowie i bezpieczeństwo psa** · M
Szczepienia (np. data wścieklizny), uwagi zdrowotne, „nie lubi dużych psów” jako twarde flagi widoczne przed
dołączeniem do spaceru — obok nowej notatki o psie.

**3.15 Spacery cykliczne** · M
„Co wtorek 7:00 w Parku Skaryszewskim” — jedna seria zamiast ręcznego tworzenia co tydzień.

**3.16 Pogoda przy spacerze** · S
Prognoza na godzinę spaceru w szczegółach (ikony `sun`/`cloud-sun`/`umbrella-simple` już są w systemie ikon).

**3.17 Lista oczekujących** · S
Dla pełnych spacerów/wydarzeń — automatyczne powiadomienie, gdy zwolni się miejsce.

**3.18 Tryb offline i cache** · M
Ostatnio pobrane spacery/czaty dostępne bez sieci, kolejka wysyłki wiadomości.

---

## 4. Dług techniczny (warto zaplanować)

- **Lista spacerów bez paginacji** — `GET /walks` ładuje *wszystkie* spacery i filtruje dystans w pamięci; przy
  wzroście danych trzeba stronicowania i zapytania geo po stronie bazy.
- **Reset stanu przy wylogowaniu** — resetowany jest tylko slice `auth`; dane poprzedniego konta (powiadomienia,
  dopasowania, psy) mogą mignąć po zalogowaniu na inne konto. Wspólna akcja `resetAll` w rootReducerze.
- **Zaległości formatowania** — narzędzia lint zostały naprawione w PR #10, ale ujawniły ok. 2600 starszych
  uwag Prettiera w `mobile/`. Warto jednorazowo sformatować całe repo osobnym commitem, bo hook lint-staged
  (`eslint --fix`) przeformatowuje całe pliki przy każdym commicie.
- **Martwy kod** — katalog `backend/` (NestJS) nie jest używany przez aplikację; `services/mock` również. Usunięcie
  zmniejszy zamieszanie i czas instalacji.
- **Testy mobile** — dodano konfigurację Jest i pierwsze testy (sesja/odświeżanie tokenu); warto dołożyć testy
  slice'ów Redux i CI uruchamiające `tsc` + testy serwera + testy mobile przy każdym PR.
- **SQLite** — wystarcza na start; przy produkcji z wieloma instancjami serwera potrzebny Postgres (+ adapter
  Redis dla Socket.io, żeby powiadomienia docierały między instancjami).

## 5. Wdrożenie P0 przez kolejną sesję (2026-09-26)

Na podstawie listy z sekcji 3 zaimplementowano (backend w całości, gotowe do użycia przez API; mobile UI jeszcze
nie zbudowane — patrz niżej):

**Blokowanie i zgłaszanie użytkowników (3.2 z pierwotnej listy braków, patrz P0 wyżej)**
- Nowe modele Prisma `Block` i `Report` (migracja `20260926001214_add_blocks_and_reports`).
- `PUT/DELETE/GET /blocks/:userId` — blokowanie, odblokowanie, lista zablokowanych.
- `POST /reports` — zgłoszenie użytkownika/psa/spaceru/wydarzenia/wiadomości; trafia do kolejki moderacji
  (`GET/PATCH /admin/reports`) w panelu admina.
- Egzekwowanie blokady wpięte w: talię Discover (osoby i psy schroniska), swipe, listę i wysyłanie wiadomości w
  dopasowaniach, polubienie/wiadomości/listę próśb o spacer z psem schroniska, listę spacerów (`GET /walks`).
  **Nie** jest jeszcze wpięte w czat grupowy spaceru (`chat/service.ts`) ani w listowanie/dołączanie do wydarzeń
  (`events/service.ts`) — zablokowana osoba nadal może dołączyć do wydarzenia/spaceru, którego nie widzi na liście,
  jeśli zna jego identyfikator z innego źródła (np. link).
- Testy: `server/src/modules/blocks/blocks.test.ts`, `server/src/modules/reports/reports.test.ts`.

**Usuwanie konta (wymóg App Store/Play Store, brakowało całkowicie)**
- `DELETE /users/me` — usuwa konto z zachowaniem integralności danych: wiadomości nadawcy są przepisywane na
  wspólne konto-sentinel „Deleted user” (żeby historia czatu grupowego nie miała dziur), prowadzone spacery/wydarzenia
  są przekazywane innemu uczestnikowi jeśli taki istnieje (w przeciwnym razie kasowane razem z całym wątkiem),
  a `Match`/`Swipe` (które nie mają relacji Prisma do `User` i inaczej zostałyby osierocone) są czyszczone ręcznie.
- Panel admina (`DELETE /admin/users/:id`) używa teraz tej samej funkcji — wcześniej robił gołe `prisma.user.delete()`,
  co zostawiało osierocone wiersze `Match`/`Swipe` i niszczyło spacery/wydarzenia innych uczestników. Poprawka
  przy okazji.
- Testy: `server/src/modules/users/accountDeletion.test.ts`.

**Rate limiting (ochrona przed nadużyciami API, brakowało całkowicie)**
- `express-rate-limit` na całym `/api/v1` (600/15 min), ostrzejszy na `/auth` (20/15 min) i `/storage` (30/godz.).
  Wyłączony w środowisku testowym (`env.isTest`), żeby nie kolidował z 79+ testami odpalanymi w pętli.

**Wciąż do zrobienia (nie zaczęte w tej sesji)**
- Mobile UI: przycisk „Zgłoś”/„Zablokuj” w `PersonProfileScreen`, menu wątku czatu i menu profilu; ekran „Zablokowani
  użytkownicy”; przepływ „Usuń konto” w Profil → Prywatność i bezpieczeństwo z potwierdzeniem.
- Klient API (`mobile/src/services/api`) dla powyższych endpointów.
- Tłumaczenia i18n (en/pl/es/de) dla nowych ekranów/komunikatów.
- Rozważenie, czy blokada powinna też obejmować czat grupowy spaceru i wydarzenia (patrz wyżej).
