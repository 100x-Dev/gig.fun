import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '~/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ALLOWED_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
type OrderStatus = (typeof ALLOWED_STATUSES)[number];

export async function PATCH(
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

    const { status } = await request.json();
    if (!status || !ALLOWED_STATUSES.includes(status as OrderStatus)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + ALLOWED_STATUSES.join(', ') },
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
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Only the seller can update the status
    if (purchase.seller_fid !== session.user.fid) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Prepare update payload
    const updatePayload: {
      status: string;
      updated_at: string;
      completed_at?: string;
      cancelled_at?: string;
    } = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Set appropriate timestamps based on status
    if (status === 'completed') {
      updatePayload.completed_at = new Date().toISOString();
    } else if (status === 'cancelled') {
      updatePayload.cancelled_at = new Date().toISOString();
    }

    // Update the order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('purchases')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating order status:', updateError);
      throw updateError;
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error in PATCH /api/orders/[id]/status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
