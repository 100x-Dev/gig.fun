import { createClient } from '@supabase/supabase-js';
import { Purchase, PurchaseStatus } from '~/types/purchase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type PurchaseWithService = Purchase & {
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    seller: {
      fid: string;
      username?: string;
      display_name?: string;
    };
  };
};

/**
 * Fetches all purchased gigs for a buyer
 */
export async function getPurchasedGigs(buyerFid: string): Promise<PurchaseWithService[]> {
  const { data, error } = await supabase
    .from('purchases')
    .select(`
      *,
      service:services!inner(
        id,
        title,
        description,
        price,
        currency,
        seller:profiles!services_seller_fid_fkey(
          fid,
          username,
          display_name
        )
      )
    `)
    .eq('buyer_fid', buyerFid)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching purchased gigs:', error);
    throw error;
  }

  return (data as unknown as PurchaseWithService[]) || [];
}

/**
 * Creates a new purchase record
 */
export async function createPurchase(purchaseData: {
  buyerFid: string;
  sellerFid: string;
  serviceId: string;
  amount: number;
  currency: string;
  paymentTxHash?: string;
}): Promise<Purchase> {
  const { data, error } = await supabase
    .from('purchases')
    .insert({
      buyer_fid: purchaseData.buyerFid,
      seller_fid: purchaseData.sellerFid,
      service_id: purchaseData.serviceId,
      amount: purchaseData.amount,
      currency: purchaseData.currency,
      payment_tx_hash: purchaseData.paymentTxHash || null,
      status: purchaseData.paymentTxHash ? 'completed' : 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating purchase:', error);
    throw error;
  }

  return data as unknown as Purchase;
}

/**
 * Updates the status of a purchase
 */
export async function updatePurchaseStatus(
  purchaseId: string,
  status: PurchaseStatus,
  buyerFid: string
): Promise<Purchase> {
  const { data, error } = await supabase
    .from('purchases')
    .update({ status })
    .eq('id', purchaseId)
    .eq('buyer_fid', buyerFid)
    .select()
    .single();

  if (error) {
    console.error('Error updating purchase status:', error);
    throw error;
  }

  return data as unknown as Purchase;
}

/**
 * Checks if a user has already purchased a service
 */
export async function hasPurchasedService(
  buyerFid: string,
  serviceId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('purchases')
    .select('id')
    .eq('buyer_fid', buyerFid)
    .eq('service_id', serviceId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error checking purchase status:', error);
    throw error;
  }

  return !!data;
}
