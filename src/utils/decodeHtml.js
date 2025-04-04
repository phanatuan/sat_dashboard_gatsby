// src/utils/decodeHtml.js

// Common Mojibake patterns often resulting from UTF-8 interpreted as Windows-1252/ISO-8859-1
// Add more pairs here as you discover other Mojibake characters in your specific data
const mojibakeReplacements = [
  ["â€œ", '"'], // Left double quote
  ["â€�", '"'], // Right double quote
  ["â€˜", "'"], // Left single quote
  ["â€™", "'"], // Right single quote (apostrophe)
  ["â€¦", "…"], // Ellipsis
  ["â€“", "–"], // En dash
  ["â€”", "—"], // Em dash
  ["â€¢", "•"], // Bullet
  ["", " "],
  ["Ã©", "é"],
  ["Ã¨", "è"],
  ["Ã¼", "ü"],
  ["â‚¬", "€"],
  ['"“', " - "],
  ['"”', ""],
  ["Â©", "©"],
  ["—", " - "],
];

/**
 * Attempts to fix common Mojibake encoding issues in a string
 * by replacing known incorrect sequences with their correct UTF-8 characters.
 * @param {string | null | undefined} inputText The potentially corrupted text.
 * @returns {string} The cleaned text, or the original if input is invalid/empty.
 */
export const decodeMojibake = (inputText) => {
  if (!inputText || typeof inputText !== "string") {
    return inputText || ""; // Return original or empty string if input is bad
  }

  let cleanedText = inputText;

  for (const [mojibake, correctChar] of mojibakeReplacements) {
    // Use replaceAll for thoroughness
    cleanedText = cleanedText.replaceAll(mojibake, correctChar);
  }

  // Optional: Catch-all for characters that might result from double-encoding issues
  // This specifically targets characters misinterpreted as ISO-8859-1 then UTF-8 again.
  // Use with caution, test thoroughly. Might fix things like Â followed by a symbol.
  // Example: Â£ -> £
  // try {
  //   cleanedText = decodeURIComponent(escape(cleanedText));
  // } catch (e) {
  //   // Ignore errors, means it likely wasn't double-encoded this way
  //   // console.warn("Could not apply decodeURIComponent/escape fix:", e);
  // }

  return cleanedText;
};

// Example usage (for testing):
// const badString = "This has â€œquotesâ€� and an apostropheâ€™s edge case.";
// console.log(decodeMojibake(badString)); // Output: This has "quotes" and an apostrophe's edge case.
