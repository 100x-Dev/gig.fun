import { Service } from '~/types/service';
import { supabase } from '~/lib/supabase/client';

interface DatabaseService {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  delivery_days: number;
  category: string;
  tags: string[];
  status: string;
  fid: number;
  user_name?: string;
  user_pfp?: string;
  wallet_address?: string;
  created_at: string;
  updated_at: string;
}

function mapToService(service: DatabaseService): Service {
  return {
    id: service.id,
    title: service.title,
    description: service.description,
    price: service.price,
    currency: service.currency,
    deliveryDays: service.delivery_days,
    category: service.category,
    tags: service.tags || [],
    status: service.status,
    fid: service.fid,
    userName: service.user_name,
    userPfp: service.user_pfp,
    wallet_address: service.wallet_address,
    createdAt: service.created_at,
    updatedAt: service.updated_at
  };
}

export async function getServices(): Promise<Service[]> {
  try {
    console.log('Fetching services from Supabase...');
    
    // First check if we can connect to Supabase
    const { data: test, error: testError } = await supabase
      .from('services')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('Test query error:', testError);
    } else {
      console.log('Database connection test successful');
    }

    // Now try the actual query
    console.log('Fetching all services regardless of status...');
    const { data, error, status } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Query response:', {
      data: data ? data.length : 0,
      error: error?.message,
      status
    });

    if (error) {
      console.error('Supabase query error:', {
        message: error.message || 'Unknown error',
        details: error.details || 'No details available',
        hint: error.hint || 'No hint available',
        code: error.code || 'Unknown code',
        status: status || 'Unknown status',
        fullError: JSON.stringify(error, null, 2)
      });
      throw new Error(`Failed to fetch services: ${error.message || 'Unknown error'}`);
    }

    if (!data) {
      console.log('No data returned from Supabase');
      return [];
    }

    console.log('Raw data from database:', data);
    console.log(`Successfully fetched ${data.length} services`);
    const mappedServices = (data as DatabaseService[]).map(mapToService);
    console.log('Mapped services:', mappedServices);
    return mappedServices;
  } catch (err) {
    console.error('Error fetching services:', {
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined
    });
    throw err;
  }
}

export async function saveService(serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<Service | null> {
  try {
    const { data, error } = await supabase
      .from('services')
      .insert([{
        title: serviceData.title,
        description: serviceData.description,
        price: serviceData.price,
        currency: serviceData.currency,
        delivery_days: serviceData.deliveryDays,
        category: serviceData.category,
        tags: serviceData.tags,
        status: serviceData.status || 'active',
        fid: serviceData.fid,
        user_name: serviceData.userName,
        user_pfp: serviceData.userPfp,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single<DatabaseService>();

    if (error) {
      console.error('Save service error:', JSON.stringify({
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      }, null, 2));
      return null;
    }

    if (!data) {
      console.error('No data returned from save service operation');
      return null;
    }

    return mapToService(data);
  } catch (error: any) {
    console.error('Unexpected error in saveService:', error);
    return null;
  }
}

export async function getServiceById(id: string): Promise<Service | null> {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single<DatabaseService>();

    if (error) {
      console.error('Get service by ID error:', JSON.stringify({
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      }, null, 2));
      return null;
    }

    if (!data) {
      console.error('No service found with ID:', id);
      return null;
    }

    return mapToService(data);
  } catch (error) {
    console.error('Unexpected error in getServiceById:', error);
    return null;
  }
}