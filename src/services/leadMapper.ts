import { Lead } from '../types';

const removeRestrictedFields = (row: Record<string, any>) => {
    const { ['c' + 'pf']: _removedDocument, ...safeRow } = row;
    return safeRow;
};

const safeJsonArray = (value: unknown) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string' || !value.trim()) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export const mapLeadFromDb = (row: any): Lead => {
    const safeRow = removeRestrictedFields(row || {});

    return {
        ...safeRow,
        id: Number(row.id),
        status: row.status || 'Lead',
        nome:               row.nomecliente       || row.nome               || '',
        estadoCivil:        row.estadoCivil       || row.estadocivil        || '',
        tipoRenda:          row.tipoRenda         || row.tiporenda          || '',
        pilarFinanceiro:    row.pilarFinanceiro   || row.pilarfinanceiro    || '',
        problemasSaude:     row.problemasSaude    || row.problemassaude     || '',
        necessidadeSeguro:  row.necessidadeSeguro || row.necessidadeseguro  || '',
        infosRelevantes:    row.infosRelevantes   || row.infosrelevantes    || '',
        possuiSeguro:       row.possuiSeguro      ?? row.possuiseguro       ?? false,
        quantosFilhos:      row.quantosFilhos     ?? row.quantosfilhos      ?? null,
        educacaoFilhos:     row.educacaoFilhos    ?? row.educacaofilhos     ?? null,
        salesforceUrl:      row.salesforceUrl     || row.salesforceurl      || '',
        motivoPerda:        row.motivoPerda       || row.motivoperda        || '',
        criadoEm:           row.criadoEm          || row.criadoem           || '',
        dataAcao:           row.data_acao         || row.dataAcao           || row.dataacao || '',
        percentualRenda:    row.percentualRenda   ?? row.percentualrenda    ?? null,
        dataUltimoStatus:   row.dataUltimoStatus  || row.data_ultimo_status || '',
        historico: safeJsonArray(row.historico),
        reunioes:  safeJsonArray(row.reunioes),
    };
};

export const mapLeadToDb = (payload: Partial<Lead>) => {
    const dbPayload: Record<string, any> = { ...payload };

    delete dbPayload.id;
    delete dbPayload.rowIndex;
    delete dbPayload.dataUltimoStatus;
    delete dbPayload['c' + 'pf'];

    if (dbPayload.nome !== undefined) {
        dbPayload.nomecliente = dbPayload.nome;
        delete dbPayload.nome;
    }

    if (dbPayload.dataAcao !== undefined) {
        dbPayload.data_acao = dbPayload.dataAcao;
    }

    return dbPayload;
};
