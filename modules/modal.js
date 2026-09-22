import { fetchWorkDescription, searchOpenLibrary } from "./bookService.js";

export async function displayBookModal(book, onDeleteCallback) {
  const modal = document.getElementById("book-modal");
  const modalCover = document.getElementById("modal-cover");
  const modalTitle = document.getElementById("modal-title");
  const modalAuthor = document.getElementById("modal-author");
  const modalYear = document.getElementById("modal-year");
  const modalSynopsis = document.getElementById("modal-synopsis");
  const closeBtn = modal.querySelector(".close-modal");
  const modalInfo = modal.querySelector(".modal-info");

  const existingRemoveBtn = modalInfo.querySelector(".modal-remove-btn");
  if (existingRemoveBtn) {
    existingRemoveBtn.remove();
  }

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn-remove modal-remove-btn";
  removeBtn.textContent = "Remove Title";
  modalInfo.appendChild(removeBtn);

  modalCover.src = book.getLargeCoverUrl();
  modalTitle.textContent = book.title;
  modalAuthor.textContent = `by ${book.author}`;
  modalYear.textContent = "First published: Loading...";
  modalSynopsis.textContent = "Loading synopsis...";

  removeBtn.onclick = async () => {
    const deleted = await onDeleteCallback();
    if (deleted) closeModal();
  };

  closeBtn.onclick = closeModal;
  // Closes modal when clicking on overlay backdrop
  window.onclick = (event) => {
    if (event.target === modal) closeModal();
  };

  modal.classList.remove("hidden");
 
  const searchData = await searchOpenLibrary(book.title, book.author);
  if (searchData) {
    modalYear.textContent = `First published: ${searchData.publishYear}`;
    if (searchData.workKey) {
      modalSynopsis.textContent = await fetchWorkDescription(searchData.workKey);
    } else {
      modalSynopsis.textContent = "No synopsis available.";
    }
  } else {
    modalYear.textContent = "First published: Unknown";
    modalSynopsis.textContent = "No additional info found.";
  }
}

function closeModal() {
  const modal = document.getElementById("book-modal");
  modal.classList.add("hidden");
}