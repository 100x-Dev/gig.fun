'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '~/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '~/components/ui/Dialog';
import { Textarea } from '~/components/ui/Textarea';
import { Label } from '~/components/ui/Label';
import { ExternalLink, Loader2, MessageSquare } from 'lucide-react';
import Link from 'next/link';

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
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [isNoteSaving, setIsNoteSaving] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

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

  const handleSendMessage = async () => {
    if (!selectedOrder || !message.trim()) return;
    
    try {
      setIsSending(true);
      // Implement your message sending logic here
      console.log('Sending message:', { orderId: selectedOrder.id, message });
      // Close the dialog and reset the form
      setIsDialogOpen(false);
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {view === 'purchased' ? 'Gigs Purchased' : 'Gigs Ordered'}
      </h1>
      
      {/* Toggle View */}
      <div className="flex mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setView('purchased')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
            view === 'purchased'
              ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Gigs Purchased
        </button>
        <button
          onClick={() => setView('ordered')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
            view === 'ordered'
              ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Gigs Ordered
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Orders List */}
      {!loading && orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {view === 'purchased'
              ? "You haven't purchased any gigs yet."
              : "You don't have any orders yet."}
          </p>
          <Button className="mt-4" onClick={() => router.push('/services')}>
            Browse Services
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-2">
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
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Note:</span>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setCurrentNote(order.seller_notes || '');
                              setIsNoteDialogOpen(true);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            {order.seller_notes ? 'Edit Note' : 'Add Note'}
                          </button>
                        </div>
                        {order.seller_notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
              <CardContent className="pt-2">
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  {order.service.description}
                </p>
                <div className="mt-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    Ordered on {new Date(order.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsDialogOpen(true);
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/services/${order.service_id}`}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Service
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Message Dialog */}
      {selectedOrder && (
        <>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Message {view === 'purchased' ? 'Seller' : 'Buyer'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="message">Your Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Type your message to ${
                      view === 'purchased' 
                        ? selectedOrder.seller?.display_name || selectedOrder.seller?.username || 'the seller'
                        : selectedOrder.buyer?.display_name || selectedOrder.buyer?.username || 'the buyer'
                    }...`}
                    className="mt-1"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isSending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={isSending || !message.trim()}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Note Dialog */}
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
        </>
      )}
    </div>
  );
}
