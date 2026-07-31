import React, { useState } from 'react';
import { 
  Key, Lock, Unlock, RefreshCw, Copy, Download, Save, ShieldAlert, Sparkles, 
  FileText, CheckCircle2, ChevronRight, AlertCircle, Cpu, Eye, EyeOff 
} from 'lucide-react';
import { VaultKeyItem } from '../types/crypto';
import { generateRSAKeyPair, importRSAPublicKeyPem, importRSAPrivateKeyPem, encryptRSA, decryptRSA, getRSAMaxPlaintextBytes } from '../utils/cryptoAsymmetric';
import { downloadTextFile } from '../utils/fileHelpers';
import { FileDropzone } from './FileDropzone';

interface AsymmetricTabProps {
  onSaveToVault: (keyItem: VaultKeyItem) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const AsymmetricTab: React.FC<AsymmetricTabProps> = ({ onSaveToVault, showToast }) => {
  // Config
  const [rsaBits, setRsaBits] = useState<2048 | 3072>(2048);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Key Pair State
  const [publicKeyObj, setPublicKeyObj] = useState<CryptoKey | null>(null);
  const [privateKeyObj, setPrivateKeyObj] = useState<CryptoKey | null>(null);
  const [publicKeyPem, setPublicKeyPem] = useState<string>('');
  const [privateKeyPem, setPrivateKeyPem] = useState<string>('');
  const [showPrivateKey, setShowPrivateKey] = useState<boolean>(false);

  // Encryption State
  const [plainInput, setPlainInput] = useState<string>('RSA Public-Key Cryptography secures key distribution and digital signatures across modern Web standards.');
  const [forceHybrid, setForceHybrid] = useState<boolean>(false);
  const [encryptedResult, setEncryptedResult] = useState<{
    ciphertextBase64: string;
    ciphertextHex: string;
    isHybrid: boolean;
    encryptedAESKeyBase64?: string;
    ivHex?: string;
    combinedPackageJson?: string;
  } | null>(null);
  const [isEncrypting, setIsEncrypting] = useState<boolean>(false);

  // Decryption State
  const [decryptInput, setDecryptInput] = useState<string>('');
  const [decryptedOutput, setDecryptedOutput] = useState<string>('');
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);

  const maxDirectBytes = getRSAMaxPlaintextBytes(rsaBits);
  const textByteSize = new TextEncoder().encode(plainInput).byteLength;
  const isOverRsaLimit = textByteSize > maxDirectBytes;

  // Generate KeyPair
  const handleGenerateKeyPair = async () => {
    setIsGenerating(true);
    try {
      const res = await generateRSAKeyPair(rsaBits);
      setPublicKeyObj(res.publicKey);
      setPrivateKeyObj(res.privateKey);
      setPublicKeyPem(res.publicKeyPem);
      setPrivateKeyPem(res.privateKeyPem);
      showToast('success', 'RSA Keypair Generated', `Generated ${rsaBits}-bit RSA-OAEP public & private key pair.`);
    } catch (err: any) {
      showToast('error', 'Key Gen Failed', err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Keypair to Vault
  const handleSaveVault = () => {
    if (!publicKeyPem || !privateKeyPem) {
      showToast('error', 'No Key Pair', 'Generate an RSA Key Pair first.');
      return;
    }

    const item: VaultKeyItem = {
      id: 'rsa-' + Date.now(),
      name: `RSA-${rsaBits} Key Pair`,
      algorithm: `RSA-${rsaBits}` as any,
      type: 'asymmetric-pair',
      createdAt: Date.now(),
      publicKeyPem,
      privateKeyPem,
      bitLength: rsaBits,
      publicKey: publicKeyObj || undefined,
      privateKey: privateKeyObj || undefined,
    };
    onSaveToVault(item);
    showToast('success', 'Saved to Vault', `Saved RSA-${rsaBits} Key Pair into your Key Vault.`);
  };

  // Encrypt with Public Key
  const handleEncrypt = async () => {
    if (!plainInput) {
      showToast('error', 'Input Empty', 'Enter text or load a file to encrypt.');
      return;
    }

    let pubKey = publicKeyObj;
    if (!pubKey && publicKeyPem) {
      try {
        pubKey = await importRSAPublicKeyPem(publicKeyPem);
        setPublicKeyObj(pubKey);
      } catch (err: any) {
        showToast('error', 'Invalid Public Key', err.message);
        return;
      }
    }

    if (!pubKey) {
      // Auto-generate keypair if missing
      try {
        const res = await generateRSAKeyPair(rsaBits);
        pubKey = res.publicKey;
        setPublicKeyObj(res.publicKey);
        setPrivateKeyObj(res.privateKey);
        setPublicKeyPem(res.publicKeyPem);
        setPrivateKeyPem(res.privateKeyPem);
      } catch (err: any) {
        showToast('error', 'Key Error', 'Failed to generate RSA key pair.');
        return;
      }
    }

    setIsEncrypting(true);
    try {
      const res = await encryptRSA(plainInput, pubKey, forceHybrid, rsaBits);
      setEncryptedResult(res);

      if (res.isHybrid && res.combinedPackageJson) {
        setDecryptInput(res.combinedPackageJson);
      } else {
        setDecryptInput(res.ciphertextBase64);
      }

      showToast(
        'success',
        res.isHybrid ? 'Hybrid Encrypted (RSA + AES)' : 'RSA Encrypted',
        res.isHybrid
          ? 'Data encrypted with AES-256; AES session key wrapped with RSA Public Key.'
          : 'Direct RSA-OAEP encryption complete.'
      );
    } catch (err: any) {
      showToast('error', 'Encryption Failed', err.message);
    } finally {
      setIsEncrypting(false);
    }
  };

  // Decrypt with Private Key
  const handleDecrypt = async () => {
    if (!decryptInput) {
      showToast('error', 'Ciphertext Missing', 'Paste RSA ciphertext or hybrid JSON package to decrypt.');
      return;
    }

    let privKey = privateKeyObj;
    if (!privKey && privateKeyPem) {
      try {
        privKey = await importRSAPrivateKeyPem(privateKeyPem);
        setPrivateKeyObj(privKey);
      } catch (err: any) {
        showToast('error', 'Invalid Private Key', err.message);
        return;
      }
    }

    if (!privKey) {
      showToast('error', 'No Private Key', 'Please generate or provide the matching RSA Private Key.');
      return;
    }

    setIsDecrypting(true);
    try {
      const text = await decryptRSA(decryptInput, privKey);
      setDecryptedOutput(text);
      showToast('success', 'RSA Decryption Successful', 'Ciphertext decrypted using RSA Private Key.');
    } catch (err: any) {
      showToast('error', 'Decryption Failed', err.message);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast('info', 'Copied to Clipboard', `Copied ${label} to clipboard.`);
  };

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="glass-panel-glow-purple p-6 rounded-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Key className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white font-mono tracking-tight">Asymmetric Encryption Suite</h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-950 text-purple-300 border border-purple-800">
                RSA-OAEP
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Asymmetric encryption uses a mathematically linked key pair: a <strong className="text-purple-300">Public Key</strong> (for encrypting) and a <strong className="text-amber-300">Private Key</strong> (kept secret for decrypting).
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={handleGenerateKeyPair}
              disabled={isGenerating}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Generate RSA Key Pair</span>
            </button>
          </div>
        </div>
      </div>

      {/* RSA Key Pair Manager Panel */}
      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">RSA Key Pair Management</h3>
          </div>

          {/* Bits Selector */}
          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {([2048, 3072] as const).map((bits) => (
              <button
                key={bits}
                onClick={() => setRsaBits(bits)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  rsaBits === bits
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                RSA-{bits}
              </button>
            ))}
          </div>
        </div>

        {/* Public & Private PEM Display Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Public Key Card */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 flex items-center space-x-1.5">
                <Key className="w-4 h-4 text-purple-400" />
                <span>Public Key (Encrypt)</span>
              </span>
              <div className="flex items-center space-x-1.5">
                {publicKeyPem && (
                  <>
                    <button
                      onClick={() => handleCopy(publicKeyPem, 'RSA Public Key PEM')}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-800"
                      title="Copy Public Key"
                    >
                      <Copy className="w-3.5 h-3.5 text-purple-400" />
                    </button>
                    <button
                      onClick={() => downloadTextFile(`rsa-${rsaBits}-public.pub`, publicKeyPem)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-800"
                      title="Download .pub"
                    >
                      <Download className="w-3.5 h-3.5 text-purple-400" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <textarea
              rows={5}
              value={publicKeyPem}
              onChange={(e) => setPublicKeyPem(e.target.value)}
              placeholder="-----BEGIN PUBLIC KEY-----\n..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-purple-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 resize-none select-all"
            />
          </div>

          {/* Private Key Card */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Private Key (Decrypt - KEEP SECRET)</span>
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs"
                >
                  {showPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                {privateKeyPem && (
                  <>
                    <button
                      onClick={() => handleCopy(privateKeyPem, 'RSA Private Key PEM')}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-800"
                      title="Copy Private Key"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                    <button
                      onClick={() => downloadTextFile(`rsa-${rsaBits}-private.key`, privateKeyPem)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-800"
                      title="Download .key"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <textarea
              rows={5}
              type={showPrivateKey ? 'text' : 'password'}
              value={showPrivateKey ? privateKeyPem : privateKeyPem ? '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••' : ''}
              onChange={(e) => setPrivateKeyPem(e.target.value)}
              placeholder="-----BEGIN PRIVATE KEY-----\n..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-amber-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none select-all"
            />
          </div>

        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            RSA-{rsaBits} max direct block size: <strong className="text-purple-300 font-mono">{maxDirectBytes} Bytes</strong> (SHA-256 OAEP padding).
          </p>
          <button
            onClick={handleSaveVault}
            className="px-4 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-300 font-semibold text-xs border border-purple-800 flex items-center space-x-1.5"
          >
            <Save className="w-3.5 h-3.5 text-purple-400" />
            <span>Save Pair to Key Vault</span>
          </button>
        </div>
      </div>

      {/* Encryption & Decryption Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ENCRYPT PANEL */}
        <div className="glass-panel p-6 rounded-2xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Encrypt with Public Key</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">{textByteSize} Bytes</span>
            </div>

            <FileDropzone
              onFileLoaded={(content) => setPlainInput(content)}
              accentColor="purple"
            />

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Plaintext Message / File Content</label>
              <textarea
                rows={4}
                value={plainInput}
                onChange={(e) => setPlainInput(e.target.value)}
                placeholder="Enter plaintext to encrypt with RSA public key..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Hybrid Mode Banner / Notice */}
            {isOverRsaLimit && (
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-xs space-y-1">
                <div className="flex items-center space-x-2 text-purple-300 font-bold">
                  <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Automated Hybrid Encryption Active</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Plaintext size ({textByteSize} B) exceeds direct RSA limit ({maxDirectBytes} B). The app will automatically encrypt your file with an ephemeral <strong>AES-256-GCM</strong> key, and wrap that key with your <strong>RSA Public Key</strong>.
                </p>
              </div>
            )}

            <button
              onClick={handleEncrypt}
              disabled={isEncrypting}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>{isEncrypting ? 'Encrypting...' : `Encrypt with RSA-${rsaBits}`}</span>
            </button>
          </div>

          {/* Encrypted Result */}
          {encryptedResult && (
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300">
                  {encryptedResult.isHybrid ? 'Hybrid Package (JSON)' : 'RSA Ciphertext (Base64)'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-purple-300 max-h-36 overflow-y-auto break-all select-all">
                {encryptedResult.isHybrid ? encryptedResult.combinedPackageJson : encryptedResult.ciphertextBase64}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopy(encryptedResult.isHybrid ? encryptedResult.combinedPackageJson! : encryptedResult.ciphertextBase64, 'RSA Ciphertext')}
                  className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 flex items-center justify-center space-x-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-purple-400" />
                  <span>Copy Package</span>
                </button>
                <button
                  onClick={() => downloadTextFile(encryptedResult.isHybrid ? 'rsa_hybrid_payload.json' : 'rsa_ciphertext.enc.txt', encryptedResult.isHybrid ? encryptedResult.combinedPackageJson! : encryptedResult.ciphertextBase64)}
                  className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 flex items-center justify-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span>Download Output</span>
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
                <Unlock className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Decrypt with Private Key</h3>
              </div>
            </div>

            <FileDropzone
              onFileLoaded={(content) => setDecryptInput(content)}
              accentColor="purple"
            />

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">RSA Ciphertext / Hybrid JSON Payload</label>
              <textarea
                rows={4}
                value={decryptInput}
                onChange={(e) => setDecryptInput(e.target.value)}
                placeholder="Paste Base64 RSA ciphertext or Hybrid JSON payload..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-amber-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <button
              onClick={handleDecrypt}
              disabled={isDecrypting}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <Unlock className="w-4 h-4" />
              <span>{isDecrypting ? 'Decrypting...' : 'Decrypt with Private Key'}</span>
            </button>
          </div>

          {/* Decrypted Output Display */}
          {decryptedOutput && (
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Restored Plaintext Data</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">{decryptedOutput.length} Chars</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-900/40 font-mono text-xs text-slate-100 max-h-36 overflow-y-auto whitespace-pre-wrap select-all">
                {decryptedOutput}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopy(decryptedOutput, 'Decrypted Text')}
                  className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 flex items-center justify-center space-x-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copy Plaintext</span>
                </button>
                <button
                  onClick={() => downloadTextFile('rsa_decrypted_result.txt', decryptedOutput)}
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
