import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '~/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to verify order ownership
async function verifyOrderOwnership(orderId: string, fid: string | number, isSeller: boolean = true) {
  const { data: order, error } = await supabase
    .from('purchases')
    .select('buyer_fid, seller_fid')
    .eq('id', orderId)
    .single();

  if (error) {
    return { error: 'Order not found', status: 404 };
  }

  const fidToCheck = isSeller ? order.seller_fid : order.buyer_fid;
  if (String(fidToCheck) !== String(fid)) {
    return { error: 'Forbidden', status: 403 };
  }

  return { order };
}

// Handle seller note updates
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

    // Verify the user is the seller of this order
    const ownership = await verifyOrderOwnership(id, session.user.fid, true);
    if ('error' in ownership) {
      return NextResponse.json(
        { error: ownership.error },
        { status: ownership.status }
      );
    }

    // Update the seller note
    const { data: updatedOrder, error: updateError } = await supabase
      .from('purchases')
      .update({ 
        seller_note: note,
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

// Handle status updates
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

    const { status } = await request.json();
    if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Verify the user is the seller of this order
    const ownership = await verifyOrderOwnership(id, session.user.fid, true);
    if ('error' in ownership) {
      return NextResponse.json(
        { error: ownership.error },
        { status: ownership.status }
      );
    }

    const updatePayload: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Set appropriate timestamps based on status
    if (status === 'completed') {
      updatePayload.completed_at = new Date().toISOString();
    } else if (status === 'cancelled') {
      updatePayload.cancelled_at = new Date().toISOString();
    }

    const { data: updatedPurchase, error: updateError } = await supabase
      .from('purchases')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating order status:', updateError);
      throw updateError;
    }

    return NextResponse.json(updatedPurchase);
  } catch (error) {
    console.error('Error in PATCH /api/orders/[id]/status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
