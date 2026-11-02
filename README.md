# Secret Santa

Prosta aplikacja do losowania Secret Santa dla kilku–kilkunastu osób.

- **Logowanie magic linkiem** — wpisujesz e-mail, dostajesz link, bez haseł.
- **Losowanie** — organizator dodaje uczestników i jednym przyciskiem losuje pary. Każdy widzi tylko osobę, której kupuje prezent. Pary tworzą jedno zamknięte koło, więc nikt nie wylosuje siebie.
- **Lista życzeń** — każdy dopisuje po kolei, co chce dostać (link albo opis). Widzi ją tylko osoba, która go wylosowała.
- **Dzieci** — każdy może dodać swoje dziecko z listą prezentów. Listy dzieci są publiczne, a przy każdym prezencie można kliknąć „Kupuję to” — wtedy wszyscy widzą, kto go kupuje.
- **Maile** — link logowania, powiadomienie po losowaniu i przypomnienie o pustej liście (wysyłane z Gmaila).
- Działa i wygląda dobrze na telefonie.

Stack: **Next.js 16** (App Router, Server Actions) · **MongoDB** · **Nodemailer + Gmail SMTP** · hosting na **Vercelu**.

## Jak to działa (dla organizatora)

1. Logujesz się adresem z `ADMIN_EMAILS` — organizator może się zalogować, zanim ktokolwiek jest na liście.
2. W zakładce **Organizator** ustawiasz **budżet** (na prezent Secret Santa i osobno na prezent dla dziecka) oraz datę wymiany — wszyscy widzą je w aplikacji i w mailu po losowaniu. Można je zmienić w każdej chwili.
3. Tam też dodajesz uczestników (imię + e-mail). Siebie też — wpisz swoje imię i ten sam e-mail, żeby nadpisać domyślną nazwę.
4. Dajesz ludziom znać o stronie. Logują się sami swoim mailem i uzupełniają listy życzeń. W tabeli widzisz, kto już się zalogował i ile ma pozycji.
5. Klikasz **Losuj pary**. Lista uczestników się zamyka, każdy dostaje maila, a w aplikacji zamiast „Losowanie jeszcze przed nami” pojawia się wylosowana osoba i jej lista.
6. Po losowaniu możesz wysłać **przypomnienie** do osób z pustą listą albo **cofnąć losowanie** (np. gdy trzeba dopisać spóźnialskiego) i wylosować ponownie.

Pary są tajne — aplikacja nie pokazuje ich nikomu, także organizatorowi.

## Uruchomienie lokalnie

Wymagany Node.js 20.9+.

```bash
npm install
cp .env.example .env.local   # i uzupełnij wartości
npm run dev
```

Aplikacja wstaje na http://localhost:3000. Jako `MONGODB_URI` możesz podać Atlasa albo lokalnego `mongod` (`mongodb://127.0.0.1:27017`).

## Zmienne środowiskowe

| Zmienna | Opis |
| --- | --- |
| `MONGODB_URI` | Connection string do MongoDB (Atlas). |
| `MONGODB_DB` | Nazwa bazy, domyślnie `secret-santa`. Baza i kolekcje tworzą się same. |
| `GMAIL_USER` | Adres Gmail, z którego idą maile. |
| `GMAIL_APP_PASSWORD` | **Hasło aplikacji** Google (nie zwykłe hasło do konta). |
| `ADMIN_EMAILS` | E-mail(e) organizatora, po przecinku. Tylko oni widzą zakładkę Organizator. |
| `APP_URL` | Publiczny adres aplikacji do linków w mailach, np. `https://secret-santa-xyz.vercel.app`. Jeśli brak — brany z adresu, pod którym ktoś wszedł. |
| `EVENT_NAME` | Nazwa wydarzenia, np. `Secret Santa 2026`. |

Budżet na prezent Secret Santa, budżet na prezent dla dziecka i datę wymiany ustawia organizator w aplikacji — nie trzeba nic zmieniać na Vercelu.

## Konfiguracja usług

### MongoDB Atlas

1. W istniejącym projekcie/klastrze nic nie musisz zakładać ręcznie — wystarczy, że `MONGODB_DB` wskazuje nową nazwę bazy (`secret-santa`), a aplikacja sama utworzy kolekcje i indeksy.
2. **Database Access** → utwórz użytkownika z mocnym hasłem i rolą `readWrite` na bazie `secret-santa`.
3. **Network Access** → dodaj `0.0.0.0/0`. Vercel nie ma stałych adresów IP, więc to jedyna prosta opcja na darmowym planie (alternatywa: oficjalna integracja MongoDB Atlas w Vercel Marketplace).
4. **Connect → Drivers** → skopiuj connection string do `MONGODB_URI` i wstaw hasło użytkownika.

### Gmail (hasło aplikacji)

1. Włącz weryfikację dwuetapową na koncie Google: https://myaccount.google.com/security
2. Wygeneruj hasło aplikacji: https://myaccount.google.com/apppasswords (nazwa np. „Secret Santa”).
3. Wklej 16-znakowe hasło do `GMAIL_APP_PASSWORD` (spacje nie przeszkadzają).

Limit Gmaila to ok. 500 maili dziennie — przy kilkunastu osobach z ogromnym zapasem. Maile przychodzą od Twojego adresu, z nazwą nadawcy z `EVENT_NAME`.

### Vercel

1. Wypchnij repo na GitHuba.
2. W Vercelu: **Add New → Project** → wybierz repo `secret-santa` → framework wykryje się sam (Next.js).
3. Przed pierwszym deployem wpisz wszystkie zmienne z tabeli w **Environment Variables**. `APP_URL` możesz uzupełnić po pierwszym deployu, gdy znasz już adres — potem zrób **Redeploy**.
4. Każdy push na `main` sam się wdraża.

Darmowy plan Hobby wystarcza (do użytku prywatnego, niekomercyjnego), a projekt nie zabiera nic innym projektom na koncie poza wspólnymi, bardzo hojnymi limitami.

## Struktura

```
app/
  login/                 logowanie (formularz magic linka)
  api/auth/verify/       wejście z linku w mailu → sesja → przekierowanie
  (app)/                 strony dla zalogowanych (wspólny nagłówek)
    page.tsx             „Mój Secret Santa”: los, moja lista, moje dzieci
    dzieci/              publiczne listy dzieci z rezerwacjami
    admin/               organizator: uczestnicy, losowanie, przypomnienia
components/              ikony, nawigacja, przycisk z potwierdzeniem, linki w listach
lib/
  actions.ts             wszystkie akcje serwera (formularze)
  auth.ts                tokeny logowania i sesje (ciasteczko httpOnly)
  db.ts                  połączenie z MongoDB, typy, indeksy
  mail.ts                wysyłka przez Gmail + szablony maili
```

### Dane w MongoDB

- `users` — uczestnik: e-mail, imię, lista życzeń (osadzona), `receiverId` (komu kupuje — ustawiane przez losowanie).
- `children` — dziecko: rodzic, imię, prezenty z informacją, kto je kupuje.
- `meta` — jeden dokument `event`: data losowania (`drawnAt`, `null` = przed losowaniem), budżety (`budget`, `childBudget`) i data wymiany (`exchangeDate`).
- `loginTokens`, `sessions` — hashe tokenów; wygasają same (indeks TTL).

### Bezpieczeństwo w skrócie

- W bazie trzymamy tylko hashe (SHA-256) tokenów logowania i sesji.
- Link logowania jest ważny 15 minut; nowy można wysłać raz na minutę.
- Sesja trwa 90 dni (ciasteczko `httpOnly`, `secure` na produkcji).
- Wylosowana osoba trafia do przeglądarki tylko u osoby, która ją wylosowała.
