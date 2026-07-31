# 🔐 CryptoVault Studio

**CryptoVault Studio** is a modern, responsive web application and interactive educational suite for generating cryptographic keys, encrypting and decrypting text files (`.txt`), and exploring the core mechanics of symmetric and asymmetric cryptography.

Built entirely on top of the browser's native **Web Crypto API** (`window.crypto.subtle`), CryptoVault Studio guarantees **100% client-side zero-knowledge privacy**: your keys, plaintexts, and ciphertexts never leave your local device or travel over any network.

---

## 🌟 Key Features

### 1. 🛡️ Symmetric Encryption Suite (AES-GCM)
* **Algorithms**: AES-128, AES-192, and AES-256 in **Galois/Counter Mode (AES-GCM)**.
* **Key Generation**:
  * **Random Generation**: Cryptographically secure random keys via `crypto.getRandomValues`.
  * **PBKDF2 Key Derivation**: Passphrase-based key stretching using PBKDF2 with 100,000 iterations, SHA-256 hashing, and a 128-bit random salt.
* **Authenticated Encryption (AEAD)**:
  * Generates a 96-bit (12-byte) unique random Initialization Vector (IV) for every operation.
  * Produces a 128-bit (16-byte) GHASH authentication tag for instant data integrity verification.
* **File & Data Processing**:
  * Drag-and-drop `.txt` file processing or direct plain text input.
  * Exports output as Base64, Hex, or single-file combined packages (`[12-byte IV][Ciphertext + Tag]`).
  * Instant download of `.enc.txt` or decrypted `.txt` files.

### 2. 🔑 Asymmetric Encryption Suite (RSA-OAEP)
* **Algorithms**: RSA-OAEP with **2048-bit** and **3072-bit** key lengths (SHA-256 digest).
* **Key Pair Management**:
  * Generates paired **Public Keys** (`-----BEGIN PUBLIC KEY-----`) and **Private Keys** (`-----BEGIN PRIVATE KEY-----`).
  * Instant conversion between standard SPKI / PKCS#8 binary buffers and human-readable PEM strings.
* **Automated Hybrid Encryption Mode**:
  * Solves RSA block size limits (~214 bytes for 2048-bit keys): files exceeding the limit are automatically encrypted using an ephemeral **AES-256-GCM** session key, which is then wrapped using the receiver's **RSA Public Key**.
  * Outputs standardized JSON hybrid packages or direct RSA Base64 payloads.

### 3. 🏛️ Key Vault & Repository
* Central key repository for keeping, labeling, inspecting, and deleting generated keys.
* **Format Converters**: Export keys into Raw Hex, Base64, SPKI/PKCS8 PEM blocks, or JSON.
* **Key Import**: Import external keys by pasting raw Hex strings, Base64 buffers, or standard PEM blocks.
* **Download Helpers**: Save keys locally as `.key`, `.pub`, or `.pem` files.

### 4. 🎓 Interactive Educational Suite & Visualization Lab
* **4-Step AES Pipeline Visualizer**: Interactive diagram animating Plaintext $\rightarrow$ IV/Key Prep $\rightarrow$ Galois Counter Permutations $\rightarrow$ Ciphertext & Auth Tag.
* **Symmetric vs. Asymmetric Comparison Matrix**: Side-by-side comparison covering key distribution, performance speed, data size limits, and real-world protocols (HTTPS, SSH, BitLocker, Signal).
* **RSA Math Playground**: Interactive numerical calculator demonstrating $n = p \times q$, Euler's totient $\phi(n)$, public exponent $e$, private exponent $d$, and modular exponentiation $c = m^e \bmod n$ using custom prime sliders ($p, q$).
* **Binary Hex Inspector**: Color-coded byte inspector highlighting Initialization Vectors (IV in cyan), Authentication Tags (rose), and Ciphertext payload (purple).
* **Interactive Knowledge Quiz**: 3-question self-assessment with instant feedback and explanatory breakdowns.

---

## 🛠️ Technology Stack

* **Frontend Framework**: React 18
* **Build Tool & Dev Server**: Vite 5
* **Language**: TypeScript 5
* **Styling**: Tailwind CSS 3 (Dark cyber theme with custom glassmorphic utility tokens)
* **Iconography**: Lucide React
* **Cryptographic Core**: Native Web Crypto API (`window.crypto.subtle`)

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (version 18.0.0 or higher recommended)
* [npm](https://www.npmjs.com/) (version 9.0.0 or higher)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/cryptovault-studio.git
   cd cryptovault-studio
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000` to access CryptoVault Studio.

4. **Build for production**:
   ```bash
   npm run build
   ```

### ⚡ Standalone Zero-Dependency Launch
CryptoVault Studio also includes a dual-capable `index.html` file. You can open `index.html` directly in Chrome, Edge, Firefox, or Safari by double-clicking it—no Node.js or web server required!

---

## 📖 Usage Guide

### Encrypting a File with AES-256
1. Open the **Symmetric (AES)** tab.
2. Select **256-bit** key length and click **Generate Key** (or enter a passphrase to derive a key via PBKDF2).
3. Drag & drop a `.txt` file into the file dropzone (or paste text into the input area).
4. Click **Encrypt Data**.
5. Click **Download .txt** to save your `.enc.txt` file or **Copy Package** to copy the combined ciphertext.

### Decrypting a File with AES-256
1. In the **Symmetric (AES)** tab, scroll to the **Decrypt** workstation.
2. Drag & drop the `.enc.txt` file (or paste the combined package).
3. Ensure the matching AES key is loaded (or paste the Hex key).
4. Click **Decrypt Data** to view and download your restored plaintext `.txt` file.

### RSA Key Pair Generation & Hybrid Encryption
1. Open the **Asymmetric (RSA)** tab.
2. Select **RSA-2048** or **RSA-3072** and click **Generate RSA Key Pair**.
3. Copy or download your **Public Key** (`.pub`) and **Private Key** (`.key`).
4. Drop any `.txt` file into the Public Key encryption panel and click **Encrypt Data**.
5. Use the Private Key in the Decrypt panel to restore original data.

---

## 🔒 Security & Privacy Notice

> [!IMPORTANT]
> **100% Zero-Knowledge Client-Side Processing**
> All cryptographic operations (key generation, AES-GCM tag calculation, RSA modular exponentiation, and file processing) execute entirely inside your browser's V8/JS engine using hardware-accelerated `SubtleCrypto` primitives.
> **No plaintext, ciphertext, or private key is ever sent to a server.**

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
