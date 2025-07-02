'use client';

import { useMiniApp } from '@neynar/react';
import { signIn, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function SignIn() {
  const { context } = useMiniApp();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Early exit if Farcaster context isn't loaded yet.
    if (!context) {
      return;
    }

    const performSignIn = async () => {
      // We have context, now check if we have a user and need to sign in.
      if (context.user && status === 'unauthenticated') {
        try {
          const result = await signIn('credentials', {
            redirect: false,
            fid: context.user.fid,
            username: context.user.username || `user-${context.user.fid}`,
            pfpUrl: context.user.pfpUrl || '',
          });

          if (result?.error) {
            setError(result.error);
          }
        } catch (e) {
          setError('An unexpected error occurred during sign-in.');
        }
      }
    };

    performSignIn();
  }, [status, context]);

  if (status === 'loading') {
    return <div>Loading session...</div>;
  }

  if (error) {
    return <div>Sign-in failed: {error}</div>;
  }

  if (status === 'authenticated') {
    // Safely access username
    return <div>Signed in as {session?.user?.username ?? 'user'}</div>;
  }

  return <div>Please connect to Farcaster to sign in.</div>;
}
