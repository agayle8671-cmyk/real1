import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import ParticleBackground from './ParticleBackground';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen bg-bg-console font-roboto text-text-primary overflow-hidden">
            <ParticleBackground />
            <Header />
            <Sidebar />
            <main className="relative z-10 ml-64 pt-16 min-h-[calc(100vh-64px)]">
                {children}
            </main>
        </div>
    );
}
