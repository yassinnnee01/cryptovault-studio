import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SymmetricTab } from './components/SymmetricTab';
import { AsymmetricTab } from './components/AsymmetricTab';
import { KeyVaultTab } from './components/KeyVaultTab';
import { EducationTab } from './components/EducationTab';
import { Toast } from './components/Toast';
import { VaultKeyItem, ToastMessage } from './types/crypto';

export function App() {
  const [activeTab, setActiveTab] = useState<'symmetric' | 'asymmetric' | 'vault' | 'education'>('symmetric');
  const [vaultKeys, setVaultKeys] = useState<VaultKeyItem[]>(() => {
    const saved = localStorage.getItem('cryptovault_keys');
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Sync vault to localStorage
  useEffect(() => {
    const storable = vaultKeys.map(k => ({
      ...k,
      cryptoKey: undefined,
      publicKey: undefined,
      privateKey: undefined,
    }));
    localStorage.setItem('cryptovault_keys', JSON.stringify(storable));
  }, [vaultKeys]);

  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setToast({ id: Date.now().toString(), type, title, message });
  };

  const handleSaveToVault = (newItem: VaultKeyItem) => {
    setVaultKeys(prev => [newItem, ...prev.filter(k => k.id !== newItem.id)]);
  };

  const handleDeleteVaultKey = (id: string) => {
    setVaultKeys(prev => prev.filter(k => k.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080b14] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        vaultKeyCount={vaultKeys.length}
      />

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'symmetric' && (
          <SymmetricTab
            onSaveToVault={handleSaveToVault}
            showToast={showToast}
          />
        )}

        {activeTab === 'asymmetric' && (
          <AsymmetricTab
            onSaveToVault={handleSaveToVault}
            showToast={showToast}
          />
        )}

        {activeTab === 'vault' && (
          <KeyVaultTab
            keys={vaultKeys}
            onDeleteKey={handleDeleteVaultKey}
            onImportKey={handleSaveToVault}
            showToast={showToast}
          />
        )}

        {activeTab === 'education' && (
          <EducationTab />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/60 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 font-mono space-y-1">
          <p>CRYPTOVAULT STUDIO — Cryptographic Key Generator & File Encryption Lab</p>
          <p className="text-[11px] text-slate-600">Powered by Web Crypto API (SubtleCrypto) • Hardware Accelerated AES-GCM & RSA-OAEP</p>
        </div>
      </footer>

      {/* Toast Notification Banner */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}

export default App;
