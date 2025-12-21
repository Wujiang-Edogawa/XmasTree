import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TreeContext, TreeContextType } from '../types';

const LetterModal: React.FC = () => {
    const { isLetterOpen, setIsLetterOpen, letterContent } = useContext(TreeContext) as TreeContextType;

    // 移除内部判断，改为在父组件控制渲染
    // if (!isLetterOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer"
            onClick={(e) => {
                e.stopPropagation();
                setIsLetterOpen(false);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onPointerMove={(e) => e.stopPropagation()}
        >
            <motion.div
                initial={{ scale: 0.5, rotate: -5, y: 50 }}
                animate={{ scale: 1, rotate: 0, y: 0 }}
                exit={{ scale: 0.5, rotate: 5, y: 100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="relative max-w-2xl w-full bg-[#fdf6e3] p-8 md:p-12 rounded shadow-[0_0_50px_rgba(255,215,0,0.4)] transform overflow-hidden cursor-auto"
                style={{
                    backgroundImage: `
                        radial-gradient(#e6ccb3 1px, transparent 1px),
                        radial-gradient(#e6ccb3 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 10px 10px'
                }}
                onClick={(e) => {
                   e.stopPropagation(); // 阻止事件冒泡到外层（虽然外层也是关闭，但为了防止重复触发或穿透）
                   // 这里不自动关闭，防止误触内容时关闭，用户必须点击背景或关闭按钮
                }}
            >
                {/* 关闭按钮 */}
                <button 
                    onClick={() => setIsLetterOpen(false)}
                    className="absolute top-4 right-4 z-50 p-2 text-[#8b4513]/60 hover:text-[#8b4513] transition-colors"
                    title="Close Letter"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* 装饰边框 */}
                <div className="absolute inset-2 border-2 border-[#8b4513]/20 rounded border-dashed pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-2 bg-repeat-x opacity-50" 
                     style={{ backgroundImage: 'linear-gradient(45deg, #c0392b 25%, transparent 25%, transparent 50%, #c0392b 50%, #c0392b 75%, transparent 75%, transparent)', backgroundSize: '20px 20px' }} />
                
                {/* 邮戳效果 */}
                <div className="absolute top-8 right-8 w-24 h-24 rounded-full border-4 border-red-800/30 flex items-center justify-center rotate-12 pointer-events-none">
                    <div className="text-red-800/30 font-bold text-xs text-center cinzel">
                        SANTA POST<br/>NORTH POLE<br/>2025
                    </div>
                </div>

                <div className="relative z-10 text-center">
                    <h2 className="text-3xl md:text-4xl cinzel font-bold text-[#8b4513] mb-8 drop-shadow-sm">
                        🎄 A Letter For You 🎄
                    </h2>
                    
                    <div className="font-serif text-[#5d4037] text-lg md:text-xl leading-relaxed whitespace-pre-wrap italic">
                        {letterContent || "Loading your Christmas letter..."}
                    </div>

                    <div className="mt-12 text-[#8b4513]/60 text-sm cinzel tracking-widest">
                        ~ Click anywhere to close ~
                    </div>
                </div>

                {/* 雪花装饰 */}
                <div className="absolute top-4 left-4 text-2xl opacity-20 text-[#8b4513]">❄️</div>
                <div className="absolute bottom-4 right-4 text-2xl opacity-20 text-[#8b4513]">❄️</div>
            </motion.div>
        </motion.div>
    );
};

export default LetterModal;
