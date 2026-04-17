import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Lead } from '../../types';

interface LossReasonModalProps {
    lossModalState: { isOpen: boolean; lead: Lead | null; newStatus: string };
    lossReason: string;
    setLossReason: (reason: string) => void;
    onClose: () => void;
    onConfirm: () => void;
}

export const LossReasonModal: React.FC<LossReasonModalProps> = ({
    lossModalState,
    lossReason,
    setLossReason,
    onClose,
    onConfirm
}) => {
    if (!lossModalState.isOpen || !lossModalState.lead) return null;

    const REASONS = [
        'Preço/Aporte',
        'Concorrente',
        'Sem Perfil Técnico',
        'Prioridade'
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/5 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Motivo do Encerramento</h3>
                        <p className="text-[10px] text-slate-400">
                            Informe o motivo para mover para <span className="font-bold text-red-300">{lossModalState.newStatus}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="ml-auto p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <p className="text-xs text-slate-300 mb-4">
                        A seleção de um motivo é obrigatória para arquivar o lead <strong>{lossModalState.lead.nome}</strong>.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3">
                        {REASONS.map(reason => (
                            <button
                                key={reason}
                                onClick={() => setLossReason(reason)}
                                className={`px-4 py-3 rounded-xl border text-xs font-bold transition-all ${
                                    lossReason === reason 
                                    ? 'bg-red-500/20 border-red-500/50 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.15)]' 
                                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                }`}
                            >
                                {reason}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-white/5 flex justify-end gap-3 bg-[#0B1121]">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!lossReason}
                        className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};
