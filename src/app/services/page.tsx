"use client"

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Search, X } from 'lucide-react';
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
  const [filteredServices, setFilteredServices] = useState<Service[]>(initialServices);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const user = session?.user;
  const userLoading = status === 'loading';
  const router = useRouter();
  const [initialLoad, setInitialLoad] = useState(true);

  // Filter services based on search query
  const filterServices = useCallback(() => {
    if (!searchQuery.trim()) {
      return services;
    }
    const query = searchQuery.toLowerCase();
    return services.filter(service => 
      service.title.toLowerCase().includes(query) ||
      service.description.toLowerCase().includes(query) ||
      service.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [searchQuery, services]);

  // Update filtered services when search query or services change
  useEffect(() => {
    setFilteredServices(filterServices());
  }, [filterServices]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Starting service fetch with user:', user?.fid);
        
        // Fetch all services
        const servicesFromUtil = await getServices();
        console.log('Fetched services count:', servicesFromUtil.length);

        // Filter out current user's services if logged in
        let servicesToDisplay = servicesFromUtil;
        if (user?.fid) {
          servicesToDisplay = servicesToDisplay.filter(
            (service: Service) => service.fid.toString() !== user.fid.toString()
          );
          console.log(
            "Filtered services (excluding user's):",
            servicesToDisplay.length
          );
        }

        // Sort by createdAt (newest first)
        const sortedServices = [...servicesToDisplay].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        setServices(sortedServices);
        console.log('Final services count:', sortedServices.length);
        setFilteredServices(sortedServices);

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

  if (isLoading || userLoading) {
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Browse Services</h1>
        <div className="w-full md:w-auto flex-1 md:max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search services..."
              className="pl-10 pr-10 w-full"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {filteredServices.length === 0 ? (
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchQuery ? 'No matching services found' : 'No services found'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? 'Try a different search term' : 'Be the first to create a service!'}
          </p>
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
          {filteredServices.map((service) => (
            <ServiceCard 
              key={service.id} 
              service={service} 
              currentUser={user ? { fid: user.fid } : null} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
