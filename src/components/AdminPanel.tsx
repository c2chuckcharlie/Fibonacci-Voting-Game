import React from 'react';
import { I18N } from '../constants';
import { GameState } from '../types';
import { RefreshCw, ArrowLeft, Eye, EyeOff, ClipboardList, Trash2 } from 'lucide-react';

interface AdminPanelProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  onReset: () => void;
  onBackToSetup: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ state, setState, onReset, onBackToSetup }) => {
  const t = (key: keyof typeof I18N['en']) => I18N[state.language][key] || I18N['en'][key];

  const participants = state.participants.filter(p => state.submitted[p.id]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="card">
        <div className="text-xs font-bold text-accent font-mono mb-6 uppercase tracking-wider flex items-center gap-2">
          🛡️ {t('admin_controls')}
          <div className="flex-1 h-px bg-border ml-2" />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-danger py-2.5 text-xs" onClick={onReset}>
            <RefreshCw size={14} /> {t('reset_all')}
          </button>
          <button className="btn btn-ghost py-2.5 text-xs" onClick={onBackToSetup}>
            <ArrowLeft size={14} /> {t('back_setup')}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="text-xs font-bold text-accent font-mono mb-6 uppercase tracking-wider flex items-center gap-2">
          <ClipboardList size={14} /> {t('vote_log')}
          <div className="flex-1 h-px bg-border ml-2" />
        </div>
        
        {participants.length === 0 ? (
          <div className="text-center py-10 text-text-muted text-sm">
            <ClipboardList size={40} className="mx-auto mb-3 opacity-20" />
            {state.language === 'zh' ? '尚無投票記錄' : 'No vote log yet'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface2/50">
                  <th className="px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider border-b border-border">ID</th>
                  <th className="px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider border-b border-border">{state.language === 'zh' ? '姓名' : 'Name'}</th>
                  {state.options.map(o => (
                    <th key={o.id} className="px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider border-b border-border text-center">{o.name.substring(0, 10)}</th>
                  ))}
                  <th className="px-4 py-3 text-[10px] font-mono text-gold uppercase tracking-wider border-b border-border text-center">{t('total')}</th>
                  <th className="px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider border-b border-border text-center">{state.language === 'zh' ? '操作' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {participants.map(p => {
                  const rowTotal = state.options.reduce((s, o) => s + (state.votes[p.id]?.[o.id] || 0), 0);
                  return (
                    <tr key={p.id} className="hover:bg-surface2/30 transition-colors">
                      <td className="px-4 py-3 text-[10px] font-mono text-text-muted border-b border-border/50">{p.id.substring(0, 8)}</td>
                      <td className="px-4 py-3 text-xs font-semibold border-b border-border/50">{state.anonymous ? 'Anon' : p.name}</td>
                      {state.options.map(o => (
                        <td key={o.id} className="px-4 py-3 text-center text-xs font-bold font-mono border-b border-border/50">
                          {state.votes[p.id]?.[o.id] || '—'}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center text-sm font-bold text-gold font-mono border-b border-border/50">{rowTotal}</td>
                      <td className="px-4 py-3 text-center border-b border-border/50">
                        <button 
                          className="p-1.5 rounded-md hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                          onClick={() => {
                            setState(prev => ({
                              ...prev,
                              submitted: { ...prev.submitted, [p.id]: false },
                              votes: { ...prev.votes, [p.id]: {} }
                            }));
                          }}
                          title="Clear user votes"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
