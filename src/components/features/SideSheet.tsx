import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, Loader2, MonitorPlay, Save, Trash2, X } from 'lucide-react';
import { Lead, Consultor } from '../../types';
import { checkFastTrack, getConsultantWhatsAppMessage, getWhatsAppLink } from '../../utils/helpers';
import { supabase } from '../../utils/supabase';
import * as leadService from '../../services/leadService';
import StatusBadgeImported from '../ui/StatusBadge';
import { LeadProfileForm, ProtectionDossier } from './LeadProfileForm';
import { FinancialDossier } from './FinancialDossier';
import { ConsultantAssignment } from './ConsultantAssignment';
import { ActionManager } from './ActionManager';
import { toast } from '../../utils/toast';

const SalesforceIcon = ({ className = 'w-4 h-4', color = '#00A1E0' }: { className?: string; color?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
        <path d="M10.02 5.34a4.56 4.56 0 0 1 3.23-1.32 4.6 4.6 0 0 1 4.2 2.74 3.64 3.64 0 0 1 1.47-.31 3.67 3.67 0 0 1 3.67 3.67 3.67 3.67 0 0 1-3.67 3.67H5.48A3.48 3.48 0 0 1 2 10.31a3.48 3.48 0 0 1 3.48-3.48c.22 0 .43.02.64.06a4.55 4.55 0 0 1 3.9-1.55Z" />
    </svg>
);

interface SideSheetProps {
    lead: Lead | null;
    isNew: boolean;
    onClose: () => void;
    leads: Lead[];
    setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
    consultores: Consultor[];
    setConsultores: React.Dispatch<React.SetStateAction<Consultor[]>>;
}

const makeDefaultLead = (): Lead => ({
    id: Date.now(),
    criadoEm: new Date().toLocaleString('pt-BR'),
    status: 'Lead',
    consultor: '',
    salesforceUrl: '',
    celular: '',
    email: '',
    nome: '',
    profissao: '',
    nascimento: '',
    altura: 0,
    peso: 0,
    sexo: 'Não Informado',
    estadoCivil: 'Solteiro(a)',
    renda: 0,
    despesas: 0,
    educacaoFilhos: 0,
    patrimonio: 0,
    previdencia: 0,
    quantosFilhos: 0,
    pilarFinanceiro: '',
    problemasSaude: '',
    necessidadeSeguro: '',
    infosRelevantes: '',
    motivoPerda: '',
    observacoes: '',
    possuiSeguro: false,
    seguradora: '',
    historico: [],
    reunioes: [],
    acao: '',
    dataAcao: '',
});

export default function SideSheet({
    lead: initialLead,
    isNew,
    onClose,
    leads,
    setLeads,
    consultores,
    setConsultores,
}: SideSheetProps) {
    const [lead, setLead] = useState<Lead>(initialLead || makeDefaultLead());
    const [saving, setSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [isNewConsultor, setIsNewConsultor] = useState(false);
    const [novoConsultorNome, setNovoConsultorNome] = useState('');
    const [tempLinks, setTempLinks] = useState({ whatsapp: '', teams_link: '' });
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);

    useEffect(() => {
        setLead(initialLead || makeDefaultLead());
        setHasUnsavedChanges(false);
    }, [initialLead]);

    useEffect(() => {
        const fetchConsultores = async () => {
            const { data, error } = await supabase.from('consultores_equipe').select('*').eq('ativo', true);
            if (data && !error) setConsultores(data);
        };
        fetchConsultores();
    }, [setConsultores]);

    const selectedConsultor = consultores.find(c => c.nome === lead.consultor);

    useEffect(() => {
        if (selectedConsultor) {
            setTempLinks({
                whatsapp: selectedConsultor.whatsapp || '',
                teams_link: selectedConsultor.teams_link || '',
            });
        }
    }, [selectedConsultor]);

    const handleCloseAttempt = useCallback(() => {
        if (isNewConsultor) {
            setIsNewConsultor(false);
            return;
        }
        if (hasUnsavedChanges) setShowCloseConfirm(true);
        else onClose();
    }, [hasUnsavedChanges, onClose, isNewConsultor]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (isNewConsultor) setIsNewConsultor(false);
                else if (showCloseConfirm) setShowCloseConfirm(false);
                else handleCloseAttempt();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleCloseAttempt, showCloseConfirm, isNewConsultor]);

    const handleUpdateLead = (updates: Partial<Lead>) => {
        let updated = { ...lead, ...updates };

        if (updates.acao === 'No Show') {
            const now = new Date().toLocaleString('pt-BR');
            const safeHistorico = Array.isArray(updated.historico) ? updated.historico : [];
            updated.historico = [`No-Show registrado na etapa de ${updated.status} em ${now}`, ...safeHistorico];
        }

        if (updates.status && updates.status !== lead.status) {
            const now = new Date();
            const nowBr = now.toLocaleString('pt-BR');
            const nowDateBr = now.toLocaleDateString('pt-BR');
            const safeHistorico = Array.isArray(updated.historico) ? updated.historico : [];

            updated.acao = '';
            updated.dataAcao = '';
            updated.dataUltimoStatus = now.toISOString().split('T')[0];
            updated.historico = [
                `[SLA] Contador reiniciado automaticamente em ${nowDateBr}, 00:00:00`,
                `De "${lead.status}" -> "${updated.status}" em ${nowBr}`,
                ...safeHistorico,
            ];
        }

        const fastTrackStatus = checkFastTrack(updated);
        const statusFoiAlteradoManualmente = Object.prototype.hasOwnProperty.call(updates, 'status');
        if (!statusFoiAlteradoManualmente && fastTrackStatus !== updated.status && ['Lead', 'Aguardando Informações'].includes(updated.status)) {
            const now = new Date().toLocaleString('pt-BR');
            const safeHistorico = Array.isArray(updated.historico) ? updated.historico : [];

            updated.status = fastTrackStatus;
            updated.acao = '';
            updated.dataAcao = '';
            updated.historico = [`[FAST-TRACK] Avançado automaticamente para ${fastTrackStatus} em ${now}`, ...safeHistorico];
        }

        setLead(updated);
        setHasUnsavedChanges(true);
    };

    const handleResetSLA = () => {
        const now = new Date();
        const dateIso = now.toISOString().split('T')[0];
        const nowBr = now.toLocaleString('pt-BR');
        const safeHistorico = Array.isArray(lead.historico) ? lead.historico : [];

        setLead(prev => ({
            ...prev,
            dataUltimoStatus: dateIso,
            historico: [`[SLA] Contador reiniciado manualmente em ${nowBr}`, ...safeHistorico],
        }));
        setHasUnsavedChanges(true);
    };

    const saveLead = async (): Promise<boolean> => {
        setSaving(true);
        try {
            if (isNew) {
                const data = await leadService.createLead(lead);
                setLeads([...leads, { ...lead, id: Number(data.id) }]);
            } else {
                await leadService.updateLead(lead.id, lead);
                setLeads(leads.map(l => l.id === lead.id ? lead : l));
            }

            setHasUnsavedChanges(false);
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 2000);
            return true;
        } catch (err: any) {
            toast.error(`Erro ao gravar: ${err.message}`);
            console.error('Erro no salvamento:', err);
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleAdicionarConsultor = async () => {
        if (!novoConsultorNome.trim()) {
            toast.error('Informe o nome do consultor.');
            return;
        }

        const jaExiste = consultores.some(c => c.nome.trim().toLowerCase() === novoConsultorNome.trim().toLowerCase());
        if (jaExiste) {
            toast.error('Esse consultor já está cadastrado.');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('consultores_equipe')
                .insert([{ nome: novoConsultorNome.trim(), ativo: true }])
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setConsultores([...consultores, data]);
                handleUpdateLead({ consultor: data.nome });
            }
        } catch (err: any) {
            toast.error(`Erro: ${err.message}`);
        } finally {
            setNovoConsultorNome('');
            setIsNewConsultor(false);
        }
    };

    const handleDeleteLead = async () => {
        if (window.confirm('Excluir este lead definitivamente?')) {
            setSaving(true);
            try {
                await leadService.deleteLead(lead.id);
                setLeads(leads.filter(l => l.id !== lead.id));
                onClose();
            } catch (err: any) {
                toast.error(`Erro: ${err.message}`);
                setSaving(false);
            }
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] overflow-y-auto custom-scrollbar flex flex-col items-center animate-in"
            style={{ background: 'rgba(2,6,15,0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        >
            {showCloseConfirm && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center" style={{ background: 'rgba(2,6,15,0.90)', backdropFilter: 'blur(24px)' }}>
                    <div className="glass-card p-8 w-full max-w-md">
                        <div className="flex items-center gap-4 mb-6">
                            <AlertTriangle size={24} className="text-amber-400" />
                            <div>
                                <h3 className="text-[14px] font-black text-white uppercase tracking-widest">Alterações Pendentes</h3>
                                <p className="text-[11px] text-slate-400">Deseja guardar as alterações antes de sair?</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button onClick={async () => { if (await saveLead()) { setShowCloseConfirm(false); onClose(); } }} className="w-full py-4 rounded-xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest">Salvar e Sair</button>
                            <button onClick={() => { setShowCloseConfirm(false); onClose(); }} className="w-full py-4 rounded-xl border border-rose-500/30 text-rose-400 text-[11px] font-black uppercase tracking-widest">Sair sem salvar</button>
                            <button onClick={() => setShowCloseConfirm(false)} className="w-full py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Continuar Editando</button>
                        </div>
                    </div>
                </div>
            )}

            {isNewConsultor && (
                <div className="fixed inset-0 z-[290] flex items-center justify-center" style={{ background: 'rgba(2,6,15,0.82)', backdropFilter: 'blur(14px)' }} onClick={() => setIsNewConsultor(false)}>
                    <div className="glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-[13px] font-black text-white uppercase tracking-widest mb-2">Novo Consultor</h3>
                        <p className="text-[11px] text-slate-400 mb-4">Adicione o consultor sem perder o que já está preenchido neste lead.</p>
                        <input
                            autoFocus
                            className="w-full bg-[#0f172a] border border-blue-500/25 rounded-xl px-4 py-3 text-[13px] font-semibold text-white outline-none focus:border-blue-500/60 transition-all"
                            placeholder="Nome completo do consultor"
                            value={novoConsultorNome}
                            onChange={e => setNovoConsultorNome(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAdicionarConsultor();
                            }}
                        />
                        <div className="mt-4 flex items-center justify-end gap-2">
                            <button onClick={() => setIsNewConsultor(false)} className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 text-[11px] font-bold uppercase tracking-wider hover:bg-white/5 transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handleAdicionarConsultor} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider hover:bg-blue-500 transition-colors">
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="sticky top-0 z-30 w-full py-3 lg:py-5 px-4 lg:px-10 bg-slate-950/90 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <StatusBadgeImported status={lead.status || 'Lead'} />
                            <span className="text-[10px] font-mono text-slate-500 tracking-wider">ID {lead.id} · {lead.criadoEm}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-black text-white"
                                    style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.25), rgba(6,182,212,0.20))', border: '1px solid rgba(255,255,255,0.08)' }}
                                >
                                    {lead.nome?.charAt(0) || '?'}
                                </div>
                                <h2 className="text-xl lg:text-3xl font-bold tracking-tight text-white truncate max-w-[250px] lg:max-w-md">
                                    {isNew ? 'Novo Lead' : lead.nome || 'Cliente Sem Nome'}
                                </h2>
                            </div>

                            {!isNew && (
                                <div className="flex items-center gap-2">
                                    {lead.salesforceUrl ? (
                                        <a
                                            href={lead.salesforceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
                                            style={{ background: 'rgba(0,161,224,0.10)', border: '1px solid rgba(0,161,224,0.20)' }}
                                            title="Salesforce"
                                        >
                                            <SalesforceIcon className="w-4 h-4" />
                                        </a>
                                    ) : (
                                        <div
                                            className="w-9 h-9 rounded-xl flex items-center justify-center opacity-20 cursor-not-allowed"
                                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                                        >
                                            <SalesforceIcon className="w-4 h-4" color="#475569" />
                                        </div>
                                    )}
                                    <button
                                        onClick={() => {
                                            const params = new URLSearchParams({
                                                id: lead.id.toString(),
                                                name: lead.nome || '',
                                                income: lead.renda?.toString() || '',
                                                networth: lead.patrimonio?.toString() || '',
                                            });
                                            window.open(`/apresentacao.html?${params.toString()}`, '_blank');
                                        }}
                                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                        title="Ver apresentação personalizada"
                                    >
                                        <MonitorPlay size={15} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-1 lg:p-1.5 rounded-2xl bg-white/5 border border-white/5 w-full sm:w-auto justify-end">
                        {!isNew && (
                            <button onClick={handleDeleteLead} disabled={saving} className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                                <Trash2 size={16} />
                            </button>
                        )}
                        <button
                            onClick={saveLead}
                            disabled={saving || (!hasUnsavedChanges && !isNew)}
                            className={`flex-1 sm:flex-none px-4 lg:px-6 py-2 lg:py-2.5 text-[9px] lg:text-[11px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all ${savedSuccess ? 'bg-emerald-500 text-white' : (!hasUnsavedChanges && !isNew) ? 'bg-white/5 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white'}`}
                        >
                            {saving ? <Loader2 size={13} className="animate-spin" /> : savedSuccess ? <Check size={13} /> : <Save size={13} />}
                            {saving ? 'Gravando...' : savedSuccess ? 'Salvo' : 'Salvar'}
                        </button>
                        <div className="w-px h-5 mx-0.5" style={{ background: 'rgba(255,255,255,0.07)' }} />
                        <button onClick={handleCloseAttempt} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                            <X size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-6xl px-3 lg:px-10 py-6 lg:py-10 space-y-6 lg:space-y-8 pb-32">
                <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4">
                    <ActionManager
                        lead={lead}
                        consultores={consultores}
                        handleUpdateLead={handleUpdateLead}
                        handleResetSLA={handleResetSLA}
                        consultorWhatsapp={selectedConsultor?.whatsapp || ''}
                        consultorTeamsLink={selectedConsultor?.teams_link || ''}
                        handleOpenNewConsultorModal={() => {
                            setNovoConsultorNome('');
                            setIsNewConsultor(true);
                        }}
                    />

                    <div className="hidden">
                    <ConsultantAssignment
                        lead={lead}
                        consultores={consultores}
                        selectedConsultor={selectedConsultor}
                        isNewConsultor={isNewConsultor}
                        setIsNewConsultor={setIsNewConsultor}
                        novoConsultorNome={novoConsultorNome}
                        setNovoConsultorNome={setNovoConsultorNome}
                        tempLinks={tempLinks}
                        setTempLinks={setTempLinks}
                        handleUpdateLead={handleUpdateLead}
                        handleAdicionarConsultor={handleAdicionarConsultor}
                        handleSaveConsultorLinks={async () => {
                            if (!selectedConsultor?.id) return;
                            try {
                                const { error } = await supabase.from('consultores_equipe').update(tempLinks).eq('id', selectedConsultor.id);
                                if (error) throw error;
                                setConsultores(consultores.map(c => c.id === selectedConsultor.id ? { ...c, ...tempLinks } : c));
                                toast.success('Links atualizados com sucesso!');
                            } catch (err: any) {
                                toast.error(`Erro ao salvar: ${err.message}`);
                            }
                        }}
                        handleContactConsultantTeams={() => {
                            if (!selectedConsultor?.teams_link) return;
                            const msg = getConsultantWhatsAppMessage(lead);
                            const now = new Date().toLocaleString('pt-BR');
                            const newLog = `[CONTATO] Acionado consultor via Teams (Status: ${lead.status}, Ação: ${lead.acao || 'Cobrança'}) em ${now}`;

                            handleUpdateLead({ historico: [newLog, ...(lead.historico || [])] });
                            navigator.clipboard.writeText(msg);
                            window.open(selectedConsultor.teams_link, '_blank');
                        }}
                        handleContactConsultantWA={() => {
                            if (!selectedConsultor?.whatsapp) return;
                            const msg = getConsultantWhatsAppMessage(lead);
                            const now = new Date().toLocaleString('pt-BR');
                            const newLog = `[CONTATO] Acionado consultor via WhatsApp (Status: ${lead.status}, Ação: ${lead.acao || 'Cobrança'}) em ${now}`;

                            handleUpdateLead({ historico: [newLog, ...(lead.historico || [])] });
                            window.open(getWhatsAppLink(selectedConsultor.whatsapp, msg), '_blank');
                        }}
                        handleResetSLA={handleResetSLA}
                    />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <LeadProfileForm lead={lead} handleUpdateLead={handleUpdateLead} />
                        <FinancialDossier lead={lead} handleUpdateLead={handleUpdateLead} />
                        <ProtectionDossier lead={lead} handleUpdateLead={handleUpdateLead} />
                    </div>
                </div>
            </div>
        </div>
    );
}
