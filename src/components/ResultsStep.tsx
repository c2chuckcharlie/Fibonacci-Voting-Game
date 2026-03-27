import React, { useState, useMemo } from 'react';
import { I18N, COLORS } from '../constants';
import { GameState, ResultData } from '../types';
import { generateSummaryReportAI } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { Trophy, FileText, Download, LayoutGrid, List, Sparkles, Eye, EyeOff, X } from 'lucide-react';

interface ResultsStepProps {
  state: GameState;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ResultsStep: React.FC<ResultsStepProps> = ({ state, showToast }) => {
  const [aiReport, setAiReport] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [viewMode, setViewMode] = useState<'ranking' | 'detail'>('ranking');
  const [showAiReport, setShowAiReport] = useState(false);

  const t = (key: keyof typeof I18N['en']) => I18N[state.language][key] || I18N['en'][key];

  const results = useMemo(() => {
    return state.options.map(opt => {
      const scores = state.participants
        .filter(p => state.submitted[p.id] && state.votes[p.id] && state.votes[p.id][opt.id])
        .map(p => state.votes[p.id][opt.id]);
      const total = scores.reduce((s, v) => s + v, 0);
      const mean = scores.length ? total / scores.length : 0;
      const sorted = [...scores].sort((a, b) => a - b);
      const median = scores.length ? (scores.length % 2 === 0
        ? (sorted[scores.length / 2 - 1] + sorted[scores.length / 2]) / 2
        : sorted[Math.floor(scores.length / 2)]) : 0;
      return { ...opt, scores, total, mean, median, count: scores.length };
    }).sort((a, b) => b.total - a.total);
  }, [state.options, state.participants, state.votes, state.submitted]);

  const totalVoters = Object.values(state.submitted).filter(Boolean).length;
  const hasVotes = totalVoters > 0;

  const handleGenerateReport = async () => {
    if (!hasVotes) return;
    setIsGeneratingReport(true);
    try {
      const report = await generateSummaryReportAI(state, results, state.language);
      setAiReport(report);
      setShowAiReport(true);
      showToast(state.language === 'zh' ? 'AI 報告已生成！' : 'AI report generated!', 'success');
    } catch (error) {
      showToast('AI Error', 'error');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const exportCSV = () => {
    const participants = state.participants.filter(p => state.submitted[p.id]);
    let csv = ['Participant', ...results.map(r => r.name), 'Total'].join(',') + '\n';
    participants.forEach(p => {
      const rowTotal = results.reduce((s, r) => s + (state.votes[p.id]?.[r.id] || 0), 0);
      csv += [state.anonymous ? 'Anonymous' : p.name, ...results.map(r => state.votes[p.id]?.[r.id] || 0), rowTotal].join(',') + '\n';
    });
    csv += ['Average', ...results.map(r => r.mean.toFixed(1)), ''].join(',') + '\n';
    csv += ['Total', ...results.map(r => r.total), ''].join(',') + '\n';
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fibonacci_votes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast(state.language === 'zh' ? 'CSV 已匯出！' : 'CSV exported!', 'success');
  };

  const exportTextReport = () => {
    const date = new Date().toLocaleString();
    let txt = `========================================\n`;
    txt += `${state.language === 'zh' ? '費波那契投票遊戲 結果報告' : 'FIBONACCI VOTING GAME – RESULTS REPORT'}\n`;
    txt += `${date}\n`;
    txt += `========================================\n\n`;
    txt += `--- ${state.language === 'zh' ? '排名' : 'RANKING'} ---\n`;
    results.forEach((r, i) => {
      txt += `${i + 1}. ${r.name}\n`;
      txt += `   ${t('total')}: ${r.total}  ${t('mean')}: ${r.mean.toFixed(1)}  ${t('median')}: ${r.median}  ${t('votes_count')}: ${r.count}\n`;
    });
    if (aiReport) {
      txt += `\n--- AI SUMMARY ---\n${aiReport}\n`;
    }
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fibonacci_report_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    showToast(state.language === 'zh' ? '報告已匯出！' : 'Report exported!', 'success');
  };

  if (!hasVotes) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">📊</div>
        <p className="text-text-muted text-lg">{t('no_votes_yet')}</p>
      </div>
    );
  }

  const maxTotal = results[0]?.total || 1;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { num: totalVoters, label: t('stat_voters'), color: 'var(--color-accent)' },
          { num: state.options.length, label: t('stat_options'), color: 'var(--color-accent3)' },
          { num: results.reduce((s, r) => s + r.count, 0), label: t('stat_votes'), color: '#34d399' },
          { num: results[0]?.total || 0, label: t('stat_top'), color: 'var(--color-gold)' },
        ].map((s, i) => (
          <div key={i} className="card text-center py-4">
            <div className="text-2xl font-black font-mono" style={{ color: s.color }}>{s.num}</div>
            <div className="text-[10px] text-text-muted mt-1 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex bg-surface2 rounded-lg p-1 border border-border">
          <button 
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${viewMode === 'ranking' ? 'bg-accent text-black' : 'text-text-dim hover:text-white'}`}
            onClick={() => setViewMode('ranking')}
          >
            <LayoutGrid size={14} /> {t('ranking_title')}
          </button>
          <button 
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${viewMode === 'detail' ? 'bg-accent text-black' : 'text-text-dim hover:text-white'}`}
            onClick={() => setViewMode('detail')}
          >
            <List size={14} /> {t('vote_detail')}
          </button>
        </div>
        
        <button 
          className="btn btn-ghost py-2 text-xs"
          onClick={handleGenerateReport}
          disabled={isGeneratingReport}
        >
          <Sparkles size={14} className={isGeneratingReport ? 'animate-spin' : ''} />
          {isGeneratingReport ? t('ai_generating') : t('ai_summary_report')}
        </button>
      </div>

      {/* AI Report Panel */}
      {showAiReport && aiReport && (
        <div className="card border-accent/30 bg-accent/5 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-bold text-accent font-mono uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} /> AI Summary Report
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="text-text-muted hover:text-white text-xs font-mono flex items-center gap-1 cursor-pointer"
                onClick={() => setShowAiReport(!showAiReport)}
              >
                {showAiReport ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button className="text-text-muted hover:text-white cursor-pointer" onClick={() => { setAiReport(''); setShowAiReport(false); }}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <textarea 
              className="form-input min-h-[300px] font-mono text-xs leading-relaxed bg-surface/50"
              value={aiReport}
              onChange={(e) => setAiReport(e.target.value)}
              placeholder="AI report content..."
            />
            
            <div className="p-4 bg-surface/30 rounded-lg border border-border/50">
              <div className="text-[10px] text-text-muted uppercase tracking-widest mb-2">Preview</div>
              <div className="prose prose-invert prose-sm max-w-none text-text-dim">
                <ReactMarkdown>{aiReport}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'ranking' ? (
        <div className="card">
          <div className="text-xs font-bold text-accent font-mono mb-6 uppercase tracking-wider flex items-center gap-2">
            <Trophy size={14} /> {t('ranking_title')}
            <div className="flex-1 h-px bg-border ml-2" />
          </div>
          <div className="space-y-3">
            {results.map((r, i) => (
              <div key={r.id} className={`relative overflow-hidden rounded-xl border border-border bg-surface2 p-3.5 flex items-center gap-4 group ${i === 0 ? 'border-gold/40 bg-gold/5' : ''}`}>
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-accent/5 transition-all duration-1000 ease-out" 
                  style={{ width: `${(r.total / maxTotal) * 100}%`, background: i === 0 ? 'rgba(251,191,36,0.08)' : 'rgba(0,212,255,0.05)' }} 
                />
                
                <div className={`w-8 text-center font-mono text-xl font-black shrink-0 z-10 ${i === 0 ? 'text-gold' : (i === 1 ? 'text-slate-400' : (i === 2 ? 'text-orange-400' : 'text-text-muted'))}`}>
                  {i === 0 ? '🏆' : (i + 1)}
                </div>
                
                <div className="flex-1 z-10">
                  <div className="text-sm font-bold">{r.name}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">{r.description || ''} · {r.count} {t('votes_count')}</div>
                  <div className="h-1.5 bg-surface rounded-full mt-2.5 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${(r.total / maxTotal) * 100}%`, background: COLORS[state.options.findIndex(o => o.id === r.id) % COLORS.length] }} 
                    />
                  </div>
                </div>
                
                <div className="text-right z-10 shrink-0">
                  <div className="text-xl font-black font-mono text-accent">{r.total}</div>
                  <div className="text-[9px] text-text-muted mt-0.5">avg {r.mean.toFixed(1)} · med {r.median}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="p-5 border-b border-border">
            <div className="text-xs font-bold text-accent font-mono uppercase tracking-wider flex items-center gap-2">
              <List size={14} /> {t('vote_detail')}
              <div className="flex-1 h-px bg-border ml-2" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface2/50">
                  <th className="px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider border-b border-border">{state.language === 'zh' ? '參與者' : 'Participant'}</th>
                  {results.map(r => (
                    <th key={r.id} className="px-4 py-3 text-[10px] font-mono text-accent uppercase tracking-wider border-b border-border text-center min-w-[100px]">{r.name.substring(0, 15)}</th>
                  ))}
                  <th className="px-4 py-3 text-[10px] font-mono text-gold uppercase tracking-wider border-b border-border text-center">{t('total')}</th>
                </tr>
              </thead>
              <tbody>
                {state.participants.filter(p => state.submitted[p.id]).map(p => {
                  const rowTotal = results.reduce((s, r) => s + (state.votes[p.id]?.[r.id] || 0), 0);
                  return (
                    <tr key={p.id} className="hover:bg-surface2/30 transition-colors">
                      <td className="px-4 py-3 text-xs font-semibold border-b border-border/50">{state.anonymous ? (state.language === 'zh' ? '匿名' : 'Anon') : p.name}</td>
                      {results.map(r => {
                        const score = state.votes[p.id]?.[r.id];
                        const optIndex = state.options.findIndex(o => o.id === r.id);
                        return (
                          <td key={r.id} className="px-4 py-3 text-center border-b border-border/50">
                            {score ? (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold font-mono" style={{ background: `${COLORS[optIndex % COLORS.length]}33`, color: COLORS[optIndex % COLORS.length] }}>
                                {score}
                              </span>
                            ) : (
                              <span className="text-text-muted">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center text-sm font-bold text-gold font-mono border-b border-border/50">{rowTotal}</td>
                    </tr>
                  );
                })}
                <tr className="bg-surface2/30">
                  <td className="px-4 py-4 text-xs font-bold text-accent uppercase">{t('total')} / {t('mean')}</td>
                  {results.map(r => (
                    <td key={r.id} className="px-4 py-4 text-center border-b border-border/50">
                      <div className="text-sm font-bold text-accent font-mono">{r.total}</div>
                      <div className="text-[9px] text-text-muted font-mono">avg {r.mean.toFixed(1)}</div>
                    </td>
                  ))}
                  <td className="px-4 py-4 border-b border-border/50"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Export Actions */}
      <div className="space-y-3">
        <div className="text-[11px] font-bold text-accent font-mono uppercase tracking-widest">{t('export_title')}</div>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex flex-col items-center gap-2 p-5 rounded-xl border border-border bg-surface2 hover:border-accent hover:bg-accent/5 transition-all cursor-pointer group" onClick={exportCSV}>
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📋</div>
            <div className="text-sm font-bold">CSV</div>
            <div className="text-[10px] text-text-muted">{t('csv_desc')}</div>
          </button>
          <button className="flex flex-col items-center gap-2 p-5 rounded-xl border border-border bg-surface2 hover:border-accent hover:bg-accent/5 transition-all cursor-pointer group" onClick={exportTextReport}>
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📄</div>
            <div className="text-sm font-bold">{t('report_label')}</div>
            <div className="text-[10px] text-text-muted">{t('report_desc')}</div>
          </button>
        </div>
      </div>
    </div>
  );
};
