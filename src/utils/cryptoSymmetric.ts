import { bufferToBase64, bufferToHex, base64ToBuffer, hexToBuffer } from './pemUtils';
import { SymmetricEncryptResult } from '../types/crypto';

// Generate raw random AES key (128, 192, or 256 bits)
export async function generateAESKey(length: 128 | 192 | 256): Promise<{ cryptoKey: CryptoKey; hexKey: string; base64Key: string }> {
  // Web Crypto supports 128, 192, 256 bit AES-GCM
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: length,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );

  const rawBuffer = await window.crypto.subtle.exportKey('raw', key);
  const hexKey = bufferToHex(rawBuffer);
  const base64Key = bufferToBase64(rawBuffer);

  return { cryptoKey: key, hexKey, base64Key };
}

// Derive AES key from passphrase using PBKDF2 (100,000 iterations, SHA-256)
export async function deriveAESKeyFromPassphrase(
  passphrase: string,
  length: 128 | 192 | 256,
  existingSaltHex?: string
): Promise<{ cryptoKey: CryptoKey; saltHex: string; hexKey: string; base64Key: string }> {
  const enc = new TextEncoder();
  const passwordBuffer = enc.encode(passphrase);

  // Import raw password string as key material
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey', 'deriveBits']
  );

  // Generate or parse 16-byte (128-bit) salt
  let salt: Uint8Array;
  if (existingSaltHex && existingSaltHex.length >= 32) {
    salt = hexToBuffer(existingSaltHex);
  } else {
    salt = window.crypto.getRandomValues(new Uint8Array(16));
  }

  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: length },
    true,
    ['encrypt', 'decrypt']
  );

  const rawBuffer = await window.crypto.subtle.exportKey('raw', derivedKey);
  const hexKey = bufferToHex(rawBuffer);
  const base64Key = bufferToBase64(rawBuffer);
  const saltHex = bufferToHex(salt.buffer);

  return { cryptoKey: derivedKey, saltHex, hexKey, base64Key };
}

// Import raw Hex or Base64 string into CryptoKey
export async function importRawAESKey(rawKeyHexOrBase64: string, length: 128 | 192 | 256): Promise<CryptoKey> {
  let keyBuffer: Uint8Array;
  const cleanInput = rawKeyHexOrBase64.trim();
  
  if (/^[0-9a-fA-F]+$/.test(cleanInput)) {
    keyBuffer = hexToBuffer(cleanInput);
  } else {
    keyBuffer = base64ToBuffer(cleanInput);
  }

  const expectedBytes = length / 8;
  if (keyBuffer.byteLength !== expectedBytes) {
    throw new Error(`Key byte length mismatch. Expected ${expectedBytes} bytes (${length}-bit), got ${keyBuffer.byteLength} bytes.`);
  }

  return await window.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: length },
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypt plaintext or Uint8Array bytes using AES-GCM
export async function encryptAES(
  data: string | Uint8Array,
  key: CryptoKey
): Promise<SymmetricEncryptResult> {
  const enc = new TextEncoder();
  const inputBuffer = typeof data === 'string' ? enc.encode(data) : data;

  // Standard 96-bit (12 bytes) random IV for AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Perform AES-GCM encryption (produces Ciphertext + 16-byte Auth Tag)
  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128, // 16-byte authentication tag
    },
    key,
    inputBuffer
  );

  const cipherBytes = new Uint8Array(cipherBuffer);

  // Properly concatenate IV (12 bytes) + Ciphertext into a single Uint8Array
  const combined = new Uint8Array(12 + cipherBytes.byteLength);
  combined.set(iv, 0);
  combined.set(cipherBytes, 12);

  const ivHex = bufferToHex(iv.buffer);
  const ciphertextHex = bufferToHex(cipherBuffer);
  const ciphertextBase64 = bufferToBase64(cipherBuffer);
  const combinedPackageBase64 = bufferToBase64(combined.buffer);

  // Extract trailing 16 bytes for GCM Tag display
  let tagHex = '';
  if (cipherBytes.byteLength >= 16) {
    tagHex = bufferToHex(cipherBytes.slice(cipherBytes.byteLength - 16).buffer);
  }

  return {
    ciphertextBase64,
    ciphertextHex,
    ivHex,
    tagHex,
    combinedPackageBase64,
  };
}

// Decrypt AES-GCM ciphertext (handles both concatenated Uint8Array package and separate IV)
export async function decryptAES(
  ciphertextBase64OrHex: string | Uint8Array,
  ivHexOrBase64?: string,
  key?: CryptoKey
): Promise<string> {
  if (!key) {
    throw new Error('AES Key is required for decryption.');
  }

  let inputBytes: Uint8Array;

  if (typeof ciphertextBase64OrHex === 'string') {
    const clean = ciphertextBase64OrHex.trim().replace(/\s+/g, '');
    if (!clean) {
      throw new Error('Ciphertext payload is empty.');
    }
    if (/^[0-9a-fA-F]+$/.test(clean)) {
      inputBytes = hexToBuffer(clean);
    } else {
      inputBytes = base64ToBuffer(clean);
    }
  } else {
    inputBytes = ciphertextBase64OrHex;
  }

  let ivBytes: Uint8Array | null = null;
  let cipherBytes: Uint8Array | null = null;

  // Determine IV and Ciphertext bytes
  if (ivHexOrBase64 && ivHexOrBase64.trim() !== '') {
    const cleanIV = ivHexOrBase64.trim().replace(/\s+/g, '');
    if (/^[0-9a-fA-F]+$/.test(cleanIV)) {
      ivBytes = hexToBuffer(cleanIV);
    } else {
      ivBytes = base64ToBuffer(cleanIV);
    }

    // Check if inputBytes already has the 12-byte IV prepended
    if (
      inputBytes.byteLength > 12 &&
      ivBytes.byteLength === 12 &&
      bufferToHex(inputBytes.slice(0, 12).buffer) === bufferToHex(ivBytes.buffer)
    ) {
      // Strip off 12-byte IV header
      cipherBytes = inputBytes.slice(12);
    } else {
      cipherBytes = inputBytes;
    }
  } else {
    // No separate IV provided -> expect concatenated package [12-byte IV][Ciphertext + Tag]
    if (inputBytes.byteLength <= 12) {
      throw new Error('Payload too short. Concatenated AES-GCM package must be at least 13 bytes (12-byte IV + Ciphertext).');
    }
    ivBytes = inputBytes.slice(0, 12);
    cipherBytes = inputBytes.slice(12);
  }

  if (!ivBytes || ivBytes.byteLength !== 12) {
    throw new Error('Initialization Vector (IV) for AES-GCM must be exactly 12 bytes.');
  }

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
        tagLength: 128,
      },
      key,
      cipherBytes
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err: any) {
    // Fallback attempt: if initial attempt failed and explicit IV was provided,
    // try interpreting inputBytes as concatenated package (IV + Ciphertext)
    if (ivHexOrBase64 && inputBytes.byteLength > 12) {
      try {
        const fallbackIV = inputBytes.slice(0, 12);
        const fallbackCipher = inputBytes.slice(12);
        const decryptedBuffer = await window.crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: fallbackIV,
            tagLength: 128,
          },
          key,
          fallbackCipher
        );
        return new TextDecoder().decode(decryptedBuffer);
      } catch {
        // Fallback failed as well
      }
    }
    throw new Error('Decryption failed! Invalid key, wrong IV, or corrupted authentication tag (data tampered).');
  }
}

// Decrypt combined package wrapper
export async function decryptCombinedPackage(
  combinedBase64: string,
  key: CryptoKey
): Promise<string> {
  return await decryptAES(combinedBase64, undefined, key);
}

