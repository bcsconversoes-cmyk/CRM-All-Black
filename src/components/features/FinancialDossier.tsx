import React from 'react';
import { DollarSign, Shield } from 'lucide-react';
import { Lead } from '../../types';
import { formatMoney } from '../../utils/helpers';
import { SectionTitle } from '../ui/SectionTitle';
import { Field } from '../ui/Field';

interface Props {
    lead: Lead;
    handleUpdateLead: (updates: Partial<Lead>) => void;
}

const inputCls = "w-full bg-transparent border-b border-white/[0.08] px-0 py-3 text-slate-100 text-[13px] outline-none focus:border-blue-500/60 transition-colors font-medium placeholder:text-slate-600 rounded-none";
const selectCls = "w-full cursor-pointer appearance-none bg-[#0d1526] border border-white/[0.10] rounded-xl px-4 py-3 pr-10 text-slate-100 text-[13px] font-medium outline-none focus:border-blue-500/60 transition-colors";
const selectStyle = { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' };

export const FinancialDossier: React.FC<Props> = ({ lead, handleUpdateLead }) => {
    return (
        <>
            {/* FINANCEIRO */}
            <div className="glass-card p-7 space-y-6 lg:col-span-2">
                <SectionTitle icon={DollarSign} title="Indicadores Financeiros Globais" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <Field label="Renda Mensal (R$)"><input className={`${inputCls} text-emerald-400 font-mono`} value={formatMoney(lead.renda)} onChange={e => handleUpdateLead({ renda: isNaN(parseInt(e.target.value.replace(/\D/g, ''))) ? 0 : parseInt(e.target.value.replace(/\D/g, '')) })} /></Field>
                    <Field label="Despesas (R$)"><input className={`${inputCls} text-rose-400 font-mono`} value={formatMoney(lead.despesas)} onChange={e => handleUpdateLead({ despesas: isNaN(parseInt(e.target.value.replace(/\D/g, ''))) ? 0 : parseInt(e.target.value.replace(/\D/g, '')) })} /></Field>
                    <Field label="Patrimônio Total"><input className={`${inputCls} text-blue-400 font-mono`} value={formatMoney(lead.patrimonio)} onChange={e => handleUpdateLead({ patrimonio: isNaN(parseInt(e.target.value.replace(/\D/g, ''))) ? 0 : parseInt(e.target.value.replace(/\D/g, '')) })} /></Field>
                    <Field label="Previdência Privada"><input className={`${inputCls} font-mono`} value={formatMoney(lead.previdencia)} onChange={e => handleUpdateLead({ previdencia: isNaN(parseInt(e.target.value.replace(/\D/g, ''))) ? 0 : parseInt(e.target.value.replace(/\D/g, '')) })} /></Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <Field label="Pilar Financeiro"><input className={inputCls} placeholder="Ex: Provedor Principal..." value={lead.pilarFinanceiro || ''} onChange={e => handleUpdateLead({ pilarFinanceiro: e.target.value })} /></Field>
                    <Field label="Filhos"><input type="number" className={`${inputCls} font-mono`} value={lead.quantosFilhos !== undefined && lead.quantosFilhos !== null ? lead.quantosFilhos : ''} onChange={e => handleUpdateLead({ quantosFilhos: +e.target.value })} /></Field>
                    <Field label="Custos Educacionais"><input className={`${inputCls} font-mono`} value={formatMoney(lead.educacaoFilhos)} onChange={e => handleUpdateLead({ educacaoFilhos: isNaN(parseInt(e.target.value.replace(/\D/g, ''))) ? 0 : parseInt(e.target.value.replace(/\D/g, '')) })} /></Field>
                </div>
            </div>

            {/* DOSSIÊ */}
            <div className="glass-card p-7 space-y-6 lg:col-span-2">
                <SectionTitle icon={Shield} title="Dossiê de Proteção & Observações" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <span className="text-[11px] text-slate-300 font-bold uppercase tracking-widest">Possui Seguro de Vida?</span>
                            <input type="checkbox" className="w-5 h-5 accent-blue-500 rounded" checked={Boolean(lead.possuiSeguro)} onChange={e => handleUpdateLead({ possuiSeguro: e.target.checked })} />
                        </div>
                        {Boolean(lead.possuiSeguro) && (
                            <Field label="Seguradora Emissora">
                                <select className={selectCls} style={selectStyle} value={lead.seguradora || ''} onChange={e => handleUpdateLead({ seguradora: e.target.value })}><option value="">Selecione...</option><option value="Azos">Azos</option><option value="MAG">MAG</option><option value="Icatu">Icatu</option><option value="Prudential">Prudential</option><option value="Outra">Outra</option></select>
                            </Field>
                        )}
                        <Field label="Histórico Médico (DPS)">
                            <textarea className={`${inputCls} min-h-[100px] bg-[#0B1121] p-4 rounded-xl border border-slate-800`} value={lead.problemasSaude || ''} onChange={e => handleUpdateLead({ problemasSaude: e.target.value })} placeholder="Registre aqui doenças pré-existentes, cirurgias, uso de medicamentos..." />
                            {!lead.problemasSaude && <p className="text-[9px] mt-1 italic" style={{ color: '#475569' }}>Nenhum histórico médico registrado.</p>}
                        </Field>
                    </div>
                    <div className="space-y-6">
                        <Field label="Diagnóstico Comercial & Pitch">
                            {/* Exibe informações compiladas de necessidadeSeguro e infosRelevantes acima do campo editável */}
                            {(lead.necessidadeSeguro || lead.infosRelevantes) && (
                                <div className="mb-3 p-4 rounded-xl space-y-3" style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}>
                                    {lead.necessidadeSeguro && (
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: '#60a5fa' }}>Por que precisa de seguro?</p>
                                            <p className="text-[12px] leading-relaxed" style={{ color: '#cbd5e1' }}>{lead.necessidadeSeguro}</p>
                                        </div>
                                    )}
                                    {lead.infosRelevantes && (
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: '#60a5fa' }}>Informações Relevantes</p>
                                            <p className="text-[12px] leading-relaxed" style={{ color: '#cbd5e1' }}>{lead.infosRelevantes}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            <textarea className={`${inputCls} min-h-[140px] bg-[#0B1121] p-4 rounded-xl border border-slate-800`} value={lead.observacoes || ''} onChange={e => handleUpdateLead({ observacoes: e.target.value })} placeholder="Notas do operador, estratégia de abordagem, objeções..." />
                        </Field>
                    </div>
                </div>
            </div>
        </>
    );
};
