import { useState, useEffect } from 'react';
import { useSendTransaction, useWriteContract, useAccount } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import { Button } from './ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

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

interface FinalPaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  order: any; // Replace with proper Order type
  onPaymentComplete: () => void;
}

export default function FinalPaymentForm({ 
  isOpen, 
  onClose, 
  order, 
  onPaymentComplete 
}: FinalPaymentFormProps) {
  const { address } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<Error | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // ETH Transaction
  const { 
    data: ethHash, 
    error: ethError, 
    isPending: isEthPending, 
    sendTransaction 
  } = useSendTransaction();

  // USDC Transaction
  const { 
    data: usdcHash, 
    error: usdcError, 
    isPending: isUspcPending, 
    writeContractAsync 
  } = useWriteContract();

  // Combined pending state
  const isPending = isEthPending || isUspcPending || isProcessing;

  // Combined hash state
  const hash = ethHash || usdcHash || txHash;

  // Check if currency is supported
  const isSupportedCurrency = order.currency === 'ETH' || order.currency === 'USDC';

  // Handle errors
  useEffect(() => {
    if (ethError) {
      setErrorMessage(ethError.message);
    } else if (usdcError) {
      setErrorMessage(usdcError.message);
    } else if (error) {
      setErrorMessage(error.message);
    } else {
      setErrorMessage('');
    }
  }, [ethError, usdcError, error]);

  // Handle successful transaction
  useEffect(() => {
    if (hash) {
      const processFinalPayment = async () => {
        try {
          setIsProcessing(true);
          
          // Call API to record final payment
          const response = await fetch(`/api/orders/${order.id}/final-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              txHash: hash,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to process final payment');
          }

          // Payment processed successfully
          toast.success('Final payment completed successfully!');
          
          // Wait a moment before closing
          setTimeout(() => {
            setIsProcessing(false);
            onClose();
            onPaymentComplete();
          }, 2000);
          
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
          setError(new Error(errorMessage));
          setIsProcessing(false);
          console.error('Error processing final payment:', err);
        }
      };

      processFinalPayment();
    }
  }, [hash, order.id, onClose, onPaymentComplete]);

  // Handle payment
  const handlePayment = async () => {
    try {
      setError(null);
      setErrorMessage('');

      if (!order.service?.walletAddress) {
        throw new Error('Service provider wallet address is missing');
      }

      if (order.currency === 'ETH') {
        // Handle ETH payment
        // Ensure wallet address is properly formatted as 0x-prefixed string
        const walletAddress = order.service.walletAddress?.startsWith('0x') 
          ? order.service.walletAddress as `0x${string}` 
          : `0x${order.service.walletAddress}` as `0x${string}`;
          
        // Send the final amount (80% of total)
        sendTransaction({
          to: walletAddress,
          value: parseEther(order.final_amount.toString()),
        });
      } else if (order.currency === 'USDC') {
        // Handle USDC payment
        const amount = parseUnits(order.final_amount.toString(), 6); // USDC has 6 decimals
        
        // Ensure wallet address is properly formatted as 0x-prefixed string
        const walletAddress = order.service.walletAddress?.startsWith('0x') 
          ? order.service.walletAddress as `0x${string}` 
          : `0x${order.service.walletAddress}` as `0x${string}`;
          
        await writeContractAsync({
          address: USDC_CONTRACT_ADDRESS as `0x${string}`,
          abi: USDC_ABI,
          functionName: 'transfer',
          args: [walletAddress, amount],
        });
      } else {
        throw new Error(`Unsupported currency: ${order.currency}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(new Error(errorMessage));

      const isUserRejected = errorMessage.includes('User rejected the request');
      const isInsufficientFunds = errorMessage.toLowerCase().includes('insufficient funds');

      if (!isUserRejected && !isInsufficientFunds) {
        console.error('Payment error:', err);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Final Payment</DialogTitle>
          <DialogDescription>
            The service has been marked as completed. Please make the final payment to complete the transaction.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-700">
              You've already paid {order.upfront_amount} {order.currency} (20%) upfront. 
              The remaining amount to pay is {order.final_amount} {order.currency} (80%).
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Service:</span>
              <span>{order.service?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Provider:</span>
              <span>{order.service?.seller_username}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Final Payment:</span>
              <span className="font-bold">{order.final_amount} {order.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">To Address:</span>
              <span className="text-xs truncate max-w-[200px]">{order.service?.walletAddress}</span>
            </div>
          </div>
          
          {/* Status Messages */}
          {!isSupportedCurrency && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-700">
                Payments in {order.currency} are not yet supported. Only ETH and USDC are accepted.
              </p>
            </div>
          )}
          
          {hash && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700">
                Transaction submitted!{' '}
                <a 
                  href={`https://basescan.org/tx/${hash}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-indigo-700 underline"
                >
                  View on Basescan
                </a>
              </p>
              {isProcessing && (
                <p className="mt-2 text-sm text-green-600 flex items-center">
                  <Loader2 className="animate-spin h-3 w-3 mr-2" />
                  Processing your payment...
                </p>
              )}
            </div>
          )}
          
          {errorMessage && errorMessage.trim() !== '' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">
                {errorMessage.toLowerCase().includes('insufficient funds') ||
                 errorMessage.toLowerCase().includes('insufficient balance') ||
                 errorMessage.toLowerCase().includes('exceeds balance')
                  ? 'Insufficient balance. Please ensure you have enough funds.'
                  : errorMessage.includes('User rejected the request')
                  ? 'Transaction was cancelled.'
                  : `Error: ${errorMessage}`}
              </p>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isPending}
            >
              Cancel
            </Button>
            
            <Button 
              onClick={handlePayment} 
              disabled={isPending || !order.service?.walletAddress || !isSupportedCurrency}
              className="bg-indigo-700 hover:bg-indigo-800 text-white"
            >
              {isPending ? 'Processing...' : `Pay ${order.final_amount} ${order.currency}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
