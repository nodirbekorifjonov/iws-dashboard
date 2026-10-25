import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(bytes: Buffer) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(input: string) {
  const cleaned = input.replace(/=+$/g, '').toUpperCase().replace(/\s/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of cleaned) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function hotp(secret: string, counter: number) {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(binary % 1_000_000).padStart(6, '0');
}

export function generateTotpSecret() {
  return base32Encode(randomBytes(20));
}

export function totpAuthUrl(email: string, secret: string) {
  const label = encodeURIComponent(`IWS:${email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=IWS&algorithm=SHA1&digits=6&period=30`;
}

export function verifyTotp(secret: string, token: string, window = 1, now = Date.now()) {
  const code = token.replace(/\s/g, '');
  if (!/^\d{6}$/.test(code)) return false;
  const counter = Math.floor(now / 1000 / 30);
  const actual = Buffer.from(code);
  for (let offset = -window; offset <= window; offset += 1) {
    const expected = Buffer.from(hotp(secret, counter + offset));
    if (expected.length === actual.length && timingSafeEqual(expected, actual)) {
      return true;
    }
  }
  return false;
}
