'use client';

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '~/components/ui/Button';
import { CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '~/components/ui/Dialog';
import { Textarea } from '~/components/ui/Textarea';
import { Loader2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useSendTransaction, useWriteContract, useAccount } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
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

// Initialize Farcaster SDK
const initFarcasterSDK = async () => {
  try {
    // After the app is fully loaded and ready to display
    await sdk.actions.ready();
    console.log('Farcaster SDK initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Farcaster SDK:', error);
    return false;
  }
};

type Order = {
  id: string;
  buyer_fid: string;
  seller_fid: string;
  service_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled' | 'disputed' | 'in-progress';
  created_at: string;
  updated_at: string;
  seller_notes?: string;
  final_payment_tx_hash?: string;
  final_payment_date?: string;
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    seller_fid: string;
    seller_username: string;
    seller_pfp: string;
    status?: 'active' | 'inactive';
    wallet_address?: string;
  };
  // The API doesn't return separate buyer/seller objects, so we'll create them from the available data
  buyer?: {
    id: string;
    username: string;
    display_name: string;
    pfp_url: string;
  };
  seller?: {
    id: string;
    username: string;
    display_name: string;
    pfp_url: string;
  };
  payment_type?: 'split';
  final_payment_status?: 'pending' | 'completed';
  final_amount?: number;
};

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { address } = useAccount();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'purchased' | 'ordered'>('purchased');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [isNoteSaving, setIsNoteSaving] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [isFinalPaymentDialogOpen, setIsFinalPaymentDialogOpen] = useState(false);
  const [isFinalPaymentProcessing, setIsFinalPaymentProcessing] = useState(false);
  const [finalPaymentError, setFinalPaymentError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isFarcasterInitialized, setIsFarcasterInitialized] = useState(false);
  
  // ETH Transaction hook
  const { 
    data: ethHash, 
    error: ethError, 
    isPending: isEthPending, 
    sendTransaction 
  } = useSendTransaction();
  
  // USDC Transaction hook
  const { 
    data: usdcHash,
    error: usdcError,
    isPending: isUsdcPending,
    writeContractAsync 
  } = useWriteContract();

  // Initialize Farcaster SDK
  useEffect(() => {
    const initSDK = async () => {
      // Only initialize once when the component mounts
      if (!isFarcasterInitialized) {
        const success = await initFarcasterSDK();
        setIsFarcasterInitialized(success);
        
        if (!success) {
          console.warn('Farcaster SDK initialization failed, app may not display properly in Farcaster clients');
        }
      }
    };
    
    // Call immediately when component mounts
    initSDK();
    
    // Cleanup function
    return () => {
      console.log('Component unmounting, Farcaster SDK state reset');
    };
  }, [isFarcasterInitialized]);

  // Handle ETH transaction completion
  useEffect(() => {
    if (ethHash && selectedOrder) {
      // Transaction was successful, now update the order in the database
      const updateOrderWithHash = async () => {
        try {
          const response = await fetch(`/api/orders/${selectedOrder.id}/final-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ txHash: ethHash }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to process final payment.');
          }

          // Update the order in the local state
          setOrders(orders.map(o => 
            o.id === selectedOrder.id ? { ...o, final_payment_status: 'completed', final_payment_tx_hash: ethHash } : o
          ));

          toast.success('Final payment completed successfully!');
          setIsFinalPaymentDialogOpen(false);
          setSelectedOrder(null);
        } catch (error: any) {
          setFinalPaymentError(error.message);
        } finally {
          setIsFinalPaymentProcessing(false);
        }
      };

      updateOrderWithHash();
    }
  }, [ethHash, selectedOrder, orders]);

  // Handle USDC transaction completion
  useEffect(() => {
    if (usdcHash && selectedOrder) {
      // Transaction was successful, now update the order in the database
      const updateOrderWithHash = async () => {
        try {
          const response = await fetch(`/api/orders/${selectedOrder.id}/final-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ txHash: usdcHash }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to process final payment.');
          }

          // Update the order in the local state
          setOrders(orders.map(o => 
            o.id === selectedOrder.id ? { ...o, final_payment_status: 'completed', final_payment_tx_hash: usdcHash } : o
          ));

          toast.success('Final payment completed successfully!');
          setIsFinalPaymentDialogOpen(false);
          setSelectedOrder(null);
        } catch (error: any) {
          setFinalPaymentError(error.message);
        } finally {
          setIsFinalPaymentProcessing(false);
        }
      };

      updateOrderWithHash();
    }
  }, [usdcHash, selectedOrder, orders]);

  // Fetch orders based on the current view
  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const type = view === 'purchased' ? 'purchased' : 'ordered';
        const response = await fetch(`/api/orders?type=${type}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch orders');
        }
        
        const data = await response.json();
        
        // Transform the data to match our expected structure
        const transformedData = data.map((order: any) => {
          // Normalize status values for UI consistency
          let normalizedStatus = order.status;
          if (normalizedStatus === 'in_progress') {
            normalizedStatus = 'in-progress';
          }
          
          return {
            ...order,
            status: normalizedStatus, // Use the normalized status
            seller_notes: order.seller_notes || '',
            // For purchased view, the seller is from the service
            seller: {
              id: String(order.service?.seller_fid || ''),
              username: order.service?.seller_username || 'Unknown',
              display_name: order.service?.seller_username || 'Unknown',
              pfp_url: order.service?.seller_pfp || ''
            },
            // For ordered view, the buyer is the buyer_fid (we don't have buyer details in the API)
            buyer: {
              id: String(order.buyer_fid),
              username: `User ${String(order.buyer_fid).slice(0, 6)}`,
              display_name: `User ${String(order.buyer_fid).slice(0, 6)}`,
              pfp_url: ''
            },
            // Add wallet address to the service object
            service: {
              ...order.service,
              walletAddress: order.service?.wallet_address || null
            }
          };
        }) as Order[];
        
        setOrders(transformedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err instanceof Error ? err.message : 'Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [status, view]);

  // Message handling now uses Farcaster Direct Casts instead of custom implementation

  const handleSaveNote = async () => {
    if (!selectedOrder || !currentNote.trim()) return;
    
    try {
      setIsNoteSaving(true);
      const response = await fetch(`/api/orders/${selectedOrder.id}/note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note: currentNote }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save note');
      }
      
      // Update the order in the UI
      const updatedOrders = orders.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, seller_notes: currentNote }
          : order
      ) as Order[];
      setOrders(updatedOrders);
      setIsNoteDialogOpen(false);
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setIsNoteSaving(false);
    }
  };

  // Handle blockchain transaction for final payment
  const handleFinalPayment = async () => {
    if (!selectedOrder) return;

    setIsFinalPaymentProcessing(true);
    setFinalPaymentError(null);

    try {
      // Calculate final payment amount
      const finalAmount = selectedOrder.final_amount || selectedOrder.amount / 2;
      
      // For debugging - log the service object
      console.log('Service object:', selectedOrder.service);
      
      // Get wallet address from the service object
      // The field is named wallet_address in the database and API response
      const receiverAddress = selectedOrder.service.wallet_address || '';
      
      if (!receiverAddress) {
        throw new Error('Service provider wallet address is missing');
      }
      
      console.log('Using wallet address:', receiverAddress);

      if (selectedOrder.currency === 'ETH') {
        // Handle ETH payment
        // Ensure wallet address is properly formatted as 0x-prefixed string
        const walletAddress = receiverAddress.startsWith('0x') 
          ? receiverAddress as `0x${string}` 
          : `0x${receiverAddress}` as `0x${string}`;
            
        sendTransaction({
          to: walletAddress,
          value: parseEther(finalAmount.toString()),
        });
        
      } else if (selectedOrder.currency === 'USDC') {
        // Handle USDC payment
        // Ensure wallet address is properly formatted as 0x-prefixed string
        const walletAddress = receiverAddress.startsWith('0x') 
          ? receiverAddress as `0x${string}` 
          : `0x${receiverAddress}` as `0x${string}`;
            
        const amount = parseUnits(finalAmount.toString(), 6);
        await writeContractAsync({
          address: USDC_CONTRACT_ADDRESS,
          abi: USDC_ABI,
          functionName: 'transfer',
          args: [walletAddress, amount],
        });
        
        // We'll let the useEffect handle the API call after transaction is complete
      } else {
        throw new Error(`Unsupported currency: ${selectedOrder.currency}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setFinalPaymentError(errorMessage);
      setIsFinalPaymentProcessing(false);
      
      // Only log unexpected errors to the console
      const isUserRejected = errorMessage.includes('User rejected the request');
      const isInsufficientFunds = errorMessage.toLowerCase().includes('insufficient funds');
      
      if (!isUserRejected && !isInsufficientFunds) {
        console.error('Payment error:', err);
      }
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      // Disable status updating for all orders
      setIsStatusUpdating(true);
      
      // Store the ID of the order being updated
      const currentOrderId = orderId;
      
      // Make the API request
      const response = await fetch(`/api/orders/${currentOrderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to update status: ${errorData.error || 'Unknown error'}`);
      }
      
      // Get the response data
      const responseData = await response.json();
      
      // Create a new orders array with the updated status
      // Make sure we're only updating the specific order that was changed
      const updatedOrders = orders.map(order => {
        if (order.id === currentOrderId) {
          // Normalize status for UI consistency
          let displayStatus = responseData.status;
          if (displayStatus === 'in_progress') {
            displayStatus = 'in-progress';
          }
          
          return { ...order, status: displayStatus };
        }
        return order;
      });
      
      // Update the orders state with the new array
      setOrders(updatedOrders);
    } catch (err) {
      console.error('Error updating status:', err);
      alert(`Error updating status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsStatusUpdating(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/sign-in');
    return null;
  }

  return (
    <div className="bg-[var(--background)] min-h-screen">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl text-[var(--primary)] mb-6 text-center">
          {view === 'purchased' ? 'Gigs Purchased' : 'Gigs Sold'}
        </h1>
      
        {/* Toggle View */}
      <div className="flex mb-8 bg-[var(--card-bg)] rounded-soft shadow-soft p-2 max-w-md mx-auto">
        <button
          onClick={() => setView('purchased')}
          className={`flex-1 py-3 px-4 rounded-soft text-sm font-medium transition-all duration-200 ${
            view === 'purchased'
              ? 'bg-[var(--primary)] text-white shadow-md transform scale-105'
              : 'text-[var(--text-secondary)] hover:bg-[var(--primary-light)] hover:text-white'
          }`}
        >
          Gigs Purchased
        </button>
        <button
          onClick={() => setView('ordered')}
          className={`flex-1 py-3 px-4 rounded-soft text-sm font-medium transition-all duration-200 ${
            view === 'ordered'
              ? 'bg-[var(--primary)] text-white shadow-md transform scale-105'
              : 'text-[var(--text-secondary)] hover:bg-[var(--primary-light)] hover:text-white'
          }`}
        >
          Gigs Sold
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-6 py-4 rounded-soft shadow-soft mb-6 max-w-lg mx-auto">
          <p className="flex items-center">
            <span className="mr-2">⚠️</span>
            {error}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" />
        </div>
      )}

      {/* Orders List */}
      {!loading && orders.length === 0 ? (
        <div className="text-center py-16 bg-[var(--card-bg)] rounded-soft shadow-soft max-w-md mx-auto p-8">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-[var(--text-secondary)] mb-6">
            {view === 'purchased'
              ? "You haven't purchased any gigs yet."
              : "You don't have any orders yet."}
          </p>
          <Button 
            className="mt-4 bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white px-8 py-3 rounded-soft transition-all duration-200" 
            onClick={() => router.push('/services')}
          >
            Browse Services
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden rounded-soft shadow-soft border-0 bg-[var(--card-bg)] transform transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
              <CardHeader className="pb-2 pt-6 px-6">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {order.service.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {view === 'purchased' 
                        ? `Seller: ${order.seller?.display_name || order.seller?.username || 'Unknown Seller'}`
                        : `Buyer: ${order.buyer?.display_name || order.buyer?.username || 'Unknown Buyer'}`}
                    </CardDescription>
                    
                    {/* Seller Note (only for ordered gigs) */}
                    {view === 'ordered' && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[var(--primary)]">Note:</span>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setCurrentNote(order.seller_notes || '');
                              setIsNoteDialogOpen(true);
                            }}
                            className="text-sm text-[var(--primary)] hover:text-[var(--primary-light)] transition-all duration-200"
                          >
                            {order.seller_notes ? 'Edit Note' : 'Add Note'}
                          </button>
                        </div>
                        {order.seller_notes && (
                          <p className="text-sm text-[var(--text-secondary)] mt-1">
                            {order.seller_notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold">
                      {order.service.price} {order.service.currency}
                    </span>
                    <div className="flex flex-col items-end gap-2">
                      <div className="relative">
                        {view === 'ordered' ? (
                          <select
                            value={order.status}
                            onChange={(e) => {
                              handleStatusChange(order.id, e.target.value as Order['status']);
                            }}
                            disabled={isStatusUpdating}
                            className={`appearance-none px-3 py-1 pr-8 rounded-full text-xs font-medium ${
                              order.status === 'completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : order.status === 'cancelled'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            } ${isStatusUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : order.status === 'cancelled'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          }`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('-', ' ')}
                          </span>
                        )}
                        {isStatusUpdating && selectedOrder?.id === order.id && (
                          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2 px-6 pb-6">
                <p className="text-sm text-black line-clamp-2">
                  {order.service.description}
                </p>
                
                {/* Payment Information */}
                {order.payment_type === 'split' && (
                  <div className="mt-4 bg-gray-50 dark:bg-gray-800/30 rounded-md p-3 text-sm">
                    <h4 className="font-medium text-[var(--primary)] mb-2">Payment Information</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Initial Payment:</span>
                        <span className="font-medium">✓ Paid {order.amount/2} {order.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Final Payment:</span>
                        {order.final_payment_status === 'pending' ? (
                          <span className="font-medium text-amber-600 dark:text-amber-400">⏳ Pending {order.final_amount || order.amount/2} {order.currency}</span>
                        ) : (
                          <span className="font-medium">✓ Paid {order.final_amount || order.amount/2} {order.currency}</span>
                        )}
                      </div>
                      {order.final_payment_tx_hash && (
                        <div className="flex justify-between">
                          <span className="text-[var(--text-secondary)]">Transaction:</span>
                          <span className="font-mono text-xs truncate max-w-[180px]" title={order.final_payment_tx_hash}>
                            {order.final_payment_tx_hash.substring(0, 10)}...{order.final_payment_tx_hash.substring(order.final_payment_tx_hash.length - 8)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Total:</span>
                        <span className="font-medium">{order.amount} {order.currency}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-5 flex items-center justify-between text-sm">
                  <span className="text-black">
                    Ordered on {new Date(order.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex space-x-3 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Create a public post message about the order
                        // Get the recipient FID based on the view (purchased or sold)
                        const recipientFid = view === 'purchased' ? order.seller_fid : order.buyer_fid;
                        const defaultMessage = `About our order for "${order.service.title}" (Order ID: ${order.id.slice(0, 8)}...)`;
                        const encodedMessage = encodeURIComponent(defaultMessage);
                        const messageUrl = `https://farcaster.xyz/~/inbox/create/${recipientFid}?text=${encodedMessage}`;
                        
                        try {
                          // Import and use the SDK dynamically - same approach as in ServiceCard
                          import('@farcaster/miniapp-sdk').then(({ sdk }) => {
                            sdk.actions.openUrl(messageUrl);
                          }).catch(err => {
                            console.error('Error importing Farcaster SDK:', err);
                            // Fallback to window.open if SDK import fails
                            window.open(messageUrl, '_blank');
                          });
                        } catch (error) {
                          console.error('Error using Farcaster SDK:', error);
                          // Fallback to window.open
                          window.open(messageUrl, '_blank');
                        }
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Button>

                    {/* Final Payment Button - Only show for buyers when service is in-progress and final payment is pending */}
                    {/* Debug info - check browser console */}
                    {(() => {
                      console.log(`Order ${order.id} debug:`, {
                        view,
                        payment_type: order.payment_type,
                        status: order.status,
                        final_payment_status: order.final_payment_status
                      });
                      return null;
                    })()}
                    {view === 'purchased' && 
                     order.payment_type === 'split' && 
                     order.status === 'completed' && 
                     order.final_payment_status === 'pending' && (
                      <Button
                        size="sm"
                        className="bg-indigo-700 hover:bg-indigo-800 text-white"
                        onClick={() => {
                          setSelectedOrder(order);
                          setFinalPaymentError(null); // Clear previous errors
                          setIsFinalPaymentDialogOpen(true);
                        }}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay Remaining {order.final_amount} {order.currency}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Note Dialog */}
      {selectedOrder && (
        <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a Note to Order</DialogTitle>
              <DialogDescription>
                Add a private note for this order. Only you can see this note.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder="Add your note here..."
                className="min-h-[120px]"
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsNoteDialogOpen(false);
                    setCurrentNote('');
                  }}
                  disabled={isNoteSaving}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveNote}
                  disabled={isNoteSaving || !currentNote.trim()}
                >
                  {isNoteSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Note'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Final Payment Dialog */}
      {selectedOrder && (
        <Dialog open={isFinalPaymentDialogOpen} onOpenChange={setIsFinalPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Your Payment</DialogTitle>
              <DialogDescription>
                You are about to pay the final amount for the service: <strong>{selectedOrder.service.title}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center my-4">
                <p className="text-sm text-gray-500">Final Amount</p>
                <p className="text-3xl font-bold">{selectedOrder.final_amount || selectedOrder.amount/2} {selectedOrder.currency}</p>
              </div>
              
              <div className="space-y-4">
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  <p>Click the button below to complete your final payment for this order.</p>
                </div>
                
                <Button
                  onClick={() => handleFinalPayment()}
                  disabled={isFinalPaymentProcessing || isEthPending || isUsdcPending}
                  className="w-full bg-indigo-700 hover:bg-indigo-800 text-white"
                >
                  {isFinalPaymentProcessing || isEthPending || isUsdcPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isEthPending || isUsdcPending ? 'Waiting for wallet confirmation...' : 'Processing payment...'}
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Complete Final Payment ({selectedOrder.final_amount || selectedOrder.amount/2} {selectedOrder.currency})
                    </>
                  )}
                </Button>
                
                {(ethError || usdcError) && !finalPaymentError && (
                  <p className="text-red-500 text-sm text-center mt-2">
                    {(ethError || usdcError)?.message || 'Transaction failed. Please try again.'}
                  </p>
                )}
              </div>
              
              {finalPaymentError && (
                <p className="text-red-500 text-sm text-center">{finalPaymentError}</p>
              )}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsFinalPaymentDialogOpen(false)}
                  disabled={isFinalPaymentProcessing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
    </div>
  );
}
