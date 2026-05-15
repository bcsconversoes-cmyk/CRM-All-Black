import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, ChevronDown, Calendar, MessageCircle, MessageSquare, X } from 'lucide-react';
import { Consultor, Lead, STAGES } from '../../types';
import { formatDate, parseDateInput, getWhatsAppLink, getConsultantWhatsAppMessage, getClientWhatsAppMessage } from '../../utils/helpers';

export const WORKFLOW_ACTIONS: Record<string, string[]> = {
    Lead: ['Chamar Consultor', 'Aguardando informações'],
    Planejamento: ['Aguardando agendamento', 'Agendado'],
    Fechamento: ['Aguardando agendamento', 'Agendado', 'Reagendar'],
    'Follow-up': ['Agendar', 'Agendado', 'Ajustando', 'Aguardando assinatura', 'Aguardando pagamento'],
    'Em análise': ['Aguardando documentação', 'Aguardando seguradora'],
    'Em Análise': ['Aguardando documentação', 'Aguardando seguradora'],
    'Em AnÃ¡lise': ['Aguardando documentação', 'Aguardando seguradora'],
    Ganho: ['Enviar apólices', 'Criar lead', 'Concluído'],
    Perdido: [],
    Cancelou: [],
};

interface Props {
    lead: Lead;
    consultores?: Consultor[];
    handleUpdateLead: (updates: Partial<Lead>) => void;
    acoesDisponiveis?: string[];
    handleResetSLA: () => void;
    consultorWhatsapp?: string;
    consultorTeamsLink?: string;
    handleOpenNewConsultorModal?: () => void;
}

const inputBase = 'w-full bg-[#0d1526] border border-white/[0.05] rounded-lg px-4 py-3 text-[13px] text-white outline-none focus:border-blue-500/50 transition-all font-semibold placeholder:text-slate-700';

export const ActionManager: React.FC<Props> = ({
    lead,
    consultores = [],
    handleUpdateLead,
    handleOpenNewConsultorModal,
}) => {
    const NEW_CONSULTOR_VALUE = '__novo_consultor__';
    const [showContactModal, setShowContactModal] = useState(false);
    const [contactTarget, setContactTarget] = useState<'root' | 'consultor'>('root');

    const consultorSelecionado = useMemo(
        () => consultores.find(c => (c.nome || '').trim().toLowerCase() === (lead.consultor || '').trim().toLowerCase()),
        [consultores, lead.consultor]
    );

    const consultoresOrdenados = useMemo(
        () => [...consultores].filter(c => c.ativo !== false).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
        [consultores]
    );

    const acoes = WORKFLOW_ACTIONS[lead.status] ?? [];

    useEffect(() => {
        if (acoes.length > 0 && !acoes.includes(lead.acao || '')) handleUpdateLead({ acao: acoes[0] });
        if (acoes.length === 0 && lead.acao) handleUpdateLead({ acao: '' });
    }, [lead.status]); // eslint-disable-line react-hooks/exhaustive-deps

    const actionToneClass = useMemo(() => {
        const a = (lead.acao || '').toLowerCase();
        if (a.includes('aguardando')) return 'text-amber-500';
        if (a === 'agendado' || a === 'concluído' || a === 'agendar') return 'text-emerald-500';
        return 'text-slate-200';
    }, [lead.acao]);

    const handleContactCliente = () => {
        if (!lead.celular) return;
        const msg = getClientWhatsAppMessage(lead);
        window.open(getWhatsAppLink(lead.celular, msg), '_blank');
        setShowContactModal(false);
    };

    const handleContactConsultorWA = () => {
        if (!consultorSelecionado?.whatsapp) return;
        const msg = getConsultantWhatsAppMessage(lead);
        window.open(getWhatsAppLink(consultorSelecionado.whatsapp, msg), '_blank');
        setShowContactModal(false);
    };

    const handleContactConsultorTeams = () => {
        if (!consultorSelecionado?.teams_link) return;
        const msg = getConsultantWhatsAppMessage(lead);
        navigator.clipboard.writeText(msg).catch(() => undefined);
        window.open(consultorSelecionado.teams_link, '_blank');
        setShowContactModal(false);
    };

    return (
        <>
            <div className="bg-[#0a1120] border border-white/[0.05] rounded-2xl p-5 shadow-2xl">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <Activity size={16} className="text-blue-400" />
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-white">Funil</h3>
                </div>

                <div className="grid grid-cols-8 gap-0 mb-5 rounded-xl border border-white/10 overflow-hidden bg-[#050a14]">
                    {STAGES.map(s => {
                        const isActive = lead.status === s;
                        return (
                            <button
                                key={s}
                                onClick={() => handleUpdateLead({ status: s })}
                                className={`py-3 px-1 text-[10px] font-black uppercase tracking-tight transition-all border-r border-white/10 last:border-r-0 ${
                                    isActive
                                        ? 'bg-blue-600/20 text-blue-200 shadow-[inset_0_0_0_1px_rgba(96,165,250,0.55)]'
                                        : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {s}
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Ação</label>
                        <div className="relative group">
                            <select
                                className={`${inputBase} appearance-none cursor-pointer ${actionToneClass}`}
                                value={lead.acao || ''}
                                onChange={e => handleUpdateLead({ acao: e.target.value })}
                                disabled={acoes.length === 0}
                            >
                                <option value="" className="bg-[#0a1120] text-slate-400">{acoes.length === 0 ? 'Status Inativo' : 'Selecionar Ação'}</option>
                                {acoes.map(a => (
                                    <option key={a} value={a} className="bg-[#0a1120] text-slate-100">{a}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none group-hover:text-blue-400 transition-colors" size={14} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Data Agendada</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="DD/MM/AAAA"
                                className={`${inputBase} text-emerald-400`}
                                value={lead.dataAcao ? formatDate(lead.dataAcao) : ''}
                                onChange={e => handleUpdateLead({ dataAcao: parseDateInput(e.target.value) })}
                            />
                            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Consultor</label>
                        <div className="relative group">
                            <select
                                className={`${inputBase} appearance-none cursor-pointer text-slate-100`}
                                value={lead.consultor || NEW_CONSULTOR_VALUE}
                                onChange={e => {
                                    if (e.target.value === NEW_CONSULTOR_VALUE) {
                                        handleOpenNewConsultorModal?.();
                                        return;
                                    }
                                    handleUpdateLead({ consultor: e.target.value });
                                }}
                            >
                                <option value={NEW_CONSULTOR_VALUE} className="bg-[#0a1120]">Novo Consultor</option>
                                {consultoresOrdenados.map(c => (
                                    <option key={String(c.id || c.nome)} value={c.nome} className="bg-[#0a1120]">{c.nome}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none group-hover:text-blue-400 transition-colors" size={14} />
                        </div>
                    </div>

                    <div className="pb-0.5">
                        <button
                            onClick={() => {
                                setContactTarget('root');
                                setShowContactModal(true);
                            }}
                            className="h-[46px] w-[46px] rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20 transition-all inline-flex items-center justify-center"
                            title="Contato"
                        >
                            <MessageCircle size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {showContactModal && (
                <div className="fixed inset-0 z-[220] flex items-center justify-center" style={{ background: 'rgba(2,6,15,0.72)', backdropFilter: 'blur(12px)' }} onClick={() => setShowContactModal(false)}>
                    <div className="w-full max-w-sm p-4 rounded-2xl" style={{ background: 'rgba(10,17,32,0.85)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(26px)', boxShadow: '0 20px 60px rgba(0,0,0,0.55)' }} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-white">Contato</h4>
                            <button onClick={() => setShowContactModal(false)} className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors inline-flex items-center justify-center">
                                <X size={13} />
                            </button>
                        </div>

                        {contactTarget === 'root' && (
                            <div className="space-y-2">
                                <button onClick={handleContactCliente} disabled={!lead.celular} className={`w-full px-3 py-2.5 rounded-xl border text-left text-[12px] font-bold transition-all ${lead.celular ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20' : 'bg-white/5 border-white/10 text-slate-600 cursor-not-allowed'}`}>
                                    Cliente · WhatsApp
                                </button>
                                <button onClick={() => setContactTarget('consultor')} className="w-full px-3 py-2.5 rounded-xl border text-left text-[12px] font-bold bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20 transition-all">
                                    Consultor
                                </button>
                            </div>
                        )}

                        {contactTarget === 'consultor' && (
                            <div className="space-y-2">
                                <button onClick={handleContactConsultorWA} disabled={!consultorSelecionado?.whatsapp} className={`w-full px-3 py-2.5 rounded-xl border text-left text-[12px] font-bold transition-all ${consultorSelecionado?.whatsapp ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20' : 'bg-white/5 border-white/10 text-slate-600 cursor-not-allowed'}`}>
                                    WhatsApp
                                </button>
                                <button onClick={handleContactConsultorTeams} disabled={!consultorSelecionado?.teams_link} className={`w-full px-3 py-2.5 rounded-xl border text-left text-[12px] font-bold transition-all ${consultorSelecionado?.teams_link ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20' : 'bg-white/5 border-white/10 text-slate-600 cursor-not-allowed'}`}>
                                    Teams
                                </button>
                                <button onClick={() => setContactTarget('root')} className="w-full px-3 py-2 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 transition-colors">
                                    Voltar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {lead.status === 'Perdido' && (
                <div className="bg-[#1a0b12] border border-rose-500/20 rounded-2xl p-6 animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="text-rose-500" size={18} />
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-rose-200">Motivo da Perda</h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {['Cliente não aceitou a proposta', 'Cliente parou de responder', 'Consultor não agendou fechamento', 'Recusa Médica'].map(m => (
                            <button
                                key={m}
                                onClick={() => handleUpdateLead({ motivoPerda: m })}
                                className={`py-3 rounded-lg text-[10px] font-bold transition-all border ${
                                    lead.motivoPerda === m
                                        ? 'bg-rose-500/20 border-rose-500 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                                        : 'bg-black/20 border-transparent text-rose-900/60 hover:text-rose-400'
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};
