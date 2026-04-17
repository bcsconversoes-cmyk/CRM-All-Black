import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast: React.FC = () => {
    const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleToast = (e: any) => {
            setToast(e.detail);
            setIsVisible(true);
            
            // Auto hide after 4 seconds
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 4000);

            return () => clearTimeout(timer);
        };

        window.addEventListener('app-toast', handleToast);
        return () => window.removeEventListener('app-toast', handleToast);
    }, []);

    if (!toast) return null;

    const configMap = {
        success: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        error:   { icon: AlertCircle,  color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20' },
        info:    { icon: Info,         color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
    };

    const config = configMap[toast.type as 'success' | 'error' | 'info'] || configMap.info;

    return (
        <div 
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] transition-all duration-500 ease-out transform ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
            }`}
            onTransitionEnd={() => !isVisible && setToast(null)}
        >
            <div className={`glass-card flex items-center gap-4 px-6 py-4 min-w-[320px] max-w-md shadow-2xl border-white/10 ${config.bg} backdrop-blur-xl`}>
                <div className={`p-2 rounded-xl bg-white/5 border ${config.border}`}>
                    <config.icon size={18} className={config.color} />
                </div>
                
                <div className="flex-1">
                    <p className="text-[12px] font-bold text-white leading-tight">{toast.message}</p>
                </div>

                <button 
                    onClick={() => setIsVisible(false)}
                    className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};
