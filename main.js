import { db } from "./modules/firebaseconfig.js";
import { fetchCoverIdFromOpenLibrary } from "./modules/coverfetch.js";
import { Book } from "./modules/Book.js";
import { ref, onValue, push } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

const container = document.getElementById("books-container");
const addBookBtn = document.getElementById("add-book-btn");

addBookBtn.addEventListener("click", async () => {
  const title = prompt("Enter title:");
  if (!title || !title.trim()) return;

  let author = prompt("Enter author (leave blank to auto-detect):");
  author = author ? author.trim() : "";

  let coverId = null;
  let detectedAuthor = author;

  try {
    // Search Open Library for title and author details
    const searchQuery = author ? `${title} ${author}` : title;
    const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}`);
    const data = await response.json();

    if (data.docs && data.docs.length > 0) {
      const topMatch = data.docs[0];

      // Format title using official API capitalization
      if (topMatch.title) {
        title = topMatch.title;
      }

      // Auto-detect or format author
      if (topMatch.author_name && topMatch.author_name.length > 0) {
        author = topMatch.author_name[0];
      }

    //   Matches title and author with cover ID
      if (topMatch.cover_i) {
        coverId = topMatch.cover_i;
      }
    }
  } catch (error) {
    console.error("Error auto-detecting book details:", error);
  }

  // Fallback if no author was entered and none was found
  if (!detectedAuthor) {
    detectedAuthor = "Unknown author";
  }

  // Creates an instance based on Book.js constructor
  const newBook = new Book(null, {
    title,
    author: author || detectedAuthor,
    coverId
  });

  // Exports to Firebase Realtime Database through instance
  const titlesRef = ref(db, "godreads/titles");
  await push(titlesRef, newBook.toFirebase());
});

// Listens to database and renders books as objects i real time
const titlesRef = ref(db, "godreads/titles");
onValue(titlesRef, (snapshot) => {
  const data = snapshot.val();
  container.innerHTML = "";

  if (!data) {
    container.innerHTML = "<p>No books found.</p>";
    return;
  }
// Renders cards in HTML
  Object.keys(data).forEach((bookId) => {
    const book = new Book(bookId, data[bookId]);
    container.appendChild(book.render());
  });
});