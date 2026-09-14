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

  // Save to Firebase Realtime Database
  const titlesRef = ref(db, "godreads/titles");
  await push(titlesRef, {
    title: title,
    author: author,
    coverId: coverId || null,
    isRead: false,
    score: 0
  });
});

const titlesRef = ref(db, "godreads/titles");
onValue(titlesRef, (snapshot) => {
  const data = snapshot.val();
  container.innerHTML = "";

  if (!data) {
    container.innerHTML = "<p>No books found.</p>";
    return;
  }

  Object.keys(data).forEach((bookId) => {
    const book = new Book(bookId, data[bookId]);
    container.appendChild(book.render());
  });
});