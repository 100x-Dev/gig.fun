"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMiniApp } from '@neynar/react';
import { Button } from '~/components/ui/Button';
import ServiceCard from '~/components/ServiceCard';
import { Service } from '~/types/service';
import { getServices } from '~/utils/serviceStorage';
import { supabase } from '~/lib/supabase/client';

// Define MiniApp user type
interface MiniAppUser {
  fid: number;
  // Add other user properties as needed
}

// Extend MiniAppContextType
interface MiniAppContextType {
  user: MiniAppUser | null;
  // Add other context properties as needed
}

interface ServicesPageProps {
  initialServices?: Service[];
}

interface ServicesPageProps {
  initialServices?: Service[];
}

export default function ServicesPage({ initialServices = [] }: ServicesPageProps) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useMiniApp();
  const router = useRouter();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Starting service fetch with user:', user?.fid);
        
        // First fetch public services
        const publicServices = await getServices();
        console.log('Fetched public services count:', publicServices?.length);
        console.log('Public services:', publicServices);

        // If user is authenticated, fetch their services
        if (user?.fid) {
          console.log('Fetching user services for FID:', user.fid);
          const { data: userServices, error: userError } = await supabase
            .from('services')
            .select('*')
            .eq('fid', user.fid)
            .order('created_at', { ascending: false });

          if (userError) {
            console.error('Error fetching user services:', userError);
          } else if (userServices) {
            console.log('Fetched user services count:', userServices.length);
            // Combine both sets of services
            const combined = [...publicServices, ...(userServices || [])];
            console.log('Combined services count:', combined.length);
            // Remove duplicates and sort by created_at
            const uniqueServices = Array.from(new Map(combined.map(service => [service.id, service])).values());
            uniqueServices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            console.log('Final services count:', uniqueServices.length);
            setServices(uniqueServices);
          }
        } else {
          console.log('No user FID, using only public services');
          setServices(publicServices);
        }

      } catch (err) {
        console.error('Error fetching services:', err);
        setError(err instanceof Error ? err.message : 'Failed to load services. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, [user?.fid]); // Remove initialLoad dependency to fetch on mount

  const handleCreateNew = () => {
    router.push('/services/new');
  };

  if (isLoading) {
    return null; // Don't show anything while loading
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
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Browse Services</h1>
        {user && (
          <Button onClick={handleCreateNew}>
            Create New Service
          </Button>
        )}
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">No services found</h3>
          <p className="mt-1 text-sm text-gray-500">Be the first to create a service!</p>
          {user && (
            <div className="mt-6">
              <Button onClick={handleCreateNew}>
                Create Service
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}
