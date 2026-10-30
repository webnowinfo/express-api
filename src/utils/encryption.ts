import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const BCRYPT_ROUNDS = 10;

export const encryptPassword = async (password: string) => {
  const encryptedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
  return encryptedPassword;
};

// Unsalted hex digests the legacy system may have stored, keyed by digest length
const LEGACY_HEX_ALGORITHMS: Record<number, string> = {
  32: 'md5',
  40: 'sha1',
  64: 'sha256',
  128: 'sha512'
};

const BCRYPT_PATTERN = /^\$2[aby]\$\d{2}\$/;
const HEX_PATTERN = /^[a-f0-9]+$/i;

export interface PasswordCheck {
  match: boolean;
  // true when the stored value is a legacy format and should be re-saved as bcrypt
  needsRehash: boolean;
}

/**
 * Check a password against a stored hash. Accepts bcrypt ($2a$/$2b$/PHP $2y$) and the
 * legacy unsalted MD5 / SHA1 / SHA256 / SHA512 hex digests. Anything else never matches.
 */
export const verifyPassword = async (
  password: string,
  storedHash: string
): Promise<PasswordCheck> => {
  if (BCRYPT_PATTERN.test(storedHash)) {
    try {
      return { match: await bcrypt.compare(password, storedHash), needsRehash: false };
    } catch {
      return { match: false, needsRehash: false };
    }
  }

  const algorithm = LEGACY_HEX_ALGORITHMS[storedHash.length];
  if (algorithm && HEX_PATTERN.test(storedHash)) {
    const expected = Buffer.from(storedHash.toLowerCase(), 'hex');
    const actual = crypto.createHash(algorithm).update(password, 'utf8').digest();
    const match = crypto.timingSafeEqual(expected, actual);
    return { match, needsRehash: match };
  }

  return { match: false, needsRehash: false };
};

export const isPasswordMatch = async (password: string, storedHash: string) => {
  return (await verifyPassword(password, storedHash)).match;
};
