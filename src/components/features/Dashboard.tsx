import React, { useMemo, useState, useCallback } from 'react';
import {
    Users, CalendarX, TrendingDown, Trophy, ArrowRight,
    Activity, Filter, Target, Check, AlertTriangle,
    Loader2, ExternalLink, ChevronDown, PlayCircle,
    MessageCircle, Clock, BarChart2, CheckCircle2, Timer
} from 'lucide-react';
import { Lead } from '../../types';
import { checkSLA, getCadenceFlow, getDaysInStage, formatDate, formatMoney } from '../../utils/helpers';

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
type QuickActionType = 'contactado' | 'pronto' | 'adiar';

interface DashboardProps {
    leads: Lead[];
    openLead: (l: Lead) => void;
    onQuickAction: (lead: Lead, action: QuickActionType) => Promise<void>;
}

// ─── Componente: Linha de tarefa expansível ─────────────────────────────────
interface LeadTaskRowProps {
    lead: Lead;
    isExpanded: boolean;
    isProcessing: boolean;
    onToggle: () => void;
    onOpen: () => void;
    primaryLabel: string;
    primaryAction: QuickActionType;
    primaryColor: string;
    primaryBg: string;
    primaryBorder: string;
    onAction: (action: QuickActionType) => Promise<void>;
}

const LeadTaskRow: React.FC<LeadTaskRowProps> = ({
    lead, isExpanded, isProcessing, onToggle, onOpen,
    primaryLabel, primaryAction, primaryColor, primaryBg, primaryBorder, onAction
}) => {
    const days    = getDaysInStage(lead);
    const sla     = checkSLA(lead);
    const urgency = sla.isBreached ? 'breach' : days >= Math.max(0, (sla.maxDays || 0) - 1) ? 'warn' : 'ok';

    const dotColor = urgency === 'breach' ? '#f43f5e' : urgency === 'warn' ? '#f59e0b' : '#334155';
    const dotGlow  = urgency === 'breach' ? '0 0 6px rgba(244,63,94,0.8)' : urgency === 'warn' ? '0 0 6px rgba(245,158,11,0.6)' : 'none';

    return (
        <div
            className="rounded-xl overflow-hidden transition-all duration-200"
            style={{
                background: isExpanded ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.025)',
                border: isExpanded ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(255,255,255,0.05)',
            }}
        >
            {/* ── Cabeçalho clicável ── */}
            <div
                onClick={onToggle}
                className="flex items-center justify-between px-4 py-3 cursor-pointer group hover:bg-white/[0.02] transition-colors"
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${urgency === 'breach' ? 'animate-pulse' : ''}`}
                        style={{ background: dotColor, boxShadow: dotGlow }}
                    />
                    <div className="flex flex-col min-w-0">
                        <p className="text-[12px] font-bold text-slate-200 group-hover:text-white transition-colors truncate leading-tight">
                            {lead.nome || 'Sem Nome'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                            {lead.consultor && (
                                <span className="text-[8px] font-semibold text-slate-600 truncate max-w-[100px]">
                                    {lead.consultor.split(' ')[0]}
                                </span>
                            )}
                            {lead.acao && (
                                <span className="text-[8px] font-black uppercase tracking-wider text-slate-600">
                                    · {lead.acao}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {/* Badge de dias */}
                    <div
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md"
                        style={
                            urgency === 'breach'
                                ? { background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.28)' }
                                : urgency === 'warn'
                                ? { background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.22)' }
                                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
                        }
                    >
                        {urgency === 'breach' && <AlertTriangle size={8} style={{ color: '#fca5a5' }} />}
                        {urgency === 'warn'   && <Clock size={8} style={{ color: '#fcd34d' }} />}
                        <span
                            className="text-[10px] font-black font-mono"
                            style={{
                                color: urgency === 'breach' ? '#fca5a5' : urgency === 'warn' ? '#fcd34d' : '#64748b'
                            }}
                        >
                            {days}d
                        </span>
                    </div>

                    <ChevronDown
                        size={13}
                        className={`text-slate-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                </div>
            </div>

            {/* ── Painel expandido ── */}
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/[0.05] pt-3 animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* Contexto rápido */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {lead.dataAcao && (
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[7px] font-black uppercase tracking-widest text-slate-600">Data</span>
                                <span className="text-[10px] font-bold text-cyan-400 font-mono">{formatDate(lead.dataAcao)}</span>
                            </div>
                        )}
                        {lead.renda != null && (
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[7px] font-black uppercase tracking-widest text-slate-600">Renda</span>
                                <span className="text-[10px] font-bold text-slate-300 font-mono">{formatMoney(lead.renda)}</span>
                            </div>
                        )}
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[7px] font-black uppercase tracking-widest text-slate-600">SLA</span>
                            <span className="text-[10px] font-bold font-mono"
                                style={{ color: urgency === 'breach' ? '#fca5a5' : urgency === 'warn' ? '#fcd34d' : '#6ee7b7' }}>
                                {sla.isBreached ? `+${days - (sla.maxDays || 0)}d vencido` : `${(sla.maxDays || 0) - days}d restantes`}
                            </span>
                        </div>
                    </div>

                    {/* Botões de ação */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={e => { e.stopPropagation(); onOpen(); }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all hover:bg-white/10"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#94a3b8' }}
                        >
                            <ExternalLink size={10} />
                            Abrir
                        </button>

                        <button
                            onClick={async e => { e.stopPropagation(); await onAction(primaryAction); }}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-50 hover:opacity-90"
                            style={{ background: primaryBg, border: `1px solid ${primaryBorder}`, color: primaryColor }}
                        >
                            {isProcessing ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                            {primaryLabel}
                        </button>

                        <button
                            onClick={async e => { e.stopPropagation(); await onAction('adiar'); }}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-50 hover:opacity-90"
                            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)', color: '#fbbf24' }}
                        >
                            {isProcessing ? <Loader2 size={10} className="animate-spin" /> : <Timer size={10} />}
                            Adiar 1 dia
                        </button>
                    </div>
                </div>
            )}
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
export const Dashboard = React.memo(function Dashboard({ leads, openLead, onQuickAction }: DashboardProps) {
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
        setExpandedId(prev => prev === id ? null : id);
    }, []);

    // ── Cálculos do useMemo ──
    const stats = useMemo(() => {
        const ativos  = leads.filter(l => !['Ganho', 'Perdido', 'Cancelou'].includes(l.status));
        const ganhos  = leads.filter(l => l.status === 'Ganho');
        const perdidos = leads.filter(l => l.status === 'Perdido' && l.motivoPerda);

        const forecastTotal = ativos.reduce((sum, l) => {
            return sum + ((Number(l.receitaEsperada) || 0) * ((Number(l.probabilidade) || 0) / 100));
        }, 0);

        const reunioes     = leads.flatMap(l => l.reunioes || []);
        const noShowRate   = reunioes.length > 0
            ? Math.round((reunioes.filter(r => r.status === 'No-Show').length / reunioes.length) * 100)
            : 0;

        // Cadência — leads com ação requerida hoje, ordenados por urgência
        const cadencia = ativos
            .map(l => ({ lead: l, cadence: getCadenceFlow(l), days: getDaysInStage(l), sla: checkSLA(l) }))
            .filter(item => item.cadence.actionRequired)
            .sort((a, b) => {
                if (a.sla.isBreached !== b.sla.isBreached) return a.sla.isBreached ? -1 : 1;
                return b.days - a.days;
            });

        const slaBreached = ativos.filter(l => checkSLA(l).isBreached);

        const motivos  = perdidos.reduce((acc, l) => {
            const k = l.motivoPerda || 'Não Especificado';
            acc[k] = (acc[k] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const ranking = ganhos.reduce((acc, l) => {
            const k = l.consultor || 'Sem Atribuição';
            acc[k] = (acc[k] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Planejamentos pendentes (incompletos), por urgência
        const planejamentoPendente = ativos
            .filter(l => l.status === 'Planejamento' && l.acao !== 'Pronto')
            .sort((a, b) => {
                const sa = checkSLA(a), sb = checkSLA(b);
                if (sa.isBreached !== sb.isBreached) return sa.isBreached ? -1 : 1;
                return getDaysInStage(b) - getDaysInStage(a);
            });

        // Follow-up cliente — por urgência
        const followUpCliente = ativos
            .filter(l => l.status === 'Follow-up')
            .sort((a, b) => {
                const sa = checkSLA(a), sb = checkSLA(b);
                if (sa.isBreached !== sb.isBreached) return sa.isBreached ? -1 : 1;
                return getDaysInStage(b) - getDaysInStage(a);
            });

        // Oportunidades em aberto por consultor (workload)
        const porConsultor = ativos.reduce((acc, lead) => {
            const nome = lead.consultor || 'Sem Atribuição';
            if (!acc[nome]) acc[nome] = { count: 0, leads: [] as typeof ativos, breached: 0 };
            acc[nome].count++;
            acc[nome].leads.push(lead);
            if (checkSLA(lead).isBreached) acc[nome].breached++;
            return acc;
        }, {} as Record<string, { count: number; leads: typeof ativos; breached: number }>);

        const oportunidades = Object.entries(porConsultor)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 8)
            .map(([nome, data]) => ({ nome, ...data }));

        return {
            leadsAtivos: ativos.length,
            leadsTotal: leads.length,
            forecastTotal,
            noShowRate,
            cadencia,
            slaBreached,
            topConsultores: Object.entries(ranking).sort((a, b) => b[1] - a[1]).slice(0, 5),
            winRate: leads.length ? Math.round((ganhos.length / leads.length) * 100) : 0,
            topMotivosPerda: Object.entries(motivos).sort((a, b) => b[1] - a[1]).slice(0, 5),
            planejamentoPendente,
            followUpCliente,
            oportunidades,
        };
    }, [leads]);

    const funnelStats = useMemo(() => {
        const ordem = CONFIG_ETAPAS.map(c => c.id);
        return CONFIG_ETAPAS.map((cfg, idx) => {
            const subs = ordem.slice(idx);
            return { ...cfg, count: leads.filter(l => subs.includes(l.status)).length };
        });
    }, [leads]);

    const kpis = [
        { label: 'Leads Ativos', value: stats.leadsAtivos, sub: `de ${stats.leadsTotal} totais`, icon: Users, color: '#93c5fd', glow: 'rgba(37,99,235,0.25)', accent: 'rgba(37,99,235,0.12)', border: 'rgba(37,99,235,0.20)' },
        { label: 'Forecast', value: new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(stats.forecastTotal), sub: 'Ponderado por %', icon: Target, color: '#c4b5fd', glow: 'rgba(139,92,246,0.25)', accent: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.20)' },
        { label: 'Win Rate', value: `${stats.winRate}%`, icon: Trophy, color: '#6ee7b7', glow: 'rgba(16,185,129,0.25)', accent: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.20)' },
        { label: 'SLA Vencidos', value: stats.slaBreached.length, icon: AlertTriangle, color: stats.slaBreached.length > 0 ? '#fda4af' : '#6ee7b7', glow: stats.slaBreached.length > 0 ? 'rgba(244,63,94,0.25)' : 'rgba(16,185,129,0.20)', accent: stats.slaBreached.length > 0 ? 'rgba(244,63,94,0.10)' : 'rgba(16,185,129,0.10)', border: stats.slaBreached.length > 0 ? 'rgba(244,63,94,0.20)' : 'rgba(16,185,129,0.18)' },
    ];

    const maxOport = stats.oportunidades[0]?.count || 1;

    return (
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-in pb-20 relative dot-grid min-h-screen">

            {/* ── Cabeçalho ── */}
            <div className="flex flex-col gap-1 px-1 mb-2">
                <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <div className="p-2 rounded-xl"
                        style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.25)', boxShadow: '0 0 20px rgba(37,99,235,0.20)' }}>
                        <Activity className="w-5 h-5" style={{ color: '#60a5fa' }} />
                    </div>
                    <span>Command Center</span>
                </h2>
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] ml-12">
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
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-300">{kpi.label}</p>
                            <div className="p-2 rounded-xl" style={{ background: kpi.accent, border: `1px solid ${kpi.border}` }}>
                                <kpi.icon size={15} style={{ color: kpi.color }} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className="text-3xl font-black text-white tracking-tighter leading-none"
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
            <div className="glass-card relative overflow-hidden p-6 lg:p-8">
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
                <div className="flex items-stretch justify-between gap-2 overflow-x-auto custom-scrollbar pb-2 relative z-10">
                    {funnelStats.map((step, idx) => {
                        const prevCount = idx === 0 ? step.count : funnelStats[idx - 1].count;
                        const conv = prevCount > 0 ? Math.round((step.count / prevCount) * 100) : 0;
                        return (
                            <React.Fragment key={step.id}>
                                <div className="flex-1 min-w-[115px] p-4 rounded-2xl relative overflow-hidden transition-all duration-200 hover:scale-[1.03] cursor-default"
                                    style={{ background: `${step.accent}0.10)`, border: `1px solid ${step.border}`, boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px ${step.border}` }}>
                                    <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full pointer-events-none"
                                        style={{ background: `${step.accent}0.12)`, filter: 'blur(16px)' }} />
                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70 truncate mb-2" style={{ color: step.text }}>{step.label}</p>
                                    <p className="text-3xl font-black font-mono leading-none" style={{ color: step.text, textShadow: `0 0 20px ${step.accent}0.6)` }}>
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
                                    isExpanded={expandedId === l.id}
                                    isProcessing={processingId === l.id}
                                    onToggle={() => toggleLead(l.id)}
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
                                    isExpanded={expandedId === l.id}
                                    isProcessing={processingId === l.id}
                                    onToggle={() => toggleLead(l.id)}
                                    onOpen={() => openLead(l)}
                                    primaryLabel="Marcar Pronto"
                                    primaryAction="pronto"
                                    primaryColor="#a5b4fc"
                                    primaryBg="rgba(99,102,241,0.12)"
                                    primaryBorder="rgba(99,102,241,0.28)"
                                    onAction={action => handleAction(l, action)}
                                />
                            ))
                        }
                    </div>
                </div>

                {/* 3. FILA: TAREFAS DE CADÊNCIA */}
                <div className="glass-card p-6 flex flex-col h-[500px]">
                    <CardHeader icon={PlayCircle} label="Tarefas Hoje" count={`${stats.cadencia.length} pendentes`}
                        accentRgb="37,99,235" iconColor="#60a5fa" />
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                        {stats.cadencia.length === 0
                            ? <EmptyState label="Tudo em dia" />
                            : stats.cadencia.map(({ lead: l, cadence }) => (
                                <LeadTaskRow
                                    key={l.id}
                                    lead={{ ...l, acao: l.acao || cadence.currentStep.action }}
                                    isExpanded={expandedId === l.id}
                                    isProcessing={processingId === l.id}
                                    onToggle={() => toggleLead(l.id)}
                                    onOpen={() => openLead(l)}
                                    primaryLabel="Concluído"
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
                                                    <span className="text-[11px] font-bold text-slate-300 group-hover:text-white truncate transition-colors">{c.nome.split(' ')[0]}</span>
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
                                                        isExpanded={expandedId === l.id}
                                                        isProcessing={processingId === l.id}
                                                        onToggle={() => toggleLead(l.id)}
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
                                const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
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