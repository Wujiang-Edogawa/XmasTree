
import React, { useState, useContext, useRef } from 'react';
import { TreeContext, TreeContextType } from '../types';
import { supabase } from '../supabaseClient';
import imageCompression from 'browser-image-compression';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

const CreatorDashboard: React.FC = () => {
    const { photos, setPhotos, letterContent, setLetterContent, isCreatorMode } = useContext(TreeContext) as TreeContextType;
    const [isOpen, setIsOpen] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [spellKey, setSpellKey] = useState('');
    const [saveMessage, setSaveMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isCreatorMode) return null;

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);

        const files = Array.from(e.target.files);
        const newPhotos = [...photos];

        for (const file of files) {
            try {
                // 1. Compress
                const options = {
                    maxSizeMB: 0.5,
                    maxWidthOrHeight: 1024,
                    useWebWorker: true
                };
                const compressedFile = await imageCompression(file, options);

                // 2. Upload to Supabase
                const fileExt = file.name.split('.').pop();
                const fileName = `${uuidv4()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('photos')
                    .upload(filePath, compressedFile);

                if (uploadError) throw uploadError;

                // 3. Get Public URL
                const { data } = supabase.storage.from('photos').getPublicUrl(filePath);
                
                newPhotos.push({ url: data.publicUrl, fileName: file.name });
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        }

        setPhotos(newPhotos);
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSave = async () => {
        if (!spellKey.trim()) {
            setSaveMessage('Please enter a magic spell!');
            return;
        }
        setSaving(true);
        setSaveMessage('');

        try {
            // Check if spell exists
            const { data: existing } = await supabase
                .from('christmas_trees')
                .select('id')
                .eq('spell_key', spellKey)
                .single();

            if (existing) {
                setSaveMessage('This spell is already taken! Try another one.');
                setSaving(false);
                return;
            }

            const { error } = await supabase
                .from('christmas_trees')
                .insert({
                    spell_key: spellKey,
                    creator_name: 'Santa Helper', // Could be dynamic
                    photo_urls: photos.map(p => p.url),
                    letter_content: letterContent,
                    music_id: 'default' // TODO
                });

            if (error) throw error;

            setSaveMessage(`Success! Share this spell: ${spellKey}`);
        } catch (err: any) {
            console.error(err);
            setSaveMessage('Error saving: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleClearPhotos = () => {
        if (window.confirm('Are you sure you want to clear all photos?')) {
            setPhotos([]);
        }
    };

    const handleDeleteTree = async () => {
        if (!spellKey) return;
        
        const confirmStr = prompt(`Type "${spellKey}" to confirm deletion of this magic tree:`);
        if (confirmStr !== spellKey) {
            if (confirmStr) alert('Incorrect spell key. Deletion cancelled.');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('christmas_trees')
                .delete()
                .eq('spell_key', spellKey);

            if (error) throw error;

            alert('Tree deleted successfully! The magic has faded...');
            window.location.reload(); // Refresh to reset state
        } catch (err: any) {
            console.error(err);
            setSaveMessage('Error deleting: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div 
            onPointerDown={(e) => e.stopPropagation()} 
            onPointerMove={(e) => e.stopPropagation()} 
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-4 left-4 z-[200] bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-full text-white hover:bg-white/20 transition-all cursor-pointer pointer-events-auto"
            >
                {isOpen ? 'Close Editor' : 'Open Editor'}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: -400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -400, opacity: 0 }}
                        className="fixed top-0 left-0 h-full w-80 bg-black/80 backdrop-blur-xl z-[150] p-6 border-r border-white/10 overflow-y-auto text-white shadow-2xl pointer-events-auto flex flex-col"
                    >
                        <div className="flex-1">
                            <h2 className="text-2xl cinzel font-bold text-amber-400 mb-6">Create Magic</h2>

                            {/* Photo Upload */}
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">1. Add Memories</h3>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                    id="photo-upload"
                                />
                                <label
                                    htmlFor="photo-upload"
                                    className={`block w-full text-center py-3 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-amber-400 hover:text-amber-400 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    {uploading ? 'Uploading...' : '+ Upload Photos'}
                                </label>
                                <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                                    <span>{photos.length} photos added</span>
                                    <button onClick={handleClearPhotos} className="text-red-400 hover:text-red-300">Clear All</button>
                                </div>
                            </div>

                            {/* Letter Editor */}
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">2. Write a Letter</h3>
                                <textarea
                                    value={letterContent}
                                    onChange={(e) => setLetterContent(e.target.value)}
                                    placeholder="Write your Christmas wish..."
                                    className="w-full h-40 bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:border-amber-400 focus:outline-none resize-none"
                                />
                            </div>

                            {/* Save & Publish */}
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">3. Cast Spell</h3>
                                <input
                                    type="text"
                                    value={spellKey}
                                    onChange={(e) => setSpellKey(e.target.value)}
                                    placeholder="Enter a magic word (e.g. LOVE2025)"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm mb-3 focus:border-amber-400 focus:outline-none"
                                />
                                <button
                                    onClick={handleSave}
                                    disabled={saving || uploading}
                                    className="w-full bg-gradient-to-r from-amber-600 to-red-600 text-white font-bold py-3 rounded-lg hover:from-amber-500 hover:to-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Casting Spell...' : 'Save & Generate'}
                                </button>
                                {saveMessage && (
                                    <p className={`mt-3 text-sm text-center ${saveMessage.includes('Success') ? 'text-green-400' : 'text-red-400'}`}>
                                        {saveMessage}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Delete Zone */}
                        <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center opacity-50 hover:opacity-100 transition-opacity">
                            <span className="text-xs text-gray-500">Danger Zone</span>
                            <button 
                                onClick={handleDeleteTree}
                                disabled={!spellKey || saving}
                                className="text-xs text-red-500 hover:text-red-400 underline disabled:opacity-30 disabled:no-underline"
                            >
                                Delete this Tree
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CreatorDashboard;
