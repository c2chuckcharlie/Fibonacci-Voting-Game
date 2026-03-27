import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SetupStep } from './components/SetupStep';
import { VoteStep } from './components/VoteStep';
import { ResultsStep } from './components/ResultsStep';
import { AdminPanel } from './components/AdminPanel';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Modal } from './components/Modal';
import { GameMode, GameState } from './types';
import { I18N } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Vote, BarChart3, ShieldCheck } from 'lucide-react';

const initialState: GameState = {
  participants: [],
  options: [],
  mode: GameMode.PICK_ONE,
  votes: {},
  submitted: {},
  anonymous: false,
  timerEnabled: false,
  timerDuration: 60,
  liveResults: true,
  language: 'en',
};

export default function App() {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem('fibvote_state');
    return saved ? JSON.parse(saved) : initialState;
  });

  const [activeTab, setActiveTab] = useState<'setup' | 'vote' | 'results' | 'admin'>('setup');
  const [adminMode, setAdminMode] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('fibvote_state', JSON.stringify(state));
  }, [state]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const t = (key: keyof typeof I18N['en']) => I18N[state.language][key] || I18N['en'][key];

  const handleStartGame = () => {
    if (state.participants.length === 0) {
      showToast(state.language === 'zh' ? '請至少新增一位參與者' : 'Add at least one participant.', 'error');
      return;
    }
    if (state.options.length === 0) {
      showToast(state.language === 'zh' ? '請至少新增一個選項' : 'Add at least one option.', 'error');
      return;
    }
    setActiveTab('vote');
    showToast(t('toast_game_start'), 'success');
  };

  const handleResetAll = () => {
    setState(prev => ({
      ...prev,
      votes: {},
      submitted: {},
    }));
    setIsResetModalOpen(false);
    showToast(t('toast_reset'), 'info');
  };

  const tabs = [
    { id: 'setup', icon: <Settings size={16} />, label: t('tab_setup') },
    { id: 'vote', icon: <Vote size={16} />, label: t('tab_vote') },
    { id: 'results', icon: <BarChart3 size={16} />, label: t('tab_results') },
    ...(adminMode ? [{ id: 'admin', icon: <ShieldCheck size={16} />, label: t('tab_admin') }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        language={state.language} 
        setLanguage={(lang) => setState(prev => ({ ...prev, language: lang }))}
        adminMode={adminMode}
        toggleAdminMode={() => setAdminMode(!adminMode)}
      />

      {/* Tabs */}
      <div className="bg-surface border-b border-border sticky top-[73px] z-90 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${activeTab === tab.id ? 'text-accent border-accent' : 'text-text-muted border-transparent hover:text-white'}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'setup' && (
              <SetupStep 
                state={state} 
                setState={setState} 
                onStart={handleStartGame} 
                showToast={showToast}
              />
            )}
            {activeTab === 'vote' && (
              <VoteStep 
                state={state} 
                setState={setState} 
                showToast={showToast}
                onAllSubmitted={() => {
                  setActiveTab('results');
                  showToast(state.language === 'zh' ? '🎉 所有人已完成投票！' : '🎉 All votes submitted!', 'success');
                }}
              />
            )}
            {activeTab === 'results' && (
              <ResultsStep 
                state={state} 
                showToast={showToast}
              />
            )}
            {activeTab === 'admin' && adminMode && (
              <AdminPanel 
                state={state} 
                setState={setState}
                onReset={() => setIsResetModalOpen(true)}
                onBackToSetup={() => setActiveTab('setup')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <Modal 
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title={t('confirm_reset_title')}
        description={t('confirm_reset_body')}
        onConfirm={handleResetAll}
        confirmLabel={t('confirm_reset')}
        cancelLabel={t('cancel')}
        type="danger"
      />
    </div>
  );
}
