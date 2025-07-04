'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag, User, Package } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        <Link 
          href="/" 
          className={`flex flex-col items-center justify-center p-2 rounded-lg ${pathname === '/' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link 
          href="/services" 
          className={`flex flex-col items-center justify-center p-2 ${pathname.startsWith('/services') && !pathname.startsWith('/paid-gigs') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
        >
          <Search className="h-5 w-5" />
          <span className="text-xs mt-1">Browse</span>
        </Link>
        <Link 
          href="/gigs-purchased" 
          className={`flex flex-col items-center justify-center p-2 ${pathname.startsWith('/gigs-purchased') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="text-xs mt-1">Gigs Purchased</span>
        </Link>
        <Link 
          href="/my-orders" 
          className={`flex flex-col items-center justify-center p-2 ${pathname.startsWith('/my-orders') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
        >
          <Package className="h-5 w-5" />
          <span className="text-xs mt-1">My Orders</span>
        </Link>
        <Link 
          href="/profile" 
          className={`flex flex-col items-center justify-center p-2 ${pathname.startsWith('/profile') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
        >
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
