// Note: No webpack alias configuration is required for `@/` path resolution.
// Next.js natively resolves `@/` imports via the `paths` mapping defined in
// `tsconfig.json` (`"@/*": ["./src/*"]`). This is supported out of the box
// in Next.js 13+ (including Next.js 16) without any additional webpack config.

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
}

export default nextConfig
