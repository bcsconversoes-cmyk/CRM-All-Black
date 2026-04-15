import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, MessageCircle, History, Plus, Loader2, User, DollarSign, Calendar, Link2, Shield, Check, Send, Activity, AlertCircle, Trash2, MessageSquare, AlertTriangle, MonitorPlay } from 'lucide-react';
import { Lead, Consultor, STAGES, STAGE_SLAS, Reuniao } from '../../types';
import { checkFastTrack, getSnippets, formatMoney, parseDateInput, calcAge, calcIMC, formatPhone, getWhatsAppLink, getCadenceFlow, getConsultantWhatsAppMessage } from '../../utils/helpers';
import { supabase } from '../../utils/supabase';
import StatusBadgeImported from '../ui/StatusBadge';
import { LeadProfileForm } from './LeadProfileForm';
import { FinancialDossier } from './FinancialDossier';
import { ConsultantAssignment } from './ConsultantAssignment';
import { ActionManager, WORKFLOW_ACTIONS } from './ActionManager';
import { MeetingManager } from './MeetingManager';

const SalesforceIcon = ({ className = 'w-4 h-4', color = '#00A1E0' }: { className?: string; color?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg"><path d="M10.02 5.34a4.56 4.56 0 0 1 3.23-1.32 4.6 4.6 0 0 1 4.2 2.74 3.64 3.64 0 0 1 1.47-.31 3.67 3.67 0 0 1 3.67 3.67 3.67 3.67 0 0 1-3.67 3.67H5.48A3.48 3.48 0 0 1 2 10.31a3.48 3.48 0 0 1 3.48-3.48c.22 0 .43.02.64.06a4.55 4.55 0 0 1 3.9-1.55Z" /></svg>
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

export default function SideSheet({ lead: initialLead, isNew, onClose, leads, setLeads, consultores, setConsultores }: SideSheetProps) {

    const safeLeadsLength = Array.isArray(leads) ? leads.length : 0;
    const defaultLead: Lead = {
        id: Date.now(), criadoEm: new Date().toLocaleString('pt-BR'), status: 'Lead', consultor: '', salesforceUrl: '', celular: '', cpf: '', email: '', nome: '', profissao: '', nascimento: '', altura: 0, peso: 0, sexo: 'Não Informado', estadoCivil: 'Solteiro(a)', renda: 0, despesas: 0, educacaoFilhos: 0, patrimonio: 0, previdencia: 0, quantosFilhos: 0, pilarFinanceiro: '', problemasSaude: '', necessidadeSeguro: '', infosRelevantes: '', motivoPerda: '', observacoes: '', possuiSeguro: false, seguradora: '', historico: [], reunioes: [], acao: '', dataAcao: ''
    };

    const [lead, setLead] = useState<Lead>(initialLead || defaultLead);
    const [saving, setSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<'perfil' | 'operacao'>('operacao');
    const [isNewConsultor, setIsNewConsultor] = useState(false);
    const [novoConsultorNome, setNovoConsultorNome] = useState('');
    const [tempLinks, setTempLinks] = useState({ whatsapp: '', teams_link: '' });
    const [novaReuniao, setNovaReuniao] = useState<Partial<Reuniao> | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);

    useEffect(() => {
        if (initialLead) {
            setLead(initialLead);
        } else {
            setLead(defaultLead);
        }
        setHasUnsavedChanges(false);
        setActiveTab('operacao');
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
            setTempLinks({ whatsapp: selectedConsultor.whatsapp || '', teams_link: selectedConsultor.teams_link || '' });
        }
    }, [selectedConsultor]);

    const handleCloseAttempt = useCallback(() => {
        if (hasUnsavedChanges || novaReuniao !== null) setShowCloseConfirm(true);
        else onClose();
    }, [hasUnsavedChanges, novaReuniao, onClose]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (showCloseConfirm) setShowCloseConfirm(false);
                else handleCloseAttempt();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleCloseAttempt, showCloseConfirm]);

    const handleUpdateLead = (updates: Partial<Lead>) => {
        let updated = { ...lead, ...updates };

        if (updates.acao === 'No show') {
            const now = new Date().toLocaleString('pt-BR');
            const [d, m, y] = now.split(' ')[0].split('/');
            const dateIso = `${y}-${m}-${d}`;
            
            const noShowReuniao: Reuniao = {
                id: `noshow-${Date.now()}`,
                data: now.split(' ')[0],
                hora: now.split(' ')[1].slice(0, 5),
                titulo: `No-Show: ${updated.status}`,
                status: 'No-Show',
                anotacoes: `No-Show registrado automaticamente via Ação Direta na etapa de ${updated.status}.`
            };
            
            const safeReunioes = Array.isArray(updated.reunioes) ? updated.reunioes : [];
            updated.reunioes = [noShowReuniao, ...safeReunioes];
            
            const safeHistorico = Array.isArray(updated.historico) ? updated.historico : [];
            updated.historico = [`No-Show registrado na etapa de ${updated.status} em ${now}`, ...safeHistorico];
        }

        if (updates.status && updates.status !== lead.status) {
            updated.acao = '';
            updated.dataAcao = '';
            const now = new Date().toLocaleString('pt-BR');
            const safeHistorico = Array.isArray(updated.historico) ? updated.historico : [];
            updated.historico = [`De "${lead.status}" → "${updated.status}" em ${now}`, ...safeHistorico];
        }

        const fastTrackStatus = checkFastTrack(updated);
        if (fastTrackStatus !== updated.status && ['Lead', 'Aguardando Informações'].includes(updated.status)) {
            updated.status = fastTrackStatus;
            updated.acao = '';
            updated.dataAcao = '';
            const now = new Date().toLocaleString('pt-BR');
            const safeHistorico = Array.isArray(updated.historico) ? updated.historico : [];
            updated.historico = [`[FAST-TRACK 🚀] Avançado automaticamente para ${fastTrackStatus} em ${now}`, ...safeHistorico];
        }

        setLead(updated);
        setHasUnsavedChanges(true);
    };

    const handleResetSLA = () => {
        const now = new Date();
        const dateIso = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const nowBr = now.toLocaleString('pt-BR');
        const safeHistorico = Array.isArray(lead.historico) ? lead.historico : [];
        setLead(prev => ({
            ...prev,
            dataUltimoStatus: dateIso,
            historico: [`[SLA ⏱️] Contador reiniciado manualmente em ${nowBr}`, ...safeHistorico]
        }));
        setHasUnsavedChanges(true);
    };

    const getAcoesPossiveis = () => WORKFLOW_ACTIONS[lead.status] ?? [];
    const acoesDisponiveis = getAcoesPossiveis();

    const handleSmartContactWA = () => {
        const isContatoCliente = ['Follow-up', 'Em Análise', 'Ganho', 'Perdido', 'Cancelou'].includes(lead.status);

        if (isContatoCliente) {
            const snippets = getSnippets(lead);
            let msg = `Olá, tudo bem?`;
            
            if (lead.status === 'Ganho') msg = snippets.ganho;
            else if (lead.acao === 'Enviar Proposta (Cliente)') msg = snippets.msg01;
            else if (lead.acao === 'Acompanhamento 1 (Cliente)') msg = snippets.msg02;
            else if (lead.acao === 'Acompanhamento 2 (Cliente)') msg = snippets.msg03;
            else if (lead.acao === 'Prioridade Atual (Cliente)') msg = snippets.msg04;
            else if (lead.acao === 'Encerrar Contato (Cliente)') msg = snippets.msg05;
            
            window.open(getWhatsAppLink(lead.celular || '', msg), '_blank');
        } else {
            if (!selectedConsultor || !selectedConsultor.whatsapp) {
                alert("Consultor sem WhatsApp cadastrado. Preencha no painel abaixo.");
                return;
            }
            const msg = getSnippets(lead).followUpConsultor || 'Olá!';
            window.open(getWhatsAppLink(selectedConsultor.whatsapp, msg), '_blank');
        }
    };

    const saveLead = async (): Promise<boolean> => {
        setSaving(true);
        try {
            const payload = { ...lead };
            // Remover campos que não existem como coluna no Supabase
            delete (payload as any).dataUltimoStatus;
            delete (payload as any).rowIndex;

            if (isNew) {
                const { data, error } = await supabase.from('leads').insert([payload]).select().single();
                if (error) throw error;
                const saved = { ...lead, id: data.id };
                setLeads([...leads, saved]);
            } else {
                const { error } = await supabase.from('leads').update(payload).eq('id', lead.id);
                if (error) throw error;
                setLeads(leads.map(l => l.id === lead.id ? lead : l));
            }

            setHasUnsavedChanges(false);
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 2000);
            return true;
        } catch (err: any) {
            alert(`Erro ao gravar: ${err.message}`);
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleAdicionarConsultor = async () => {
        if (!novoConsultorNome.trim()) return setIsNewConsultor(false);
        try {
            const { data, error } = await supabase.from('consultores_equipe').insert([{ nome: novoConsultorNome, ativo: true }]).select().single();
            if (error) throw error;
            if (data) { setConsultores([...consultores, data]); handleUpdateLead({ consultor: data.nome }); }
        } catch (err: any) { alert(`Erro: ${err.message}`); }
        finally { setNovoConsultorNome(''); setIsNewConsultor(false); }
    };

    const handleSalvarReuniao = () => {
        if (!novaReuniao?.data || !novaReuniao?.titulo) return alert("Preencha a pauta e a data.");
        const dataBr = novaReuniao.data.split('-').reverse().join('/');
        const reuniaoSalva: Reuniao = {
            id: Date.now().toString(),
            data: dataBr,
            hora: '',
            titulo: novaReuniao.titulo,
            anotacoes: novaReuniao.anotacoes || '',
            status: (novaReuniao.status as Reuniao['status']) || 'Agendada'
        };
        const safeReunioes = Array.isArray(lead.reunioes) ? lead.reunioes : [];
        const safeHistorico = Array.isArray(lead.historico) ? lead.historico : [];

        setLead({
            ...lead,
            reunioes: [reuniaoSalva, ...safeReunioes],
            historico: [`Reunião "${reuniaoSalva.titulo}" (${reuniaoSalva.status})`, ...safeHistorico]
        });
        setNovaReuniao(null);
        setHasUnsavedChanges(true);
    };

    const handleDeleteLead = async () => {
        if (window.confirm("Excluir este lead definitivamente?")) {
            setSaving(true);
            try {
                const { error } = await supabase.from('leads').delete().eq('id', lead.id);
                if (error) throw error;
                const newLeads = leads.filter(l => l.id !== lead.id);
                setLeads(newLeads);
                onClose();
            } catch (err: any) { alert(`Erro: ${err.message}`); setSaving(false); }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto custom-scrollbar flex flex-col items-center animate-in"
            style={{ background: 'rgba(2,6,15,0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>

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

            <div className="sticky top-0 z-30 w-full py-5 px-6 lg:px-10 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <StatusBadgeImported status={lead.status || 'Lead'} />
                            <span className="text-[10px] font-mono text-slate-500 tracking-wider">ID {lead.id} • {lead.criadoEm}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl lg:text-3xl font-black tracking-tighter text-white">{isNew ? 'NOVO LEAD' : lead.nome || 'Cliente Sem Nome'}</h2>
                            {!isNew && (
                                <div className="flex items-center gap-2">
                                    <button onClick={handleSmartContactWA}
                                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                                        style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.22)', color: '#6ee7b7' }}
                                        title="WhatsApp Inteligente">
                                        <MessageCircle size={15} />
                                    </button>
                                    {lead.salesforceUrl ? (
                                        <a href={lead.salesforceUrl} target="_blank" rel="noopener noreferrer"
                                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                                            style={{ background: 'rgba(0,161,224,0.10)', border: '1px solid rgba(0,161,224,0.20)' }}
                                            title="Salesforce">
                                            <SalesforceIcon className="w-4 h-4" />
                                        </a>
                                    ) : (
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center opacity-20 cursor-not-allowed"
                                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            <SalesforceIcon className="w-4 h-4" color="#475569" />
                                        </div>
                                    )}
                                    <button onClick={() => {
                                        const params = new URLSearchParams({
                                            id: lead.id.toString(),
                                            name: lead.nome || '',
                                            income: lead.renda?.toString() || '',
                                            networth: lead.patrimonio?.toString() || ''
                                        });
                                        window.open(`/apresentacao.html?${params.toString()}`, '_blank');
                                    }}
                                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                                        style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.22)', color: '#a5b4fc' }}
                                        title="Ver Apresentação Personalizada">
                                        <MonitorPlay size={15} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/5">
                        {!isNew && (
                            <button onClick={handleDeleteLead} disabled={saving} className="p-2.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                                <Trash2 size={17} />
                            </button>
                        )}
                        <button onClick={saveLead} disabled={saving || (!hasUnsavedChanges && !isNew)}
                            className={`px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 transition-all ${savedSuccess ? 'bg-emerald-500 text-white' : (!hasUnsavedChanges && !isNew) ? 'bg-white/5 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white'}`}>
                            {saving ? <Loader2 size={15} className="animate-spin" /> : savedSuccess ? <Check size={15} /> : <Save size={15} />}
                            {saving ? 'Gravando...' : savedSuccess ? 'Salvo' : 'Salvar'}
                        </button>
                        <div className="w-px h-5 mx-0.5" style={{ background: 'rgba(255,255,255,0.07)' }} />
                        <button onClick={handleCloseAttempt} className="p-2.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"><X size={19} /></button>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-6xl px-6 lg:px-10 py-10 space-y-8 pb-32">
                <div className="flex gap-8 border-b border-white/5">
                    {(['operacao', 'perfil'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500'}`}>
                            {tab === 'operacao' ? 'Operação & Cadência' : 'Perfil Completo'}
                        </button>
                    ))}

                </div>

                {activeTab === 'perfil' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
                        <LeadProfileForm lead={lead} handleUpdateLead={handleUpdateLead} />
                        <FinancialDossier lead={lead} handleUpdateLead={handleUpdateLead} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4">
                        <ConsultantAssignment
                            lead={lead} consultores={consultores} selectedConsultor={selectedConsultor}
                            isNewConsultor={isNewConsultor} setIsNewConsultor={setIsNewConsultor}
                            novoConsultorNome={novoConsultorNome} setNovoConsultorNome={setNovoConsultorNome}
                            tempLinks={tempLinks} setTempLinks={setTempLinks}
                            handleUpdateLead={handleUpdateLead} handleAdicionarConsultor={handleAdicionarConsultor}
                            handleSaveConsultorLinks={async () => {
                                if (!selectedConsultor?.id) return;
                                try {
                                    const { error } = await supabase.from('consultores_equipe').update(tempLinks).eq('id', selectedConsultor.id);
                                    if (error) throw error;
                                    setConsultores(consultores.map(c => c.id === selectedConsultor.id ? { ...c, ...tempLinks } : c));
                                    alert("Links atualizados com sucesso!");
                                } catch (err: any) { alert(`Erro ao salvar: ${err.message}`); }
                            }}
                            handleContactConsultantTeams={() => {
                                if (!selectedConsultor?.teams_link) return;
                                const msg = getConsultantWhatsAppMessage(lead);
                                const now = new Date().toLocaleString('pt-BR');
                                const newLog = `[CONTATO 👥] Acionado consultor via Teams (Status: ${lead.status}, Ação: ${lead.acao || 'Cobrança'}) em ${now}`;
                                
                                handleUpdateLead({ 
                                    historico: [newLog, ...(lead.historico || [])] 
                                });
                                
                                // Copiar mensagem para o clipboard solicitado pelo USER
                                navigator.clipboard.writeText(msg);
                                
                                window.open(selectedConsultor.teams_link, '_blank');
                            }}
                            handleContactConsultantWA={() => {
                                if (!selectedConsultor?.whatsapp) return;
                                const msg = getConsultantWhatsAppMessage(lead);
                                const now = new Date().toLocaleString('pt-BR');
                                const newLog = `[CONTATO 👥] Acionado consultor via WhatsApp (Status: ${lead.status}, Ação: ${lead.acao || 'Cobrança'}) em ${now}`;
                                
                                handleUpdateLead({ 
                                    historico: [newLog, ...(lead.historico || [])] 
                                });
                                window.open(getWhatsAppLink(selectedConsultor.whatsapp, msg), '_blank');
                            }}
                        />
                        <ActionManager lead={lead} handleUpdateLead={handleUpdateLead} handleResetSLA={handleResetSLA} consultorWhatsapp={selectedConsultor?.whatsapp || ''} consultorTeamsLink={selectedConsultor?.teams_link || ''} />
                        <MeetingManager
                            lead={lead} novaReuniao={novaReuniao} setNovaReuniao={setNovaReuniao}
                            handlePautaChange={(p) => setNovaReuniao({ ...novaReuniao, titulo: p, data: new Date().toISOString().split('T')[0] })}
                            handleSalvarReuniao={handleSalvarReuniao}
                            getDynamicSnippets={() => ({ conf: 'Confirmação', rem: 'Remarcação' })}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}