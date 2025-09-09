// Simple encryption for localStorage API keys
// Note: This is for user comfort, not true security against determined attackers

const ENCRYPTION_KEY = 'logos_journal_2024';

export function encryptApiKey(apiKey: string): string {
  try {
    // Simple XOR encryption - enough to prevent casual viewing
    let encrypted = '';
    for (let i = 0; i < apiKey.length; i++) {
      encrypted += String.fromCharCode(
        apiKey.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      );
    }
    return btoa(encrypted); // Base64 encode
  } catch (error) {
    // Fallback to plain storage if encryption fails
    return apiKey;
  }
}

export function decryptApiKey(encryptedKey: string): string {
  try {
    const encrypted = atob(encryptedKey); // Base64 decode
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      decrypted += String.fromCharCode(
        encrypted.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      );
    }
    return decrypted;
  } catch (error) {
    // Fallback to using value as-is if decryption fails
    return encryptedKey;
  }
}

export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return '••••••••';
  return `sk-••••${apiKey.slice(-4)}`;
}

export function storeApiKey(apiKey: string): void {
  const encrypted = encryptApiKey(apiKey);
  localStorage.setItem('openai_api_key_encrypted', encrypted);
  localStorage.setItem('api_key_stored_at', new Date().toISOString());
}

export function getStoredApiKey(): string | null {
  const encrypted = localStorage.getItem('openai_api_key_encrypted');
  if (!encrypted) return null;
  return decryptApiKey(encrypted);
}

export function clearStoredApiKey(): void {
  localStorage.removeItem('openai_api_key_encrypted');
  localStorage.removeItem('api_key_stored_at');
}

export function getApiKeyStoredDate(): Date | null {
  const storedAt = localStorage.getItem('api_key_stored_at');
  return storedAt ? new Date(storedAt) : null;
}

export function hasStoredApiKey(): boolean {
  return !!localStorage.getItem('openai_api_key_encrypted');
}