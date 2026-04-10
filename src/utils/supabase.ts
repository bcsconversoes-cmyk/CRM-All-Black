import { createClient } from '@supabase/supabase-js';

// As chaves do seu banco de dados
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Exportamos o cliente para que o App.tsx e o SideSheet.tsx consigam usá-lo
export const supabase = createClient(supabaseUrl, supabaseAnonKey);