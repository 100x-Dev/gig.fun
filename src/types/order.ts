export interface Order {
  id: string;
  serviceId: string;
  buyerFid: string;
  sellerFid: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled' | 'disputed' | 'in-progress';
  createdAt: string;
  updatedAt: string;
  seller_notes?: string;
  seller_address?: string;
  buyer_fid?: string;
  seller_fid?: string;
  service_id?: string;
  created_at?: string;
  updated_at?: string;
  payment_type?: 'full' | 'split';
  final_payment_status?: 'pending' | 'completed';
  final_amount?: number;
  final_payment_tx_hash?: string;
  final_payment_date?: string;
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    seller: {
      fid: string;
      username?: string;
      displayName?: string;
    };
  };
  // The API doesn't return separate buyer/seller objects, so we'll create them from the available data
  buyer?: {
    id: string;
    username: string;
    display_name: string;
    pfp_url: string;
  };
  seller?: {
    id: string;
    username: string;
    display_name: string;
    pfp_url: string;
  };
}
