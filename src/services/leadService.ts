import { supabase } from '../utils/supabase';
import { Lead, Consultor } from '../types';
import { mapLeadFromDb, mapLeadToDb } from './leadMapper';

export const getLeads = async (): Promise<Lead[]> => {
    const { data, error } = await supabase.from('leads').select('*').order('id', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapLeadFromDb);
};

export const updateLeadStatus = async (id: number, status: string, historico: string[], dataUltimoStatus?: string) => {
    const payload: any = { status, historico, acao: '', dataAcao: '', data_acao: '' };
    const { error } = await supabase.from('leads').update(payload).eq('id', id);
    if (error) throw error;
};

export const createLead = async (payload: Partial<Lead>) => {
    const dbPayload = mapLeadToDb(payload);
    const { data, error } = await supabase.from('leads').insert([dbPayload]).select().single();
    if (error) throw error;
    return mapLeadFromDb(data);
};

export const updateLead = async (id: number, payload: Partial<Lead>) => {
    const dbPayload = mapLeadToDb(payload);
    const { error } = await supabase.from('leads').update(dbPayload).eq('id', id);
    if (error) throw error;
};

export const deleteLead = async (id: number) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
};

export const getConsultores = async () => {
    const { data, error } = await supabase.from('consultores_equipe').select('*').eq('ativo', true).order('nome', { ascending: true });
    if (error) throw error;
    return data;
};

export const getAllConsultores = async () => {
    const { data, error } = await supabase.from('consultores_equipe').select('*').order('nome', { ascending: true });
    if (error) throw error;
    return data;
};

export const createConsultor = async (nome: string) => {
    const { data, error } = await supabase.from('consultores_equipe').insert([{ nome, ativo: true }]).select().single();
    if (error) throw error;
    return data;
};

export const updateConsultor = async (id: string | number, payload: Partial<Consultor>, oldNome?: string) => {
    const { error } = await supabase.from('consultores_equipe').update(payload).eq('id', id);
    if (error) throw error;

    if (oldNome && payload.nome && payload.nome !== oldNome) {
        const { error: leadError } = await supabase.from('leads').update({ consultor: payload.nome }).eq('consultor', oldNome);
        if (leadError) throw leadError;
    }
};

export const updateConsultorLinks = async (id: string | number, links: { teams_link?: string, whatsapp?: string }) => {
    const { error } = await supabase.from('consultores_equipe').update(links).eq('id', id);
    if (error) throw error;
};

export const deleteConsultor = async (id: string | number) => {
    const { error } = await supabase.from('consultores_equipe').delete().eq('id', id);
    if (error) throw error;
};
