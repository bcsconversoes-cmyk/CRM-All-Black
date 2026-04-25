import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { ConsultantManagerModal } from './components/features/ConsultantManagerModal';
import { AuthScreen } from './components/ui/AuthScreen';
import { TopNavigation } from './components/features/TopNavigation';
import { LossReasonModal } from './components/features/LossReasonModal';
import { usePolicies } from './hooks/usePolicies';
import { PolicyTable } from './components/features/PolicyTable';
import { PolicyFormModal } from './components/features/PolicyFormModal';
import { Policy } from './types';
import { Toast } from './components/ui/Toast';

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
        changeLeadStatus,
        updateLeadInline
    } = useLeads();

    const [activeTab, setActiveTab] = useState<'leads' | 'dashboard' | 'apolices'>('leads');
    const [globalSearch, setGlobalSearch] = useState('');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [showNewLeadModal, setShowNewLeadModal] = useState(false);
    const [showConsultantManager, setShowConsultantManager] = useState(false);

    // Apólices
    const { policies, loading: policiesLoading, loadPolicies, addPolicy, editPolicy, removePolicy } = usePolicies();
    const [showPolicyForm, setShowPolicyForm] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
    const [policiesLoaded, setPoliciesLoaded] = useState(false);
    const [policySearch, setPolicySearch] = useState('');

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    /* 
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem('crm_auth_token') === 'VALID';
    });
    */

    useEffect(() => {
        if (isAuthenticated) {
            loadLeads(false);
        }
    }, [loadLeads, isAuthenticated]);

    // Carrega apólices na 1ª vez que o usuário entra na aba (lazy load)
    useEffect(() => {
        if (activeTab === 'apolices' && isAuthenticated && !policiesLoaded) {
            loadPolicies();
            setPoliciesLoaded(true);
        }
    }, [activeTab, isAuthenticated, policiesLoaded, loadPolicies]);

    if (!isAuthenticated) {
        return <AuthScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
    }


    // Implementação de Atalhos Globais
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey) {
                if (e.key === '1') {
                    setActiveTab('dashboard');
                    e.preventDefault();
                } else if (e.key === '2') {
                    setActiveTab('leads');
                    e.preventDefault();
                } else if (e.key === '3') {
                    setActiveTab('apolices');
                    e.preventDefault();
                } else if (e.key === '4') {
                    setShowConsultantManager(prev => !prev);
                    e.preventDefault();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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

    const [lossModalState, setLossModalState] = useState<{isOpen: boolean, lead: Lead | null, newStatus: string}>({isOpen: false, lead: null, newStatus: ''});
    const [lossReason, setLossReason] = useState('');

    const updateLeadStatus = async (lead: Lead, newStatus: string) => {
        if (lead.status === newStatus) return;
        
        if (newStatus === 'Perdido' || newStatus === 'Cancelou') {
            setLossModalState({ isOpen: true, lead, newStatus });
            return;
        }

        await changeLeadStatus(lead, newStatus);
    };

    const confirmLossStatus = async () => {
        if (!lossReason || !lossModalState.lead) return;
        
        const updates: Partial<Lead> = {
            status: lossModalState.newStatus,
            motivoPerda: lossReason,
            historico: [
                `Status atualizado para ${lossModalState.newStatus} — Motivo: ${lossReason}`,
                ...(lossModalState.lead.historico || [])
            ]
        };
        
        await updateLeadInline(lossModalState.lead, updates);
        setLossModalState({ isOpen: false, lead: null, newStatus: '' });
        setLossReason('');
    };

    // Ações rápidas do Dashboard — sem abrir o SideSheet
    const handleDashboardQuickAction = useCallback(async (lead: Lead, action: 'contactado' | 'agendar' | 'adiar' | 'alinhado') => {
        const now = new Date();
        const nowBr = now.toLocaleString('pt-BR');
        // Data no formato BR para o getDaysInStage parsear do historico
        const nowDateBr = now.toLocaleDateString('pt-BR');

        // "Adiar" = o SLA deve começar a contar a partir de amanhã
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDateBr = tomorrow.toLocaleDateString('pt-BR');

        // Tag especial lido pelo getDaysInStage para reiniciar o contador
        const slaTag = action === 'adiar'
            ? `[SLA ⏱️] Contador reiniciado manualmente em ${tomorrowDateBr}, 00:00:00`
            : `[SLA ⏱️] Contador reiniciado manualmente em ${nowDateBr}, 00:00:00`;

        const actionLabel: Record<string, string> = {
            contactado: '[✅ DASHBOARD] Contactado — tarefa rápida',
            agendar: '[✅ DASHBOARD] Status atualizado: marcado como Agendar',
            adiar: '[⏰ DASHBOARD] Adiado 1 dia',
            alinhado: '[✅ DASHBOARD] Alinhadocom Consultor',
        };

        const updates: Partial<Lead> = {
            historico: [
                slaTag,
                `${actionLabel[action]} em ${nowBr}`,
                ...(lead.historico || []),
            ],
            // dataUltimoStatus só existe no estado local, não no banco (removido pelo leadService)
            ...((action === 'contactado' || action === 'alinhado') && { dataUltimoStatus: nowDateBr }),
            ...(action === 'agendar'    && { acao: 'Agendar', dataUltimoStatus: nowDateBr }),
            ...(action === 'adiar'      && { dataUltimoStatus: tomorrowDateBr }),
        };

        await updateLeadInline(lead, updates);
    }, [updateLeadInline]);

    return (
        <div className="min-h-screen text-white font-sans antialiased" style={{ background: 'var(--bg-deep)' }}>
            <TopNavigation 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                setShowConsultantManager={setShowConsultantManager}
                setShowNewLeadModal={setShowNewLeadModal}
                globalSearch={globalSearch}
                setGlobalSearch={setGlobalSearch}
                leadsLength={leads.length}
                totalPatrimonioFormatado={formatMoney(totalPatrimonio)}
                loadLeads={loadLeads}
                isFetching={isFetching}
                apiError={!!apiError}
            />

            {loading ? (
                activeTab === 'dashboard' ? <DashboardSkeleton /> : <TableSkeleton />
            ) : activeTab === 'dashboard' ? (
                <Dashboard leads={leads} consultores={consultores} policies={policies} openLead={setSelectedLead} onQuickAction={handleDashboardQuickAction} />
            ) : activeTab === 'apolices' ? (
                <PolicyTable
                    policies={policies}
                    loading={policiesLoading}
                    initialSearch={policySearch}
                    onNew={() => { setEditingPolicy(null); setShowPolicyForm(true); }}
                    onEdit={(p) => { setEditingPolicy(p); setShowPolicyForm(true); }}
                    onDelete={removePolicy}
                    onRefresh={loadPolicies}
                />
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
                    onViewPolicies={(nome: string) => {
                        setPolicySearch(nome);
                        setActiveTab('apolices');
                        setSelectedLead(null);
                        setShowNewLeadModal(false);
                    }}
                    policies={policies}
                />
            )}

            <ConsultantManagerModal 
                isOpen={showConsultantManager}
                onClose={() => setShowConsultantManager(false)}
                consultores={consultores}
                leads={leads}
                onUpdate={() => loadLeads(true)}
            />

            <LossReasonModal 
                lossModalState={lossModalState as any}
                lossReason={lossReason}
                setLossReason={setLossReason}
                onClose={() => { setLossModalState({ isOpen: false, lead: null, newStatus: '' }); setLossReason(''); }}
                onConfirm={confirmLossStatus}
            />

            {/* Modal de Apólices */}
            <PolicyFormModal
                isOpen={showPolicyForm}
                editing={editingPolicy}
                onClose={() => { setShowPolicyForm(false); setEditingPolicy(null); }}
                leads={leads}
                onSave={editingPolicy
                    ? (data: any) => editPolicy(editingPolicy.id, data)
                    : addPolicy
                }
            />

            <Toast />
        </div>
    );
}