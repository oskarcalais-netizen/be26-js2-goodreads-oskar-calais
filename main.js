import { fetchAllBooksFromDb, saveBookToDb } from "./modules/api.js";
import { searchOpenLibrary } from "./modules/bookService.js";
import { Book } from "./modules/Book.js";

const container = document.getElementById("books-container");
const addBookBtn = document.getElementById("add-book-btn");

addBookBtn.addEventListener("click", handleAddBook);

async function loadAndRenderBooks() {
  try {
    const data = await fetchAllBooksFromDb();
    container.innerHTML = "";

    if (!data) {
      container.innerHTML = "<p>No books found.</p>";
      return;
    }

    Object.keys(data).forEach((bookId) => {
      const book = new Book(bookId, data[bookId], loadAndRenderBooks);
      container.appendChild(book.render());
    });
  } catch (error) {
    console.error("Error loading books:", error);
    container.innerHTML = "<p>Failed to load books.</p>";
  }
}

async function handleAddBook() {
  const titleInput = prompt("Enter title:");
  if (!titleInput || !titleInput.trim()) return;

  const authorInput = prompt("Enter author (leave blank to auto-detect):");
  const author = authorInput ? authorInput.trim() : "";

  let title = titleInput.trim();
  let detectedAuthor = author;
  let coverId = null;

  const searchData = await searchOpenLibrary(title, author);
  if (searchData) {
    title = searchData.title;
    if (!detectedAuthor) detectedAuthor = searchData.author;
    coverId = searchData.coverId;
  }

  const newBook = new Book(null, {
    title,
    author: detectedAuthor || "Unknown author",
    coverId
  });

  await saveBookToDb(newBook.toDatabaseObject());
  await loadAndRenderBooks();
}

// Initial application setup
loadAndRenderBooks();