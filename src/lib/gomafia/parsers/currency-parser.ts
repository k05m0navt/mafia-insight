/**
 * Parse prize money from Russian currency format to decimal number.
 *
 * Handles various formats:
 * - "60000 ₽" → 60000.00
 * - "60 000 ₽" → 60000.00 (space as thousands separator)
 * - "1 500,50 ₽" → 1500.50 (comma as decimal separator)
 * - "–" or "-" → null (no prize)
 *
 * @param text Raw prize money text from gomafia.pro
 * @returns Parsed amount as number, or null if no prize
 * @throws Error if format is invalid
 *
 * @example
 * parsePrizeMoney("60000 ₽") // => 60000
 * parsePrizeMoney("60 000 ₽") // => 60000
 * parsePrizeMoney("1 500,50 ₽") // => 1500.50
 * parsePrizeMoney("–") // => null
 */
export function parsePrizeMoney(text: string | null): number | null {
  if (!text || text.trim() === '' || text === '–' || text === '-') {
    return null;
  }

  // Check for negative amounts before cleaning
  const trimmed = text.trim();
  if (trimmed.startsWith('-') && trimmed.length > 1 && /\d/.test(trimmed)) {
    throw new Error(`Invalid prize money format: "${text}"`);
  }

  // Check for invalid patterns: letters (except valid currency symbols)
  // Valid: digits, spaces, commas, periods, and Russian currency symbols (₽, руб, р)
  const validPattern = /^[\d\s.,₽рубp.]+$/i;
  if (!validPattern.test(trimmed)) {
    throw new Error(`Invalid prize money format: "${text}"`);
  }

  // Remove all non-numeric characters except decimal separators
  // Russian format may use space as thousands separator: "60 000 ₽"
  const cleaned = text
    .replace(/[^\d.,]/g, '') // Keep only digits, commas, periods
    .replace(/\s/g, '') // Remove spaces
    .replace(/,/g, '.'); // Normalize comma to period as decimal separator

  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) {
    throw new Error(`Invalid prize money format: "${text}"`);
  }

  return parsed;
}

/**
 * Format number as Russian currency string.
 * Utility function for display purposes.
 *
 * @param amount Amount in rubles
 * @returns Formatted string like "60 000 ₽"
 */
export function formatPrizeMoney(amount: number): string {
  return `${amount.toLocaleString('ru-RU')} ₽`;
}
