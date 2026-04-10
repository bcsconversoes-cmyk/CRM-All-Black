import React from 'react';
import { User, Link2 } from 'lucide-react';
import { Lead } from '../../types';
import { calcAge, calcIMC, formatPhone, parseDateInput } from '../../utils/helpers';
import { SectionTitle } from '../ui/SectionTitle';
import { Field } from '../ui/Field';

interface Props {
    lead: Lead;
    handleUpdateLead: (updates: Partial<Lead>) => void;
}

const inputCls = "w-full bg-transparent border-b border-white/[0.08] px-0 py-3 text-slate-100 text-[13px] outline-none focus:border-blue-500/60 transition-colors font-medium placeholder:text-slate-600 rounded-none";
const selectCls = "w-full cursor-pointer appearance-none bg-[#0d1526] border border-white/[0.10] rounded-xl px-4 py-3 pr-10 text-slate-100 text-[13px] font-medium outline-none focus:border-blue-500/60 transition-colors";
const selectStyle = { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' };

export const LeadProfileForm: React.FC<Props> = ({ lead, handleUpdateLead }) => {
    return (
        <>
            {/* IDENTIFICAÇÃO E BIOMETRIA */}
            <div className="glass-card p-7 space-y-6 relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full pointer-events-none" style={{ background: 'rgba(37,99,235,0.10)', filter: 'blur(30px)' }} />
                <SectionTitle icon={User} title="Perfil & Biometria" />

                <Field label="Nome Completo"><input className={inputCls} value={lead.nome || ''} onChange={e => handleUpdateLead({ nome: e.target.value })} /></Field>

                <div className="grid grid-cols-2 gap-8">
                    <Field label="Data Nascimento">
                        <div className="relative flex items-center">
                            <input className={`${inputCls} font-mono pr-16`} value={lead.nascimento || ''} maxLength={10} onChange={e => handleUpdateLead({ nascimento: parseDateInput(e.target.value) })} />
                            {calcAge(lead.nascimento || '') > 0 && <span className="absolute right-0 text-[10px] font-black font-mono text-blue-400 bg-blue-900/30 px-2 py-1 rounded">{calcAge(lead.nascimento || '')} anos</span>}
                        </div>
                    </Field>
                    <Field label="Sexo Biológico">
                        <select className={selectCls} style={selectStyle} value={lead.sexo || 'Não Informado'} onChange={e => handleUpdateLead({ sexo: e.target.value })}>
                            <option>Masculino</option><option>Feminino</option><option>Não Informado</option>
                        </select>
                    </Field>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    <Field label="Altura (cm)"><input type="number" className={`${inputCls} font-mono`} value={lead.altura || ''} onChange={e => handleUpdateLead({ altura: +e.target.value })} /></Field>
                    <Field label="Peso (kg)"><input type="number" className={`${inputCls} font-mono`} value={lead.peso || ''} onChange={e => handleUpdateLead({ peso: +e.target.value })} /></Field>
                    <div className="flex flex-col justify-end">
                        <p className="text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-[0.15em]">IMC</p>
                        <div className={`h-[44px] flex items-center px-3 border-b font-mono font-black text-lg transition-colors ${calcIMC(Number(lead.peso), Number(lead.altura)) > 28 ? 'border-rose-900/50 text-rose-400' : calcIMC(Number(lead.peso), Number(lead.altura)) > 0 ? 'border-emerald-900/50 text-emerald-400' : 'border-slate-700 text-slate-500'}`}>
                            {calcIMC(Number(lead.peso), Number(lead.altura)) || '0.0'}
                        </div>
                    </div>
                </div>
            </div>

            {/* DADOS PESSOAIS E CONTATO */}
            <div className="glass-card p-7 space-y-6">
                <SectionTitle icon={Link2} title="Dados Pessoais & Contato" />
                <div className="grid grid-cols-2 gap-8">
                    <Field label="Documento (CPF)"><input className={`${inputCls} font-mono`} value={lead.cpf || ''} onChange={e => handleUpdateLead({ cpf: e.target.value })} /></Field>
                    <Field label="Estado Civil"><select className={selectCls} style={selectStyle} value={lead.estadoCivil || 'Solteiro(a)'} onChange={e => handleUpdateLead({ estadoCivil: e.target.value })}><option>Solteiro(a)</option><option>Casado(a)</option><option>Divorciado(a)</option><option>Viúvo(a)</option><option>União Estável</option></select></Field>
                </div>
                <div className="grid grid-cols-2 gap-8">
                    <Field label="Profissão"><input className={inputCls} value={lead.profissao || ''} onChange={e => handleUpdateLead({ profissao: e.target.value })} /></Field>
                    <Field label="Vínculo"><select className={selectCls} style={selectStyle} value={lead.tipoRenda || ''} onChange={e => handleUpdateLead({ tipoRenda: e.target.value })}><option value="">Selecione...</option><option value="CLT">CLT</option><option value="Empresário">Empresário</option><option value="Autônomo">Autônomo</option><option value="Autônomo / Profissional Liberal">Autônomo / Profissional Liberal</option><option value="Autônomo / Pró-labore">Autônomo / Pró-labore</option><option value="PJ / Pessoa Jurídica">PJ / Pessoa Jurídica</option><option value="Servidor Público">Servidor Público</option><option value="Aposentado / Pensionista">Aposentado / Pensionista</option></select></Field>
                </div>
                <div className="grid grid-cols-2 gap-8">
                    <Field label="WhatsApp"><input className={`${inputCls} font-mono`} value={lead.celular || ''} onChange={e => handleUpdateLead({ celular: formatPhone(e.target.value) })} /></Field>
                    <Field label="E-mail"><input className={inputCls} value={lead.email || ''} onChange={e => handleUpdateLead({ email: e.target.value })} /></Field>
                </div>
                <Field label="Link de Oportunidade (Salesforce)"><input className={inputCls} placeholder="https://..." value={lead.salesforceUrl || ''} onChange={e => handleUpdateLead({ salesforceUrl: e.target.value })} /></Field>
            </div>
        </>
    );
};
