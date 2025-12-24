
import React, { useState, useContext, useRef } from 'react';
import { TreeContext, TreeContextType } from '../types';
import { supabase } from '../supabaseClient';
import imageCompression from 'browser-image-compression';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

const CreatorDashboard: React.FC = () => {
    const { photos, setPhotos, letterContent, setLetterContent, isCreatorMode, selectedMusic, setSelectedMusic } = useContext(TreeContext) as TreeContextType;
    const [isOpen, setIsOpen] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [spellKey, setSpellKey] = useState('');
    const [saveMessage, setSaveMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const musicInputRef = useRef<HTMLInputElement>(null);
    const [uploadedMusicList, setUploadedMusicList] = useState<{ label: string; value: string }[]>([]);
    const [musicUploading, setMusicUploading] = useState(false);

    const AVAILABLE_MUSIC = [
        { label: 'Laufey - Christmas Dreaming', value: '/music/bgm.mp3' },
        { label: 'Laufey - Love to Keep Me Warm', value: '/music/bgm2.mp3' },
    ];

    // Load cloud music library on init
    React.useEffect(() => {
        if (!isCreatorMode) return;

        // If editing an existing tree, restore its custom music to the list
        if (selectedMusic && selectedMusic.length > 0) {
            const customMusic = selectedMusic
                .filter(url => !AVAILABLE_MUSIC.some(am => am.value === url)) // Filter out default music
                .map(url => {
                    // Try to extract filename from URL for label
                    // Expected format: .../music/UUID_filename.mp3
                    let label = 'Custom Music';
                    try {
                        const parts = url.split('/');
                        const filename = parts[parts.length - 1];
                        const nameParts = filename.split('_');
                        if (nameParts.length > 1) {
                            label = decodeURIComponent(nameParts.slice(1).join('_'));
                        } else {
                            label = filename;
                        }
                    } catch (e) {
                        console.warn("Failed to parse music label", e);
                    }
                    return { label, value: url, fileName: undefined }; // fileName undefined means we can't delete it directly from list view easily without more info, but that's okay for now
                });
            
            setUploadedMusicList(prev => {
                // Merge without duplicates
                const existingValues = new Set(prev.map(p => p.value));
                const newItems = customMusic.filter(p => !existingValues.has(p.value));
                return [...prev, ...newItems];
            });
        }
    }, [isCreatorMode, selectedMusic]);

    if (!isCreatorMode) return null;

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);

        const files = Array.from(e.target.files);
        const uploadPromises = files.map(async (file) => {
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
                
                return { status: 'fulfilled', value: { url: data.publicUrl, fileName: file.name } };
            } catch (error: any) {
                console.error(`Error uploading ${file.name}:`, error);
                return { status: 'rejected', reason: error.message, fileName: file.name };
            }
        });

        const results = await Promise.all(uploadPromises);
        
        const successfulUploads = results
            .filter((r): r is { status: 'fulfilled'; value: { url: string; fileName: string } } => r.status === 'fulfilled')
            .map(r => r.value);
            
        const failedUploads = results
            .filter((r): r is { status: 'rejected'; reason: string; fileName: string } => r.status === 'rejected');

        if (successfulUploads.length > 0) {
            setPhotos([...photos, ...successfulUploads]);
        }

        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Feedback
        if (failedUploads.length > 0) {
            alert(`Uploaded ${successfulUploads.length} photos. Failed to upload ${failedUploads.length} photos:\n${failedUploads.map(f => `- ${f.fileName}: ${f.reason}`).join('\n')}`);
        } else if (successfulUploads.length > 0) {
            // Optional: Toast for complete success
            console.log(`Successfully uploaded all ${successfulUploads.length} photos.`);
        }
    };

    const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setMusicUploading(true);
        const file = e.target.files[0];
        
        try {
            // 1. Upload to Supabase 'music' bucket
            const fileName = `${uuidv4()}_${encodeURIComponent(file.name)}`;
            
            const { error: uploadError } = await supabase.storage
                .from('music') 
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data } = supabase.storage.from('music').getPublicUrl(fileName);
            
            const newMusic = { label: file.name, value: data.publicUrl };
            
            // 3. Update State
            setUploadedMusicList(prev => [...prev, newMusic]);
            setSelectedMusic([...selectedMusic, newMusic.value]); // Add uploaded music to selection
            
            console.log('Music uploaded successfully:', newMusic);
        } catch (error: any) {
            console.error('Error uploading music:', error);
            alert(`Failed to upload music. Please ensure a public storage bucket named 'music' exists in your Supabase project.\nError: ${error.message}`);
        } finally {
            setMusicUploading(false);
            if (musicInputRef.current) musicInputRef.current.value = '';
        }
    };

    const handleSave = async (isDraft: boolean) => {
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

            const musicPayload = JSON.stringify({
                playlist: selectedMusic,
                isDraft: isDraft
            });

            if (existing) {
                // Check ownership/draft status from existing data if needed.
                // For now, we overwrite.

                const { error } = await supabase
                    .from('christmas_trees')
                    .update({
                        creator_name: 'Santa Helper',
                        photo_urls: photos.map(p => p.url),
                        letter_content: letterContent,
                        music_id: musicPayload
                    })
                    .eq('spell_key', spellKey);

                if (error) throw error;
            } else {
                // Insert New
                const { error } = await supabase
                    .from('christmas_trees')
                    .insert({
                        spell_key: spellKey,
                        creator_name: 'Santa Helper', 
                        photo_urls: photos.map(p => p.url),
                        letter_content: letterContent,
                        music_id: musicPayload
                    });

                if (error) throw error;
            }

            setSaveMessage(isDraft ? 'Draft saved successfully!' : `Success! Share this spell: ${spellKey}`);
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

    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleDeleteTree = async () => {
        if (!spellKey) return;
        
        if (!confirmDelete) {
            setConfirmDelete(true);
            setTimeout(() => setConfirmDelete(false), 3000); // Reset after 3s
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
            setConfirmDelete(false);
        }
    };

    const handleDeleteMusic = async (musicToDelete: { label: string; value: string; fileName?: string }) => {
        if (!musicToDelete.fileName) return; // Cannot delete default music or items without filename
        
        if (!window.confirm(`Are you sure you want to delete "${musicToDelete.label}"? This action cannot be undone.`)) {
            return;
        }

        try {
            // 1. Delete from Supabase
            const { error } = await supabase.storage.from('music').remove([musicToDelete.fileName]);
            
            if (error) throw error;

            // 2. Remove from uploaded list
            setUploadedMusicList(prev => prev.filter(m => m.value !== musicToDelete.value));

            // 3. Remove from selection if selected
            if (selectedMusic.includes(musicToDelete.value)) {
                setSelectedMusic(selectedMusic.filter(m => m !== musicToDelete.value));
            }

            console.log('Music deleted successfully:', musicToDelete.label);
        } catch (error: any) {
            console.error('Error deleting music:', error);
            alert(`Failed to delete music: ${error.message}`);
        }
    };

    const toggleMusicSelection = (url: string) => {
        if (selectedMusic.includes(url)) {
            setSelectedMusic(selectedMusic.filter(m => m !== url));
        } else {
            setSelectedMusic([...selectedMusic, url]);
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

                            {/* Music Selector */}
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">3. Choose Music</h3>
                                
                                {/* Music Upload Button */}
                                <input
                                    ref={musicInputRef}
                                    type="file"
                                    accept="audio/*"
                                    onChange={handleMusicUpload}
                                    className="hidden"
                                    id="music-upload"
                                />
                                <label
                                    htmlFor="music-upload"
                                    className={`block w-full text-center py-2 mb-3 border border-dashed border-white/20 rounded hover:border-amber-400 hover:text-amber-400 transition-colors cursor-pointer text-xs uppercase tracking-widest ${musicUploading ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    {musicUploading ? 'Uploading Music...' : '+ Upload Custom Music'}
                                </label>

                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                    {[...AVAILABLE_MUSIC, ...uploadedMusicList].map((music, idx) => {
                                        const isSelected = Array.isArray(selectedMusic) && selectedMusic.includes(music.value);
                                        // Check if this is a custom uploaded music (has fileName property)
                                        const isUploaded = 'fileName' in music;

                                        return (
                                            <div key={`${music.value}-${idx}`} className="relative mb-2">
                                                <label 
                                                    className={`
                                                        flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                                                        ${isSelected 
                                                            ? 'bg-amber-500/20 border-amber-500 text-amber-200' 
                                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex items-center overflow-hidden pr-6">
                                                        <input
                                                            type="checkbox"
                                                            value={music.value}
                                                            checked={isSelected}
                                                            onChange={() => toggleMusicSelection(music.value)}
                                                            className="hidden"
                                                        />
                                                        <span className="text-sm truncate mr-2">{music.label}</span>
                                                    </div>
                                                    {isSelected && <span className="text-xs shrink-0">🎵</span>}
                                                </label>
                                                
                                                {isUploaded && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteMusic(music as any);
                                                        }}
                                                        className="absolute top-0 right-0 h-full px-3 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded-r-lg transition-all flex items-center justify-center"
                                                        title="Delete this music"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Save & Publish */}
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">4. Cast Spell</h3>
                                <input
                                    type="text"
                                    value={spellKey}
                                    onChange={(e) => setSpellKey(e.target.value)}
                                    placeholder="Enter a magic word (e.g. LOVE2025)"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm mb-3 focus:border-amber-400 focus:outline-none"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleSave(true)}
                                        disabled={saving || uploading}
                                        className="flex-1 bg-white/10 border border-white/20 text-white font-bold py-3 rounded-lg hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-wider"
                                    >
                                        {saving ? 'Saving...' : 'Save Draft'}
                                    </button>
                                    <button
                                        onClick={() => handleSave(false)}
                                        disabled={saving || uploading}
                                        className="flex-1 bg-gradient-to-r from-amber-600 to-red-600 text-white font-bold py-3 rounded-lg hover:from-amber-500 hover:to-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-wider"
                                    >
                                        {saving ? 'Casting...' : 'Confirm & Generate'}
                                    </button>
                                </div>
                                {saveMessage && (
                                    <p className={`mt-3 text-sm text-center ${saveMessage.includes('Success') ? 'text-green-400' : 'text-red-400'}`}>
                                        {saveMessage}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Delete Zone */}
                        <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center opacity-50 hover:opacity-100 transition-opacity relative z-50">
                            <span className="text-xs text-gray-500">Danger Zone</span>
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDeleteTree();
                                }}
                                disabled={!spellKey || saving}
                                className={`text-xs ${confirmDelete ? 'text-red-600 font-bold scale-110' : 'text-red-500 hover:text-red-400'} underline disabled:opacity-30 disabled:no-underline cursor-pointer transition-all`}
                            >
                                {confirmDelete ? 'Click AGAIN to Confirm Delete' : 'Delete this Tree'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CreatorDashboard;
