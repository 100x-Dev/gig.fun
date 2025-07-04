import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '~/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(
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

    const { status, seller_notes } = await request.json();
    if (!['completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // First, get the current purchase to verify ownership
    const { data: purchase, error: fetchError } = await supabase
      .from('purchases')
      .select('seller_fid, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (purchase.seller_fid !== session.user.fid) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Removing this check to allow updating notes on orders that are already 'completed'
    // from the payment perspective, which is the user's current workflow.
    /* if (purchase.status !== 'pending') {
        return NextResponse.json(
            { error: `Order has already been ${purchase.status}` },
            { status: 400 }
        );
    } */

    const updatePayload: any = {
      status,
      seller_notes,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      updatePayload.completed_at = new Date().toISOString();
    } else if (status === 'cancelled') {
      updatePayload.cancelled_at = new Date().toISOString();
    }

    const { data: updatedPurchase, error: updateError } = await supabase
      .from('purchases')
      .update(updatePayload)
      .eq('id', id)
      .select('*, service:services!inner(*)')
      .single();

    if (updateError) {
        console.error('Error updating order:', updateError);
        throw updateError;
    }

    return NextResponse.json(updatedPurchase);
  } catch (error) {
    console.error('Error in PUT /api/orders/[id]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { seller_notes } = await request.json();
    if (typeof seller_notes === 'undefined') {
      return NextResponse.json({ error: 'seller_notes is required' }, { status: 400 });
    }

    const { data: purchase, error: fetchError } = await supabase
      .from('purchases')
      .select('seller_fid')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (purchase.seller_fid !== session.user.fid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: updatedPurchase, error: updateError } = await supabase
      .from('purchases')
      .update({
        seller_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, service:services!inner(*)')
      .single();

    if (updateError) {
      console.error('Error updating seller notes:', updateError);
      throw updateError;
    }

    return NextResponse.json(updatedPurchase);
  } catch (error) {
    console.error('Error in PATCH /api/orders/[id]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
