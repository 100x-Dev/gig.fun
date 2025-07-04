import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export function usePurchaseService() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPurchased, setHasPurchased] = useState<boolean>(false);
  const router = useRouter();
  const supabase = createClient();

  const checkExistingPurchase = async (serviceId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return false;

      const { data, error: purchaseError } = await supabase
        .from('purchases')
        .select('id')
        .eq('buyer_fid', session.user.id)
        .eq('service_id', serviceId)
        .maybeSingle();

      if (purchaseError) throw purchaseError;
      return !!data;
    } catch (error) {
      console.error('Error checking existing purchase:', error);
      return false;
    }
  };

  const handlePurchase = async (serviceId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return { success: false, isDuplicate: false };
      }

      // Check for existing purchase
      const alreadyPurchased = await checkExistingPurchase(serviceId);
      if (alreadyPurchased) {
        setHasPurchased(true);
        return { success: false, isDuplicate: true };
      }

      // Proceed with purchase
      router.push(`/purchase/${serviceId}`);
      return { success: true, isDuplicate: false };
    } catch (error) {
      console.error('Purchase error:', error);
      setError('Failed to process purchase. Please try again.');
      return { success: false, isDuplicate: false };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handlePurchase,
    isLoading,
    error,
    hasPurchased,
    reset: () => {
      setHasPurchased(false);
      setError(null);
    }
  };
}
