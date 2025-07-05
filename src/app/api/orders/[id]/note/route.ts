import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '~/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.fid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { note } = await request.json();
    if (!note || typeof note !== 'string') {
      return NextResponse.json(
        { error: 'Note is required' },
        { status: 400 }
      );
    }

    // First, get the current purchase to verify ownership
    const { data: purchase, error: fetchError } = await supabase
      .from('purchases')
      .select('seller_fid')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Only the seller can add notes
    if (purchase.seller_fid !== session.user.fid) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update the seller note
    const { data: updatedOrder, error: updateError } = await supabase
      .from('purchases')
      .update({ 
        seller_notes: note,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating seller note:', updateError);
      throw updateError;
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error in POST /api/orders/[id]/note:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
