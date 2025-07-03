export interface Order {
  id: string;
  serviceId: string;
  buyerFid: string;
  sellerFid: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled' | 'disputed';
  createdAt: string;
  updatedAt: string;
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
}
