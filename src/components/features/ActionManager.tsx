import React from 'react';
import { Activity, AlertCircle } from 'lucide-react';
import { Lead, STAGES } from '../../types';
import { SectionTitle } from '../ui/SectionTitle';
import { Field } from '../ui/Field';

interface Props {
    lead: Lead;
    handleUpdateLead: (updates: Partial<Lead>) => void;
    acoesDisponiveis: string[];
}

const inputCls = "w-full bg-transparent border-b border-white/[0.08] px-0 py-3 text-slate-100 text-[13px] outline-none focus:border-blue-500/60 transition-colors font-medium placeholder:text-slate-600 rounded-none";
const selectCls = "w-full cursor-pointer appearance-none bg-[#0d1526] border border-white/[0.10] rounded-xl px-4 py-3 pr-10 text-slate-100 text-[13px] font-medium outline-none focus:border-blue-500/60 transition-colors";
const selectStyle = { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' };

export const ActionManager: React.FC<Props> = ({ lead, handleUpdateLead, acoesDisponiveis }) => {
    return (
        <>
            {/* ESTÁGIO E AÇÕES */}
            <div className="glass-card p-7">
                <SectionTitle icon={Activity} title="Status & Ação Direta" />
                <div className="flex flex-wrap gap-2 mb-7">
                    {STAGES.map(s => (
                        <button key={s} onClick={() => handleUpdateLead({ status: s })}
                            className="text-[10px] px-4 py-2.5 rounded-xl font-black uppercase tracking-wider transition-all"
                            style={lead.status === s
                                ? { background: 'rgba(37,99,235,0.75)', color: 'white', boxShadow: '0 0 16px rgba(37,99,235,0.35)', border: '1px solid rgba(99,179,237,0.30)', transform: 'scale(1.04)' }
                                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }
                            }>
                            {s}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-8">
                    <div className="col-span-2 md:col-span-1">
                        <Field label="Ação Imediata">
                            <select className={`${selectCls} ${acoesDisponiveis.length === 0 ? 'opacity-50' : 'text-emerald-400'}`} style={selectStyle} value={lead.acao || ''} onChange={e => handleUpdateLead({ acao: e.target.value })} disabled={acoesDisponiveis.length === 0}>
                                <option value="">{acoesDisponiveis.length === 0 ? 'Altere o status...' : 'Selecione...'}</option>
                                {acoesDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </Field>
                    </div>
                    {lead.acao === 'Agendado' && (
                        <div className="col-span-2 md:col-span-1 animate-in fade-in">
                            <Field label="Data Limite"><input type="date" className={`${inputCls} bg-[#0B1121] font-mono text-blue-400 p-4 rounded-xl border border-slate-800`} value={lead.dataAcao || ''} onChange={e => handleUpdateLead({ dataAcao: e.target.value })} /></Field>
                        </div>
                    )}
                </div>
            </div>

            {/* DIAGNÓSTICO DE PERDA */}
            {lead.status === 'Perdido' && (
                <div className="glass-card p-7" style={{ background: 'rgba(244,63,94,0.06)', borderColor: 'rgba(244,63,94,0.20)' }}>
                    <SectionTitle icon={AlertCircle} title="Diagnóstico de Perda" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        {['Cliente não aceitou a proposta', 'Cliente parou de responder', 'Consultor não agendou fechamento', 'Recusa Médica'].map(m => (
                            <button key={m} onClick={() => handleUpdateLead({ motivoPerda: m })} className={`text-[11px] font-bold p-4 rounded-xl border text-left transition-all ${lead.motivoPerda === m ? 'border-rose-500 bg-rose-500/10 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'border-rose-900/30 text-slate-500 hover:border-rose-500/50 hover:bg-[#0B1121]'}`}>{m}</button>
                        ))}
                    </div>
                    <Field label="Detalhes da Objeção"><textarea className={`${inputCls} min-h-[80px] bg-[#0B1121] p-4 rounded-xl border border-rose-500/20 text-rose-300`} value={lead.motivoPerda || ''} onChange={e => handleUpdateLead({ motivoPerda: e.target.value })} /></Field>
                </div>
            )}
        </>
    );
};
