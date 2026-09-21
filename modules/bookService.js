export async function searchOpenLibrary(title, author = "") {
  try {
    const query = author ? `${title} ${author}` : title;
    const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.docs || data.docs.length === 0) return null;

    const match = data.docs[0];
    return {
      title: match.title || title,
      author: match.author_name ? match.author_name[0] : author || "Unknown author",
      coverId: match.cover_i || null,
      workKey: match.key || null, // <-- Internal Open Library work ID needed for synopsis fetch
      publishYear: match.first_publish_year || "Unknown"
    };
  } catch (error) {
    console.error("Open Library search failed:", error);
    return null;
  }
}

export async function fetchWorkDescription(workKey) {
  try {
    const response = await fetch(`https://openlibrary.org${workKey}.json`);
    if (!response.ok) return "No description available.";

    const data = await response.json();
    if (!data.description) return "No description available.";

    const rawDescription = typeof data.description === "object" ? data.description.value : data.description;
    return sanitizeDescription(rawDescription);
  } catch (error) {
    console.error("Failed to fetch work description:", error);
    return "Could not load description.";
  }
}

// Removes trailing artifact text "--Cover" from synopsis
function sanitizeDescription(text) {
  if (!text) return "No description available.";
  return text
    .trim()
    .replace(/--\s*cover\s*$/i, "")
    .replace(/----------\s*$/i, "")
    .trim();
}