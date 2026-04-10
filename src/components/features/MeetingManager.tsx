import React from 'react';
import { Calendar, History, Plus, MessageCircle, AlertCircle } from 'lucide-react';
import { Lead, Reuniao } from '../../types';
import { SectionTitle } from '../ui/SectionTitle';
import { Field } from '../ui/Field';

interface Props {
    lead: Lead;
    novaReuniao: Partial<Reuniao> | null;
    setNovaReuniao: (val: Partial<Reuniao> | null) => void;
    handlePautaChange: (pauta: string) => void;
    handleSalvarReuniao: () => void;
    getDynamicSnippets: (pauta: string) => { conf: string, rem: string };
}

const inputCls = "w-full bg-transparent border-b border-white/[0.08] px-0 py-3 text-slate-100 text-[13px] outline-none focus:border-blue-500/60 transition-colors font-medium placeholder:text-slate-600 rounded-none";
const selectCls = "w-full cursor-pointer appearance-none bg-[#0d1526] border border-white/[0.10] rounded-xl px-4 py-3 pr-10 text-slate-100 text-[13px] font-medium outline-none focus:border-blue-500/60 transition-colors";
const selectStyle = { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' };

export const MeetingManager: React.FC<Props> = ({
    lead, novaReuniao, setNovaReuniao,
    handlePautaChange, handleSalvarReuniao, getDynamicSnippets
}) => {
    return (
        <>
            {/* REUNIÕES E FUP */}
            <div className="glass-card p-7">
                <SectionTitle icon={Calendar} title="Registro de Encontros & Follow-up" />
                <div className="mb-8">
                    {!novaReuniao && <button onClick={() => setNovaReuniao({ status: 'Agendada' })} className="px-6 py-4 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"><Plus size={16} /> Novo Registro</button>}
                </div>

                {novaReuniao && (
                    <div className="p-7 rounded-2xl mb-8 animate-in" style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.22)', boxShadow: '0 0 30px rgba(37,99,235,0.10)' }}>
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div className="col-span-2">
                                <Field label="Pauta Estratégica">
                                    <select className={selectCls} style={selectStyle} value={novaReuniao.titulo || ''} onChange={e => handlePautaChange(e.target.value)}>
                                        <option value="">Selecione...</option><option value="Contato Consultor (7 dias)">Contato Consultor (7 dias)</option><option value="FUP - Planejamento (7 dias)">FUP - Planejamento (7 dias)</option><option value="FUP - Fechamento (7 dias)">FUP - Fechamento (7 dias)</option><option value="FUP - Pendências (7 dias)">FUP - Pendências (7 dias)</option>
                                    </select>
                                </Field>
                            </div>
                            <Field label="Data"><input type="date" className={`${inputCls} bg-[#111827] font-mono p-4 rounded-xl border border-slate-700`} onChange={e => setNovaReuniao({ ...novaReuniao, data: e.target.value })} value={novaReuniao.data || ''} /></Field>
                            <Field label="Status">
                                <select className={selectCls} style={selectStyle} value={novaReuniao.status} onChange={e => setNovaReuniao({ ...novaReuniao, status: e.target.value as Reuniao['status'] })}>
                                    <option value="Agendada">Agendada</option><option value="Realizada">Realizada</option><option value="Remarcada">Remarcada</option><option value="No-Show">No-Show</option>
                                </select>
                            </Field>
                            <div className="col-span-2">
                                <Field label="Anotações / Acordos"><textarea className={`${inputCls} min-h-[100px] bg-[#111827] p-4 rounded-xl border border-slate-700`} onChange={e => setNovaReuniao({ ...novaReuniao, anotacoes: e.target.value })} value={novaReuniao.anotacoes || ''} /></Field>
                                <div className="flex flex-wrap gap-3 mt-4">
                                    <button onClick={() => setNovaReuniao({ ...novaReuniao, anotacoes: (novaReuniao.anotacoes || '') + getDynamicSnippets(novaReuniao.titulo || '').conf })} className="text-[9px] bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20 text-emerald-400 uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-colors flex items-center gap-2"><MessageCircle size={12} /> Confirmação</button>
                                    <button onClick={() => setNovaReuniao({ ...novaReuniao, anotacoes: (novaReuniao.anotacoes || '') + getDynamicSnippets(novaReuniao.titulo || '').rem })} className="text-[9px] bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20 text-amber-400 uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-colors flex items-center gap-2"><AlertCircle size={12} /> Remarcação</button>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 justify-end pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <button onClick={() => setNovaReuniao(null)} className="px-6 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">Descartar</button>
                            <button onClick={handleSalvarReuniao} className="bg-blue-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]">Gravar Log</button>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {(Array.isArray(lead.reunioes) ? lead.reunioes : []).map((r, i) => {
                        const dotColor = r.status === 'Realizada' ? '#10b981' : r.status === 'No-Show' ? '#f43f5e' : '#3b82f6';
                        const dotGlow = r.status === 'Realizada' ? 'rgba(16,185,129,0.8)' : r.status === 'No-Show' ? 'rgba(244,63,94,0.8)' : 'rgba(59,130,246,0.8)';
                        const badgeStyle = r.status === 'Realizada'
                            ? { background: 'rgba(16,185,129,0.10)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.22)' }
                            : r.status === 'No-Show'
                                ? { background: 'rgba(244,63,94,0.10)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.22)' }
                                : { background: 'rgba(37,99,235,0.10)', color: '#93c5fd', border: '1px solid rgba(37,99,235,0.22)' };
                        return (
                            <div key={i} className="pl-5 py-4 relative pr-5 rounded-r-2xl" style={{ background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${dotColor}`, border: '1px solid rgba(255,255,255,0.06)', borderLeftColor: dotColor }}>
                                <span className="w-2.5 h-2.5 rounded-full absolute -left-[7px] top-5" style={{ background: dotColor, boxShadow: `0 0 10px ${dotGlow}` }} />
                                <div className="flex items-center gap-3 mb-1.5">
                                    <h4 className="text-[13px] font-bold text-white">{r.titulo}</h4>
                                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded" style={badgeStyle}>{r.status}</span>
                                </div>
                                <p className="text-[10px] font-mono mb-2" style={{ color: '#475569' }}>{r.data}</p>
                                {r.anotacoes && <p className="text-[12px] leading-relaxed p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#cbd5e1' }}>{r.anotacoes}</p>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* HISTÓRICO CRM */}
            <div className="glass-card p-7">
                <SectionTitle icon={History} title="Traceability Log" subtitle="Auditoria de Movimentação" />
                <div className="space-y-2 mt-4 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                    {(Array.isArray(lead.historico) ? lead.historico : []).map((log, i) => (
                        <div key={i} className="text-[10px] px-4 py-3 rounded-xl font-mono"
                            style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '2px solid rgba(99,102,241,0.40)', color: '#64748b' }}>
                            {String(log)}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};
