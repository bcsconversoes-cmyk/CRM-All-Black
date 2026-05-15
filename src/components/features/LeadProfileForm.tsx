import React, { useMemo } from 'react';
import { Link2, Ruler, Shield, UserRound, Weight } from 'lucide-react';
import { Lead } from '../../types';
import { calcAge, calcIMC, formatDate, formatPhone, parseDateInput } from '../../utils/helpers';
import { SectionTitle } from '../ui/SectionTitle';
import { Field } from '../ui/Field';

interface Props {
    lead: Lead;
    handleUpdateLead: (updates: Partial<Lead>) => void;
}

const inputCls = "w-full bg-transparent border-b border-white/[0.08] px-0 py-3 text-slate-100 text-[13px] outline-none focus:border-blue-500/60 transition-colors font-bold placeholder:text-slate-600 rounded-none";
const textareaCls = "w-full min-h-[116px] bg-[#0B1121] border border-white/[0.08] rounded-xl px-4 py-3 text-slate-100 text-[13px] leading-relaxed outline-none focus:border-blue-500/60 transition-colors resize-y placeholder:text-slate-600 font-semibold";
const selectCls = "w-full cursor-pointer appearance-none bg-[#0d1526] border border-white/[0.10] rounded-xl px-4 py-3 pr-10 text-slate-100 text-[13px] font-bold outline-none focus:border-blue-500/60 transition-colors";
const selectStyle = { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' };

const toNumberOrZero = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const LeadProfileForm: React.FC<Props> = ({ lead, handleUpdateLead }) => {
    const age = calcAge(lead.nascimento || '');
    const imc = useMemo(() => calcIMC(Number(lead.peso), Number(lead.altura)), [lead.peso, lead.altura]);

    return (
        <>
            <div className="glass-card p-7 space-y-7">
                <SectionTitle icon={UserRound} title="Perfil & Biometria" />

                <Field label="Nome completo">
                    <input className={inputCls} value={lead.nome || ''} onChange={e => handleUpdateLead({ nome: e.target.value })} />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Field label="Data nascimento">
                        <div className="relative">
                            <input
                                inputMode="numeric"
                                maxLength={10}
                                placeholder="DD/MM/AAAA"
                                className={`${inputCls} font-mono pr-20`}
                                value={lead.nascimento ? formatDate(lead.nascimento) : ''}
                                onChange={e => handleUpdateLead({ nascimento: parseDateInput(e.target.value) })}
                            />
                            {age > 0 && <span className="absolute right-0 top-2.5 text-[10px] font-black font-mono text-blue-400 bg-blue-900/30 px-2 py-1 rounded">{age} anos</span>}
                        </div>
                    </Field>

                    <Field label="Sexo biológico">
                        <select className={selectCls} style={selectStyle} value={lead.sexo || 'Não Informado'} onChange={e => handleUpdateLead({ sexo: e.target.value })}>
                            <option>Masculino</option>
                            <option>Feminino</option>
                            <option>Não Informado</option>
                        </select>
                    </Field>
                </div>

                <div className="grid grid-cols-3 gap-8">
                    <Field label="Altura (cm)" icon={Ruler}>
                        <input type="number" className={`${inputCls} font-mono`} value={lead.altura || ''} onChange={e => handleUpdateLead({ altura: toNumberOrZero(e.target.value) })} />
                    </Field>

                    <Field label="Peso (kg)" icon={Weight}>
                        <input type="number" className={`${inputCls} font-mono`} value={lead.peso || ''} onChange={e => handleUpdateLead({ peso: toNumberOrZero(e.target.value) })} />
                    </Field>

                    <div className="flex flex-col justify-end">
                        <p className="text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-[0.15em]">IMC</p>
                        <div className={`h-[44px] flex items-center px-3 border-b font-mono font-black text-lg transition-colors ${imc > 28 ? 'border-rose-900/50 text-rose-400' : imc > 0 ? 'border-emerald-900/50 text-emerald-400' : 'border-slate-700 text-slate-500'}`}>
                            {imc || '0.0'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card p-7 space-y-7">
                <SectionTitle icon={Link2} title="Dados Pessoais & Contato" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Field label="Estado civil">
                        <select className={selectCls} style={selectStyle} value={lead.estadoCivil || 'Solteiro(a)'} onChange={e => handleUpdateLead({ estadoCivil: e.target.value })}>
                            <option>Solteiro(a)</option>
                            <option>Casado(a)</option>
                            <option>Divorciado(a)</option>
                            <option>Viúvo(a)</option>
                            <option>União Estável</option>
                        </select>
                    </Field>

                    <Field label="Vínculo">
                        <select className={selectCls} style={selectStyle} value={lead.tipoRenda || ''} onChange={e => handleUpdateLead({ tipoRenda: e.target.value })}>
                            <option value="">Selecione...</option>
                            <option value="CLT">CLT</option>
                            <option value="Empresário">Empresário</option>
                            <option value="Autônomo">Autônomo</option>
                            <option value="Autônomo / Profissional Liberal">Autônomo / Profissional Liberal</option>
                            <option value="Autônomo / Pró-labore">Autônomo / Pró-labore</option>
                            <option value="PJ / Pessoa Jurídica">PJ / Pessoa Jurídica</option>
                            <option value="Servidor Público">Servidor Público</option>
                            <option value="Aposentado / Pensionista">Aposentado / Pensionista</option>
                        </select>
                    </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Field label="Profissão">
                        <input className={inputCls} value={lead.profissao || ''} onChange={e => handleUpdateLead({ profissao: e.target.value })} />
                    </Field>

                    <Field label="WhatsApp">
                        <input className={`${inputCls} font-mono`} value={lead.celular || ''} onChange={e => handleUpdateLead({ celular: formatPhone(e.target.value) })} />
                    </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Field label="E-mail">
                        <input className={inputCls} value={lead.email || ''} onChange={e => handleUpdateLead({ email: e.target.value })} />
                    </Field>

                    <Field label="Link de oportunidade (Salesforce)">
                        <input className={inputCls} placeholder="https://..." value={lead.salesforceUrl || ''} onChange={e => handleUpdateLead({ salesforceUrl: e.target.value })} />
                    </Field>
                </div>
            </div>
        </>
    );
};

export const ProtectionDossier: React.FC<Props> = ({ lead, handleUpdateLead }) => (
    <div className="glass-card p-7 space-y-7 lg:col-span-2">
        <SectionTitle icon={Shield} title="Dossiê de Proteção & Observações" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <Field label="Histórico médico (DPS)">
                    <textarea className={textareaCls} value={lead.problemasSaude || ''} onChange={e => handleUpdateLead({ problemasSaude: e.target.value })} placeholder="Registre doenças preexistentes, cirurgias, uso de medicamentos..." />
                </Field>
            </div>

            <div className="space-y-6">
                <Field label="Diagnóstico comercial & pitch">
                    <textarea className={textareaCls} value={lead.observacoes || ''} onChange={e => handleUpdateLead({ observacoes: e.target.value })} placeholder="Notas do operador, estratégia de abordagem, objeções..." />
                </Field>
            </div>
        </div>
    </div>
);
