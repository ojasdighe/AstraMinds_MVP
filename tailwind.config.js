const colors = require('tailwindcss/colors');
// trigger rebuild quiz options
/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                heading: ['Poppins', 'sans-serif'],
                body: ['Work Sans', 'sans-serif'],
                space: ['"Space Grotesk"', 'sans-serif'],
            },
            spacing: { base: '1rem' },
            borderRadius: {
                small: '14px',
                large: '28px',
            },
            boxShadow: {
                custom: '0px 8px 32px rgba(11, 191, 191, 0.2)',
                'custom-hover': '0px 20px 60px rgba(11, 191, 191, 0.35)',
                'glow': '0 0 40px -10px rgba(11, 191, 191, 0.6)',
                'glow-teal': '0 0 40px -10px rgba(34, 211, 238, 0.6)',
                'glow-coral': '0 0 40px -10px rgba(255, 107, 107, 0.6)',
                'glow-yellow': '0 0 40px -10px rgba(255, 217, 61, 0.6)',
                'fintech': '0px 4px 24px -1px rgba(11, 191, 191, 0.3), inset 0px 1px 0px rgba(11, 191, 191, 0.08)',
                'fintech-hover': '0px 8px 32px -4px rgba(11, 191, 191, 0.45), inset 0px 1px 0px rgba(11, 191, 191, 0.15)',
                'accent-glow': '0px 0px 24px rgba(255, 217, 61, 0.45)',
            },
            colors: {
                border: "var(--border)",
                input: "var(--input)",
                ring: "var(--ring)",
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "var(--primary)",
                    foreground: "var(--primary-foreground)",
                },
                secondary: {
                    DEFAULT: "var(--secondary)",
                    foreground: "var(--secondary-foreground)",
                },
                destructive: {
                    DEFAULT: "var(--destructive)",
                    foreground: "var(--destructive-foreground)",
                },
                muted: {
                    DEFAULT: "var(--muted)",
                    foreground: "var(--muted-foreground)",
                },
                accent: {
                    DEFAULT: "var(--accent)",
                    foreground: "var(--accent-foreground)",
                },
                popover: {
                    DEFAULT: "var(--popover)",
                    foreground: "var(--popover-foreground)",
                },
                card: {
                    DEFAULT: "var(--card)",
                    foreground: "var(--card-foreground)",
                },
                // Standard neutral gray scale — no violet tinting
                gray: {
                    ...colors.neutral,
                },
                brand: {
                    // Core palette
                    teal:    '#0BBFBF',  // primary CTA / links / active states
                    orange:  '#FF7A2F',  // rewards / coins / streaks / energy
                    blue:    '#3B82F6',  // info / XP / stats
                    green:   '#10B981',  // savings / success / goals
                    purple:  '#8B5CF6',  // achievements / special items only
                    coral:   '#FF6B9D',  // quizzes / fun moments
                    yellow:  '#FFD93D',  // coins / rewards (kept for compatibility)
                    pink:    '#F472B6',  // fun / achievements (kept for compatibility)
                    dark:    '#0D1B2A',  // dark base (deep navy)
                    // Legacy aliases kept for existing code
                    indigo:  '#818CF8',
                    violet:  '#A78BFA',
                    accent:  '#FFD93D',
                }
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'float-delayed': 'float 6s ease-in-out 3s infinite',
                'float-fast': 'float 4s ease-in-out infinite',
                'pulse-slow': 'pulse 4s ease-in-out infinite',
                'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'fade-in': 'fadeIn 1s ease-out forwards',
                'bounce-soft': 'bounceSoft 2s infinite',
                'spin-slow': 'spin 12s linear infinite',
                'wiggle': 'wiggle 0.6s ease-in-out infinite',
                'pop': 'pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                bounceSoft: {
                    '0%, 100%': { transform: 'translateY(-5%)' },
                    '50%': { transform: 'translateY(0)' },
                },
                slideUp: {
                    from: { opacity: '0', transform: 'translateY(40px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                wiggle: {
                    '0%, 100%': { transform: 'rotate(-6deg)' },
                    '50%': { transform: 'rotate(6deg)' },
                },
                pop: {
                    from: { transform: 'scale(0.8)', opacity: '0' },
                    to:   { transform: 'scale(1)',   opacity: '1' },
                },
            }
        }
    },
    plugins: [],
}
