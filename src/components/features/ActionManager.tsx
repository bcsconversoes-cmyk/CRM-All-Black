import React, { useState, useEffect, useMemo } from 'react';
import { Activity, AlertCircle, MessageCircle, Send, ChevronDown, RotateCcw, User, ExternalLink } from 'lucide-react';

import { Lead, STAGES } from '../../types';
import { SectionTitle } from '../ui/SectionTitle';
import { Field } from '../ui/Field';
import { getWhatsAppLink, getSnippets } from '../../utils/helpers';

// ─── Mapeamento estrito de Ações por Status ─────────────────────────────────
export const WORKFLOW_ACTIONS: Record<string, string[]> = {
    'Lead':         ['Chamar consultor'],
    'Planejamento': ['Aguardando informações', 'Agendar', 'Agendado', 'Pronto'],
    'Fechamento':   ['Agendar', 'Agendado', 'No show'],
    'Follow-up':    ['Agendar', 'Agendado', 'No show', 'Trocando mensagens'],
    'Em Análise':   ['Aguardando documentação', 'Documentação enviada', 'Aguardando seguradora', 'Pendência'],
    'Ganho':        ['Enviar apólice'],
    'Perdido':      [],
    'Cancelou':     [],
};

// Ordem para cálculo de visibilidade do botão Cliente
const STATUS_ORDER = ['Lead', 'Planejamento', 'Fechamento', 'Follow-up', 'Em Análise', 'Ganho', 'Perdido', 'Cancelou'];

interface Props {
    lead: Lead;
    handleUpdateLead: (updates: Partial<Lead>) => void;
    /** @deprecated As ações agora são derivadas de WORKFLOW_ACTIONS internamente */
    acoesDisponiveis?: string[];
    handleResetSLA: () => void;
    consultorWhatsapp?: string;
    consultorTeamsLink?: string;
}

const inputCls = "w-full bg-transparent border-b border-white/[0.08] px-0 py-3 text-slate-100 text-[13px] outline-none focus:border-blue-500/60 transition-colors font-medium placeholder:text-slate-600 rounded-none";
const selectCls = "w-full cursor-pointer appearance-none bg-[#0f172a] border border-white/[0.10] rounded-xl px-4 py-3 pr-10 text-slate-100 text-[13px] font-medium outline-none focus:border-blue-500/60 transition-colors shadow-inner";
const selectStyle = { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' };

// ─── Opções de WhatsApp por status ──────────────────────────────────────────
function getWaOptions(lead: Lead, snips: ReturnType<typeof getSnippets>) {
    const isGanho = lead.status === 'Ganho';

    // Opções para CLIENTE (sempre presentes)
    const clienteOpcoes = (() => {
        if (isGanho) {
            return [
                { label: '🎉 Apólice Emitida', msg: snips.apoliceCliente, tag: 'Cliente' },
            ];
        }
        if (['Follow-up', 'Em Análise'].includes(lead.status)) {
            return [
                { label: '01 · Apresentação', msg: snips.msg_apresentacao, tag: 'Cliente' },
                { label: '02 · Proposta Detalhada', msg: snips.msg01, tag: 'Cliente' },
                { label: '03 · Acompanhamento 1', msg: snips.msg02, tag: 'Cliente' },
                { label: '04 · Acompanhamento 2', msg: snips.msg03, tag: 'Cliente' },
                { label: '05 · Prioridade Atual?', msg: snips.msg04, tag: 'Cliente' },
                { label: '06 · Encerrar Contato', msg: snips.msg05, tag: 'Cliente' },
            ];
        }
        // Lead, Planejamento, Fechamento — mensagem padrão de apresentação
        return [
            { label: '01 · Apresentação', msg: snips.msg_apresentacao, tag: 'Cliente' },
        ];
    })();

    // Opções para CONSULTOR (sempre presentes quando há consultor)
    const consultorOpcoes = (() => {
        if (isGanho) {
            return [
                { label: '🎉 Apólice Emitida', msg: snips.apoliceConsultor, tag: 'Consultor' },
            ];
        }
        switch (lead.status) {
            case 'Lead':
                return [{ label: 'Novo Lead — Acionar', msg: snips.formLead, tag: 'Consultor' }];
            case 'Planejamento':
                return [
                    { label: 'Cobrar Infos do Cliente', msg: snips.cobrancaInfos, tag: 'Consultor' },
                    { label: 'Cobrar Agendamento', msg: snips.cobrarPlanejamento, tag: 'Consultor' },
                ];
            case 'Fechamento':
                return [{ label: 'Cobrar Fechamento', msg: snips.cobrarFechamento, tag: 'Consultor' }];
            case 'Follow-up':
                return [{ label: 'Follow-up Geral', msg: snips.followUpConsultor, tag: 'Consultor' }];
            default:
                return [{ label: 'Follow-up Geral', msg: snips.followUpConsultor, tag: 'Consultor' }];
        }
    })();

    return { clienteOpcoes, consultorOpcoes };
}

export const ActionManager: React.FC<Props> = ({ lead, handleUpdateLead, handleResetSLA, consultorWhatsapp = '', consultorTeamsLink = '' }) => {
    const [showWAMenu, setShowWAMenu]               = useState(false);
    const [showConsultorMenu, setShowConsultorMenu] = useState(false);

    // ── Ações disponíveis derivadas do WORKFLOW_ACTIONS ──────────────────────
    const acoesDisponiveis = WORKFLOW_ACTIONS[lead.status] ?? [];

    // ── Auto-reset: ao mudar status, seleciona o 1º item da nova lista ────────
    useEffect(() => {
        if (acoesDisponiveis.length > 0) {
            // Só auto-seleciona se a ação atual não pertencer ao novo status
            if (!acoesDisponiveis.includes(lead.acao || '')) {
                handleUpdateLead({ acao: acoesDisponiveis[0] });
            }
        } else {
            // Status sem ações (Perdido / Cancelou): limpa o campo
            if (lead.acao) handleUpdateLead({ acao: '' });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lead.status]);

    // ── Visibilidade do botão CLIENTE: oculto antes de Follow-up ──────────────
    const showClientButton = useMemo(() => {
        const idx = STATUS_ORDER.indexOf(lead.status);
        const threshold = STATUS_ORDER.indexOf('Follow-up');
        return idx >= threshold;
    }, [lead.status]);

    const snips = getSnippets(lead);
    const { clienteOpcoes, consultorOpcoes } = getWaOptions(lead, snips);

    // Número do consultor passado pelo SideSheet
    const consultorPhone = consultorWhatsapp;

    const handleWaSend = (phone: string, msg: string, labelLog: string) => {
        if (!phone) {
            alert('Número não cadastrado.');
            return;
        }
        const now = new Date().toLocaleString('pt-BR');
        handleUpdateLead({
            historico: [`[CONTATO 📱] WhatsApp: "${labelLog}" em ${now}`, ...(lead.historico || [])]
        });
        window.open(getWhatsAppLink(phone, msg), '_blank');
        setShowWAMenu(false);
        setShowConsultorMenu(false);
    };

    const handleTeamsSend = (teamsUrl: string, msg: string, labelLog: string) => {
        if (!teamsUrl) {
            alert('Link do Teams não cadastrado. Adicione no painel do Consultor.');
            return;
        }
        const now = new Date().toLocaleString('pt-BR');
        // Copia a mensagem para o clipboard e abre o Teams
        navigator.clipboard.writeText(msg).catch(() => {});
        handleUpdateLead({
            historico: [`[CONTATO 👥] Teams: "${labelLog}" (msg copiada) em ${now}`, ...(lead.historico || [])]
        });
        window.open(teamsUrl, '_blank');
        setShowConsultorMenu(false);
    };

    return (
        <>
            <div className="glass-card p-7">
                <SectionTitle icon={Activity} title="Status & Ação Direta" />

                {/* Botões de Status */}
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

                <div className="grid grid-cols-2 gap-8 items-end">
                    {/* Ação Imediata Dropdown */}
                    <div className="col-span-2 md:col-span-1">
                        <Field label="Ação Imediata">
                            <select
                                className={`${selectCls} ${acoesDisponiveis.length === 0 ? 'opacity-50' : 'text-emerald-400'}`}
                                style={selectStyle}
                                value={lead.acao || ''}
                                onChange={e => handleUpdateLead({ acao: e.target.value })}
                                disabled={acoesDisponiveis.length === 0}
                            >
                                <option value="">{acoesDisponiveis.length === 0 ? 'Altere o status...' : 'Selecione...'}</option>
                                {acoesDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </Field>
                    </div>

                    {/* Botões de ação rápida */}
                    <div className="col-span-2 md:col-span-1 flex items-center gap-3 pb-1 flex-wrap">

                        {/* ── Reiniciar SLA ── */}
                        <button
                            onClick={handleResetSLA}
                            title="Reiniciar contagem de SLA para hoje"
                            className="flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)', color: '#fbbf24', boxShadow: '0 0 12px rgba(245,158,11,0.10)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,158,11,0.18)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,158,11,0.08)'; }}
                        >
                            <RotateCcw size={13} />
                            SLA
                        </button>

                        {/* ── WhatsApp CLIENTE (visível somente ≥ Follow-up) ── */}
                        {showClientButton && (
                            <div className="relative animate-in fade-in slide-in-from-right-2 duration-300">
                                <button
                                    onClick={() => { setShowWAMenu(p => !p); setShowConsultorMenu(false); }}
                                    disabled={!lead.celular}
                                    title={lead.celular ? 'Enviar mensagem ao cliente' : 'Celular não cadastrado'}
                                    className={`px-4 py-3 rounded-xl text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${showWAMenu ? 'bg-emerald-600 scale-95' : 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)]'}`}
                                >
                                    <MessageCircle size={13} /> Cliente
                                    <ChevronDown size={12} className={`transition-transform duration-200 ${showWAMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {showWAMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowWAMenu(false)} />
                                        <div className="absolute left-0 bottom-full mb-3 w-72 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-bottom-left">
                                            <div className="px-3 py-2 border-b border-white/5 mb-1">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Para o Cliente · {(lead.nome || '').split(' ')[0]}</span>
                                            </div>
                                            {clienteOpcoes.map((opt, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleWaSend(lead.celular || '', opt.msg, opt.label)}
                                                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-400 text-slate-300 text-[11px] font-medium transition-all flex items-center justify-between group"
                                                >
                                                    {opt.label}
                                                    <Send size={11} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* ── CONSULTOR (sempre visível se há consultor) ── */}
                        {lead.consultor && (
                            <div className="relative">
                                <button
                                    onClick={() => { setShowConsultorMenu(p => !p); setShowWAMenu(false); }}
                                    title="Acionar consultor"
                                    className={`px-4 py-3 rounded-xl text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${showConsultorMenu ? 'scale-95' : ''}`}
                                    style={{
                                        background: showConsultorMenu ? 'rgba(37,99,235,0.80)' : 'rgba(37,99,235,0.65)',
                                        border: '1px solid rgba(99,179,237,0.25)',
                                        boxShadow: '0 0 16px rgba(37,99,235,0.25)'
                                    }}
                                >
                                    <User size={13} /> Consultor
                                    <ChevronDown size={12} className={`transition-transform duration-200 ${showConsultorMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {showConsultorMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowConsultorMenu(false)} />
                                        <div className="absolute right-0 bottom-full mb-3 w-80 bg-[#0a0f1e] border border-white/10 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 origin-bottom-right overflow-hidden">

                                            {/* Header */}
                                            <div className="px-4 py-3 border-b border-white/5">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Acionar · {lead.consultor.split(' ')[0]}</span>
                                            </div>

                                            {/* ── Seção CANAL ── */}
                                            <div className="p-2">
                                                <div className="px-3 pt-2 pb-1">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Canal</span>
                                                </div>

                                                {/* WhatsApp */}
                                                <button
                                                    onClick={() => {
                                                        const msg = consultorOpcoes[0]?.msg || '';
                                                        const label = consultorOpcoes[0]?.label || 'WhatsApp';
                                                        handleWaSend(consultorWhatsapp, msg, label);
                                                    }}
                                                    disabled={!consultorWhatsapp}
                                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 transition-all group disabled:opacity-35 disabled:cursor-not-allowed"
                                                >
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
                                                        <MessageCircle size={14} className="text-emerald-400" />
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <div className="text-[11px] font-bold">WhatsApp</div>
                                                        <div className="text-[9px] text-slate-500">{consultorWhatsapp ? 'Enviar mensagem contextual' : 'Número não cadastrado'}</div>
                                                    </div>
                                                    <Send size={11} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0 text-emerald-400" />
                                                </button>

                                                {/* Teams */}
                                                <button
                                                    onClick={() => {
                                                        const msg = consultorOpcoes[0]?.msg || '';
                                                        const label = consultorOpcoes[0]?.label || 'Teams';
                                                        handleTeamsSend(consultorTeamsLink, msg, label);
                                                    }}
                                                    disabled={!consultorTeamsLink}
                                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-indigo-500/10 text-slate-300 hover:text-indigo-400 transition-all group disabled:opacity-35 disabled:cursor-not-allowed"
                                                >
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
                                                        {/* Ícone Teams (SVG inline) */}
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M19.5 8.25h-1.875V6.375a1.875 1.875 0 1 0-3.75 0V8.25H12V6.375a3.375 3.375 0 0 1 6.75 0v.375h.75A2.25 2.25 0 0 1 21.75 9v7.5a2.25 2.25 0 0 1-2.25 2.25H12" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                            <path d="M10.5 9.75H4.5A2.25 2.25 0 0 0 2.25 12v4.5A2.25 2.25 0 0 0 4.5 18.75h6a2.25 2.25 0 0 0 2.25-2.25V12A2.25 2.25 0 0 0 10.5 9.75Z" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <div className="text-[11px] font-bold">Microsoft Teams</div>
                                                        <div className="text-[9px] text-slate-500">{consultorTeamsLink ? 'Abre o chat + copia mensagem' : 'Link não cadastrado'}</div>
                                                    </div>
                                                    <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition-all text-indigo-400" />
                                                </button>
                                            </div>

                                            {/* ── Seção MENSAGEM ── */}
                                            {consultorOpcoes.length > 0 && (
                                                <div className="border-t border-white/5 p-2">
                                                    <div className="px-3 pt-2 pb-1">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Mensagem · {lead.status}</span>
                                                    </div>
                                                    {consultorOpcoes.map((opt, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleWaSend(consultorWhatsapp, opt.msg, opt.label)}
                                                            disabled={!consultorWhatsapp}
                                                            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-blue-500/10 hover:text-blue-400 text-slate-400 text-[11px] font-medium transition-all flex items-center justify-between group disabled:opacity-35 disabled:cursor-not-allowed"
                                                        >
                                                            <span>{opt.label}</span>
                                                            <Send size={10} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Campo de Data quando ação é Agendado */}
                    {(lead.acao === 'Agendado' || lead.acao === 'Agendada') && (
                        <div className="col-span-2 md:col-span-1 animate-in fade-in slide-in-from-bottom-2">
                            <Field label="Data Agendada">
                                <input
                                    type="date"
                                    className={`${inputCls} bg-[#0b1426] font-mono text-[#60a5fa] p-4 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]`}
                                    value={lead.dataAcao || ''}
                                    onChange={e => handleUpdateLead({ dataAcao: e.target.value })}
                                />
                            </Field>
                        </div>
                    )}
                </div>
            </div>

            {/* Diagnóstico de Perda */}
            {lead.status === 'Perdido' && (
                <div className="glass-card p-7" style={{ background: 'rgba(244,63,94,0.06)', borderColor: 'rgba(244,63,94,0.20)' }}>
                    <SectionTitle icon={AlertCircle} title="Diagnóstico de Perda" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        {['Cliente não aceitou a proposta', 'Cliente parou de responder', 'Consultor não agendou fechamento', 'Recusa Médica'].map(m => (
                            <button key={m} onClick={() => handleUpdateLead({ motivoPerda: m })}
                                className={`text-[11px] font-bold p-4 rounded-xl border text-left transition-all ${lead.motivoPerda === m ? 'border-rose-500 bg-rose-500/10 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'border-rose-900/30 text-slate-500 hover:border-rose-500/50 hover:bg-[#0B1121]'}`}>
                                {m}
                            </button>
                        ))}
                    </div>
                    <Field label="Detalhes da Objeção">
                        <textarea
                            className={`${inputCls} min-h-[80px] bg-[#0B1121] p-4 rounded-xl border border-rose-500/20 text-rose-300`}
                            value={lead.motivoPerda || ''}
                            onChange={e => handleUpdateLead({ motivoPerda: e.target.value })}
                        />
                    </Field>
                </div>
            )}
        </>
    );
};
