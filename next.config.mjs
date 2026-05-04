/** @type {import("next").NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sysdoc.vercel.app",
        pathname: "/_next/image",
      },
    ],
  },
};

export default nextConfig;
