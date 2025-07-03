"use client"

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '~/components/ui/Button';
import ServiceCard from '~/components/ServiceCard';
import { Service } from '~/types/service';
import { getMyServices } from '~/utils/serviceStorage';
import { Plus } from 'lucide-react';

export default function MyGigsPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();

  const fetchServices = useCallback(async () => {
    if (status !== 'authenticated' || !user) {
      setError('You must be logged in to view your gigs');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (!user.fid) {
        throw new Error('Farcaster user ID not found.');
      }
      const userServices = await getMyServices(user.fid);
      setServices(userServices);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(err instanceof Error ? err.message : 'Failed to load your gigs');
    } finally {
      setIsLoading(false);
    }
  }, [status, user]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchServices();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
      setError('Please sign in to view your gigs');
    }
  }, [status, fetchServices]);

  const handleCreateNew = () => {
    router.push('/services/new');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        {!user && (
          <Button onClick={() => router.push('/signin')}>
            Sign In
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Gigs</h1>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create New Gig
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No gigs found</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first gig to get started!</p>
          <div className="mt-6">
            <Button onClick={handleCreateNew} className="flex items-center gap-2 mx-auto">
              <Plus className="h-5 w-5" />
              Create Your First Gig
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard 
              key={service.id} 
              service={service} 
              currentUser={user ? { fid: user.fid } : null} 
              showActions
              onStatusChange={fetchServices}
            />
          ))}
        </div>
      )}
    </div>
  );
}
