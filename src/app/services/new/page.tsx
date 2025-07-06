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
    <div className="container mx-auto pt-1 pb-4 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-4 text-[var(--primary)]">Create a New Gig</h1>
      <CreateServiceForm />
    </div>
  );
}
