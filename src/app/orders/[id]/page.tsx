import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { format } from 'date-fns';

type Order = {
  id: string;
  created_at: string;
  updated_at: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled' | 'disputed';
  payment_tx_hash: string | null;
  buyer_notes: string | null;
  seller_notes: string | null;
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    seller: {
      fid: string;
      username: string;
      display_name: string;
      pfp_url: string;
    };
  };
  buyer: {
    fid: string;
    username: string;
    display_name: string;
    pfp_url: string;
  };
};

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return redirect('/sign-in?redirect=/orders/' + params.id);
  }

  // Fetch the order
  const { data: order, error } = await supabase
    .from('purchases')
    .select(`
      *,
      service:services(*, seller:profiles(*)),
      buyer:profiles!purchases_buyer_fid_fkey(*)
    `)
    .eq('id', params.id)
    .single();

  if (error || !order) {
    console.error('Error fetching order:', error);
    return notFound();
  }

  // Check if the current user is the seller or buyer
  const isSeller = order.seller_fid === session.user.user_metadata?.fid;
  const isBuyer = order.buyer_fid === session.user.user_metadata?.fid;

  if (!isSeller && !isBuyer) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Access Denied</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                You don't have permission to view this order.
              </p>
              <div className="mt-4">
                <Link
                  href="/my-orders"
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  &larr; Back to My Orders
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">Completed</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">Cancelled</span>;
      case 'disputed':
        return <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">Disputed</span>;
      default:
        return <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">Pending</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/my-orders" className="text-indigo-600 hover:text-indigo-900 text-sm font-medium inline-flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Orders
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Order #{order.id.substring(0, 8)}</h1>
          <div className="mt-2">
            {getStatusBadge(order.status)}
            <span className="ml-2 text-sm text-gray-500">
              Placed on {format(new Date(order.created_at), 'MMMM d, yyyy')}
            </span>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Order Details</h2>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="md:flex md:items-start md:justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{order.service.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{order.service.description}</p>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Price</h4>
                  <p className="mt-1 text-lg font-medium text-gray-900">
                    {order.amount} {order.currency.toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="mt-6 md:mt-0 md:ml-6">
                <h4 className="text-sm font-medium text-gray-900">
                  {isSeller ? 'Buyer' : 'Seller'}
                </h4>
                <div className="mt-2 flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                    {isSeller ? (
                      <img src={order.buyer.pfp_url} alt={order.buyer.display_name} className="h-full w-full object-cover" />
                    ) : (
                      <img src={order.service.seller.pfp_url} alt={order.service.seller.display_name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {isSeller ? order.buyer.display_name : order.service.seller.display_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      @{isSeller ? order.buyer.username : order.service.seller.username}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {order.payment_tx_hash && (
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900">Payment</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Transaction: <span className="font-mono text-xs bg-gray-100 p-1 rounded">{order.payment_tx_hash}</span>
                </p>
              </div>
            )}

            {order.buyer_notes && (
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900">Buyer Notes</h4>
                <p className="mt-1 text-sm text-gray-600">{order.buyer_notes}</p>
              </div>
            )}

            {isSeller && order.status === 'pending' && (
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Order Actions</h4>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Mark as Completed
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Message Buyer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
