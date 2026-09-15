/**
 * Fetches the Open Library cover ID (cover_i) based on a book title (and optional author).
 * @param {string} title - The title of the book.
 * @param {string} [author=""] - Optional author name to narrow down the search.
 * @returns {Promise<number|null>} The cover ID or null if not found.
 */
export async function fetchCoverIdFromOpenLibrary(title, author = "") {
  try {
    // Searches by title primarily for higher hit rate
    const response = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(title.trim())}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.docs && data.docs.length > 0) {
      // Finds the first doc that contains a cover_i property
      const bookWithCover = data.docs.find((doc) => doc.cover_i);
      return bookWithCover ? bookWithCover.cover_i : null;
    }
  } catch (error) {
    console.error("Error fetching cover ID from Open Library:", error);
  }

  return null;
}