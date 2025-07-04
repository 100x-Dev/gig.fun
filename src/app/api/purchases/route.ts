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
    const serviceId = searchParams.get('serviceId');
    const buyerFid = searchParams.get('buyerFid');

    const session = await getServerSession(authOptions);
    
    // If checking for a specific purchase, we still need to verify the session
    if (!session?.user?.fid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    // If checking for a specific purchase
    if (serviceId && buyerFid) {
      // Only allow checking own purchases
      if (Number(buyerFid) !== session.user.fid) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
      
      query = query
        .eq('buyer_fid', buyerFid)
        .eq('service_id', serviceId);
    } else {
      // Default: get all purchases for the current user
      query = query.eq('buyer_fid', session.user.fid);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchases:', error);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/purchases:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.fid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { serviceId, amount, currency, paymentTxHash, buyerNotes } = body;

    // Get service details to verify seller
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('fid, price')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Verify amount matches service price
    if (amount !== service.price) {
      return NextResponse.json(
        { error: 'Payment amount does not match service price' },
        { status: 400 }
      );
    }

    // Check if already purchased
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('buyer_fid', session.user.fid)
      .eq('service_id', serviceId)
      .maybeSingle();

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'You have already purchased this service' },
        { status: 400 }
      );
    }

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        buyer_fid: session.user.fid,
        seller_fid: service.fid,
        service_id: serviceId,
        amount,
        currency,
        payment_tx_hash: paymentTxHash || null,
        status: 'pending',
        buyer_notes: buyerNotes || null,
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Error creating purchase:', purchaseError);
      throw purchaseError;
    }

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/purchases:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
