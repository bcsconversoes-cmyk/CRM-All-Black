import { useMemo } from 'react';
import { Lead, Consultor } from '../types';
import { checkSLA, getDaysInStage, getCadenceFlow } from '../utils/helpers';

export const useDashboardStats = (leads: Lead[], consultores: Consultor[]) => {
    return useMemo(() => {
        const ativos = leads.filter(l => !['Ganho', 'Perdido', 'Cancelou'].includes(l.status));
        const ganhos = leads.filter(l => l.status === 'Ganho');
        const perdidos = leads.filter(l => ['Perdido', 'Cancelou'].includes(l.status));

        const forecastTotal = ativos.reduce((sum, l) => sum + (Number(l.patrimonio) || 0), 0);
        const patrimonioGanho = ganhos.reduce((sum, l) => sum + (Number(l.patrimonio) || 0), 0);

        const reunioes = [
            ...ativos.filter(l => l.acao === 'Agendado'),
            ...ativos.filter(l => l.acao === 'No Show')
        ];
        const noShowRate = reunioes.length > 0
            ? Math.round((reunioes.filter(r => r.acao === 'No Show').length / reunioes.length) * 100)
            : 0;

        // Follow-up Consultores — apenas leads com SLA estourado (todos os status ativos)
        const followUpConsultores = ativos
            .filter(l => checkSLA(l).isBreached)
            .sort((a, b) => getDaysInStage(b) - getDaysInStage(a));

        const slaBreached = ativos.filter(l => checkSLA(l).isBreached);

        const ranking = leads.reduce((acc: any, l) => {
            if (l.consultor && l.status === 'Ganho') {
                acc[l.consultor] = (acc[l.consultor] || 0) + 1;
            }
            return acc;
        }, {});

        const motivos  = perdidos.reduce((acc: any, l) => {
            const k = l.motivoPerda || 'Não Especificado';
            acc[k] = (acc[k] || 0) + 1;
            return acc;
        }, {});

        // Planejamentos pendentes (incompletos), por urgência
        const planejamentoPendente = ativos
            .filter(l => l.status === 'Planejamento' && l.acao !== 'Agendado')
            .sort((a, b) => {
                const sa = checkSLA(a), sb = checkSLA(b);
                if (sa.isBreached !== sb.isBreached) return sa.isBreached ? -1 : 1;
                return getDaysInStage(b) - getDaysInStage(a);
            });

        // Follow-up cliente — SLA estourado primeiro, depois Ações 'Agendar' e 'No Show'
        const followUpCliente = ativos
            .filter(l =>
                l.status === 'Follow-up' &&
                (checkSLA(l).isBreached || ['Agendar', 'No Show'].includes(l.acao || ''))
            )
            .sort((a, b) => {
                const breachA = checkSLA(a).isBreached;
                const breachB = checkSLA(b).isBreached;
                if (breachA !== breachB) return breachA ? -1 : 1;
                // Entre não-estourados: No Show antes de Agendar
                const actionPri = (acao: string) => acao === 'No Show' ? 0 : acao === 'Agendar' ? 1 : 2;
                const priA = actionPri(a.acao || '');
                const priB = actionPri(b.acao || '');
                if (priA !== priB) return priA - priB;
                return getDaysInStage(b) - getDaysInStage(a);
            });

        // Oportunidades em aberto por consultor (workload)
        const porConsultor = ativos.reduce((acc: any, lead) => {
            const nome = lead.consultor || 'Sem Atribuição';
            if (!acc[nome]) acc[nome] = { count: 0, leads: [] as typeof ativos, breached: 0 };
            acc[nome].count++;
            acc[nome].leads.push(lead);
            if (checkSLA(lead).isBreached) acc[nome].breached++;
            return acc;
        }, {});

        const oportunidades = Object.entries(porConsultor)
            .sort((a: any, b: any) => b[1].count - a[1].count)
            .slice(0, 8)
            .map(([nome, data]: any) => ({ nome, ...data }));

        return {
            leadsAtivos: ativos.length,
            leadsTotal: leads.length,
            forecastTotal,
            noShowRate,
            followUpConsultores,
            slaBreached,
            topConsultores: Object.entries(ranking).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5) as [string, number][],
            winRate: leads.length ? Math.round((ganhos.length / leads.length) * 100) : 0,
            lossRate: leads.length ? Math.round((perdidos.length / leads.length) * 100) : 0,
            patrimonioGanho,
            topMotivosPerda: Object.entries(motivos).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5),
            planejamentoPendente,
            followUpCliente,
            oportunidades,
        };
    }, [leads]);
};
