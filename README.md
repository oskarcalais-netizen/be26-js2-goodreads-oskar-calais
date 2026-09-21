\_**\_ GODREADS \_\_**

Appen är en inlämningsuppgift i kursen Javascvript 2 för Backend-utbildningen på Grit Academy. Uppgiften består i att skapa en egen version av "Goodreads" där en lista över böcker visas. Böcker ska kunna läggas till, togglas som "Lästa", betygsättas samt tas bort.

FRD (Firebase Realtime Database) med dess REST-API har använts, och varje bok innehåller nycklar och värden såsom _title_, _author_, _isRead_, _score_ etc.

Objektorienterad (OOP-) programmering har använts (t.ex. renderas objekt utifrån en konstruktor), samt säkerhetsinkapsling (Encapsulation).

Webbapplikationen bundlas med Vite och deployas med Netflify.

\_**\_ EXEKVERINGSFLÖDE \_\_**

1. Initiering och laddning (main.js)

När applikationen laddas i webbläsaren anropas `loadAndRenderBooks()` i `main.js`. Denna funktion hämtar befintliga böcker från Firebase via REST API och renderar ut dem på sidan.

2. Hämtning från databasen (api.js)

Hämtningen sker genom att `fetchAllBooksFromDb()` kör ett `GET`-anrop mot Firebase Realtime Database REST API. Den returnerade datan omvandlas till bokobjekt.

3. Instansiering & rendering av kort (Book.js)

För varje bok-ID som returneras instansieras ett objekt via `new Book(bookId, data, loadAndRenderBooks)`. Dess privata `#render()`-flöde och metoder genererar HTML-kortet samt sätter upp interna eventlyssnare.

4. Automatisk datakomplettering (Book.js & bookService.js)

Under renderingen körs den privata metoden `#syncMissingDetails()` som anropar `bookService.js`. Om titeln saknar omslag, exakt titelformatering eller författare görs en sökning mot Open Library API. Hittas ny information uppdateras DOM-elementen och ändringarna sparas till Firebase med ett `PATCH`-anrop via `api.js`.

5. Skapa ny bok (main.js, bookService.js & api.js)

När användaren klickar på "Add book" öppnas två promptar för titel och författare. `handleAddBook()` i `main.js` anropar `searchOpenLibrary()` för att hämta officiell titel, författare samt omslags-ID. Därefter skapas en ny `Book`-instans och sparas till Firebase via `saveBookToDb()` (`POST`-anrop). Slutligen återrenderas listan i UI.

6. Interaktioner på kortet (Book.js & api.js)

   ○ Betyg & Läst-status: Ändringar i checkboxen eller stjärnorna hanteras av de privata metoderna `#handleReadStatusToggle()` och `#handleScoreChange()`, som skickar ett `PATCH`-anrop (`updateBookInDb`) till Firebase.

   ○ Radera: Klick på "Remove" triggar den privata metoden `#deleteBook()`, som kör ett `DELETE`-anrop (`deleteBookFromDb`) mot Firebase och anropar callback-funktionen för att uppdatera vyn.

7. Modalvy & detaljhämtning (modal.js & bookService.js)

Klick på en boks titel eller omslag anropar `displayBookModal()` i `modal.js`. Modalen öppnas och visar direkt den information som redan finns. Därefter hämtas utgivningsår och synopsis i bakgrunden via `bookService.js` (Search API & Works API). Beskrivningen rensas från oönskade tecken/formateringar i `sanitizeDescription()` innan den visas.

\_**\_ MAIN.JS \_\_**

    Fungerar som applikationens startpunkt; kopplas mot index.html och binder ihop övriga moduler.

    Hanterar användarinteraktion för att lägga till nya böcker via promptar.

    Initierar laddning av alla böcker vid start och styr omrendering av vyn när datastrukturen förändras.

\_**\_ MODULER \_\_**

■ api.js:
Hanterar all direkt kommunikation med Firebase Realtime Database via HTTP-anrop (GET, POST, PATCH, DELETE) med standarden `fetch`.

■ bookService.js:
Dedikerad modul för integration mot Open Library API. Innehåller funktioner för att söka efter bokdetaljer, hämta synopsis baserat på en nyckel (workKey) samt korrigera beskrivningstexten.

■ modal.js:
Hanterar allt som rör visning, stängning och uppdatering av innehåll i detaljmodalen.

■ Book.js:
Modul för OOP-strukturen kring böcker. Tillämpar inkapsling genom privata fält (#id, #title, etc.) och privata metoder för interaktionshantering (#attachEventListeners, #handleReadStatusToggle, #deleteBook m.fl.). Ansvarar för generering av boken som DOM-element och dess lokala tillstånd.

\_**\_ ENCAPSULATION (INKAPSLING & SÄKERHET) \_\_**

I `Book.js` tillämpas inkapsling genom användning av privata instansvariabler och metoder (identifieras med `#`-prefixet, t.ex. `#id`, `#title`, `#deleteBook()`).

Objektets interna tillstånd och logik skyddas därigenom från manipulering utifrån. Utomstående skript eller moduler kan inte av misstag ändra interna värden eller anropa känsliga metoder direkt på klassinstansen.

\_**\_ GETTERS OCH SETTERS \_\_**

Kontrollerar hur objektets privata egenskaper läses och modifieras i `Book`-klassen:

■ GETTERS (`get`): Ger läsrättighet till privata fält utifrån utan att exponera variablerna direkt (t.ex. `book.title` returnerar värdet av `#title`).
■ SETTERS (`set`): Säkerställer datavalidering vid skrivning; kontrollerar olika aspekter av variabler innan ett nytt värde tilldelas (för t.ex.`score` måste betyget vara ett nummer mellan 0 och 5).
