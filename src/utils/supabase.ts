// src/utils/supabase.ts
import { createClient } from '@supabase/supabase-js';

// 1. Buscamos as chaves de ambiente (Padrão do Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Melhoria: Tratamento de Erro Preventivo
// Se as variáveis estiverem vazias, avisamos o desenvolvedor no console
if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
        "🚨 Erro Crítico: Conexão com o Supabase falhou!",
        "As variáveis de ambiente não foram encontradas. Verifique se o seu arquivo '.env' existe na raiz do projeto e contém VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY."
    );
}

// 3. Criação e exportação do cliente garantindo os tipos (as string) 
// para evitar que o TypeScript reclame de variáveis possivelmente indefinidas.
export const supabase = createClient(
    supabaseUrl as string,
    supabaseAnonKey as string
);