import React, { useState } from 'react';
import { 
  Lock, Unlock, Key, RefreshCw, Copy, Download, Save, ShieldAlert, Sparkles, 
  Binary, FileText, CheckCircle2, ChevronRight, Hash, Eye, EyeOff 
} from 'lucide-react';
import { VaultKeyItem } from '../types/crypto';
import { generateAESKey, deriveAESKeyFromPassphrase, encryptAES, decryptAES, decryptCombinedPackage } from '../utils/cryptoSymmetric';
import { downloadTextFile } from '../utils/fileHelpers';
import { FileDropzone } from './FileDropzone';
import { HexViewer } from './HexViewer';

interface SymmetricTabProps {
  onSaveToVault: (keyItem: VaultKeyItem) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const SymmetricTab: React.FC<SymmetricTabProps> = ({ onSaveToVault, showToast }) => {
  // Algorithm selection
  const [bitLength, setBitLength] = useState<128 | 192 | 256>(256);
  const [keySource, setKeySource] = useState<'random' | 'passphrase'>('random');
  const [passphrase, setPassphrase] = useState<string>('');
  const [showPassphrase, setShowPassphrase] = useState<boolean>(false);
  const [saltHex, setSaltHex] = useState<string>('');

  // Active AES Key State
  const [activeKey, setActiveKey] = useState<CryptoKey | null>(null);
  const [hexKey, setHexKey] = useState<string>('');
  const [base64Key, setBase64Key] = useState<string>('');
  const [isGeneratingKey, setIsGeneratingKey] = useState<boolean>(false);

  // Encryption State
  const [plainInput, setPlainInput] = useState<string>('Hello! This is a confidential document encrypted with AES-GCM 256-bit high performance cryptography.');
  const [encryptedResult, setEncryptedResult] = useState<{
    ciphertextBase64: string;
    ciphertextHex: string;
    ivHex: string;
    tagHex?: string;
    combinedPackageBase64: string;
  } | null>(null);
  const [isEncrypting, setIsEncrypting] = useState<boolean>(false);

  // Decryption State
  const [decryptCipherInput, setDecryptCipherInput] = useState<string>('');
  const [decryptIVInput, setDecryptIVInput] = useState<string>('');
  const [decryptKeyHexInput, setDecryptKeyHexInput] = useState<string>('');
  const [decryptedOutput, setDecryptedOutput] = useState<string>('');
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);

  // View preferences
  const [outputFormat, setOutputFormat] = useState<'base64' | 'hex' | 'binary'>('base64');

  // Handle Generate New Key
  const handleGenerateKey = async () => {
    setIsGeneratingKey(true);
    try {
      if (keySource === 'random') {
        const result = await generateAESKey(bitLength);
        setActiveKey(result.cryptoKey);
        setHexKey(result.hexKey);
        setBase64Key(result.base64Key);
        setSaltHex('');
        setDecryptKeyHexInput(result.hexKey);
        showToast('success', 'AES Key Generated', `Generated cryptographically secure AES-${bitLength} key.`);
      } else {
        if (!passphrase) {
          showToast('error', 'Passphrase Required', 'Please enter a passphrase for key derivation.');
          setIsGeneratingKey(false);
          return;
        }
        const result = await deriveAESKeyFromPassphrase(passphrase, bitLength, saltHex || undefined);
        setActiveKey(result.cryptoKey);
        setHexKey(result.hexKey);
        setBase64Key(result.base64Key);
        setSaltHex(result.saltHex);
        setDecryptKeyHexInput(result.hexKey);
        showToast('success', 'Key Derived (PBKDF2)', `Derived AES-${bitLength} key using PBKDF2 with 100k iterations.`);
      }
    } catch (err: any) {
      showToast('error', 'Key Generation Failed', err.message);
    } finally {
      setIsGeneratingKey(false);
    }
  };

  // Handle Save Key to Vault
  const handleSaveVault = () => {
    if (!hexKey || !activeKey) {
      showToast('error', 'No Active Key', 'Generate an AES key first before saving to Vault.');
      return;
    }
    const item: VaultKeyItem = {
      id: 'key-' + Date.now(),
      name: `AES-${bitLength} Key (${keySource === 'random' ? 'Random' : 'Passphrase'})`,
      algorithm: `AES-${bitLength}` as any,
      type: 'symmetric',
      createdAt: Date.now(),
      rawHex: hexKey,
      rawBase64: base64Key,
      bitLength: bitLength,
      cryptoKey: activeKey,
    };
    onSaveToVault(item);
    showToast('success', 'Saved to Vault', `Saved ${item.name} into your Key Vault.`);
  };

  // Handle Encrypt
  const handleEncrypt = async () => {
    if (!plainInput) {
      showToast('error', 'Input Empty', 'Enter text or load a file to encrypt.');
      return;
    }
    let keyToUse = activeKey;

    if (!keyToUse) {
      // Auto-generate key if missing
      try {
        const res = await generateAESKey(bitLength);
        keyToUse = res.cryptoKey;
        setActiveKey(res.cryptoKey);
        setHexKey(res.hexKey);
        setBase64Key(res.base64Key);
        setDecryptKeyHexInput(res.hexKey);
      } catch (err: any) {
        showToast('error', 'Key Error', 'Failed to auto-generate AES key.');
        return;
      }
    }

    setIsEncrypting(true);
    try {
      const res = await encryptAES(plainInput, keyToUse);
      setEncryptedResult(res);
      
      // Auto fill decryption inputs for seamless testing
      setDecryptCipherInput(res.combinedPackageBase64);
      setDecryptIVInput(res.ivHex);

      showToast('success', 'Text Encrypted', 'AES-GCM encryption complete with 96-bit IV & 128-bit tag.');
    } catch (err: any) {
      showToast('error', 'Encryption Failed', err.message);
    } finally {
      setIsEncrypting(false);
    }
  };

  // Handle Decrypt
  const handleDecrypt = async () => {
    if (!decryptCipherInput) {
      showToast('error', 'Ciphertext Missing', 'Paste ciphertext, combined package, or upload an encrypted file.');
      return;
    }

    setIsDecrypting(false);
    try {
      let keyToUse = activeKey;

      if (!keyToUse && decryptKeyHexInput) {
        // Try importing raw hex key
        const { importRawAESKey } = await import('../utils/cryptoSymmetric');
        keyToUse = await importRawAESKey(decryptKeyHexInput, bitLength);
      }

      if (!keyToUse) {
        showToast('error', 'No Decryption Key', 'Please generate or provide a matching AES key.');
        return;
      }

      setIsDecrypting(true);

      let text = '';
      if (!decryptIVInput || decryptCipherInput.length > 100 && !decryptIVInput) {
        // Attempt combined package decryption
        text = await decryptCombinedPackage(decryptCipherInput, keyToUse);
      } else {
        text = await decryptAES(decryptCipherInput, decryptIVInput, keyToUse);
      }

      setDecryptedOutput(text);
      showToast('success', 'Decryption Successful', 'AES-GCM tag verified and plaintext restored.');
    } catch (err: any) {
      showToast('error', 'Decryption Failed', err.message);
    } finally {
      setIsDecrypting(false);
    }
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast('info', 'Copied to Clipboard', `Copied ${label} to clipboard.`);
  };

  return (
    <div className="space-y-8">
      
      {/* Tab Header Banner */}
      <div className="glass-panel-glow-cyan p-6 rounded-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Lock className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white font-mono tracking-tight">Symmetric Encryption Suite</h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                AES-GCM
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Symmetric encryption uses a single secret key to both encrypt and decrypt data. AES-GCM (Galois/Counter Mode) provides high-performance authenticated encryption with built-in data integrity verification.
            </p>
          </div>
          
          <div className="flex items-center space-x-3 self-start md:self-auto shrink-0">
            <button
              onClick={handleGenerateKey}
              disabled={isGeneratingKey}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isGeneratingKey ? 'animate-spin' : ''}`} />
              <span>Generate Key</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: Key Management & Config */}
      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">AES Key Configuration</h3>
          </div>

          {/* Key Length Selector */}
          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {([128, 192, 256] as const).map((bits) => (
              <button
                key={bits}
                onClick={() => setBitLength(bits)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  bitLength === bits
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {bits}-bit
              </button>
            ))}
          </div>
        </div>

        {/* Source Radio Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            onClick={() => setKeySource('random')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              keySource === 'random' 
                ? 'bg-cyan-950/20 border-cyan-500/40 text-slate-200' 
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <input type="radio" checked={keySource === 'random'} onChange={() => setKeySource('random')} className="text-cyan-500" />
              <span className="text-xs font-semibold text-white">Cryptographically Secure Random Key</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 pl-5">
              Generates high-entropy random bytes using <span className="font-mono text-cyan-400">crypto.getRandomValues()</span>.
            </p>
          </div>

          <div 
            onClick={() => setKeySource('passphrase')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              keySource === 'passphrase' 
                ? 'bg-cyan-950/20 border-cyan-500/40 text-slate-200' 
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <input type="radio" checked={keySource === 'passphrase'} onChange={() => setKeySource('passphrase')} className="text-cyan-500" />
              <span className="text-xs font-semibold text-white">Passphrase Key Derivation (PBKDF2)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 pl-5">
              Stretches passphrase using PBKDF2 with 100,000 iterations & 128-bit salt.
            </p>
          </div>
        </div>

        {/* Passphrase Input if chosen */}
        {keySource === 'passphrase' && (
          <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>Secret Passphrase</span>
              {saltHex && <span className="text-[10px] font-mono text-slate-500">Salt: {saltHex.substring(0, 16)}...</span>}
            </label>
            <div className="relative">
              <input
                type={showPassphrase ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter strong passphrase..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
              >
                {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Active Key Display */}
        {hexKey ? (
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-cyan-900/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">Active AES-{bitLength} Key</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopy(hexKey, 'Hex Key')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-800 flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3 text-cyan-400" />
                  <span>Copy Hex</span>
                </button>
                <button
                  onClick={() => handleCopy(base64Key, 'Base64 Key')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-800 flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3 text-cyan-400" />
                  <span>Copy B64</span>
                </button>
                <button
                  onClick={() => downloadTextFile(`aes-${bitLength}.key`, hexKey)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-800 flex items-center space-x-1"
                >
                  <Download className="w-3 h-3 text-cyan-400" />
                  <span>Download</span>
                </button>
                <button
                  onClick={handleSaveVault}
                  className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-[11px] font-medium border border-cyan-800 flex items-center space-x-1"
                >
                  <Save className="w-3 h-3 text-cyan-400" />
                  <span>Save to Vault</span>
                </button>
              </div>
            </div>

            {/* Hex Key String */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 break-all select-all">
              {hexKey}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>No active AES key generated yet. Click "Generate Key" to create one.</span>
            <button
              onClick={handleGenerateKey}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-semibold"
            >
              Generate Key
            </button>
          </div>
        )}
      </div>

      {/* Section 2: Interactive Encryption & Decryption Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ENCRYPT PANEL */}
        <div className="glass-panel p-6 rounded-2xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Encrypt Plaintext</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">{plainInput.length} Chars</span>
            </div>

            {/* File Upload Dropzone */}
            <FileDropzone
              onFileLoaded={(content) => setPlainInput(content)}
              accentColor="cyan"
            />

            {/* Text Input Area */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Plaintext Data</label>
              <textarea
                rows={4}
                value={plainInput}
                onChange={(e) => setPlainInput(e.target.value)}
                placeholder="Type or paste plain text here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <button
              onClick={handleEncrypt}
              disabled={isEncrypting}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>{isEncrypting ? 'Encrypting...' : `Encrypt with AES-${bitLength}`}</span>
            </button>
          </div>

          {/* Encrypted Result Display */}
          {encryptedResult && (
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Ciphertext Result</span>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setOutputFormat('base64')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${outputFormat === 'base64' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-500'}`}
                  >
                    Base64
                  </button>
                  <button
                    onClick={() => setOutputFormat('hex')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${outputFormat === 'hex' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-500'}`}
                  >
                    Hex
                  </button>
                  <button
                    onClick={() => setOutputFormat('binary')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${outputFormat === 'binary' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-500'}`}
                  >
                    Binary Inspector
                  </button>
                </div>
              </div>

              {outputFormat === 'binary' ? (
                <HexViewer
                  hexData={encryptedResult.ciphertextHex}
                  ivHex={encryptedResult.ivHex}
                  tagHex={encryptedResult.tagHex}
                />
              ) : (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-mono text-xs text-purple-300 break-all max-h-32 overflow-y-auto select-all">
                    {outputFormat === 'base64' ? encryptedResult.ciphertextBase64 : encryptedResult.ciphertextHex}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-900">
                    <span>IV (96-bit): <span className="font-mono text-sky-400">{encryptedResult.ivHex}</span></span>
                    {encryptedResult.tagHex && (
                      <span>Tag (128-bit): <span className="font-mono text-rose-400">{encryptedResult.tagHex.substring(0, 8)}...</span></span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={() => handleCopy(encryptedResult.combinedPackageBase64, 'Combined Encrypted Package')}
                  className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 flex items-center justify-center space-x-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Copy Package</span>
                </button>
                <button
                  onClick={() => downloadTextFile('encrypted_data.enc.txt', encryptedResult.combinedPackageBase64)}
                  className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 flex items-center justify-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download .txt</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DECRYPT PANEL */}
        <div className="glass-panel p-6 rounded-2xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Unlock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Decrypt Ciphertext</h3>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">GCM Integrity Tag Verified</span>
            </div>

            {/* Cipher File Upload */}
            <FileDropzone
              onFileLoaded={(content) => setDecryptCipherInput(content)}
              accentColor="emerald"
            />

            {/* Ciphertext Input */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Ciphertext / Combined Package</label>
              <textarea
                rows={3}
                value={decryptCipherInput}
                onChange={(e) => setDecryptCipherInput(e.target.value)}
                placeholder="Paste Base64/Hex ciphertext or combined package string..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-purple-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Optional IV Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium">IV Hex (12 Bytes - Optional if package)</label>
                <input
                  type="text"
                  value={decryptIVInput}
                  onChange={(e) => setDecryptIVInput(e.target.value)}
                  placeholder="e.g. a3b9f1..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-sky-400 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium">AES Key Hex</label>
                <input
                  type="text"
                  value={decryptKeyHexInput}
                  onChange={(e) => setDecryptKeyHexInput(e.target.value)}
                  placeholder="Matching Hex key..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-400 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={handleDecrypt}
              disabled={isDecrypting}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <Unlock className="w-4 h-4" />
              <span>{isDecrypting ? 'Decrypting...' : 'Decrypt Ciphertext'}</span>
            </button>
          </div>

          {/* Decrypted Output Display */}
          {decryptedOutput && (
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Restored Plaintext</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">{decryptedOutput.length} Characters</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-900/40 font-mono text-xs text-slate-100 max-h-36 overflow-y-auto whitespace-pre-wrap select-all">
                {decryptedOutput}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopy(decryptedOutput, 'Decrypted Plaintext')}
                  className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 flex items-center justify-center space-x-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copy Plaintext</span>
                </button>
                <button
                  onClick={() => downloadTextFile('decrypted_result.txt', decryptedOutput)}
                  className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 flex items-center justify-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download .txt</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
