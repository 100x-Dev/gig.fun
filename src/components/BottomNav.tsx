'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag, User, MessageSquare } from 'lucide-react';
import { useCallback } from 'react';

export default function BottomNav() {
  const pathname = usePathname();
  
  // Function to open Farcaster direct messages
  const openFarcasterMessages = useCallback(() => {
    // For iOS compatibility, we'll use the Warpcast app scheme directly
    // This is more reliable for opening the inbox on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Try different approaches based on platform
    if (isIOS) {
      // For iOS, try direct deep linking first
      try {
        // Try to open the Warpcast app directly using the app scheme
        window.location.href = 'warpcast://messages';
        
        // Set a timeout to check if the app was opened
        // If not, fall back to the web URL
        setTimeout(() => {
          // If we're still here after 500ms, the app probably didn't open
          // Try the SDK approach as a fallback
          import('@farcaster/miniapp-sdk').then(({ sdk }) => {
            sdk.actions.openUrl('https://warpcast.com/~/messages');
          }).catch(() => {
            // Last resort: open in browser
            window.open('https://warpcast.com/~/messages', '_blank');
          });
        }, 500);
      } catch (error) {
        console.error('Error with iOS deep linking:', error);
        // Fall back to browser
        window.open('https://warpcast.com/~/messages', '_blank');
      }
    } else {
      // For non-iOS platforms, use the SDK approach that works on desktop/Android
      try {
        import('@farcaster/miniapp-sdk').then(({ sdk }) => {
          sdk.actions.openUrl('https://farcaster.xyz/~/inbox');
        }).catch(err => {
          console.error('Error importing Farcaster SDK:', err);
          window.open('https://farcaster.xyz/~/inbox', '_blank');
        });
      } catch (error) {
        console.error('Error using Farcaster SDK:', error);
        window.open('https://farcaster.xyz/~/inbox', '_blank');
      }
    }
  }, []);
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        <Link 
          href="/" 
          className={`flex flex-col items-center justify-center p-2 rounded-lg ${pathname === '/' ? 'text-[var(--primary)] dark:text-[var(--primary-light)]' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link 
          href="/services" 
          className={`flex flex-col items-center justify-center p-2 ${pathname.startsWith('/services') && !pathname.startsWith('/paid-gigs') ? 'text-[var(--primary)] dark:text-[var(--primary-light)]' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
        >
          <Search className="h-5 w-5" />
          <span className="text-xs mt-1">Browse</span>
        </Link>
        <Link 
          href="/orders" 
          className={`flex flex-col items-center justify-center p-2 ${pathname.startsWith('/orders') ? 'text-[var(--primary)] dark:text-[var(--primary-light)]' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="text-xs mt-1">Orders</span>
        </Link>
        <Link 
          href="/profile" 
          className={`flex flex-col items-center justify-center p-2 ${pathname.startsWith('/profile') ? 'text-[var(--primary)] dark:text-[var(--primary-light)]' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
        >
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
        {/* Messages button temporarily disabled */}
        <div 
          className={`flex flex-col items-center justify-center p-2 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50`}
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-xs mt-1">Messages</span>
        </div>
      </div>
    </nav>
  );
}
