const BASE_URL = "https://be26-firebase-default-rtdb.europe-west1.firebasedatabase.app/godreads/titles";

export async function fetchAllBooksFromDb() {
  const response = await fetch(`${BASE_URL}.json`);
  if (!response.ok) throw new Error("Failed to fetch books from database.");
  return await response.json();
}

export async function saveBookToDb(bookData) {
  const response = await fetch(`${BASE_URL}.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookData)
  });
  if (!response.ok) throw new Error("Failed to save book to database.");
  return await response.json();
}

export async function updateBookInDb(id, updates) {
  const response = await fetch(`${BASE_URL}/${id}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates)
  });
  if (!response.ok) throw new Error("Failed to update book in database.");
  return await response.json();
}

export async function deleteBookFromDb(id) {
  const response = await fetch(`${BASE_URL}/${id}.json`, {
    method: "DELETE"
  });
  if (!response.ok) throw new Error("Failed to delete book from database.");
  return await response.json();
}