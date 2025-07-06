'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();
  
  return (
    <button 
      onClick={() => router.back()}
      className="inline-flex items-center text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors duration-200"
    >
      <ArrowLeft className="h-4 w-4 mr-1" />
      Back to Gigs
    </button>
  );
}
