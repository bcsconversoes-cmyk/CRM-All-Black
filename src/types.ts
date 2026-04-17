export interface Reuniao {
    id: string;
    data: string;
    hora: string;
    titulo: string;
    status: 'Agendada' | 'Realizada' | 'Remarcada' | 'No-Show';
    anotacoes?: string;
}

export interface Consultor {
    id?: string | number;
    nome: string;
    whatsapp?: string;
    teams_link?: string;
    ativo?: boolean;
}

export interface Lead {
    id: number;
    rowIndex?: number;
    criadoEm: string;
    status: string;
    dataUltimoStatus?: string;
    probabilidade?: number | string;
    receitaEsperada?: number | string;
    consultor?: string;
    salesforceUrl?: string;
    celular?: string;
    cpf?: string;
    email?: string;
    nome?: string;
    profissao?: string;
    nascimento?: string;
    altura?: number | string;
    peso?: number | string;
    sexo?: string;
    estadoCivil?: string;
    renda?: number | string;
    despesas?: number | string;
    educacaoFilhos?: number | string;
    patrimonio?: number | string;
    previdencia?: number | string;
    quantosFilhos?: number | string;
    pilarFinanceiro?: string;
    problemasSaude?: string;
    necessidadeSeguro?: string;
    infosRelevantes?: string;
    motivoPerda?: string;
    observacoes?: string;
    possuiSeguro?: boolean;
    seguradora?: string;
    historico?: string[];
    reunioes?: Reuniao[];
    tipoRenda?: string;
    percentualRenda?: number;
    acao?: string;
    dataAcao?: string;
    sla?: number;
}


export const STAGES = [
    'Lead',
    'Planejamento',
    'Fechamento',
    'Follow-up',
    'Em Análise',
    'Ganho',
    'Perdido',
    'Cancelou'
];

export const STAGE_SLAS: Record<string, number> = {
    'Lead': 1,
    'Planejamento': 5,
    'Fechamento': 5,
    'Follow-up': 2,
    'Em Análise': 3,
    'Ganho': 0,
    'Perdido': 0,
    'Cancelou': 0
};

// ─── Módulo de Apólices ────────────────────────────────────────────────────────

export type PolicyStatus = 'Ativa' | 'Pendente' | 'Cancelada';
export type Seguradora = 'Azos' | 'MAG' | 'Icatu' | 'Omint';

export const SEGURADORAS: Seguradora[] = ['Azos', 'MAG', 'Icatu', 'Omint'];
export const POLICY_STATUSES: PolicyStatus[] = ['Ativa', 'Pendente', 'Cancelada'];

export interface Policy {
    id: number;
    numero: string;
    seguradora: Seguradora;
    nomeCliente: string;
    leadId?: number | null;       // FK opcional — preparada para relação futura
    dataEmissao: string;          // ISO date string (YYYY-MM-DD)
    valorPremio: number;          // valor mensal em R$
    status: PolicyStatus;
    linkDrive?: string;
    criadoEm?: string;
};