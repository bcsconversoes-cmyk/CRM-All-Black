import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionTitleProps {
    icon: LucideIcon;
    title: string;
    subtitle?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Icon size={14} style={{ color: '#64748b' }} />
        </div>
        <div>
            <h3 className="text-[12px] font-black uppercase text-slate-100 tracking-widest">{title}</h3>
            {subtitle && <p className="text-[10px] font-mono mt-0.5" style={{ color: '#475569' }}>{subtitle}</p>}
        </div>
    </div>
);
