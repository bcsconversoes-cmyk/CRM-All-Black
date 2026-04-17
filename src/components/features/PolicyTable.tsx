import React, { useState, useMemo } from 'react';
import { Plus, ExternalLink, Pencil, Trash2, FileText, Search, RefreshCw } from 'lucide-react';
import { Policy, PolicyStatus, Seguradora } from '../../types';

interface Props {
    policies: Policy[];
    loading: boolean;
    onNew: () => void;
    onEdit: (policy: Policy) => void;
    onDelete: (id: number) => void;
    onRefresh: () => void;
    initialSearch?: string;
}

const STATUS_STYLES: Record<PolicyStatus, { bg: string; text: string; border: string; dot: string }> = {
    'Ativa':     { bg: 'rgba(16,185,129,0.10)', text: '#6ee7b7', border: 'rgba(16,185,129,0.25)', dot: '#10b981' },
    'Pendente':  { bg: 'rgba(245,158,11,0.10)', text: '#fbbf24', border: 'rgba(245,158,11,0.25)', dot: '#f59e0b' },
    'Cancelada': { bg: 'rgba(244,63,94,0.10)',  text: '#fb7185', border: 'rgba(244,63,94,0.25)',  dot: '#f43f5e' },
};

const SEGURADORA_COLORS: Record<Seguradora, string> = {
    'Azos':  '#60a5fa',
    'MAG':   '#a78bfa',
    'Icatu': '#34d399',
    'Omint': '#f97316',
};

function formatMoney(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function formatDate(iso: string) {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
}



export const PolicyTable: React.FC<Props> = ({ policies, loading, onNew, onEdit, onDelete, onRefresh, initialSearch = '' }) => {
    const [search, setSearch] = useState(initialSearch);
    const [filterStatus, setFilterStatus] = useState<PolicyStatus | 'Todas'>('Todas');
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    React.useEffect(() => {
        if (initialSearch) setSearch(initialSearch);
    }, [initialSearch]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return policies.filter(p => {
            const matchSearch = !q ||
                p.numero.toLowerCase().includes(q) ||
                p.nomeCliente.toLowerCase().includes(q) ||
                p.seguradora.toLowerCase().includes(q);
            const matchStatus = filterStatus === 'Todas' || p.status === filterStatus;
            return matchSearch && matchStatus;
        });
    }, [policies, search, filterStatus]);

    const totalMensal = useMemo(() =>
        filtered.filter(p => p.status === 'Ativa').reduce((sum, p) => sum + p.valorPremio, 0),
    [filtered]);

    const handleDeleteClick = (id: number) => {
        if (deleteConfirm === id) {
            onDelete(id);
            setDeleteConfirm(null);
        } else {
            setDeleteConfirm(id);
            setTimeout(() => setDeleteConfirm(null), 3000);
        }
    };

    return (
        <div className="p-3 lg:p-10 max-w-[1400px] mx-auto">

            {/* Header + Ações */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-[22px] font-black text-white tracking-tight">Gestão de Apólices</h2>
                    <p className="text-[12px] text-slate-500 mt-1">
                        {filtered.length} apólice{filtered.length !== 1 ? 's' : ''} · Prêmio ativo mensal:{' '}
                        <span style={{ color: '#6ee7b7' }} className="font-bold">{formatMoney(totalMensal)}</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#475569' }}
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={onNew}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all"
                        style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.90), rgba(6,182,212,0.75))' }}
                    >
                        <Plus size={13} />
                        Nova Apólice
                    </button>
                </div>
            </div>

            {/* Filtros e Busca */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 transition-colors group-focus-within:text-blue-400" />
                    <input
                        type="text"
                        placeholder="Buscar apólice, número ou cliente..."
                        className="w-full pl-11 pr-4 py-3 bg-[#0f172a] border border-white/5 rounded-2xl text-[13px] font-medium text-slate-100 outline-none focus:border-blue-500/40 transition-all placeholder:text-slate-600"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 custom-scrollbar lg:justify-end no-scrollbar">
                    {['Todas', ...Object.keys(STATUS_STYLES)].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s as any)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${
                                filterStatus === s
                                    ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                                    : 'bg-white/5 text-slate-500 border border-transparent hover:bg-white/10'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Estado vazio */}
            {!loading && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                         style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <FileText size={22} className="text-slate-600" />
                    </div>
                    <p className="text-[13px] text-slate-500 font-medium">
                        {search || filterStatus !== 'Todas' ? 'Nenhum resultado encontrado.' : 'Nenhuma apólice cadastrada ainda.'}
                    </p>
                    {!search && filterStatus === 'Todas' && (
                        <button
                            onClick={onNew}
                            className="mt-1 text-[11px] text-blue-400 hover:text-blue-300 font-bold transition-colors"
                        >
                            + Cadastrar primeira apólice
                        </button>
                    )}
                </div>
            )}

            {/* Tabela */}
            {filtered.length > 0 && (
                <div className="rounded-2xl overflow-hidden"
                     style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                    {[
                                        { label: 'Nº Apólice', class: 'table-cell' },
                                        { label: 'Seguradora', class: 'table-cell' },
                                        { label: 'Cliente',    class: 'table-cell' },
                                        { label: 'Emissão',    class: 'hidden lg:table-cell' },
                                        { label: 'Prêmio/mês', class: 'table-cell' },
                                        { label: 'Status',     class: 'table-cell' },
                                        { label: 'Doc.',       class: 'hidden sm:table-cell' },
                                        { label: '',           class: 'table-cell' }
                                    ].map(h => (
                                        <th key={h.label} className={`px-5 py-4 text-left text-[9px] font-black uppercase tracking-widest text-slate-500 ${h.class}`}>
                                            {h.label}
                                        </th>
                                    ))}
                            </thead>
                            <tbody>
                                {filtered.map(policy => {
                                    const st = STATUS_STYLES[policy.status];
                                    const isTemp = policy.id < 0; // id temporário enquanto salva

                                    return (
                                        <tr
                                            key={policy.id}
                                            className={`group transition-all ${isTemp ? 'opacity-60' : ''}`}
                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            {/* Nº Apólice */}
                                            <td className="px-5 py-4">
                                                <span className="text-[12px] font-mono text-white font-bold">{policy.numero}</span>
                                            </td>

                                            {/* Seguradora */}
                                            <td className="px-5 py-4">
                                                <span className="text-[12px] font-bold"
                                                      style={{ color: SEGURADORA_COLORS[policy.seguradora] || '#94a3b8' }}>
                                                    {policy.seguradora}
                                                </span>
                                            </td>

                                            {/* Cliente */}
                                            <td className="px-5 py-4">
                                                <span className="text-[12px] font-medium text-slate-200">{policy.nomeCliente}</span>
                                            </td>

                                            {/* Emissão */}
                                            <td className="px-5 py-4 hidden lg:table-cell">
                                                <span className="text-[11px] font-mono text-slate-400">{formatDate(policy.dataEmissao)}</span>
                                            </td>



                                            {/* Prêmio */}
                                            <td className="px-5 py-4">
                                                <span className="text-[12px] font-mono font-bold" style={{ color: '#6ee7b7' }}>
                                                    {formatMoney(policy.valorPremio)}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5 w-fit px-2.5 py-1.5 rounded-lg"
                                                     style={{ background: st.bg, border: `1px solid ${st.border}` }}>
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                                                    <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: st.text }}>
                                                        {policy.status}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Drive */}
                                            <td className="px-5 py-4 hidden sm:table-cell">
                                                {policy.linkDrive ? (
                                                    <a
                                                        href={policy.linkDrive}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-center w-7 h-7 rounded-lg transition-all hover:scale-110"
                                                        style={{ background: 'rgba(37,99,235,0.10)', border: '1px solid rgba(37,99,235,0.20)' }}
                                                    >
                                                        <ExternalLink size={11} style={{ color: '#93c5fd' }} />
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-700 text-[11px]">—</span>
                                                )}
                                            </td>

                                            {/* Ações */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => onEdit(policy)}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                                                        style={{ background: 'rgba(37,99,235,0.10)', border: '1px solid rgba(37,99,235,0.20)' }}
                                                        title="Editar"
                                                    >
                                                        <Pencil size={11} style={{ color: '#93c5fd' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(policy.id)}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                                                        style={deleteConfirm === policy.id
                                                            ? { background: 'rgba(244,63,94,0.25)', border: '1px solid rgba(244,63,94,0.5)' }
                                                            : { background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.18)' }
                                                        }
                                                        title={deleteConfirm === policy.id ? 'Clique novamente para confirmar' : 'Excluir'}
                                                    >
                                                        <Trash2 size={11} style={{ color: '#fb7185' }} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
