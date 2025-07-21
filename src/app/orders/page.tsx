'use client';

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '~/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '~/components/ui/Dialog';
import { Textarea } from '~/components/ui/Textarea';
import { Loader2, MessageSquare } from 'lucide-react';
import Link from 'next/link';

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
};

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'purchased' | 'ordered'>('purchased');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [isNoteSaving, setIsNoteSaving] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isFarcasterInitialized, setIsFarcasterInitialized] = useState(false);

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
        const transformedData = data.map((order: any) => ({
          ...order,
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
          }
        })) as Order[];
        
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

  const handleStatusChange = async (newStatus: Order['status']) => {
    if (!selectedOrder) return;
    
    try {
      setIsStatusUpdating(true);
      const response = await fetch(`/api/orders/${selectedOrder.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      // Refresh orders to show the updated status
      const updatedOrders = orders.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, status: newStatus }
          : order
      ) as Order[];
      setOrders(updatedOrders);
    } catch (err) {
      console.error('Error updating status:', err);
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
                              setSelectedOrder(order);
                              handleStatusChange(e.target.value as Order['status']);
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
                <div className="mt-5 flex items-center justify-between text-sm">
                  <span className="text-black">
                    Ordered on {new Date(order.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex space-x-3 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const recipientFid = view === 'purchased' ? order.seller_fid : order.buyer_fid;
                        const defaultMessage = `Hi, I'm messaging about the order for "${order.service.title}" (Order ID: ${order.id.slice(0, 8)}...)`;
                        const encodedMessage = encodeURIComponent(defaultMessage);
                        window.open(`https://farcaster.xyz/~/inbox/create/${recipientFid}?text=${encodedMessage}`, '_blank');
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message on Farcaster
                    </Button>
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
    </div>
    </div>
  );
}
