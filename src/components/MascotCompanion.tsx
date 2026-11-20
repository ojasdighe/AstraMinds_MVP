import { useEffect, useRef, useState, useCallback } from 'react';

export type MascotState =
    | 'idle'
    | 'email-focus'
    | 'password-focus'
    | 'loading'
    | 'success'
    | 'error';

export const MASCOT_VIDEOS: Record<MascotState, string> = {
    'idle': '/mascot/6ab37da841036109Eu5VqXgiq1898.mp4',
    'email-focus': '/mascot/6ab37e72341209281Wir7fceQw4809.mp4',
    'password-focus': '/mascot/6ab3c76e141269258FwJBTJcou3974.mp4',
    'loading': '/mascot/6ab37f18630504412zpD3AHiMr6812.mp4',
    'success': '/mascot/6ab37cdb7730798593RTgGZWLG5017.mp4',
    'error': '/mascot/ErrorVideo.mp4',
};

export const MASCOT_POSTER = '/mascot/welcome-back-fluffy-horizontal.png';

export const MASCOT_SUBTITLES: Record<MascotState, string> = {
    'idle': 'Hey there! Ready to level up your money skills? 🚀',
    'email-focus': 'Watching you type... looking good! ✨',
    'password-focus': 'Shh! Looking away to protect your secret code! 🙈',
    'loading': 'Checking and verifying credentials... 🔍',
    'success': 'Woohoo! Welcome to AstraMinds! 🎉',
    'error': 'Oops! Let\'s check those details again 😬',
};

interface MascotCompanionProps {
    state?: MascotState;
    className?: string;
    showSpeechBubble?: boolean;
    speechText?: string;
    variant?: 'split' | 'floating' | 'card' | 'compact' | 'hero';
    blendEdges?: boolean;
    interactive?: boolean;
    crisp?: boolean;
    onStateChange?: (state: MascotState) => void;
}

// In-RAM Blob cache across instances to prevent repeated network fetching
const globalBlobCache = new Map<string, string>();

export default function MascotCompanion({
    state = 'idle',
    className = '',
    showSpeechBubble = false,
    speechText,
    variant = 'split',
    blendEdges = false,
    interactive = false,
    crisp = true,
    onStateChange,
}: MascotCompanionProps) {
    const videoARef = useRef<HTMLVideoElement | null>(null);
    const videoBRef = useRef<HTMLVideoElement | null>(null);
    const [showA, setShowA] = useState(true);
    const [internalState, setInternalState] = useState<MascotState>(state);
    const [videoLoaded, setVideoLoaded] = useState(false);
    const currentSrcRef = useRef(MASCOT_VIDEOS['idle']);
    const rafIdRef = useRef<number | null>(null);

    // Sync prop changes to internal state
    useEffect(() => {
        setInternalState(state);
    }, [state]);

    const activeState = internalState;

    const configureVideoEl = useCallback((el: HTMLVideoElement | null) => {
        if (!el) return;
        el.muted = true;
        el.defaultMuted = true;
        el.playsInline = true;
        el.setAttribute('muted', '');
        el.setAttribute('playsinline', '');
    }, []);

    // Initial load and delayed Blob preloading
    useEffect(() => {
        const videoA = videoARef.current;
        if (videoA) {
            configureVideoEl(videoA);
            const playPromise = videoA.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setVideoLoaded(true))
                    .catch(() => {
                        const onInteract = () => {
                            videoA.play().then(() => setVideoLoaded(true)).catch(() => {});
                            window.removeEventListener('pointerdown', onInteract);
                            window.removeEventListener('keydown', onInteract);
                        };
                        window.addEventListener('pointerdown', onInteract, { once: true });
                        window.addEventListener('keydown', onInteract, { once: true });
                    });
            }
        }

        // Delay preloading by 1.5s so idle video has priority bandwidth
        const timer = setTimeout(() => {
            if (variant === 'split' || variant === 'hero') {
                (['loading', 'success'] as MascotState[]).forEach(s => {
                    const url = MASCOT_VIDEOS[s];
                    if (!globalBlobCache.has(url)) {
                        fetch(url, { priority: 'low' } as RequestInit)
                            .then(res => res.blob())
                            .then(blob => {
                                globalBlobCache.set(url, URL.createObjectURL(blob));
                            })
                            .catch(() => {});
                    }
                });
            }
        }, 1500);

        return () => {
            clearTimeout(timer);
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        };
    }, [configureVideoEl, variant]);

    // Reactive State Transitions with Crossfade
    useEffect(() => {
        const targetSrc = MASCOT_VIDEOS[activeState];
        if (!targetSrc || targetSrc === currentSrcRef.current) return;

        const effectiveSrc = globalBlobCache.get(targetSrc) || targetSrc;
        const outgoing = showA ? videoARef.current : videoBRef.current;
        const incoming = showA ? videoBRef.current : videoARef.current;

        if (!incoming) return;

        configureVideoEl(incoming);
        incoming.src = effectiveSrc;
        currentSrcRef.current = targetSrc;

        const handleCanPlay = () => {
            incoming.removeEventListener('canplay', handleCanPlay);
            const playPromise = incoming.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {});
            }
            setShowA(prev => !prev);
            setVideoLoaded(true);

            rafIdRef.current = requestAnimationFrame(() => {
                setTimeout(() => {
                    if (outgoing && !outgoing.paused) {
                        outgoing.pause();
                    }
                }, 350);
            });
        };

        if (incoming.readyState >= 2) {
            handleCanPlay();
        } else {
            incoming.addEventListener('canplay', handleCanPlay, { once: true });
            setTimeout(() => {
                if (currentSrcRef.current === targetSrc && incoming.paused) {
                    incoming.play().catch(() => {});
                    setShowA(prev => !prev);
                }
            }, 800);
        }
    }, [activeState, showA, configureVideoEl]);

    // Interactive click handler for fun exploratory mode
    const handleMascotClick = () => {
        if (!interactive) return;
        const states: MascotState[] = ['idle', 'email-focus', 'password-focus', 'loading', 'success'];
        const currentIndex = states.indexOf(activeState);
        const nextState = states[(currentIndex + 1) % states.length];
        setInternalState(nextState);
        onStateChange?.(nextState);
    };

    const activeSpeech = speechText || MASCOT_SUBTITLES[activeState];

    // High-contrast, sharp color rendering to completely prevent whitewash/fog
    const crispFilterStyle: React.CSSProperties = crisp
        ? {
              filter: 'contrast(1.14) saturate(1.22) brightness(0.98)',
              imageRendering: 'auto',
          }
        : {};

    // For compact/avatar sizes, zoom in on the mascot face and upper body
    const videoFitClass =
        variant === 'compact'
            ? 'object-cover object-[center_32%] scale-[1.35]'
            : 'object-cover object-bottom';

    return (
        <div 
            onClick={handleMascotClick}
            className={`relative overflow-hidden flex flex-col items-center justify-center select-none ${interactive ? 'cursor-pointer' : ''} ${className}`}
        >
            {/* Background base matching character 3D environment */}
            <div className="absolute inset-0 bg-[#e2e9fd] -z-20" />

            {/* Poster fallback image (prevents any blank flash while videos load) */}
            <img
                src={MASCOT_POSTER}
                alt="Astra Mascot"
                style={crispFilterStyle}
                className={`absolute inset-0 w-full h-full transition-opacity duration-500 pointer-events-none -z-10 ${videoFitClass} ${
                    videoLoaded ? 'opacity-0' : 'opacity-100'
                }`}
            />

            {/* Video Layer A */}
            <video
                ref={(el) => {
                    videoARef.current = el;
                    configureVideoEl(el);
                }}
                src={MASCOT_VIDEOS['idle']}
                poster={MASCOT_POSTER}
                autoPlay
                muted
                playsInline
                loop
                preload="auto"
                disablePictureInPicture
                onLoadedData={() => setVideoLoaded(true)}
                style={crispFilterStyle}
                className={`absolute inset-0 w-full h-full transition-opacity duration-300 pointer-events-none ${videoFitClass} ${
                    showA ? 'opacity-100' : 'opacity-0'
                }`}
            />

            {/* Video Layer B */}
            <video
                ref={(el) => {
                    videoBRef.current = el;
                    configureVideoEl(el);
                }}
                poster={MASCOT_POSTER}
                autoPlay
                muted
                playsInline
                loop
                preload="none"
                disablePictureInPicture
                onLoadedData={() => setVideoLoaded(true)}
                style={crispFilterStyle}
                className={`absolute inset-0 w-full h-full transition-opacity duration-300 pointer-events-none ${videoFitClass} ${
                    !showA ? 'opacity-100' : 'opacity-0'
                }`}
            />

            {/* Seamless Edge Blending Overlays — ONLY for full split login page to prevent washing out cards/avatars */}
            {variant === 'split' && blendEdges && (
                <div className="absolute inset-0 pointer-events-none z-10">
                    <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-[#e2e9fd] to-transparent opacity-60" />
                    <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#e2e9fd] to-transparent opacity-60" />
                    <div className="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-r from-transparent to-[#e2e9fd] opacity-80" />
                </div>
            )}

            {/* Subtitle / Speech Caption at the BOTTOM of the frame */}
            {showSpeechBubble && activeSpeech && (
                <div className="absolute bottom-4 inset-x-3 sm:inset-x-4 z-20 flex flex-col items-center pointer-events-none">
                    <div className="px-4 py-2 bg-slate-950/85 dark:bg-slate-950/90 text-white text-xs sm:text-sm font-medium rounded-2xl shadow-xl backdrop-blur-md border border-white/20 max-w-[92%] text-center transition-all duration-300 flex items-center justify-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-teal-400 animate-pulse flex-shrink-0" />
                        <span className="tracking-wide drop-shadow-sm">{activeSpeech}</span>
                    </div>
                </div>
            )}

            {/* Interactive tap badge (only when speech bubble is off) */}
            {!showSpeechBubble && interactive && (
                <div className="absolute bottom-3 z-20 px-3 py-1 bg-black/60 backdrop-blur-md text-white/90 text-[11px] font-medium rounded-full shadow-md pointer-events-none flex items-center gap-1">
                    <span>✨ Tap me to react</span>
                </div>
            )}

            {/* Hidden eager preloading buffers */}
            {(variant === 'split' || variant === 'hero') && (
                <>
                    <video className="hidden" src={MASCOT_VIDEOS['loading']} preload="auto" muted playsInline />
                    <video className="hidden" src={MASCOT_VIDEOS['success']} preload="auto" muted playsInline />
                </>
            )}
        </div>
    );
}
