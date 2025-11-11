'use client';

import { usePathname } from 'next/navigation';
import { NavSidebar } from './nav-sidebar';
import React from 'react';

// Don't show sidebar on login/signup pages
const NO_SIDEBAR_ROUTES = ['/login', '/signup'];

interface LayoutContextType {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

const LayoutContext = React.createContext<LayoutContextType | null>(null);

export const useLayout = () => {
    const context = React.useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
}

export function LayoutProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = React.useState('');

    if (NO_SIDEBAR_ROUTES.includes(pathname)) {
        return <>{children}</>;
    }

    return (
        <LayoutContext.Provider value={{ searchQuery, setSearchQuery }}>
            <div className="flex h-screen bg-background">
                <NavSidebar 
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
                {children}
            </div>
        </LayoutContext.Provider>
    );
}
