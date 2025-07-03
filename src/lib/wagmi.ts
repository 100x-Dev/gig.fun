import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector';

export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [
    miniAppConnector()
  ]
});

// Export the wallet client for use in other parts of the app
export { createWalletClient, custom } from 'viem';
export { base } from 'wagmi/chains';
