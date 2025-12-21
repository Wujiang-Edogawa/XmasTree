import React, { useEffect, useRef, useState } from 'react';

const BackgroundMusic: React.FC = () => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = 0.5; // 设置默认音量

        const tryPlay = async () => {
            try {
                await audio.play();
                setIsPlaying(true);
            } catch (error) {
                console.log("Autoplay prevented:", error);
                setIsPlaying(false);
            }
        };

        // 尝试自动播放
        tryPlay();

        // 监听交互以恢复播放
        const handleInteraction = () => {
            if (audio.paused) {
                tryPlay();
            }
        };

        // 监听页面可见性变化 (针对移动端切后台)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isPlaying) {
                tryPlay();
            }
        };

        window.addEventListener('click', handleInteraction, { once: true });
        window.addEventListener('touchstart', handleInteraction, { once: true });
        window.addEventListener('keydown', handleInteraction, { once: true });
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="fixed top-6 right-6 z-50 pointer-events-auto">
            <audio ref={audioRef} src="/music/bgm.mp3" loop />
            <button
                onClick={togglePlay}
                className={`
                    p-3 rounded-full transition-all duration-300
                    flex items-center justify-center w-12 h-12
                    border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)]
                    ${isPlaying 
                        ? 'bg-red-500/20 text-red-200 animate-[spin_4s_linear_infinite] hover:bg-red-500/30' 
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                    }
                `}
                title={isPlaying ? "Pause Music" : "Play Music"}
            >
                {isPlaying ? (
                    <span className="text-xl">🎵</span>
                ) : (
                    <span className="text-xl">🔇</span>
                )}
            </button>
        </div>
    );
};

export default BackgroundMusic;
