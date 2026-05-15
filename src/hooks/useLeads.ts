import { useState, useCallback } from 'react';
import { Lead, Consultor } from '../types';
import * as leadService from '../services/leadService';
import { getDaysInStage } from '../utils/helpers';

export function useLeads() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [consultores, setConsultores] = useState<Consultor[]>([]);

    const loadLeads = useCallback(async (forceRefresh = false) => {
        setApiError(null);
        if (leads.length === 0) setLoading(true);
        setIsFetching(true);

        try {
            const formatted = await leadService.getLeads();

            const sorted = formatted.sort((a, b) => {
                const ordemStatus = [
                    'Lead',
                    'Aguardando informações',
                    'Planejamento',
                    'Fechamento',
                    'Follow-up',
                    'Em Análise'
                ];
                const indexA = ordemStatus.indexOf(a.status || '');
                const indexB = ordemStatus.indexOf(b.status || '');

                if (indexA !== indexB) {
                    return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
                }

                const slaA = getDaysInStage(a);
                const slaB = getDaysInStage(b);
                return slaB - slaA;
            });

            setLeads(sorted);

            const consultoresData = await leadService.getAllConsultores();
            setConsultores(consultoresData);

        } catch (err: any) {
            setApiError(err.message || 'Erro ao carregar dados');
        } finally {
            setLoading(false);
            setIsFetching(false);
        }
    }, [leads.length]);

    const changeLeadStatus = async (lead: Lead, newStatus: string) => {
        const oldLeads = [...leads]; // Backup para rollback (Optimistic UI)
        const now = new Date();
        const nowBr = now.toLocaleString('pt-BR');
        const nowDateBr = now.toLocaleDateString('pt-BR');
        const slaTag = `[SLA] Contador reiniciado automaticamente em ${nowDateBr}, 00:00:00`;
        // Mantem historico humano e tag de SLA para persistir o reset apos refresh.
        const newHistorico = [
            slaTag,
            `De "${lead.status}" → "${newStatus}" em ${nowBr}`,
            ...(lead.historico || [])
        ];
        const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; // Data LOCAL para o banco

        // 1. Atualiza a UI imediatamente (Optimistic UI)
        setLeads(prev => prev.map(l =>
            l.id === lead.id
                ? { ...l, status: newStatus, acao: '', dataAcao: '', historico: newHistorico, dataUltimoStatus: todayIso }
                : l
        ));

        try {
            // 2. Persiste no banco — o reinicio do SLA fica gravado no historico
            await leadService.updateLeadStatus(lead.id, newStatus, newHistorico, todayIso);
        } catch (err) {
            // 3. Em caso de falha, reverte
            setLeads(oldLeads);
            console.error("Erro ao mudar status", err);
        }
    };

    /**
     * Atualiza campos arbitrários de um lead com optimistic UI e rollback automático.
     * Usado pelo dashboard para ações rápidas inline sem abrir o SideSheet.
     */
    const updateLeadInline = async (lead: Lead, updates: Partial<Lead>) => {
        const snapshot = { ...lead };
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, ...updates } : l));
        try {
            await leadService.updateLead(lead.id, updates);
        } catch (err) {
            setLeads(prev => prev.map(l => l.id === lead.id ? snapshot : l));
            console.error('Erro ao atualizar lead inline:', err);
            throw err;
        }
    };

    return { leads, setLeads, consultores, setConsultores, loading, isFetching, apiError, loadLeads, changeLeadStatus, updateLeadInline };
}
