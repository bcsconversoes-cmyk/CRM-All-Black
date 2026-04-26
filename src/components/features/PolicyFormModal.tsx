import React, { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { Policy, PolicyStatus, Seguradora, SEGURADORAS, POLICY_STATUSES, Lead } from '../../types';
import { formatDate, parseDateInput } from '../../utils/helpers';
import { toast } from '../../utils/toast';

const INITIAL_FORM: Omit<Policy, 'id' | 'criadoEm'> = {
    numero: '',
    seguradora: 'Azos',
    nomeCliente: '',
    dataEmissao: new Date().toLocaleDateString('pt-BR'), // Data de hoje como padrão
    valorPremio: 0,
    status: 'Ativa',
    linkDrive: '',
    leadId: null,
};

interface Props {
    isOpen: boolean;
    editing: Policy | null;
    onClose: () => void;
    onSave: (data: Omit<Policy, 'id' | 'criadoEm'>) => Promise<any>;
    leads?: Lead[];
}

const inputCls  = 'w-full rounded-xl px-4 py-3 text-[13px] font-medium text-slate-100 outline-none transition-all placeholder:text-slate-600 focus:border-blue-500/60';
const inputStyle = { background: 'rgba(15,23,42,0.80)', border: '1px solid rgba(255,255,255,0.08)' };
const labelCls  = 'text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block';

const selectStyle = {
    ...inputStyle,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat' as const,
    backgroundPosition: 'right 12px center',
};

const STATUS_COLORS: Record<PolicyStatus, { bg: string; text: string; border: string }> = {
    'Ativa':    { bg: 'rgba(16,185,129,0.08)', text: '#6ee7b7', border: 'rgba(16,185,129,0.25)' },
    'Pendente': { bg: 'rgba(245,158,11,0.08)', text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
    'Cancelada':{ bg: 'rgba(244,63,94,0.08)',  text: '#fb7185', border: 'rgba(244,63,94,0.25)' },
};

export const PolicyFormModal: React.FC<Props> = ({ isOpen, editing, onClose, onSave, leads = [] }) => {
    const [form, setForm] = useState(INITIAL_FORM);
    const [saving, setSaving] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    
    // Estado local para o valor de exibição do prêmio (BR format)
    const [prizeDisplay, setPrizeDisplay] = useState('');

    // Carrega dados para edição ou reseta para novo
    useEffect(() => {
        if (editing) {
            const { id, criadoEm, ...rest } = editing as any;
            setForm(rest);
            // Formatar valor inicial para o padrão BR
            if (rest.valorPremio) {
                setPrizeDisplay(rest.valorPremio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            } else {
                setPrizeDisplay('');
            }
        } else {
            setForm(INITIAL_FORM);
            setPrizeDisplay('');
        }
    }, [editing, isOpen]);

    const set = (field: keyof typeof INITIAL_FORM, value: any) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const suggestions = leads.filter(l => l.nome.toLowerCase().includes(form.nomeCliente.toLowerCase()));

    const handleSelectLead = (l: Lead) => {
        set('nomeCliente', l.nome);
        set('leadId', l.id);
        setShowSuggestions(false);
        setFocusedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedIndex(prev => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter') {
            if (focusedIndex >= 0) {
                e.preventDefault();
                handleSelectLead(suggestions[focusedIndex]);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setFocusedIndex(-1);
        }
    };

    const handlePrizeChange = (val: string) => {
        // Permitir apenas números e uma vírgula
        let clean = val.replace(/[^\d,]/g, '');
        
        // Garantir que só existe uma vírgula
        const parts = clean.split(',');
        if (parts.length > 2) clean = parts[0] + ',' + parts.slice(1).join('');
        
        setPrizeDisplay(clean);
        
        // Converter para número para o estado interno
        const numeric = parseFloat(clean.replace(',', '.'));
        set('valorPremio', isNaN(numeric) ? 0 : numeric);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave({ ...form, valorPremio: Number(form.valorPremio) });
            onClose();
        } catch (error) {
            toast.error('Não foi possível salvar a apólice. Verifique sua conexão e permissões.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col animate-in slide-in-from-right duration-300"
                style={{ background: '#080e1c', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-7 py-5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                             style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.25)' }}>
                            <FileText size={14} style={{ color: '#93c5fd' }} />
                        </div>
                        <div>
                            <p className="text-[13px] font-black text-white">
                                {editing ? 'Editar Apólice' : 'Nova Apólice'}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Preencha os dados abaixo</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/[0.05]"
                    >
                        <X size={15} className="text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form id="policy-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-7 space-y-5">

                    {/* Número da Apólice */}
                    <div>
                        <label className={labelCls}>Número da Apólice *</label>
                        <input
                            type="text"
                            required
                            className={inputCls}
                            style={inputStyle}
                            value={form.numero}
                            onChange={e => set('numero', e.target.value)}
                            placeholder="Ex: 2024-APZ-00142"
                        />
                    </div>

                    {/* Seguradora */}
                    <div>
                        <label className={labelCls}>Seguradora *</label>
                        <select
                            required
                            className={`${inputCls} appearance-none cursor-pointer`}
                            style={selectStyle}
                            value={form.seguradora}
                            onChange={e => set('seguradora', e.target.value as Seguradora)}
                        >
                            {SEGURADORAS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Nome do Cliente / Lead com Autocomplete Melhorado */}
                    <div className="relative">
                        <label className={labelCls}>Nome do Cliente *</label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                className={inputCls}
                                style={inputStyle}
                                value={form.nomeCliente}
                                onFocus={() => { setShowSuggestions(true); setFocusedIndex(-1); }}
                                onKeyDown={handleKeyDown}
                                onChange={e => {
                                    set('nomeCliente', e.target.value);
                                    if (form.leadId) set('leadId', null);
                                    setShowSuggestions(true);
                                    setFocusedIndex(-1);
                                }}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                placeholder="Digite para buscar cliente..."
                            />
                            {showSuggestions && (
                                <div className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto z-50 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
                                     style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}>
                                    {suggestions.map((l, index) => (
                                        <button
                                            key={l.id}
                                            type="button"
                                            onClick={() => handleSelectLead(l)}
                                            onMouseEnter={() => setFocusedIndex(index)}
                                            className={`w-full px-4 py-3 text-left transition-colors border-b border-white/[0.04] last:border-0 ${
                                                focusedIndex === index ? 'bg-white/10' : 'hover:bg-white/5'
                                            }`}
                                        >
                                            <p className="text-[12px] font-bold text-white">{l.nome}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[9px] text-slate-500 uppercase tracking-tighter">Consultor: {l.consultor || 'N/A'}</span>
                                                <span className="text-[9px] text-blue-400 font-bold uppercase tracking-tighter bg-blue-400/10 px-1.5 rounded">Lead</span>
                                            </div>
                                        </button>
                                    ))}
                                    {form.nomeCliente && suggestions.length === 0 && (
                                        <div className="px-4 py-6 text-center">
                                            <p className="text-[11px] text-slate-500">Nenhum cliente encontrado.</p>
                                            <p className="text-[9px] text-slate-600 mt-1">O nome será salvo como texto avulso.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Datas e Prêmio */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Data de Emissão *</label>
                            <input
                                type="text"
                                required
                                className={`${inputCls} font-mono`}
                                style={{ ...inputStyle, color: '#60a5fa' }}
                                value={formatDate(form.dataEmissao)}
                                maxLength={10}
                                onChange={e => set('dataEmissao', parseDateInput(e.target.value))}
                                placeholder="DD/MM/AAAA"
                            />
                        </div>
                        <div className="relative">
                            <label className={labelCls}>Prêmio Mensal *</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-500">R$</span>
                                <input
                                    type="text"
                                    required
                                    className={`${inputCls} pl-10`}
                                    style={{ ...inputStyle, color: '#6ee7b7' }}
                                    value={prizeDisplay}
                                    onChange={e => handlePrizeChange(e.target.value)}
                                    onBlur={() => {
                                        if (form.valorPremio) {
                                            setPrizeDisplay(form.valorPremio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                                        }
                                    }}
                                    placeholder="0,00"
                                />
                            </div>
                        </div>
                    </div>
                        <div>
                            <label className={labelCls}>Status *</label>
                            <select
                                required
                                className={`${inputCls} appearance-none cursor-pointer`}
                                style={{
                                    ...selectStyle,
                                    ...(form.status ? {
                                        color: STATUS_COLORS[form.status as PolicyStatus]?.text,
                                    } : {})
                                }}
                                value={form.status}
                                onChange={e => set('status', e.target.value as PolicyStatus)}
                            >
                                {POLICY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                    {/* Link Drive */}
                    <div>
                        <label className={labelCls}>Link do Google Drive (Documento)</label>
                        <input
                            type="url"
                            className={inputCls}
                            style={inputStyle}
                            value={form.linkDrive || ''}
                            onChange={e => set('linkDrive', e.target.value)}
                            placeholder="https://drive.google.com/..."
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center gap-3 px-7 py-5 border-t border-white/[0.06]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-500 transition-all hover:text-slate-300"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="policy-form"
                        disabled={saving}
                        className="flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-white transition-all disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.90), rgba(6,182,212,0.75))' }}
                    >
                        {saving ? 'Salvando…' : editing ? 'Atualizar' : 'Salvar Apólice'}
                    </button>
                </div>
            </div>
        </>
    );
};
