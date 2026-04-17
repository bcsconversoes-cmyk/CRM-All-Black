import { supabase } from '../utils/supabase';
import { Policy } from '../types';

// Mapeamento db → frontend
const mapFromDb = (row: any): Policy => ({
    id:            Number(row.id),
    numero:        row.numero        || '',
    seguradora:    row.seguradora    || 'Azos',
    nomeCliente:   row.nome_cliente  || row.nomecliente || '',
    leadId:        row.lead_id       ?? null,
    dataEmissao:   row.data_emissao  || '',
    valorPremio:   Number(row.valor_premio) || 0,
    status:        row.status        || 'Ativa',
    linkDrive:     row.link_drive    || '',
    criadoEm:      row.criado_em     || row.created_at || '',
});

// Mapeamento frontend → db
const mapToDb = (payload: Partial<Omit<Policy, 'id'>>) => {
    const db: Record<string, any> = {};
    if (payload.numero        !== undefined) db.numero          = payload.numero;
    if (payload.seguradora    !== undefined) db.seguradora      = payload.seguradora;
    if (payload.nomeCliente   !== undefined) db.nome_cliente    = payload.nomeCliente;
    if (payload.leadId        !== undefined) db.lead_id         = payload.leadId;
    if (payload.dataEmissao   !== undefined) db.data_emissao    = payload.dataEmissao;
    if (payload.valorPremio   !== undefined) db.valor_premio    = payload.valorPremio;
    if (payload.status        !== undefined) db.status          = payload.status;
    if (payload.linkDrive     !== undefined) db.link_drive      = payload.linkDrive;
    return db;
};

export const getPolicies = async (): Promise<Policy[]> => {
    const { data, error } = await supabase
        .from('apolices')
        .select('*')
        .order('id', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapFromDb);
};

export const createPolicy = async (payload: Omit<Policy, 'id' | 'criadoEm'>): Promise<Policy> => {
    const dbPayload = mapToDb(payload);
    const { data, error } = await supabase
        .from('apolices')
        .insert([dbPayload])
        .select()
        .single();
    
    if (error) {
        console.error('Supabase Error (apolices):', error);
        throw error;
    }
    return mapFromDb(data);
};

export const updatePolicy = async (id: number, payload: Partial<Omit<Policy, 'id'>>): Promise<void> => {
    const { error } = await supabase
        .from('apolices')
        .update(mapToDb(payload))
        .eq('id', id);
    if (error) throw error;
};

export const deletePolicy = async (id: number): Promise<void> => {
    const { error } = await supabase
        .from('apolices')
        .delete()
        .eq('id', id);
    if (error) throw error;
};
