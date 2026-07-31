// Convert ArrayBuffer to Hex String
export function bufferToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  return Array.from(byteArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex String to Uint8Array
export function hexToBuffer(hexString: string): Uint8Array {
  const cleanHex = hexString.replace(/\s+/g, '').toLowerCase();
  if (cleanHex.length % 2 !== 0) {
    throw new Error('Hex string must have an even length.');
  }
  const result = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    result[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return result;
}

// Convert ArrayBuffer to Base64 String
export function bufferToBase64(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < byteArray.byteLength; i++) {
    binary += String.fromCharCode(byteArray[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 String to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const cleanBase64 = base64.trim();
  const binary = window.atob(cleanBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Format SPKI/PKCS8 binary ArrayBuffer into standard PEM string
export function exportToPem(buffer: ArrayBuffer, type: 'PUBLIC KEY' | 'RSA PRIVATE KEY' | 'PRIVATE KEY'): string {
  const base64 = bufferToBase64(buffer);
  const lineLength = 64;
  let formattedBody = '';
  for (let i = 0; i < base64.length; i += lineLength) {
    formattedBody += base64.substring(i, i + lineLength) + '\n';
  }
  return `-----BEGIN ${type}-----\n${formattedBody}-----END ${type}-----`;
}

// Parse PEM string into Uint8Array buffer
export function pemToBuffer(pem: string): Uint8Array {
  const lines = pem.trim().split('\n');
  const base64Lines = lines.filter(line => !line.startsWith('-----'));
  const base64String = base64Lines.join('').replace(/\s+/g, '');
  return base64ToBuffer(base64String);
}
