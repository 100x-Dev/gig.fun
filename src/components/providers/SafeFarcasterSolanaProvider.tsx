import React, { createContext, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { sdk } from '@farcaster/frame-sdk';

const FarcasterSolanaProvider = dynamic(
  () => import('@farcaster/mini-app-solana').then(mod => mod.FarcasterSolanaProvider),
  { ssr: false }
);

type SafeFarcasterSolanaProviderProps = {
  endpoint: string;
  children: React.ReactNode;
};

const SolanaProviderContext = createContext<{ 
  hasSolanaProvider: boolean;
  isChecking: boolean;
  isSecureContext: boolean;
}>({ 
  hasSolanaProvider: false,
  isChecking: true,
  isSecureContext: false
});

export function SafeFarcasterSolanaProvider({ endpoint, children }: SafeFarcasterSolanaProviderProps) {
  const isClient = typeof window !== "undefined";
  const [hasSolanaProvider, setHasSolanaProvider] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [isSecureContext, setIsSecureContext] = useState<boolean>(false);

  useEffect(() => {
    if (!isClient) return;

    let cancelled = false;
    const isSecure = window.isSecureContext;
    setIsSecureContext(isSecure);

    if (!isSecure) {
      console.warn('Not in a secure context. Some features may be limited.');
      setIsChecking(false);
      return;
    }

    const checkProvider = async () => {
      try {
        // Use a try-catch block to handle any potential errors
        const provider = await sdk.wallet.getSolanaProvider();
        if (!cancelled) {
          setHasSolanaProvider(!!provider);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Error getting Solana provider:', error);
          setHasSolanaProvider(false);
        }
      } finally {
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    };

    // Add a small delay to prevent potential race conditions
    const timeoutId = setTimeout(checkProvider, 100);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [isClient]);

  // Don't render anything during server-side rendering
  if (!isClient) {
    return null;
  }

  // If we're not in a secure context, still render children but with provider context
  if (!isSecureContext) {
    return (
      <SolanaProviderContext.Provider value={{ 
        hasSolanaProvider: false, 
        isChecking: false,
        isSecureContext: false
      }}>
        {children}
      </SolanaProviderContext.Provider>
    );
  }

  // If still checking, show a loading state or null
  if (isChecking) {
    return null;
  }

  return (
    <SolanaProviderContext.Provider value={{ 
      hasSolanaProvider, 
      isChecking: false,
      isSecureContext: true
    }}>
      {hasSolanaProvider ? (
        <FarcasterSolanaProvider endpoint={endpoint}>
          {children}
        </FarcasterSolanaProvider>
      ) : (
        <>{children}</>
      )}
    </SolanaProviderContext.Provider>
  );
}

export function useHasSolanaProvider() {
  const context = React.useContext(SolanaProviderContext);
  if (context === undefined) {
    throw new Error('useHasSolanaProvider must be used within a SafeFarcasterSolanaProvider');
  }
  return context;
}
