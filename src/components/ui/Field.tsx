import React from 'react';

interface FieldProps {
    label: string;
    children: React.ReactNode;
}

// Usamos "export const" para que outros ficheiros o encontrem pelo nome exato
export const Field: React.FC<FieldProps> = ({ label, children }) => {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest pl-1">
                {label}
            </label>
            {children}
        </div>
    );
};