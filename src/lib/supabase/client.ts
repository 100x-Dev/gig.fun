import { createBrowserClient } from '@supabase/ssr';

// These should be set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Validate environment variables at runtime
const validateEnv = () => {
  const errors: string[] = [];
  
  if (!supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  
  if (!supabaseAnonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  }
  
  if (errors.length > 0) {
    console.error('Missing required environment variables:');
    errors.forEach(err => console.error(`- ${err}`));
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
  }
};

// Validate environment variables when the module loads
if (typeof window !== 'undefined') {
  validateEnv();
}

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createClient();
