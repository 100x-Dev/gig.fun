import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'purchased' | 'ordered' | null;
    
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw sessionError;
    }
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the FID from the user's metadata
    const fid = session.user.user_metadata?.fid;
    if (!fid) {
      return NextResponse.json(
        { error: 'User FID not found' }, 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let query = supabase
      .from('purchases')
      .select(`
        *,
        service:services(*, seller:profiles(*))
      `);

    if (type === 'purchased') {
      // Gigs the user purchased from others
      query = query.eq('buyer_fid', fid);
    } else if (type === 'ordered') {
      // Gigs others purchased from the user
      query = query.eq('seller_fid', fid);
    } else {
      return NextResponse.json(
        { error: 'Invalid type parameter' }, 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export const dynamic = 'force-dynamic';
