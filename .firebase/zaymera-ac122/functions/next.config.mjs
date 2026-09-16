// next.config.mjs
var nextConfig = {
  reactStrictMode: true,
  compress: true,
  devIndicators: false,
  experimental: {
    optimizePackageImports: ["lucide-react"]
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  }
};
var next_config_default = nextConfig;
export {
  next_config_default as default
};
