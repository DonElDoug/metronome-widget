/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                mono: ['"iAWriterMonoS"', 'monospace'],
            },
            colors: {
                neutral: {
                    750: 'var(--card-bg)',
                    850: 'var(--bg-color)',
                },
                accent: {
                    DEFAULT: 'var(--accent-color)',
                    hover: 'var(--accent-hover)',
                },
                text: {
                    DEFAULT: 'var(--text-color)',
                }
            }
        },
    },
    plugins: [],
}
