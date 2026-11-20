import { Download, Smartphone } from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';

interface PwaInstallButtonProps {
  className?: string;
  variant?: 'pill' | 'icon' | 'sidebar';
  label?: string;
}

export default function PwaInstallButton({
  className = '',
  variant = 'pill',
  label = 'Install App',
}: PwaInstallButtonProps) {
  const { isInstalled, promptInstall } = usePwaInstall();

  // If app is already installed and opened in standalone mode, hide button
  if (isInstalled) {
    return null;
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={promptInstall}
        className={`p-2 rounded-xl text-cyan-300 hover:text-white hover:bg-cyan-500/15 border border-cyan-400/20 transition-all cursor-pointer ${className}`}
        title="Install AstraMinds App"
        aria-label="Install AstraMinds App"
      >
        <Smartphone className="w-4 h-4" />
      </button>
    );
  }

  if (variant === 'sidebar') {
    return (
      <button
        onClick={promptInstall}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/25 transition-all cursor-pointer ${className}`}
      >
        <Download className="w-4 h-4 text-cyan-400 flex-shrink-0" />
        <span className="truncate">{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={promptInstall}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-cyan-200 hover:text-white bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${className}`}
    >
      <Download className="w-3.5 h-3.5 text-cyan-400" />
      <span>{label}</span>
    </button>
  );
}
