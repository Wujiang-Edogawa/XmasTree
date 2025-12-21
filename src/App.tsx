import React, { useState, Suspense, useContext, useEffect, useRef } from 'react';
import { TreeContextType, AppState, TreeContext, PointerCoords } from './types';
import Experience from './components/Experience';
import TechEffects from './components/TechEffects';
import BackgroundMusic from './components/BackgroundMusic';
import { AnimatePresence, motion } from 'framer-motion';

// --- Error Boundary ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("3D Context Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-red-400 cinzel p-8 text-center z-50 relative bg-black">
                    <h2 className="text-2xl mb-4">⚠️ Graphics Error</h2>
                    <p className="text-sm opacity-80 mb-4">
                        {this.state.error?.message || "Something went wrong with the 3D scene."}
                    </p>
                    <p className="text-xs text-gray-500 mb-6">
                        Your device might struggle with the visual effects.
                    </p>
                    <button
                        className="px-6 py-2 border border-red-400/50 rounded hover:bg-red-400/10 transition-colors"
                        onClick={() => window.location.reload()}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

// --- 照片弹窗 ---
const PhotoModal: React.FC<{ url: string | null, onClose: () => void }> = ({ url, onClose }) => {
    if (!url) return null;
    return (
        <motion.div
            id="photo-modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-8 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.8, y: 50, rotate: -5 }}
                animate={{ scale: 1, y: 0, rotate: 0 }}
                exit={{ scale: 0.5, opacity: 0, y: 100 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative max-w-4xl max-h-full bg-white p-3 rounded shadow-[0_0_50px_rgba(255,215,0,0.3)] border-8 border-white"
                onClick={(e) => e.stopPropagation()}
            >
                <img src={url} alt="Memory" className="max-h-[80vh] object-contain rounded shadow-inner" />
                <div className="absolute -bottom-12 w-full text-center text-red-300/70 cinzel text-sm">
                    ❄️ Precious Moment ❄️ Tap to close
                </div>
            </motion.div>
        </motion.div>
    );
}

const AppContent: React.FC = () => {
    const { state, setState, pointer, setPointer, selectedPhotoUrl, setSelectedPhotoUrl, setClickTrigger, zoomOffset, setZoomOffset } = useContext(TreeContext) as TreeContextType;
    const zoomOffsetRef = useRef(zoomOffset);
    const activePointersRef = useRef(new Map<number, { x: number, y: number }>());
    const pinchStartRef = useRef<{ distance: number; zoomOffset: number } | null>(null);
    const pinchMovedRef = useRef(false);
    const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
    const ignoreClickUntilRef = useRef(0);

    useEffect(() => {
        zoomOffsetRef.current = zoomOffset;
    }, [zoomOffset]);

    const toggleState = () => {
        setState(state === 'CHAOS' ? 'FORMED' : 'CHAOS');
    };

    const setPointerFromClient = (clientX: number, clientY: number) => {
        const w = window.innerWidth || 1;
        const h = window.innerHeight || 1;
        setPointer({
            x: Math.max(0, Math.min(clientX / w, 1)),
            y: Math.max(0, Math.min(clientY / h, 1)),
        });
    };

    const updatePinchZoom = () => {
        if (!pinchStartRef.current || activePointersRef.current.size !== 2) return;
        const points = Array.from(activePointersRef.current.values());
        const dx = points[0].x - points[1].x;
        const dy = points[0].y - points[1].y;
        const distance = Math.hypot(dx, dy);
        if (pinchStartRef.current.distance <= 0) return;

        const scale = distance / pinchStartRef.current.distance;
        const raw = pinchStartRef.current.zoomOffset - (scale - 1) * 18;
        const next = Math.max(-20, Math.min(raw, 40));
        if (Math.abs(next - zoomOffsetRef.current) > 0.05) pinchMovedRef.current = true;
        setZoomOffset(next);
    };

    return (
        <main
            className="relative w-full h-screen bg-black text-white overflow-hidden"
            style={{ touchAction: 'none' }}
            onPointerMove={(e) => {
                setPointerFromClient(e.clientX, e.clientY);
                if (activePointersRef.current.has(e.pointerId)) {
                    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
                    if (activePointersRef.current.size === 2) updatePinchZoom();
                }
            }}
            onPointerDown={(e) => {
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                setPointerFromClient(e.clientX, e.clientY);
                activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

                if (activePointersRef.current.size === 2) {
                    const points = Array.from(activePointersRef.current.values());
                    pinchStartRef.current = { distance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y), zoomOffset: zoomOffsetRef.current };
                    pinchMovedRef.current = false;
                    ignoreClickUntilRef.current = Date.now() + 500;
                    lastTapRef.current = null;
                    return;
                }

                const now = Date.now();
                const lastTap = lastTapRef.current;
                const isFast = lastTap && now - lastTap.time < 280;
                const isClose = lastTap && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 25;
                if (isFast && isClose) {
                    ignoreClickUntilRef.current = now + 500;
                    lastTapRef.current = null;
                    toggleState();
                    return;
                }
                lastTapRef.current = { time: now, x: e.clientX, y: e.clientY };
            }}
            onPointerUp={(e) => {
                setPointerFromClient(e.clientX, e.clientY);
                activePointersRef.current.delete(e.pointerId);
                if (activePointersRef.current.size < 2) pinchStartRef.current = null;

                if (pinchMovedRef.current) {
                    ignoreClickUntilRef.current = Date.now() + 500;
                    pinchMovedRef.current = false;
                    return;
                }

                if (Date.now() < ignoreClickUntilRef.current) return;
                if (e.pointerType === 'mouse' && e.button !== 0) return;

                setClickTrigger(Date.now());
            }}
            onPointerCancel={(e) => {
                activePointersRef.current.delete(e.pointerId);
                if (activePointersRef.current.size < 2) pinchStartRef.current = null;
            }}
            onDoubleClick={() => {
                ignoreClickUntilRef.current = Date.now() + 500;
                toggleState();
            }}
            onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY * 0.02;
                setZoomOffset(prev => Math.max(-20, Math.min(prev + delta, 40)));
            }}
        >

            {/* 3D 场景层 (z-10) */}
            <div className="absolute inset-0 z-10">
                <ErrorBoundary>
                    <Suspense fallback={<div className="flex items-center justify-center h-full text-red-400 cinzel animate-pulse text-2xl">🎄 Loading Christmas Magic... ❄️</div>}>
                        <Experience />
                    </Suspense>
                </ErrorBoundary>
            </div>

            {/* 科技感特效层 (z-20) */}
            <TechEffects />

            {/* 背景音乐组件 */}
            <BackgroundMusic />

            {/* UI 层 (z-30) */}
            <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-8">
                <header className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl md:text-6xl font-bold cinzel text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-green-200 to-amber-100 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                            🎄 CHRISTMAS MEMORIES ❄️
                        </h1>
                        <p className="text-red-400/80 cinzel tracking-widest text-sm mt-2">
                            {state === 'CHAOS' ? '✨ SCATTERED MEMORIES // EXPLORE YOUR JOURNEY ✨' : '🎁 MEMORY TREE // TIMELINE OF LOVE 🎁'}
                        </p>
                    </div>
                </header>
            </div>

            {/* 弹窗层 (z-100) */}
            <AnimatePresence>
                {selectedPhotoUrl && <PhotoModal url={selectedPhotoUrl} onClose={() => setSelectedPhotoUrl(null)} />}
            </AnimatePresence>
        </main>
    );
};

const App: React.FC = () => {
    const [state, setState] = useState<AppState>('CHAOS');
    const [rotationSpeed, setRotationSpeed] = useState<number>(0.3); // 固定基础旋转速度
    const [pointer, setPointer] = useState<PointerCoords | null>(null);
    const [clickTrigger, setClickTrigger] = useState<number>(0);
    const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
    const [zoomOffset, setZoomOffset] = useState<number>(0);

    return (
        <TreeContext.Provider value={{
            state, setState,
            rotationSpeed, setRotationSpeed,
            pointer, setPointer,
            clickTrigger, setClickTrigger,
            selectedPhotoUrl, setSelectedPhotoUrl,
            zoomOffset, setZoomOffset
        }}>
            <AppContent />
        </TreeContext.Provider>
    );
};

export default App;
