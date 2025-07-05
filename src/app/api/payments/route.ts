import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createClient } from '../../../utils/supabase/server';
import { authOptions } from '../../../auth';

type User = {
  id: string;
  username?: string;
  display_name?: string;
  pfp_url?: string;
};

type Service = {
  id: string;
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  user_id?: string;
  users?: User[];
};

type Purchase = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  buyer_id: string;
  seller_id: string;
  service_id?: string;
  services?: Service[];
};

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  buyer_id: string;
  seller_id: string;
  service?: {
    id: string;
    title: string;
    description?: string;
    price?: number;
    currency?: string;
    user?: User | null;
  } | null;
};

export async function GET() {
  console.log('Payments API: Request received');
  
  try {
    // Create a Supabase client configured to use cookies
    const supabase = await createClient();
    console.log('Supabase client created');
    
    // Get the session from the request
    console.log('Getting session...');
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'Found' : 'Not found');
    
    if (!session?.user?.fid) {
      console.error('Unauthorized: No session or user.fid found');
      return new NextResponse(
        JSON.stringify({ 
          error: 'Unauthorized',
          message: 'No valid session found',
          hasSession: !!session,
          hasUser: !!session?.user,
          hasFid: !!session?.user?.fid
        }), 
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
          } 
        }
      );
    }

    // Log the request for debugging
    console.log('Fetching payments for user:', session.user.fid);

    // First, get the user's purchases
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select(`
        id,
        amount,
        currency,
        status,
        created_at,
        buyer_id,
        seller_id,
        service_id,
        services (
          id,
          title,
          description,
          price,
          currency,
          user_id
        ),
        buyer:profiles!purchases_buyer_id_fkey (
          id,
          username,
          display_name,
          pfp_url
        ),
        seller:profiles!purchases_seller_id_fkey (
          id,
          username,
          display_name,
          pfp_url
        )
      `)
      .or(`buyer_id.eq.${session.user.fid},seller_id.eq.${session.user.fid}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    if (!purchases) {
      return new NextResponse(
        JSON.stringify({ data: [] }), 
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Transform the data to match our expected format
    const payments: Payment[] = purchases.map((purchase: any) => ({
      id: purchase.id,
      amount: purchase.amount,
      currency: purchase.currency || 'USD',
      status: (purchase.status?.toLowerCase() as 'completed' | 'pending' | 'failed') || 'completed',
      created_at: purchase.created_at,
      buyer_id: purchase.buyer_id,
      seller_id: purchase.seller_id,
      service: purchase.services ? {
        id: purchase.services.id,
        title: purchase.services.title,
        description: purchase.services.description,
        price: purchase.services.price,
        currency: purchase.services.currency,
        user: purchase.seller_id === session.user.fid 
          ? {
              id: purchase.seller?.id,
              username: purchase.seller?.username,
              display_name: purchase.seller?.display_name,
              pfp_url: purchase.seller?.pfp_url
            }
          : {
              id: purchase.buyer?.id,
              username: purchase.buyer?.username,
              display_name: purchase.buyer?.display_name,
              pfp_url: purchase.buyer?.pfp_url
            }
      } : null
    }));

    console.log(`Found ${payments?.length || 0} payments`);

    // Transform the data to match our Payment type
    const formattedPayments = (payments || []).map((payment: any) => ({
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency || 'USD',
      status: payment.status?.toLowerCase() || 'completed',
      date: payment.created_at,
      serviceTitle: payment.service?.title,
      receiver: payment.service?.user?.display_name || payment.service?.user?.username,
      description: payment.service?.title ? `Payment for ${payment.service.title}` : 'Service payment'
    })) || [];

    return NextResponse.json(formattedPayments);
  } catch (error: unknown) {
    console.error('Unexpected error in payments API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const errorStack = process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined;
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: errorMessage,
        ...(errorStack && { stack: errorStack })
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
