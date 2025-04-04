// src/utils/decodeHtml.js

// Common Mojibake patterns...
const mojibakeReplacements = [
  ["â€œ", '"'], // Left double quote
  ["â€�", '"'], // Right double quote
  ["â€˜", "'"], // Left single quote
  ["â€™", "'"], // Right single quote (apostrophe)
  ["â€¦", "…"], // Ellipsis
  ["â€“", "–"], // En dash
  ["â€”", "—"], // Em dash
  ["â€¢", "•"], // Bullet
  [" ", " "],
  ["Ã©", "é"],
  ["Ã¨", "è"],
  ["Ã¼", "ü"],
  ["â‚¬", "€"],
  ['"“', " - "],
  ['"”', ""],
  ["Â©", "©"],
  ["—", " - "],
  ["", ""],
];

/**
 * Attempts to fix common Mojibake encoding issues in a string
 * ... (jsdoc comments remain the same) ...
 */
const decodeMojibake = (inputText) => {
  // <--- Remove 'export' here
  if (!inputText || typeof inputText !== "string") {
    return inputText || "";
  }

  let cleanedText = inputText;

  for (const [mojibake, correctChar] of mojibakeReplacements) {
    cleanedText = cleanedText.replaceAll(mojibake, correctChar);
  }

  return cleanedText;
};

module.exports = {
  decodeMojibake,
};

// Example usage (for testing):
// const badString = "This has â€œquotesâ€� and an apostropheâ€™s edge case.";
// const { decodeMojibake } = require('./decodeHtml'); // <-- How you'd require it in Node
// console.log(decodeMojibake(badString));
