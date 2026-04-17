import { useState, useCallback } from 'react';
import { Policy } from '../types';
import * as policyService from '../services/policyService';

export function usePolicies() {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Buscar todas as apólices ───────────────────────────────────────────────
    const loadPolicies = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            const data = await policyService.getPolicies();
            setPolicies(data);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar apólices');
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Criar apólice com Optimistic UI ───────────────────────────────────────
    const addPolicy = useCallback(async (payload: Omit<Policy, 'id' | 'criadoEm'>) => {
        // Optimistic: insere com id temporário na UI
        const tempId = -Date.now();
        const optimistic: Policy = { ...payload, id: tempId };
        setPolicies(prev => [optimistic, ...prev]);

        try {
            const created = await policyService.createPolicy(payload);
            // Substitui o registro temporário pelo real (com id do banco)
            setPolicies(prev => prev.map(p => p.id === tempId ? created : p));
            return created;
        } catch (err: any) {
            // Rollback em caso de falha
            setPolicies(prev => prev.filter(p => p.id !== tempId));
            setError(err.message || 'Erro ao criar apólice');
            throw err;
        }
    }, []);

    // ── Atualizar apólice com Optimistic UI ───────────────────────────────────
    const editPolicy = useCallback(async (id: number, payload: Partial<Omit<Policy, 'id'>>) => {
        const snapshot = policies.find(p => p.id === id);
        // Optimistic update
        setPolicies(prev => prev.map(p => p.id === id ? { ...p, ...payload } : p));

        try {
            await policyService.updatePolicy(id, payload);
        } catch (err: any) {
            // Rollback
            if (snapshot) setPolicies(prev => prev.map(p => p.id === id ? snapshot : p));
            setError(err.message || 'Erro ao atualizar apólice');
            throw err;
        }
    }, [policies]);

    // ── Excluir apólice com Optimistic UI ─────────────────────────────────────
    const removePolicy = useCallback(async (id: number) => {
        const snapshot = policies.find(p => p.id === id);
        // Optimistic remove
        setPolicies(prev => prev.filter(p => p.id !== id));

        try {
            await policyService.deletePolicy(id);
        } catch (err: any) {
            // Rollback
            if (snapshot) setPolicies(prev => [snapshot, ...prev]);
            setError(err.message || 'Erro ao excluir apólice');
            throw err;
        }
    }, [policies]);

    return {
        policies,
        loading,
        error,
        loadPolicies,
        addPolicy,
        editPolicy,
        removePolicy,
    };
}
