'use client';

import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export default function Demo() {
  useEffect(() => {
    // Call ready when the component mounts
    sdk.actions.ready().catch(console.error);
  }, []);

  return (
    <div className="demo-container">
      {/* Your component content goes here */}
    </div>
  );
}
