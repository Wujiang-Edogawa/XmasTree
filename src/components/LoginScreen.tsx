import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TreeContext, TreeContextType } from '../types';

const LoginScreen: React.FC = () => {
    const { secretKey, setIsAuthenticated } = useContext(TreeContext) as TreeContextType;
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsChecking(true);

        // 模拟一点延迟，更有仪式感
        setTimeout(() => {
            if (input.trim() === secretKey) {
                setIsAuthenticated(true);
            } else {
                setError(true);
                setInput('');
                setTimeout(() => setError(false), 2000);
            }
            setIsChecking(false);
        }, 800);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1 } }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center overflow-hidden"
        >
            {/* 背景动态装饰 */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/30 via-black to-black" />
            </div>

            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 max-w-md w-full"
            >
                <h1 className="text-4xl md:text-5xl font-bold cinzel text-transparent bg-clip-text bg-gradient-to-r from-red-200 via-amber-100 to-red-200 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)] mb-8">
                    Christmas Memories
                </h1>

                <p className="text-red-300/60 cinzel tracking-widest text-sm mb-12">
                    🔒 SYSTEM LOCKED // ENTER PASSPHRASE
                </p>

                <form onSubmit={handleSubmit} className="relative group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter the Secret Whisper..."
                        className={`
                            w-full bg-black/50 border-b-2 
                            ${error ? 'border-red-500 text-red-400 placeholder-red-500/50' : 'border-amber-200/30 text-amber-100 placeholder-amber-200/20'}
                            px-4 py-3 text-center cinzel text-xl tracking-widest outline-none transition-all duration-300
                            focus:border-amber-200 focus:bg-amber-900/10
                        `}
                        autoFocus
                    />
                    
                    {/* 装饰性光标下划线动画 */}
                    <div className={`absolute bottom-0 left-0 h-[2px] bg-amber-400 transition-all duration-500 ${input ? 'w-full opacity-100' : 'w-0 opacity-0'}`} />

                    <button
                        type="submit"
                        disabled={!input || isChecking}
                        className={`
                            mt-12 px-8 py-3 rounded-full border border-amber-200/20
                            text-amber-200 cinzel tracking-[0.2em] text-sm
                            transition-all duration-500
                            ${input ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
                            hover:bg-amber-900/20 hover:border-amber-200/50 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)]
                        `}
                    >
                        {isChecking ? 'VERIFYING...' : 'UNLOCK MEMORIES'}
                    </button>
                </form>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute -bottom-16 left-0 right-0 text-red-500 cinzel text-sm font-bold tracking-wider"
                        >
                            ⚠️ ACCESS DENIED // INCORRECT PASSPHRASE
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};

export default LoginScreen;
