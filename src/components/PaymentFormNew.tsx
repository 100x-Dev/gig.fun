import { useState, useEffect } from 'react';
import { useSendTransaction, useWriteContract, useAccount } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Label } from './ui/Label';
import { Service } from '../types/service';
import toast from 'react-hot-toast';
import { Badge } from './ui/Badge';
import { InfoIcon } from 'lucide-react';

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

export default function PaymentFormNew({ service, onClose }: PaymentFormProps) {
  const { address } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<Error | null>(null);
  const [buyerNotes, setBuyerNotes] = useState('');

  // Calculate 20% upfront payment amount
  const upfrontPercentage = 0.2; // 20%
  const paymentAmount = service.price * upfrontPercentage;
  const finalAmount = service.price - paymentAmount;

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

  // Combined pending state
  const isPending = isEthPending || isUspcPending || isProcessing;

  // Combined hash state
  const hash = ethHash || usdcHash || txHash;

  // Error message state
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Check if currency is supported
  const isSupportedCurrency = service.currency === 'ETH' || service.currency === 'USDC';

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
      const createPurchase = async () => {
        try {
          setIsProcessing(true);

          // Call API to create purchase record with split payment details
          const response = await fetch('/api/purchases', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              serviceId: service.id,
              txHash: hash,
              buyerNotes,
              amount: service.price, // Total service price
              currency: service.currency,
              paymentType: 'split',
              upfrontAmount: paymentAmount, // 20% upfront payment
              finalAmount: finalAmount, // 80% final payment
              upfrontPaymentStatus: 'completed',
              finalPaymentStatus: 'pending'
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to create purchase record');
          }

          // Purchase created successfully
          toast.success('Purchase completed successfully!');

          // Wait a moment before closing
          setTimeout(() => {
            setIsProcessing(false);
            onClose();
          }, 2000);

        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';

          // Set the error in the local state to display it in the form
          setError(new Error(errorMessage));
          setIsProcessing(false);

          // Only log unexpected errors to the console to avoid cluttering it
          // with expected user errors like "already purchased".
          if (errorMessage !== 'You have already purchased this service') {
            console.error('Error creating purchase:', err);
          }
        }
      };

      createPurchase();
    }
  }, [hash, service.id, service.price, service.currency, buyerNotes, onClose]);

  // Handle payment
  const handlePayment = async () => {
    try {
      setError(null);
      setErrorMessage('');

      if (!service.walletAddress) {
        throw new Error('Service provider wallet address is missing');
      }

      if (service.currency === 'ETH') {
        // Handle ETH payment
        // Ensure wallet address is properly formatted as 0x-prefixed string
        const walletAddress = service.walletAddress?.startsWith('0x')
          ? service.walletAddress as `0x${string}`
          : `0x${service.walletAddress}` as `0x${string}`;

        // Send the full payment amount
        sendTransaction({
          to: walletAddress,
          value: parseEther(paymentAmount.toString()),
        });
      } else if (service.currency === 'USDC') {
        // Handle USDC payment
        const amount = parseUnits(paymentAmount.toString(), 6); // USDC has 6 decimals

        // Ensure wallet address is properly formatted as 0x-prefixed string
        const walletAddress = service.walletAddress?.startsWith('0x')
          ? service.walletAddress as `0x${string}`
          : `0x${service.walletAddress}` as `0x${string}`;

        await writeContractAsync({
          address: USDC_CONTRACT_ADDRESS as `0x${string}`,
          abi: USDC_ABI,
          functionName: 'transfer',
          args: [walletAddress, amount],
        });
      } else {
        throw new Error(`Unsupported currency: ${service.currency}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';

      // Set the error in the local state to display it in the form
      setError(new Error(errorMessage));

      // Only log unexpected errors to the console.
      // We check for common, user-facing errors to avoid cluttering the console.
      const isUserRejected = errorMessage.includes('User rejected the request');
      const isInsufficientFunds = errorMessage.toLowerCase().includes('insufficient funds');

      if (!isUserRejected && !isInsufficientFunds) {
        console.error('Payment error:', err);
      }
    }
  };

  // Modal content
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

      {/* Modal */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-sm">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Complete Your Booking</h2>
          </div>

          {/* Content */}
          <div className="px-6 pt-4 pb-0">
            <p className="font-medium text-lg mb-4">{service.title}</p>

            <div className="mb-2">
              <p className="text-gray-600 mb-2">
                <span className="font-medium">Provider:</span> {service.userName}
              </p>


              <div className="flex flex-col space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">
                    <span className="font-medium">Total Price:</span>
                  </p>
                  <p className="text-gray-600">
                    {service.price} {service.currency}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-600">Upfront Payment (20%):</span>
                    <InfoIcon className="h-4 w-4 ml-1 text-gray-500" />
                  </div>
                  <p className="text-gray-600 font-bold">
                    {paymentAmount.toFixed(2)} {service.currency}
                  </p>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <p>Final Payment (80%):</p>
                  <p>{finalAmount.toFixed(2)} {service.currency}</p>
                </div>
                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                  <p className="text-xs text-blue-700">You'll pay 20% now and the remaining 80% after the service is completed.</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 break-all mb-4">
                <span className="font-medium">To:</span> {service.walletAddress}
              </p>
            </div>

            <div className="mb-6">
              <Label htmlFor="buyer_notes" className="block mb-2">Notes for Seller (Optional)</Label>
              <Textarea
                id="buyer_notes"
                value={buyerNotes}
                onChange={(e) => setBuyerNotes(e.target.value)}
                placeholder="Provide any details the seller might need..."
                className="w-full border border-gray-300 rounded-md p-2"
              />
            </div>

            {/* Status Messages */}
            {!isSupportedCurrency && (
              <div className="mb-2">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-700">
                    Payments in {service.currency} are not yet supported. Only ETH and USDC are accepted.
                  </p>
                </div>
              </div>
            )}

            {hash && (
              <div className="mb-2">
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
                    <p className="mt-2 text-sm text-green-600">
                      Processing your purchase...
                    </p>
                  )}
                </div>
              </div>
            )}

            {errorMessage && errorMessage.trim() !== '' && (
              <div className="mb-2">
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
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 pt-2 pb-4">
            <div className="flex flex-row gap-3 justify-between">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 border border-indigo-700 text-indigo-700 hover:bg-indigo-50 py-2 rounded-md"
              >
                Cancel
              </Button>

              <Button
                onClick={handlePayment}
                disabled={isPending || !service.walletAddress || !isSupportedCurrency}
                className="flex-1 bg-indigo-700 hover:bg-indigo-800 text-white py-2 rounded-md"
              >
                {isPending ? 'Processing...' : `Pay ${paymentAmount.toFixed(2)} ${service.currency} (20%)`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
