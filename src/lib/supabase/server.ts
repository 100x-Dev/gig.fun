import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookie = await cookieStore.get(name);
          return cookie?.value;
        },
        async set(name: string, value: string, options: any) {
          try {
            await cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle error if needed
          }
        },
        async remove(name: string, options: any) {
          try {
            await cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle error if needed
          }
        },
      },
    }
  );
}
