'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMiniApp } from '@neynar/react';
import CreateServiceForm from '~/components/CreateServiceForm';

export default function NewServicePage() {
  const { context, isSDKLoaded } = useMiniApp();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // If not authenticated, redirect to home page
    if (isSDKLoaded && !context?.user?.fid) {
      router.push('/');
    }
  }, [isSDKLoaded, context, router]);

  // Show loading state while checking authentication
  if (!isSDKLoaded || !isClient) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Create a New Service</h1>
      <CreateServiceForm />
    </div>
  );
}
