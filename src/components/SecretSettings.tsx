import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TreeContext, TreeContextType } from '../types';

interface SecretSettingsProps {
    onClose: () => void;
}

const SecretSettings: React.FC<SecretSettingsProps> = ({ onClose }) => {
    const { secretKey, setSecretKey } = useContext(TreeContext) as TreeContextType;
    const [newKey, setNewKey] = useState('');
    const [confirmKey, setConfirmKey] = useState('');
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');

    const handleSave = () => {
        if (!newKey.trim()) {
            setStatus('error');
            setMsg('Passphrase cannot be empty');
            return;
        }
        if (newKey !== confirmKey) {
            setStatus('error');
            setMsg('Passphrases do not match');
            return;
        }

        setSecretKey(newKey);
        setStatus('success');
        setMsg('Passphrase Updated Successfully');
        
        setTimeout(() => {
            onClose();
        }, 1500);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-black/90 border border-amber-200/30 p-8 max-w-sm w-full relative shadow-[0_0_50px_rgba(0,0,0,0.8)]"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl cinzel text-amber-100 mb-2 text-center">Update Secret</h2>
                <p className="text-amber-200/40 text-xs cinzel text-center mb-8 tracking-widest">
                    CURRENT: "{secretKey}"
                </p>

                <div className="space-y-6">
                    <div>
                        <label className="block text-amber-200/60 text-xs cinzel mb-2">New Passphrase</label>
                        <input
                            type="password"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 px-3 py-2 text-amber-100 cinzel focus:border-amber-200/50 outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-amber-200/60 text-xs cinzel mb-2">Confirm Passphrase</label>
                        <input
                            type="password"
                            value={confirmKey}
                            onChange={(e) => setConfirmKey(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 px-3 py-2 text-amber-100 cinzel focus:border-amber-200/50 outline-none transition-colors"
                        />
                    </div>
                </div>

                {status !== 'idle' && (
                    <div className={`mt-6 text-center text-sm cinzel ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {status === 'success' ? '✨ ' : '⚠️ '}{msg}
                    </div>
                )}

                <div className="mt-8 flex justify-between gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 border border-white/10 text-white/40 hover:bg-white/5 hover:text-white transition-colors cinzel text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-2 bg-amber-900/30 border border-amber-500/30 text-amber-200 hover:bg-amber-900/50 hover:border-amber-500/60 transition-colors cinzel text-sm"
                    >
                        Save
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SecretSettings;
