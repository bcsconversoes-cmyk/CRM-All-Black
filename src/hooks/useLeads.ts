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
                    'Pendência'
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

            const consultoresData = await leadService.getConsultores();
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
        const newHistorico = [...(lead.historico || []), `${new Date().toLocaleString('pt-BR')} - Novo Status: ${newStatus}`];

        // 1. Atualiza a UI imediatamente (0ms delay)
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: newStatus, historico: newHistorico } : l));

        try {
            // 2. Persiste no banco de dados
            await leadService.updateLeadStatus(lead.id, newStatus, newHistorico);
        } catch (err) {
            // 3. Em caso de falha, reverte para o estado anterior
            setLeads(oldLeads);
            console.error("Erro ao mudar status", err);
        }
    };

    return { leads, setLeads, consultores, setConsultores, loading, isFetching, apiError, loadLeads, changeLeadStatus };
}