
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTree() {
    console.log('Checking for tree with spell_key: "Happy Christmas Jojo"...');
    
    const { data, error } = await supabase
        .from('christmas_trees')
        .select('*')
        .ilike('spell_key', '%Jojo%');

    if (error) {
        console.error('Error querying Supabase:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log(`Found ${data.length} tree(s) matching "Jojo":`);
        data.forEach(tree => {
            console.log(`- ID: ${tree.id}, Spell: "${tree.spell_key}", Creator: ${tree.creator_name}`);
        });
    } else {
        console.log('No trees found matching "Jojo".');
    }
}

checkTree();
