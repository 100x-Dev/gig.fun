import { useState, useEffect } from 'react';
import { useSendTransaction, useWriteContract, useAccount } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import { Button } from './ui/Button';
import { Service } from '../types/service';
import toast from 'react-hot-toast';

// USDC contract details on Base
const USDC_CONTRACT_ADDRESS = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const USDC_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

interface PaymentFormProps {
  service: Service;
  onClose: () => void;
}

export default function PaymentForm({ service, onClose }: PaymentFormProps) {
  const { address } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<Error | null>(null);

  // ETH Transaction
  const { 
    data: ethHash, 
    error: ethError, 
    isPending: isEthPending, 
    sendTransaction 
  } = useSendTransaction();

  // USDC Transaction with error suppression
  const { 
    data: usdcHash, 
    error: usdcError, 
    isPending: isUspcPending, 
    writeContractAsync 
  } = useWriteContract();

  // Handle USDC transaction errors
  useEffect(() => {
    if (usdcError) {
      console.log('USDC transaction error (not shown to user):', usdcError.message);
      // Set a timeout to clear the error after 1 second
      const timer = setTimeout(() => {
        setError(null);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [usdcError]);

  // Clear error state when component mounts or service changes
  useEffect(() => {
    setError(null);
  }, [service.id]);

  // Handle successful ETH transaction
  useEffect(() => {
    if (ethHash && !isProcessing) {
      setError(null); // Clear any previous errors
      handleSuccessfulPayment(ethHash);
    }
  }, [ethHash, isProcessing]);

  // Handle successful USDC transaction
  useEffect(() => {
    if (usdcHash && !isProcessing) {
      setError(null); // Clear any previous errors
      handleSuccessfulPayment(usdcHash);
    }
  }, [usdcHash, isProcessing]);

  // Handle transaction errors
  useEffect(() => {
    if (ethError) {
      console.error('Transaction error:', ethError);
      // Only set error if there's not already an error and it's a real error
      if (!error) {
        setError(ethError instanceof Error ? ethError : new Error(String(ethError)));
      }
    }
  }, [ethError, error]);

  useEffect(() => {
    if (usdcError) {
      console.error('Contract write error:', usdcError);
      // Only set error if there's not already an error and it's a real error
      if (!error) {
        setError(usdcError instanceof Error ? usdcError : new Error(String(usdcError)));
      }
    }
  }, [usdcError, error]);
  
  const isPending = isEthPending || isUspcPending || isProcessing;
  const hash = txHash || ethHash || usdcHash || '';
  const getErrorMessage = (err: unknown): string => {
    if (!err) return '';
    
    // Convert error to string for easier checking
    const errorStr = err instanceof Error ? err.message : String(err);
    
    // Check for specific error patterns
    if (errorStr.includes('insufficient funds') || 
        errorStr.includes('exceeds balance') ||
        errorStr.includes('User rejected the request')) {
      return 'Insufficient balance';
    }
    
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    return '';
  };

  // Only show error message if there's an actual error
  const errorMessage = error || ethError || usdcError ? 
    getErrorMessage(error) || getErrorMessage(ethError) || getErrorMessage(usdcError) : '';

  const isSupportedCurrency = ['ETH', 'USDC'].includes(service.currency.toUpperCase());

  const handleSuccessfulPayment = async (hash: string) => {
    if (!hash) return;
    
    setTxHash(hash);
    setIsProcessing(true);
    
    try {
      // Create a purchase record
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: service.id,
          amount: service.price,
          currency: service.currency,
          paymentTxHash: hash,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        // If it's a duplicate purchase error, handle it gracefully
        if (response.status === 400 && error.error?.includes('already purchased')) {
          toast.error('You have already purchased this service');
          onClose();
          return;
        }
        throw new Error(error.error || 'Failed to create purchase record');
      }

      toast.success('Payment and purchase recorded successfully!');
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
        // Refresh the page to show the new purchase
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Error creating purchase record:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to record purchase';
      setError(err instanceof Error ? err : new Error(errorMsg));
      
      // Don't show error toast for duplicate purchases as we handle it above
      if (!errorMsg.includes('already purchased')) {
        toast.error('Payment succeeded but failed to record purchase. Please contact support.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const checkExistingPurchase = async (serviceId: string): Promise<boolean> => {
    try {
      // Get the current session to check the buyer's FID
      const sessionResponse = await fetch('/api/auth/session');
      const session = await sessionResponse.json();
      
      if (!session?.user?.fid) {
        return false;
      }
      
      const response = await fetch(`/api/purchases?buyerFid=${session.user.fid}&serviceId=${serviceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // Prevent caching to get fresh data
      });

      if (response.ok) {
        const data = await response.json();
        // Check if there's any purchase for this service by the current user
        return Array.isArray(data) && data.length > 0;
      }
      return false;
    } catch (error) {
      console.error('Error checking existing purchase:', error);
      return false;
    }
  };

  const handlePayment = async () => {
    try {
      setError(null); // Clear any previous errors
      
      if (!service.walletAddress) {
        setError(new Error('Provider wallet address is not available.'));
        return;
      }

      if (!address) {
        setError(new Error('Please connect your wallet first'));
        return;
      }

      // Check for existing purchase first
      const alreadyPurchased = await checkExistingPurchase(String(service.id));
      if (alreadyPurchased) {
        setError(new Error('You have already purchased this service'));
        return;
      }

      const currency = service.currency.toUpperCase();

      try {
        if (currency === 'ETH') {
          await sendTransaction({
            to: service.walletAddress as `0x${string}`,
            value: parseEther(service.price.toString()),
            data: '0x',
          });
        } else if (currency === 'USDC') {
          const result = await writeContractAsync({
            address: USDC_CONTRACT_ADDRESS,
            abi: USDC_ABI,
            functionName: 'transfer',
            args: [
              service.walletAddress as `0x${string}`,
              parseUnits(service.price.toString(), 6), // USDC has 6 decimals
            ],
          });
          
          // If we get here but no result, the transaction was rejected
          if (!result) {
            throw new Error('Insufficient balance');
          }
        } else {
          setError(new Error(`Payments in ${service.currency} are not supported.`));
        }
      } catch (txError) {
        // Handle transaction errors without throwing to prevent error boundary
        const errorMessage = txError instanceof Error ? txError.message : String(txError);
        if (errorMessage.includes('insufficient funds') || 
            errorMessage.includes('exceeds balance') ||
            errorMessage.includes('User rejected the request')) {
          setError(new Error('Insufficient balance'));
        } else {
          console.error('Transaction error:', txError);
          setError(new Error('Transaction failed. Please try again.'));
        }
        return;
      }
    } catch (err) {
      console.error('Payment error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(err instanceof Error ? err : new Error('Payment failed'));
      // Only show toast if it's not a duplicate purchase error (handled in checkExistingPurchase)
      if (!errorMessage.includes('already purchased')) {
        toast.error(errorMessage);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Complete Your Booking</h2>
        <div className="mb-4">
          <p><strong>Service:</strong> {service.title}</p>
          <p><strong>Provider:</strong> {service.userName}</p>
          <p><strong>Price:</strong> {service.price} {service.currency}</p>
          <p className="text-sm text-gray-500 break-all"><strong>To:</strong> {service.walletAddress}</p>
        </div>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={isPending || !service.walletAddress || !isSupportedCurrency}>
            {isPending ? 'Processing...' : `Pay ${service.price} ${service.currency}`}
          </Button>
        </div>

        {!isSupportedCurrency && (
          <div className="mt-4 text-yellow-600">
            <p>Payments in {service.currency} are not yet supported. Only ETH and USDC are accepted.</p>
          </div>
        )}

        {hash && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
            <p className="text-green-700 dark:text-green-300">
              Transaction submitted!{' '}
              <a 
                href={`https://basescan.org/tx/${hash}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="underline hover:text-green-800 dark:hover:text-green-200"
              >
                View on Basescan
              </a>
            </p>
            {isProcessing && (
              <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                Processing your purchase...
              </p>
            )}
          </div>
        )}
        {errorMessage && errorMessage.trim() !== '' && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
            <p className="text-red-700 dark:text-red-300">
              {errorMessage.includes('Insufficient balance') || 
               errorMessage.includes('insufficient funds') ||
               errorMessage.includes('exceeds balance')
                ? 'Insufficient balance. Please ensure you have enough funds.'
                : errorMessage.includes('User rejected the request')
                ? 'Transaction was cancelled.'
                : `Error: ${errorMessage}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
