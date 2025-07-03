export interface Service {
  id?: string;
  fid: number;
  title: string;
  description: string;
  price: number;
  currency: 'ETH' | 'USDC' | string;
  deliveryDays: number;
  category: string;
  tags: string[];
  status?: 'active' | 'paused' | 'completed' | 'inactive' | string;
  userName?: string;
  userPfp?: string;
  walletAddress?: string; // Corrected from wallet_address
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

// Helper function to convert snake_case data from API to camelCase Service object
export function serviceFromSnakeCase(data: any): Service {
  if (!data) return {} as Service;
  return {
    id: data.id,
    fid: data.fid,
    title: data.title,
    description: data.description,
    price: data.price,
    currency: data.currency,
    deliveryDays: data.delivery_days,
    category: data.category,
    tags: data.tags || [],
    status: data.status,
    userName: data.user_name,
    userPfp: data.user_pfp,
    walletAddress: data.wallet_address,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
