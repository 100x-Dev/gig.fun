export interface Service {
  id?: string;
  fid: number;             // Farcaster ID of service provider
  title: string;
  description: string;
  price: number;
  currency: 'ETH' | 'USDC' | string;
  deliveryDays: number;
  category: string;
  tags: string[];
  status?: 'active' | 'paused' | 'completed' | string;
  userName?: string;       // Display name of the service provider
  userPfp?: string;        // Profile picture URL of the service provider
  wallet_address?: string; // Wallet address of the service provider
  createdAt?: Date | string;
  updatedAt?: Date | string;
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
