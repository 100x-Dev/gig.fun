'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '~/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/Card';
import { ExternalLink, ArrowRight, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

type Purchase = {
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

export default function PaidGigsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
      return;
    }

    if (status === 'authenticated' && session?.user?.fid) {
      fetchPurchases();
    }
  }, [status, session]);

  const fetchPurchases = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/purchases');
      
      if (!response.ok) {
        throw new Error('Failed to fetch purchases');
      }
      
      const data = await response.json();
      setPurchases(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching purchases:', err);
      setError('Failed to load your purchases. Please try again later.');
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

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="mt-4 text-gray-600">Loading your purchases...</p>
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
        <Button onClick={fetchPurchases}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gigs Purchased</h1>
          <p className="text-gray-600">Track your purchased services and their status</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/services">
            Browse Services <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {purchases.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No purchases yet</h3>
          <p className="mt-1 text-sm text-gray-500">Services you purchase will appear here.</p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/services">Browse Services</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <Card key={purchase.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{purchase.service.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Purchased on {new Date(purchase.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-sm">
                    {getStatusIcon(purchase.status)}
                    <span className="capitalize">{getStatusText(purchase.status)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Amount Paid</p>
                    <p className="font-medium">
                      {purchase.currency === 'USDC' || purchase.currency === 'ETH' 
                        ? `${purchase.amount} ${purchase.currency}`
                        : new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: purchase.currency || 'USD',
                          }).format(purchase.amount)
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Seller</p>
                    <p className="font-medium">
                      {purchase.service.seller_username 
                        ? `@${purchase.service.seller_username}` 
                        : `User ${purchase.service.seller_fid}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
