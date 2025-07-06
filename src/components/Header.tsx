'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png" // Use your logo file name here
            alt="gig.fun logo"
            width={120}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>
        
        <div className="flex items-center space-x-4">
          {!pathname.includes('/sign-in') && (
            <Link 
              href="/services/new" 
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-light)] rounded-md transition-colors"
            >
              Create Gig
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
