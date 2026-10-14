/**
 * Losslessly recovers UTF-8 text that was mis-encoded as CP437 characters.
 * E.g. "α╢Üα╖£α╖àα╢╣" -> "කොළඹ"
 */

const cp437Chars = [
  '\u00C7', '\u00FC', '\u00E9', '\u00E2', '\u00E4', '\u00E0', '\u00E5', '\u00E7',
  '\u00EA', '\u00EB', '\u00E8', '\u00EF', '\u00EE', '\u00EC', '\u00C4', '\u00C5',
  '\u00C9', '\u00E6', '\u00C6', '\u00F4', '\u00F6', '\u00F2', '\u00FB', '\u00F9',
  '\u00FF', '\u00D6', '\u00DC', '\u00A2', '\u00A3', '\u00A5', '\u20A7', '\u0192',
  '\u00E1', '\u00ED', '\u00F3', '\u00FA', '\u00F1', '\u00D1', '\u00AA', '\u00BA',
  '\u00BF', '\u2310', '\u00AC', '\u00BD', '\u00BC', '\u00A1', '\u00AB', '\u00BB',
  '\u2591', '\u2592', '\u2593', '\u2502', '\u2524', '\u2561', '\u2562', '\u2556',
  '\u2555', '\u2563', '\u2551', '\u2557', '\u255D', '\u255C', '\u255B', '\u2510',
  '\u2514', '\u2534', '\u252C', '\u251C', '\u2500', '\u253C', '\u255E', '\u255F',
  '\u255A', '\u2554', '\u2569', '\u2566', '\u2560', '\u2550', '\u256C', '\u2567',
  '\u2568', '\u2564', '\u2565', '\u2559', '\u2558', '\u2552', '\u2553', '\u256B',
  '\u256A', '\u2518', '\u250C', '\u2588', '\u2584', '\u258C', '\u2590', '\u2580',
  '\u03B1', '\u00DF', '\u0393', '\u03C0', '\u03A3', '\u03C3', '\u00B5', '\u03C4',
  '\u03A6', '\u0398', '\u03A9', '\u03B4', '\u221E', '\u03C6', '\u03B5', '\u2229',
  '\u2261', '\u00B1', '\u2265', '\u2264', '\u2320', '\u2321', '\u00F7', '\u2248',
  '\u00B0', '\u2219', '\u00B7', '\u221A', '\u207F', '\u00B2', '\u25A0', '\u00A0'
];

const charToByte = new Map<string, number>();
for (let i = 0; i < 128; i++) {
  charToByte.set(String.fromCharCode(i), i);
}
for (let i = 0; i < cp437Chars.length; i++) {
  charToByte.set(cp437Chars[i], 0x80 + i);
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder('utf-8', { fatal: false });

export function cleanMojibake(str: string | null | undefined): string {
  if (!str || typeof str !== 'string') return '';
  // Quick check for CP437 mojibake indicator characters
  if (!/[αΓ╢«»]/.test(str)) {
    return str;
  }

  try {
    const bytes: number[] = [];
    for (const char of str) {
      if (charToByte.has(char)) {
        bytes.push(charToByte.get(char)!);
      } else {
        const encoded = textEncoder.encode(char);
        for (let i = 0; i < encoded.length; i++) {
          bytes.push(encoded[i]);
        }
      }
    }
    const decoded = textDecoder.decode(new Uint8Array(bytes));
    // Also clean up common lingering artifacts
    return decoded
      .replace(/ΓÇÉ/g, '–')
      .replace(/ΓÇô/g, '–')
      .replace(/ΓÇö/g, '—')
      .replace(/ΓÇï/g, '')
      .replace(/ΓÇÖ/g, '’')
      .replace(/ΓÇ£/g, '“')
      .replace(/ΓÇ¥/g, '”')
      .replace(/ΓÇì/g, '\u200D');
  } catch {
    return str;
  }
}

/** Recursively cleans all string fields in an object or array */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return cleanMojibake(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeObject(value);
    }
    return result as unknown as T;
  }
  return obj;
}
