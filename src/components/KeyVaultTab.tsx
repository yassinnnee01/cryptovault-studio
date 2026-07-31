import React, { useState } from 'react';
import { 
  Layers, Key, Lock, Trash2, Copy, Download, Plus, Search, Shield, 
  CheckCircle2, FileCode, ArrowUpRight, X, Eye, EyeOff 
} from 'lucide-react';
import { VaultKeyItem } from '../types/crypto';
import { downloadTextFile } from '../utils/fileHelpers';

interface KeyVaultTabProps {
  keys: VaultKeyItem[];
  onDeleteKey: (id: string) => void;
  onImportKey: (keyItem: VaultKeyItem) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const KeyVaultTab: React.FC<KeyVaultTabProps> = ({
  keys,
  onDeleteKey,
  onImportKey,
  showToast,
}) => {
  const [filter, setFilter] = useState<'all' | 'symmetric' | 'asymmetric'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // Import Modal Form
  const [importName, setImportName] = useState<string>('');
  const [importAlgorithm, setImportAlgorithm] = useState<'AES-256' | 'AES-128' | 'RSA-2048' | 'RSA-3072'>('AES-256');
  const [importContent, setImportContent] = useState<string>('');

  const filteredKeys = keys.filter((k) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'symmetric'
        ? k.type === 'symmetric'
        : k.type.startsWith('asymmetric');
    const matchesSearch = k.name.toLowerCase().includes(searchQuery.toLowerCase()) || k.algorithm.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast('info', 'Copied to Clipboard', `Copied ${label} to clipboard.`);
  };

  const handleCreateImport = () => {
    if (!importName || !importContent) {
      showToast('error', 'Missing Fields', 'Please enter a key name and paste key content.');
      return;
    }

    const isRsa = importAlgorithm.startsWith('RSA');
    const isPem = importContent.includes('-----BEGIN');

    const newItem: VaultKeyItem = {
      id: 'imported-' + Date.now(),
      name: importName,
      algorithm: importAlgorithm as any,
      type: isRsa ? 'asymmetric-pair' : 'symmetric',
      createdAt: Date.now(),
      rawHex: !isRsa && !isPem ? importContent.trim() : undefined,
      publicKeyPem: isRsa && importContent.includes('PUBLIC KEY') ? importContent.trim() : undefined,
      privateKeyPem: isRsa && importContent.includes('PRIVATE KEY') ? importContent.trim() : undefined,
      bitLength: importAlgorithm.includes('256') ? 256 : importAlgorithm.includes('128') ? 128 : importAlgorithm.includes('3072') ? 3072 : 2048,
    };

    onImportKey(newItem);
    showToast('success', 'Key Imported', `Successfully imported ${newItem.name} into Key Vault.`);
    setShowImportModal(false);
    setImportName('');
    setImportContent('');
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="glass-panel-glow-cyan p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Layers className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white font-mono tracking-tight">Key Vault & Repository</h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              {keys.length} Keys Stored
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-2 max-w-2xl">
            Central key repository for your symmetric AES keys and asymmetric RSA key pairs. Copy raw Hex, Base64, or standard PEM string definitions.
          </p>
        </div>

        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Import Custom Key</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keys by name or algorithm..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'all'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({keys.length})
          </button>
          <button
            onClick={() => setFilter('symmetric')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'symmetric'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Symmetric AES
          </button>
          <button
            onClick={() => setFilter('asymmetric')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'asymmetric'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Asymmetric RSA
          </button>
        </div>

      </div>

      {/* Keys List Grid */}
      {filteredKeys.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredKeys.map((item) => {
            const isRsa = item.type.startsWith('asymmetric');

            return (
              <div
                key={item.id}
                className="glass-panel p-5 rounded-2xl space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className={`p-2 rounded-xl border ${
                        isRsa ? 'bg-purple-950/40 border-purple-800 text-purple-400' : 'bg-cyan-950/40 border-cyan-800 text-cyan-400'
                      }`}>
                        {isRsa ? <Key className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-white tracking-wide">{item.name}</h3>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {item.algorithm} • Created {new Date(item.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onDeleteKey(item.id);
                        showToast('info', 'Key Deleted', `Deleted ${item.name} from Key Vault.`);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900 transition-all"
                      title="Delete Key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content Preview Box */}
                  {!isRsa && item.rawHex && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Raw Hex String ({item.bitLength}-bit)</span>
                        <button
                          onClick={() => handleCopy(item.rawHex!, 'Raw Hex Key')}
                          className="text-cyan-400 hover:underline flex items-center space-x-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      </div>
                      <p className="font-mono text-xs text-cyan-300 break-all select-all">
                        {item.rawHex}
                      </p>
                    </div>
                  )}

                  {isRsa && (
                    <div className="space-y-2">
                      {item.publicKeyPem && (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-purple-300">
                            <span>Public Key (PEM)</span>
                            <button
                              onClick={() => handleCopy(item.publicKeyPem!, 'Public Key PEM')}
                              className="text-purple-400 hover:underline flex items-center space-x-1"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </button>
                          </div>
                          <p className="font-mono text-[10px] text-slate-400 truncate">
                            {item.publicKeyPem.split('\n')[1]}...
                          </p>
                        </div>
                      )}

                      {item.privateKeyPem && (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-amber-300">
                            <span>Private Key (PEM)</span>
                            <button
                              onClick={() => handleCopy(item.privateKeyPem!, 'Private Key PEM')}
                              className="text-amber-400 hover:underline flex items-center space-x-1"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </button>
                          </div>
                          <p className="font-mono text-[10px] text-slate-500">
                            ••••••••••••••••••••••••••••••••••••
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const text = isRsa ? (item.publicKeyPem || item.privateKeyPem || '') : (item.rawHex || '');
                      downloadTextFile(`${item.name.toLowerCase().replace(/\s+/g, '_')}.key`, text);
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 flex items-center justify-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download Key</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
          <Shield className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No Keys Found in Vault</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Generate keys in the Symmetric or Asymmetric tabs, or click "Import Custom Key" above to save external keys.
          </p>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full space-y-5 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Import External Key</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-medium">Key Label / Name</label>
                <input
                  type="text"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  placeholder="e.g. My External Production Key"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium">Algorithm</label>
                <select
                  value={importAlgorithm}
                  onChange={(e: any) => setImportAlgorithm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 mt-1"
                >
                  <option value="AES-256">AES-256 (Symmetric)</option>
                  <option value="AES-128">AES-128 (Symmetric)</option>
                  <option value="RSA-2048">RSA-2048 (Asymmetric)</option>
                  <option value="RSA-3072">RSA-3072 (Asymmetric)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium">Key Content (Raw Hex, Base64, or PEM)</label>
                <textarea
                  rows={5}
                  value={importContent}
                  onChange={(e) => setImportContent(e.target.value)}
                  placeholder="Paste Hex string or PEM block (-----BEGIN ...)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none mt-1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateImport}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20"
              >
                Save Key to Vault
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
