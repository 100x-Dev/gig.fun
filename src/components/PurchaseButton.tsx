'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '~/components/ui/Button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShoppingCart, AlertTriangle } from 'lucide-react';
import { Dialog } from './ui/Dialog';
import { usePurchaseService } from '~/hooks/usePurchaseService';

interface PurchaseButtonProps {
  serviceId: string;
  sellerFid: string;
  price: number;
  currency: string;
  className?: string;
}

export function PurchaseButton({
  serviceId,
  sellerFid,
  price,
  currency,
  className = '',
}: PurchaseButtonProps) {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const router = useRouter();
  const { handlePurchase, isLoading: isCheckingPurchase, hasPurchased, reset } = usePurchaseService();

  const handlePurchaseClick = async () => {
    if (status !== 'authenticated' || !session?.user?.fid) {
      router.push('/signin');
      return;
    }

    // Convert both to string for comparison to ensure type safety
    if (String(session.user.fid) === String(sellerFid)) {
      toast.error("You can't purchase your own service");
      return;
    }

    setIsLoading(true);
    
    try {
      const { success, isDuplicate } = await handlePurchase(serviceId);
      
      if (isDuplicate) {
        setShowDuplicateDialog(true);
        return;
      }
      
      if (success) {
        // Here you would typically integrate with your payment provider
        const response = await fetch('/api/purchases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            serviceId,
            amount: price,
            currency,
            paymentTxHash: `simulated-tx-${Date.now()}`,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to process purchase');
        }

        const purchase = await response.json();
        toast.success('Purchase successful!');
        
        // Redirect to the purchased service
        router.push(`/services/${serviceId}`);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to complete purchase');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleViewPurchases = () => {
    setShowDuplicateDialog(false);
    router.push('/purchases');
  };

  const loading = isLoading || isCheckingPurchase || status === 'loading';
  
  return (
    <>
      <Button
        onClick={handlePurchaseClick}
        disabled={loading}
        className={`flex items-center gap-2 ${className}`}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {isCheckingPurchase ? 'Checking...' : 'Processing...'}
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4" />
            Buy for {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency || 'USD',
            }).format(price)}
          </>
        )}
      </Button>
      
      <Dialog
        isOpen={showDuplicateDialog}
        onClose={() => setShowDuplicateDialog(false)}
        title="Already Purchased"
        confirmText="View Purchases"
        onConfirm={handleViewPurchases}
        cancelText="Close"
        size="md"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-yellow-600" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">You've already purchased this service</h3>
          <p className="text-sm text-gray-500 mb-6">
            It looks like you've already purchased this service. You can view your purchases in your account.
          </p>
        </div>
      </Dialog>
    </>
  );
}
