import React, { useMemo, useState } from 'react';
import { User, Plus, X, Check, MessageSquare, MessageCircle, Search, Save, Activity, RotateCcw, ChevronDown, ExternalLink } from 'lucide-react';
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
    handleResetSLA: () => void;
}

const selectStyle = { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' };

export const ConsultantAssignment: React.FC<Props> = ({
    lead, consultores, selectedConsultor,
    isNewConsultor, setIsNewConsultor,
    novoConsultorNome, setNovoConsultorNome,
    tempLinks, setTempLinks,
    handleUpdateLead, handleAdicionarConsultor,
    handleSaveConsultorLinks, handleContactConsultantTeams, handleContactConsultantWA,
    handleResetSLA
}) => {
    const [showContactMenu, setShowContactMenu] = useState(false);
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

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);

    const filteredConsultores = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return sortedConsultores.filter(c => c.nome.toLowerCase().includes(q));
    }, [sortedConsultores, searchQuery]);

    const handleSelect = (c: Consultor) => {
        handleUpdateLead({ consultor: c.nome });
        setIsMenuOpen(false);
        setSearchQuery('');
        setFocusedIndex(-1);
    };

    const onKeyDownHandler = (e: React.KeyboardEvent) => {
        if (!isMenuOpen) {
            if (e.key === 'Enter' || e.key === 'ArrowDown') setIsMenuOpen(true);
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedIndex(prev => (prev + 1) % (filteredConsultores.length + 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedIndex(prev => (prev - 1 + filteredConsultores.length + 1) % (filteredConsultores.length + 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (focusedIndex >= 0 && focusedIndex < filteredConsultores.length) {
                handleSelect(filteredConsultores[focusedIndex]);
            } else if (focusedIndex === filteredConsultores.length) {
                setIsNewConsultor(true);
                setIsMenuOpen(false);
            }
        } else if (e.key === 'Escape') {
            setIsMenuOpen(false);
            setFocusedIndex(-1);
        }
    };

    return (
        <div className="glass-card p-3 lg:p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Seleção de Consultor */}
                <div className="flex-[2.5] flex items-center gap-3 min-w-0">
                    {!isNewConsultor ? (
                        <div className="relative flex-1 min-w-0">
                            <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors z-10 ${lead.consultor ? 'text-blue-400' : 'text-slate-600'}`} />
                            <select
                                className="w-full bg-[#0f172a] border border-blue-500/10 rounded-xl pl-11 pr-10 py-2.5 text-[12px] font-bold text-white outline-none transition-all appearance-none focus:border-blue-500/40 cursor-pointer shadow-inner"
                                style={selectStyle}
                                value={lead.consultor || ''}
                                onChange={(e) => handleUpdateLead({ consultor: e.target.value })}
                            >
                                <option value="">Selecionar Consultor...</option>
                                {sortedConsultores.map(c => (
                                    <option key={c.id || c.nome} value={c.nome}>{c.nome}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button
                                    onClick={() => setIsNewConsultor(true)}
                                    className="p-1.5 hover:bg-blue-500/10 rounded-lg text-blue-500/60 hover:text-blue-500 transition-all"
                                    title="Adicionar Novo"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-1 gap-1.5 min-w-0">
                            <input 
                                autoFocus
                                className="flex-1 bg-[#0f172a] border border-blue-500/30 rounded-xl px-4 py-1.5 text-[12px] font-bold text-white outline-none focus:border-blue-500/60 transition-all h-11 min-w-0 shadow-inner" 
                                placeholder="Nome do novo consultor..." 
                                value={novoConsultorNome} 
                                onChange={e => setNovoConsultorNome(e.target.value)} 
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAdicionarConsultor(); if (e.key === 'Escape') setIsNewConsultor(false); }} 
                            />
                            <button onClick={() => setIsNewConsultor(false)} className="h-11 px-3 bg-white/5 text-slate-400 rounded-xl shrink-0"><X size={16} /></button>
                            <button onClick={handleAdicionarConsultor} className="h-11 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all shrink-0"><Check size={16} /></button>
                        </div>
                    )}
                </div>

                {/* Health Indicator (SLA) - Integrated into the middle */}
                <div className="w-32 xl:w-40 flex flex-col justify-center shrink-0">
                    <div className="flex justify-between items-center mb-1.5 px-0.5">
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">SLA</span>
                            <button 
                                onClick={handleResetSLA}
                                title="Reiniciar SLA"
                                className="p-1 hover:bg-amber-500/10 rounded text-amber-500/50 hover:text-amber-500 transition-colors"
                            >
                                <RotateCcw size={10} />
                            </button>
                        </div>
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
                {/* Botão Unificado de Contato */}
                {selectedConsultor && (
                    <div className="relative shrink-0">
                        <button
                            onClick={() => setShowContactMenu(!showContactMenu)}
                            className={`h-11 px-6 rounded-xl flex items-center gap-3 transition-all border font-black text-[10px] uppercase tracking-widest shadow-lg ${showContactMenu ? 'bg-blue-600 text-white border-blue-400' : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'}`}
                        >
                            <MessageCircle size={16} />
                            Contato
                            <ChevronDown size={14} className={`transition-transform duration-200 ${showContactMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {showContactMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowContactMenu(false)} />
                                <div className="absolute right-0 top-full mt-3 w-72 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Consultor · {selectedConsultor.nome.split(' ')[0]}</span>
                                    </div>

                                    {/* Sub-menu WhatsApp */}
                                    <div className="p-1">
                                        {selectedConsultor.whatsapp ? (
                                            <button
                                                onClick={() => { handleContactConsultantWA(); setShowContactMenu(false); }}
                                                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 transition-all group"
                                            >
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                                    <MessageCircle size={14} className="text-emerald-400" />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className="text-[11px] font-bold">WhatsApp</div>
                                                    <div className="text-[9px] text-slate-500">Enviar mensagem rápida</div>
                                                </div>
                                                <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-all" />
                                            </button>
                                        ) : (
                                            <div className="p-2 space-y-1">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-amber-500/60 px-1">WhatsApp Faltando</span>
                                                <div className="flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/10 p-1.5 rounded-xl">
                                                    <input 
                                                        className="flex-1 bg-transparent text-[11px] text-amber-200 placeholder:text-amber-500/30 outline-none px-2 h-8" 
                                                        placeholder="(00) 00000-0000" 
                                                        value={tempLinks.whatsapp} 
                                                        onChange={e => setTempLinks({ ...tempLinks, whatsapp: formatPhone(e.target.value) })} 
                                                    />
                                                    <button onClick={handleSaveConsultorLinks} className="p-2 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500 hover:text-black transition-all"><Save size={12} /></button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sub-menu Teams */}
                                    <div className="p-1 border-t border-white/5 mt-1">
                                        {selectedConsultor.teams_link ? (
                                            <button
                                                onClick={() => { handleContactConsultantTeams(); setShowContactMenu(false); }}
                                                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-indigo-500/10 text-slate-300 hover:text-indigo-400 transition-all group"
                                            >
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                                                    <MessageSquare size={14} className="text-indigo-400" />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className="text-[11px] font-bold">Microsoft Teams</div>
                                                    <div className="text-[9px] text-slate-500">Abrir chat corporativo</div>
                                                </div>
                                                <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-all" />
                                            </button>
                                        ) : (
                                            <div className="p-2 space-y-1">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-amber-500/60 px-1">Link Teams Faltando</span>
                                                <div className="flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/10 p-1.5 rounded-xl">
                                                    <input 
                                                        className="flex-1 bg-transparent text-[11px] text-amber-200 placeholder:text-amber-500/30 outline-none px-2 h-8" 
                                                        placeholder="https://teams.microsoft.com/..." 
                                                        value={tempLinks.teams_link} 
                                                        onChange={e => setTempLinks({ ...tempLinks, teams_link: e.target.value })} 
                                                    />
                                                    <button onClick={handleSaveConsultorLinks} className="p-2 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500 hover:text-black transition-all"><Save size={12} /></button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};