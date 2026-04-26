import { useState, useCallback } from 'react';
import { Lead, Consultor } from '../types';
import * as leadService from '../services/leadService';

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
            const data = await leadService.getLeads();
            const formatted: Lead[] = (data || []).map((l: any) => ({
                ...l,
                id: Number(l.id),
                // TRADUÇÃO: Banco de Dados -> Frontend
                // O PostgreSQL converte nomes não-quotados para lowercase
                // então temos fallbacks para ambos os formatos
                nome:               l.nomecliente       || l.nome               || '',
                estadoCivil:        l.estadoCivil       || l.estadocivil        || '',
                tipoRenda:          l.tipoRenda         || l.tiporenda          || '',
                pilarFinanceiro:    l.pilarFinanceiro   || l.pilarfinanceiro    || '',
                problemasSaude:     l.problemasSaude    || l.problemassaude     || '',
                necessidadeSeguro:  l.necessidadeSeguro || l.necessidadeseguro  || '',
                infosRelevantes:    l.infosRelevantes   || l.infosrelevantes    || '',
                possuiSeguro:       l.possuiSeguro      ?? l.possuiseguro       ?? false,
                quantosFilhos:      l.quantosFilhos     ?? l.quantosfilhos      ?? null,
                educacaoFilhos:     l.educacaoFilhos    ?? l.educacaofilhos     ?? null,
                salesforceUrl:      l.salesforceUrl     || l.salesforceurl      || '',
                motivoPerda:        l.motivoPerda       || l.motivoperda        || '',
                criadoEm:           l.criadoEm          || l.criadoem           || '',
                dataAcao:           l.dataAcao          || l.dataacao           || '',
                percentualRenda:    l.percentualRenda   ?? l.percentualrenda    ?? null,
                dataUltimoStatus:   l.dataUltimoStatus  || l.data_ultimo_status || '',
                historico: typeof l.historico === 'string' ? JSON.parse(l.historico) : (l.historico || []),
                reunioes:  typeof l.reunioes  === 'string' ? JSON.parse(l.reunioes)  : (l.reunioes  || [])
            }));

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

                const slaA = Number(a.sla) || 0;
                const slaB = Number(b.sla) || 0;
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
        // Formato que getDaysInStage sabe parsear (procura " → " e "em DD/MM/AAAA")
        const newHistorico = [
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
            // 2. Persiste no banco — inclui data_ultimo_status para reiniciar SLA
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