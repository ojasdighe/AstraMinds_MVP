import { Link } from 'react-router-dom';

interface AppFooterProps {
    className?: string;
    compact?: boolean;
}

export default function AppFooter({ className = '', compact = false }: AppFooterProps) {
    const currentYear = new Date().getFullYear();

    if (compact) {
        return (
            <footer
                className={`w-full py-4 px-6 border-t border-gray-200/80 dark:border-white/10 bg-white/50 dark:bg-[#0c1626]/60 backdrop-blur-md transition-colors ${className}`}
            >
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                        <img src="/AstraMinds.ico" alt="AstraMinds" className="w-4 h-4 rounded object-cover" />
                        <span className="font-semibold tracking-wide text-gray-700 dark:text-gray-300">
                            AstraMinds - An Asterra Soultions Initiative
                        </span>
                    </div>
                    <div>
                        © {currentYear} All rights reserved. Made for young savers.
                    </div>
                </div>
            </footer>
        );
    }

    return (
        <footer
            className={`w-full py-6 px-6 mt-auto border-t border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-[#0c1626]/80 backdrop-blur-md transition-colors ${className}`}
        >
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2.5">
                    <img src="/AstraMinds.ico" alt="AstraMinds" className="w-5 h-5 rounded object-cover" />
                    <span className="font-semibold tracking-wide text-gray-800 dark:text-gray-200">
                        AstraMinds - An Asterra Soultions Initiative
                    </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                    <Link to="/privacy-policy" className="hover:text-teal-500 dark:hover:text-teal-300 transition-colors">
                        Privacy Policy
                    </Link>
                    <Link to="/terms-of-service" className="hover:text-teal-500 dark:hover:text-teal-300 transition-colors">
                        Terms of Service
                    </Link>
                    <Link to="/contact" className="hover:text-teal-500 dark:hover:text-teal-300 transition-colors">
                        Contact Us
                    </Link>
                    <span>
                        © {currentYear} AstraMinds. All rights reserved.
                    </span>
                </div>
            </div>
        </footer>
    );
}
