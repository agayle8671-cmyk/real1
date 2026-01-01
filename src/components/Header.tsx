import React, { useState } from 'react';

export default function Header() {
    const [searchFocused, setSearchFocused] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-primary-blue flex items-center px-4 z-50 shadow-header">
            <div className="flex items-center gap-2">
                <button className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                    <span className="material-icons">menu</span>
                </button>
                <a href="#" className="flex items-center gap-2 text-white px-3 py-2 rounded">
                    <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-primary-blue font-bold text-lg">
                        L
                    </div>
                    <span className="font-google-sans text-lg font-medium">LaunchStack</span>
                </a>
            </div>

            <div className="flex items-center gap-2 bg-white/15 px-4 py-2 rounded ml-6 cursor-pointer hover:bg-white/25 border border-white/30 text-white min-w-[200px]">
                <span className="text-sm">My First Project</span>
                <span className="material-icons text-sm ml-auto">arrow_drop_down</span>
            </div>

            <div className="flex-1 max-w-3xl mx-6">
                <div className={`flex items-center bg-white/15 rounded-lg px-4 h-[46px] border border-transparent transition-all ${searchFocused ? 'bg-white border-border-console text-text-primary' : ''}`}>
                    <span className={`material-icons text-xl ${searchFocused ? 'text-text-secondary' : 'text-white/80'}`}>search</span>
                    <input
                        type="text"
                        className={`flex-1 border-none bg-transparent outline-none text-base ml-3 ${searchFocused ? 'text-text-primary placeholder-text-secondary' : 'text-white placeholder-white/70'}`}
                        placeholder="Search resources, docs, products, and more"
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                    />
                </div>
            </div>

            <div className="flex items-center gap-1 ml-auto">
                <button className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10">
                    <span className="material-icons">terminal</span>
                </button>
                <button className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10">
                    <span className="material-icons">help_outline</span>
                </button>
                <button className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10">
                    <span className="material-icons">notifications</span>
                </button>
                <div className="w-8 h-8 rounded-full bg-google-green text-white flex items-center justify-center text-sm font-medium ml-2 cursor-pointer">
                    K
                </div>
            </div>
        </header>
    );
}
