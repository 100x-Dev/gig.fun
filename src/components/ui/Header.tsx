"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { APP_NAME } from "~/lib/constants";
import sdk from "@farcaster/frame-sdk";
import { useMiniApp } from "@neynar/react";
import { Button } from "./Button";

type NeynarUser = {
  score: number;
} | null;

type HeaderProps = {
  neynarUser?: NeynarUser;
};

export function Header({ neynarUser }: HeaderProps) {
  const { context } = useMiniApp();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    }

    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserDropdownOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="mt-4 mb-4 mx-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-between border-[3px] border-double border-primary">
        <div className="flex-1 flex items-center space-x-4">
          <Link href="/" className="text-lg font-light hover:underline">
            {APP_NAME}
          </Link>
          <nav className="hidden md:flex items-center space-x-4">
            <Link 
              href="/services" 
              className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400"
              onClick={() => setIsUserDropdownOpen(false)}
            >
              Browse Services
            </Link>
            {context?.user && (
              <Link 
                href="/services/new"
                onClick={() => setIsUserDropdownOpen(false)}
              >
                <Button size="sm" variant="outline">
                  Create Service
                </Button>
              </Link>
            )}
          </nav>
        </div>
        
        {context?.user ? (
          <div 
            className="cursor-pointer relative"
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
          >
            {context.user.pfpUrl && (
              <img 
                src={context.user.pfpUrl} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border-2 border-primary hover:opacity-80 transition-opacity"
              />
            )}
            
            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {context.user.displayName || context.user.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      @{context.user.username}
                    </p>
                  </div>
                  <a
                    href={`https://warpcast.com/${context.user.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View on Warpcast
                  </a>
                  {neynarUser && (
                    <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
                      Neynar Score: {neynarUser.score}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link href="/signin">
            <Button size="sm">Sign In</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
