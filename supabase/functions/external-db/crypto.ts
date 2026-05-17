/**
 * AES-256-GCM encryption helpers for knowledge_items passwords.
 *
 * Stored format: "v1:<base64-iv>:<base64-ciphertext+tag>"
 * The "v1:" prefix lets us detect encrypted values and supports future
 * algorithm upgrades without breaking backward compatibility.
 *
 * Key source: KNOWLEDGE_ENCRYPTION_KEY env var (32 raw bytes, base64-encoded).
 * Generate: openssl rand -base64 32
 */

const FORMAT_PREFIX = "v1:";
const IV_BYTES = 12; // 96-bit IV for AES-GCM

function uint8ToBase64(arr: Uint8Array): string {
  let str = "";
  for (let i = 0; i < arr.length; i++) {
    str += String.fromCharCode(arr[i]);
  }
  return btoa(str);
}

function base64ToUint8(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importKey(): Promise<CryptoKey> {
  const keyB64 = Deno.env.get("KNOWLEDGE_ENCRYPTION_KEY");
  if (!keyB64) {
    throw new Error("KNOWLEDGE_ENCRYPTION_KEY is not set");
  }
  const keyBytes = base64ToUint8(keyB64);
  if (keyBytes.length !== 32) {
    throw new Error("KNOWLEDGE_ENCRYPTION_KEY must be exactly 32 bytes (256 bits)");
  }
  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(FORMAT_PREFIX);
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await importKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertextBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded,
  );
  return `${FORMAT_PREFIX}${uint8ToBase64(iv)}:${uint8ToBase64(new Uint8Array(ciphertextBuf))}`;
}

export async function decrypt(encrypted: string): Promise<string> {
  if (!isEncrypted(encrypted)) {
    // Legacy plaintext (migration period) — return as-is
    return encrypted;
  }
  const payload = encrypted.slice(FORMAT_PREFIX.length);
  const colonIdx = payload.indexOf(":");
  if (colonIdx === -1) {
    throw new Error("Invalid encrypted format: missing IV separator");
  }
  const iv = base64ToUint8(payload.slice(0, colonIdx));
  const ciphertext = base64ToUint8(payload.slice(colonIdx + 1));
  const key = await importKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(decrypted);
}
