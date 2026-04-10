import React, { useMemo } from 'react';
import { Users, Calendar, AlertCircle, PlayCircle, MessageCircle, CalendarX, TrendingDown, Trophy, ArrowRight, Activity, Filter, Zap, Target } from 'lucide-react';
import { Lead } from '../../types';
import { calcAge, checkSLA, getCadenceFlow, getWhatsAppLink } from '../../utils/helpers';

const CONFIG_ETAPAS = [
    { id: 'Lead', label: 'Leads', accent: 'rgba(99,102,241,', border: 'rgba(99,102,241,0.25)', text: '#a5b4fc' },
    { id: 'Aguardando Informações', label: 'Infos', accent: 'rgba(245,158,11,', border: 'rgba(245,158,11,0.25)', text: '#fcd34d' },
    { id: 'Planejamento', label: 'Planejamento', accent: 'rgba(37,99,235,', border: 'rgba(37,99,235,0.25)', text: '#93c5fd' },
    { id: 'Fechamento', label: 'Fechamento', accent: 'rgba(59,130,246,', border: 'rgba(59,130,246,0.25)', text: '#60a5fa' },
    { id: 'Follow-up', label: 'Follow-up', accent: 'rgba(34,211,238,', border: 'rgba(34,211,238,0.25)', text: '#67e8f9' },
    { id: 'Pendência', label: 'Pendência', accent: 'rgba(244,63,94,', border: 'rgba(244,63,94,0.25)', text: '#fda4af' },
    { id: 'Ganho', label: 'Ganhos', accent: 'rgba(16,185,129,', border: 'rgba(16,185,129,0.25)', text: '#6ee7b7' },
];

export const Dashboard = React.memo(function Dashboard({ leads, openLead }: { leads: Lead[], openLead: (l: Lead) => void }) {
    const { leadsAtivos, leadsTotal, pipelineForecast, taxaNoShow, leadsCadencia, slaBreached, topMotivosPerda, topConsultores, winRate } = useMemo(() => {
        const ativos = leads.filter(l => !['Ganho', 'Perdido', 'Cancelou'].includes(l.status));
        const ganhos = leads.filter(l => l.status === 'Ganho');
        const perdidos = leads.filter(l => l.status === 'Perdido' && l.motivoPerda);

        const forecastTotal = ativos.reduce((sum, l) => {
            const rec = Number(l.receitaEsperada) || 0;
            const prob = Number(l.probabilidade) || 0;
            return sum + (rec * (prob / 100));
        }, 0);

        const reunioes = leads.flatMap(l => l.reunioes || []);
        const totalReunioes = reunioes.length;
        const noShows = reunioes.filter(r => r.status === 'No-Show').length;
        const noShowRate = totalReunioes > 0 ? Math.round((noShows / totalReunioes) * 100) : 0;

        const cadencia = ativos
            .map(l => ({ lead: l, cadence: getCadenceFlow(l) }))
            .filter(item => item.cadence.actionRequired)
            .sort((a, b) => b.cadence.days - a.cadence.days);

        const sla = ativos.filter(l => checkSLA(l).isBreached);

        const motivos = perdidos.reduce((acc, lead) => {
            acc[lead.motivoPerda || 'Não Especificado'] = (acc[lead.motivoPerda || 'Não Especificado'] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const ranking = ganhos.reduce((acc, lead) => {
            acc[lead.consultor || 'Sem Atribuição'] = (acc[lead.consultor || 'Sem Atribuição'] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            leadsAtivos: ativos.length,
            leadsTotal: leads.length,
            pipelineForecast: forecastTotal,
            taxaNoShow: noShowRate,
            leadsCadencia: cadencia,
            slaBreached: sla,
            topConsultores: Object.entries(ranking).sort((a, b) => b[1] - a[1]).slice(0, 5),
            winRate: leads.length ? Math.round((ganhos.length / leads.length) * 100) : 0,
            leadsPlanejamentoPendente: ativos.filter(l => l.status === 'Planejamento' && l.acao !== 'Pronto'),
        };
    }, [leads]);

    const funnelStats = useMemo(() => {
        const pipelineOrdem = CONFIG_ETAPAS.map(c => c.id);

        return CONFIG_ETAPAS.map((config, index) => {
            const etapasSubsequentes = pipelineOrdem.slice(index);
            const count = leads.filter(l => etapasSubsequentes.includes(l.status)).length;
            return { ...config, count };
        });
    }, [leads]);

    const kpis = [
        {
            label: 'Leads Ativos',
            value: leadsAtivos,
            subtext: `de ${leadsTotal} totais`,
            icon: Users,
            color: '#93c5fd',
            glow: 'rgba(37,99,235,0.25)',
            accent: 'rgba(37,99,235,0.12)',
            border: 'rgba(37,99,235,0.20)',
        },
        {
            label: 'Forecast Esperado',
            value: new Intl.NumberFormat('pt-BR', { notation: "compact", maximumFractionDigits: 1 }).format(pipelineForecast),
            subtext: 'Ponderado por %',
            icon: Target,
            color: '#c4b5fd',
            glow: 'rgba(139,92,246,0.25)',
            accent: 'rgba(139,92,246,0.10)',
            border: 'rgba(139,92,246,0.20)',
        },
        {
            label: 'Win Rate',
            value: `${winRate}%`,
            icon: Trophy,
            color: '#6ee7b7',
            glow: 'rgba(16,185,129,0.25)',
            accent: 'rgba(16,185,129,0.10)',
            border: 'rgba(16,185,129,0.20)',
        },
        {
            label: 'Taxa de No-Show',
            value: `${taxaNoShow}%`,
            icon: CalendarX,
            color: taxaNoShow > 20 ? '#fda4af' : '#fcd34d',
            glow: taxaNoShow > 20 ? 'rgba(244,63,94,0.25)' : 'rgba(245,158,11,0.20)',
            accent: taxaNoShow > 20 ? 'rgba(244,63,94,0.10)' : 'rgba(245,158,11,0.08)',
            border: taxaNoShow > 20 ? 'rgba(244,63,94,0.20)' : 'rgba(245,158,11,0.18)',
        },
    ];

    return (
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-in pb-20 relative dot-grid min-h-screen">
            <div className="flex flex-col gap-1 px-1 mb-2">
                <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.25)', boxShadow: '0 0 20px rgba(37,99,235,0.20)' }}>
                        <Activity className="w-5 h-5" style={{ color: '#60a5fa' }} />
                    </div>
                    <span>Command Center</span>
                </h2>
                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.2em] ml-12">Inteligência de Vendas · Saúde do Pipeline</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((stat, i) => (
                    <div
                        key={i}
                        className="glass-card relative overflow-hidden p-5 flex flex-col justify-between h-32 cursor-default"
                        style={{ boxShadow: `0 4px 30px rgba(0,0,0,0.4), 0 0 0 1px ${stat.border}` }}
                    >
                        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full pointer-events-none"
                            style={{ background: stat.glow, filter: 'blur(24px)' }} />

                        <div className="flex items-start justify-between relative z-10">
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
                            <div className="p-2 rounded-xl" style={{ background: stat.accent, border: `1px solid ${stat.border}` }}>
                                <stat.icon size={15} style={{ color: stat.color }} strokeWidth={2.5} />
                            </div>
                        </div>

                        <div className="relative z-10">
                            <p className="text-3xl font-black text-white tracking-tighter leading-none" style={{ textShadow: `0 0 30px ${stat.glow}` }}>
                                {stat.value}
                            </p>
                            {stat.subtext && (
                                <span className="text-[9px] font-bold text-slate-500 mt-1 block">{stat.subtext}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass-card relative overflow-hidden p-6 lg:p-8">
                <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at top right, rgba(37,99,235,0.08), transparent 70%)' }} />

                <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/[0.05] relative z-10">
                    <div className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Filter size={14} className="text-slate-400" />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black uppercase text-white tracking-[0.18em]">Pipeline Operacional</h3>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">Fluxo Contínuo de Conversão</p>
                    </div>
                </div>

                <div className="flex items-stretch justify-between gap-2 overflow-x-auto custom-scrollbar pb-2 relative z-10">
                    {funnelStats.map((step, idx) => {
                        const previousCount = idx === 0 ? step.count : funnelStats[idx - 1].count;
                        const convRate = previousCount > 0 ? Math.round((step.count / previousCount) * 100) : 0;

                        return (
                            <React.Fragment key={step.id}>
                                <div
                                    className="flex-1 min-w-[115px] p-4 rounded-2xl relative overflow-hidden transition-all duration-200 hover:scale-[1.03] cursor-default"
                                    style={{
                                        background: `${step.accent}0.10)`,
                                        border: `1px solid ${step.border}`,
                                        boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px ${step.border}`,
                                    }}
                                >
                                    <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full pointer-events-none"
                                        style={{ background: `${step.accent}0.12)`, filter: 'blur(16px)' }} />
                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70 truncate mb-2"
                                        style={{ color: step.text }}>{step.label}</p>
                                    <p className="text-3xl font-black font-mono leading-none"
                                        style={{ color: step.text, textShadow: `0 0 20px ${step.accent}0.6)` }}>
                                        {step.count}
                                    </p>
                                </div>

                                {idx < funnelStats.length - 1 && (
                                    <div className="flex flex-col items-center justify-center gap-1 shrink-0 px-0.5">
                                        <span className="text-[8px] font-black font-mono text-slate-400 px-1.5 py-0.5 rounded-md"
                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            {convRate}%
                                        </span>
                                        <ArrowRight className="w-3 h-3 text-slate-600" />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="glass-card p-6 flex flex-col h-[420px]">
                    <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.05]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl" style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.20)', boxShadow: '0 0 12px rgba(37,99,235,0.15)' }}>
                                <PlayCircle size={14} style={{ color: '#60a5fa' }} />
                            </div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-white">Tarefas Hoje</h3>
                        </div>
                        <span className="text-[9px] font-black px-2.5 py-1 rounded-lg"
                            style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.20)', color: '#93c5fd' }}>
                            {leadsCadencia.length} pendentes
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                        {leadsCadencia.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                                    style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.20)' }}>
                                    <Zap size={16} style={{ color: '#6ee7b7' }} />
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Missão Cumprida</p>
                            </div>
                        ) : leadsCadencia.map(({ lead: l, cadence }) => (
                            <div
                                key={l.id}
                                onClick={() => openLead(l)}
                                className="p-3.5 rounded-xl cursor-pointer transition-all duration-150 flex justify-between items-center group"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(37,99,235,0.08)';
                                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(37,99,235,0.25)';
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
                                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)';
                                }}
                            >
                                <div className="flex flex-col gap-1 flex-1 min-w-0">
                                    <p className="text-[12px] font-bold text-slate-200 group-hover:text-white transition-colors truncate">{l.nome}</p>
                                    <div className="flex items-center gap-2">
                                        {l.acao && (
                                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                                                style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                {l.acao}
                                            </span>
                                        )}
                                        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#60a5fa' }}>
                                            {cadence.currentStep.action}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={e => { e.stopPropagation(); window.open(getWhatsAppLink(l.celular || '', cadence.currentStep.msg), '_blank'); }}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 transition-all hover:scale-110"
                                    style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.20)', color: '#6ee7b7', boxShadow: '0 0 12px rgba(16,185,129,0.10)' }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.75)';
                                        (e.currentTarget as HTMLButtonElement).style.color = '#022c22';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.10)';
                                        (e.currentTarget as HTMLButtonElement).style.color = '#6ee7b7';
                                    }}
                                >
                                    <MessageCircle size={15} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-6 flex flex-col h-[420px]">
                    <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.05]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl" style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.20)', boxShadow: '0 0 12px rgba(244,63,94,0.15)' }}>
                                <AlertCircle size={14} style={{ color: '#fda4af' }} />
                            </div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-white">SLA Atrasado</h3>
                        </div>
                        <span className="text-[9px] font-black px-2.5 py-1 rounded-lg"
                            style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.20)', color: '#fda4af' }}>
                            {slaBreached.length} alertas
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                        {slaBreached.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                                    style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.20)' }}>
                                    <Activity size={16} style={{ color: '#6ee7b7' }} />
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Fluxo Saudável</p>
                            </div>
                        ) : slaBreached.map(l => (
                            <div
                                key={l.id}
                                onClick={() => openLead(l)}
                                className="p-3.5 rounded-xl cursor-pointer transition-all duration-150 flex justify-between items-center group"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(244,63,94,0.06)';
                                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(244,63,94,0.22)';
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
                                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)';
                                }}
                            >
                                <div>
                                    <p className="text-[12px] font-bold text-slate-200 group-hover:text-white transition-colors mb-1">{l.nome}</p>
                                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                                        style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        {l.status}
                                    </span>
                                </div>
                                <div className="px-3 py-1.5 rounded-lg" style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.20)' }}>
                                    <span className="text-[11px] font-black font-mono" style={{ color: '#fda4af' }}>
                                        +{checkSLA(l).days - checkSLA(l).maxDays}d
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-6 flex flex-col h-[420px]">
                    <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.05]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl" style={{ background: 'rgba(37,180,235,0.10)', border: '1px solid rgba(37,180,235,0.20)', boxShadow: '0 0 12px rgba(37,180,235,0.15)' }}>
                                <Target size={14} style={{ color: '#60a5fa' }} />
                            </div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-white">Planejamentos Pendentes</h3>
                        </div>
                        <span className="text-[9px] font-black px-2.5 py-1 rounded-lg"
                            style={{ background: 'rgba(37,180,235,0.10)', border: '1px solid rgba(37,180,235,0.20)', color: '#93c5fd' }}>
                            {leadsPlanejamentoPendente.length} pendentes
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                        {leadsPlanejamentoPendente.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                                    style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.20)' }}>
                                    <Check size={16} style={{ color: '#6ee7b7' }} />
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tudo em dia</p>
                            </div>
                        ) : leadsPlanejamentoPendente.map(l => (
                            <div
                                key={l.id}
                                onClick={() => openLead(l)}
                                className="p-3.5 rounded-xl cursor-pointer transition-all duration-150 flex justify-between items-center group"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(37,99,235,0.06)';
                                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(37,99,235,0.22)';
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
                                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)';
                                }}
                            >
                                <div>
                                    <p className="text-[12px] font-bold text-slate-200 group-hover:text-white transition-colors mb-1">{l.nome}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                                            style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            {l.consultor || 'Sem Consultor'}
                                        </span>
                                    </div>
                                </div>
                                <div className="px-3 py-1.5 rounded-lg" style={{ background: 'rgba(37,99,235,0.10)', border: '1px solid rgba(37,99,235,0.20)' }}>
                                    <ArrowRight size={14} style={{ color: '#60a5fa' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-6">
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.05]">
                        <div className="p-2 rounded-xl" style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.20)', boxShadow: '0 0 12px rgba(245,158,11,0.12)' }}>
                            <Trophy size={14} style={{ color: '#fcd34d' }} />
                        </div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-white">Top Closers</h3>
                    </div>
                    <div className="space-y-2">
                        {topConsultores.length === 0 ? (
                            <p className="text-center py-10 text-[10px] text-slate-500 font-bold uppercase tracking-widest">Aguardando fechamentos</p>
                        ) : topConsultores.map(([nome, count], idx) => (
                            <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl transition-all"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black"
                                        style={idx === 0
                                            ? { background: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.25)', boxShadow: '0 0 12px rgba(245,158,11,0.20)' }
                                            : { background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }
                                        }>
                                        {idx + 1}º
                                    </div>
                                    <span className="text-[12px] font-bold text-slate-300">{nome}</span>
                                </div>
                                <span className="text-[10px] font-black font-mono px-3 py-1 rounded-lg"
                                    style={idx === 0
                                        ? { background: 'rgba(16,185,129,0.10)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.20)' }
                                        : { background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.07)' }
                                    }>
                                    {count} {count === 1 ? 'Win' : 'Wins'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-6">
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.05]">
                        <div className="p-2 rounded-xl" style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.20)', boxShadow: '0 0 12px rgba(244,63,94,0.12)' }}>
                            <TrendingDown size={14} style={{ color: '#fda4af' }} />
                        </div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-white">Diagnóstico de Perda</h3>
                    </div>
                    <div className="space-y-5">
                        {topMotivosPerda.length === 0 ? (
                            <p className="text-center py-10 text-[10px] text-slate-500 font-bold uppercase tracking-widest">Sem perdas registradas</p>
                        ) : topMotivosPerda.map(([motivo, count], idx) => {
                            const total = leads.filter(l => l.status === 'Perdido').length;
                            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                            return (
                                <div key={idx} className="group">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate pr-4 group-hover:text-slate-200 transition-colors">{motivo}</span>
                                        <span className="text-[11px] font-black font-mono text-slate-400">{percentage}%</span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <div
                                            className="h-full rounded-full transition-all group-hover:opacity-100"
                                            style={{
                                                width: `${percentage}%`,
                                                background: 'linear-gradient(90deg, rgba(244,63,94,0.7), rgba(244,63,94,1))',
                                                boxShadow: '0 0 10px rgba(244,63,94,0.50)',
                                                opacity: 0.75,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
});