import React, { ReactNode } from 'react';

interface DashboardSectionProps {
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    children: ReactNode;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
    title,
    subtitle,
    icon,
    children,
}) => {
    return (
        <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {icon && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm border border-gray-100">
                            {icon}
                        </div>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-800 tracking-tight">{title}</h2>
                        {subtitle && <p className="text-sm font-medium text-zinc-400 tracking-wide">{subtitle}</p>}
                    </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="5" cy="12" r="1.5" fill="currentColor" />
                        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                        <circle cx="19" cy="12" r="1.5" fill="currentColor" />
                    </svg>
                </button>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {children}
            </div>
        </section>
    );
};
