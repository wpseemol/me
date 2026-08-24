/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    compress: true,
    images: {
        formats: ["image/avif", "image/webp"],
        remotePatterns: [
            { protocol: "https", hostname: "avatars.githubusercontent.com" },
            { protocol: "https", hostname: "opengraph.githubassets.com" },
        ],
    },
    // These used to live in vercel.json, which cPanel ignores. Keeping them here
    // means Next itself serves the redirects on any host.
    async redirects() {
        return [
            { source: "/home", destination: "/", permanent: true },
            { source: "/work", destination: "/projects", permanent: true },
            { source: "/hire", destination: "/contact", permanent: true },
            { source: "/hire-me", destination: "/contact", permanent: true },
            { source: "/index.html", destination: "/", permanent: true },
        ];
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    { key: "X-Frame-Options", value: "SAMEORIGIN" },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=()",
                    },
                ],
            },
            {
                // Let AI crawlers and Google Images cache the portrait aggressively.
                source: "/images/:path*",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=31536000, immutable",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
