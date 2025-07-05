'use client';

import { useEffect } from 'react';

export function FarcasterFrameInitializer() {
  useEffect(() => {
    // This will only run on the client side
    import('@farcaster/frame-sdk').then(({ sdk }) => {
      sdk.actions.ready();
      console.log('Farcaster SDK initialized');
    }).catch(error => {
      console.error('Failed to initialize Farcaster SDK:', error);
    });
  }, []);

  return null; // This component doesn't render anything
}
