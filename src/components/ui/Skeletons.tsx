import React from 'react';

export function TableSkeleton() {
    return (
        <div className="w-full space-y-4 p-4 animate-pulse">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4 h-16 bg-white/[0.02] border border-white/5 rounded-xl items-center px-4">
                    <div className="w-24 h-6 bg-white/10 rounded-full" />
                    <div className="flex gap-3 items-center flex-1">
                        <div className="w-8 h-8 bg-white/10 rounded-full shrink-0" />
                        <div className="space-y-2 w-full max-w-[200px]">
                            <div className="w-full h-3 bg-white/10 rounded" />
                            <div className="w-24 h-2 bg-white/5 rounded" />
                        </div>
                    </div>
                    <div className="w-20 h-4 bg-white/10 rounded hidden md:block" />
                    <div className="w-32 h-6 bg-white/10 rounded hidden xl:block" />
                    <div className="w-20 h-4 bg-white/10 rounded hidden lg:block" />
                    <div className="w-16 h-6 bg-white/10 rounded" />
                </div>
            ))}
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 animate-pulse">
            <div className="flex justify-between items-end border-b border-white/5 pb-8">
                <div>
                    <div className="h-8 w-64 bg-white/10 rounded-lg mb-2" />
                    <div className="h-3 w-48 bg-white/5 rounded" />
                </div>
                <div className="h-16 w-40 bg-white/5 rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="h-96 bg-white/5 rounded-3xl lg:col-span-2" />
                <div className="h-96 bg-white/5 rounded-3xl" />
            </div>
        </div>
    );
}