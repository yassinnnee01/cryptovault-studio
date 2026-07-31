export type AlgorithmType = 'AES-128' | 'AES-192' | 'AES-256' | 'RSA-2048' | 'RSA-3072';

export interface VaultKeyItem {
  id: string;
  name: string;
  algorithm: AlgorithmType;
  type: 'symmetric' | 'asymmetric-public' | 'asymmetric-private' | 'asymmetric-pair';
  createdAt: number;
  rawHex?: string;
  rawBase64?: string;
  pemString?: string;
  publicKeyPem?: string;
  privateKeyPem?: string;
  bitLength: number;
  cryptoKey?: CryptoKey;
  publicKey?: CryptoKey;
  privateKey?: CryptoKey;
}

export interface SymmetricEncryptResult {
  ciphertextBase64: string;
  ciphertextHex: string;
  ivHex: string;
  tagHex?: string;
  combinedPackageBase64: string; // [IV 12 bytes] + [Ciphertext + Tag]
}

export interface AsymmetricEncryptResult {
  ciphertextBase64: string;
  ciphertextHex: string;
  isHybrid: boolean;
  encryptedAESKeyBase64?: string;
  ivHex?: string;
  combinedPackageJson?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}
