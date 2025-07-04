import { Service } from './service';

export type PurchaseStatus = 'pending' | 'completed' | 'cancelled' | 'disputed';

export interface Purchase {
  id: string;
  buyer_fid: string;
  seller_fid: string;
  service_id: string;
  amount: number;
  currency: string;
  payment_tx_hash: string | null;
  status: PurchaseStatus;
  created_at: string;
  updated_at: string;
  service: Service;
}

export interface CreatePurchaseData {
  service_id: string;
  amount: number;
  currency: string;
  payment_tx_hash?: string;
}
