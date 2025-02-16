import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

// Setup queryClient
const queryClient = new QueryClient();

// Project ID from reown.com
const projectId = 'a079a8259a282c399d3b9ba20cdf72e4';

// Create local Anvil network configuration
const localAnvil = {
  id: 31337,
  name: 'Anvil Local',
  rpcUrls: {
    public: { http: ['http://localhost:8545'] },
    default: { http: ['http://localhost:8545'] },
  },
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  blockExplorers: {
    default: {
      name: 'Local Explorer',
      url: 'http://localhost:8545',
    },
  },
  contracts: {},
  testnet: true,
};

// Metadata object
const metadata = {
  name: 'Intendo-64',
  description: 'Retro-themed Web3 Intent Interface',
  url: window.location.origin,
  icons: ['/icon.png']
};

// Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks: [localAnvil],
  projectId,
  ssr: true,
});

// Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks: [localAnvil],
  projectId,
  metadata,
  features: {
    analytics: true
  }
});

// Custom style overrides can be applied through CSS targeting reown classes

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}