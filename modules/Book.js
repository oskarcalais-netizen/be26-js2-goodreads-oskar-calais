import { updateBookInDb, deleteBookFromDb } from "./api.js";
import { searchOpenLibrary } from "./bookService.js";
import { displayBookModal } from "./modal.js";

export class Book {
  #id;
  #title;
  #author;
  #coverId;
  #isbn;
  #isRead;
  #score;
  #onBookDeleted;

  constructor(id, data, onBookDeleted = null) {
    this.#id = id;
    this.#title = data.title || "Unknown title";
    this.#author = data.author || "Unknown author";
    this.#coverId = data.coverId || null;
    this.#isbn = data.isbn || null;
    this.#isRead = data.isRead || false;
    this.#onBookDeleted = onBookDeleted; // <-- Callback from main.js: triggers re-rendering UI on book deletion
    this.score = data.score || 0;
  }

  get id() { return this.#id; }
  get title() { return this.#title; }
  get author() { return this.#author; }
  get coverId() { return this.#coverId; }
  get isbn() { return this.#isbn; }
  get isRead() { return this.#isRead; }
  get score() { return this.#score; }

  set title(newTitle) {
    if (typeof newTitle === "string" && newTitle.trim() !== "") {
      this.#title = newTitle.trim();
    }
  }

  set author(newAuthor) {
    if (typeof newAuthor === "string" && newAuthor.trim() !== "") {
      this.#author = newAuthor.trim();
    }
  }

  set coverId(newCoverId) {
    this.#coverId = newCoverId;
  }

  set isRead(status) {
    this.#isRead = Boolean(status);
    if (!this.#isRead) this.#score = 0;
  }

  set score(newScore) {
    const numericScore = Number(newScore);
    if (numericScore >= 0 && numericScore <= 5) {
      this.#score = numericScore;
    }
  }

  toDatabaseObject() {
    return {
      title: this.#title,
      author: this.#author,
      coverId: this.#coverId,
      isbn: this.#isbn,
      isRead: this.#isRead,
      score: this.#score
    };
  }

  getCoverUrl() {
    if (this.#coverId) return `https://covers.openlibrary.org/b/id/${this.#coverId}-M.jpg`;
    if (this.#isbn) return `https://covers.openlibrary.org/b/isbn/${this.#isbn}-M.jpg`;
    return "https://via.placeholder.com/150x220?text=No+Cover";
  }

  getLargeCoverUrl() {
    if (this.#coverId) return `https://covers.openlibrary.org/b/id/${this.#coverId}-L.jpg`;
    if (this.#isbn) return `https://covers.openlibrary.org/b/isbn/${this.#isbn}-L.jpg`;
    return "https://via.placeholder.com/300x450?text=No+Cover";
  }

  render() {
    const card = document.createElement("article");
    card.classList.add("book-card");
    card.innerHTML = `
      <div class="cover-wrapper" style="cursor: pointer;">
        <img src="${this.getCoverUrl()}" alt="Cover for ${this.#title}" class="book-cover" id="cover-${this.#id}" />
      </div>
      <div class="book-info">
        <h3 class="clickable-title" style="cursor: pointer;">${this.#title}</h3>
        <p class="author">by ${this.#author}</p>
        <div class="read-toggle">
          <label>
            <input type="checkbox" class="toggle-read" ${this.#isRead ? "checked" : ""} />
            Read
          </label>
        </div>
        <div class="score-container ${this.#isRead ? "" : "hidden"}">
          <span class="score-title">Score:</span>
          <div class="stars">${this.#renderStars()}</div>
        </div>
        <button class="btn-remove card-remove-btn">Remove</button>
      </div>
    `;

    // Background fetch for book metadata (does not block DOM rendering)
    this.#syncMissingDetails(card);
    this.#attachEventListeners(card);
    return card;
  }

  // --- PRIVATE METHODS ---

  #renderStars() {
    return [1, 2, 3, 4, 5]
      .map(star => `<span class="star ${star <= this.#score ? "active" : ""}" data-value="${star}">★</span>`)
      .join("");
  }

  #attachEventListeners(card) {
    const readCheckbox = card.querySelector(".toggle-read");
    const stars = card.querySelectorAll(".star");
    const coverWrapper = card.querySelector(".cover-wrapper");
    const titleElement = card.querySelector(".clickable-title");
    const removeBtn = card.querySelector(".card-remove-btn");

    const openModal = () => displayBookModal(this, () => this.#deleteBook());
    coverWrapper.addEventListener("click", openModal);
    titleElement.addEventListener("click", openModal);

    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#deleteBook();
    });

    readCheckbox.addEventListener("change", (e) => this.#handleReadStatusToggle(e, card));
    stars.forEach(star => star.addEventListener("click", (e) => this.#handleScoreChange(e)));
  }

  async #handleReadStatusToggle(event, card) {
    this.isRead = event.target.checked;
    const scoreContainer = card.querySelector(".score-container");
    if (scoreContainer) scoreContainer.classList.toggle("hidden", !this.#isRead);

    await updateBookInDb(this.#id, { isRead: this.#isRead, score: this.#score });
  }

  async #handleScoreChange(event) {
    if (!this.#isRead) return;
    this.score = Number(event.target.dataset.value);
    await updateBookInDb(this.#id, { score: this.#score });
  }

  async #syncMissingDetails(card) {
    if (!this.#title) return;

    const data = await searchOpenLibrary(this.#title);
    if (!data) return;

    const updates = {};
    if (data.title && data.title !== this.#title) {
      this.title = data.title;
      updates.title = data.title;
      const el = card.querySelector(".clickable-title");
      if (el) el.textContent = data.title;
    }

    if (!this.#coverId && data.coverId) {
      this.coverId = data.coverId;
      updates.coverId = data.coverId;
      const img = card.querySelector(`#cover-${this.#id}`);
      if (img) img.src = this.getCoverUrl();
    }

    if (this.#author === "Unknown author" && data.author) {
      this.author = data.author;
      updates.author = data.author;
      const authorEl = card.querySelector(".author");
      if (authorEl) authorEl.textContent = `by ${data.author}`;
    }

    if (Object.keys(updates).length > 0) {
      await updateBookInDb(this.#id, updates);
    }
  }

  async #deleteBook() {
    const confirmDelete = confirm(`Are you sure you want to remove "${this.#title}"?`);
    if (!confirmDelete) return false;

    try {
      await deleteBookFromDb(this.#id);
      if (this.#onBookDeleted) this.#onBookDeleted();
      return true;
    } catch (error) {
      console.error("Failed to delete book:", error);
      return false;
    }
  }
}