'use client';

'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '~/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/Card';
import { Dialog } from '~/components/ui/Dialog';
import { Textarea } from '~/components/ui/Textarea';
import { Label } from '~/components/ui/Label';
import { ExternalLink, ArrowRight, Clock, CheckCircle, AlertCircle, Loader2, MessageSquare, X, Check } from 'lucide-react';
import Link from 'next/link';

type Order = {
  id: string;
  buyer_fid: string;
  seller_fid: string;
  service_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled' | 'disputed';
  created_at: string;
  updated_at: string;
  payment_tx_hash?: string;
  completed_at?: string;
  cancelled_at?: string;
  buyer_notes?: string;
  seller_notes?: string;
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    seller_fid: string;
    seller_username?: string;
    seller_pfp?: string;
  };
};

export default function MyOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [sellerNotes, setSellerNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
      return;
    }

    if (status === 'authenticated' && session?.user?.fid) {
      fetchOrders();
    }
  }, [status, session]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/orders?type=ordered');
      
      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } catch (e) {
            // response is not json, or other error
        }
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      setOrders(data);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load your orders. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'disputed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleManageClick = (order: Order) => {
    setSelectedOrder(order);
    setSellerNotes(order.seller_notes || '');
  };

  const handleUpdateOrder = async (status: 'completed' | 'cancelled') => {
    if (!selectedOrder) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status,
          seller_notes: sellerNotes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order');
      }

      const updatedOrder = await response.json();
      setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      setSelectedOrder(null);
    } catch (err: any) {
      console.error('Error updating order:', err);
      // You might want to show this error to the user
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder) return;

    setIsSavingNotes(true);
    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          seller_notes: sellerNotes 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save notes');
      }

      const updatedOrder = await response.json();
      setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      setSelectedOrder(updatedOrder);
    } catch (err: any) {
      console.error('Error saving notes:', err);
      // You might want to show this error to the user
    } finally {
      setIsSavingNotes(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="mt-4 text-gray-600">Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <div className="text-red-500 mb-4">
          <AlertCircle className="h-12 w-12 mx-auto" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button onClick={fetchOrders}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600">Manage orders for your services</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/services/new">
            Create New Service <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
          <p className="mt-1 text-sm text-gray-500">When someone purchases your service, it will appear here.</p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/services/new">Create a Service</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{order.service.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Ordered on {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-sm">
                    {getStatusIcon(order.status)}
                    <span className="capitalize">{getStatusText(order.status)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="font-medium">
                      {order.currency === 'USDC' || order.currency === 'ETH' 
                        ? `${order.amount} ${order.currency}`
                        : new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: order.currency || 'USD',
                          }).format(order.amount)
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Buyer</p>
                    <p className="font-medium">
                      {`User ${order.buyer_fid}`}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="secondary" className="w-full" onClick={() => handleManageClick(order)}>
                  Manage Order
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}\n
      {selectedOrder && (
        <Dialog
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title="Manage Order"
          footer={
            <div className="flex w-full justify-between items-center">
              <Button
                variant="secondary"
                onClick={handleSaveNotes}
                isLoading={isSavingNotes}
                disabled={isUpdating || isSavingNotes}
              >
                Save Notes
              </Button>
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={() => setSelectedOrder(null)} disabled={isUpdating || isSavingNotes}>
                  Close
                </Button>

                <Button
                  onClick={() => handleUpdateOrder('completed')}
                  isLoading={isUpdating}
                  disabled={isUpdating || isSavingNotes || selectedOrder?.status === 'completed'}
                >
                  Complete Order
                </Button>
              </div>
            </div>
          }
        >
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedOrder.service.title}</h3>
                <p className="text-sm text-gray-500">Buyer: {selectedOrder.buyer_fid}</p>
              </div>
              <div>
                <Label htmlFor="buyer_notes">Buyer's Notes</Label>
                <Textarea id="buyer_notes" value={selectedOrder.buyer_notes || ''} readOnly />
              </div>
              <div>
                <Label htmlFor="seller_notes">Your Notes (for buyer)</Label>
                <Textarea 
                  id="seller_notes" 
                  value={sellerNotes}
                  onChange={(e) => setSellerNotes(e.target.value)}
                  placeholder="Add any notes for the buyer..."
                />
              </div>
            </div>
          )}
        </Dialog>
      )}
    </div>
  );
}
