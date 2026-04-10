import { useState, useEffect, useMemo } from 'react';
import {
    Layout,
    BarChart3,
    Search,
    RefreshCw,
    Plus,
    User,
    DollarSign
} from 'lucide-react';
import { Lead } from './types';
import { formatMoney } from './utils/helpers';
import { Dashboard } from './components/features/Dashboard';
import { LeadsTable } from './components/features/LeadsTable';
import SideSheet from './components/features/SideSheet';
import { TableSkeleton, DashboardSkeleton } from './components/ui/Skeletons';
import { useLeads } from './hooks/useLeads';

export default function App() {
    const {
        leads,
        setLeads,
        consultores,
        setConsultores,
        loading,
        isFetching,
        apiError,
        loadLeads,
        changeLeadStatus
    } = useLeads();

    const [activeTab, setActiveTab] = useState<'leads' | 'dashboard'>('leads');
    const [globalSearch, setGlobalSearch] = useState('');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [showNewLeadModal, setShowNewLeadModal] = useState(false);

    useEffect(() => {
        loadLeads(false);
    }, [loadLeads]);

    // OTIMIZAÇÃO: Memoização do cálculo para evitar processamento inútil
    const totalPatrimonio = useMemo(() => {
        return leads.reduce((sum, l) => sum + (Number(l.patrimonio) || 0), 0);
    }, [leads]);

    // OTIMIZAÇÃO: Filtro global processado antes de descer para a tabela
    const filteredLeads = useMemo(() => {
        const query = globalSearch.toLowerCase().trim();
        if (!query) return leads;
        return leads.filter(l =>
            (l.nome || '').toLowerCase().includes(query) ||
            (l.consultor || '').toLowerCase().includes(query) ||
            (l.email || '').toLowerCase().includes(query)
        );
    }, [leads, globalSearch]);

    const updateLeadStatus = async (lead: Lead, newStatus: string) => {
        if (lead.status === newStatus) return;
        await changeLeadStatus(lead, newStatus);
    };

    return (
        <div className="min-h-screen text-white font-sans antialiased" style={{ background: 'var(--bg-deep)' }}>
            <nav className="nav-glass h-[72px] px-6 lg:px-10 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3 cursor-default group">
                        <div className="relative w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, rgba(37,99,235,0.30), rgba(6,182,212,0.20))',
                                border: '1px solid rgba(99,179,237,0.20)',
                                boxShadow: '0 0 20px rgba(37,99,235,0.20)',
                            }}>
                            <div className="w-3.5 h-3.5 rounded-[3px] rotate-45"
                                style={{ background: 'linear-gradient(135deg, #60a5fa, #06b6d4)', boxShadow: '0 0 12px rgba(96,165,250,0.8)' }} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-[13px] tracking-[0.3em] uppercase leading-none text-white">Schmidt</span>
                            <span className="text-[7px] font-bold tracking-[0.6em] uppercase mt-0.5" style={{ color: '#475569' }}>Intelligence</span>
                        </div>
                    </div>

                    <div className="hidden md:flex p-1 rounded-xl gap-0.5"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {[
                            { id: 'leads', label: 'Leads', Icon: Layout },
                            { id: 'dashboard', label: 'Dashboard', Icon: BarChart3 },
                        ].map(({ id, label, Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id as any)}
                                className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                style={activeTab === id
                                    ? { background: 'rgba(37,99,235,0.20)', color: '#93c5fd', border: '1px solid rgba(37,99,235,0.25)' }
                                    : { background: 'transparent', color: '#64748b', border: '1px solid transparent' }
                                }
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 max-w-md mx-6 hidden lg:block">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input
                            className="w-full text-[11px] pl-10 pr-5 py-2.5 rounded-xl font-medium text-white placeholder:text-slate-600 outline-none transition-all"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                            placeholder="Buscar clientes, consultores..."
                            value={globalSearch}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden xl:flex items-center gap-4 px-4 py-2 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(37,99,235,0.15)' }}>
                                <User size={13} style={{ color: '#93c5fd' }} />
                            </div>
                            <div>
                                <p className="text-[13px] font-black leading-none text-white">{leads.length}</p>
                                <p className="text-[7px] uppercase tracking-widest mt-0.5" style={{ color: '#475569' }}>Leads</p>
                            </div>
                        </div>
                        <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.06)' }} />
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
                                <DollarSign size={13} style={{ color: '#6ee7b7' }} />
                            </div>
                            <div>
                                <p className="text-[12px] font-black font-mono leading-none text-white">{formatMoney(totalPatrimonio)}</p>
                                <p className="text-[7px] uppercase tracking-widest mt-0.5" style={{ color: '#475569' }}>Funil</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={() => loadLeads(true)} disabled={isFetching}
                            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                            style={{ background: 'rgba(255,255,255,0.04)', color: isFetching ? '#60a5fa' : '#475569' }}>
                            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                        </button>
                        <div className="w-2 h-2 rounded-full" style={
                            isFetching ? { background: '#60a5fa', boxShadow: '0 0 8px rgba(96,165,250,0.8)' } :
                                apiError ? { background: '#f43f5e', boxShadow: '0 0 8px rgba(244,63,94,0.6)' } :
                                    { background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.7)' }
                        } />

                        <div className="flex items-center gap-3 ml-2">
                            <button
                                onClick={() => window.open('https://docs.google.com/spreadsheets/d/1FYwlAyIrglSfvTqGsiFEXHC1NBfXX0QjgCrfR7g-PQE/edit#gid=1468277709', '_blank')}
                                className="flex items-center justify-center w-10 h-10 text-gray-400 bg-gray-800 rounded-full hover:text-white hover:bg-gray-700 transition-colors"
                                title="Planilha"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </button>
                            {/* Ícone Apresentação */}
                            <button className="flex items-center justify-center w-10 h-10 text-gray-400 bg-gray-800 rounded-full hover:text-white hover:bg-gray-700 transition-colors" title="Apresentação">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                            </button>
                            <button
                                onClick={() => { setSelectedLead(null); setShowNewLeadModal(true); }}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.90), rgba(6,182,212,0.75))', color: 'white' }}
                            >
                                Novo Lead
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {loading ? (
                activeTab === 'dashboard' ? <DashboardSkeleton /> : <TableSkeleton />
            ) : activeTab === 'dashboard' ? (
                <Dashboard leads={leads} openLead={setSelectedLead} />
            ) : (
                <LeadsTable
                    leads={filteredLeads}
                    globalSearch={globalSearch}
                    setSelectedLead={setSelectedLead}
                    updateLeadStatus={updateLeadStatus}
                />
            )}

            {(selectedLead || showNewLeadModal) && (
                <SideSheet
                    lead={selectedLead}
                    isNew={showNewLeadModal}
                    onClose={() => { setSelectedLead(null); setShowNewLeadModal(false); }}
                    leads={leads}
                    setLeads={setLeads}
                    consultores={consultores}
                    setConsultores={setConsultores}
                />
            )}
        </div>
    );
}