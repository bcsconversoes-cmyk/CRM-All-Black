import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface AuthScreenProps {
    onLoginSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
    const [passwordInput, setPasswordInput] = useState('');
    const [authError, setAuthError] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const correctPassword = import.meta.env.VITE_CRM_PASSWORD || 'Portfel1515';
        if (passwordInput === correctPassword) {
            localStorage.setItem('crm_auth_token', 'VALID');
            setAuthError(false);
            onLoginSuccess();
        } else {
            setAuthError(true);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#020617] relative dot-grid text-white font-sans antialiased">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="relative z-10 w-full max-w-sm p-8 rounded-3xl bg-[#0B1121]/90 border border-white/[0.08] shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                        <Lock className="w-6 h-6 text-blue-400" />
                    </div>
                    <h1 className="text-xl font-black text-white tracking-widest uppercase mb-1">Área Restrita</h1>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Acesso apenas para autorizados</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Senha de Acesso</label>
                        <input
                            autoFocus
                            type="password"
                            className={`w-full bg-black/40 border ${authError ? 'border-red-500/50' : 'border-white/[0.1]'} rounded-xl px-4 py-3 text-[13px] font-bold text-white outline-none focus:border-blue-500/50 transition-all`}
                            placeholder="••••••••"
                            value={passwordInput}
                            onChange={e => {
                                setPasswordInput(e.target.value);
                                setAuthError(false);
                            }}
                        />
                        {authError && <p className="text-[10px] font-bold text-red-400 mt-1 ml-1 animate-in">Senha incorreta.</p>}
                    </div>

                    <button 
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 rounded-xl text-[11px] font-black uppercase tracking-widest text-white hover:bg-blue-500 transition-all shadow-[0_4px_20px_rgba(37,99,235,0.3)] mt-6"
                    >
                        Entrar no Sistema
                    </button>
                </form>
            </div>
        </div>
    );
};
