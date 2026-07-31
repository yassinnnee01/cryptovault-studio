import React, { useState } from 'react';
import { 
  BookOpen, Shield, Key, Lock, ArrowRight, Zap, RefreshCw, Cpu, Layers, 
  HelpCircle, CheckCircle2, XCircle, Sparkles, Hash, Code 
} from 'lucide-react';

export const EducationTab: React.FC = () => {
  // Step in visual pipeline
  const [pipelineStep, setPipelineStep] = useState<number>(1);

  // RSA Math Playground State (with small toy primes)
  const [primeP, setPrimeP] = useState<number>(61);
  const [primeQ, setPrimeQ] = useState<number>(53);
  const [toyMessage, setToyMessage] = useState<number>(42);

  // Derived RSA values
  const toyN = primeP * primeQ; // 3233
  const toyPhi = (primeP - 1) * (primeQ - 1); // 3120
  const toyE = 17; // coprime to 3120
  // Modular inverse of 17 mod 3120 is 2753
  const toyD = 2753;

  // Toy encryption: c = (m^e) mod n
  // BigInt for precision
  const bigM = BigInt(toyMessage);
  const bigE = BigInt(toyE);
  const bigD = BigInt(toyD);
  const bigN = BigInt(toyN);

  const toyCiphertext = Number((bigM ** bigE) % bigN);
  const toyDecrypted = Number((BigInt(toyCiphertext) ** bigD) % bigN);

  // Interactive Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  const quizQuestions = [
    {
      id: 1,
      question: "Why is AES-GCM preferred over AES-CBC in modern web applications?",
      options: [
        "AES-GCM is symmetric while AES-CBC is asymmetric.",
        "AES-GCM provides authenticated encryption (AEAD), detecting tampered data automatically.",
        "AES-GCM uses longer key sizes than AES-CBC.",
        "AES-CBC does not require an Initialization Vector (IV)."
      ],
      correct: 1,
      explanation: "AES-GCM produces an authentication tag (128-bit) alongside ciphertext. If an attacker alters even a single bit of ciphertext, decryption fails immediately."
    },
    {
      id: 2,
      question: "What is the primary operational advantage of Asymmetric Cryptography (RSA)?",
      options: [
        "It encrypts gigabytes of data much faster than AES.",
        "It eliminates the need for a shared secret key prior to communication.",
        "It produces smaller ciphertext outputs.",
        "It requires zero prime number mathematics."
      ],
      correct: 1,
      explanation: "With RSA, sender only needs receiver's Public Key. The Private Key is never transmitted over the network."
    },
    {
      id: 3,
      question: "What is 'Hybrid Encryption' and why is it used?",
      options: [
        "Combining two symmetric keys together for double encryption.",
        "Encrypting data with fast symmetric AES, then encrypting the AES key with RSA.",
        "Converting RSA public keys into AES hex keys.",
        "Encrypting plain text without any Initialization Vector."
      ],
      correct: 1,
      explanation: "RSA has strict payload size limits (~214 bytes for 2048-bit key). Hybrid encryption solves this by using AES for bulk data speed, and RSA for key exchange safety."
    }
  ];

  return (
    <div className="space-y-10">
      
      {/* Header */}
      <div className="glass-panel-glow-purple p-6 rounded-2xl">
        <div className="flex items-center space-x-3">
          <span className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <BookOpen className="w-6 h-6" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-white font-mono tracking-tight">Interactive Cryptography Lab</h2>
            <p className="text-xs text-slate-300 mt-1">
              Explore how modern ciphers work under the hood, compare symmetric vs. asymmetric architectures, and test RSA mathematical key generation.
            </p>
          </div>
        </div>
      </div>

      {/* 1. ANIMATED STEP-BY-STEP CRYPTOGRAPHIC PIPELINE */}
      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">AES-GCM Encryption Flow Visualizer</h3>
          </div>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((s) => (
              <button
                key={s}
                onClick={() => setPipelineStep(s)}
                className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                  pipelineStep === s
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Pipeline Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className={`p-4 rounded-xl border transition-all ${
            pipelineStep === 1 ? 'bg-cyan-950/40 border-cyan-500 text-white ring-1 ring-cyan-500/50' : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-mono font-bold flex items-center justify-center">1</span>
              <h4 className="text-xs font-bold">Plaintext Input</h4>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Target text or `.txt` file bytes are encoded into raw UTF-8 binary buffers.
            </p>
          </div>

          <div className={`p-4 rounded-xl border transition-all ${
            pipelineStep === 2 ? 'bg-sky-950/40 border-sky-500 text-white ring-1 ring-sky-500/50' : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-mono font-bold flex items-center justify-center">2</span>
              <h4 className="text-xs font-bold">Key & IV Preparation</h4>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              256-bit AES Key + 96-bit unique random Initialization Vector (IV) initialized.
            </p>
          </div>

          <div className={`p-4 rounded-xl border transition-all ${
            pipelineStep === 3 ? 'bg-purple-950/40 border-purple-500 text-white ring-1 ring-purple-500/50' : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-mono font-bold flex items-center justify-center">3</span>
              <h4 className="text-xs font-bold">Galois Counter Transformation</h4>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Data split into 128-bit blocks; SubBytes, ShiftRows, MixColumns, and AddRoundKey executed.
            </p>
          </div>

          <div className={`p-4 rounded-xl border transition-all ${
            pipelineStep === 4 ? 'bg-rose-950/40 border-rose-500 text-white ring-1 ring-rose-500/50' : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-mono font-bold flex items-center justify-center">4</span>
              <h4 className="text-xs font-bold">Ciphertext & Auth Tag</h4>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Encrypted binary stream produced alongside a 128-bit GHASH authentication tag.
            </p>
          </div>

        </div>

        {/* Dynamic Detail Card */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
          {pipelineStep === 1 && (
            <div className="space-y-1">
              <span className="font-bold text-cyan-300">Step 1: Plaintext Encoding</span>
              <p className="text-slate-300 leading-relaxed">
                Before cryptographic operations begin, human-readable string data is converted to raw array buffers via standard UTF-8 encoding. Computers operate on binary bytes (`0x48 0x65 0x6C 0x6C 0x6F...`).
              </p>
            </div>
          )}
          {pipelineStep === 2 && (
            <div className="space-y-1">
              <span className="font-bold text-sky-300">Step 2: Initialization Vector (IV) & Nonce</span>
              <p className="text-slate-300 leading-relaxed">
                An IV is a non-repeating random value generated for every single encryption task. Even if you encrypt the exact same text twice with the same key, different IVs ensure two totally distinct ciphertexts.
              </p>
            </div>
          )}
          {pipelineStep === 3 && (
            <div className="space-y-1">
              <span className="font-bold text-purple-300">Step 3: AES Block Permutations</span>
              <p className="text-slate-300 leading-relaxed">
                AES applies 14 rounds of substitution and permutation for 256-bit keys. The Galois Counter Mode operates in parallel counter fashion, turning AES block cipher into a high-speed stream cipher.
              </p>
            </div>
          )}
          {pipelineStep === 4 && (
            <div className="space-y-1">
              <span className="font-bold text-rose-300">Step 4: Authenticated Encryption (AEAD)</span>
              <p className="text-slate-300 leading-relaxed">
                AES-GCM calculates a 16-byte GHASH tag. During decryption, the tag is recalculated and matched. If any bit of the ciphertext or header was tampered with during transmission, decryption fails instantly.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* 2. SYMMETRIC VS ASYMMETRIC COMPARISON MATRIX */}
      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
          <Layers className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Symmetric vs. Asymmetric Architecture Comparison</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-300 font-mono">
                <th className="p-3">Feature</th>
                <th className="p-3 text-cyan-400">Symmetric Encryption (AES)</th>
                <th className="p-3 text-purple-400">Asymmetric Encryption (RSA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="p-3 font-semibold text-white">Keys Used</td>
                <td className="p-3 text-cyan-300">1 Secret Key (Shared for Encrypt & Decrypt)</td>
                <td className="p-3 text-purple-300">Key Pair: Public Key (Encrypt) + Private Key (Decrypt)</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Supported Algorithms</td>
                <td className="p-3 font-mono">AES-128, AES-192, AES-256 (GCM/CBC)</td>
                <td className="p-3 font-mono">RSA-2048, RSA-3072, ECC (Ed25519)</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Processing Speed</td>
                <td className="p-3 text-emerald-400 font-medium">Extremely Fast (Hardware Accelerated CPU Instructions)</td>
                <td className="p-3 text-amber-400 font-medium">Slower (~100x slower due to large prime exponentiation)</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Data Size Limit</td>
                <td className="p-3">Unlimited (Stream & block processing)</td>
                <td className="p-3">Strict limit (Max ~214B for 2048-bit key; requires Hybrid AES)</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Key Distribution Problem</td>
                <td className="p-3 text-amber-400">High Risk: Both parties must securely exchange secret key first</td>
                <td className="p-3 text-emerald-400">Zero Risk: Public key can be broadcast publicly to anyone</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Common Real-World Use</td>
                <td className="p-3">File & Disk Encryption (BitLocker, FileVault), Database Encryption</td>
                <td className="p-3">TLS Handshake, SSH Authentication, Digital Signatures, Signal Messenger</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. INTERACTIVE RSA MATHEMATICS PLAYGROUND */}
      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
          <Hash className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">RSA Mathematics & Modular Exponentiation Playground</h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          RSA security relies on the practical difficulty of factoring the product of two large prime numbers. Test this interactive numerical model with small prime numbers ($p$ and $q$):
        </p>

        {/* Playground Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950 p-5 rounded-xl border border-slate-800">
          
          {/* Prime P */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Prime $p$ = {primeP}</label>
            <input
              type="range"
              min={11}
              max={97}
              step={2}
              value={primeP}
              onChange={(e) => setPrimeP(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Prime Q */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Prime $q$ = {primeQ}</label>
            <input
              type="range"
              min={13}
              max={97}
              step={2}
              value={primeQ}
              onChange={(e) => setPrimeQ(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Test Message Number */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Message Number $m$ = {toyMessage}</label>
            <input
              type="number"
              min={2}
              max={toyN - 1}
              value={toyMessage}
              onChange={(e) => setToyMessage(Math.min(Number(e.target.value), toyN - 1))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
            />
          </div>

        </div>

        {/* RSA Calculations Output */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500 font-sans uppercase font-bold">1. Modulus & Totient</span>
            <p className="text-white">$n = p \times q = \mathbf{{toyN}}$</p>
            <p className="text-slate-400">$\phi(n) = (p-1)(q-1) = \mathbf{{toyPhi}}$</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[11px] text-purple-400 font-sans uppercase font-bold">2. Public & Private Keys</span>
            <p className="text-purple-300">Public Key $(e, n) = ({toyE}, {toyN})$</p>
            <p className="text-amber-300">Private Key $(d, n) = ({toyD}, {toyN})$</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[11px] text-emerald-400 font-sans uppercase font-bold">3. Modular Calculation</span>
            <p className="text-purple-300">Cipher $c = m^e \bmod n = \mathbf{{toyCiphertext}}$</p>
            <p className="text-emerald-300">Decrypted $m = c^d \bmod n = \mathbf{{toyDecrypted}}$</p>
          </div>

        </div>
      </div>

      {/* 4. INTERACTIVE KNOWLEDGE QUIZ */}
      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Interactive Cryptography Knowledge Check</h3>
        </div>

        <div className="space-y-6">
          {quizQuestions.map((q) => {
            const selectedOpt = quizAnswers[q.id];
            const isCorrect = selectedOpt === q.correct;

            return (
              <div key={q.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white leading-relaxed">
                  {q.id}. {q.question}
                </h4>

                <div className="space-y-2">
                  {q.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: idx })}
                      className={`w-full text-left p-3 rounded-lg text-xs transition-all flex items-center justify-between ${
                        selectedOpt === idx
                          ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/50'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      <span>{opt}</span>
                      {selectedOpt === idx && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                      )}
                    </button>
                  ))}
                </div>

                {selectedOpt !== undefined && (
                  <div className={`p-3 rounded-lg text-xs leading-relaxed ${
                    isCorrect ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60' : 'bg-rose-950/40 text-rose-300 border border-rose-800/60'
                  }`}>
                    <strong>{isCorrect ? 'Correct! ' : 'Incorrect. '}</strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
