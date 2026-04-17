import React, { useState, useMemo } from 'react';
import { X, Search, User, MessageCircle, MessageSquare, Power, Save, AlertCircle, RefreshCw, Trash2, Check } from 'lucide-react';


import { Consultor, Lead } from '../../types';
import { formatPhone, getWhatsAppLink, formatDate, checkSLA } from '../../utils/helpers';
import { toast } from '../../utils/toast';
import { updateConsultor, deleteConsultor } from '../../services/leadService';
interface Props {
    isOpen: boolean;
    onClose: () => void;
    consultores: Consultor[];
    leads: Lead[];
    onUpdate: () => void;
}


export const ConsultantManagerModal: React.FC<Props> = ({ isOpen, onClose, consultores, leads, onUpdate }) => {
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [editData, setEditData] = useState<Partial<Consultor>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filtragem Regex e Ordem Alfabética
    const filteredConsultores = useMemo(() => {
        let regex: RegExp;
        try {
            regex = new RegExp(search, 'i');
        } catch {
            regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        }

        return [...consultores]
            .filter(c => regex.test(c.nome))
            .sort((a, b) => a.nome.localeCompare(b.nome));
    }, [consultores, search]);

    const handleStartEdit = (c: Consultor) => {
        setEditingId(c.id || null);
        setEditData({ ...c });
    };

    const handleSave = async (oldName: string) => {
        if (!editingId || !editData.nome) return;
        setIsSaving(true);
        setError(null);
        try {
            await updateConsultor(editingId, editData, oldName);
            setEditingId(null);
            onUpdate();
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar alterações');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleStatus = async (c: Consultor) => {
        setError(null);
        try {
            await updateConsultor(c.id!, { ativo: !c.ativo });
            onUpdate();
        } catch (err: any) {
            setError(err.message || 'Erro ao alterar status');
        }
    };

    const generateSummaryMessage = (consultorNome: string) => {
        const activeLeads = leads.filter(l => 
            l.consultor === consultorNome && 
            !['Ganho', 'Perdido', 'Cancelou'].includes(l.status)
        );

        if (activeLeads.length === 0) return null;

        let msg = `📌 Relatório de Leads Ativos - ${consultorNome}\n\n`;
        activeLeads.forEach((l, index) => {
            msg += `${index + 1}) ${l.nome || 'Cliente Sem Nome'} --> Status: ${l.status} | Ação: ${l.acao || 'A definir'}`;
            if (l.dataAcao) {
                msg += ` para ${formatDate(l.dataAcao)}`;
            }
            msg += `\n`;
        });

        return msg;
    };

    const handleSendWhatsApp = (consultor: Consultor) => {
        if (!consultor.whatsapp) return toast.error("WhatsApp não cadastrado para este consultor.");
        const msg = generateSummaryMessage(consultor.nome);
        if (!msg) return toast.info("Este consultor não possui leads ativos no momento.");
        window.open(getWhatsAppLink(consultor.whatsapp, msg), '_blank');
    };

    const handleSendTeams = (consultor: Consultor) => {
        if (!consultor.teams_link) return toast.error("Link do Teams não cadastrado para este consultor.");
        const msg = generateSummaryMessage(consultor.nome);
        if (!msg) return toast.info("Este consultor não possui leads ativos no momento.");
        
        // Copiar para o clipboard pois o Teams não suporta pre-fill via URL de forma confiável
        navigator.clipboard.writeText(msg);
        window.open(consultor.teams_link, '_blank');
    };



    const handleDelete = async (id: string | number) => {
        const confirmResult = window.confirm("Deseja realmente excluir este consultor? Esta ação não pode ser desfeita.");
        if (!confirmResult) return;

        setError(null);
        try {
            await deleteConsultor(id);
            setEditingId(null);
            onUpdate();
        } catch (err: any) {
            setError(err.message || 'Erro ao excluir consultor');
        }
    };



    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-4xl bg-[#0B1121] border border-white/[0.08] rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                {/* Header */}
                <div className="p-6 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <User className="text-blue-400 w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Gestão de Equipe</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Contatos e Consultores</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-6 border-b border-white/[0.05] bg-white/[0.01]">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            autoFocus
                            className="w-full bg-[#0d1526] border border-white/[0.08] rounded-2xl pl-11 pr-5 py-3.5 text-[13px] font-medium text-white placeholder:text-slate-600 outline-none focus:border-blue-500/40 transition-all shadow-inner"
                            placeholder="Pesquisar consultores (suporta regex)..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    {error && (
                        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-[11px] font-bold animate-in">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
                    {filteredConsultores.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-30">
                            <RefreshCw size={40} className="text-slate-500 mb-4 animate-spin-slow" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Nenhum consultor encontrado</p>
                        </div>
                    ) : filteredConsultores.map(c => {
                        const isEditing = editingId === c.id;
                        return (
                            <div key={c.id} className={`p-4 rounded-2xl border transition-all duration-300 ${c.ativo ? 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]' : 'bg-black/20 border-white/[0.03] opacity-60'}`}>
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome Completo</label>
                                                <input 
                                                    className="w-full bg-black/40 border border-white/[0.1] rounded-xl px-4 py-2.5 text-[12px] font-bold text-white outline-none focus:border-blue-500/50"
                                                    value={editData.nome}
                                                    onChange={e => setEditData({ ...editData, nome: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">WhatsApp</label>
                                                <div className="relative">
                                                    <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500/50" />
                                                    <input 
                                                        className="w-full bg-black/40 border border-white/[0.1] rounded-xl pl-10 pr-4 py-2.5 text-[12px] font-mono text-white outline-none focus:border-emerald-500/50"
                                                        placeholder="(00) 00000-0000"
                                                        value={editData.whatsapp}
                                                        onChange={e => setEditData({ ...editData, whatsapp: formatPhone(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Link do Teams</label>
                                                <div className="relative">
                                                    <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400/50" />
                                                    <input 
                                                        className="w-full bg-black/40 border border-white/[0.1] rounded-xl pl-10 pr-4 py-2.5 text-[12px] font-medium text-white outline-none focus:border-indigo-500/50"
                                                        placeholder="https://teams.microsoft.com/..."
                                                        value={editData.teams_link}
                                                        onChange={e => setEditData({ ...editData, teams_link: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <button 
                                                onClick={() => handleDelete(c.id!)}
                                                className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 flex items-center gap-2 transition-colors"
                                            >
                                                <Trash2 size={12} /> Excluir Consultor
                                            </button>
                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={() => setEditingId(null)}
                                                    className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-400 transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                                <button 
                                                    disabled={isSaving}
                                                    onClick={() => handleSave(c.nome)}
                                                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-500 transition-all shadow-[0_4px_20px_rgba(37,99,235,0.3)] disabled:opacity-50"
                                                >
                                                    {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                                                    Salvar Alterações
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-black ${c.ativo ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-800 text-slate-600 opacity-50'}`}>
                                                {c.nome.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[13px] font-bold text-white">{c.nome}</p>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <MessageCircle size={12} className={`${c.whatsapp ? 'text-emerald-500' : 'text-slate-600'}`} />
                                                        <span className="text-[10px] font-mono text-slate-500">{c.whatsapp || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <MessageSquare size={12} className={`${c.teams_link ? 'text-indigo-400' : 'text-slate-600'}`} />
                                                        <span className="text-[10px] font-medium text-slate-500 truncate max-w-[150px]">{c.teams_link ? 'Link Configurado' : 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Badge de Pendências */}
                                            {(() => {
                                                const pendencias = leads.filter(l => 
                                                    l.consultor === c.nome && 
                                                    checkSLA(l).isBreached && 
                                                    !['Ganho', 'Perdido', 'Cancelou'].includes(l.status)
                                                ).length;

                                                if (pendencias > 0) {
                                                    return (
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 mr-2" title={`${pendencias} leads com SLA atrasado`}>
                                                            <AlertCircle size={14} />
                                                            <span className="text-[10px] font-black">{pendencias}</span>
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/50 border border-white/5 text-slate-500 mr-2" title="Nenhuma pendência de SLA">
                                                            <Check size={14} />
                                                            <span className="text-[10px] font-black">0</span>
                                                        </div>
                                                    );
                                                }
                                            })()}

                                            <div className="flex items-center gap-1.5 border-r border-white/5 pr-3 mr-1">
                                                <button 
                                                    onClick={() => c.whatsapp ? handleSendWhatsApp(c) : null}
                                                    disabled={!c.whatsapp}
                                                    className={`p-2.5 rounded-xl transition-all border ${c.whatsapp ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border-emerald-500/10 hover:border-emerald-500/30 cursor-pointer' : 'bg-white/5 text-slate-600 border-white/5 opacity-50 cursor-not-allowed'}`}
                                                    title={c.whatsapp ? "Enviar resumo via WhatsApp" : "WhatsApp não configurado"}
                                                >
                                                    <MessageCircle size={14} />
                                                </button>
                                                
                                                <button 
                                                    onClick={() => c.teams_link ? handleSendTeams(c) : null}
                                                    disabled={!c.teams_link}
                                                    className={`p-2.5 rounded-xl transition-all border ${c.teams_link ? 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-600 hover:text-white border-indigo-500/10 hover:border-indigo-500/30 cursor-pointer' : 'bg-white/5 text-slate-600 border-white/5 opacity-50 cursor-not-allowed'}`}
                                                    title={c.teams_link ? "Enviar resumo via Teams" : "Teams não configurado"}
                                                >
                                                    <MessageSquare size={14} />
                                                </button>
                                            </div>

                                            <button 
                                                onClick={() => handleToggleStatus(c)}
                                                className={`p-2.5 rounded-xl transition-all ${c.ativo ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                                                title={c.ativo ? "Desativar" : "Ativar"}
                                            >
                                                <Power size={14} />
                                            </button>

                                            <button 
                                                onClick={() => handleStartEdit(c)}
                                                className="px-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/[0.1] hover:text-white transition-all"
                                            >
                                                Editar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer Info */}
                <div className="p-4 bg-black/40 border-t border-white/[0.05] flex justify-center">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em]">
                        Alterações de nome refletirão em todos os leads vinculados automaticamente.
                    </p>
                </div>
            </div>
        </div>
    );
};
