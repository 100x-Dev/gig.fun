import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '~/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'purchased' | 'ordered' | null;

    const session = await getServerSession(authOptions);

    if (!session?.user?.fid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fid = session.user.fid;

    let query = supabase
      .from('purchases')
      .select(`
        *,
        service:services!inner(
          id,
          title,
          description,
          price,
          currency,
          seller_fid: fid,
          seller_username: user_name,
          seller_pfp: user_pfp
        )
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
