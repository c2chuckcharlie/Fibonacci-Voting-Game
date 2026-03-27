import React from 'react';
import { I18N } from '../constants';

interface HeaderProps {
  language: 'en' | 'zh';
  setLanguage: (lang: 'en' | 'zh') => void;
  adminMode: boolean;
  toggleAdminMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({ language, setLanguage, adminMode, toggleAdminMode }) => {
  const t = (key: keyof typeof I18N['en']) => I18N[language][key] || I18N['en'][key];

  return (
    <header className="bg-linear-to-br from-[#0a0e1a] to-[#0f1729] border-b border-border py-5 sticky top-0 z-100 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-accent to-accent3 rounded-xl flex items-center justify-center font-mono text-lg font-bold text-white shadow-[0_0_20px_rgba(0,212,255,0.3)]">
              φ
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{t('app_title')}</h1>
              <p className="text-[11px] text-text-muted font-mono">{t('app_sub')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex bg-surface2 rounded-lg overflow-hidden border border-border">
              <button 
                className={`px-3.5 py-1.5 text-xs cursor-pointer transition-all ${language === 'en' ? 'bg-accent text-black font-bold' : 'text-text-muted'}`}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
              <button 
                className={`px-3.5 py-1.5 text-xs cursor-pointer transition-all ${language === 'zh' ? 'bg-accent text-black font-bold' : 'text-text-muted'}`}
                onClick={() => setLanguage('zh')}
              >
                中文
              </button>
            </div>
            
            <button 
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${adminMode ? 'bg-accent3 border-accent3 text-white' : 'bg-accent3/20 border-accent3 text-accent3'}`}
              onClick={toggleAdminMode}
            >
              {adminMode ? '🛡️ Admin ON' : '🔐 Admin'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
