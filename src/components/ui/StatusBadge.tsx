import React from 'react';

interface StatusStyle {
    bg: string;
    text: string;
    dot: string;
    border: string;
    glow: string;
}

export const statusStyles: Record<string, StatusStyle> = {
    'Lead':                   { bg: 'rgba(99,102,241,0.10)',  text: '#a5b4fc', dot: '#818cf8', border: 'rgba(99,102,241,0.22)',  glow: '0 0 12px rgba(99,102,241,0.30)' },
    'Contato Inicial':        { bg: 'rgba(6,182,212,0.10)',   text: '#67e8f9', dot: '#22d3ee', border: 'rgba(6,182,212,0.22)',   glow: '0 0 12px rgba(6,182,212,0.30)' },
    'Aguardando Informações': { bg: 'rgba(245,158,11,0.10)',  text: '#fcd34d', dot: '#fbbf24', border: 'rgba(245,158,11,0.22)',  glow: '0 0 12px rgba(245,158,11,0.30)' },
    'Planejamento':           { bg: 'rgba(139,92,246,0.10)',  text: '#c4b5fd', dot: '#a78bfa', border: 'rgba(139,92,246,0.22)',  glow: '0 0 12px rgba(139,92,246,0.30)' },
    'Fechamento':             { bg: 'rgba(59,130,246,0.10)',  text: '#93c5fd', dot: '#60a5fa', border: 'rgba(59,130,246,0.22)',  glow: '0 0 12px rgba(59,130,246,0.30)' },
    'Follow-Up':              { bg: 'rgba(34,211,238,0.10)',  text: '#67e8f9', dot: '#22d3ee', border: 'rgba(34,211,238,0.22)',  glow: '0 0 12px rgba(34,211,238,0.30)' },
    'Follow-up':              { bg: 'rgba(34,211,238,0.10)',  text: '#67e8f9', dot: '#22d3ee', border: 'rgba(34,211,238,0.22)',  glow: '0 0 12px rgba(34,211,238,0.30)' },
    'Em Análise':             { bg: 'rgba(249,115,22,0.10)',  text: '#fdba74', dot: '#fb923c', border: 'rgba(249,115,22,0.22)',  glow: '0 0 12px rgba(249,115,22,0.30)' },
    'Pendência':              { bg: 'rgba(244,63,94,0.10)',   text: '#fda4af', dot: '#fb7185', border: 'rgba(244,63,94,0.22)',   glow: '0 0 12px rgba(244,63,94,0.30)' },
    'Pendências':             { bg: 'rgba(244,63,94,0.10)',   text: '#fda4af', dot: '#fb7185', border: 'rgba(244,63,94,0.22)',   glow: '0 0 12px rgba(244,63,94,0.30)' },
    'Ganho':                  { bg: 'rgba(16,185,129,0.12)',  text: '#6ee7b7', dot: '#34d399', border: 'rgba(16,185,129,0.25)',  glow: '0 0 14px rgba(16,185,129,0.40)' },
    'Perdido':                { bg: 'rgba(100,116,139,0.08)', text: '#94a3b8', dot: '#64748b', border: 'rgba(100,116,139,0.15)', glow: 'none' },
    'Cancelou':               { bg: 'rgba(100,116,139,0.08)', text: '#94a3b8', dot: '#64748b', border: 'rgba(100,116,139,0.15)', glow: 'none' },
};

export const statusColors = statusStyles; // backward-compat alias

export default function StatusBadge({ status }: { status: string }) {
    const s = statusStyles[status] || { bg: 'rgba(100,116,139,0.08)', text: '#94a3b8', dot: '#64748b', border: 'rgba(100,116,139,0.15)', glow: 'none' };

    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider"
            style={{
                background: s.bg,
                color: s.text,
                border: `1px solid ${s.border}`,
                boxShadow: s.glow !== 'none' ? s.glow : undefined,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
            }}
        >
            <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: s.dot, boxShadow: s.glow !== 'none' ? s.glow : undefined }}
            />
            {status || 'Lead'}
        </span>
    );
}