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
  const [myServices, setMyServices] = useState<Service[]>([]);
  const [otherServices, setOtherServices] = useState<Service[]>([]);
  
  const [filteredMyServices, setFilteredMyServices] = useState<Service[]>([]);
  const [filteredOtherServices, setFilteredOtherServices] = useState<Service[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { data: session, status } = useSession();
  const user = session?.user;
  const userLoading = status === 'loading';
  const router = useRouter();

  const fetchServices = useCallback(async () => {
    if (status === 'unauthenticated' || status === 'authenticated') {
      setIsLoading(true);
      setError(null);
      try {
        const allServices = await getServices();
        const sortedServices = [...allServices].sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );

        if (session?.user?.fid) {
          const userFidStr = session.user.fid.toString();
          setMyServices(sortedServices.filter(s => s.fid.toString() === userFidStr));
          setOtherServices(sortedServices.filter(s => s.fid.toString() !== userFidStr));
        } else {
          setMyServices([]);
          setOtherServices(sortedServices);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
        setError(err instanceof Error ? err.message : 'Failed to load services.');
      } finally {
        setIsLoading(false);
      }
    }
  }, [status, session?.user?.fid]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    const filterFn = (service: Service) => 
      service.title.toLowerCase().includes(query) ||
      service.description.toLowerCase().includes(query) ||
      service.tags?.some(tag => tag.toLowerCase().includes(query));

    if (!query) {
      setFilteredMyServices(myServices);
      setFilteredOtherServices(otherServices);
    } else {
      setFilteredMyServices(myServices.filter(filterFn));
      setFilteredOtherServices(otherServices.filter(filterFn));
    }
  }, [searchQuery, myServices, otherServices]);

  const handleCreateNew = () => {
    router.push('/services/new');
  };
  
  const handleStatusChange = () => {
    fetchServices(); // Re-fetch services when a status changes (e.g., deactivation)
  };

  if (isLoading || userLoading) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
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
        <Button onClick={fetchServices}>Try Again</Button>
      </div>
    );
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const noServicesExist = myServices.length === 0 && otherServices.length === 0;
  const noSearchResults = filteredMyServices.length === 0 && filteredOtherServices.length === 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Services</h1>
        <div className="w-full md:w-auto flex items-center gap-4">
            <div className="relative flex-1 md:max-w-md">
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
            {user && (
                <Button onClick={handleCreateNew}>
                    Create Service
                </Button>
            )}
        </div>
      </div>

      {noSearchResults ? (
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
            {searchQuery ? 'No matching services found' : 'No services available'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? 'Try a different search term.' : 'Why not be the first to create one?'}
          </p>
          {!searchQuery && user && (
            <div className="mt-6">
              <Button onClick={handleCreateNew}>
                Create a Service
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-12">
            {filteredOtherServices.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse All Services</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredOtherServices.map((service) => (
                            <ServiceCard 
                                key={service.id} 
                                service={service} 
                                currentUser={user || null}
                            />
                        ))}
                    </div>
                </div>
            )}
            
            {filteredMyServices.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Services</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMyServices.map((service) => (
                            <ServiceCard 
                                key={service.id} 
                                service={service} 
                                currentUser={user || null}
                                showActions={true}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
}
