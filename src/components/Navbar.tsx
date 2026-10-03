import { Shield, Eye, FileSearch, History, Settings, Lock, Radar, Menu, X } from 'lucide-react';
import type { AppStage } from '@/types';
import { useState } from 'react';

interface NavbarProps {
  stage: AppStage;
  onNavigate: (stage: AppStage) => void;
}

const NAV_ITEMS: { stage: AppStage; label: string; icon: typeof Shield }[] = [
  { stage: 'bosh-sahifa', label: 'Bosh sahifa', icon: Shield },
  { stage: 'yuklash', label: 'Tekshirish', icon: FileSearch },
  { stage: 'tarix', label: 'Tarix', icon: History },
  { stage: 'himoyalangan-fayllar', label: 'Himoyalangan fayllar', icon: Lock },
  { stage: 'vizion', label: 'Kelajak', icon: Eye },
  { stage: 'sozlamalar', label: 'Sozlamalar', icon: Settings },
];

export function Navbar({ stage, onNavigate }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 glass-panel border-b border-cyber-cyan/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => onNavigate('bosh-sahifa')}
              className="flex items-center gap-2 group"
            >
              <div className="relative">
                <Radar className="w-7 h-7 text-cyber-cyan animate-rotate-slow" />
                <div className="absolute inset-0 rounded-full border border-cyber-cyan/40 animate-ping-slow" />
              </div>
              <span className="font-display font-bold text-lg tracking-wider text-cyber-cyan text-glow-cyan">
                CYBER<span className="text-white">LENS</span>
              </span>
            </button>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = stage === item.stage;
                return (
                  <button
                    key={item.stage}
                    onClick={() => onNavigate(item.stage)}
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded transition-all duration-200 ${
                      active
                        ? 'text-cyber-cyan bg-cyber-cyan/10 border border-cyber-cyan/30'
                        : 'text-gray-400 hover:text-cyber-cyan hover:bg-cyber-cyan/5 border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-cyber-cyan p-2"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden glass-panel border-t border-cyber-cyan/20 animate-fade-in">
            <div className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = stage === item.stage;
                return (
                  <button
                    key={item.stage}
                    onClick={() => {
                      onNavigate(item.stage);
                      setMobileOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded transition-all ${
                      active
                        ? 'text-cyber-cyan bg-cyber-cyan/10 border border-cyber-cyan/30'
                        : 'text-gray-400 hover:text-cyber-cyan hover:bg-cyber-cyan/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
