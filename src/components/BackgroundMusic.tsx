import React, { useEffect, useRef, useState, useContext } from 'react';
import { TreeContext, TreeContextType } from '../types';

const DEFAULT_PLAYLIST = ['/music/bgm.mp3', '/music/bgm2.mp3'];

const BackgroundMusic: React.FC = () => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const { setIsLetterOpen, selectedMusic } = useContext(TreeContext) as TreeContextType;
    const hasTriggeredLetterRef = useRef(false);

    // Determine effective playlist
    const playlist = (selectedMusic && selectedMusic.length > 0) 
        ? selectedMusic 
        : DEFAULT_PLAYLIST;

    // Reset index if playlist changes (optional, but good for safety)
    useEffect(() => {
        if (currentTrackIndex >= playlist.length) {
            setCurrentTrackIndex(0);
        }
    }, [playlist, currentTrackIndex]);

    // 监听播放结束 & 切歌逻辑
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.loop = false;

        const handleEnded = () => {
            if (!hasTriggeredLetterRef.current) {
                setIsLetterOpen(true);
                hasTriggeredLetterRef.current = true;
            }
            // 切换到下一首，但保持 isPlaying 状态
            setCurrentTrackIndex(prev => (prev + 1) % playlist.length);
        };

        // 当音频源准备好且处于播放状态时，自动播放
        const handleCanPlay = () => {
            if (isPlaying) {
                audio.play().catch(e => console.log("Continue play prevented:", e));
            }
        };

        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('canplay', handleCanPlay);

        return () => {
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('canplay', handleCanPlay);
        };
    }, [setIsLetterOpen, isPlaying, playlist]); // 添加 isPlaying 和 playlist 依赖

    // 移除原来的 useEffect [currentTrackIndex]，因为交给 onCanPlay 处理了

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = 0.5;

        const tryPlay = async () => {
            try {
                await audio.play();
                setIsPlaying(true);
            } catch (error) {
                console.log("Autoplay prevented:", error);
                // 不要在这里设置 setIsPlaying(false)，因为我们希望它在用户交互后自动恢复
                // 保持 isPlaying 为 false (初始状态) 或者 true (如果我们希望它是“试图播放”的状态)
                // 这里保持 false 比较安全，等待用户交互
                setIsPlaying(false);
            }
        };
        
        // 只有首次加载尝试播放
        tryPlay();

        const handleInteraction = () => {
            if (audio.paused) {
                audio.play()
                    .then(() => setIsPlaying(true))
                    .catch(e => console.log("Interaction play failed:", e));
            }
        };
        
        // ... (保持后面的交互监听代码)

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
            <audio ref={audioRef} src={playlist[currentTrackIndex]} />
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
