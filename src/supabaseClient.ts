
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found in environment variables. Creator mode will not work.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

export type ChristmasTreeData = {
  id?: string;
  spell_key: string;
  creator_name: string;
  photo_urls: string[]; // JSON array of URLs
  music_id: string;
  letter_content: string;
  created_at?: string;
};
