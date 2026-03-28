/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ["placehold.co", "www.tally.xyz", "raw.githubusercontent.com"],
  },
  webpack: (config) => {
    // Alias "false" désactive le bundling de certains paquets côté client.
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@coinbase/wallet-sdk": false,
      "@walletconnect/ethereum-provider": false,
      "@metamask/sdk": false,
      "@safe-global/safe-apps-sdk": false,
      "@safe-global/safe-apps-provider": false,
      "@base-org/account": false,
    };
    return config;
  },
};

import withBundleAnalyzer from "@next/bundle-analyzer";

export default process.env.ANALYZE === "true"
  ? withBundleAnalyzer(nextConfig)
  : nextConfig;
