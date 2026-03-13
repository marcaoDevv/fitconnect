import { createClient } from '@supabase/supabase-js';

// Substitua as frases abaixo pelos valores reais entre aspas
const supabaseUrl = 'https://hujolruxwsmxawqlaclk.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_Fswj79J42LtRmB-h3FxecA_JuCWfH7H';

console.log("DEBUG - Tentando conectar na URL:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

