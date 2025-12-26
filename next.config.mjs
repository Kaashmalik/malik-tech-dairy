/** @type {import('next').NextConfig} */
const nextConfig = {
    // Basic Next.js configuration
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
        ],
    },
};

import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    runtimeCaching: [
        {
            urlPattern: /^https?.+\/api\/(animals|milk|health)/,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'mtk-api-cache',
                expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24, // 1 day
                },
                networkTimeoutSeconds: 10,
            },
        },
    ],
});

export default withPWA(nextConfig);
