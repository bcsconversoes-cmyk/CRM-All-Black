import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Check, MessageCircle, X, Send, AlertTriangle, Search, Filter, UserRound, MessageSquare } from 'lucide-react';
import { Lead, Consultor, STAGES, STAGE_SLAS } from '../../types';
import { getSnippets, getWhatsAppLink, getDaysInStage, formatDate, checkSLA, getClientWhatsAppMessage, getConsultantWhatsAppMessage } from '../../utils/helpers';
import StatusBadge from '../ui/StatusBadge';

interface FilterState {
    status: string[];
    acao: string[];
    nome: string;
    consultor: string;
    renda: string;
}

interface LeadsTableProps {
    leads: Lead[];
    consultores: Consultor[];
    isLoading?: boolean;
    globalSearch: string;
    setSelectedLead: (lead: Lead) => void;
    updateLeadStatus: (lead: Lead, newStatus: string) => Promise<void>;
}

const SalesforceIcon = ({ className = 'w-4 h-4', color = '#00A1E0' }: { className?: string; color?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
        <path d="M10.02 5.34a4.56 4.56 0 0 1 3.23-1.32 4.6 4.6 0 0 1 4.2 2.74 3.64 3.64 0 0 1 1.47-.31 3.67 3.67 0 0 1 3.67 3.67 3.67 3.67 0 0 1-3.67 3.67H5.48A3.48 3.48 0 0 1 2 10.31a3.48 3.48 0 0 1 3.48-3.48c.22 0 .43.02.64.06a4.55 4.55 0 0 1 3.9-1.55Z" />
    </svg>
);

const glassDropdown = {
    background: 'rgba(8,15,30,0.90)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    border: '1px solid rgba(99,179,237,0.10)',
    borderRadius: '16px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
} as React.CSSProperties;

const ACTION_OPTIONS = [
    'Agendado',
    'Agendar',
    'Aguardando Agendamento',
    'Aguardando Documentação',
    'Aguardando Informações',
    'Aguardando Seguradora',
    'Ajustando',
    'Chamar Consultor',
    'Concluído',
    'Criar Lead',
    'Trocando Mensagens',
];

const TableSkeleton = () => (
    <>
        {[...Array(5)].map((_, i) => (
            <tr key={i} className="animate-pulse border-b border-white/5">
                <td className="px-5 py-6"><div className="h-6 w-24 bg-white/5 rounded-lg"></div></td>
                <td className="px-5 py-6"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-white/5 rounded-xl"></div><div className="space-y-2"><div className="h-3 w-32 bg-white/5 rounded"></div><div className="h-2 w-20 bg-white/5 rounded"></div></div></div></td>
                <td className="px-5 py-6 hidden lg:table-cell"><div className="h-4 w-20 bg-white/5 rounded"></div></td>
                <td className="px-5 py-6 text-right hidden md:table-cell"><div className="h-4 w-16 bg-white/5 rounded ml-auto"></div></td>
                <td className="px-5 py-6 hidden lg:table-cell"><div className="h-8 w-16 bg-white/5 rounded-lg mx-auto"></div></td>
                <td className="px-5 py-6 hidden xl:table-cell text-center"><div className="h-6 w-24 bg-white/5 rounded-lg mx-auto"></div></td>
                <td className="px-5 py-6"><div className="h-8 w-28 bg-white/5 rounded-xl mx-auto"></div></td>
            </tr>
        ))}
    </>
);

const checkboxStyle = (checked: boolean): React.CSSProperties => ({
    width: 14,
    height: 14,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: checked ? '#2563eb' : 'rgba(255,255,255,0.04)',
    border: checked ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.16)',
    boxShadow: checked ? '0 0 0 2px rgba(37,99,235,0.18)' : 'none',
});

function FilterMultiSelect({ options, selected, onToggle, onToggleAll, renderLabel }: {
    options: string[];
    selected: string[];
    onToggle: (value: string) => void;
    onToggleAll: (nextAll: boolean) => void;
    renderLabel?: (value: string, checked: boolean) => React.ReactNode;
}) {
    const selectedCount = selected.length;
    const total = options.length;
    const all = total > 0 && selectedCount === total;
    const partial = selectedCount > 0 && selectedCount < total;
    const masterText = all ? 'Todos selecionados' : 'Selecionar todos';
    return (
        <div className="w-64">
            <button type="button" onClick={(e) => { e.stopPropagation(); onToggleAll(!all); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={checkboxStyle(all || partial)}>{all ? <Check className="w-2.5 h-2.5 text-white" /> : partial ? <div className="w-2 h-[2px] rounded bg-white" /> : null}</div>
                <span className="text-[11px] font-bold tracking-wide text-slate-100">{masterText}</span>
                <span className="ml-auto text-[10px] font-semibold text-slate-400">{selectedCount} de {total}</span>
            </button>
            <div className="mt-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                {options.map((opt) => {
                    const checked = selected.includes(opt);
                    return (
                        <button type="button" key={opt} onClick={(e) => { e.stopPropagation(); onToggle(opt); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors" style={{ background: checked ? 'rgba(37,99,235,0.10)' : 'transparent' }}>
                            <div style={checkboxStyle(checked)}>{checked && <Check className="w-2.5 h-2.5 text-white" />}</div>
                            {renderLabel ? renderLabel(opt, checked) : <span className="text-[11px] font-semibold" style={{ color: checked ? '#e2e8f0' : '#94a3b8' }}>{opt}</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export const LeadsTable = React.memo(function LeadsTable({ leads, consultores, isLoading = false, globalSearch, setSelectedLead, updateLeadStatus }: LeadsTableProps) {
    const [filters, setFilters] = useState<FilterState>({
        status: ['Lead', 'Planejamento', 'Fechamento', 'Follow-up', 'Em AnÃƒÂ¡lise'],
        acao: [],
        nome: '',
        consultor: '',
        renda: ''
    });

    const [sortKey, setSortKey] = useState<string>('sla');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [showStatusFilter, setShowStatusFilter] = useState(false);
    const [showAcaoFilter, setShowAcaoFilter] = useState(false);
    const [showRendaFilter, setShowRendaFilter] = useState(false);
    const [rendaOp, setRendaOp] = useState('>=');
    const [rendaVal, setRendaVal] = useState('');
    const [editingStatusLeadId, setEditingStatusLeadId] = useState<number | null>(null);
    const [waModalLead, setWaModalLead] = useState<Lead | null>(null);
    const [waMessage, setWaMessage] = useState('');
    const [consultantModalLead, setConsultantModalLead] = useState<Lead | null>(null);
    const [consultantMessage, setConsultantMessage] = useState('');
    const [consultantChannel, setConsultantChannel] = useState<'whatsapp' | 'teams'>('whatsapp');

    const filteredLeads = useMemo(() => {
        let result = leads.filter(item => {
            if (filters.status.length > 0 && !filters.status.includes(item.status)) return false;
            if (filters.acao.length > 0 && !filters.acao.includes((item.acao || '').trim())) return false;
            if (filters.nome && !(item.nome || '').toLowerCase().includes(filters.nome.toLowerCase())) return false;
            if (filters.consultor && !(item.consultor || '').toLowerCase().includes(filters.consultor.toLowerCase())) return false;
            if (filters.renda) {
                const match = filters.renda.match(/([>=<]+)(\d+)/);
                if (match) {
                    const operator = match[1];
                    const targetNum = Number(match[2]);
                    const currentNum = Number(item.renda || 0);
                    if (!isNaN(targetNum)) {
                        if (operator === '=' && currentNum !== targetNum) return false;
                        if (operator === '>' && currentNum <= targetNum) return false;
                        if (operator === '<' && currentNum >= targetNum) return false;
                        if (operator === '>=' && currentNum < targetNum) return false;
                        if (operator === '<=' && currentNum > targetNum) return false;
                    }
                }
            }
            if (globalSearch) {
                const q = globalSearch.toLowerCase();
                return (item.nome || '').toLowerCase().includes(q) || (item.email || '').toLowerCase().includes(q) || (item.consultor || '').toLowerCase().includes(q);
            }
            return true;
        });

        result.sort((a, b) => {
            let valA: any, valB: any;
            if (sortKey === 'sla') {
                const daysA = getDaysInStage(a);
                const daysB = getDaysInStage(b);
                valA = (isNaN(Number(daysA)) || daysA === null) ? 0 : Number(daysA);
                valB = (isNaN(Number(daysB)) || daysB === null) ? 0 : Number(daysB);
            } else if (sortKey === 'acao') {
                const parseDateString = (d?: string) => {
                    if (!d) return 0;
                    if (d.includes('/')) {
                        const [day, month, year] = d.split('/').map(Number);
                        return new Date(year, month - 1, day).getTime();
                    }
                    if (d.includes('-')) return new Date(d).getTime();
                    return 0;
                };
                valA = parseDateString(a.dataAcao);
                valB = parseDateString(b.dataAcao);
                
                // Secondary sort by action name if dates are equal
                if (valA === valB) {
                    valA = a.acao || '';
                    valB = b.acao || '';
                }
            } else {
                valA = (a as any)[sortKey] ?? '';
                valB = (b as any)[sortKey] ?? '';
            }

            if (typeof valA === 'string') return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            return sortDir === 'asc' ? valA - valB : valB - valA;
        });
        return result;
    }, [leads, filters, sortKey, sortDir, globalSearch]);

    const handleSort = (key: string) => {
        if (sortKey === key) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };

    const toggleStatusFilter = (s: string) => {
        setFilters(prev => ({
            ...prev,
            status: prev.status.includes(s) ? prev.status.filter(i => i !== s) : [...prev.status, s]
        }));
    };
    const toggleAcaoFilter = (a: string) => {
        setFilters(prev => ({
            ...prev,
            acao: prev.acao.includes(a) ? prev.acao.filter(i => i !== a) : [...prev.acao, a]
        }));
    };

    const handleOpenWA = (l: Lead) => {
        setWaModalLead(l);
        setWaMessage(getClientWhatsAppMessage(l) || '');
    };

    const handleSendWA = () => {
        if (!waModalLead) return;
        window.open(getWhatsAppLink(waModalLead.celular || '', waMessage), '_blank');
        setWaModalLead(null);
    };

    const findConsultor = useCallback((lead: Lead) => {
        const nome = (lead.consultor || '').trim();
        if (!nome) return undefined;
        return consultores.find(c => (c.nome || '').trim().toLowerCase() === nome.toLowerCase());
    }, [consultores]);

    const handleOpenConsultantModal = (l: Lead) => {
        const consultor = findConsultor(l);
        setConsultantModalLead(l);
        setConsultantMessage(getConsultantWhatsAppMessage(l) || '');

        if (consultor?.whatsapp) setConsultantChannel('whatsapp');
        else if (consultor?.teams_link) setConsultantChannel('teams');
        else setConsultantChannel('whatsapp');
    };

    const handleSendConsultantMessage = () => {
        if (!consultantModalLead) return;
        const consultor = findConsultor(consultantModalLead);
        if (!consultor) return;

        if (consultantChannel === 'whatsapp' && consultor.whatsapp) {
            window.open(getWhatsAppLink(consultor.whatsapp, consultantMessage), '_blank');
            setConsultantModalLead(null);
            return;
        }

        if (consultantChannel === 'teams' && consultor.teams_link) {
            navigator.clipboard?.writeText(consultantMessage).catch(() => undefined);
            window.open(consultor.teams_link, '_blank');
            setConsultantModalLead(null);
        }
    };

    // Sub-componente de Card para Mobile
    const LeadCard = ({ lead }: { lead: Lead }) => {
        const days = getDaysInStage(lead);
        const slaMax = STAGE_SLAS[lead.status] || 1;
        const isBreached = days > slaMax;
        const consultor = findConsultor(lead);
        const canContactConsultant = !!(consultor?.whatsapp || consultor?.teams_link);
        
        return (
            <div 
                onClick={() => setSelectedLead(lead)}
                className="glass-card mb-3 p-4 bg-white/5 border border-white/5 active:scale-[0.98] transition-all"
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-[12px] font-black text-slate-300">
                            {(lead.nome || 'CL').split(' ').map((n: any) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-[13px] font-bold text-slate-100">{lead.nome || 'Sem Nome'}</h3>
                            <p className="text-[10px] text-slate-500">{lead.profissao || 'Sem profissÃƒÂ£o'}</p>
                        </div>
                    </div>
                    <StatusBadge status={lead.status || 'Lead'} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Consultor</span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            <span className="text-[10px] font-bold text-slate-300 truncate">{lead.consultor || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end text-right">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Tempo na Etapa</span>
                        <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold ${isBreached ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {days}d / {slaMax}d
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenWA(lead); }}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        <MessageCircle size={14} />
                        WhatsApp
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleOpenConsultantModal(lead); }}
                        disabled={!canContactConsultant}
                        className={`w-10 h-10 rounded-xl border inline-flex items-center justify-center transition-colors ${canContactConsultant ? 'bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/20' : 'bg-white/5 border-white/10 text-slate-600 cursor-not-allowed'}`}
                        title={canContactConsultant ? 'Contato do consultor' : 'Consultor sem WhatsApp/Teams'}
                    >
                        <UserRound size={14} />
                    </button>
                    {lead.salesforceUrl && (
                        <a 
                            href={lead.salesforceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"
                        >
                            <SalesforceIcon color="#60a5fa" className="w-4 h-4" />
                        </a>
                    )}
                </div>
            </div>
        );
    };

    useEffect(() => {
        const handleBodyClick = (e: MouseEvent) => {
            if (!(e.target as Element).closest('.filter-container')) {
                setShowStatusFilter(false);
                setShowAcaoFilter(false);
                setShowRendaFilter(false);
            }
        };
        document.addEventListener('mousedown', handleBodyClick);
        return () => document.removeEventListener('mousedown', handleBodyClick);
    }, []);

    const SortIcon = ({ col }: { col: string }) => {
        if (sortKey !== col) return <ChevronDown className="w-3 h-3 ml-1" style={{ color: '#64748b' }} />;
        return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" style={{ color: '#60a5fa' }} /> : <ChevronDown className="w-3 h-3 ml-1" style={{ color: '#60a5fa' }} />;
    };

    const thCls = "px-5 py-4 border-b text-left" as const;
    const thStyle = { borderColor: 'rgba(255,255,255,0.05)' };
    const thLbl = { fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: '#cbd5e1', cursor: 'pointer' };
    const uniqueAcoes = useMemo(() => ACTION_OPTIONS.slice().sort((a, b) => a.localeCompare(b, 'pt-BR')), []);
    const formatMoneyNoCurrency = (v: number | string | null | undefined) => {
        if (v === null || v === undefined || v === '') return '--';
        const value = typeof v === 'string' ? Number(v.replace(/\D/g, '')) : Number(v);
        if (Number.isNaN(value)) return '--';
        return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value);
    };

    return (
        <main className="p-2 lg:p-6 max-w-[1600px] mx-auto min-h-screen">
            {waModalLead && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(2,6,15,0.85)', backdropFilter: 'blur(16px)' }} onClick={() => setWaModalLead(null)}>
                    <div className="w-full max-w-lg p-8 rounded-3xl animate-in" style={{ background: 'rgba(8,15,30,0.95)', border: '1px solid rgba(16,185,129,0.25)', boxShadow: '0 0 60px rgba(16,185,129,0.15)', backdropFilter: 'blur(30px)' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', boxShadow: '0 0 16px rgba(16,185,129,0.20)' }}><MessageCircle size={18} style={{ color: '#6ee7b7' }} /></div>
                                <h3 className="font-black text-white uppercase tracking-widest text-[12px]">WhatsApp DinÃƒÂ¢mico</h3>
                            </div>
                            <button onClick={() => setWaModalLead(null)} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8' }}><X size={16} /></button>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-5">
                            {Object.values(getSnippets(waModalLead)).map((tmpl, idx) => (
                                <button key={idx} onClick={() => setWaMessage(tmpl)} className="text-[9px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = '#6ee7b7'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(16,185,129,0.25)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLButtonElement).style.color = '#cbd5e1'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                                    OpÃƒÂ§ÃƒÂ£o {idx + 1}
                                </button>
                            ))}
                        </div>
                        <textarea className="w-full text-[13px] min-h-[140px] rounded-2xl resize-none outline-none p-5 leading-relaxed" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#f8fafc', fontFamily: 'inherit' }} value={waMessage} onChange={e => setWaMessage(e.target.value)} />
                        <button onClick={handleSendWA} className="mt-5 w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest transition-all active:scale-95" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.75), rgba(5,150,105,0.80))', color: 'white', boxShadow: '0 0 24px rgba(16,185,129,0.30)', border: '1px solid rgba(16,185,129,0.30)' }}><Send size={15} /> Disparar Mensagem</button>
                    </div>
                </div>
            )}

            {consultantModalLead && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center" style={{ background: 'rgba(2,6,15,0.88)', backdropFilter: 'blur(16px)' }} onClick={() => setConsultantModalLead(null)}>
                    <div className="w-full max-w-lg p-8 rounded-3xl animate-in" style={{ background: 'rgba(8,15,30,0.95)', border: '1px solid rgba(59,130,246,0.25)', boxShadow: '0 0 60px rgba(59,130,246,0.15)', backdropFilter: 'blur(30px)' }} onClick={e => e.stopPropagation()}>
                        {(() => {
                            const consultor = findConsultor(consultantModalLead);
                            const snippets = getSnippets(consultantModalLead);
                            const templates = [
                                { label: 'Contexto Atual', text: getConsultantWhatsAppMessage(consultantModalLead) },
                                { label: 'Follow-up', text: snippets.followUpConsultor },
                                { label: 'Planejamento', text: snippets.cobrarPlanejamento },
                                { label: 'Fechamento', text: snippets.cobrarFechamento },
                                { label: 'Criar Lead', text: snippets.criarLeadConsultor },
                            ].filter(t => !!t.text);

                            const hasWhatsapp = !!consultor?.whatsapp;
                            const hasTeams = !!consultor?.teams_link;
                            const channelDisabled = (consultantChannel === 'whatsapp' && !hasWhatsapp) || (consultantChannel === 'teams' && !hasTeams);

                            return (
                                <>
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', boxShadow: '0 0 16px rgba(59,130,246,0.20)' }}><UserRound size={18} style={{ color: '#93c5fd' }} /></div>
                                            <h3 className="font-black text-white uppercase tracking-widest text-[12px]">Contato Consultor</h3>
                                        </div>
                                        <button onClick={() => setConsultantModalLead(null)} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8' }}><X size={16} /></button>
                                    </div>

                                    <div className="flex items-center gap-2 mb-4">
                                        <button
                                            onClick={() => setConsultantChannel('whatsapp')}
                                            disabled={!hasWhatsapp}
                                            className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${consultantChannel === 'whatsapp' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-white/5 text-slate-400 border-white/10'} ${!hasWhatsapp ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        >
                                            WhatsApp
                                        </button>
                                        <button
                                            onClick={() => setConsultantChannel('teams')}
                                            disabled={!hasTeams}
                                            className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${consultantChannel === 'teams' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-white/5 text-slate-400 border-white/10'} ${!hasTeams ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        >
                                            Teams
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-5">
                                        {templates.map((tmpl, idx) => (
                                            <button key={`${tmpl.label}-${idx}`} onClick={() => setConsultantMessage(tmpl.text)} className="text-[9px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1' }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = '#93c5fd'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(59,130,246,0.25)'; }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLButtonElement).style.color = '#cbd5e1'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                                                {tmpl.label}
                                            </button>
                                        ))}
                                    </div>

                                    <textarea className="w-full text-[13px] min-h-[140px] rounded-2xl resize-none outline-none p-5 leading-relaxed" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#f8fafc', fontFamily: 'inherit' }} value={consultantMessage} onChange={e => setConsultantMessage(e.target.value)} />
                                    <button
                                        onClick={handleSendConsultantMessage}
                                        disabled={channelDisabled}
                                        className={`mt-5 w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 ${channelDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        style={{ background: consultantChannel === 'teams' ? 'linear-gradient(135deg, rgba(99,102,241,0.75), rgba(67,56,202,0.80))' : 'linear-gradient(135deg, rgba(16,185,129,0.75), rgba(5,150,105,0.80))', color: 'white', boxShadow: consultantChannel === 'teams' ? '0 0 24px rgba(99,102,241,0.30)' : '0 0 24px rgba(16,185,129,0.30)', border: consultantChannel === 'teams' ? '1px solid rgba(99,102,241,0.30)' : '1px solid rgba(16,185,129,0.30)' }}
                                    >
                                        {consultantChannel === 'teams' ? <MessageSquare size={15} /> : <Send size={15} />}
                                        {consultantChannel === 'teams' ? 'Abrir Teams (copiar msg)' : 'Disparar WhatsApp'}
                                    </button>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Busca Mobile */}
            <div className="lg:hidden px-4 mb-4">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        autoFocus
                        type="text"
                        placeholder="Buscar por nome ou consultor..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-11 text-[13px] text-slate-100 placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-all font-medium"
                        value={filters.nome}
                        onChange={(e) => setFilters({ ...filters, nome: e.target.value })}
                    />
                </div>
            </div>

            {/* Cards Mobile */}
            <div className="lg:hidden px-1">
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse"></div>)}
                    </div>
                ) : filteredLeads.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <p className="text-slate-500 text-[13px]">Nenhum lead encontrado.</p>
                    </div>
                ) : (
                    filteredLeads.map(l => <LeadCard key={l.id} lead={l} />)
                )}
            </div>

            {/* Tabela Desktop */}
            <div className="hidden lg:block glass-card overflow-hidden">
                <div className="custom-scrollbar overflow-auto" style={{ maxHeight: 'calc(100vh - 140px)', minHeight: '450px' }}>
                    <table className="w-full text-left border-collapse" style={{ minWidth: '600px' }}>
                        <thead className="sticky top-0 z-40 bg-[#040810]/92 backdrop-blur-xl">
                            <tr>
                                <th className={thCls} style={{ ...thStyle, width: 170 }}>
                                    <div className="flex items-center justify-between">
                                        <button onClick={() => handleSort('status')} className="flex items-center hover:text-white transition-colors" style={thLbl}>Status <SortIcon col="status" /></button>
                                        <div className="relative filter-container">
                                            <button onClick={() => setShowStatusFilter(!showStatusFilter)} className="p-1.5 rounded-lg transition-all" style={{ background: filters.status.length > 0 ? 'rgba(37,99,235,0.15)' : 'transparent', color: filters.status.length > 0 ? '#60a5fa' : '#94a3b8', border: '1px solid transparent' }}><Filter size={13} /></button>
                                            {showStatusFilter && (
                                                <div className="absolute top-full left-0 mt-2 z-[60] p-2 animate-in" style={glassDropdown}>
                                                    <FilterMultiSelect
                                                        options={STAGES}
                                                        selected={filters.status}
                                                        onToggle={toggleStatusFilter}
                                                        onToggleAll={(nextAll) => setFilters(p => ({ ...p, status: nextAll ? [...STAGES] : [] }))}
                                                        renderLabel={(s, checked) => (
                                                            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: checked ? '#f1f5f9' : '#94a3b8' }}>{s}</span>
                                                        )}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </th>
                                <th className={`${thCls} hidden xl:table-cell`} style={{ ...thStyle, width: 190 }}>
                                    <div className="flex items-center justify-between">
                                        <button onClick={() => handleSort('acao')} className="flex items-center hover:text-white transition-colors" style={thLbl}>AÇÃO <SortIcon col="acao" /></button>
                                        <div className="relative filter-container">
                                            <button onClick={() => setShowAcaoFilter(!showAcaoFilter)} className="p-1.5 rounded-lg transition-all" style={{ color: filters.acao.length > 0 ? '#60a5fa' : '#94a3b8', background: filters.acao.length > 0 ? 'rgba(37,99,235,0.10)' : 'transparent', border: '1px solid transparent' }}><Filter size={13} /></button>
                                            {showAcaoFilter && (
                                                <div className="absolute top-full right-0 mt-2 z-[60] p-2" style={glassDropdown}>
                                                    <FilterMultiSelect
                                                        options={uniqueAcoes as string[]}
                                                        selected={filters.acao}
                                                        onToggle={toggleAcaoFilter}
                                                        onToggleAll={(nextAll) => setFilters(p => ({ ...p, acao: nextAll ? [...uniqueAcoes] : [] }))}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </th>
                                <th className={thCls} style={{ ...thStyle, width: 280 }}>
                                    <button onClick={() => handleSort('nome')} className="flex items-center hover:text-white transition-colors" style={thLbl}>Cliente <SortIcon col="nome" /></button>
                                </th>
                                <th className={`${thCls} table-cell`} style={{ ...thStyle, width: 220 }}>
                                    <button onClick={() => handleSort('consultor')} className="flex items-center hover:text-white transition-colors" style={thLbl}>Consultor <SortIcon col="consultor" /></button>
                                </th>
                                <th className={`${thCls} hidden sm:table-cell`} style={{ ...thStyle, width: 130 }}>
                                    <div className="flex items-center justify-start gap-2">
                                        <div className="relative filter-container">
                                            <button onClick={() => setShowRendaFilter(!showRendaFilter)} className="p-1.5 rounded-lg mr-1" style={{ color: filters.renda ? '#60a5fa' : '#94a3b8', background: filters.renda ? 'rgba(37,99,235,0.10)' : 'transparent', border: '1px solid transparent' }}><Filter size={13} /></button>
                                            {showRendaFilter && (
                                                <div className="absolute top-full right-0 mt-2 z-[60] p-3 flex items-center gap-2" style={{ ...glassDropdown, width: 180 }}>
                                                    <select style={{ background: 'transparent', border: 'none', color: '#cbd5e1', outline: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer', appearance: 'none', fontFamily: 'inherit' }} value={rendaOp} onChange={e => { setRendaOp(e.target.value); setFilters({ ...filters, renda: `${e.target.value}${rendaVal}` }); }}>
                                                        <option value="=">=</option><option value=">">{'>'}</option><option value="<">{'<'}</option><option value=">=">{'>='}</option><option value="<=">{'<='}</option>
                                                    </select>
                                                    <input autoFocus style={{ background: 'transparent', border: 'none', color: '#f8fafc', outline: 'none', fontSize: '11px', fontWeight: 700, fontFamily: 'inherit', width: '100%' }} placeholder="5000" value={rendaVal} onChange={e => { const c = e.target.value.replace(/\D/g, ''); setRendaVal(c); setFilters({ ...filters, renda: `${rendaOp}${c}` }); }} />
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => handleSort('renda')} className="flex items-center hover:text-white transition-colors" style={thLbl}>Renda <SortIcon col="renda" /></button>
                                    </div>
                                </th>
                                <th className={`${thCls} hidden lg:table-cell`} style={{ ...thStyle, width: 100 }}><button onClick={() => handleSort('sla')} className="flex items-center justify-center w-full hover:text-white transition-colors" style={thLbl}>SLA <SortIcon col="sla" /></button></th>
                                <th className={`${thCls} hidden lg:table-cell text-center`} style={{ ...thStyle, width: 120 }}>
                                    <span style={thLbl}>Contato</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? <TableSkeleton /> : filteredLeads.map(lead => (
                                <LeadRow key={lead.id} lead={lead} consultores={consultores} setSelectedLead={setSelectedLead} updateLeadStatus={updateLeadStatus} editingStatusLeadId={editingStatusLeadId} setEditingStatusLeadId={setEditingStatusLeadId} handleOpenWA={handleOpenWA} handleOpenConsultantModal={handleOpenConsultantModal} setFilters={setFilters} formatMoneyNoCurrency={formatMoneyNoCurrency} />
                            ))}
                            {!isLoading && filteredLeads.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}><Search className="w-5 h-5" style={{ color: '#475569' }} /></div>
                                            <span className="text-[12px] font-medium" style={{ color: '#cbd5e1' }}>Nenhum cliente encontrado.</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
});

const LeadRow = React.memo(({ lead, consultores, setSelectedLead, updateLeadStatus, editingStatusLeadId, setEditingStatusLeadId, handleOpenWA, handleOpenConsultantModal, setFilters, formatMoneyNoCurrency }: any) => {
    const rawDays = getDaysInStage(lead);
    const days = (isNaN(Number(rawDays)) || rawDays === null) ? 0 : Number(rawDays);
    const limit = STAGE_SLAS[lead.status] || 0;
    const isBreached = checkSLA(lead).isBreached && !['Ganho', 'Perdido', 'Cancelou'].includes(lead.status);
    const consultor = (consultores || []).find((c: Consultor) => (c.nome || '').trim().toLowerCase() === (lead.consultor || '').trim().toLowerCase());
    const canContactConsultant = !!(consultor?.whatsapp || consultor?.teams_link);

    return (
        <tr onClick={() => setSelectedLead(lead)} className="cursor-pointer transition-colors duration-100 group border-b border-white/5 hover:bg-blue-500/5">
            <td className="px-5 py-4 text-center">
                <div onClick={e => { e.stopPropagation(); setEditingStatusLeadId(editingStatusLeadId === lead.id ? null : lead.id); }} className="relative cursor-pointer inline-block">
                    <StatusBadge status={lead.status || 'Lead'} />
                    {editingStatusLeadId === lead.id && (
                        <div className="absolute top-full left-0 mt-2 w-52 z-[70] p-2 animate-in" style={glassDropdown} onMouseLeave={() => setEditingStatusLeadId(null)} onClick={e => e.stopPropagation()}>
                            <p className="text-[9px] font-black uppercase tracking-widest px-3 py-2 border-b mb-1" style={{ color: '#94a3b8', borderColor: 'rgba(255,255,255,0.06)' }}>Mudar Status</p>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                {STAGES.map(s => (
                                    <button key={s} onClick={() => { updateLeadStatus(lead, s); setEditingStatusLeadId(null); }} className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors hover:bg-white/5 ${lead.status === s ? 'bg-blue-500/10' : ''}`}>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider flex-1 ${lead.status === s ? 'text-slate-100' : 'text-slate-400'}`}>{s}</span>
                                        {lead.status === s && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </td>
            <td className="px-5 py-4 hidden xl:table-cell text-center">
                {lead.acao ? (
                    <div className="flex flex-col items-center gap-1"><button onClick={e => { e.stopPropagation(); setSelectedLead(lead); }} className="text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-200">{lead.acao}</button>{lead.dataAcao && <span className="text-[9px] font-black font-mono text-slate-100">{formatDate(lead.dataAcao)}</span>}</div>
                ) : <span className="text-[11px] font-mono text-slate-600">--</span>}
            </td>
            <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-[11px] font-black text-slate-300">{(lead.nome || 'CL').split(' ').map((n: any) => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                    <div className="flex flex-col max-w-[200px]"><span className="text-[12px] font-bold text-slate-100 truncate">{lead.nome || 'Sem Nome'}</span><span className="text-[10px] truncate mt-0.5 text-slate-400">{lead.profissao || 'Sem profissÃƒÂ£o'}</span></div>
                </div>
            </td>
            <td className="px-5 py-4 table-cell"><span onClick={(e) => { e.stopPropagation(); setFilters((p: any) => ({ ...p, consultor: lead.consultor || '' })); }} className="text-[12px] font-medium text-slate-400 group-hover:text-cyan-300 transition-colors hover:underline decoration-cyan-500/30 underline-offset-4 cursor-pointer">{lead.consultor || '--'}</span></td>
            <td className="px-5 py-4 hidden sm:table-cell text-center font-mono text-[13px] text-slate-400">{formatMoneyNoCurrency(lead.renda)}</td>
            <td className="px-5 py-4 hidden lg:table-cell">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${isBreached ? 'bg-rose-500/10 border-rose-500/20 shadow-lg shadow-rose-500/10' : 'bg-white/5 border-white/10'}`}>
                        <span className={`text-[12px] font-black font-mono ${isBreached ? 'text-rose-300' : 'text-slate-300'}`}>{days}d</span>
                        {isBreached && <AlertTriangle size={11} className="animate-pulse text-rose-300" />}
                    </div>
                    <span className="text-[8px] uppercase tracking-widest mt-1 text-slate-500">Limite: {limit || 'N/A'}{limit > 0 ? 'd' : ''}</span>
                </div>
            </td>
            <td className="px-5 py-4 hidden lg:table-cell text-center">
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleOpenWA(lead); }}
                        className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 inline-flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                        title="Contato com cliente (WhatsApp)"
                    >
                        <MessageCircle size={14} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleOpenConsultantModal(lead); }}
                        disabled={!canContactConsultant}
                        className={`w-9 h-9 rounded-xl border inline-flex items-center justify-center transition-colors ${canContactConsultant ? 'bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/20' : 'bg-white/5 border-white/10 text-slate-600 cursor-not-allowed'}`}
                        title={canContactConsultant ? 'Contato com consultor' : 'Consultor sem WhatsApp/Teams'}
                    >
                        <UserRound size={14} />
                    </button>
                </div>
            </td>
        </tr>
    );
});


