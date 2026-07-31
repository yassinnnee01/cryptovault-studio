import React from 'react';
import { Shield, Lock, Key, Cpu, BookOpen, Layers } from 'lucide-react';

interface NavbarProps {
  activeTab: 'symmetric' | 'asymmetric' | 'vault' | 'education';
  setActiveTab: (tab: 'symmetric' | 'asymmetric' | 'vault' | 'education') => void;
  vaultKeyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, vaultKeyCount }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyber-border/80 bg-[#080b14]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('symmetric')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-cyan-500/10 to-purple-500/20 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-wider text-white font-mono">CRYPTO<span className="text-cyan-400">VAULT</span></span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  STUDIO
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans hidden sm:block">Symmetric & Asymmetric Encryption Lab</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
            
            <button
              onClick={() => setActiveTab('symmetric')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'symmetric'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Lock className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline">Symmetric</span>
              <span className="font-mono text-[10px] px-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">AES</span>
            </button>

            <button
              onClick={() => setActiveTab('asymmetric')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'asymmetric'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-md shadow-purple-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Key className="w-4 h-4 text-purple-400" />
              <span className="hidden md:inline">Asymmetric</span>
              <span className="font-mono text-[10px] px-1 rounded bg-purple-950 text-purple-300 border border-purple-800/50">RSA</span>
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all relative ${
                activeTab === 'vault'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Key Vault</span>
              {vaultKeyCount > 0 && (
                <span className="flex items-center justify-center text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950">
                  {vaultKeyCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('education')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'education'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Learn Lab</span>
            </button>

          </nav>
        </div>
      </div>
    </header>
  );
};
