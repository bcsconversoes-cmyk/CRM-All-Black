import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Check, Shield, MessageCircle, X, Send, AlertTriangle, Search, Filter } from 'lucide-react';
import { Lead, STAGES, STAGE_SLAS } from '../../types';
import { formatMoney, getSnippets, getWhatsAppLink, getDaysInStage, formatDate } from '../../utils/helpers';
import StatusBadge from '../ui/StatusBadge';

interface FilterState {
    status: string[];
    nome: string;
    consultor: string;
    renda: string;
}

interface LeadsTableProps {
    leads: Lead[];
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

const glassInput = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    color: '#e2e8f0',
    outline: 'none',
    width: '100%',
    fontSize: '11px',
    padding: '8px 12px',
    fontFamily: 'inherit',
} as React.CSSProperties;

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

export const LeadsTable = React.memo(function LeadsTable({ leads, isLoading = false, globalSearch, setSelectedLead, updateLeadStatus }: LeadsTableProps) {
    const [filters, setFilters] = useState<FilterState>({
        status: ['Lead', 'Planejamento', 'Fechamento', 'Follow-up', 'Em Análise'],
        nome: '',
        consultor: '',
        renda: ''
    });

    const [sortKey, setSortKey] = useState<string>('sla');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [showStatusFilter, setShowStatusFilter] = useState(false);
    const [showNameFilter, setShowNameFilter] = useState(false);
    const [showConsultorFilter, setShowConsultorFilter] = useState(false);
    const [showRendaFilter, setShowRendaFilter] = useState(false);
    const [rendaOp, setRendaOp] = useState('>=');
    const [rendaVal, setRendaVal] = useState('');
    const [editingStatusLeadId, setEditingStatusLeadId] = useState<number | null>(null);
    const [waModalLead, setWaModalLead] = useState<Lead | null>(null);
    const [waMessage, setWaMessage] = useState('');

    const filteredLeads = useMemo(() => {
        let result = leads.filter(item => {
            if (filters.status.length > 0 && !filters.status.includes(item.status)) return false;
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

    const handleOpenWA = (l: Lead) => {
        setWaModalLead(l);
        setWaMessage(getSnippets(l).followUpConsultor || '');
    };

    const handleSendWA = () => {
        if (!waModalLead) return;
        window.open(getWhatsAppLink(waModalLead.celular || '', waMessage), '_blank');
        setWaModalLead(null);
    };

    // Sub-componente de Card para Mobile
    const LeadCard = ({ lead }: { lead: Lead }) => {
        const days = getDaysInStage(lead);
        const slaMax = STAGE_SLAS[lead.status] || 1;
        const isBreached = days > slaMax;
        
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
                            <p className="text-[10px] text-slate-500">{lead.profissao || 'Sem profissão'}</p>
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
                setShowNameFilter(false);
                setShowConsultorFilter(false);
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

    return (
        <main className="p-2 lg:p-6 max-w-[1600px] mx-auto min-h-screen">
            {waModalLead && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(2,6,15,0.85)', backdropFilter: 'blur(16px)' }} onClick={() => setWaModalLead(null)}>
                    <div className="w-full max-w-lg p-8 rounded-3xl animate-in" style={{ background: 'rgba(8,15,30,0.95)', border: '1px solid rgba(16,185,129,0.25)', boxShadow: '0 0 60px rgba(16,185,129,0.15)', backdropFilter: 'blur(30px)' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', boxShadow: '0 0 16px rgba(16,185,129,0.20)' }}><MessageCircle size={18} style={{ color: '#6ee7b7' }} /></div>
                                <h3 className="font-black text-white uppercase tracking-widest text-[12px]">WhatsApp Dinâmico</h3>
                            </div>
                            <button onClick={() => setWaModalLead(null)} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8' }}><X size={16} /></button>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-5">
                            {Object.values(getSnippets(waModalLead)).map((tmpl, idx) => (
                                <button key={idx} onClick={() => setWaMessage(tmpl)} className="text-[9px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = '#6ee7b7'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(16,185,129,0.25)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLButtonElement).style.color = '#cbd5e1'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                                    Opção {idx + 1}
                                </button>
                            ))}
                        </div>
                        <textarea className="w-full text-[13px] min-h-[140px] rounded-2xl resize-none outline-none p-5 leading-relaxed" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#f8fafc', fontFamily: 'inherit' }} value={waMessage} onChange={e => setWaMessage(e.target.value)} />
                        <button onClick={handleSendWA} className="mt-5 w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest transition-all active:scale-95" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.75), rgba(5,150,105,0.80))', color: 'white', boxShadow: '0 0 24px rgba(16,185,129,0.30)', border: '1px solid rgba(16,185,129,0.30)' }}><Send size={15} /> Disparar Mensagem</button>
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
                                <th className={thCls} style={{ ...thStyle, width: 220 }}>
                                    <div className="flex items-center justify-between">
                                        <button onClick={() => handleSort('status')} className="flex items-center hover:text-white transition-colors" style={thLbl}>Status <SortIcon col="status" /></button>
                                        <div className="relative filter-container">
                                            <button onClick={() => setShowStatusFilter(!showStatusFilter)} className="p-1.5 rounded-lg transition-all" style={{ background: filters.status.length > 0 ? 'rgba(37,99,235,0.15)' : 'transparent', color: filters.status.length > 0 ? '#60a5fa' : '#94a3b8', border: '1px solid transparent' }}><Filter size={13} /></button>
                                            {showStatusFilter && (
                                                <div className="absolute top-full left-0 mt-2 w-52 z-[60] p-2 animate-in" style={glassDropdown}>
                                                    {STAGES.map(s => (
                                                        <div key={s} onClick={() => toggleStatusFilter(s)} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors" style={{ background: filters.status.includes(s) ? 'rgba(37,99,235,0.08)' : 'transparent' }}>
                                                            <div className="w-3.5 h-3.5 rounded-[4px] flex items-center justify-center" style={{ background: filters.status.includes(s) ? '#2563eb' : 'rgba(255,255,255,0.06)', border: filters.status.includes(s) ? '1px solid #2563eb' : '1px solid rgba(255,255,255,0.12)' }}>{filters.status.includes(s) && <Check className="w-2.5 h-2.5 text-white" />}</div>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: filters.status.includes(s) ? '#f1f5f9' : '#94a3b8' }}>{s}</span>
                                                        </div>
                                                    ))}
                                                    {filters.status.length > 0 && (
                                                        <div className="flex gap-1.5 mt-1.5">
                                                            <button onClick={e => { e.stopPropagation(); setFilters(p => ({ ...p, status: ['Lead', 'Planejamento', 'Fechamento', 'Follow-up', 'Em Análise'] })); }} className="flex-1 p-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors" style={{ background: 'rgba(37,99,235,0.08)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.15)' }}>Só Ativos</button>
                                                            <button onClick={e => { e.stopPropagation(); setFilters(p => ({ ...p, status: [] })); }} className="flex-1 p-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors" style={{ background: 'rgba(100,116,139,0.08)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.15)' }}>Ver Todos</button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </th>
                                <th className={thCls} style={{ ...thStyle, width: 280 }}>
                                    <div className="flex items-center justify-between">
                                        <button onClick={() => handleSort('nome')} className="flex items-center hover:text-white transition-colors" style={thLbl}>Cliente <SortIcon col="nome" /></button>
                                        <div className="relative filter-container">
                                            <button onClick={() => setShowNameFilter(!showNameFilter)} className="p-1.5 rounded-lg transition-all" style={{ color: filters.nome ? '#60a5fa' : '#94a3b8', background: filters.nome ? 'rgba(37,99,235,0.10)' : 'transparent', border: '1px solid transparent' }}><Search size={13} /></button>
                                            {showNameFilter && <div className="absolute top-full left-0 mt-2 w-52 z-[60] p-3" style={glassDropdown}><input autoFocus style={glassInput} placeholder="Buscar cliente..." value={filters.nome} onChange={e => setFilters({ ...filters, nome: e.target.value })} /></div>}
                                        </div>
                                    </div>
                                </th>
                                <th className={`${thCls} table-cell`} style={{ ...thStyle, width: 140 }}>
                                    <div className="flex items-center justify-between">
                                        <button onClick={() => handleSort('consultor')} className="flex items-center hover:text-white transition-colors" style={thLbl}>Consultor <SortIcon col="consultor" /></button>
                                        <div className="relative filter-container">
                                            <button onClick={() => setShowConsultorFilter(!showConsultorFilter)} className="p-1.5 rounded-lg" style={{ color: filters.consultor ? '#60a5fa' : '#94a3b8', background: filters.consultor ? 'rgba(37,99,235,0.10)' : 'transparent', border: '1px solid transparent' }}><Search size={13} /></button>
                                            {showConsultorFilter && <div className="absolute top-full left-0 mt-2 w-52 z-[60] p-3" style={glassDropdown}><input autoFocus style={glassInput} placeholder="Filtrar consultor..." value={filters.consultor} onChange={e => setFilters({ ...filters, consultor: e.target.value })} /></div>}
                                        </div>
                                    </div>
                                </th>
                                <th className={`${thCls} hidden sm:table-cell text-right`} style={{ ...thStyle, width: 120 }}>
                                    <div className="flex items-center justify-end gap-2">
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
                                <th className={`${thCls} hidden xl:table-cell text-center`} style={{ ...thStyle, width: 180 }}><button onClick={() => handleSort('acao')} className="flex items-center justify-center w-full hover:text-white transition-colors" style={thLbl}>Ação Operacional <SortIcon col="acao" /></button></th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? <TableSkeleton /> : filteredLeads.map(lead => (
                                <LeadRow key={lead.id} lead={lead} setSelectedLead={setSelectedLead} updateLeadStatus={updateLeadStatus} editingStatusLeadId={editingStatusLeadId} setEditingStatusLeadId={setEditingStatusLeadId} handleOpenWA={handleOpenWA} setFilters={setFilters} />
                            ))}
                            {!isLoading && filteredLeads.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center">
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

const LeadRow = React.memo(({ lead, setSelectedLead, updateLeadStatus, editingStatusLeadId, setEditingStatusLeadId, handleOpenWA, setFilters }: any) => {
    const rawDays = getDaysInStage(lead);
    const days = (isNaN(Number(rawDays)) || rawDays === null) ? 0 : Number(rawDays);
    const limit = STAGE_SLAS[lead.status] || 0;
    const isProtected = !!(lead.dataAcao && lead.dataAcao.trim());
    const isBreached = limit > 0 && days > limit && !isProtected && !['Ganho', 'Perdido', 'Cancelou'].includes(lead.status);

    return (
        <tr onClick={() => setSelectedLead(lead)} className="cursor-pointer transition-colors duration-100 group border-b border-white/5 hover:bg-blue-500/5">
            <td className="px-5 py-4">
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
            <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-[11px] font-black text-slate-300">{(lead.nome || 'CL').split(' ').map((n: any) => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                    <div className="flex flex-col max-w-[200px]"><span className="text-[12px] font-bold text-slate-100 truncate">{lead.nome || 'Sem Nome'}</span><span className="text-[10px] truncate mt-0.5 text-slate-400">{lead.profissao || 'Sem profissão'}</span></div>
                </div>
            </td>
            <td className="px-5 py-4 table-cell"><span onClick={(e) => { e.stopPropagation(); setFilters((p: any) => ({ ...p, consultor: lead.consultor || '' })); }} className="text-[12px] font-medium text-slate-400 group-hover:text-cyan-300 transition-colors hover:underline decoration-cyan-500/30 underline-offset-4 cursor-pointer">{lead.consultor || '--'}</span></td>
            <td className="px-5 py-4 text-right hidden sm:table-cell font-mono text-[13px] text-slate-400">{formatMoney(lead.renda)}</td>
            <td className="px-5 py-4 hidden lg:table-cell">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${isBreached ? 'bg-rose-500/10 border-rose-500/20 shadow-lg shadow-rose-500/10' : 'bg-white/5 border-white/10'}`}>
                        <span className={`text-[12px] font-black font-mono ${isBreached ? 'text-rose-300' : 'text-slate-300'}`}>{days}d</span>
                        {isBreached && <AlertTriangle size={11} className="animate-pulse text-rose-300" />}
                    </div>
                    <span className="text-[8px] uppercase tracking-widest mt-1 text-slate-500">Limite: {limit || 'N/A'}{limit > 0 ? 'd' : ''}</span>
                </div>
            </td>
            <td className="px-5 py-4 hidden xl:table-cell text-center">
                {lead.acao ? (
                    <div className="flex flex-col items-center gap-1"><button onClick={e => { e.stopPropagation(); setSelectedLead(lead); }} className="text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-200">{lead.acao}</button>{lead.dataAcao && <span className="text-[9px] font-black font-mono text-slate-100">{formatDate(lead.dataAcao)}</span>}</div>
                ) : <span className="text-[11px] font-mono text-slate-600">--</span>}
            </td>
        </tr>
    );
});