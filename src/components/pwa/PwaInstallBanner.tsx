import { Download, X, Smartphone, Share, PlusSquare, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';

export default function PwaInstallBanner() {
  const {
    isInstalled,
    isDismissed,
    isIOS,
    showIOSModal,
    setShowIOSModal,
    promptInstall,
    dismissBanner,
  } = usePwaInstall();

  // If already running standalone or dismissed, do not show the floating banner
  const showBanner = !isInstalled && !isDismissed;

  return (
    <>
      {/* Floating Bottom Install Banner */}
      {showBanner && (
        <aside
          role="region"
          aria-label="Install AstraMinds application"
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-50 md:max-w-md animate-slide-up"
        >
          <div className="relative overflow-hidden rounded-2xl border border-cyan-400/30 bg-[#0F2744]/95 backdrop-blur-xl p-4 shadow-2xl shadow-cyan-950/60 text-white">
            {/* Top subtle glow highlight */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-cyan-400 to-indigo-500" />

            <div className="flex items-start gap-3.5">
              {/* App Icon */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-950 to-slate-900 border border-cyan-400/40 p-1 flex items-center justify-center shadow-md">
                  <img
                    src="/AstraMinds.ico"
                    alt="AstraMinds Logo"
                    className="w-9 h-9 rounded-lg object-contain"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full p-0.5 border border-[#0F2744]">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </div>
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2">
                  <h4 className="font-heading font-bold text-sm text-white tracking-tight">
                    Install AstraMinds App
                  </h4>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                    PWA
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-0.5 leading-snug">
                  Add to your home screen for quick, fullscreen learning &amp; offline challenges!
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2.5 mt-3">
                  <button
                    onClick={promptInstall}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Install App
                  </button>
                  <button
                    onClick={dismissBanner}
                    className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Maybe later
                  </button>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={dismissBanner}
                className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Dismiss install banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Instructions Modal (For iOS Safari or manual install) */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl border border-cyan-500/30 bg-[#0F2744] text-white p-6 shadow-2xl shadow-cyan-900/40">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-white">
                    {isIOS ? 'Install on iPhone / iPad' : 'Install AstraMinds App'}
                  </h3>
                  <p className="text-xs text-cyan-300">Add to your Home Screen</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step-by-step instructions */}
            <div className="py-5 space-y-4">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      1
                    </div>
                    <div className="text-xs text-gray-200">
                      Tap the <strong className="text-white">Share</strong> button{' '}
                      <Share className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> at the bottom of Safari.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      2
                    </div>
                    <div className="text-xs text-gray-200">
                      Scroll down and tap{' '}
                      <strong className="text-white">Add to Home Screen</strong>{' '}
                      <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-purple-400" />.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      3
                    </div>
                    <div className="text-xs text-gray-200">
                      Tap <strong className="text-white">Add</strong> in the top-right corner. You&apos;re done!
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      1
                    </div>
                    <div className="text-xs text-gray-200">
                      Tap your browser menu (<strong className="text-white">⋮</strong> or <strong className="text-white">⋯</strong>).
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      2
                    </div>
                    <div className="text-xs text-gray-200">
                      Select <strong className="text-white">Install app</strong> or <strong className="text-white">Add to Home screen</strong>.
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 pt-2 text-[11px] text-teal-300">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                <span>Works offline and launches in full-screen mode like a native app.</span>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
