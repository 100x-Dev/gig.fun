import { notFound } from 'next/navigation';
import { createClient } from '~/lib/supabase/server';
import { Button } from '~/components/ui/Button';
import Link from 'next/link';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  fid: string;
  created_at: string;
  status: string;
  seller_username?: string;
  seller_pfp?: string;
}

export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  
  // Fetch the service data
  const { data: service, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !service) {
    notFound();
  }

  // Format the creation date
  const formattedDate = new Date(service.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                {service.seller_pfp && (
                  <img 
                    src={service.seller_pfp} 
                    alt={service.seller_username || 'Seller'}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    {service.title}
                  </h1>
                  {service.seller_username && (
                    <p className="text-gray-600 dark:text-gray-300">
                      By @{service.seller_username}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="prose dark:prose-invert max-w-none mb-6">
                <p className="whitespace-pre-line">{service.description}</p>
              </div>
              
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {service.currency} {service.price.toFixed(2)}
                </div>
                <Button asChild>
                  <Link href={`/purchase/${service.id}`}>
                    Purchase Now
                  </Link>
                </Button>
              </div>
              
              <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                <p>Posted on {formattedDate}</p>
                {service.status === 'inactive' && (
                  <p className="text-red-500 mt-2">This service is currently inactive</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
