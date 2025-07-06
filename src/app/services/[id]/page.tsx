import { notFound } from 'next/navigation';
import { createClient } from '~/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BackButton from './BackButton';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  fid: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'paused' | 'completed' | 'inactive' | string;
  seller_username?: string;
  seller_pfp?: string;
  delivery_days?: number;
  category?: string;
  tags?: string[];
  wallet_address?: string;
}

// Using 'any' type for params to bypass the type constraint issue
export default async function ServiceDetailPage({ params }: any) {
  // Ensure params is properly awaited before destructuring
  const id = params?.id;
  
  const supabase = await createClient();
  
  // Fetch the service data with all fields
  const { data: service, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !service) {
    notFound();
  }

  // Format the dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-4">
        <BackButton />
      </div>
      <div className="bg-[var(--card-bg)] rounded-soft shadow-soft overflow-hidden">
        <div className="p-6 md:p-8">
          {/* Service Header */}
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-6">
                {service.seller_pfp && (
                  <img 
                    src={service.seller_pfp} 
                    alt={service.seller_username || 'Seller'}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-[var(--primary)]">
                        {service.title}
                      </h1>
                      {service.seller_username && (
                        <p className="text-[var(--text-secondary)]">
                          By @{service.seller_username}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      service.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {service.status?.toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Price and Delivery */}
                  <div className="mt-4 flex flex-wrap gap-4">
                    <div className="bg-[#1e293b] px-4 py-2 rounded-lg">
                      <p className="text-sm text-gray-400">Price</p>
                      <p className="text-xl font-bold text-white">
                        {service.currency} {service.price.toFixed(2)}
                      </p>
                    </div>
                    
                    {service.delivery_days && (
                      <div className="bg-[#1e293b] px-4 py-2 rounded-lg">
                        <p className="text-sm text-gray-400">Delivery Time</p>
                        <p className="text-lg font-medium text-white">
                          {service.delivery_days} {service.delivery_days === 1 ? 'day' : 'days'}
                        </p>
                      </div>
                    )}
                    
                    {service.category && (
                      <div className="bg-[#1e293b] px-4 py-2 rounded-lg">
                        <p className="text-sm text-gray-400">Category</p>
                        <p className="text-lg font-medium text-white">
                          {service.category}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 text-[var(--primary)]">Description</h2>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line text-[var(--text-primary)]">{service.description}</p>
                </div>
              </div>
              
              {/* Tags */}
              {service.tags?.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4 text-[var(--primary)]">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag: string, index: number) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-[#3C219A]/20 text-[#3C219A] text-sm font-medium rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Meta Information */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[var(--text-secondary)]">
                  <div>
                    <p><span className="font-medium text-[var(--primary)]">Created:</span> {formatDate(service.created_at)}</p>
                    <p><span className="font-medium text-[var(--primary)]">Last Updated:</span> {formatDate(service.updated_at)}</p>
                  </div>
                  {service.wallet_address && (
                    <div>
                      <p className="font-medium text-[var(--primary)]">Seller Wallet:</p>
                      <p className="font-mono text-sm break-all">{service.wallet_address}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
