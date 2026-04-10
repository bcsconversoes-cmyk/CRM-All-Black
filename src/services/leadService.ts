import { supabase } from '../utils/supabase';
import { Lead } from '../types';

export const getLeads = async () => {
    const { data, error } = await supabase.from('leads').select('*').order('id', { ascending: false });
    if (error) throw error;
    return data;
};

export const updateLeadStatus = async (id: number, status: string, historico: string[]) => {
    const { error } = await supabase.from('leads').update({ status, historico }).eq('id', id);
    if (error) throw error;
};

export const createLead = async (payload: Partial<Lead>) => {
    const dbPayload: any = { ...payload };
    delete dbPayload.id;
    delete dbPayload.rowIndex;

    if (dbPayload.nome !== undefined) {
        dbPayload.nomecliente = dbPayload.nome;
        delete dbPayload.nome;
    }

    const { data, error } = await supabase.from('leads').insert([dbPayload]).select().single();
    if (error) throw error;
    return data;
};

export const updateLead = async (id: number, payload: Partial<Lead>) => {
    const dbPayload: any = { ...payload };
    delete dbPayload.id;
    delete dbPayload.rowIndex;

    if (dbPayload.nome !== undefined) {
        dbPayload.nomecliente = dbPayload.nome;
        delete dbPayload.nome;
    }

    const { error } = await supabase.from('leads').update(dbPayload).eq('id', id);
    if (error) throw error;
};

export const deleteLead = async (id: number) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
};

export const getConsultores = async () => {
    const { data, error } = await supabase.from('consultores_equipe').select('*').eq('ativo', true);
    if (error) throw error;
    return data;
};

export const createConsultor = async (nome: string) => {
    const { data, error } = await supabase.from('consultores_equipe').insert([{ nome, ativo: true }]).select().single();
    if (error) throw error;
    return data;
};

export const updateConsultorLinks = async (id: number, links: { teams_link?: string, whatsapp?: string }) => {
    const { error } = await supabase.from('consultores_equipe').update(links).eq('id', id);
    if (error) throw error;
};