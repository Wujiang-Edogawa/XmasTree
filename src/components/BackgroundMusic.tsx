import React, { useEffect, useRef, useState, useContext } from 'react';
import { TreeContext, TreeContextType } from '../types';

const PLAYLIST = ['/music/bgm.mp3', '/music/bgm2.mp3'];

const BackgroundMusic: React.FC = () => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const { setIsLetterOpen } = useContext(TreeContext) as TreeContextType;
    const hasTriggeredLetterRef = useRef(false);

    // 监听播放结束 & 切歌逻辑
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // 确保不开启单曲循环，由 React 控制列表循环
        audio.loop = false;

        const handleEnded = () => {
            if (!hasTriggeredLetterRef.current) {
                // 第一次播放结束：弹出信件
                setIsLetterOpen(true);
                hasTriggeredLetterRef.current = true;
            }
            
            // 切换到下一首
            setCurrentTrackIndex(prev => (prev + 1) % PLAYLIST.length);
        };

        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('ended', handleEnded);
        };
    }, [setIsLetterOpen]);

    // 监听曲目变化，自动播放下一首
    useEffect(() => {
        // 只有当已经处于播放状态（或初始自动播放启动后），切歌才自动播放
        // 我们通过 isPlaying 标记来判断是否应该播放
        if (isPlaying) {
            const audio = audioRef.current;
            if (audio) {
                // 等待 src 更新后播放
                // React 的 render 是同步的，DOM 更新后 audio.src 已经变了
                // 但为了保险，可以稍微延迟一点或者直接播放
                audio.play().catch(e => console.log("Playlist continue play prevented:", e));
            }
        }
    }, [currentTrackIndex]);

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
            <audio ref={audioRef} src={PLAYLIST[currentTrackIndex]} />
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
