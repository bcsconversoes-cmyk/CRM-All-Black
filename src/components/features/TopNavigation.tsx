import React, { useEffect, useRef } from 'react';
import { Layout, BarChart3, User, Search } from 'lucide-react';

interface TopNavigationProps {
    activeTab: 'leads' | 'dashboard';
    setActiveTab: (tab: 'leads' | 'dashboard') => void;
    setShowConsultantManager: (show: boolean) => void;
    setShowNewLeadModal: (show: boolean) => void;
    globalSearch: string;
    setGlobalSearch: (search: string) => void;
    leadsLength: number;
    totalPatrimonioFormatado: string;
    loadLeads: (force: boolean) => void;
    isFetching: boolean;
    apiError: boolean;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
    activeTab,
    setActiveTab,
    setShowConsultantManager,
    setShowNewLeadModal,
    globalSearch,
    setGlobalSearch,
    leadsLength,
    totalPatrimonioFormatado,
    loadLeads,
    isFetching,
    apiError
}) => {
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (activeTab === 'leads') {
            // Pequeno delay para garantir que o componente terminou o switch de renderização se necessário
            setTimeout(() => {
                searchRef.current?.focus();
            }, 50);
        }
    }, [activeTab]);

    return (
        <nav className="nav-glass h-[72px] px-6 lg:px-10 flex justify-between items-center sticky top-0 z-50">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2 -my-2 flex-grow lg:flex-grow-0">
                <div className="flex p-0.5 lg:p-1 rounded-xl gap-0.5 shrink-0"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {[
                        { id: 'dashboard', label: 'Dashboard', Icon: BarChart3 },
                        { id: 'leads',     label: 'Leads',     Icon: Layout },
                    ].map(({ id, label, Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id as any)}
                            className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 lg:gap-2 shrink-0"
                            style={activeTab === id
                                ? { background: 'rgba(37,99,235,0.20)', color: '#93c5fd', border: '1px solid rgba(37,99,235,0.25)' }
                                : { background: 'transparent', color: '#64748b', border: '1px solid transparent' }
                            }
                        >
                            <Icon className="w-3 lg:w-3.5 h-3 lg:h-3.5" />
                            {label}
                        </button>
                    ))}
                    
                    <div className="w-px h-4 bg-white/5 mx-1 self-center" />

                    <button
                        onClick={() => setShowConsultantManager(true)}
                        className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 lg:gap-2 bg-transparent text-[#64748b] border border-transparent hover:bg-white/[0.03] hover:text-white shrink-0"
                    >
                        <User className="w-3 lg:w-3.5 h-3 lg:h-3.5" />
                        Equipe
                    </button>
                </div>
            </div>

            <div className="flex-1 max-w-xs mx-4 hidden lg:block xl:max-w-md">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                        ref={searchRef}
                        type="text"
                        placeholder="Buscar negócios..."
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                        className="w-full text-[11px] pl-10 pr-5 py-2.5 rounded-xl font-medium text-white placeholder:text-slate-600 outline-none transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
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
                            <p className="text-[13px] font-black leading-none text-white">{leadsLength}</p>
                            <p className="text-[7px] uppercase tracking-widest mt-0.5" style={{ color: '#475569' }}>Leads</p>
                        </div>
                    </div>
                    <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
                            <span className="text-[13px] font-black" style={{ color: '#6ee7b7' }}>$</span>
                        </div>
                        <div>
                            <p className="text-[12px] font-black font-mono leading-none text-white">{totalPatrimonioFormatado}</p>
                            <p className="text-[7px] uppercase tracking-widest mt-0.5" style={{ color: '#475569' }}>Funil</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => loadLeads(true)} disabled={isFetching}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', color: isFetching ? '#60a5fa' : '#475569' }}>
                        <span className={isFetching ? 'animate-spin' : ''}>↻</span>
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
                        <button className="flex items-center justify-center w-10 h-10 text-gray-400 bg-gray-800 rounded-full hover:text-white hover:bg-gray-700 transition-colors" title="Apresentação">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                        </button>
                        <button
                            onClick={() => setShowNewLeadModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.90), rgba(6,182,212,0.75))', color: 'white' }}
                        >
                            Novo Lead
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};
