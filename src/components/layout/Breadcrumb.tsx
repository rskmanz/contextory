'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: string;
    options?: { label: string; icon?: string; href: string }[];
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);
    const router = useRouter();

    const handleOptionClick = (href: string) => {
        setOpenDropdown(null);
        router.push(href);
    };

    return (
        <nav className="flex items-center text-[13px] font-medium">
            {items.map((item, index) => {
                const isLast = index === items.length - 1;

                return (
                    <React.Fragment key={index}>
                        {index > 0 && (
                            <span className="mx-2 text-zinc-300">/</span>
                        )}
                        <div className="relative">
                            {item.options ? (
                                <button
                                    onClick={() => setOpenDropdown(openDropdown === index ? null : index)}
                                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all ${
                                        isLast
                                            ? 'text-zinc-900 font-semibold'
                                            : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
                                    }`}
                                >
                                    {item.icon && <span className="text-base">{item.icon}</span>}
                                    <span>{item.label}</span>
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className={`ml-0.5 opacity-50 transition-transform ${openDropdown === index ? 'rotate-180' : ''}`}
                                    >
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                            ) : item.href ? (
                                <button
                                    onClick={() => router.push(item.href!)}
                                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-all"
                                >
                                    {item.icon && <span className="text-base">{item.icon}</span>}
                                    <span>{item.label}</span>
                                </button>
                            ) : (
                                <span className="flex items-center gap-1.5 px-2 py-1.5 text-zinc-900 font-semibold">
                                    {item.icon && <span className="text-base">{item.icon}</span>}
                                    <span>{item.label}</span>
                                </span>
                            )}

                            {/* Dropdown Menu */}
                            {item.options && openDropdown === index && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setOpenDropdown(null)}
                                    />
                                    <div className="absolute top-full left-0 mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 min-w-[200px] max-h-72 overflow-y-auto py-1">
                                        {item.options.map((option, optIndex) => (
                                            <button
                                                key={optIndex}
                                                onClick={() => handleOptionClick(option.href)}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[13px] transition-colors ${
                                                    item.label === option.label
                                                        ? 'bg-zinc-100 text-zinc-900 font-medium'
                                                        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                                                }`}
                                            >
                                                {option.icon && <span className="text-base">{option.icon}</span>}
                                                <span>{option.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </React.Fragment>
                );
            })}
        </nav>
    );
};
