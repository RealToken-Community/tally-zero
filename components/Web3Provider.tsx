"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { gnosis, mainnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// walletConnect nécessite le paquet @walletconnect/ethereum-provider (peer optionnel).
// injected() couvre MetaMask, Rabby, navigateurs avec window.ethereum.

function createWagmiConfig() {
  return createConfig({
    chains: [gnosis, mainnet],
    connectors: [injected()],
    transports: {
      [gnosis.id]: http(),
      [mainnet.id]: http(),
    },
  });
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  // Une nouvelle config à chaque rendu réinitialise Wagmi (connecteurs vides / pas de bouton).
  const config = useMemo(() => createWagmiConfig(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>{children}</WagmiProvider>
    </QueryClientProvider>
  );
}
