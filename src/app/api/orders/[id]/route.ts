import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    
    const { status } = await request.json();

    const { data: { session } } = await supabase.auth.getSession();
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

    // First, get the current purchase to verify ownership
    const { data: purchase, error: fetchError } = await supabase
      .from('purchases')
      .select('seller_fid')
      .eq('id', params.id)
      .single();

    if (fetchError) throw fetchError;
    if (purchase.seller_fid.toString() !== fid) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update the status
    const { data, error: updateError } = await supabase
      .from('purchases')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
        ...(status === 'cancelled' ? { cancelled_at: new Date().toISOString() } : {})
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
