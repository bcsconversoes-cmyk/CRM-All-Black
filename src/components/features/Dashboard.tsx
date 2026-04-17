import React, { useMemo, useState, useCallback } from 'react';
import {
    Users, CalendarX, TrendingDown, Trophy, ArrowRight,
    Activity, Filter, Target, Check, AlertTriangle,
    Loader2, ExternalLink, ChevronDown, PlayCircle,
    MessageCircle, Clock, BarChart2, CheckCircle2, Timer, ShieldCheck, DollarSign
} from 'lucide-react';
import { Lead } from '../../types';
import { checkSLA, getCadenceFlow, getDaysInStage, formatDate, formatMoney, getConsultantWhatsAppMessage, getWhatsAppLink } from '../../utils/helpers';
import { useDashboardStats } from '../../hooks/useDashboardStats';

// ─── Configuração do funil ──────────────────────────────────────────────────
const CONFIG_ETAPAS = [
    { id: 'Lead',         label: 'Leads',         accent: 'rgba(99,102,241,',  border: 'rgba(99,102,241,0.25)',  text: '#a5b4fc' },
    { id: 'Planejamento', label: 'Planejamento',   accent: 'rgba(37,99,235,',   border: 'rgba(37,99,235,0.25)',   text: '#93c5fd' },
    { id: 'Fechamento',   label: 'Fechamento',     accent: 'rgba(59,130,246,',  border: 'rgba(59,130,246,0.25)',  text: '#60a5fa' },
    { id: 'Follow-up',    label: 'Follow-up',      accent: 'rgba(34,211,238,',  border: 'rgba(34,211,238,0.25)',  text: '#67e8f9' },
    { id: 'Em Análise',   label: 'Em Análise',     accent: 'rgba(244,63,94,',   border: 'rgba(244,63,94,0.25)',   text: '#fda4af' },
    { id: 'Ganho',        label: 'Ganhos',         accent: 'rgba(16,185,129,',  border: 'rgba(16,185,129,0.25)', text: '#6ee7b7' },
];

// ─── Tipos ──────────────────────────────────────────────────────────────────
type QuickActionType = 'contactado' | 'agendar' | 'adiar' | 'alinhado';

interface DashboardProps {
    leads: Lead[];
    consultores: any[]; 
    policies: any[];
    openLead: (l: Lead) => void;
    onQuickAction: (lead: Lead, action: QuickActionType) => Promise<void>;
}

// ─── Componente: Linha de tarefa INLINE (Sem Accordion) ─────────────────────
interface LeadTaskRowProps {
    lead: Lead;
    isProcessing: boolean;
    onOpen: () => void;
    primaryLabel: string;
    primaryAction: QuickActionType;
    primaryColor: string;
    primaryBg: string;
    primaryBorder: string;
    onAction: (action: QuickActionType) => Promise<void>;
}

const LeadTaskRow: React.FC<LeadTaskRowProps> = ({
    lead, isProcessing, onOpen,
    primaryLabel, primaryAction, primaryColor, primaryBg, primaryBorder, onAction
}) => {
    const days    = getDaysInStage(lead);
    const sla     = checkSLA(lead);
    const urgency = sla.isBreached ? 'breach' : days >= Math.max(0, (sla.maxDays || 0) - 1) ? 'warn' : 'ok';

    const dotColor = urgency === 'breach' ? '#f43f5e' : urgency === 'warn' ? '#f59e0b' : '#334155';
    const dotGlow  = urgency === 'breach' ? '0 0 6px rgba(244,63,94,0.8)' : urgency === 'warn' ? '0 0 6px rgba(245,158,11,0.6)' : 'none';

    return (
        <div
            onClick={onOpen}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.03] cursor-pointer group"
            style={{
                background: 'rgba(255,255,255,0.015)',
                border: '1px solid rgba(255,255,255,0.04)',
            }}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${urgency === 'breach' ? 'animate-pulse' : ''}`}
                    style={{ background: dotColor, boxShadow: dotGlow }}
                />
                <div className="flex flex-col min-w-0">
                    <p className="text-[11px] font-bold text-slate-200 truncate leading-tight group-hover:text-white transition-colors">
                        {lead.nome || 'Sem Nome'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                            className="text-[9px] font-black font-mono mt-px"
                            style={{ color: urgency === 'breach' ? '#fca5a5' : urgency === 'warn' ? '#fcd34d' : '#64748b' }}
                        >
                            {days}d {sla.isBreached && `(+${days - (sla.maxDays || 0)})`}
                        </span>
                        {lead.consultor && (
                            <span className="text-[8px] font-semibold text-slate-500 truncate max-w-[80px]">
                                · {lead.consultor.split(' ')[0]}
                            </span>
                        )}
                        {lead.acao && (
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">
                                · {lead.acao}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <button
                    onClick={() => onAction(primaryAction)}
                    disabled={isProcessing}
                    className="flex justify-center items-center gap-1 px-2 py-1.5 rounded text-[8px] font-black uppercase tracking-wider transition-all disabled:opacity-50 hover:scale-105"
                    style={{ background: primaryBg, border: `1px solid ${primaryBorder}`, color: primaryColor }}
                >
                    {isProcessing ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                    <span className="hidden sm:inline">{primaryLabel}</span>
                </button>
                <button
                    onClick={() => onAction('adiar')}
                    disabled={isProcessing}
                    className="flex justify-center items-center p-1.5 rounded text-[8px] font-black uppercase transition-all disabled:opacity-50 hover:bg-white/10"
                    style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', color: '#fbbf24' }}
                    title="Adiar SLA"
                >
                    {isProcessing ? <Loader2 size={10} className="animate-spin" /> : <Timer size={10} />}
                </button>
            </div>
        </div>
    );
};

// ─── Componente: Linha do Consultor INLINE (Follow-up Consultores) ──────────
interface ConsultorTaskRowProps {
    lead: Lead;
    consultores: any[]; // para usar os dados como zap/teams
    isProcessing: boolean;
    onOpen: () => void;
    onAction: (action: QuickActionType) => Promise<void>;
}

const ConsultorTaskRow: React.FC<ConsultorTaskRowProps> = ({
    lead, consultores, isProcessing, onOpen, onAction
}) => {
    const days    = getDaysInStage(lead);
    const sla     = checkSLA(lead);
    // > 48h vs > 24h: >2 business days => red, >1 business day => yellow.
    const isRed = days > 2;
    const isYellow = days > 1 && days <= 2;
    const urgency = isRed ? 'breach' : isYellow ? 'warn' : 'ok';

    const dotColor = urgency === 'breach' ? '#f43f5e' : urgency === 'warn' ? '#f59e0b' : '#334155';
    const dotGlow  = urgency === 'breach' ? '0 0 6px rgba(244,63,94,0.8)' : urgency === 'warn' ? '0 0 6px rgba(245,158,11,0.6)' : 'none';

    const consultorObj = consultores.find(c => c.nome === lead.consultor);
    
    // Fallback import helpers or rewrite getConsultantWhatsAppMessage
    // We already have `getConsultantWhatsAppMessage` exported from `../../utils/helpers`.
    // Wait, getWhatsAppLink is also there. I will import it in Dashboard.tsx. (already imported checkSLA etc... Wait, I need to add `getWhatsAppLink, getConsultantWhatsAppMessage` to Dashboard imports).

    return (
        <div
            onClick={onOpen}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.03] cursor-pointer group"
            style={{
                background: 'rgba(255,255,255,0.015)',
                border: '1px solid rgba(255,255,255,0.04)',
            }}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${urgency === 'breach' ? 'animate-pulse' : ''}`}
                    style={{ background: dotColor, boxShadow: dotGlow }}
                />
                <div className="flex flex-col min-w-0">
                    <p className="text-[11px] font-bold text-slate-200 truncate leading-tight group-hover:text-white transition-colors">
                        {lead.nome || 'Sem Nome'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                            className="text-[9px] font-black font-mono mt-px"
                            style={{ color: urgency === 'breach' ? '#fca5a5' : urgency === 'warn' ? '#fcd34d' : '#64748b' }}
                        >
                            {days}d atrás
                        </span>
                        {lead.consultor && (
                            <span className="text-[8px] font-semibold text-slate-500 truncate max-w-[80px]">
                                · {lead.consultor.split(' ')[0]}
                            </span>
                        )}
                        {lead.acao && (
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">
                                · {lead.acao}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                {consultorObj?.whatsapp && (
                    <button
                        onClick={() => {
                            const msg = getConsultantWhatsAppMessage(lead);
                            window.open(getWhatsAppLink(consultorObj.whatsapp, msg), '_blank');
                        }}
                        className="flex justify-center items-center p-1.5 rounded text-[8px] font-black uppercase transition-all hover:bg-white/10"
                        style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', color: '#34d399' }}
                        title="Cobrar via WhatsApp"
                    >
                        <MessageCircle size={10} />
                    </button>
                )}
                {consultorObj?.teams_link && (
                    <button
                        onClick={() => window.open(consultorObj.teams_link, '_blank')}
                        className="flex justify-center items-center p-1.5 rounded text-[8px] font-black uppercase transition-all hover:bg-white/10"
                        style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', color: '#818cf8' }}
                        title="Cobrar via Teams"
                    >
                        <ExternalLink size={10} />
                    </button>
                )}

                <button
                    onClick={() => onAction('alinhado')}
                    disabled={isProcessing}
                    className="flex justify-center items-center gap-1 px-2 py-1.5 rounded text-[8px] font-black uppercase tracking-wider transition-all disabled:opacity-50 hover:scale-105"
                    style={{ background: 'rgba(59,130,246,0.10)', border: `1px solid rgba(59,130,246,0.25)`, color: '#93c5fd' }}
                >
                    {isProcessing ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                    <span className="hidden sm:inline">Alinhado</span>
                </button>
            </div>
        </div>
    );
};

// ─── Card wrapper genérico ───────────────────────────────────────────────────
const CardHeader = ({ icon: Icon, label, count, accentRgb, iconColor }: {
    icon: React.ElementType; label: string; count: number | string;
    accentRgb: string; iconColor: string;
}) => (
    <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl"
                style={{ background: `rgba(${accentRgb},0.10)`, border: `1px solid rgba(${accentRgb},0.20)`, boxShadow: `0 0 12px rgba(${accentRgb},0.15)` }}>
                <Icon size={14} style={{ color: iconColor }} />
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-white">{label}</h3>
        </div>
        <span className="text-[9px] font-black px-2.5 py-1 rounded-lg"
            style={{ background: `rgba(${accentRgb},0.10)`, border: `1px solid rgba(${accentRgb},0.20)`, color: iconColor }}>
            {count}
        </span>
    </div>
);

const EmptyState = ({ label }: { label: string }) => (
    <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-600 select-none">
        <CheckCircle2 size={22} className="opacity-20" />
        <p className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
    </div>
);

// ─── Dashboard principal ─────────────────────────────────────────────────────
export const Dashboard = React.memo(function Dashboard({ leads, consultores, policies, openLead, onQuickAction }: DashboardProps) {
    const [expandedId, setExpandedId]             = useState<number | null>(null);
    const [expandedConsultor, setExpandedConsultor] = useState<string | null>(null);
    const [processingId, setProcessingId]         = useState<number | null>(null);

    const handleAction = useCallback(async (lead: Lead, action: QuickActionType) => {
        setProcessingId(lead.id);
        try {
            await onQuickAction(lead, action);
            setExpandedId(null); // fecha o painel após ação
        } finally {
            setProcessingId(null);
        }
    }, [onQuickAction]);

    const toggleLead = useCallback((id: number) => {
        // Obsoleto mas mantido para compatibilidade se algo mais usar
        setExpandedId(prev => prev === id ? null : id);
    }, []);

    // ── Cálculos do useMemo (extraídos para o hook useDashboardStats) ──
    const stats = useDashboardStats(leads, consultores);

    const funnelStats = useMemo(() => {
        const ordem = CONFIG_ETAPAS.map(c => c.id);
        return CONFIG_ETAPAS.map((cfg, idx) => {
            const subs = ordem.slice(idx);
            return { ...cfg, count: leads.filter(l => subs.includes(l.status)).length };
        });
    }, [leads]);

    const totalActivePremium = useMemo(() => {
        return (policies || [])
            .filter(p => p.status === 'Ativa')
            .reduce((acc, p) => acc + (p.valorPremio || 0), 0);
    }, [policies]);

    const activePoliciesCount = useMemo(() => {
        return (policies || []).filter(p => p.status === 'Ativa').length;
    }, [policies]);

    const kpis = [
        { label: 'Leads Ativos', value: stats.leadsAtivos, sub: `de ${stats.leadsTotal} totais`, icon: Users, color: '#93c5fd', glow: 'rgba(37,99,235,0.25)', accent: 'rgba(37,99,235,0.12)', border: 'rgba(37,99,235,0.20)' },
        { label: 'Prêmio Mensal', value: formatMoney(totalActivePremium), sub: `${activePoliciesCount} apólices ativas`, icon: DollarSign, color: '#6ee7b7', glow: 'rgba(16,185,129,0.25)', accent: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.20)' },
        { label: 'Taxa de No-Show', value: `${stats.noShowRate}%`, sub: 'Reuniões perdidas', icon: CalendarX, color: '#fca5a5', glow: 'rgba(244,63,94,0.25)', accent: 'rgba(244,63,94,0.10)', border: 'rgba(244,63,94,0.20)' },
        { label: 'Win Rate', value: `${stats.winRate}%`, icon: Trophy, color: '#6ee7b7', glow: 'rgba(16,185,129,0.25)', accent: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.20)' },
    ];

    const maxOport = stats.oportunidades[0]?.count || 1;

    return (
        <div className="p-3 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-in pb-20 relative dot-grid min-h-screen">

            {/* ── Cabeçalho ── */}
            <div className="flex flex-col gap-1 px-1 mb-2">
                <h2 className="text-xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <div className="p-1.5 lg:p-2 rounded-xl"
                        style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.25)', boxShadow: '0 0 20px rgba(37,99,235,0.20)' }}>
                        <Activity className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: '#60a5fa' }} />
                    </div>
                    <span>Command Center</span>
                </h2>
                <p className="text-[9px] lg:text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] ml-10 lg:ml-12">
                    Inteligência de Vendas · Fila de Trabalho · Pipeline
                </p>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, i) => (
                    <div key={i} className="glass-card relative overflow-hidden p-5 flex flex-col justify-between h-32 cursor-default"
                        style={{ boxShadow: `0 4px 30px rgba(0,0,0,0.4), 0 0 0 1px ${kpi.border}` }}>
                        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full pointer-events-none"
                            style={{ background: kpi.glow, filter: 'blur(24px)' }} />
                        <div className="flex items-start justify-between relative z-10">
                            <p className="text-[8px] lg:text-[9px] font-black uppercase tracking-[0.18em] text-slate-300">{kpi.label}</p>
                            <div className="p-1.5 lg:p-2 rounded-xl" style={{ background: kpi.accent, border: `1px solid ${kpi.border}` }}>
                                <kpi.icon className="w-3.5 h-3.5 lg:w-[15px] lg:h-[15px]" style={{ color: kpi.color }} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className="text-xl lg:text-3xl font-black text-white tracking-tighter leading-none"
                                style={{ textShadow: `0 0 30px ${kpi.glow}` }}>
                                {kpi.value}
                            </p>
                            {'sub' in kpi && kpi.sub && (
                                <span className="text-[9px] font-bold text-slate-400 mt-1 block">{kpi.sub}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Funil de Conversão ── */}
            <div className="glass-card relative overflow-hidden p-4 lg:p-8">
                <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at top right, rgba(37,99,235,0.08), transparent 70%)' }} />
                <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/[0.05] relative z-10">
                    <div className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Filter size={14} className="text-slate-400" />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black uppercase text-white tracking-[0.18em]">Pipeline Operacional</h3>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Fluxo Contínuo de Conversão</p>
                    </div>
                </div>
                <div className="flex items-stretch justify-between gap-1 lg:gap-2 overflow-x-auto no-scrollbar pb-2 relative z-10">
                    {funnelStats.map((step, idx) => {
                        const prevCount = idx === 0 ? step.count : funnelStats[idx - 1].count;
                        const conv = prevCount > 0 ? Math.round((step.count / prevCount) * 100) : 0;
                        return (
                            <React.Fragment key={step.id}>
                                <div className="flex-1 min-w-[100px] lg:min-w-[115px] p-3 lg:p-4 rounded-2xl relative overflow-hidden transition-all duration-200 hover:scale-[1.03] cursor-default"
                                    style={{ background: `${step.accent}0.10)`, border: `1px solid ${step.border}`, boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px ${step.border}` }}>
                                    <div className="absolute -bottom-4 -right-4 w-12 h-12 lg:w-16 lg:h-16 rounded-full pointer-events-none"
                                        style={{ background: `${step.accent}0.12)`, filter: 'blur(16px)' }} />
                                    <p className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest opacity-70 truncate mb-1 lg:mb-2" style={{ color: step.text }}>{step.label}</p>
                                    <p className="text-xl lg:text-3xl font-black font-mono leading-none" style={{ color: step.text, textShadow: `0 0 20px ${step.accent}0.6)` }}>
                                        {step.count}
                                    </p>
                                </div>
                                {idx < funnelStats.length - 1 && (
                                    <div className="flex flex-col items-center justify-center gap-1 shrink-0 px-0.5">
                                        <span className="text-[8px] font-black font-mono text-slate-400 px-1.5 py-0.5 rounded-md"
                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            {conv}%
                                        </span>
                                        <ArrowRight className="w-3 h-3 text-slate-600" />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* ── Filas de Trabalho ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. FILA: FOLLOW-UP CLIENTES */}
                <div className="glass-card p-6 flex flex-col h-[500px]">
                    <CardHeader icon={MessageCircle} label="Follow-up Clientes" count={stats.followUpCliente.length}
                        accentRgb="34,211,238" iconColor="#67e8f9" />
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                        {stats.followUpCliente.length === 0
                            ? <EmptyState label="Contatos em dia" />
                            : stats.followUpCliente.map(l => (
                                <LeadTaskRow
                                    key={l.id}
                                    lead={l}
                                    isProcessing={processingId === l.id}
                                    onOpen={() => openLead(l)}
                                    primaryLabel="Contactado"
                                    primaryAction="contactado"
                                    primaryColor="#6ee7b7"
                                    primaryBg="rgba(16,185,129,0.10)"
                                    primaryBorder="rgba(16,185,129,0.25)"
                                    onAction={action => handleAction(l, action)}
                                />
                            ))
                        }
                    </div>
                </div>

                {/* 2. FILA: PLANEJAMENTOS PENDENTES */}
                <div className="glass-card p-6 flex flex-col h-[500px]">
                    <CardHeader icon={Target} label="Planejamentos Pendentes" count={`${stats.planejamentoPendente.length} pendentes`}
                        accentRgb="99,102,241" iconColor="#818cf8" />
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                        {stats.planejamentoPendente.length === 0
                            ? <EmptyState label="Tudo em dia" />
                            : stats.planejamentoPendente.map(l => (
                                <LeadTaskRow
                                    key={l.id}
                                    lead={l}
                                    isProcessing={processingId === l.id}
                                    onOpen={() => openLead(l)}
                                    primaryLabel="Avançar: Agendar"
                                    primaryAction="agendar"
                                    primaryColor="#a5b4fc"
                                    primaryBg="rgba(99,102,241,0.12)"
                                    primaryBorder="rgba(99,102,241,0.28)"
                                    onAction={action => handleAction(l, action)}
                                />
                            ))
                        }
                    </div>
                </div>

                {/* 3. FILA: FOLLOW-UP CONSULTORES */}
                <div className="glass-card p-6 flex flex-col h-[500px]">
                    <CardHeader icon={Users} label="Follow-up Consultores" count={`${stats.followUpConsultores.length} pendentes`}
                        accentRgb="99,102,241" iconColor="#a5b4fc" />
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                        {stats.followUpConsultores.length === 0
                            ? <EmptyState label="Tudo alinhado" />
                            : stats.followUpConsultores.map((l) => (
                                <ConsultorTaskRow
                                    key={l.id}
                                    lead={l}
                                    consultores={consultores}
                                    isProcessing={processingId === l.id}
                                    onOpen={() => openLead(l)}
                                    onAction={action => handleAction(l, action)}
                                />
                            ))
                        }
                    </div>
                </div>

                {/* 4. WORKLOAD: OPORTUNIDADES EM ABERTO POR CONSULTOR */}
                <div className="glass-card p-6 flex flex-col h-[500px]">
                    <CardHeader icon={BarChart2} label="Oportunidades em Aberto" count={`${stats.oportunidades.reduce((s, c) => s + c.count, 0)} leads`}
                        accentRgb="99,102,241" iconColor="#a5b4fc" />
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1">
                        {stats.oportunidades.length === 0
                            ? <EmptyState label="Pipeline vazio" />
                            : stats.oportunidades.map((c, idx) => {
                                const isOpen = expandedConsultor === c.nome;
                                const barW   = Math.round((c.count / maxOport) * 100);
                                const barColor = c.count >= 5 ? '#f43f5e' : c.count >= 3 ? '#f59e0b' : '#10b981';
                                const sortedLeads = [...c.leads].sort((a, b) => {
                                    const sa = checkSLA(a), sb = checkSLA(b);
                                    if (sa.isBreached !== sb.isBreached) return sa.isBreached ? -1 : 1;
                                    return getDaysInStage(b) - getDaysInStage(a);
                                });

                                return (
                                    <div key={c.nome} className="rounded-xl overflow-hidden"
                                        style={{ background: isOpen ? 'rgba(99,102,241,0.06)' : 'transparent', border: isOpen ? '1px solid rgba(99,102,241,0.15)' : '1px solid transparent' }}>

                                        {/* Linha do consultor */}
                                        <div
                                            onClick={() => setExpandedConsultor(isOpen ? null : c.nome)}
                                            className="px-3 py-3 flex items-center gap-3 cursor-pointer group hover:bg-white/[0.03] transition-colors rounded-xl"
                                        >
                                            {/* Rank badge */}
                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0"
                                                style={idx === 0
                                                    ? { background: 'rgba(99,102,241,0.18)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.30)' }
                                                    : { background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.07)' }
                                                }>
                                                {idx + 1}
                                            </div>

                                            {/* Nome + barra */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[11px] font-bold text-slate-300 group-hover:text-white truncate transition-colors">{c.nome}</span>
                                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                        {c.breached > 0 && (
                                                            <span className="flex items-center gap-0.5 text-[8px] font-black text-rose-400">
                                                                <AlertTriangle size={8} />{c.breached}
                                                            </span>
                                                        )}
                                                        <span className="text-[9px] font-black font-mono"
                                                            style={{ color: barColor }}>
                                                            {c.count}
                                                        </span>
                                                    </div>
                                                </div>
                                                {/* Barra de carga */}
                                                <div className="w-full h-1 rounded-full bg-white/[0.05]">
                                                    <div className="h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${barW}%`, background: barColor, opacity: 0.7, boxShadow: `0 0 6px ${barColor}55` }} />
                                                </div>
                                            </div>

                                            <ChevronDown size={12} className={`text-slate-600 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                        </div>

                                        {/* Leads expandidos do consultor */}
                                        {isOpen && (
                                            <div className="px-3 pb-3 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                                {sortedLeads.map(l => (
                                                    <LeadTaskRow
                                                        key={l.id}
                                                        lead={l}
                                                        isProcessing={processingId === l.id}
                                                        onOpen={() => openLead(l)}
                                                        primaryLabel="Contactado"
                                                        primaryAction="contactado"
                                                        primaryColor="#6ee7b7"
                                                        primaryBg="rgba(16,185,129,0.10)"
                                                        primaryBorder="rgba(16,185,129,0.25)"
                                                        onAction={action => handleAction(l, action)}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>

                {/* 5. TOP CLOSERS */}
                <div className="glass-card p-6 flex flex-col h-[500px]">
                    <CardHeader icon={Trophy} label="Top Closers" count={`${stats.topConsultores.length} consultores`}
                        accentRgb="245,158,11" iconColor="#fcd34d" />
                    <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1">
                        {stats.topConsultores.length === 0
                            ? <p className="text-center py-10 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Aguardando fechamentos</p>
                            : stats.topConsultores.map(([nome, count], idx) => (
                                <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl transition-all bg-white/[0.02] border border-white/[0.06]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black"
                                            style={idx === 0
                                                ? { background: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.25)', boxShadow: '0 0 12px rgba(245,158,11,0.20)' }
                                                : { background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }
                                            }>
                                            {idx + 1}º
                                        </div>
                                        <span className="text-[12px] font-bold text-slate-300">{nome}</span>
                                    </div>
                                    <span className="text-[10px] font-black font-mono px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        {count} {count === 1 ? 'win' : 'wins'}
                                    </span>
                                </div>
                            ))
                        }
                    </div>
                </div>

                {/* 6. DIAGNÓSTICO DE PERDA */}
                <div className="glass-card p-6 flex flex-col h-[500px]">
                    <CardHeader icon={TrendingDown} label="Diagnóstico de Perda" count={`${stats.topMotivosPerda.length} motivos`}
                        accentRgb="244,63,94" iconColor="#fda4af" />
                    <div className="space-y-5 overflow-y-auto custom-scrollbar pr-1">
                        {stats.topMotivosPerda.length === 0
                            ? <p className="text-center py-10 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sem perdas registradas</p>
                            : stats.topMotivosPerda.map(([motivo, count], idx) => {
                                const total = leads.filter(l => l.status === 'Perdido').length;
                                const pct   = total > 0 ? Math.round(((count as number) / total) * 100) : 0;
                                return (
                                    <div key={idx} className="group">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider truncate pr-4 group-hover:text-slate-200 transition-colors">{motivo}</span>
                                            <span className="text-[11px] font-black font-mono text-slate-300">{pct}%</span>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/[0.05]">
                                            <div className="h-full rounded-full transition-all"
                                                style={{ width: `${pct}%`, background: 'linear-gradient(90deg, rgba(244,63,94,0.7), rgba(244,63,94,1))', boxShadow: '0 0 10px rgba(244,63,94,0.50)', opacity: 0.75 }} />
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            </div>
        </div>
    );
});