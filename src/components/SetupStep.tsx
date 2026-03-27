import React, { useState } from 'react';
import { I18N, COLORS, AVATAR_COLORS, FIB, FIB_LABELS } from '../constants';
import { GameMode, GameState, Participant, VotingOption } from '../types';
import { generateOptionsAI, refineDescriptionsAI } from '../services/geminiService';
import { Plus, Trash2, Users, Settings, Lightbulb, Sparkles, Wand2, Play } from 'lucide-react';

interface SetupStepProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  onStart: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SetupStep: React.FC<SetupStepProps> = ({ state, setState, onStart, showToast }) => {
  const [newParticipantName, setNewParticipantName] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  const t = (key: keyof typeof I18N['en']) => I18N[state.language][key] || I18N['en'][key];

  const addParticipant = () => {
    const name = newParticipantName.trim();
    if (!name) return;
    if (state.participants.find(p => p.name === name)) {
      showToast(t('toast_exists'), 'error');
      return;
    }
    const id = 'p_' + Date.now();
    const color = AVATAR_COLORS[state.participants.length % AVATAR_COLORS.length];
    setState(prev => ({
      ...prev,
      participants: [...prev.participants, { id, name, color }]
    }));
    setNewParticipantName('');
    showToast(t('toast_added'), 'success');
  };

  const addAnonymous = () => {
    const anonCount = state.participants.filter(p => p.id.startsWith('p_anon_')).length + 1;
    const name = state.language === 'zh' ? `匿名 ${anonCount}` : `Anonymous ${anonCount}`;
    const id = 'p_anon_' + Date.now();
    const color = AVATAR_COLORS[state.participants.length % AVATAR_COLORS.length];
    setState(prev => ({
      ...prev,
      participants: [...prev.participants, { id, name, color }]
    }));
  };

  const removeParticipant = (id: string) => {
    setState(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p.id !== id),
      votes: { ...prev.votes, [id]: {} },
      submitted: { ...prev.submitted, [id]: false }
    }));
  };

  const addOption = (name = '', description = '') => {
    const id = 'opt_' + Date.now();
    setState(prev => ({
      ...prev,
      options: [...prev.options, { id, name, description }]
    }));
  };

  const removeOption = (id: string) => {
    setState(prev => ({
      ...prev,
      options: prev.options.filter(o => o.id !== id)
    }));
  };

  const updateOption = (id: string, key: keyof VotingOption, val: string) => {
    setState(prev => ({
      ...prev,
      options: prev.options.map(o => o.id === id ? { ...o, [key]: val } : o)
    }));
  };

  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) return;
    setIsGenerating(true);
    try {
      const newOptions = await generateOptionsAI(aiTopic, state.language);
      setState(prev => ({
        ...prev,
        options: [...prev.options, ...newOptions.map((o: any) => ({ ...o, id: 'opt_' + Math.random().toString(36).substr(2, 9) }))]
      }));
      setAiTopic('');
      showToast(state.language === 'zh' ? 'AI 已生成選項！' : 'AI generated options!', 'success');
    } catch (error) {
      showToast('AI Error', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefineAI = async () => {
    if (state.options.length === 0) return;
    setIsRefining(true);
    try {
      const refined = await refineDescriptionsAI(state.options.map(o => ({ name: o.name, description: o.description })), state.language);
      setState(prev => ({
        ...prev,
        options: prev.options.map((o, i) => ({ ...o, name: refined[i]?.name || o.name, description: refined[i]?.description || o.description }))
      }));
      showToast(state.language === 'zh' ? 'AI 已優化說明！' : 'AI refined descriptions!', 'success');
    } catch (error) {
      showToast('AI Error', 'error');
    } finally {
      setIsRefining(false);
    }
  };

  const loadSampleData = () => {
    const sampleParticipants = [
      { id: 'p1', name: 'Alex', color: '#7c3aed' },
      { id: 'p2', name: 'Bella', color: '#0891b2' },
      { id: 'p3', name: 'Chris', color: '#059669' },
      { id: 'p4', name: 'Diana', color: '#d97706' },
    ];
    const sampleOptions = state.language === 'zh' ? [
      { id: 'o1', name: '團隊 1：冬山河無人機觀光方案', description: '無人機空拍旅遊體驗' },
      { id: 'o2', name: '團隊 2：溫泉智慧預訂平台', description: 'AI 個人化溫泉服務' },
      { id: 'o3', name: '團隊 3：在地農業生態旅遊', description: '永續農場體驗套裝' },
      { id: 'o4', name: '團隊 4：夜市文化數位導覽', description: '互動式 AR 夜市地圖' },
    ] : [
      { id: 'o1', name: 'Team 1: Drone Tourism', description: 'Aerial photography tourism' },
      { id: 'o2', name: 'Team 2: Smart Booking', description: 'AI-personalized service' },
      { id: 'o3', name: 'Team 3: Eco Tourism', description: 'Sustainable farm experience' },
      { id: 'o4', name: 'Team 4: Digital Guide', description: 'Interactive AR street map' },
    ];
    setState(prev => ({
      ...prev,
      participants: sampleParticipants,
      options: sampleOptions
    }));
    showToast(state.language === 'zh' ? '範例資料已載入！' : 'Sample data loaded!', 'info');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-linear-to-br from-accent/10 to-accent3/10 border border-accent/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <div className="text-2xl mt-0.5">ℹ️</div>
        <div>
          <h3 className="text-sm font-bold text-accent mb-1">{t('setup_instr_title')}</h3>
          <p className="text-xs text-text-dim leading-relaxed">{t('setup_instr_body')}</p>
          <p className="mt-1 text-xs text-accent">{t('setup_instr_zh')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Participants */}
        <div className="card">
          <div className="text-xs font-bold text-accent font-mono mb-4 uppercase tracking-wider flex items-center gap-2">
            <Users size={14} /> {t('participants_title')}
            <div className="flex-1 h-px bg-border ml-2" />
          </div>
          
          <div className="space-y-3.5">
            <div>
              <label className="text-[11px] text-text-muted mb-1.5 block">{t('add_participant')}</label>
              <div className="flex gap-2">
                <input 
                  className="form-input" 
                  placeholder={t('participant_placeholder')}
                  value={newParticipantName}
                  onChange={e => setNewParticipantName(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addParticipant()}
                />
                <button className="btn btn-primary px-4 py-2 whitespace-nowrap" onClick={addParticipant}>
                  <Plus size={16} /> {t('add')}
                </button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button className="btn btn-ghost flex-1 text-xs py-2" onClick={addAnonymous}>
                {t('add_anon')}
              </button>
              <button className="btn btn-ghost flex-1 text-xs py-2" onClick={() => setState(prev => ({ ...prev, participants: [] }))}>
                {t('clear_all')}
              </button>
            </div>
            
            <div className="space-y-2 mt-3 max-h-60 overflow-y-auto pr-1">
              {state.participants.map(p => (
                <div key={p.id} className="flex items-center gap-2.5 bg-surface2 border border-border rounded-lg p-2 animate-in slide-in-from-left-2 duration-200">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: p.color }}>
                    {p.name[0].toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm truncate">{p.name}</span>
                  <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-border bg-surface2 cursor-pointer hover:bg-red-500/20 hover:border-red-500/40 transition-colors" onClick={() => removeParticipant(p.id)}>
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              ))}
              {state.participants.length === 0 && (
                <div className="text-center text-text-muted text-xs py-4">No participants yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-5">
          <div className="card">
            <div className="text-xs font-bold text-accent font-mono mb-4 uppercase tracking-wider flex items-center gap-2">
              <Lightbulb size={14} /> {t('voting_options_title')}
              <div className="flex-1 h-px bg-border ml-2" />
            </div>
            
            <div className="space-y-2 mb-4 max-h-80 overflow-y-auto pr-1">
              {state.options.map((opt, i) => (
                <div key={opt.id} className="flex gap-2 items-start">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 mt-1.5" style={{ background: `${COLORS[i % COLORS.length]}33`, color: COLORS[i % COLORS.length] }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input 
                      className="form-input py-1.5 text-xs" 
                      placeholder="Option name" 
                      value={opt.name}
                      onChange={e => updateOption(opt.id, 'name', e.target.value)}
                    />
                    <textarea 
                      className="form-input py-1.5 text-xs h-16 resize-none" 
                      placeholder="Description" 
                      value={opt.description}
                      onChange={e => updateOption(opt.id, 'description', e.target.value)}
                    />
                  </div>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-surface2 cursor-pointer hover:bg-red-500/20 hover:border-red-500/40 transition-colors mt-1.5" onClick={() => removeOption(opt.id)}>
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              ))}
            </div>
            
            <button className="w-full py-2 bg-accent/10 border border-dashed border-accent/30 rounded-lg text-accent text-xs hover:bg-accent/20 transition-colors mb-3" onClick={() => addOption()}>
              {t('add_option')}
            </button>

            {/* AI Tools */}
            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex gap-2">
                <input 
                  className="form-input text-xs py-2" 
                  placeholder={t('ai_prompt_placeholder')}
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                />
                <button 
                  className="btn btn-ghost py-2 px-3 text-xs whitespace-nowrap" 
                  onClick={handleGenerateAI}
                  disabled={isGenerating || !aiTopic.trim()}
                >
                  <Sparkles size={14} className={isGenerating ? 'animate-spin' : ''} />
                  {isGenerating ? t('ai_generating') : t('ai_generate_options')}
                </button>
              </div>
              <button 
                className="btn btn-ghost w-full py-2 text-xs" 
                onClick={handleRefineAI}
                disabled={isRefining || state.options.length === 0}
              >
                <Wand2 size={14} className={isRefining ? 'animate-spin' : ''} />
                {isRefining ? t('ai_generating') : t('ai_refine_options')}
              </button>
            </div>
          </div>

          {/* Mode */}
          <div className="card">
            <div className="text-xs font-bold text-accent font-mono mb-4 uppercase tracking-wider flex items-center gap-2">
              <Settings size={14} /> {t('game_mode_title')}
              <div className="flex-1 h-px bg-border ml-2" />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: GameMode.PICK_ONE, icon: '🎯', name: t('mode_a_name'), desc: t('mode_a_desc') },
                { id: GameMode.RATE_ALL, icon: '📊', name: t('mode_b_name'), desc: t('mode_b_desc') },
                { id: GameMode.BUDGET_34, icon: '💰', name: t('mode_c_name'), desc: t('mode_c_desc') },
              ].map(m => (
                <button 
                  key={m.id}
                  className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${state.mode === m.id ? 'border-accent bg-accent/10' : 'border-border bg-surface2 hover:border-text-muted'}`}
                  onClick={() => setState(prev => ({ ...prev, mode: m.id }))}
                >
                  <div className="text-2xl mb-1.5">{m.icon}</div>
                  <div className="text-[11px] font-bold">{m.name}</div>
                  <div className="text-[9px] text-text-muted mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="card mb-6">
        <div className="text-xs font-bold text-accent font-mono mb-4 uppercase tracking-wider flex items-center gap-2">
          <Settings size={14} /> {t('settings_title')}
          <div className="flex-1 h-px bg-border ml-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
          <div className="flex items-center justify-between py-2 border-b border-border sm:border-b-0 sm:border-r sm:pr-10">
            <span className="text-xs text-text-dim">{t('anonymous_voting')}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={state.anonymous}
                onChange={e => setState(prev => ({ ...prev, anonymous: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-surface2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-muted after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent/20 peer-checked:after:bg-accent border border-border"></div>
            </label>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border sm:border-b-0">
            <span className="text-xs text-text-dim">{t('timer_enable')}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={state.timerEnabled}
                onChange={e => setState(prev => ({ ...prev, timerEnabled: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-surface2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-muted after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent/20 peer-checked:after:bg-accent border border-border"></div>
            </label>
          </div>
          {state.timerEnabled && (
            <div className="flex items-center justify-between py-2 sm:border-r sm:pr-10">
              <span className="text-xs text-text-dim">{t('timer_seconds')}</span>
              <input 
                type="number" 
                className="form-input w-20 text-center py-1" 
                value={state.timerDuration}
                onChange={e => setState(prev => ({ ...prev, timerDuration: parseInt(e.target.value) || 60 }))}
                min="10" max="600"
              />
            </div>
          )}
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-text-dim">{t('show_live')}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={state.liveResults}
                onChange={e => setState(prev => ({ ...prev, liveResults: e.target.checked as true }))}
              />
              <div className="w-11 h-6 bg-surface2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-muted after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent/20 peer-checked:after:bg-accent border border-border"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Fib Reference */}
      <div className="card mb-6">
        <div className="text-xs font-bold text-accent font-mono mb-4 uppercase tracking-wider flex items-center gap-2">
          {t('fib_ref_title')}
          <div className="flex-1 h-px bg-border ml-2" />
        </div>
        <div className="flex flex-wrap gap-2">
          {FIB.map((v, i) => (
            <div 
              key={v} 
              className="px-2.5 py-1 rounded-md text-[10px] font-bold font-mono border"
              style={{ background: `${COLORS[i % COLORS.length]}22`, color: COLORS[i % COLORS.length], borderColor: `${COLORS[i % COLORS.length]}44` }}
            >
              {v} = {FIB_LABELS[state.language][v as keyof typeof FIB_LABELS['en']]}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button className="btn btn-ghost" onClick={loadSampleData}>
          {t('load_sample')}
        </button>
        <button className="btn btn-primary" onClick={onStart}>
          <Play size={18} /> {t('start_game')}
        </button>
      </div>
    </div>
  );
};
