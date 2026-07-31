import { bufferToBase64, bufferToHex, exportToPem, pemToBuffer, base64ToBuffer } from './pemUtils';
import { generateAESKey, encryptAES, decryptAES } from './cryptoSymmetric';
import { AsymmetricEncryptResult } from '../types/crypto';

export interface RSAKeyPairResult {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  publicKeyPem: string;
  privateKeyPem: string;
  bitLength: number;
}

// Generate RSA-OAEP 2048-bit or 3072-bit Key Pair
export async function generateRSAKeyPair(bitLength: 2048 | 3072): Promise<RSAKeyPairResult> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: bitLength,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
      hash: 'SHA-256',
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );

  const spkiBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const pkcs8Buffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicKeyPem = exportToPem(spkiBuffer, 'PUBLIC KEY');
  const privateKeyPem = exportToPem(pkcs8Buffer, 'PRIVATE KEY');

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    publicKeyPem,
    privateKeyPem,
    bitLength,
  };
}

// Import Public Key PEM string
export async function importRSAPublicKeyPem(pem: string): Promise<CryptoKey> {
  try {
    const buffer = pemToBuffer(pem);
    return await window.crypto.subtle.importKey(
      'spki',
      buffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['encrypt']
    );
  } catch (err: any) {
    throw new Error('Failed to parse RSA Public Key PEM. Ensure it includes valid -----BEGIN PUBLIC KEY----- headers.');
  }
}

// Import Private Key PEM string
export async function importRSAPrivateKeyPem(pem: string): Promise<CryptoKey> {
  try {
    const buffer = pemToBuffer(pem);
    return await window.crypto.subtle.importKey(
      'pkcs8',
      buffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['decrypt']
    );
  } catch (err: any) {
    throw new Error('Failed to parse RSA Private Key PEM. Ensure it includes valid -----BEGIN PRIVATE KEY----- headers.');
  }
}

// Calculate max plaintext length supported by direct RSA-OAEP (with SHA-256 hash)
// Max Bytes = (keyLengthInBits / 8) - (2 * 32) - 2
export function getRSAMaxPlaintextBytes(bitLength: number): number {
  const keyBytes = bitLength / 8;
  const hashBytes = 32; // SHA-256 is 32 bytes
  return keyBytes - (2 * hashBytes) - 2;
}

// Encrypt string using RSA Public Key (direct or hybrid mode)
export async function encryptRSA(
  plaintext: string,
  publicKey: CryptoKey,
  forceHybrid: boolean = false,
  bitLength: number = 2048
): Promise<AsymmetricEncryptResult> {
  const enc = new TextEncoder();
  const inputBuffer = enc.encode(plaintext);
  const maxBytes = getRSAMaxPlaintextBytes(bitLength);

  const exceedsLimit = inputBuffer.byteLength > maxBytes;
  const useHybrid = forceHybrid || exceedsLimit;

  if (!useHybrid) {
    // Direct RSA Encryption
    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      inputBuffer
    );

    return {
      ciphertextBase64: bufferToBase64(cipherBuffer),
      ciphertextHex: bufferToHex(cipherBuffer),
      isHybrid: false,
    };
  } else {
    // Hybrid Encryption: RSA-OAEP wrapping AES-256-GCM session key
    const aesRes = await generateAESKey(256);
    const aesEncRes = await encryptAES(plaintext, aesRes.cryptoKey);

    // Export raw AES key bytes and encrypt with RSA Public Key
    const rawAesBuffer = await window.crypto.subtle.exportKey('raw', aesRes.cryptoKey);
    const encryptedAESKeyBuffer = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      rawAesBuffer
    );

    const encryptedAESKeyBase64 = bufferToBase64(encryptedAESKeyBuffer);

    const combinedPackageJson = JSON.stringify({
      mode: 'RSA-AES-HYBRID',
      encryptedKey: encryptedAESKeyBase64,
      iv: aesEncRes.ivHex,
      ciphertext: aesEncRes.ciphertextBase64,
    }, null, 2);

    return {
      ciphertextBase64: aesEncRes.ciphertextBase64,
      ciphertextHex: aesEncRes.ciphertextHex,
      isHybrid: true,
      encryptedAESKeyBase64,
      ivHex: aesEncRes.ivHex,
      combinedPackageJson,
    };
  }
}

// Decrypt ciphertext using RSA Private Key
export async function decryptRSA(
  ciphertextBase64OrJson: string,
  privateKey: CryptoKey
): Promise<string> {
  const cleanInput = ciphertextBase64OrJson.trim();

  // Check if payload is Hybrid JSON package
  if (cleanInput.startsWith('{') && cleanInput.includes('RSA-AES-HYBRID')) {
    try {
      const packageObj = JSON.parse(cleanInput);
      const encryptedKeyBuffer = base64ToBuffer(packageObj.encryptedKey);

      // Decrypt the AES session key using RSA Private Key
      const rawAesBuffer = await window.crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        encryptedKeyBuffer
      );

      // Import the restored AES session key
      const aesCryptoKey = await window.crypto.subtle.importKey(
        'raw',
        rawAesBuffer,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      // Decrypt the payload with restored AES key
      return await decryptAES(packageObj.ciphertext, packageObj.iv, aesCryptoKey);
    } catch (err: any) {
      throw new Error(`Hybrid decryption failed: ${err.message || 'Invalid private key or corrupted package.'}`);
    }
  }

  // Direct RSA Decryption
  try {
    let cipherBuffer: Uint8Array;
    if (/^[0-9a-fA-F]+$/.test(cleanInput)) {
      cipherBuffer = pemToBuffer(cleanInput); // hex/raw buffer fallback
    } else {
      cipherBuffer = base64ToBuffer(cleanInput);
    }

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      cipherBuffer
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err: any) {
    throw new Error('RSA Decryption failed! The ciphertext may be corrupted, or the private key does not correspond to the public key used for encryption.');
  }
}
