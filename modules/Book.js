import { db } from "./firebaseconfig.js";
import { fetchCoverIdFromOpenLibrary } from "./coverfetch.js";
import { ref, update, remove } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

export class Book {
  constructor(id, data) {
    this.id = id;
    this.title = data.title || "Unknown title";
    this.author = data.author || "Unknown author";
    this.coverId = data.coverId || null;
    this.isbn = data.isbn || null;
    this.isRead = data.isRead || false;
    this.score = data.score || 0;
  }

  // Fetch big cover for modal
  getLargeCoverUrl() {
    if (this.coverId) {
      return `https://covers.openlibrary.org/b/id/${this.coverId}-L.jpg`;
    }
    if (this.isbn) {
      return `https://covers.openlibrary.org/b/isbn/${this.isbn}-L.jpg`;
    }
    return "https://via.placeholder.com/300x450?text=No+Cover";
  }

  getCoverUrl() {
    if (this.coverId) {
      return `https://covers.openlibrary.org/b/id/${this.coverId}-M.jpg`;
    }
    if (this.isbn) {
      return `https://covers.openlibrary.org/b/isbn/${this.isbn}-M.jpg`;
    }
    return "https://via.placeholder.com/150x220?text=No+Cover";
  }

  render() {
    const card = document.createElement("article");
    card.classList.add("book-card");

    card.innerHTML = `
      <div class="cover-wrapper" style="cursor: pointer;">
        <img src="${this.getCoverUrl()}" alt="Cover for ${this.title}" class="book-cover" id="cover-${this.id}" />
      </div>
      <div class="book-info">
        <h3 class="clickable-title" style="cursor: pointer;">${this.title}</h3>
        <p class="author">by ${this.author}</p>
        
        <div class="read-toggle">
          <label>
            <input type="checkbox" class="toggle-read" ${this.isRead ? "checked" : ""} />
            Read
          </label>
        </div>

        <div class="score-container ${this.isRead ? "" : "hidden"}">
          <span class="score-title">Score:</span>
          <div class="stars">
            ${[1, 2, 3, 4, 5].map(star => `
              <span class="star ${star <= this.score ? "active" : ""}" data-value="${star}">★</span>
            `).join("")}
          </div>
        </div>

        <button class="btn-remove card-remove-btn">Remove</button>
      </div>
    `;

// Async fetch for title formatting, cover, and author if missing/unformatted
    if (this.title) {
      fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(this.title)}`)
        .then(res => res.json())
        .then(data => {
          if (data.docs && data.docs.length > 0) {
            const match = data.docs[0];
            const updates = {};

            // Update and format title casing
            if (match.title && match.title !== this.title) {
              this.title = match.title;
              updates.title = match.title;
              const titleElement = card.querySelector(".clickable-title");
              if (titleElement) {
                titleElement.textContent = match.title;
              }
            }

            // Update cover if missing
            if (!this.coverId && match.cover_i) {
              this.coverId = match.cover_i;
              updates.coverId = match.cover_i;
              const imgElement = card.querySelector(`[id="cover-${this.id}"]`);
              if (imgElement) {
                imgElement.src = `https://covers.openlibrary.org/b/id/${match.cover_i}-M.jpg`;
              }
            }

            // Update author if unknown
            if (this.author === "Unknown author" && match.author_name && match.author_name.length > 0) {
              this.author = match.author_name[0];
              updates.author = this.author;
              const authorElement = card.querySelector(".author");
              if (authorElement) {
                authorElement.textContent = `by ${this.author}`;
              }
            }

            // Sync updates back to Firebase
            if (Object.keys(updates).length > 0) {
              update(ref(db, `godreads/titles/${this.id}`), updates);
            }
          }
        })
        .catch(err => console.error("Error fetching missing book info:", err));
    }

    this.attachEventListeners(card);
    return card;
  }

  // Deletes the book entry from Firebase Database
  async deleteBook() {
    const confirmDelete = confirm(`Are you sure you want to remove "${this.title}"?`);
    if (confirmDelete) {
      try {
        await remove(ref(db, `godreads/titles/${this.id}`));
      } catch (error) {
        console.error("Error deleting title from Firebase:", error);
      }
    }
  }

  attachEventListeners(card) {
    const readCheckbox = card.querySelector(".toggle-read");
    const stars = card.querySelectorAll(".star");
    const coverWrapper = card.querySelector(".cover-wrapper");
    const titleElement = card.querySelector(".clickable-title");
    const removeBtn = card.querySelector(".card-remove-btn");

    // Open modal
    const openModalHandler = () => this.openModal();
    coverWrapper.addEventListener("click", openModalHandler);
    titleElement.addEventListener("click", openModalHandler);

    // Remove book from card button
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.deleteBook();
    });

    readCheckbox.addEventListener("change", (e) => {
      const isChecked = e.target.checked;
      update(ref(db, `godreads/titles/${this.id}`), {
        isRead: isChecked,
        score: isChecked ? this.score : 0
      });
    });

    stars.forEach((star) => {
      star.addEventListener("click", (e) => {
        if (!readCheckbox.checked) return;
        const selectedScore = Number(e.target.dataset.value);
        update(ref(db, `godreads/titles/${this.id}`), {
          score: selectedScore
        });
      });
    });
  }

  cleanSynopsis(text) {
    if (!text) return "No synopsis available for this title.";
    return text
      .trim()
      .replace(/--\s*cover\s*$/i, "") // Removes trailing '--Cover'
      .replace(/----------\s*$/i, "") // Removes trailing divider lines
      .trim();
  }

  // Fetch details
  async openModal() {
    const modal = document.getElementById("book-modal");
    const modalCover = document.getElementById("modal-cover");
    const modalTitle = document.getElementById("modal-title");
    const modalAuthor = document.getElementById("modal-author");
    const modalYear = document.getElementById("modal-year");
    const modalSynopsis = document.getElementById("modal-synopsis");
    const closeBtn = modal.querySelector(".close-modal");

    // Remove button inside modal
    let modalRemoveBtn = modal.querySelector(".modal-remove-btn");
    if (!modalRemoveBtn) {
      modalRemoveBtn = document.createElement("button");
      modalRemoveBtn.className = "btn-remove modal-remove-btn";
      modalRemoveBtn.textContent = "Remove Title";
      modal.querySelector(".modal-info").appendChild(modalRemoveBtn);
    }

    // Bind modal remove action
    modalRemoveBtn.onclick = async () => {
      await this.deleteBook();
      modal.classList.add("hidden");
    };

    // Current data
    modalCover.src = this.getLargeCoverUrl();
    modalTitle.textContent = this.title;
    modalAuthor.textContent = `by ${this.author}`;
    modalYear.textContent = "First published: Loading...";
    modalSynopsis.textContent = "Loading description...";

    modal.classList.remove("hidden");

    // Close-event
    closeBtn.onclick = () => modal.classList.add("hidden");
    window.onclick = (event) => {
      if (event.target === modal) modal.classList.add("hidden");
    };

    // Detailed info
    try {
      const response = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(this.title)}`);
      const data = await response.json();

      if (data.docs && data.docs.length > 0) {
        const bookDoc = data.docs[0];

        // Publishing date
        if (bookDoc.first_publish_year) {
          modalYear.textContent = `First published: ${bookDoc.first_publish_year}`;
        } else {
          modalYear.textContent = "First published: Unknown";
        }

        if (bookDoc.key) {
          const workResponse = await fetch(`https://openlibrary.org${bookDoc.key}.json`);
          const workData = await workResponse.json();

          if (workData.description) {
            const descriptionText = typeof workData.description === "object"
              ? workData.description.value
              : workData.description;

            modalSynopsis.textContent = this.cleanSynopsis(descriptionText);
          } else {
            modalSynopsis.textContent = "No synopsis available for this title.";
          }
        }
      } else {
        modalSynopsis.textContent = "No additional info found.";
      }
    } catch (error) {
      console.error("Error fetching title details:", error);
      modalSynopsis.textContent = "Could not load info.";
    }
  }
}