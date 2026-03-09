import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

const isPlaceholder = supabaseUrl.includes('placeholder') || supabaseUrl.includes('your-project-url');

if (isPlaceholder) {
    console.warn('Supabase credentials are not set. Please update your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export { isPlaceholder };
