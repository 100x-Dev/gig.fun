import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '~/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Extract ID from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // Get the ID from the URL path (before 'final-payment')
    
    console.log('Processing final payment for order ID:', id);
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.fid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { txHash } = body;
    
    if (!txHash || typeof txHash !== 'string' || !txHash.trim()) {
      return NextResponse.json(
        { error: 'Transaction hash is required' },
        { status: 400 }
      );
    }

    // Get the order to verify ownership and payment status
    const { data: order, error: orderError } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify the buyer is making the request
    if (order.buyer_fid !== session.user.fid) {
      return NextResponse.json(
        { error: 'You are not authorized to make the final payment for this order' },
        { status: 403 }
      );
    }

    // Verify this is a split payment and final payment is pending
    if (order.payment_type !== 'split' || order.final_payment_status !== 'pending') {
      return NextResponse.json(
        { error: 'This order does not require a final payment or has already been paid' },
        { status: 400 }
      );
    }

    // Verify the order is completed (work is done)
    if (order.status !== 'completed') {
      return NextResponse.json(
        { error: 'The order must be marked as completed before making the final payment' },
        { status: 400 }
      );
    }

    // Update the order with final payment information
    const { error: updateError } = await supabase
      .from('purchases')
      .update({
        final_payment_status: 'completed',
        final_payment_tx_hash: txHash.trim(),
        status: 'completed' // Assuming the overall order status is now completed
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating order with final payment:', updateError);
      return NextResponse.json(
        { error: 'Failed to process final payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Final payment processed successfully'
    });
  } catch (error) {
    console.error('Error processing final payment:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
