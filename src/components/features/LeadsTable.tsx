import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check, Shield, MessageCircle, X, Send, AlertTriangle, Search, Filter } from 'lucide-react';
import { Lead, STAGES, STAGE_SLAS } from '../../types';
import { formatMoney, getSnippets, getWhatsAppLink, getDaysInStage, formatDate } from '../../utils/helpers';
import StatusBadge from '../ui/StatusBadge';

const SalesforceIcon = ({ className = 'w-4 h-4', color = '#00A1E0' }: { className?: string; color?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
        <path d="M10.02 5.34a4.56 4.56 0 0 1 3.23-1.32 4.6 4.6 0 0 1 4.2 2.74 3.64 3.64 0 0 1 1.47-.31 3.67 3.67 0 0 1 3.67 3.67 3.67 3.67 0 0 1-3.67 3.67H5.48A3.48 3.48 0 0 1 2 10.31a3.48 3.48 0 0 1 3.48-3.48c.22 0 .43.02.64.06a4.55 4.55 0 0 1 3.9-1.55Z" />
    </svg>
);

interface LeadsTableProps {
    leads: Lead[];
    globalSearch: string;
    setSelectedLead: (lead: Lead) => void;
    updateLeadStatus: (lead: Lead, newStatus: string) => Promise<void>;
}

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

export const LeadsTable = React.memo(function LeadsTable({ leads, globalSearch, setSelectedLead, updateLeadStatus }: LeadsTableProps) {
    const [filters, setFilters] = useState<any>({
        status: STAGES.filter(s => !['Ganho', 'Perdido', 'Cancelou'].includes(s)),
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
                    const target = parseInt(match[2], 10);
                    const current = item.renda || 0;
                    if (!isNaN(target)) {
                        if (operator === '=' && current !== target) return false;
                        if (operator === '>' && current <= target) return false;
                        if (operator === '<' && current >= target) return false;
                        if (operator === '>=' && current < target) return false;
                        if (operator === '<=' && current > target) return false;
                    }
                }
            }

            if (globalSearch) {
                const q = globalSearch.toLowerCase();
                if (!((item.nome || '').toLowerCase().includes(q) ||
                    (item.email || '').toLowerCase().includes(q) ||
                    (item.consultor || '').toLowerCase().includes(q))) {
                    return false;
                }
            }
            return true;
        });

        result.sort((a, b) => {
            if (sortKey === 'sla') {
                const valA = getDaysInStage(a);
                const valB = getDaysInStage(b);
                return sortDir === 'asc' ? valA - valB : valB - valA;
            }
            const aVal: any = (a as any)[sortKey];
            const bVal: any = (b as any)[sortKey];
            if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : String(bVal).localeCompare(String(aVal));
            return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        });
        return result;
    }, [leads, filters, sortKey, sortDir, globalSearch]);

    const handleSort = (key: string) => {
        if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };

    const toggleStatusFilter = (s: string) => {
        const newStatus = filters.status.includes(s) ? filters.status.filter((i: string) => i !== s) : [...filters.status, s];
        setFilters({ ...filters, status: newStatus });
    };

    const SortIcon = ({ col }: { col: string }) => {
        if (sortKey !== col) return <ChevronDown className="w-3 h-3 ml-1" style={{ color: '#64748b' }} />;
        return sortDir === 'asc'
            ? <ChevronUp className="w-3 h-3 ml-1" style={{ color: '#60a5fa' }} />
            : <ChevronDown className="w-3 h-3 ml-1" style={{ color: '#60a5fa' }} />;
    };

    const openWaModal = (lead: Lead, e: React.MouseEvent) => {
        e.stopPropagation();
        setWaModalLead(lead);
        const snippets = getSnippets(lead);
        setWaMessage(Object.values(snippets)[0] || '');
    };

    const sendWhatsApp = () => {
        if (!waModalLead) return;
        window.open(getWhatsAppLink(waModalLead.celular || '', waMessage), '_blank');
        setWaModalLead(null);
    };

    const thCls = "px-5 py-4 border-b text-left" as const;
    const thStyle = { borderColor: 'rgba(255,255,255,0.05)' };
    const thLbl = { fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: '#cbd5e1', cursor: 'pointer' };

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

    return (
        <main className="p-4 lg:p-6 max-w-[1600px] mx-auto min-h-screen">

            {waModalLead && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center"
                    style={{ background: 'rgba(2,6,15,0.85)', backdropFilter: 'blur(16px)' }}
                    onClick={() => setWaModalLead(null)}
                >
                    <div
                        className="w-full max-w-lg p-8 rounded-3xl animate-in"
                        style={{
                            background: 'rgba(8,15,30,0.95)',
                            border: '1px solid rgba(16,185,129,0.25)',
                            boxShadow: '0 0 60px rgba(16,185,129,0.15)',
                            backdropFilter: 'blur(30px)',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', boxShadow: '0 0 16px rgba(16,185,129,0.20)' }}>
                                    <MessageCircle size={18} style={{ color: '#6ee7b7' }} />
                                </div>
                                <h3 className="font-black text-white uppercase tracking-widest text-[12px]">WhatsApp Dinâmico</h3>
                            </div>
                            <button onClick={() => setWaModalLead(null)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8' }}>
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-5">
                            {Object.values(getSnippets(waModalLead)).map((tmpl, idx) => (
                                <button key={idx} onClick={() => setWaMessage(tmpl)}
                                    className="text-[9px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition-all"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1' }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.12)';
                                        (e.currentTarget as HTMLButtonElement).style.color = '#6ee7b7';
                                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(16,185,129,0.25)';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                                        (e.currentTarget as HTMLButtonElement).style.color = '#cbd5e1';
                                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
                                    }}>
                                    Opção {idx + 1}
                                </button>
                            ))}
                        </div>

                        <textarea
                            className="w-full text-[13px] min-h-[140px] rounded-2xl resize-none outline-none p-5 leading-relaxed"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#f8fafc', fontFamily: 'inherit' }}
                            value={waMessage}
                            onChange={e => setWaMessage(e.target.value)}
                            onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(16,185,129,0.35)'}
                            onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255,255,255,0.08)'}
                        />

                        <button onClick={sendWhatsApp}
                            className="mt-5 w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest transition-all active:scale-95"
                            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.75), rgba(5,150,105,0.80))', color: 'white', boxShadow: '0 0 24px rgba(16,185,129,0.30)', border: '1px solid rgba(16,185,129,0.30)' }}>
                            <Send size={15} /> Disparar Mensagem
                        </button>
                    </div>
                </div>
            )}

            <div className="glass-card">
                <div className="custom-scrollbar" style={{ maxHeight: 'calc(100vh - 140px)', overflowX: 'auto', overflowY: 'auto' }}>
                    <table className="w-full text-left border-collapse" style={{ minWidth: '1100px' }}>

                        <thead className="sticky top-0 z-40" style={{ background: 'rgba(4,8,16,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                            <tr>
                                <th className={thCls} style={{ ...thStyle, width: 220 }}>
                                    <div className="flex items-center justify-between">
                                        <button onClick={() => handleSort('status')} className="flex items-center hover:text-white transition-colors" style={thLbl}>
                                            Status <SortIcon col="status" />
                                        </button>
                                        <div className="relative filter-container">
                                            <button onClick={() => setShowStatusFilter(!showStatusFilter)}
                                                className="p-1.5 rounded-lg transition-all"
                                                style={{ background: filters.status.length > 0 ? 'rgba(37,99,235,0.15)' : 'transparent', color: filters.status.length > 0 ? '#60a5fa' : '#94a3b8', border: '1px solid transparent' }}>
                                                <Filter size={13} />
                                            </button>
                                            {showStatusFilter && (
                                                <div className="absolute top-full left-0 mt-2 w-52 z-[60] p-2 animate-in" style={glassDropdown}>
                                                    {STAGES.map(s => {
                                                        const isSel = filters.status.includes(s);
                                                        return (
                                                            <div key={s} onClick={() => toggleStatusFilter(s)}
                                                                className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors"
                                                                style={{ background: isSel ? 'rgba(37,99,235,0.08)' : 'transparent' }}
                                                                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'}
                                                                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = isSel ? 'rgba(37,99,235,0.08)' : 'transparent'}>
                                                                <div className="w-3.5 h-3.5 rounded-[4px] flex items-center justify-center"
                                                                    style={{ background: isSel ? '#2563eb' : 'rgba(255,255,255,0.06)', border: isSel ? '1px solid #2563eb' : '1px solid rgba(255,255,255,0.12)' }}>
                                                                    {isSel && <Check className="w-2.5 h-2.5 text-white" />}
                                                                </div>
                                                                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isSel ? '#f1f5f9' : '#94a3b8' }}>{s}</span>
                                                            </div>
                                                        );
                                                    })}
                                                    {filters.status.length > 0 && (
                                                        <button onClick={e => { e.stopPropagation(); setFilters({ ...filters, status: [] }); }}
                                                            className="w-full mt-1.5 p-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors"
                                                            style={{ background: 'rgba(37,99,235,0.08)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.15)' }}>
                                                            Limpar filtros
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </th>

                                <th className={thCls} style={{ ...thStyle, width: 280 }}>
                                    <div className="flex items-center justify-between">
                                        <button onClick={() => handleSort('nome')} className="flex items-center hover:text-white transition-colors" style={thLbl}>
                                            Cliente <SortIcon col="nome" />
                                        </button>
                                        <div className="relative filter-container">
                                            <button onClick={() => setShowNameFilter(!showNameFilter)}
                                                className="p-1.5 rounded-lg transition-all"
                                                style={{ color: filters.nome ? '#60a5fa' : '#94a3b8', background: filters.nome ? 'rgba(37,99,235,0.10)' : 'transparent', border: '1px solid transparent' }}>
                                                <Search size={13} />
                                            </button>
                                            {showNameFilter && (
                                                <div className="absolute top-full left-0 mt-2 w-52 z-[60] p-3" style={glassDropdown}>
                                                    <input autoFocus style={glassInput} placeholder="Buscar cliente..." value={filters.nome} onChange={e => setFilters({ ...filters, nome: e.target.value })} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </th>

                                <th className={`${thCls} hidden lg:table-cell`} style={{ ...thStyle, width: 240 }}>
                                    <div className="flex items-center justify-between">
                                        <button onClick={() => handleSort('consultor')} className="flex items-center hover:text-white transition-colors" style={thLbl}>
                                            Consultor <SortIcon col="consultor" />
                                        </button>
                                        <div className="relative filter-container">
                                            <button onClick={() => setShowConsultorFilter(!showConsultorFilter)}
                                                className="p-1.5 rounded-lg"
                                                style={{ color: filters.consultor ? '#60a5fa' : '#94a3b8', background: filters.consultor ? 'rgba(37,99,235,0.10)' : 'transparent', border: '1px solid transparent' }}>
                                                <Search size={13} />
                                            </button>
                                            {showConsultorFilter && (
                                                <div className="absolute top-full left-0 mt-2 w-52 z-[60] p-3" style={glassDropdown}>
                                                    <input autoFocus style={glassInput} placeholder="Filtrar consultor..." value={filters.consultor} onChange={e => setFilters({ ...filters, consultor: e.target.value })} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </th>

                                <th className={`${thCls} hidden md:table-cell text-right`} style={{ ...thStyle, width: 160 }}>
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="relative filter-container">
                                            <button onClick={() => setShowRendaFilter(!showRendaFilter)}
                                                className="p-1.5 rounded-lg mr-1"
                                                style={{ color: filters.renda ? '#60a5fa' : '#94a3b8', background: filters.renda ? 'rgba(37,99,235,0.10)' : 'transparent', border: '1px solid transparent' }}>
                                                <Filter size={13} />
                                            </button>
                                            {showRendaFilter && (
                                                <div className="absolute top-full right-0 mt-2 z-[60] p-3 flex items-center gap-2" style={{ ...glassDropdown, width: 180 }}>
                                                    <select
                                                        style={{ background: 'transparent', border: 'none', color: '#cbd5e1', outline: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer', appearance: 'none', fontFamily: 'inherit' }}
                                                        value={rendaOp} onChange={e => { setRendaOp(e.target.value); setFilters({ ...filters, renda: `${e.target.value}${rendaVal}` }); }}>
                                                        <option value="=">=</option><option value=">">{'>'}</option><option value="<">{'<'}</option><option value=">=">{'>='}</option><option value="<=">{'<='}</option>
                                                    </select>
                                                    <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.10)' }} />
                                                    <input autoFocus
                                                        style={{ background: 'transparent', border: 'none', color: '#f8fafc', outline: 'none', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)', width: '100%' }}
                                                        placeholder="5000" value={rendaVal}
                                                        onChange={e => { const c = e.target.value.replace(/\D/g, ''); setRendaVal(c); setFilters({ ...filters, renda: `${rendaOp}${c}` }); }} />
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => handleSort('renda')} className="flex items-center hover:text-white transition-colors" style={thLbl}>
                                            Renda <SortIcon col="renda" />
                                        </button>
                                    </div>
                                </th>

                                <th className={`${thCls} hidden lg:table-cell`} style={{ ...thStyle, width: 120 }}>
                                    <button onClick={() => handleSort('sla')} className="flex items-center justify-center w-full hover:text-white transition-colors" style={thLbl}>
                                        SLA <SortIcon col="sla" />
                                    </button>
                                </th>

                                <th className={`${thCls} hidden xl:table-cell text-center`} style={{ ...thStyle, width: 200 }}>
                                    <button onClick={() => handleSort('acao')} className="flex items-center justify-center w-full hover:text-white transition-colors" style={thLbl}>
                                        Ação Operacional <SortIcon col="acao" />
                                    </button>
                                </th>

                                <th className={`${thCls} text-center`} style={{ ...thStyle, width: 140 }}>
                                    <span style={thLbl}>Links Úteis</span>
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredLeads.map(lead => {
                                const days = getDaysInStage(lead);
                                const limit = STAGE_SLAS[lead.status] || 0;
                                const isBreached = limit > 0 && days > limit && !['Ganho', 'Perdido', 'Cancelou'].includes(lead.status);

                                return (
                                    <tr
                                        key={lead.id}
                                        onClick={() => setSelectedLead(lead)}
                                        className="cursor-pointer transition-colors duration-100 group"
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(37,99,235,0.04)'}
                                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                                    >
                                        <td className="px-5 py-4">
                                            <div onClick={e => { e.stopPropagation(); setEditingStatusLeadId(editingStatusLeadId === lead.id ? null : lead.id); }}
                                                className="relative cursor-pointer inline-block">
                                                <StatusBadge status={lead.status || 'Lead'} />
                                                {editingStatusLeadId === lead.id && (
                                                    <div className="absolute top-full left-0 mt-2 w-52 z-[70] p-2 animate-in" style={glassDropdown}
                                                        onMouseLeave={() => setEditingStatusLeadId(null)}
                                                        onClick={e => e.stopPropagation()}>
                                                        <p className="text-[9px] font-black uppercase tracking-widest px-3 py-2 border-b mb-1" style={{ color: '#94a3b8', borderColor: 'rgba(255,255,255,0.06)' }}>Mudar Status</p>
                                                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                            {STAGES.map(s => {
                                                                const isCurrent = lead.status === s;
                                                                return (
                                                                    <button key={s} onClick={() => { updateLeadStatus(lead, s); setEditingStatusLeadId(null); }}
                                                                        className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors"
                                                                        style={{ background: isCurrent ? 'rgba(37,99,235,0.10)' : 'transparent' }}
                                                                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'}
                                                                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = isCurrent ? 'rgba(37,99,235,0.10)' : 'transparent'}>
                                                                        <span className="text-[10px] font-bold uppercase tracking-wider flex-1" style={{ color: isCurrent ? '#f1f5f9' : '#94a3b8' }}>{s}</span>
                                                                        {isCurrent && <Check className="w-3.5 h-3.5" style={{ color: '#10b981' }} />}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                                    <span className="text-[11px] font-black" style={{ color: '#cbd5e1' }}>
                                                        {(lead.nome || 'CL').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col max-w-[200px]">
                                                    <span className="text-[12px] font-bold text-slate-100 group-hover:text-white transition-colors truncate">{lead.nome || 'Sem Nome'}</span>
                                                    <span className="text-[10px] truncate mt-0.5" style={{ color: '#94a3b8' }}>{lead.profissao || 'Sem profissão'}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 hidden lg:table-cell">
                                            <span 
                                                onClick={(e) => { e.stopPropagation(); setFilters({ ...filters, consultor: lead.consultor || '' }); }}
                                                className="text-[12px] font-medium group-hover:text-cyan-300 transition-colors hover:underline decoration-cyan-500/30 underline-offset-4 cursor-pointer" 
                                                style={{ color: '#94a3b8' }}
                                            >
                                                {lead.consultor || '--'}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-right hidden md:table-cell">
                                            <span className="text-[13px] font-black font-mono" style={{ color: '#94a3b8' }}>
                                                {formatMoney(lead.renda)}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 hidden lg:table-cell">
                                            <div className="flex flex-col items-center justify-center text-center">
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                                                    style={isBreached
                                                        ? { background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.22)', boxShadow: '0 0 10px rgba(244,63,94,0.12)' }
                                                        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }
                                                    }>
                                                    <span className="text-[12px] font-black font-mono" style={{ color: isBreached ? '#fda4af' : '#cbd5e1' }}>
                                                        {days !== null && days !== undefined && !isNaN(Number(days)) ? `${days}d` : '-'}
                                                    </span>
                                                    {isBreached && <AlertTriangle size={11} strokeWidth={2.5} className="animate-pulse" style={{ color: '#fda4af' }} />}
                                                </div>
                                                <span className="text-[8px] uppercase tracking-widest mt-1" style={{ color: '#64748b' }}>Limite: {limit || 'N/A'}{limit > 0 ? 'd' : ''}</span>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 hidden xl:table-cell text-center">
                                            {lead.acao ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <button onClick={e => { e.stopPropagation(); setSelectedLead(lead); }}
                                                        className="text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-lg transition-all"
                                                        style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)', color: '#bfdbfe' }}>
                                                        {lead.acao}
                                                    </button>
                                                    {lead.dataAcao && <span className="text-[9px] font-black font-mono" style={{ color: '#f8fafc' }}>{formatDate(lead.dataAcao)}</span>}
                                                </div>
                                            ) : (
                                                <span className="text-[11px] font-mono" style={{ color: '#475569' }}>--</span>
                                            )}
                                        </td>

                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {lead.salesforceUrl
                                                    ? <a href={lead.salesforceUrl} target="_blank" rel="noopener noreferrer"
                                                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                                                        style={{ background: 'rgba(0,161,224,0.12)', border: '1px solid rgba(0,161,224,0.25)' }}
                                                        onClick={e => e.stopPropagation()} title="Salesforce">
                                                        <SalesforceIcon className="w-3.5 h-3.5" />
                                                    </a>
                                                    : <div className="w-8 h-8 rounded-xl flex items-center justify-center opacity-20 cursor-not-allowed"
                                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                        <SalesforceIcon className="w-3.5 h-3.5" color="#475569" />
                                                    </div>
                                                }

                                                {lead.possuiSeguro
                                                    ? <button className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                                                        style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', boxShadow: '0 0 12px rgba(139,92,246,0.12)' }}
                                                        title={`Seguradora: ${lead.seguradora || 'N/A'}`}
                                                        onClick={e => { e.stopPropagation(); setSelectedLead(lead); }}>
                                                        <Shield className="w-3.5 h-3.5" style={{ color: '#ddd6fe' }} />
                                                    </button>
                                                    : <div className="w-8 h-8 rounded-xl flex items-center justify-center opacity-20 cursor-not-allowed"
                                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                        <Shield className="w-3.5 h-3.5" style={{ color: '#475569' }} />
                                                    </div>
                                                }

                                                <button onClick={e => openWaModal(lead, e)}
                                                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                                                    style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', boxShadow: '0 0 12px rgba(16,185,129,0.10)' }}
                                                    title="WhatsApp">
                                                    <MessageCircle className="w-3.5 h-3.5" style={{ color: '#6ee7b7' }} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {filteredLeads.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                                <Search className="w-5 h-5" style={{ color: '#475569' }} />
                                            </div>
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