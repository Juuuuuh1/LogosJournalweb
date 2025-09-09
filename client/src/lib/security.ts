// Utility functions for API key handling using AES-GCM encryption
// This provides basic protection for keys stored in localStorage

const ENCRYPTION_KEY_STORAGE = 'api_key_encryption_key';
const API_KEY_IV_STORAGE = 'api_key_iv';

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => binary += String.fromCharCode(b));
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getCryptoKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem(ENCRYPTION_KEY_STORAGE);
  if (stored) {
    const keyData = base64ToBuffer(stored);
    return crypto.subtle.importKey('raw', keyData, 'AES-GCM', true, ['encrypt', 'decrypt']);
  }
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const exported = await crypto.subtle.exportKey('raw', key);
  localStorage.setItem(ENCRYPTION_KEY_STORAGE, bufferToBase64(exported));
  return key;
}

export async function encryptApiKey(apiKey: string): Promise<string> {
  try {
    const key = await getCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(apiKey);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
    localStorage.setItem(API_KEY_IV_STORAGE, bufferToBase64(iv));
    return bufferToBase64(encrypted);
  } catch (error) {
    // Fallback to plain storage if encryption fails
    return apiKey;
  }
}

export async function decryptApiKey(encryptedKey: string): Promise<string> {
  try {
    const key = await getCryptoKey();
    const ivBase64 = localStorage.getItem(API_KEY_IV_STORAGE);
    if (!ivBase64) return encryptedKey;
    const iv = new Uint8Array(base64ToBuffer(ivBase64));
    const encrypted = base64ToBuffer(encryptedKey);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    // Fallback to using value as-is if decryption fails
    return encryptedKey;
  }
}

export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return '••••••••';
  return `sk-••••${apiKey.slice(-4)}`;
}

export async function storeApiKey(apiKey: string): Promise<void> {
  const encrypted = await encryptApiKey(apiKey);
  localStorage.setItem('openai_api_key_encrypted', encrypted);
  localStorage.setItem('api_key_stored_at', new Date().toISOString());
}

export async function getStoredApiKey(): Promise<string | null> {
  const encrypted = localStorage.getItem('openai_api_key_encrypted');
  if (!encrypted) return null;
  return await decryptApiKey(encrypted);
}

export function clearStoredApiKey(): void {
  localStorage.removeItem('openai_api_key_encrypted');
  localStorage.removeItem('api_key_stored_at');
  localStorage.removeItem(ENCRYPTION_KEY_STORAGE);
  localStorage.removeItem(API_KEY_IV_STORAGE);
}

export function getApiKeyStoredDate(): Date | null {
  const storedAt = localStorage.getItem('api_key_stored_at');
  return storedAt ? new Date(storedAt) : null;
}

export function hasStoredApiKey(): boolean {
  return !!localStorage.getItem('openai_api_key_encrypted');
}

