import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '~/auth';
import { supabase } from '~/lib/supabase/server';
import type { Database } from '~/types/supabase';

// Type for the service data we'll be inserting
type ServiceInsert = Database['public']['Tables']['services']['Insert'];

// Helper function to validate service data
function validateServiceData(data: any) {
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    return { error: 'Title is required' };
  }
  if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
    return { error: 'Description is required' };
  }
  if (data.price === undefined || isNaN(Number(data.price)) || Number(data.price) < 0) {
    return { error: 'Valid price is required' };
  }
  if (!data.currency || typeof data.currency !== 'string' || !['ETH', 'USDC'].includes(data.currency)) {
    return { error: 'Valid currency is required (ETH or USDC)' };
  }
  if (data.delivery_days === undefined || isNaN(Number(data.delivery_days)) || Number(data.delivery_days) < 1) {
    return { error: 'Valid delivery days is required (minimum 1 day)' };
  }
  if (!data.category || typeof data.category !== 'string' || data.category.trim().length === 0) {
    return { error: 'Category is required' };
  }
  return null;
}

export async function POST(request: Request) {
  console.log('--- SERVICE CREATION REQUEST STARTED ---');
  
  // Debug: Log Supabase configuration
  console.log('Supabase Config:', {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Present' : '❌ Missing',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Present' : '❌ Missing',
    nodeEnv: process.env.NODE_ENV || 'development'
  });

  try {
    const session = await getServerSession(authOptions);
    console.log('Service creation - Full session object:', JSON.stringify(session, null, 2));
    
    if (!session || !session.user?.fid) {
      console.error('Service creation failed - No valid session or FID found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const requestBody = await request.json();
    const validationError = validateServiceData(requestBody);
    if (validationError) {
      return NextResponse.json(
        { error: validationError.error },
        { status: 400 }
      );
    }

    // Get wallet address from the session if available
    const walletAddress = session.user.walletAddress || null;
    console.log('Service creation - Wallet address from session:', {
      walletAddress,
      hasWalletAddress: !!walletAddress,
      fid: session.user.fid,
      userId: session.user.id
    });
    
    if (!walletAddress) {
      console.warn('Service creation - No wallet address found in session');
    }

    const serviceData: ServiceInsert = {
      title: requestBody.title.trim(),
      description: requestBody.description.trim(),
      price: parseFloat(requestBody.price),
      currency: requestBody.currency.trim(),
      delivery_days: parseInt(requestBody.delivery_days, 10),
      category: requestBody.category.trim(),
      tags: Array.isArray(requestBody.tags) ? requestBody.tags : [],
      status: 'active',
      fid: session.user.fid,
      user_name: session.user.username || `user_${session.user.fid}`,
      user_pfp: session.user.pfpUrl || '',
      wallet_address: walletAddress, // Using the correct column name with underscore
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Prepared service data:', JSON.stringify(serviceData, null, 2));

    try {
      // Insert the service into the database
      const { data: insertedData, error, status, statusText } = await supabase
        .from('services')
        .insert([serviceData])
        .select()
        .single();

      if (error) {
        console.error('Full Supabase error object:', {
          name: error.name,
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status: status,
          statusText: statusText,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
        });
        
        return NextResponse.json(
          { 
            error: 'Failed to create service',
            details: error.message || 'Database operation failed',
            code: error.code || 'DB_ERROR',
            status: status || 500
          },
          { status: status || 500 }
        );
      }

      console.log('Insert successful, data:', insertedData);
      return NextResponse.json(insertedData, { status: 201 });
    } catch (error: any) {
      console.error('Unexpected error:', error);
      return NextResponse.json(
        { error: 'Internal server error', details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  } finally {
    console.log('--- SERVICE CREATION REQUEST COMPLETED ---');
  }
}

export async function GET() {
  try {
    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message || 'Failed to fetch services');
    }

    return NextResponse.json(services || []);
  } catch (error: any) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}