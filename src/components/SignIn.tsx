'use client';

import { useMiniApp } from '@neynar/react';
import { signIn, useSession } from 'next-auth/react';
import { CheckCircle2, UserCircle2, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useAccount, useConnect } from 'wagmi';

export default function SignIn() {
  const { context } = useMiniApp();
  const { data: session, status } = useSession();
  const { address: walletAddress, isConnected, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const [error, setError] = useState<string | null>(null);
  
  // Connect to wallet on component mount
  useEffect(() => {
    if (connectors[0]) {
      connect({ connector: connectors[0] });
    }
  }, [connect, connectors]);

  // Log the Farcaster user object when it changes
  useEffect(() => {
    if (context?.user) {
      console.log('Farcaster user object keys:', Object.keys(context.user));
      console.log('Farcaster user object:', {
        fid: context.user.fid,
        username: context.user.username,
        // Log specific wallet-related fields if they exist
        pfpUrl: context.user.pfpUrl,
        // Log any other potentially relevant fields
        _allKeys: Object.keys(context.user)
      });
      console.log('Connected wallet from wagmi:', walletAddress);
    }
  }, [context?.user, walletAddress]);

  useEffect(() => {
    // Early exit if Farcaster context isn't loaded yet.
    if (!context?.user) {
      return;
    }

    const performSignIn = async () => {
      // We have context, now check if we have a user and need to sign in.
      if (status === 'unauthenticated') {
        try {
          console.log('Starting sign-in process...');
          
          // Use the connected wallet address from Wagmi
          const walletAddressToUse = walletAddress;
          console.log('Using connected wallet address:', walletAddressToUse || 'No wallet connected');
          
          const credentials = {
            redirect: false,
            fid: context.user.fid.toString(),
            username: context.user.username || `user-${context.user.fid}`,
            pfpUrl: context.user.pfpUrl || '',
            walletAddress: walletAddressToUse || null
          };
          
          console.log('Signing in with credentials:', {
            ...credentials,
            // Don't log the full pfpUrl as it might be large
            pfpUrl: credentials.pfpUrl ? '***pfp-url***' : null
          });
          
          const result = await signIn('credentials', credentials);

          if (result?.error) {
            console.error('Sign in error:', result.error);
            setError(result.error);
          } else {
            console.log('Sign in successful');
          }
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
          console.error('Error during sign in:', errorMessage, e);
          setError(errorMessage);
        }
      }
    };

    performSignIn();
  }, [context, status, walletAddress]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-2">
        <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center p-2 text-red-500">
        <span className="text-sm">Error</span>
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <div className="flex items-center p-2" title={`Signed in as ${session?.user?.username ?? 'user'}`}>
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      </div>
    );
  }

  return (
    <div className="flex items-center p-2" title="Not signed in">
      <UserCircle2 className="h-5 w-5 text-gray-400" />
    </div>
  );
}
