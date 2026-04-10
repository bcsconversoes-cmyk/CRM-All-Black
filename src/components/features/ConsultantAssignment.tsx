import React from 'react';
import { User, Plus, X, Check, MessageSquare, MessageCircle } from 'lucide-react';
import { Lead, Consultor } from '../../types';
import { formatPhone } from '../../utils/helpers';
import { SectionTitle } from '../ui/SectionTitle';
import { Field } from '../ui/Field';

interface Props {
    lead: Lead;
    consultores: Consultor[];
    selectedConsultor?: Consultor;
    isNewConsultor: boolean;
    setIsNewConsultor: (val: boolean) => void;
    novoConsultorNome: string;
    setNovoConsultorNome: (val: string) => void;
    tempLinks: { whatsapp: string, teams_link: string };
    setTempLinks: (val: { whatsapp: string, teams_link: string }) => void;
    handleUpdateLead: (updates: Partial<Lead>) => void;
    handleAdicionarConsultor: () => void;
    handleSaveConsultorLinks: () => void;
    handleContactConsultantTeams: () => void;
    handleContactConsultantWA: () => void;
}

const inputCls = "w-full bg-transparent border-b border-white/[0.08] px-0 py-3 text-slate-100 text-[13px] outline-none focus:border-blue-500/60 transition-colors font-medium placeholder:text-slate-600 rounded-none";
const selectCls = "w-full cursor-pointer appearance-none bg-[#0d1526] border border-white/[0.10] rounded-xl px-4 py-3 pr-10 text-slate-100 text-[13px] font-medium outline-none focus:border-blue-500/60 transition-colors";
const selectStyle = { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' };

export const ConsultantAssignment: React.FC<Props> = ({
    lead, consultores, selectedConsultor,
    isNewConsultor, setIsNewConsultor,
    novoConsultorNome, setNovoConsultorNome,
    tempLinks, setTempLinks,
    handleUpdateLead, handleAdicionarConsultor,
    handleSaveConsultorLinks, handleContactConsultantTeams, handleContactConsultantWA
}) => {
    return (
        <div className="glass-card p-7">
            <SectionTitle icon={User} title="Consultor Responsável & Alinhamento" />
            <div className="mb-8">
                <Field label="Selecione o Consultor Dono do Lead">
                    <div className="flex gap-4">
                        {!isNewConsultor ? (
                            <>
                                <select className={selectCls} style={selectStyle} value={lead.consultor || ''} onChange={(e) => handleUpdateLead({ consultor: e.target.value })}>
                                    <option value="">Atribuir Consultor...</option>
                                    {consultores.map(c => <option key={c.id || c.nome} value={c.nome}>{c.nome}</option>)}
                                </select>
                                <button onClick={() => setIsNewConsultor(true)} className="px-5 bg-[#0B1121] border border-slate-800 rounded-xl hover:bg-slate-800 text-slate-300 transition-colors"><Plus size={18} /></button>
                            </>
                        ) : (
                            <div className="flex flex-1 gap-4">
                                <input className={`${inputCls} bg-[#0B1121] py-3 rounded-xl px-4 border border-slate-800`} placeholder="Nome do consultor..." value={novoConsultorNome} onChange={e => setNovoConsultorNome(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAdicionarConsultor(); }} />
                                <button onClick={() => setIsNewConsultor(false)} className="px-5 bg-[#0B1121] text-slate-500 rounded-xl hover:text-white transition-colors"><X size={18} /></button>
                                <button onClick={handleAdicionarConsultor} className="px-5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors"><Check size={18} /></button>
                            </div>
                        )}
                    </div>
                </Field>
            </div>

            {selectedConsultor && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 items-end" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

                    <div className="flex flex-col h-14 justify-end">
                        {selectedConsultor.teams_link ? (
                            <button onClick={handleContactConsultantTeams} className="h-full w-full rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all bg-indigo-500/10 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                                <MessageSquare size={16} /> Cobrar via Teams
                            </button>
                        ) : (
                            <div className="h-full flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                                <input className="flex-1 bg-transparent text-[11px] text-amber-100 placeholder:text-amber-500/50 outline-none px-3 font-medium" placeholder="Cole o link do Teams..." value={tempLinks.teams_link} onChange={e => setTempLinks({ ...tempLinks, teams_link: e.target.value })} />
                                <button onClick={handleSaveConsultorLinks} className="px-4 py-2 bg-amber-500/20 text-amber-400 font-black uppercase text-[9px] tracking-wider rounded-lg hover:bg-amber-500 hover:text-[#01040A] transition-colors">Salvar</button>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col h-14 justify-end">
                        {selectedConsultor.whatsapp ? (
                            <button onClick={handleContactConsultantWA} className="h-full w-full rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all bg-emerald-500/10 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                <MessageCircle size={16} /> Cobrar via WhatsApp
                            </button>
                        ) : (
                            <div className="h-full flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                                <input className="flex-1 bg-transparent font-mono text-[11px] text-amber-100 placeholder:text-amber-500/50 outline-none px-3" placeholder="(00) 00000-0000" value={tempLinks.whatsapp} onChange={e => setTempLinks({ ...tempLinks, whatsapp: formatPhone(e.target.value) })} />
                                <button onClick={handleSaveConsultorLinks} className="px-4 py-2 bg-amber-500/20 text-amber-400 font-black uppercase text-[9px] tracking-wider rounded-lg hover:bg-amber-500 hover:text-[#01040A] transition-colors">Salvar</button>
                            </div>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}