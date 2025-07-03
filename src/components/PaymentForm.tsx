import { useSendTransaction, useWriteContract } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import { Button } from './ui/Button';
import { Service } from '../types/service';

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
  const { data: ethHash, error: ethError, isPending: isEthPending, sendTransaction } = useSendTransaction();
  const { data: usdcHash, error: usdcError, isPending: isUsdcPending, writeContract } = useWriteContract();

  const isPending = isEthPending || isUsdcPending;
  const hash = ethHash || usdcHash;
  const error = ethError || usdcError;
  const isSupportedCurrency = ['ETH', 'USDC'].includes(service.currency.toUpperCase());

  const handlePayment = () => {
    if (!service.wallet_address) {
      alert('Provider wallet address is not available.');
      return;
    }

    const currency = service.currency.toUpperCase();

    if (currency === 'ETH') {
      sendTransaction({
        to: service.wallet_address as `0x${string}`,
        value: parseEther(service.price.toString()),
        data: '0x',
      });
    } else if (currency === 'USDC') {
      writeContract({
        address: USDC_CONTRACT_ADDRESS,
        abi: USDC_ABI,
        functionName: 'transfer',
        args: [
          service.wallet_address as `0x${string}`,
          parseUnits(service.price.toString(), 6), // USDC has 6 decimals
        ],
      });
    } else {
      alert(`Payments in ${service.currency} are not supported.`);
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
          <p className="text-sm text-gray-500 break-all"><strong>To:</strong> {service.wallet_address}</p>
        </div>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={isPending || !service.wallet_address || !isSupportedCurrency}>
            {isPending ? 'Processing...' : `Pay ${service.price} ${service.currency}`}
          </Button>
        </div>

        {!isSupportedCurrency && (
          <div className="mt-4 text-yellow-600">
            <p>Payments in {service.currency} are not yet supported. Only ETH and USDC are accepted.</p>
          </div>
        )}

        {hash && (
          <div className="mt-4 text-green-600">
            <p>Transaction successful! <a href={`https://basescan.org/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="underline">View on Basescan</a></p>
          </div>
        )}
        {error && (
          <div className="mt-4 text-red-600">
                      <p>
            Error: {error.message.includes('User rejected the request')
              ? 'Transaction failed. Please ensure you have enough USDC for the payment and enough ETH for gas fees.'
              : error.message}
          </p>
          </div>
        )}
      </div>
    </div>
  );
}
