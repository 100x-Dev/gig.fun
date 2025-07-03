import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from '~/lib/auth';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest
) {
  try {
    // Extract ID from the URL
    const id = request.nextUrl.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      );
    }

    // Get the service by ID
    const { data: service, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching service:', error);
      return NextResponse.json(
        { error: 'Failed to fetch service' },
        { status: 500 }
      );
    }

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error in GET /api/services/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest
) {
  try {
    // Extract ID from the URL
    const id = request.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }
    
    const session = await getServerSession();
    
    if (!session?.user?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { deliveryDays, ...serviceData } = await request.json();

    // Get the current service to verify ownership
    const { data: existingService, error: fetchError } = await supabase
      .from('services')
      .select('fid')
      .eq('id', id)
      .single();

    if (fetchError || !existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Verify the user owns this service
    if (String(existingService.fid) !== String(session.user.fid)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Prepare data for Supabase with snake_case
    const updatePayload: { [key: string]: any } = {
      ...serviceData,
      updated_at: new Date().toISOString(),
    };
    if (deliveryDays !== undefined) {
      updatePayload.delivery_days = deliveryDays;
    }

    // Update the service
    const { data: updatedService, error: updateError } = await supabase
      .from('services')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating service:', updatePayload, updateError);
      return NextResponse.json(
        { error: updateError.message || 'Failed to update service' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Error in PUT /api/services/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest
) {
  try {
    // Extract ID from the URL
    const id = request.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }
    
    const session = await getServerSession();
    
    if (!session?.user?.fid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { status } = await request.json();

    // Get the current service to verify ownership
    const { data: existingService, error: fetchError } = await supabase
      .from('services')
      .select('fid')
      .eq('id', id)
      .single();

    if (fetchError || !existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Verify the user owns this service
    if (String(existingService.fid) !== String(session.user.fid)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update the service status
    const { data: updatedService, error: updateError } = await supabase
      .from('services')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating service status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update service status' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Error in PATCH /api/services/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
