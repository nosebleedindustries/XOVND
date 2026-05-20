/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow large videos in /public to stream.
  experimental: {
    largePageDataBytes: 256 * 1000,
  },
};

export default nextConfig;
