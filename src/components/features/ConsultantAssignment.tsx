import React, { useMemo } from 'react';
import { User, Plus, X, Check, MessageSquare, MessageCircle, Search, Save, Activity } from 'lucide-react';
import { Lead, Consultor, STAGE_SLAS } from '../../types';
import { formatPhone, getCadenceFlow } from '../../utils/helpers';
import { SectionTitle } from '../ui/SectionTitle';

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

const selectStyle = { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' };

export const ConsultantAssignment: React.FC<Props> = ({
    lead, consultores, selectedConsultor,
    isNewConsultor, setIsNewConsultor,
    novoConsultorNome, setNovoConsultorNome,
    tempLinks, setTempLinks,
    handleUpdateLead, handleAdicionarConsultor,
    handleSaveConsultorLinks, handleContactConsultantTeams, handleContactConsultantWA
}) => {
    // Estado para busca regex na seleção


    // Ordenar consultores alfabeticamente
    const sortedConsultores = useMemo(() => {
        return [...consultores]
            .filter(c => c.ativo)
            .sort((a, b) => a.nome.localeCompare(b.nome));
    }, [consultores]);


    const cadence = getCadenceFlow(lead);
    const slaTarget = STAGE_SLAS[lead.status] || 1;
    const slaProgress = Math.min(100, (cadence.days / slaTarget) * 100);

    return (
        <div className="glass-card p-3 lg:p-4">
            <div className="flex items-center gap-4">
                {/* Seleção de Consultor com Busca */}
                <div className="flex-[2.5] flex items-center gap-3 min-w-0">
                    {!isNewConsultor ? (
                        <>
                        <div className="relative flex-1 min-w-0">
                            <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${lead.consultor ? 'text-blue-400' : 'text-slate-600'}`} />
                            <select 
                                className="w-full pl-10 h-11 cursor-pointer appearance-none bg-[#0f172a] border border-blue-500/10 rounded-xl text-[12px] font-bold text-white outline-none transition-all hover:border-blue-500/20 shadow-inner"
                                style={selectStyle} 
                                value={lead.consultor || ''} 
                                onChange={(e) => {
                                    if (e.target.value === 'ADICIONAR_NOVO') {
                                        setIsNewConsultor(true);
                                    } else {
                                        handleUpdateLead({ consultor: e.target.value });
                                    }
                                }}
                            >
                                <option value="" className="bg-[#0f172a]">Selecionar Consultor...</option>
                                {sortedConsultores.map(c => <option key={c.id || c.nome} value={c.nome} className="bg-[#0f172a] py-2">{c.nome}</option>)}
                                <option value="ADICIONAR_NOVO" className="bg-blue-900/50 text-blue-300 font-black">+ ADICIONAR NOVO CONSULTOR</option>
                            </select>
                        </div>

                        </>
                    ) : (
                        <div className="flex flex-1 gap-1.5 min-w-0">
                            <input 
                                autoFocus
                                className="flex-1 bg-[#0f172a] border border-blue-500/30 rounded-xl px-4 py-1.5 text-[12px] font-bold text-white outline-none focus:border-blue-500/60 transition-all h-11 min-w-0 shadow-inner" 
                                placeholder="Nome do novo consultor..." 
                                value={novoConsultorNome} 
                                onChange={e => setNovoConsultorNome(e.target.value)} 
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAdicionarConsultor(); }} 
                            />
                            <button onClick={() => setIsNewConsultor(false)} className="h-11 px-3 bg-white/5 text-slate-400 rounded-xl shrink-0"><X size={16} /></button>
                            <button onClick={handleAdicionarConsultor} className="h-11 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all shrink-0"><Check size={16} /></button>
                        </div>
                    )}
                </div>

                {/* Health Indicator (SLA) - Integrated into the middle */}
                <div className="w-32 xl:w-40 flex flex-col justify-center shrink-0">
                    <div className="flex justify-between items-center mb-1.5 px-0.5">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">SLA</span>
                        <span className={`text-[9px] font-black ${cadence.isDelayed ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {cadence.days}d / {slaTarget}d
                        </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/[0.03]">
                        <div 
                            className={`h-full transition-all duration-700 ${cadence.isDelayed ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.2)]'}`}
                            style={{ width: `${slaProgress}%` }}
                        />
                    </div>
                </div>

                {/* Ações Rápidas de Contato (Consultor) */}
                {selectedConsultor && (
                    <div className="flex items-center gap-3 shrink-0">
                        {/* WhatsApp Consultor */}
                        <div className="flex items-center gap-1.5">
                            {selectedConsultor.whatsapp ? (
                                <button 
                                    onClick={handleContactConsultantWA} 
                                    className="h-11 px-5 rounded-xl flex items-center gap-2.5 transition-all bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                    title="Chamar Consultor via WhatsApp"
                                >
                                    <MessageCircle size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">WhatsApp</span>
                                </button>
                            ) : (
                                <div className="flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/10 p-1.5 rounded-xl">
                                    <input className="w-24 bg-transparent text-[10px] text-amber-200 placeholder:text-amber-500/40 outline-none px-1 h-8" placeholder="Phone..." value={tempLinks.whatsapp} onChange={e => setTempLinks({ ...tempLinks, whatsapp: formatPhone(e.target.value) })} />
                                    <button onClick={handleSaveConsultorLinks} className="p-2 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500 hover:text-black transition-all"><Save size={12} /></button>
                                </div>
                            )}
                        </div>

                        {/* Teams Consultor */}
                        <div className="flex items-center gap-1.5">
                            {selectedConsultor.teams_link ? (
                                <button 
                                    onClick={handleContactConsultantTeams} 
                                    className="h-11 px-5 rounded-xl flex items-center gap-2.5 transition-all bg-indigo-500/10 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 hover:shadow-[0_0_15px_rgba(79,70,229,0.2)]"
                                    title="Chamar Consultor via Teams"
                                >
                                    <MessageSquare size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Teams</span>
                                </button>
                            ) : (
                                <div className="flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/10 p-1.5 rounded-xl">
                                    <input className="w-24 bg-transparent text-[10px] text-amber-200 placeholder:text-amber-500/40 outline-none px-1 h-8" placeholder="Teams..." value={tempLinks.teams_link} onChange={e => setTempLinks({ ...tempLinks, teams_link: e.target.value })} />
                                    <button onClick={handleSaveConsultorLinks} className="p-2 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500 hover:text-black transition-all"><Save size={12} /></button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};