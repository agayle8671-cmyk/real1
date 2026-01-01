/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                slate: {
                    850: '#172033',
                    900: '#0f172a',
                    950: '#020617',
                },
                emerald: {
                    500: '#10b981',
                },
                amber: {
                    500: '#f59e0b',
                },
            },
            fontFamily: {
                mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
            },
        },
    },
    plugins: [],
}
