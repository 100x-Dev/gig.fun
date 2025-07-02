export interface Service {
  id?: string;
  fid: number;             // Farcaster ID of service provider
  title: string;
  description: string;
  price: number;
  currency: 'ETH' | 'USDC';
  deliveryDays: number;
  category: string;
  tags: string[];
  status?: 'active' | 'paused' | 'completed';
  createdAt?: Date;
  updatedAt?: Date;
}

export const serviceCategories = [
  'Development',
  'Design',
  'Marketing',
  'Writing',
  'Business',
  'Finance',
  'Music',
  'Lifestyle',
  'Other'
] as const;
