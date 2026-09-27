/** @type {import('next').NextConfig} */
const nextConfig = {
    // Emit a folder of plain .html/.css/.js files — no Node server needed.
    // Client-side routing still ships in the JS bundle, so links between pages
    // are soft navigations (no full reload), exactly like a normal Next app.
    output: "export",
    reactStrictMode: true,
    poweredByHeader: false,
    // redirects() and headers() are server features and are ignored by
    // `output: export`. They now live in public_html/.htaccess instead.
    compress: true,
    images: {
        // No server = no on-demand image optimizer. Images are served as-is.
        unoptimized: true,
        remotePatterns: [
            { protocol: "https", hostname: "avatars.githubusercontent.com" },
            { protocol: "https", hostname: "opengraph.githubassets.com" },
        ],
    },
};

export default nextConfig;
