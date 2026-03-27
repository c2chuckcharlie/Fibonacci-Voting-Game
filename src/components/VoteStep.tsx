import React, { useState, useEffect } from 'react';
import { I18N, FIB, FIB_LABELS, COLORS } from '../constants';
import { GameMode, GameState, VoteData } from '../types';
import { Check, Trash2, User, Timer as TimerIcon, Pause, Play } from 'lucide-react';

interface VoteStepProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onAllSubmitted: () => void;
}

export const VoteStep: React.FC<VoteStepProps> = ({ state, setState, showToast, onAllSubmitted }) => {
  const [currentVoterId, setCurrentVoterId] = useState<string | null>(null);
  const [pendingVotes, setPendingVotes] = useState<VoteData>({});
  const [timerRemaining, setTimerRemaining] = useState(state.timerDuration);
  const [timerRunning, setTimerRunning] = useState(false);

  const t = (key: keyof typeof I18N['en']) => I18N[state.language][key] || I18N['en'][key];

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.timerEnabled && timerRunning && timerRemaining > 0) {
      interval = setInterval(() => {
        setTimerRemaining(prev => prev - 1);
      }, 1000);
    } else if (timerRemaining === 0) {
      setTimerRunning(false);
      showToast(state.language === 'zh' ? '⏰ 時間到！' : "⏰ Time's up!", 'info');
    }
    return () => clearInterval(interval);
  }, [state.timerEnabled, timerRunning, timerRemaining]);

  // Start timer when step loads
  useEffect(() => {
    if (state.timerEnabled) {
      setTimerRunning(true);
    }
  }, [state.timerEnabled]);

  const selectVoter = (id: string) => {
    setCurrentVoterId(id);
    setPendingVotes(state.votes[id] || {});
  };

  const castVote = (optionId: string, val: number) => {
    if (!currentVoterId) return;

    let newVotes = { ...pendingVotes };

    if (state.mode === GameMode.PICK_ONE) {
      if (newVotes[optionId] === val) {
        delete newVotes[optionId];
      } else {
        newVotes = { [optionId]: val };
      }
    } else if (state.mode === GameMode.BUDGET_34) {
      const used = Object.entries(newVotes)
        .filter(([k]) => k !== optionId)
        .reduce((s, [, x]) => s + x, 0);
      
      if (used + val > 34) {
        showToast(t('toast_budget_over'), 'error');
        return;
      }
      
      if (newVotes[optionId] === val) {
        delete newVotes[optionId];
      } else {
        newVotes[optionId] = val;
      }
    } else {
      // RATE_ALL
      if (newVotes[optionId] === val) {
        delete newVotes[optionId];
      } else {
        newVotes[optionId] = val;
      }
    }

    setPendingVotes(newVotes);
  };

  const submitVotes = () => {
    if (!currentVoterId) return;
    if (Object.keys(pendingVotes).length === 0) {
      showToast(t('toast_no_votes'), 'error');
      return;
    }

    setState(prev => {
      const newVotes = { ...prev.votes, [currentVoterId]: pendingVotes };
      const newSubmitted = { ...prev.submitted, [currentVoterId]: true };
      
      // Check if all submitted
      const allDone = prev.participants.every(p => newSubmitted[p.id]);
      if (allDone) {
        setTimeout(onAllSubmitted, 500);
      }
      
      return { ...prev, votes: newVotes, submitted: newSubmitted };
    });

    showToast(t('toast_submitted'), 'success');
    setCurrentVoterId(null);
    setPendingVotes({});
  };

  const clearMyVotes = () => {
    setPendingVotes({});
  };

  const currentVoter = state.participants.find(p => p.id === currentVoterId);
  const budgetUsed = Object.values(pendingVotes).reduce((s, v) => s + v, 0);
  const budgetRemaining = 34 - budgetUsed;

  const isDisabledFib = (optionId: string, val: number) => {
    if (state.mode === GameMode.BUDGET_34) {
      const used = Object.entries(pendingVotes)
        .filter(([k]) => k !== optionId)
        .reduce((s, [, x]) => s + x, 0);
      return used + val > 34;
    }
    return false;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Timer */}
      {state.timerEnabled && (
        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 relative" style={{ background: `conic-gradient(var(--color-accent) ${(timerRemaining / state.timerDuration) * 100}%, var(--color-surface2) 0%)` }}>
            <div className="absolute inset-1.5 bg-surface rounded-full flex items-center justify-center">
              <span className="font-mono text-base font-bold text-accent">{timerRemaining}</span>
            </div>
          </div>
          <div className="flex-1">
            <strong className="text-sm block">{t('time_remaining')}</strong>
            <small className="text-xs text-text-muted block">{t('timer_desc')}</small>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost py-2 px-3 text-xs" onClick={() => setTimerRunning(!timerRunning)}>
              {timerRunning ? <Pause size={14} /> : <Play size={14} />}
              {timerRunning ? t('pause') : t('resume')}
            </button>
            <button className="btn btn-ghost py-2 px-3 text-xs" onClick={() => setTimerRemaining(state.timerDuration)}>
              {t('reset_timer')}
            </button>
          </div>
        </div>
      )}

      {/* Voter Selector */}
      <div className="bg-linear-to-br from-accent/10 to-accent3/10 border border-accent/20 rounded-xl p-4 mb-4 flex items-start gap-3">
        <div className="text-2xl mt-0.5">👤</div>
        <div>
          <h3 className="text-sm font-bold text-accent mb-1">{t('select_voter_title')}</h3>
          <p className="text-xs text-text-dim">{t('select_voter_desc')}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {state.participants.map(p => {
          const voted = !!state.submitted[p.id];
          const isActive = currentVoterId === p.id;
          return (
            <button 
              key={p.id}
              onClick={() => selectVoter(p.id)}
              className={`px-4 py-2 rounded-lg border-2 text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${isActive ? 'bg-accent/20 border-accent text-white' : (voted ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-surface2 border-border text-text-dim')}`}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
              {state.anonymous ? (state.language === 'zh' ? '匿名' : 'Anonymous') : p.name}
              {voted && <Check size={12} className="ml-1" />}
            </button>
          );
        })}
      </div>

      {/* Voting Area */}
      {currentVoter ? (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0" style={{ background: currentVoter.color }}>
                {currentVoter.name[0].toUpperCase()}
              </div>
              <div>
                <div className="text-base font-bold">{state.anonymous ? (state.language === 'zh' ? '匿名' : 'Anonymous') : currentVoter.name}</div>
                <div className="text-xs text-text-muted">
                  {state.mode === GameMode.PICK_ONE ? t('mode_label_A') : state.mode === GameMode.RATE_ALL ? t('mode_label_B') : t('mode_label_C')}
                </div>
              </div>
            </div>
            
            {state.mode === GameMode.BUDGET_34 && (
              <div className="bg-surface2 border border-border rounded-lg px-4 py-2.5 text-center">
                <div className={`text-2xl font-black font-mono ${budgetRemaining < 5 ? 'text-red-400' : (budgetRemaining < 15 ? 'text-orange-400' : 'text-gold')}`}>
                  {budgetRemaining}
                </div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider">{t('budget_left')}</div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {state.options.map((opt, i) => {
              const currentScore = pendingVotes[opt.id] || null;
              return (
                <div key={opt.id} className={`card p-0 overflow-hidden transition-colors ${currentScore ? 'border-accent/30' : ''}`}>
                  <div className="px-4.5 py-3.5 flex items-center justify-between border-b border-border bg-surface2">
                    <div>
                      <div className="text-sm font-bold" style={{ color: COLORS[i % COLORS.length] }}>{opt.name}</div>
                      {opt.description && <div className="text-xs text-text-muted mt-0.5">{opt.description}</div>}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold font-mono whitespace-nowrap ${currentScore ? 'bg-accent/15 text-accent' : 'bg-surface border border-dashed border-border text-text-muted'}`}>
                      {currentScore ? currentScore : t('no_vote')}
                    </div>
                  </div>
                  
                  <div className="p-4.5">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {FIB.map(v => (
                        <button 
                          key={v}
                          className={`fib-btn fib-${v} ${currentScore === v ? 'selected' : ''} ${isDisabledFib(opt.id, v) ? 'disabled' : ''}`}
                          onClick={() => castVote(opt.id, v)}
                          title={`${v} = ${FIB_LABELS[state.language][v as keyof typeof FIB_LABELS['en']]}`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <span className="text-[10px] text-text-muted flex items-center gap-1">▶ {FIB_LABELS[state.language][1]}: 1</span>
                      <span className="text-[10px] text-text-muted flex items-center gap-1">▶ {FIB_LABELS[state.language][8]}: 8</span>
                      <span className="text-[10px] text-text-muted flex items-center gap-1">▶ {FIB_LABELS[state.language][21]}: 21</span>
                      <span className="text-[10px] text-text-muted flex items-center gap-1">▶ {FIB_LABELS[state.language][34]}: 34 ★</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button className="btn btn-ghost" onClick={clearMyVotes}>
              <Trash2 size={16} /> {t('clear_votes')}
            </button>
            <button className="btn btn-success" onClick={submitVotes}>
              <Check size={18} /> {t('submit_votes')}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-surface/50 border border-dashed border-border rounded-2xl">
          <div className="text-5xl mb-4">👆</div>
          <p className="text-text-muted">{t('select_voter_prompt')}</p>
        </div>
      )}
    </div>
  );
};
