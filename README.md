**\_\_\_\_** EXEKVERINGSFLÖDE **\_\_\_\_**

1. Konfiguration & initiering

När applikationen laddas körs firebaseconfig.js. Firebase-appen initieras med dina nycklar och databasinstansen db exporteras för användning i övriga moduler.

2. Realtidslyssnare startar (main.js)

I main.js sätts en onValue-lyssnare mot mappen godreads/titles i Firebase Realtime Database.

3. Instansiering & rendering av kort (Book.js)

När databasen returnerar böcker rensas containern i DOM-trädet. För varje bok-ID instansieras ett nytt objekt via new Book(bookId, data) och dess render()-metod genererar HTML-kortet.

4. Automatisk datakomplettering & tvätt (Book.js)

I render() görs ett bakgrundsanrop (fetch) mot Open Library API för att verifiera/korrigera bokens titel, hämta saknat författarnamn eller omslags-ID. Hittas ny information uppdateras kortet i DOM och ändringarna sparas direkt till Firebase med update().

5. Skapa ny bok (main.js & coverfetch.js)

När användaren klickar på "Add book" öppnas promptar. main.js gör en sökning mot Open Library för att hämta officiell titel, författare samt omslags-ID. Datan sparas till Firebase med push(), vilket automatiskt triggar onValue att rita om listan.

6. Interaktioner på kortet (Book.js)

   ○ Betyg & Läst-status: Ändringar i checkboxen eller stjärnorna skickar direkt en update() till Firebase.

   ○ Radera: Klick på "Remove" triggar deleteBook(), vilket kör remove() mot Firebase och raderar boken.

7. Modalvy & detaljhämtning (Book.js)

Klick på titel eller omslag öppnar modalen. openModal() sätter direkt grunddata och gör sedan ytterligare två fetch-anrop mot Open Library (Search API & Works API) för att hämta utgivningsår och synopsis. Synopsis tvättas med cleanSynopsis() innan den visas.

**\_\_\_\_** MAIN.JS **\_\_\_\_**

Lyssnar på ändringar med onValue() och lägger till nya poster med push(), samt kör fetch() mot search.json vid skapande av bok för att auto-korrigera titel/författare.

**\_\_\_\_** MODULER **\_\_\_\_**

■ firebaseconfig.js:
Initierar Firebase med initializeApp() och getDatabase() och exporterar databasinstansen (db)

■ firebaserequests.js:
Innehåller bas-URL till Firebase Realtime Database (godreads).

■ coverfetch.js:
Hjälpmodul som söker upp och returnerar ett omslags-ID (cover_i) från Open Library utifrån titel och författare.

■ Book.js:
Huvudmodul för OOP-struktur. Skapar instanser av böcker, genererar card-HTML (render), hantera eventlyssnare, textkorrigerar API-data (cleanSynopsis), öppnar/fyller modalen med fördjupad fakta samt synkar ändringar/borttagningar mot Firebase.

    Kör även fetch() mot search.json i render() för datakomplettering, samt i openModal() mot både search.json och [https://openlibrary.org/works/...json](https://openlibrary.org/works/...json) för att hämta utgivningsår och synopsis.
