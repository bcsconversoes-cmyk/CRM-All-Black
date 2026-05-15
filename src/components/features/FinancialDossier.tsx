import React, { useMemo } from 'react';
import { DollarSign, GraduationCap, Landmark, PiggyBank, TrendingDown, TrendingUp, Users, WalletCards } from 'lucide-react';
import { Lead } from '../../types';
import { formatMoney } from '../../utils/helpers';
import { SectionTitle } from '../ui/SectionTitle';
import { Field } from '../ui/Field';

interface Props {
    lead: Lead;
    handleUpdateLead: (updates: Partial<Lead>) => void;
}

const inputCls = "w-full h-11 bg-[#0b1222] border border-white/[0.08] rounded-xl px-3 text-slate-100 text-[13px] outline-none focus:border-blue-500/60 transition-colors font-semibold placeholder:text-slate-600";

const parseMoney = (value: string) => {
    const parsed = parseInt(value.replace(/\D/g, ''), 10);
    return Number.isFinite(parsed) ? parsed : 0;
};

const FinancialTile = ({
    label,
    tone,
    icon: Icon,
    children,
}: {
    label: string;
    tone: string;
    icon: React.ElementType;
    children: React.ReactNode;
}) => (
    <div className="rounded-2xl bg-white/[0.025] border border-white/[0.07] p-4 space-y-3 min-w-0">
        <div className="flex items-center justify-between gap-3">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{label}</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${tone}`}>
                <Icon size={15} />
            </div>
        </div>
        {children}
    </div>
);

export const FinancialDossier: React.FC<Props> = ({ lead, handleUpdateLead }) => {
    const sobraMensal = useMemo(() => (Number(lead.renda) || 0) - (Number(lead.despesas) || 0), [lead.renda, lead.despesas]);
    const comprometimento = useMemo(() => {
        const renda = Number(lead.renda) || 0;
        if (!renda) return 0;
        return Math.round(((Number(lead.despesas) || 0) / renda) * 100);
    }, [lead.renda, lead.despesas]);

    return (
        <div className="glass-card p-6 lg:p-7 space-y-6 lg:col-span-2">
            <SectionTitle icon={DollarSign} title="Indicadores Financeiros" subtitle="Renda, despesas, patrimônio e capacidade" />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <FinancialTile label="Renda mensal" tone="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" icon={TrendingUp}>
                    <input className={`${inputCls} text-emerald-300 font-mono`} value={formatMoney(lead.renda)} onChange={e => handleUpdateLead({ renda: parseMoney(e.target.value) })} />
                </FinancialTile>

                <FinancialTile label="Despesas mensais" tone="bg-rose-500/10 text-rose-400 border border-rose-500/20" icon={TrendingDown}>
                    <input className={`${inputCls} text-rose-300 font-mono`} value={formatMoney(lead.despesas)} onChange={e => handleUpdateLead({ despesas: parseMoney(e.target.value) })} />
                </FinancialTile>

                <FinancialTile label="Patrimônio total" tone="bg-blue-500/10 text-blue-400 border border-blue-500/20" icon={Landmark}>
                    <input className={`${inputCls} text-blue-300 font-mono`} value={formatMoney(lead.patrimonio)} onChange={e => handleUpdateLead({ patrimonio: parseMoney(e.target.value) })} />
                </FinancialTile>

                <FinancialTile label="Previdência privada" tone="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" icon={PiggyBank}>
                    <input className={`${inputCls} font-mono`} value={formatMoney(lead.previdencia)} onChange={e => handleUpdateLead({ previdencia: parseMoney(e.target.value) })} />
                </FinancialTile>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-white/[0.025] border border-white/[0.07] p-4">
                    <Field label="Custos educacionais" icon={GraduationCap}>
                        <input className={`${inputCls} font-mono`} value={formatMoney(lead.educacaoFilhos)} onChange={e => handleUpdateLead({ educacaoFilhos: parseMoney(e.target.value) })} />
                    </Field>
                </div>

                <div className="rounded-2xl bg-cyan-500/[0.04] border border-cyan-500/15 p-4 flex flex-col justify-between min-h-[94px]">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-[9px] font-black uppercase text-cyan-200/70 tracking-widest">Leitura rápida</span>
                        <WalletCards size={15} className="text-cyan-300" />
                    </div>
                    <div>
                        <div className={`font-mono text-xl font-black ${sobraMensal >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{formatMoney(sobraMensal)}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{comprometimento}% comprometido</div>
                    </div>
                </div>
                <div className="rounded-2xl bg-white/[0.025] border border-white/[0.07] p-4">
                    <Field label="Filhos" icon={Users}>
                        <input type="number" className={`${inputCls} font-mono`} value={lead.quantosFilhos ?? ''} onChange={e => handleUpdateLead({ quantosFilhos: Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0 })} />
                    </Field>
                </div>
                <div className="rounded-2xl bg-white/[0.025] border border-white/[0.07] p-4">
                    <Field label="Pilar financeiro">
                        <input className={inputCls} value={lead.pilarFinanceiro || ''} onChange={e => handleUpdateLead({ pilarFinanceiro: e.target.value })} />
                    </Field>
                </div>
            </div>
        </div>
    );
};
