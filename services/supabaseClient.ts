import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// ATENÇÃO: Os valores abaixo foram configurados conforme solicitado.
const supabaseUrl = 'https://nfzwlzffjmofyvrmrrno.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mendsemZmam1vZnl2cm1ycm5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNzU3MjUsImV4cCI6MjA3MDc1MTcyNX0.dPmaioBzCDp0UxOBz7zidgz6atb-ELvmLlUhCUu86Ao';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);