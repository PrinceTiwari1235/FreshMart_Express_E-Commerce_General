import type { NextConfig } from "next";

// Configure static export for GitHub Pages.
const nextConfig: NextConfig = {
  output: "export",
  images: {
    // Disable next/image optimization so export works without an image CDN.
    unoptimized: true,
  },
};

export default nextConfig;
